
"use server";

import slugify from 'slugify';
import { getDb } from '@/lib/mongo';
import { serializeMongo } from '@/lib/serialize';
import type { Book, BookCategory, BookContent, Chapter, Article, ContentBlock, NewBookData, LinkableArticle, BookWithStats, SeriesGroup, VolumeInfo } from '@/types';
import { GENRES, CATEGORIES, SUB_CATEGORIES, type Genre, type Category, type SubCategory } from '@/types/genre.types';
import { migrateArticle, findChapterRecursive, findArticleRecursive as findArticleRecursiveUtil } from './service-utils';
import { getSeriesData, updateSeries } from './series.service';
import { isSuperAdmin } from './user.service';

// Firestore Integration: Centralized collection names
const BOOKS_COLLECTION = 'books';
const BOOK_CONTENT_COLLECTION = 'book_content';
const BOOK_CATEGORIES_COLLECTION = 'book_categories';

// Firestore Integration: Helper function to migrate and process chapters.
function migrateAndProcessChapters(chapters: Chapter[]): Chapter[] {
    return chapters.map(chapter => ({
        ...chapter,
        articles: chapter.articles ? chapter.articles.map(migrateArticle) : [],
        children: chapter.children ? migrateAndProcessChapters(chapter.children) : [],
    }));
}


// --- Book Category Functions (Mongo) ---
export async function getBookCategories(): Promise<BookCategory[]> {
    const db = await getDb();
    const count = await db.collection(BOOK_CATEGORIES_COLLECTION).countDocuments();
    if (count === 0) {
        const defaultCategories: BookCategory[] = [
            { id: 'itihasa', name: 'Itihasa (इतिहास)', genreId: 'purana' },
            { id: 'purana', name: 'Purana (पुराण)', genreId: 'purana' },
            { id: 'smriti', name: 'Smriti (स्मृति)', genreId: 'shastra' },
            { id: 'shruti', name: 'Shruti (श्रुति)', genreId: 'veda' },
        ];
        if (defaultCategories.length) await db.collection(BOOK_CATEGORIES_COLLECTION).insertMany(defaultCategories as any[]);
        return defaultCategories;
    }
    const cats = await db.collection<BookCategory>(BOOK_CATEGORIES_COLLECTION).find({}).toArray();
    return serializeMongo(cats) as BookCategory[];
}

export async function addCategoryToGenre(genreId: string, name: string): Promise<BookCategory> {
    const db = await getDb();
    const newCategory: BookCategory = {
        id: slugify(name, { lower: true, strict: true }),
        name: name,
        genreId: genreId,
    } as any;
    const exists = await db.collection(BOOK_CATEGORIES_COLLECTION).findOne({ id: newCategory.id });
    if (exists) throw new Error('A category with this name already exists in this genre.');
    await db.collection(BOOK_CATEGORIES_COLLECTION).insertOne(newCategory as any);
    return newCategory;
}


// --- Book Functions (Mongo) ---
export async function getBooks(): Promise<Book[]> {
    const db = await getDb();
    const list = await db.collection<Book>(BOOKS_COLLECTION).find({}).toArray();
    return serializeMongo(list) as Book[];
}

// Fetch book content from Mongo
export async function getBookData(bookId: string): Promise<BookContent | null> {
    const db = await getDb();
    let data: any = await db.collection(BOOK_CONTENT_COLLECTION).findOne({ bookId });
    if (!data) data = await db.collection(BOOK_CONTENT_COLLECTION).findOne({ id: bookId });
    if (!data) return null;
    data = serializeMongo(data);
    data.chapters = data.chapters ? migrateAndProcessChapters(data.chapters) : [];
    return data as BookContent;
}

