

'use server';

import { z } from 'zod';
import { 
    addBook, 
    addChapter, 
    addArticle as addArticleInDataService,
    updateArticle as updateArticleInDataService,
    updateArticleStatus as updateStatus, 
    addCategoryToGenre,
    deleteChapter as deleteChapterData,
    deleteArticle as deleteArticleData,
    updateBookChapters,
    deleteBookFromDataService,
    setBookVolumeInfo,
    setBookVisibility,
    updateBook as updateBookInDataService,
    getBook,
} from '@/services/book.service';
import { saveThemeForBook } from '@/services/theme.service';
import { updateSeries } from '@/services/series.service';
import { getUserProfile, addNotification } from '@/services/user.service';
import { revalidatePath } from 'next/cache';
import slugify from 'slugify';
import { ContentBlockSchema, type VolumeInfo, type BookTheme } from '@/types';
import { cloneContentForSuperAdmin } from '@/services/super-admin.service';

const CategorySchema = z.object({
    genreId: z.string().min(1, 'Genre is required.'),
    name: z.string().min(1, 'Category name is required.'),
});

const BookSchema = z.object({
    name: z.string().min(1, 'Book name is required.'),
    genreId: z.string().min(1, 'Genre is required.'),
    categoryId: z.string().min(1, 'Category is required.'),
    subtitle: z.string().optional(),
    description: z.string().optional(),
    shortDescription: z.string().optional(),
    authorName: z.string().optional(),
    publishedAt: z.string().optional(),
    coverUrl: z.string().optional(),
    profileUrl: z.string().optional(),
    publisher: z.string().optional(),
    isbn: z.string().optional(),
    designer: z.string().optional(),
    subject: z.string().optional(),
    sourceTypes: z.array(z.string()).optional(),
    commentaryTypes: z.array(z.string()).optional(),
    volumeSeriesName: z.string().optional(),
    volumeNumber: z.coerce.number().optional(),
    organizationId: z.string().optional(),
    organizationName: z.string().optional(),
});

const UpdateBookSchema = BookSchema.extend({
    bookId: z.string().min(1, 'Book ID is required.'),
});

const ChapterSchema = z.object({
    bookId: z.string(),
    name: z.string().min(1, 'Chapter name is required.'),
    topic: z.string().optional(),
    parentId: z.string().optional(),
});

const ArticleSchema = z.object({
    bookId: z.string(),
    chapterId: z.string(),
    verse: z.string().min(1, 'Verse number/ID is required.'),
    title: z.string().min(1, 'Title is required.'),
    content: z.string().min(3, 'Article content cannot be empty.'), // JSON string
    tags: z.string().optional(),
});

const UpdateArticleSchema = z.object({
    bookId: z.string(),
    chapterId: z.string(),
    verse: z.string(),
    title: z.string().min(1, 'Title is required.'),
    content: z.string().min(3, 'Article content cannot be empty.'), // JSON string
    tags: z.string().optional(),
});

const UpdateStatusSchema = z.object({
    bookId: z.string(),
    chapterId: z.string(),
    verse: z.string(),
    newStatus: z.enum(['draft', 'published']),
});

const DeleteChapterSchema = z.object({
    bookId: z.string(),
    chapterId: z.string(),
});

const DeleteArticleSchema = z.object({
    bookId: z.string(),
    chapterId: z.string(),
    verse: z.string(),
});

const DeleteBookSchema = z.object({
    bookId: z.string().min(0, 'Book ID is required').optional().or(z.literal('')),
});

const ReorderContentSchema = z.object({
    bookId: z.string(),
    chapters: z.any(), // Using any for simplicity due to recursive nature
});

const UpdateBookVisibilitySchema = z.object({
    bookId: z.string(),
    visibility: z.enum(['private', 'circle', 'public']),
    circleIds: z.array(z.string()).optional(),
});

const UpdateSeriesDescriptionSchema = z.object({
    seriesName: z.string().min(1, "Series name is required."),
    description: z.string().min(1, "Description is required."),
});

