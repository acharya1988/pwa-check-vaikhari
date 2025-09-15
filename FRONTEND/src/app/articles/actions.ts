

'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { getBookContent, writeBookContent } from '@/services/book.service';
import { findArticleRecursive, findChapterRecursive } from '@/services/service-utils';
import type { Bookmark, Comment, Article, LayerAnnotation } from '@/types';
import { saveBlockNoteToDb, toggleBookmark as toggleBookmarkInDb } from '@/services/user.service';
import { addCitation } from '@/services/citation.service';
import slugify from 'slugify';
import { addStandaloneArticle } from '@/services/standalone-article.service';
import { getUserProfile, updateUserProfileInService } from '@/services/user.service';
import { addLayerToDb } from '@/services/layer.service';

const ArticleFeedbackSchema = z.object({
    bookId: z.string(),
    chapterId: z.string(),
    verse: z.string(),
    action: z.enum(['like', 'dislike', 'insightful', 'uplifting']).optional(),
    score: z.coerce.number().min(1).max(10).optional(),
});

export async function handleArticleFeedback(prevState: any, formData: FormData) {
    const validatedFields = ArticleFeedbackSchema.safeParse(Object.fromEntries(formData));

    if (!validatedFields.success) {
        return { error: 'Invalid feedback data.' };
    }

    const { bookId, chapterId, verse, action, score } = validatedFields.data;

    try {
        const content = await getBookContent(bookId);
        if (!content) throw new Error('Book not found');

        const findResult = await findArticleRecursive(content.chapters, chapterId, verse);
        if (!findResult) throw new Error('Article not found.');

        const { article } = findResult;

        if (!article.feedback) {
            article.feedback = { likes: 0, dislikes: 0, insightful: 0, uplifting: 0, views: 0, scores: [] };
        }
        
        if (action) {
            switch(action) {
                case 'like': article.feedback.likes = (article.feedback.likes || 0) + 1; break;
                case 'dislike': article.feedback.dislikes = (article.feedback.dislikes || 0) + 1; break;
                case 'insightful': article.feedback.insightful = (article.feedback.insightful || 0) + 1; break;
                case 'uplifting': article.feedback.uplifting = (article.feedback.uplifting || 0) + 1; break;
            }
        }

        if (score) {
            if (!article.feedback.scores) {
                article.feedback.scores = Array.from({ length: 10 }, (_, i) => ({ value: i + 1, count: 0 }));
            }
            const scoreIndex = article.feedback.scores.findIndex(s => s.value === score);
            if(scoreIndex > -1) {
                article.feedback.scores[scoreIndex].count++;
            } else {
                 article.feedback.scores.push({ value: score, count: 1 });
            }
        }
        
        await writeBookContent(bookId, content);

        if (article.author?.id) {
          const authorProfile = await getUserProfile(article.author.id);
          if (authorProfile?.stats) {
            const allArticles = content.chapters.flatMap(c => c.articles);
            const authorArticles = allArticles.filter(a => a.author.id === article.author.id);
            const totalScores = authorArticles.flatMap(a => a.feedback?.scores || []).reduce((acc, s) => acc + (s.value * s.count), 0);
            const totalVotes = authorArticles.flatMap(a => a.feedback?.scores || []).reduce((acc, s) => acc + s.count, 0);
            const newRating = totalVotes > 0 ? totalScores / totalVotes : 0;
            
            await updateUserProfileInService(
                { 'stats.rating': newRating },
                authorProfile.email,
            );
          }
        }
        
        revalidatePath(`/articles/${bookId}/${chapterId}/${verse}`);
        return { success: true, message: "Feedback submitted." };

    } catch (error: any) {
        return { error: error.message };
    }
}

const AddCommentSchema = z.object({
    bookId: z.string(),
    chapterId: z.string(),
    verse: z.string(),
    targetText: z.string().optional(),
    title: z.string().min(1, "Title is required."),
    body: z.string().min(1, "Comment body cannot be empty."),
    reasonTags: z.string().optional(),
});