// Combine basic book and content from Mongo
export async function getBookContent(bookId: string): Promise<BookContent | null> {
    const db = await getDb();
    const bookDoc = await db.collection<Book>(BOOKS_COLLECTION).findOne({ id: bookId });
    if (!bookDoc) return null;
    const bookData = serializeMongo(bookDoc) as Book;

    // Specific categorization fix retained
    if (bookData.id === 'bhagavdgeeta') {
        const correctGenreId = 'itihasa-purana';
        const correctCategoryId = 'itihasa';
        const correctSubCategoryId = 'mahabharata-itihasa';
        const needsFix = (
            bookData.genreId !== correctGenreId ||
            bookData.categoryId !== correctCategoryId ||
            (bookData as any).subCategoryId !== correctSubCategoryId
        );
        if (needsFix) {
            await db.collection(BOOKS_COLLECTION).updateOne(
                { id: bookId },
                { $set: { genreId: correctGenreId, categoryId: correctCategoryId, subCategoryId: correctSubCategoryId } }
            );
            // mirror to content as well
            await db.collection(BOOK_CONTENT_COLLECTION).updateOne(
                { bookId: bookId },
                { $set: { genreId: correctGenreId, categoryId: correctCategoryId, subCategoryId: correctSubCategoryId } },
                { upsert: false }
            );
            // refresh local copy
            Object.assign(bookData, { genreId: correctGenreId, categoryId: correctCategoryId, subCategoryId: correctSubCategoryId } as any);
        }
    }

    const content = await getBookData(bookId);
    if (!content) {
        const newContent: BookContent = {
            ...bookData as any,
            chapters: [],
            structure: { sourceTypes: [], commentaryTypes: [] },
            bookId: bookData.id,
            bookName: bookData.name,
            subtitle: '',
            description: '',
            shortDescription: '',
            publisher: '',
            isbn: '',
            designer: '',
            subject: 'shastra-samhita',
            visibility: 'private',
            circleIds: [],
            isAnnounced: false,
        };
        await writeBookContent(bookId, newContent);
        return newContent;
    }

    return {
        ...bookData,
        ...content,
        bookId: bookData.id,
        bookName: bookData.name,
    } as BookContent;
}


export async function getBook(bookId: string): Promise<BookContent | undefined> {
    const content = await getBookContent(bookId);
    return content || undefined;
}

export async function getBooksWithStats(): Promise<BookWithStats[]> {
    const books = await getBooks();
    // This is a simplified version. A real implementation would aggregate stats.
    return books.map(book => ({
        ...book,
        rating: 4.5, // Mock data
        views: 1200, // Mock data
    }));
}

export interface HierarchicalSubCategory extends SubCategory {
    bookCount: number;
}
export interface HierarchicalCategory extends Category {
    subCategories: HierarchicalSubCategory[];
    bookCount: number;
}
export interface HierarchicalGenre extends Genre {
    categories: HierarchicalCategory[];
    bookCount: number;
}

export async function getFullBookHierarchy(): Promise<HierarchicalGenre[]> {
    const books = await getBooks();

    const subCategoryMap = new Map<string, HierarchicalSubCategory>();
    SUB_CATEGORIES.forEach(sc => subCategoryMap.set(sc.id, { ...sc, bookCount: 0 }));

    const categoryMap = new Map<string, HierarchicalCategory>();
    CATEGORIES.forEach(c => categoryMap.set(c.id, { ...c, subCategories: [], bookCount: 0 }));

    const genreMap = new Map<string, HierarchicalGenre>();
    GENRES.forEach(g => genreMap.set(g.id, { ...g, categories: [], bookCount: 0 }));
    
    // Count books
    books.forEach(book => {
        const subCategoryId = (book as any).subCategoryId;
        if (subCategoryId && subCategoryMap.has(subCategoryId)) {
            subCategoryMap.get(subCategoryId)!.bookCount++;
        }
        if (book.categoryId && categoryMap.has(book.categoryId)) {
            categoryMap.get(book.categoryId)!.bookCount++;
        }
        if (book.genreId && genreMap.has(book.genreId)) {
            genreMap.get(book.genreId)!.bookCount++;
        }
    });
    
    // Assemble hierarchy
    subCategoryMap.forEach(sc => {
        if (categoryMap.has(sc.categoryId)) {
            categoryMap.get(sc.categoryId)!.subCategories.push(sc);
        }
    });
    
    categoryMap.forEach(c => {
        if (genreMap.has(c.genreId)) {
            genreMap.get(c.genreId)!.categories.push(c);
        }
    });

    return Array.from(genreMap.values());
}