const SaveThemeSchema = z.object({
  bookId: z.string(),
  themeData: z.string(),
});

const ToggleAnnouncementSchema = z.object({
    bookId: z.string(),
    isAnnounced: z.enum(['true', 'false']),
});

// Helper function to remove undefined properties from an object
function cleanUndefined(obj: any) {
    const newObj: any = {};
    for (const key in obj) {
        if (obj[key] !== undefined) {
            newObj[key] = obj[key];
        }
    }
    return newObj;
}


async function handleFormSubmission(validatedFields: any, action: Function, revalidate?: string) {
    if (!validatedFields.success) {
        return {
            error: "Validation failed",
            fieldErrors: validatedFields.error.flatten().fieldErrors,
        };
    }
    try {
        await action(validatedFields.data);
        if (revalidate) {
            revalidatePath(revalidate);
        }
        return { success: true };
    } catch (error: any) {
        return { error: error.message };
    }
}

export async function createBookCategory(prevState: any, formData: FormData) {
    const validatedFields = CategorySchema.safeParse({ 
        genreId: formData.get('genreId'),
        name: formData.get('name'),
    });
    return handleFormSubmission(validatedFields, async (data) => addCategoryToGenre(data.genreId, data.name), '/admin/books');
}

export async function createBook(prevState: any, formData: FormData) {
    const rawVolumeNumber = formData.get('volumeNumber');

    const validatedFields = BookSchema.safeParse({
      name: formData.get('name') || undefined,
      genreId: formData.get('genreId') || undefined,
      categoryId: formData.get('categoryId') || undefined,
      subtitle: formData.get('subtitle') || undefined,
      description: formData.get('description') || undefined,
      shortDescription: formData.get('shortDescription') || undefined,
      authorName: formData.get('authorName') || undefined,
      publishedAt: formData.get('publishedAt') || undefined,
      coverUrl: formData.get('coverUrl') || undefined,
      profileUrl: formData.get('profileUrl') || undefined,
      publisher: formData.get('publisher') || undefined,
      isbn: formData.get('isbn') || undefined,
      designer: formData.get('designer') || undefined,
      subject: formData.get('subject') || undefined,
      sourceTypes: formData.getAll('sourceTypes'),
      commentaryTypes: formData.getAll('commentaryTypes'),
      volumeSeriesName: formData.get('volumeSeriesName') || undefined,
      volumeNumber: rawVolumeNumber === null || rawVolumeNumber === '' ? undefined : Number(rawVolumeNumber),
      organizationId: formData.get('organizationId') || undefined,
      organizationName: formData.get('organizationName') || undefined,
    });
    
    if (!validatedFields.success) {
        return {
            error: "Validation failed",
            fieldErrors: validatedFields.error.flatten().fieldErrors,
        };
    }
    
    try {
        const userProfile = await getUserProfile();
        const { volumeSeriesName, volumeNumber, ...bookData } = validatedFields.data;
        let volumeInfo: VolumeInfo | undefined = undefined;
        
        if (volumeSeriesName) {
            volumeInfo = {
                seriesName: volumeSeriesName,
                // Only include volume number if it's a valid number
                ...(typeof volumeNumber === 'number' && !isNaN(volumeNumber) && { volumeNumber })
            };
        }
        
        const finalBookData = { ...bookData, volumeInfo, ownerId: userProfile.email };
        // If an organization is not selected, the author name should be the user's name
        if (!finalBookData.organizationId) {
            finalBookData.authorName = userProfile.name;
        } else {
             finalBookData.authorName = finalBookData.organizationName;
        }

        const newBook = await addBook(finalBookData);
        
        revalidatePath('/admin/books');
        return { success: true, message: "Book created successfully." };
    } catch (error: any) {
        return { error: error.message };
    }
}

