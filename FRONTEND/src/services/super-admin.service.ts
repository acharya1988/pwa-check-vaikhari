

'use server';

import type { SuperAdminContent, ContentType, Chapter, Post, Organization } from '@/types';
import { getBooks, getBookContent } from './book.service';
import { getStandaloneArticles } from './standalone-article.service';
import { getCitationData } from './citation.service';
import { getQuoteData } from './quote.service';
import { getGlossaryData } from './glossary.service';
import { getPosts } from './post.service';
import { getDb } from '@/lib/mongo';

const SUPER_ADMIN_COLLECTION = 'super_admin_content';

/**
 * Retrieves all cloned content from the Super Admin repository.
 * This function also performs a robust backfill operation to ensure any existing
 * content that hasn't been cloned yet is added to the repository.
 */
export async function getClonedContent(): Promise<SuperAdminContent[]> {
    const dbm = await getDb();
    const allClonedContent = (await dbm.collection<SuperAdminContent>(SUPER_ADMIN_COLLECTION).find({}).sort({ createdAt: -1 }).toArray()) as any as SuperAdminContent[];
    const clonedIds = new Set(allClonedContent.map(c => c.originalContentId));
    let hasNewItems = false;

    const cloneIfNotExists = async (
        originalContentId: string,
        contentType: ContentType,
        originalUserId: string,
        sourcePath: string,
        content: any
    ) => {
        if (!clonedIds.has(originalContentId)) {
            const newId = globalThis.crypto?.randomUUID ? globalThis.crypto.randomUUID() : (Math.random().toString(36).slice(2) + Date.now());
            const newClonedContent: SuperAdminContent = {
                id: newId,
                originalContentId,
                contentType,
                originalUserId,
                sourcePath,
                content,
                allowAiSync: true,
                createdAt: Date.now(),
                updatedAt: Date.now(),
            } as any;
            await dbm.collection(SUPER_ADMIN_COLLECTION).insertOne(newClonedContent as any);
            clonedIds.add(originalContentId);
            hasNewItems = true;
        }
    };
    
    // --- Backfill various content types ---
    const books = await getBooks();
    for (const book of books) {
        await cloneIfNotExists(book.id, 'book', book.ownerId || 'researcher@vakyaverse.com', `/admin/books/${book.id}`, book);
        const bookContent = await getBookContent(book.id);
        if (bookContent) {
            const ownerId = bookContent.ownerId || 'researcher@vakyaverse.com';
            const traverseChapters = async (chapters: Chapter[], bookId: string): Promise<void> => {
                for (const chapter of chapters) {
                    if (chapter.articles) {
                        for (const article of chapter.articles) {
                            const articleId = `${bookId}-${chapter.id}-${article.verse}`;
                            await cloneIfNotExists(articleId, 'book-article', ownerId, `/articles/${bookId}/${chapter.id}/${article.verse}`, article);
                        }
                    }
                    if (chapter.children) await traverseChapters(chapter.children, bookId);
                }
            };
            if (bookContent.chapters) {
                await traverseChapters(bookContent.chapters, book.id);
            }
        }
    }

    const standaloneArticles = await getStandaloneArticles();
    for (const article of standaloneArticles) {
        await cloneIfNotExists(article.id, 'standalone-article', article.ownerId || 'researcher@vakyaverse.com', `/admin/articles/edit/${article.id}`, article);
    }

    const citationCategories = await getCitationData();
    for (const category of citationCategories) {
        for (const citation of category.citations) {
            await cloneIfNotExists(citation.refId, 'citation', 'researcher@vakyaverse.com', `/admin/citations/${category.id}`, citation);
        }
    }

    const quoteCategories = await getQuoteData();
    for (const category of quoteCategories) {
        for (const quote of category.quotes) {
            await cloneIfNotExists(quote.id, 'quote', 'researcher@vakyaverse.com', `/admin/quotes`, quote);
        }
    }
    
    const glossaryCategories = await getGlossaryData();
     for (const category of glossaryCategories) {
        for (const term of category.terms) {
            await cloneIfNotExists(term.id, 'glossary-term', 'researcher@vakyaverse.com', `/admin/glossary`, term);
        }
    }

    const posts = await getPosts();
    for (const post of posts) {
        await cloneIfNotExists(post.id, 'post', post.author.id, `/admin/profile?tab=wall`, post);
    }
    
    if (hasNewItems) {
        return (await dbm.collection<SuperAdminContent>(SUPER_ADMIN_COLLECTION).find({}).sort({ createdAt: -1 }).toArray()) as any as SuperAdminContent[];
    }
    return allClonedContent as SuperAdminContent[];
}

/**
 * Clones or updates a piece of content in the Super Admin repository.
 */
export async function cloneContentForSuperAdmin(
    originalContentId: string,
    contentType: ContentType,
    originalUserId: string,
    sourcePath: string,
    content: any
): Promise<void> {
    const dbm = await getDb();
    const existing = await dbm.collection(SUPER_ADMIN_COLLECTION).findOne({ originalContentId, contentType });
    if (existing) {
      await dbm.collection(SUPER_ADMIN_COLLECTION).updateOne({ originalContentId, contentType }, { $set: { content, updatedAt: Date.now() } });
    } else {
      const newId = globalThis.crypto?.randomUUID ? globalThis.crypto.randomUUID() : (Math.random().toString(36).slice(2) + Date.now());
      const newClonedContent: SuperAdminContent = {
        id: newId,
        originalContentId,
        contentType,
        originalUserId,
        sourcePath,
        content,
        allowAiSync: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      } as any;
      await dbm.collection(SUPER_ADMIN_COLLECTION).insertOne(newClonedContent as any);
    }
}


/**
 * Toggles the AI sync status for a specific piece of content.
 */
export async function toggleAiSync(contentId: string): Promise<void> {
    const dbm = await getDb();
    const doc = await dbm.collection(SUPER_ADMIN_COLLECTION).findOne({ id: contentId });
    if (!doc) throw new Error('Cloned content not found.');
    const currentStatus = (doc as any).allowAiSync;
    await dbm.collection(SUPER_ADMIN_COLLECTION).updateOne({ id: contentId }, { $set: { allowAiSync: !currentStatus, updatedAt: Date.now() } });
}

/**
 * Deletes a cloned content entry from the Super Admin repository.
 */
export async function deleteClonedContent(contentId: string): Promise<void> {
    const dbm = await getDb();
    await dbm.collection(SUPER_ADMIN_COLLECTION).deleteOne({ id: contentId });
}


/**
 * Updates the verification status of an organization.
 */
export async function updateOrganizationStatus(
    organizationId: string,
    status: Organization['verificationStatus']
): Promise<void> {
    const dbm = await getDb();
    await dbm.collection('organizations').updateOne({ id: organizationId }, { $set: { verificationStatus: status } });
}

    