export async function getBooksGroupedByGenre(): Promise<GroupedBookByGenre[]> {
    const books = await getBooks();
    const seriesData = await getSeriesData();

    const groupedResult: GroupedBookByGenre[] = GENRES.map(genre => ({
        genre,
        series: [],
        standaloneBooks: [],
    }));

    const seriesMap: Record<string, SeriesGroup> = {};

    books.forEach(book => {
        if (book.volumeInfo?.seriesName) {
            const { seriesName } = book.volumeInfo;
            if (!seriesMap[seriesName]) {
                const seriesInfo = seriesData.find(s => s.name === seriesName);
                seriesMap[seriesName] = { seriesName, description: seriesInfo?.description || '', volumes: [], genreId: book.genreId };
            }
            seriesMap[seriesName].volumes.push(book);
            seriesMap[seriesName].volumes.sort((a,b) => (a.volumeInfo?.volumeNumber || 0) - (b.volumeInfo?.volumeNumber || 0));
        } else {
             const genreGroup = groupedResult.find(g => g.genre.id === book.genreId);
             if(genreGroup) {
                genreGroup.standaloneBooks.push(book);
             } else {
                const uncategorizedGroup = groupedResult.find(g => g.genre.id === 'uncategorized');
                uncategorizedGroup?.standaloneBooks.push(book);
             }
        }
    });
    
    Object.values(seriesMap).forEach(seriesGroup => {
        const genreGroup = groupedResult.find(g => g.genre.id === seriesGroup.genreId);
        if (genreGroup) {
            genreGroup.series.push(seriesGroup);
        }
    });

    return groupedResult;
}

// Firestore Integration: Writes to both 'books' and 'book_content' collections.
export async function addBook(data: NewBookData): Promise<Book> {
    let bookId = slugify(data.name, { lower: true, strict: true });
    if (!bookId) bookId = `book-${Date.now()}`;
    const db = await getDb();
    const exists = await db.collection(BOOKS_COLLECTION).findOne({ id: bookId });
    if (exists) throw new Error("A book with this name/ID already exists.");

    const newBook: Book = {
        id: bookId,
        name: data.name,
        genreId: data.genreId,
        categoryId: data.categoryId,
        visibility: 'private',
        isAnnounced: false,
        coverUrl: data.coverUrl,
        profileUrl: data.profileUrl || data.coverUrl,
        ...(data.volumeInfo ? { volumeInfo: data.volumeInfo } : {}),
        ownerId: data.ownerId,
        organizationId: data.organizationId,
        organizationName: data.organizationName,
        structureType: data.structureType || 'regular',
    } as any;

    const newBookContent: BookContent = {
        bookId: newBook.id,
        bookName: newBook.name,
        genreId: newBook.genreId,
        categoryId: newBook.categoryId,
        subtitle: data.subtitle || '',
        description: data.description || '',
        shortDescription: data.shortDescription || '',
        authorName: data.authorName,
        publishedAt: data.publishedAt ? new Date(data.publishedAt).getTime() : undefined,
        coverUrl: newBook.coverUrl || '',
        profileUrl: newBook.profileUrl || '',
        publisher: data.publisher || '',
        isbn: data.isbn || '',
        designer: data.designer || '',
        subject: data.subject || 'shastra-samhita',
        chapters: [],
        structure: {
            sourceTypes: data.sourceTypes && data.sourceTypes.length > 0 ? data.sourceTypes : ['shloka'],
            commentaryTypes: data.commentaryTypes && data.commentaryTypes.length > 0 ? data.commentaryTypes : ['bhashya'],
        },
        visibility: 'private',
        circleIds: [],
        isAnnounced: false,
        ...(data.volumeInfo ? { volumeInfo: data.volumeInfo } : {}),
        ownerId: data.ownerId,
        organizationId: data.organizationId,
        organizationName: data.organizationName,
        structureType: data.structureType || 'regular',
    } as any;

    await db.collection(BOOKS_COLLECTION).insertOne(newBook as any);
    await db.collection(BOOK_CONTENT_COLLECTION).insertOne(newBookContent as any);

    if (data.volumeInfo) {
        await updateSeries(data.volumeInfo.seriesName, {});
    }

    return newBook as Book;
}