export async function updateBook(prevState: any, formData: FormData) {
    const rawVolumeNumber = formData.get('volumeNumber');
    
    const validatedFields = UpdateBookSchema.safeParse({
      bookId: formData.get('bookId') || undefined,
      name: formData.get('name') || undefined,
      genreId: formData.get('genreId') || undefined,
      categoryId: formData.get('categoryId') || undefined,
      subtitle: formData.get('subtitle') || undefined,
      description: formData.get('description') || undefined,
      shortDescription: formData.get('shortDescription') || undefined,
      authorName: formData.get('authorName') || undefined,
      publishedAt: formData.get('publishedAt') || undefined,
      coverUrl: formData.get('coverUrl') || undefined,
      profileUrl: formData.get('profileUrl') || undefined,
      publisher: formData.get('publisher') || undefined,
      isbn: formData.get('isbn') || undefined,
      designer: formData.get('designer') || undefined,
      subject: formData.get('subject') || undefined,
      sourceTypes: formData.getAll('sourceTypes'),
      commentaryTypes: formData.getAll('commentaryTypes'),
      volumeSeriesName: formData.get('volumeSeriesName') || undefined,
      volumeNumber: rawVolumeNumber === null || rawVolumeNumber === '' ? undefined : Number(rawVolumeNumber),
      organizationId: formData.get('organizationId') || undefined,
      organizationName: formData.get('organizationName') || undefined,
    });
    
    if (!validatedFields.success) {
        return {
            error: "Validation failed",
            fieldErrors: validatedFields.error.flatten().fieldErrors,
        };
    }
    
    try {
        const userProfile = await getUserProfile();
        const { bookId, volumeSeriesName, volumeNumber, ...bookData } = validatedFields.data;
        let volumeInfo: VolumeInfo | undefined = undefined;

        if (volumeSeriesName) {
            volumeInfo = {
                seriesName: volumeSeriesName,
                ...(typeof volumeNumber === 'number' && !isNaN(volumeNumber) && { volumeNumber })
            };
        } else {
            // If the series name is cleared, the volume info should be removed.
            volumeInfo = undefined;
        }

        const updatedBookData = cleanUndefined({ ...bookData, volumeInfo });
        
        if (!updatedBookData.organizationId) {
            updatedBookData.authorName = userProfile.name;
        } else {
            updatedBookData.authorName = updatedBookData.organizationName;
        }
        
        await updateBookInDataService(bookId, updatedBookData);
        
        revalidatePath('/admin/books');
        revalidatePath(`/admin/books/${bookId}`);
        revalidatePath('/admin/profile');
        return { success: true, message: "Book updated successfully." };
    } catch (error: any) {
        return { error: error.message };
    }
}

export async function createChapter(prevState: any, formData: FormData) {
     const parentIdValue = formData.get('parentId');
     const bookId = formData.get('bookId') as string;
     const validatedFields = ChapterSchema.safeParse({
        bookId,
        name: formData.get('name'),
        topic: formData.get('topic'),
        parentId: parentIdValue === null ? undefined : parentIdValue,
    });

    if (!validatedFields.success) {
        return { error: "Validation failed", fieldErrors: validatedFields.error.flatten().fieldErrors };
    }

    try {
        const user = await getUserProfile();
        const book = await getBook(bookId);
        
        if (book?.ownerId) {
            await addNotification(book.ownerId, {
                type: 'newChapterInBook',
                actor: user,
                title: 'New Chapter Added',
                message: `${user.name} added a new chapter "${validatedFields.data.name}" to your book "${book.name}".`,
                link: `/admin/books/${bookId}`,
            });
        }
        
        await addChapter(bookId, validatedFields.data.name, validatedFields.data.topic, validatedFields.data.parentId);
        revalidatePath(`/admin/books/${bookId}`);
        return { success: true };
    } catch (e: any) {
        return { error: e.message };
    }
}