export async function handleAddComment(prevState: any, formData: FormData) {
    const validatedFields = AddCommentSchema.safeParse(Object.fromEntries(formData));
    if (!validatedFields.success) {
        return { error: 'Validation failed', fieldErrors: validatedFields.error.flatten().fieldErrors };
    }
    const { bookId, chapterId, verse, targetText, title, body, reasonTags } = validatedFields.data;
    try {
        const content = await getBookContent(bookId);
        if (!content) throw new Error("Book not found");
        const findResult = await findArticleRecursive(content.chapters, chapterId, verse);
        if (!findResult) throw new Error("Article not found");
        
        const newComment: Comment = {
            id: crypto.randomUUID(),
            authorId: 'anonymous',
            timestamp: Date.now(),
            feedback: { likes: 0, dislikes: 0 },
            replies: [],
            targetText,
            title,
            body,
            reasonTags: reasonTags ? reasonTags.split(',').map(t => t.trim()) : [],
        };
        
        if (!findResult.article.comments) findResult.article.comments = [];
        findResult.article.comments.push(newComment);
        
        await writeBookContent(bookId, content);
        revalidatePath(`/articles/${bookId}/${chapterId}/${verse}`);
        revalidatePath(`/admin/books/${bookId}/edit/${chapterId}/${verse}`);
        return { success: true, message: "Comment added successfully." };
    } catch(e: any) {
        return { error: e.message };
    }
}

const CommentFeedbackSchema = z.object({
    bookId: z.string(),
    chapterId: z.string(),
    verse: z.string(),
    commentId: z.string(),
    action: z.enum(['like', 'dislike']),
});

export async function handleCommentFeedback(prevState: any, formData: FormData) {
     const validatedFields = CommentFeedbackSchema.safeParse(Object.fromEntries(formData));
    if (!validatedFields.success) return { error: 'Invalid data.' };
    const { bookId, chapterId, verse, commentId, action } = validatedFields.data;
    try {
        const content = await getBookContent(bookId);
        if (!content) throw new Error("Book not found");
        const findResult = await findArticleRecursive(content.chapters, chapterId, verse);
        if (!findResult || !findResult.article.comments) throw new Error("Article or comments not found");

        const findCommentRecursive = (comments: Comment[]): Comment | null => {
            for (const c of comments) {
                if (c.id === commentId) return c;
                if (c.replies) {
                    const found = findCommentRecursive(c.replies);
                    if (found) return found;
                }
            }
            return null;
        }

        const comment = findCommentRecursive(findResult.article.comments);
        if (!comment) throw new Error("Comment not found");

        if (action === 'like') comment.feedback.likes++;
        else comment.feedback.dislikes++;
        
        await writeBookContent(bookId, content);
        revalidatePath(`/articles/${bookId}/${chapterId}/${verse}`);
        return { success: true };
    } catch(e: any) {
        return { error: e.message };
    }
}

const BookmarkSchema = z.object({
  userId: z.string(),
  type: z.enum(['article', 'block']),
  bookId: z.string(),
  chapterId: z.string(),
  verse: z.string(),
  blockId: z.string().optional(),
  bookName: z.string().optional(),
  articleTitle: z.string().optional(),
  blockTextPreview: z.string().optional(),
  note: z.string().optional(),
});

export async function handleToggleBookmark(prevState: any, formData: FormData) {
  const validatedFields = BookmarkSchema.safeParse(Object.fromEntries(formData));
  if (!validatedFields.success) {
    return { error: "Validation failed." };
  }
  try {
    const result = await toggleBookmarkInDb(validatedFields.data);
    revalidatePath(`/articles/${validatedFields.data.bookId}/${validatedFields.data.chapterId}/${validatedFields.data.verse}`);
    revalidatePath('/admin/profile');
    revalidatePath('/admin/books');
    revalidatePath('/admin/library');
    return { success: true, message: `Bookmark ${result.action}.`, action: result.action };
  } catch (e: any) {
    return { error: e.message };
  }
}

