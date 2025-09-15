
'use server';

import { z } from 'zod';
import { 
    createChintanaThread as createThreadInService,
    addPostToThread as addPostToThreadInService,
    updatePostReaction,
    deleteChintanaThread as deleteThreadFromService,
    getChintanaThread as getThreadFromService,
} from '@/services/chintana.service';
import { getUserProfile } from '@/services/user.service';
import type { ChintanaPostReactions, ChintanaPostType } from '@/types';
import { CHINTANA_POST_TYPES } from '@/types/chintana.constants';
import { revalidatePath } from 'next/cache';
import { addSubCategoryToCategory } from '@/services/genre.service';
import { updatePost } from '@/services/post.service';

const postTypeIds = CHINTANA_POST_TYPES.map(p => p.id);

const CreateThreadSchema = z.object({
  title: z.string().min(10, 'Title must be at least 10 characters long.'),
  genreId: z.string().min(1, 'Genre is required.'),
  categoryId: z.string().min(1, 'Category is required.'),
  subCategoryId: z.string().optional(),
  newSubCategory: z.string().optional(),
  tags: z.string().optional(),
  initialPostContent: z.string().min(10, 'The initial post must contain at least 10 characters.'),
  initialPostType: z.enum(postTypeIds as [string, ...string[]]),
  sourcePostId: z.string().optional(),
});

const AddPostSchema = z.object({
  threadId: z.string().min(1, 'Thread ID is required.'),
  content: z.string().min(1, 'Post content cannot be empty.'),
  postType: z.enum(postTypeIds as [string, ...string[]]),
  replyToPostId: z.string().optional(),
  title: z.string().optional(), // For fallacy flags
});

const DeleteThreadSchema = z.object({
  threadId: z.string().min(1, 'Thread ID is required.'),
});


export async function createChintanaThread(prevState: any, formData: FormData) {
    const validatedFields = CreateThreadSchema.safeParse(Object.fromEntries(formData.entries()));

    if (!validatedFields.success) {
        return {
            error: "Validation failed",
            fieldErrors: validatedFields.error.flatten().fieldErrors,
        };
    }
    
    let { subCategoryId, newSubCategory, categoryId, sourcePostId, ...data } = validatedFields.data;

    try {
        const userProfile = await getUserProfile();
        const author = { id: userProfile.email, name: userProfile.name, avatarUrl: userProfile.avatarUrl };
        
        if (newSubCategory && !subCategoryId) {
            const newSub = await addSubCategoryToCategory(categoryId, newSubCategory);
            subCategoryId = newSub.id;
        }
        
        const newThread = await createThreadInService(
            author,
            data.title,
            data.genreId,
            categoryId,
            subCategoryId,
            data.tags ? data.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
            {
                content: data.initialPostContent,
                postType: data.initialPostType as ChintanaPostType,
            }
        );

        if (sourcePostId) {
            await updatePost(sourcePostId, { 
                status: 'thread-started', 
                evolvedTo: { type: 'chintana-thread', id: newThread.id, title: newThread.title } 
            });
        }
        
        revalidatePath('/admin/chintana');
        revalidatePath('/admin/activity');
        return { success: true, message: "Thread created successfully.", newThreadId: newThread.id };
    } catch (error: any) {
        return { error: error.message };
    }
}

export async function addPostToThread(prevState: any, formData: FormData) {
    const validatedFields = AddPostSchema.safeParse(Object.fromEntries(formData));

    if (!validatedFields.success) {
        return {
            error: "Validation failed",
            fieldErrors: validatedFields.error.flatten().fieldErrors,
        };
    }
    try {
        const userProfile = await getUserProfile();
        const author = { id: userProfile.email, name: userProfile.name, avatarUrl: userProfile.avatarUrl };

        await addPostToThreadInService(
            validatedFields.data.threadId,
            author,
            validatedFields.data.content,
            validatedFields.data.postType as ChintanaPostType,
            validatedFields.data.replyToPostId,
            validatedFields.data.title,
        );
        
        revalidatePath(`/admin/chintana/${validatedFields.data.threadId}`);
        return { success: true };
    } catch (error: any) {
        return { error: error.message };
    }
}


const ReactionSchema = z.object({
  threadId: z.string(),
  postId: z.string(),
  reaction: z.custom<keyof ChintanaPostReactions>(),
});

export async function handlePostReaction(prevState: any, formData: FormData) {
  const validatedFields = ReactionSchema.safeParse(Object.fromEntries(formData));
  if (!validatedFields.success) return { error: 'Invalid data' };

  try {
    await updatePostReaction(
      validatedFields.data.threadId,
      validatedFields.data.postId,
      validatedFields.data.reaction
    );
    revalidatePath(`/admin/chintana/${validatedFields.data.threadId}`);
    return { success: true };
  } catch (e: any) {
    return { error: e.message };
  }
}

export async function deleteChintanaThread(prevState: any, formData: FormData) {
    const validatedFields = DeleteThreadSchema.safeParse(Object.fromEntries(formData));
    if (!validatedFields.success) return { error: 'Invalid data' };
    
    try {
        const userProfile = await getUserProfile();
        await deleteThreadFromService(validatedFields.data.threadId, userProfile.email);
        revalidatePath('/admin/chintana');
        return { success: true, message: 'Thread deleted successfully.' };
    } catch (e: any) {
        return { error: e.message };
    }
}