export async function createArticle(prevState: any, formData: FormData) {
    const validatedFields = ArticleSchema.safeParse({
        bookId: formData.get('bookId'),
        chapterId: formData.get('chapterId'),
        verse: formData.get('verse'),
        title: formData.get('title'),
        content: formData.get('content'),
        tags: formData.get('tags'),
    });

    if (!validatedFields.success) {
        return {
            error: "Validation failed.",
            fieldErrors: validatedFields.error.flatten().fieldErrors,
        };
    }

    let blocks;
    try {
        blocks = z.array(ContentBlockSchema).parse(JSON.parse(validatedFields.data.content));
        if (blocks.length === 0) throw new Error("Article must have at least one content block.");
    } catch (e: any) {
        return { error: `Invalid article content format: ${e.message}` };
    }

    const slugifiedVerse = slugify(validatedFields.data.verse, { lower: true, strict: true });
    if (!slugifiedVerse) {
        return { error: 'Verse identifier cannot be empty after sanitizing.' };
    }

    const tagsValue = validatedFields.data.tags;
    const tags = tagsValue ? JSON.parse(tagsValue) : [];

    try {
        const userProfile = await getUserProfile();
        const articleContent = {
            verse: slugifiedVerse,
            title: validatedFields.data.title,
            content: blocks,
            tags: tags,
        };
        
        await addArticleInDataService(validatedFields.data.bookId, validatedFields.data.chapterId, articleContent);

        revalidatePath(`/admin/books/${validatedFields.data.bookId}`);
        return { 
            success: true, 
            redirectPath: `/admin/books/${validatedFields.data.bookId}/edit/${validatedFields.data.chapterId}/${slugifiedVerse}`
        };
    } catch (error: any) {
        return { error: error.message };
    }
}

export async function updateArticle(prevState: any, formData: FormData) {
    const validatedFields = UpdateArticleSchema.safeParse({
        bookId: formData.get('bookId'),
        chapterId: formData.get('chapterId'),
        verse: formData.get('verse'),
        title: formData.get('title'),
        content: formData.get('content'),
        tags: formData.get('tags'),
    });

    if (!validatedFields.success) {
        return {
            error: "Validation failed.",
            fieldErrors: validatedFields.error.flatten().fieldErrors,
        };
    }

    let blocks;
    try {
        blocks = z.array(ContentBlockSchema).parse(JSON.parse(validatedFields.data.content));
        if (blocks.length === 0) throw new Error("Article must have at least one content block.");
    } catch (e: any) {
        return { error: `Invalid article content format: ${e.message}` };
    }
    
    const tagsValue = validatedFields.data.tags;
    const tags = tagsValue ? JSON.parse(tagsValue) : [];

    try {
        const articleData = {
            title: validatedFields.data.title,
            content: blocks,
            tags: tags,
        };

        await updateArticleInDataService(validatedFields.data.bookId, validatedFields.data.chapterId, validatedFields.data.verse, articleData);

        revalidatePath(`/admin/books/${validatedFields.data.bookId}`);
        revalidatePath(`/admin/books/${validatedFields.data.bookId}/edit/${validatedFields.data.chapterId}/${validatedFields.data.verse}`);
        revalidatePath(`/articles/${validatedFields.data.bookId}/${validatedFields.data.chapterId}/${validatedFields.data.verse}`);
        return { success: true, message: 'Article updated successfully!' };
    } catch (error: any) {
        return { error: error.message };
    }
}


export async function updateArticleStatus(formData: FormData) {
    const validatedFields = UpdateStatusSchema.safeParse({
        bookId: formData.get('bookId'),
        chapterId: formData.get('chapterId'),
        verse: formData.get('verse'),
        newStatus: formData.get('newStatus'),
    });

    if (!validatedFields.success) {
        console.error('Validation failed for status update:', validatedFields.error.flatten());
        return { error: 'Invalid data for status update.' };
    }
    
    try {
        await updateStatus(
            validatedFields.data.bookId,
            validatedFields.data.chapterId,
            validatedFields.data.verse,
            validatedFields.data.newStatus
        );

         if (validatedFields.data.newStatus === 'published') {
            const user = await getUserProfile();
            const book = await getBook(validatedFields.data.bookId);
            if (book?.ownerId) {
                await addNotification(book.ownerId, {
                    type: 'newArticleInBook',
                    actor: user,
                    title: 'New Article Published',
                    message: `${user.name} published a new article in your book "${book.name}".`,
                    link: `/articles/${validatedFields.data.bookId}/${validatedFields.data.chapterId}/${validatedFields.data.verse}`,
                });
            }
        }

        revalidatePath(`/admin/books/${validatedFields.data.bookId}`);
        revalidatePath('/articles', 'layout');
        return { success: true };
    } catch (error: any) {
        return { error: error.message };
    }
}