export async function handleSaveUserCitation(prevState: any, formData: FormData) {
    const schema = z.object({
        sanskrit: z.string().min(1),
        translation: z.string().optional(),
        source: z.string().min(1),
        location: z.string().min(1),
        keywords: z.string().optional(),
    });
    const validatedFields = schema.safeParse(Object.fromEntries(formData));
    if (!validatedFields.success) {
        return { error: 'Validation failed', fieldErrors: validatedFields.error.flatten().fieldErrors };
    }
    
    try {
        const { sanskrit, translation, source, location, keywords } = validatedFields.data;
        const refId = `user-${slugify(source, {lower: true, strict: true})}-${Date.now()}`;
        
        await addCitation('user-saved-notes', {
            refId,
            sanskrit,
            translation: translation || '',
            source,
            location,
            keywords: keywords ? keywords.split(',').map(k => k.trim()) : [],
        });
        revalidatePath('/admin/citations');
        return { success: true, message: 'Citation saved to your notes.' };
    } catch (e: any) {
        return { error: e.message };
    }
}

const AddReplySchema = z.object({
    bookId: z.string(),
    chapterId: z.string(),
    verse: z.string(),
    parentCommentId: z.string(),
    body: z.string().min(1, "Reply cannot be empty."),
});

export async function handleAddReply(prevState: any, formData: FormData) {
    const validatedFields = AddReplySchema.safeParse(Object.fromEntries(formData));
    if (!validatedFields.success) return { error: "Validation failed.", fieldErrors: validatedFields.error.flatten().fieldErrors };

    const { bookId, chapterId, verse, parentCommentId, body } = validatedFields.data;

    try {
        const content = await getBookContent(bookId);
        if (!content) throw new Error("Book not found");
        const findResult = await findArticleRecursive(content.chapters, chapterId, verse);
        if (!findResult || !findResult.article.comments) throw new Error("Article or comments not found");

        const findCommentRecursive = (comments: Comment[]): Comment | null => {
            for (const c of comments) {
                if (c.id === parentCommentId) return c;
                if (c.replies) {
                    const found = findCommentRecursive(c.replies);
                    if (found) return found;
                }
            }
            return null;
        }

        const parentComment = findCommentRecursive(findResult.article.comments);
        if (!parentComment) throw new Error("Parent comment not found");

        const newReply: Comment = {
            id: crypto.randomUUID(),
            authorId: 'anonymous',
            timestamp: Date.now(),
            body,
            feedback: { likes: 0, dislikes: 0 },
        };
        if (!parentComment.replies) parentComment.replies = [];
        parentComment.replies.push(newReply);
        
        await writeBookContent(bookId, content);
        revalidatePath(`/articles/${bookId}/${chapterId}/${verse}`);
        revalidatePath(`/admin/books/${bookId}/edit/${chapterId}/${verse}`);
        return { success: true, message: "Reply added." };
    } catch(e: any) {
        return { error: e.message };
    }
}

const DeleteCommentSchema = z.object({
    bookId: z.string(),
    chapterId: z.string(),
    verse: z.string(),
    commentId: z.string(),
});