// Firestore Integration: Updates both 'books' and 'book_content' collections.
export async function updateBook(bookId: string, data: Partial<NewBookData>): Promise<void> {
    const db = await getDb();
    const contentUpdate: Record<string, any> = { ...data };
    if (data.name) contentUpdate.bookName = data.name;
    if (data.volumeInfo === undefined) contentUpdate.volumeInfo = null;
    await db.collection(BOOKS_COLLECTION).updateOne({ id: bookId }, { $set: data as any });
    await db.collection(BOOK_CONTENT_COLLECTION).updateOne({ bookId }, { $set: contentUpdate }, { upsert: true });
    if (data.volumeInfo) await updateSeries(data.volumeInfo.seriesName, {});
}


// Firestore Integration: Deletes from both 'books' and 'book_content' collections.
export async function deleteBookFromDataService(bookId: string): Promise<void> {
    const db = await getDb();
    await db.collection(BOOKS_COLLECTION).deleteOne({ id: bookId });
    await db.collection(BOOK_CONTENT_COLLECTION).deleteOne({ bookId });
}

// Firestore Integration: Writes to the specific book's document in the 'book_content' collection.
export async function writeBookContent(bookId: string, content: BookContent): Promise<void> {
    const db = await getDb();
    await db.collection(BOOK_CONTENT_COLLECTION).updateOne({ bookId }, { $set: content as any }, { upsert: true });
}


export async function addChapter(bookId: string, chapterName: string, topic: string | undefined, parentId?: string | number): Promise<Chapter> {
    const content = await getBookContent(bookId);
    if (!content) throw new Error("Book content not found");

    const newChapter: Chapter = {
        id: slugify(chapterName, { lower: true, strict: true }) || `chapter-${Date.now()}`,
        name: chapterName,
        topic: topic || undefined,
        articles: [],
        children: [],
    };

    if (parentId) {
        const parentChapter = await findChapterRecursive(content.chapters, parentId);
        if (!parentChapter) throw new Error('Parent chapter not found.');
        if (!parentChapter.children) parentChapter.children = [];
        if (parentChapter.children.some(c => c.id === newChapter.id)) throw new Error('A sub-chapter with this name already exists in this parent.');
        parentChapter.children.push(newChapter);
    } else {
        if (content.chapters.some(c => c.id === newChapter.id)) throw new Error('A chapter with this name already exists at the top level.');
        content.chapters.push(newChapter);
    }

    await writeBookContent(bookId, content);
    return newChapter;
}

export async function deleteChapter(bookId: string, chapterId: string | number): Promise<void> {
    const content = await getBookContent(bookId);
    if (!content) throw new Error("Book content not found");
    
    async function removeChapterFromTree(chapters: Chapter[], chapterIdToRemove: string | number): Promise<Chapter[]> {
        const filteredChapters = chapters.filter(c => String(c.id) !== String(chapterIdToRemove));
        if (filteredChapters.length < chapters.length) {
            return filteredChapters;
        }
        
        return await Promise.all(chapters.map(async (chapter) => {
            if (chapter.children && chapter.children.length > 0) {
                return { ...chapter, children: await removeChapterFromTree(chapter.children, chapterIdToRemove) };
            }
            return chapter;
        }));
    }

    content.chapters = await removeChapterFromTree(content.chapters, chapterId);
    await writeBookContent(bookId, content);
}