export async function deleteChapter(formData: FormData) {
    const validatedFields = DeleteChapterSchema.safeParse({
        bookId: formData.get('bookId'),
        chapterId: formData.get('chapterId'),
    });

    if (!validatedFields.success) {
        return { error: 'Invalid data for chapter deletion.' };
    }

    try {
        await deleteChapterData(
            validatedFields.data.bookId,
            validatedFields.data.chapterId
        );
        revalidatePath(`/admin/books/${validatedFields.data.bookId}`);
        revalidatePath('/articles', 'layout');
        return { success: true };
    } catch (error: any) {
        return { error: error.message };
    }
}

export async function deleteArticle(formData: FormData) {
    const validatedFields = DeleteArticleSchema.safeParse({
        bookId: formData.get('bookId'),
        chapterId: formData.get('chapterId'),
        verse: formData.get('verse'),
    });

    if (!validatedFields.success) {
        return { error: 'Invalid data for article deletion.' };
    }
    
    try {
        await deleteArticleData(
            validatedFields.data.bookId,
            validatedFields.data.chapterId,
            validatedFields.data.verse
        );
        revalidatePath(`/admin/books/${validatedFields.data.bookId}`);
        revalidatePath('/articles', 'layout');
        return { success: true };
    } catch (error: any) {
        return { error: error.message };
    }
}

export async function deleteBook(prevState: any, formData: FormData) {
    const validatedFields = DeleteBookSchema.safeParse({
        bookId: formData.get('bookId'),
    });

    if (!validatedFields.success) {
        return { error: 'Invalid data for book deletion.' };
    }

    try {
        await deleteBookFromDataService(validatedFields.data.bookId as string);
        revalidatePath('/admin/books');
        revalidatePath('/admin/profile');
        return { success: true, message: 'Book deleted successfully.' };
    } catch (error: any) {
        return { error: error.message };
    }
}

export async function reorderContent(formData: FormData) {
    let parsedChapters;
    try {
        parsedChapters = JSON.parse(formData.get('chapters') as string);
    } catch (e) {
        return { error: 'Invalid chapter data format.' };
    }

    const validatedFields = ReorderContentSchema.safeParse({
        bookId: formData.get('bookId'),
        chapters: parsedChapters
    });

    if (!validatedFields.success) {
        console.error("Reorder validation error:", validatedFields.error);
        return { error: 'Invalid data for reordering.' };
    }
    
    try {
        await updateBookChapters(
            validatedFields.data.bookId,
            validatedFields.data.chapters
        );
        // This revalidation might be too broad but ensures consistency
        revalidatePath('/admin/books', 'layout'); 
        return { success: true };
    } catch (error: any) {
        return { error: error.message };
    }
}


export async function updateBookVisibility(prevState: any, formData: FormData) {
    const validatedFields = UpdateBookVisibilitySchema.safeParse({
        bookId: formData.get('bookId'),
        visibility: formData.get('visibility'),
        circleIds: formData.getAll('circleIds'),
    });

    if (!validatedFields.success) {
        return { error: 'Validation failed.' };
    }
    
    const { bookId, visibility } = validatedFields.data;
    const user = await getUserProfile();

    try {
        await setBookVisibility(
            bookId,
            visibility,
            validatedFields.data.circleIds
        );
        
        if (visibility === 'public') {
            const book = await getBook(bookId);
            if(book && book.ownerId) {
                await addNotification(book.ownerId, {
                    type: 'book_published',
                    actor: user,
                    title: 'New Book Published',
                    message: `${user.name} has published the book "${book.name}".`,
                    link: `/admin/books/${bookId}`,
                });
            }
        }
        
        revalidatePath(`/admin/books/${bookId}`);
        revalidatePath(`/admin/books`);
        return { success: true, message: 'Book visibility updated.' };
    } catch (error: any) {
        return { error: error.message };
    }
}