export async function handleDeleteComment(prevState: any, formData: FormData) {
    const validatedFields = DeleteCommentSchema.safeParse(Object.fromEntries(formData));
    if (!validatedFields.success) return { error: 'Invalid data.' };
    const { bookId, chapterId, verse, commentId } = validatedFields.data;

    try {
        const currentUser = await getUserProfile();
        const content = await getBookContent(bookId);
        if (!content) throw new Error("Book not found");
        const findResult = await findArticleRecursive(content.chapters, chapterId, verse);
        if (!findResult || !findResult.article.comments) throw new Error("Article or comments not found");

        let commentToDelete: Comment | null = null;
        const deleteCommentRecursive = (comments: Comment[]): Comment[] => {
            const filtered = comments.filter(c => {
                if (c.id === commentId) {
                    commentToDelete = c;
                    return false;
                }
                return true;
            });

            if (commentToDelete) return filtered;

            return comments.map(c => {
                if(c.replies) {
                    return {...c, replies: deleteCommentRecursive(c.replies) }
                }
                return c;
            });
        };

        findResult.article.comments = deleteCommentRecursive(findResult.article.comments);
        
        if (!commentToDelete) {
            throw new Error("Comment not found to delete.");
        }
        
        if (commentToDelete.authorId !== 'anonymous' && commentToDelete.authorId !== currentUser.email) {
            throw new Error("You are not authorized to delete this comment.");
        }
        
        await writeBookContent(bookId, content);
        revalidatePath(`/articles/${bookId}/${chapterId}/${verse}`);
        revalidatePath(`/admin/books/${bookId}/edit/${chapterId}/${verse}`);
        return { success: true, message: 'Comment deleted.' };
    } catch(e: any) {
        return { error: e.message };
    }
}

const UpdateCommentSchema = DeleteCommentSchema.extend({
    title: z.string().min(1, "Title is required."),
    body: z.string().min(1, "Comment body cannot be empty."),
    reasonTags: z.string().optional(),
});
export async function handleUpdateComment(prevState: any, formData: FormData) {
    const validatedFields = UpdateCommentSchema.safeParse(Object.fromEntries(formData));
    if (!validatedFields.success) return { error: 'Invalid data.', fieldErrors: validatedFields.error.flatten().fieldErrors };
    
    const { bookId, chapterId, verse, commentId, title, body, reasonTags } = validatedFields.data;
    
    try {
        const currentUser = await getUserProfile();
        const content = await getBookContent(bookId);
        if (!content) throw new Error("Book not found");
        const findResult = await findArticleRecursive(content.chapters, chapterId, verse);
        if (!findResult || !findResult.article.comments) throw new Error("Article or comments not found");
        
        const findCommentRecursive = (comments: Comment[]): Comment | null => {
            for (const c of comments) {
                if (c.id === commentId) return c;
                if (c.replies) {
                    const found = findCommentRecursive(c.replies);
                    if (found) return found;
                }
            }
            return null;
        }

        const comment = findCommentRecursive(findResult.article.comments);
        if (!comment) throw new Error("Comment not found");
        
        if (comment.authorId !== 'anonymous' && comment.authorId !== currentUser.email) {
            throw new Error("You are not authorized to edit this comment.");
        }

        comment.title = title;
        comment.body = body;
        comment.reasonTags = reasonTags ? reasonTags.split(',').map(t => t.trim()) : [];
        
        await writeBookContent(bookId, content);
        revalidatePath(`/articles/${bookId}/${chapterId}/${verse}`);
        revalidatePath(`/admin/books/${bookId}/edit/${chapterId}/${verse}`);
        return { success: true, message: 'Comment updated.' };
    } catch(e: any) {
        return { error: e.message };
    }
}

const BlockInteractionSchema = z.object({
  bookId: z.string(),
  chapterId: z.string(),
  verse: z.string(),
  blockId: z.string(),
  blockSanskrit: z.string().optional(),
});

export async function handleAddLayer(prevState: any, formData: FormData) {
    const schema = BlockInteractionSchema.extend({
        content: z.string().min(1, 'Layer content cannot be empty.'),
    });
    const validatedFields = schema.safeParse(Object.fromEntries(formData));
    if (!validatedFields.success) {
        return { error: 'Validation failed', fieldErrors: validatedFields.error.flatten().fieldErrors };
    }
    
    try {
        const user = await getUserProfile();
        const book = await getBookContent(validatedFields.data.bookId);
        if (!book) throw new Error("Book not found");

        const chapter = await findChapterRecursive(book.chapters, validatedFields.data.chapterId);
        if (!chapter) throw new Error("Chapter not found");

        const newLayer: Omit<LayerAnnotation, 'id'> = {
            userId: user.email,
            bookId: validatedFields.data.bookId,
            chapterId: String(validatedFields.data.chapterId),
            verse: String(validatedFields.data.verse),
            blockId: validatedFields.data.blockId,
            content: validatedFields.data.content,
            timestamp: Date.now(),
            bookName: book.bookName,
            chapterName: chapter.name,
            articleTitle: chapter.articles.find(a => String(a.verse) === String(validatedFields.data.verse))?.title || 'Unknown Article',
            blockSanskrit: validatedFields.data.blockSanskrit,
        };
        await addLayerToDb(newLayer);
        revalidatePath(`/articles/${validatedFields.data.bookId}/${validatedFields.data.chapterId}/${validatedFields.data.verse}`);
        return { success: true, message: 'Layer added successfully.' };
    } catch (e: any) {
        return { error: e.message };
    }
}
export async function handleLeaveSpark(prevState: any, formData: FormData) {
    return { error: 'This feature is not yet implemented.' };
}