export async function addArticle(bookId: string, chapterId: string | number, articleData: { verse: string; title: string; content: ContentBlock[]; tags?: string[] }): Promise<Article> {
    const content = await getBookContent(bookId);
    if (!content) throw new Error("Book content not found");

    const chapter = await findChapterRecursive(content.chapters, chapterId);
    if (!chapter) throw new Error('Chapter not found.');

    if (chapter.articles.some(a => String(a.verse) === String(articleData.verse))) {
        throw new Error('An article with this verse number already exists in this chapter.');
    }

    const newArticle: Article = {
        verse: articleData.verse,
        title: articleData.title,
        content: articleData.content,
        tags: articleData.tags || [],
        status: 'draft',
        author: { id: 'user1', name: 'Admin User', avatarUrl: "/media/_cce41b04-07a0-4c49-bd66-7d2b4a59f1a7.jpg" },
        createdAt: Date.now(),
        updatedAt: Date.now(),
        feedback: { likes: 0, dislikes: 0, insightful: 0, uplifting: 0, views: 0, scores: Array.from({ length: 10 }, (_, i) => ({ value: i + 1, count: 0 })) },
        comments: [],
    };

    chapter.articles.push(newArticle);
    chapter.articles.sort((a,b) => String(a.verse).localeCompare(String(b.verse), undefined, {numeric: true}));

    await writeBookContent(bookId, content);
    return newArticle;
}

export async function updateArticle(bookId: string, chapterId: string | number, verse: string | number, articleData: { title: string; content: ContentBlock[]; tags?: string[] }): Promise<Article> {
    const content = await getBookContent(bookId);
    if (!content) throw new Error("Book content not found");
    const chapter = await findChapterRecursive(content.chapters, chapterId);

    if (!chapter) throw new Error('Chapter not found.');

    const articleIndex = chapter.articles.findIndex(a => String(a.verse) === String(verse));
    if (articleIndex === -1) throw new Error('Article not found to update.');

    const updatedArticle: Article = {
        ...chapter.articles[articleIndex],
        title: articleData.title,
        content: articleData.content,
        tags: articleData.tags || [],
        updatedAt: Date.now(),
    };

    chapter.articles[articleIndex] = updatedArticle;
    await writeBookContent(bookId, content);
    return updatedArticle;
}

export async function deleteArticle(bookId: string, chapterId: string | number, verse: string | number): Promise<void> {
    const content = await getBookContent(bookId);
    if (!content) throw new Error("Book content not found");
    const chapter = await findChapterRecursive(content.chapters, chapterId);
    if (!chapter) throw new Error('Chapter not found.');

    const initialArticleCount = chapter.articles.length;
    chapter.articles = chapter.articles.filter(a => String(a.verse) !== String(verse));
    
    if (chapter.articles.length === initialArticleCount) throw new Error('Article not found to delete.');

    await writeBookContent(bookId, content);
}

export async function updateArticleStatus(bookId: string, chapterId: string | number, verse: string | number, newStatus: 'draft' | 'published') {
    const content = await getBookContent(bookId);
    if (!content) throw new Error("Book content not found");
    const chapter = await findChapterRecursive(content.chapters, chapterId);
    if (!chapter) throw new Error('Chapter not found.');

    const article = chapter.articles.find(a => String(a.verse) === String(verse));
    if (!article) throw new Error('Article not found.');

    article.status = newStatus;
    await writeBookContent(bookId, content);
}

export async function updateBookChapters(bookId: string, newChapters: Chapter[]): Promise<void> {
    const content = await getBookContent(bookId);
    if (!content) throw new Error("Book content not found");
    content.chapters = newChapters;
    await writeBookContent(bookId, content);
}

export async function setBookVisibility(bookId: string, visibility: 'private' | 'circle' | 'public', circleIds?: string[]): Promise<void> {
    const content = await getBookContent(bookId);
    if (!content) throw new Error("Book content not found");
    content.visibility = visibility;
    if (visibility === 'circle' && circleIds) {
        content.circleIds = circleIds;
    } else {
        content.circleIds = [];
    }
    await writeBookContent(bookId, content);
}