const GroupSeriesSchema = z.object({
    seriesName: z.string().min(1, 'Series name is required.'),
    bookIds: z.string().min(1, 'At least one book must be selected.'),
});

export async function groupBooksIntoSeries(prevState: any, formData: FormData) {
    const validatedFields = GroupSeriesSchema.safeParse({
        seriesName: formData.get('seriesName'),
        bookIds: formData.get('bookIds'),
    });

    if (!validatedFields.success) {
        return {
            error: "Validation failed",
            fieldErrors: validatedFields.error.flatten().fieldErrors,
        };
    }

    try {
        const { seriesName, bookIds: bookIdsJson } = validatedFields.data;
        const bookIds: string[] = JSON.parse(bookIdsJson);

        for (let i = 0; i < bookIds.length; i++) {
            const bookId = bookIds[i];
            const volumeInfo: VolumeInfo = { seriesName, volumeNumber: i + 1 };
            await setBookVolumeInfo(bookId, volumeInfo);
        }

        revalidatePath('/admin/books');
        return { success: true, message: `${bookIds.length} books grouped into "${seriesName}" series successfully.` };
    } catch (error: any) {
        return { error: error.message };
    }
}

export async function updateSeriesDescription(prevState: any, formData: FormData) {
    const validatedFields = UpdateSeriesDescriptionSchema.safeParse(Object.fromEntries(formData));

    if (!validatedFields.success) {
        return {
            error: "Validation failed.",
            fieldErrors: validatedFields.error.flatten().fieldErrors,
        };
    }

    try {
        const { seriesName, description } = validatedFields.data;
        await updateSeries(seriesName, { description });
        revalidatePath('/admin/books');
        return { success: true, message: `Description for "${seriesName}" series updated.` };
    } catch (error: any) {
        return { error: error.message };
    }
}

export async function saveBookTheme(prevState: any, formData: FormData) {
  const validatedFields = SaveThemeSchema.safeParse(Object.fromEntries(formData));
  if (!validatedFields.success) {
    return { error: 'Invalid theme data provided.' };
  }
  
  try {
    const themeData = JSON.parse(validatedFields.data.themeData) as BookTheme;
    await saveThemeForBook(validatedFields.data.bookId, themeData);
    revalidatePath(`/admin/books/${validatedFields.data.bookId}/theme`);
    revalidatePath(`/articles/${validatedFields.data.bookId}`, 'layout');
    return { success: true, message: "Theme saved successfully." };
  } catch (error: any) {
    return { error: `Failed to save theme: ${error.message}` };
  }
}


export async function toggleAnnouncement(prevState: any, formData: FormData) {
    const validatedFields = ToggleAnnouncementSchema.safeParse(Object.fromEntries(formData));
    
    if (!validatedFields.success) {
        return { error: 'Invalid data' };
    }

    const { bookId, isAnnounced: isAnnouncedStr } = validatedFields.data;
    const isAnnounced = isAnnouncedStr === 'true';
    const user = await getUserProfile();

    try {
        const book = await updateBookInDataService(bookId, { isAnnounced });
        
        if (isAnnounced && book) {
            await addNotification(user.email, {
                type: 'book_published',
                actor: user,
                title: 'New Announcement',
                message: `${user.name} has announced the book "${book.name}".`,
                link: `/admin/books/${bookId}`,
            });
        }
        
        revalidatePath(`/admin/books/${bookId}`);
        return { success: true, message: `Book status updated to: ${isAnnounced ? 'Announced' : 'Withheld'}` };
    } catch (e: any) {
        return { error: e.message };
    }
}

    