export async function handleStartDrift(prevState: any, formData: FormData) {
    const schema = BlockInteractionSchema.extend({
        title: z.string().min(1),
        content: z.string(),
    });
    const validatedFields = schema.safeParse(Object.fromEntries(formData));
    if(!validatedFields.success) return { error: 'Invalid data' };

    try {
        const user = await getUserProfile();
        const { bookId, chapterId, verse, blockId, title, content } = validatedFields.data;
        await addStandaloneArticle({
            title: title,
            content: content,
            type: 'article',
            categoryId: 'uncategorized',
            ownerId: user.email,
            sourceDrift: {
                bookId,
                chapterId,
                verse,
                blockId,
            }
        });
        revalidatePath('/admin/articles');
        return { success: true, message: 'Drift started successfully!' };
    } catch(e: any) {
        return { error: e.message };
    }
}
export async function handleConnectPoint(prevState: any, formData: FormData) {
    return { error: 'This feature is not yet implemented.' };
}

export async function saveBlockNote(prevState: any, formData: FormData) {
  const schema = BlockInteractionSchema.extend({
    note: z.string().min(1, 'Note cannot be empty.'),
    bookName: z.string(),
    articleTitle: z.string(),
    blockTextPreview: z.string(),
  });
  const validatedFields = schema.safeParse(Object.fromEntries(formData));
  if(!validatedFields.success) return { error: 'Invalid data', fieldErrors: validatedFields.error.flatten().fieldErrors };
  try {
    const user = await getUserProfile();
    await saveBlockNoteToDb({
      ...validatedFields.data,
      userId: user.email,
      type: 'block'
    });
    revalidatePath(`/articles/${validatedFields.data.bookId}/${validatedFields.data.chapterId}/${validatedFields.data.verse}`);
    return { success: true, message: 'Note saved.' };
  } catch(e: any) {
    return { error: e.message };
  }
}

const GlowSchema = BlockInteractionSchema.extend({ userId: z.string() });
export async function handleToggleGlow(prevState: any, formData: FormData) {
  const validatedFields = GlowSchema.safeParse(Object.fromEntries(formData));
  if(!validatedFields.success) return { error: 'Invalid data' };
  
  const { bookId, chapterId, verse, blockId, userId } = validatedFields.data;
  
  try {
    const content = await getBookContent(bookId);
    if (!content) throw new Error("Book not found");
    const findResult = await findArticleRecursive(content.chapters, chapterId, verse);
    if (!findResult) throw new Error("Article not found");
    
    const block = findResult.article.content.find(b => b.id === blockId);
    if (!block) throw new Error("Block not found");

    if (!block.glows) block.glows = [];
    const existingGlowIndex = block.glows.findIndex(g => g.userId === userId);

    if (existingGlowIndex > -1) {
        block.glows.splice(existingGlowIndex, 1);
    } else {
        block.glows.push({ userId, timestamp: Date.now() });
    }
    
    await writeBookContent(bookId, content);
    revalidatePath(`/articles/${bookId}/${chapterId}/${verse}`);
    return { success: true };
  } catch(e: any) {
    return { error: e.message };
  }
}