export async function setBookVolumeInfo(bookId: string, volumeInfo: VolumeInfo): Promise<void> {
    const content = await getBookContent(bookId);
    if (!content) throw new Error("Book content not found");
    content.volumeInfo = volumeInfo;
    await writeBookContent(bookId, content);
}

export async function announceWork(type: 'book' | 'standalone-article' | 'book-article', id: string): Promise<void> {
    if (type === 'book') {
        const content = await getBookContent(id);
        if (!content) return;
        content.isAnnounced = true;
        await writeBookContent(id, content);
    }
}

// --- Getter Functions for UI ---

export async function getArticle(bookId: string, chapterId: string, verse: string): Promise<{ book: BookContent, chapter: Chapter, article: Article } | null> {
    const content = await getBookContent(bookId);
    if (!content) return null;
    
    const findResult = await findArticleRecursiveUtil(content.chapters, chapterId, verse);
    if (!findResult) return null;
    
    return { book: content, ...findResult };
}

export async function getArticleWithContext(bookId: string, chapterId: string, verse: string): Promise<{ book: BookContent; chapter: Chapter; article: Article; prevArticle: Article | null; nextArticle: Article | null; } | null> {
    const content = await getBookContent(bookId);
    if (!content) return null;
    
    const findResult = await findArticleRecursiveUtil(content.chapters, chapterId, verse);
    if (!findResult) return null;

    const { chapter, article } = findResult;

    const publishedArticles = chapter.articles
        .filter(a => a.status === 'published')
        .sort((a,b) => String(a.verse).localeCompare(String(b.verse), undefined, {numeric: true}));
        
    const currentIndex = publishedArticles.findIndex(a => slugify(String(a.verse), { lower: true, strict: true }) === slugify(String(verse), { lower: true, strict: true }));
    
    const prevArticle = currentIndex > 0 ? publishedArticles[currentIndex - 1] : null;
    const nextArticle = currentIndex > -1 && currentIndex < publishedArticles.length - 1 ? publishedArticles[currentIndex + 1] : null;
    
    if (article.status !== 'published' && process.env.NODE_ENV === 'production') {
        return null;
    }
    
    if (!article.feedback) {
        article.feedback = { likes: 0, dislikes: 0, insightful: 0, uplifting: 0, views: 0, scores: [] };
    }
    article.feedback.views = (article.feedback.views || 0) + 1;
    await writeBookContent(bookId, content);
    
    return { book: content, chapter, article, prevArticle, nextArticle };
}


export async function searchLinkableArticles(query: string): Promise<LinkableArticle[]> {
    if (!query) return [];

    const books = await getBooks();
    const allLinkableArticles: LinkableArticle[] = [];
    const lowerCaseQuery = query.toLowerCase();

    for (const book of books) {
        try {
            const content = await getBookData(book.id);
            if (!content || !content.chapters) continue;

            const traverseChapters = (chapters: Chapter[], bookName: string, chapterPrefix = '') => {
                for (const chapter of chapters) {
                    const currentChapterName = chapterPrefix ? `${chapterPrefix} > ${chapter.name}` : chapter.name;
                    
                    if (chapter.articles) {
                        for (const article of chapter.articles) {
                            if (article.status !== 'published') continue;
                            
                            const articleLabel = `${bookName}: ${currentChapterName} - ${article.title}`;
                            if (articleLabel.toLowerCase().includes(lowerCaseQuery)) {
                                allLinkableArticles.push({
                                    id: `${book.id}-${chapter.id}-${article.verse}`,
                                    url: `/articles/${book.id}/${chapter.id}/${article.verse}`,
                                    label: articleLabel
                                });
                            }
                        }
                    }

                    if (chapter.children) {
                        traverseChapters(chapter.children, bookName, currentChapterName);
                    }
                }
            };
            
            traverseChapters(content.chapters, content.bookName);
        } catch (error) {
            console.error(`Could not load corpus for book ${book.name}`, error);
        }
    }

    return allLinkableArticles.slice(0, 20); // Limit results
}

    
