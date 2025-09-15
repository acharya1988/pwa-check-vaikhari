

'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { 
    addPost as addPostToService,
    updatePost as updatePostInService,
    addAnswer as addAnswerToService, 
    updatePostReactions,
    updateAnswerReaction,
    evolvePost as evolvePostInService,
    setAcceptedAnswer,
    addSparkToPost,
    toggleGlowOnPost,
    deletePostFromService,
    deleteAnswerFromService,
    getPost,
} from '@/services/post.service';
import { getUserProfile, addNotification } from '@/services/user.service';
import type { Post, PostType, AttachedWork, PostMethod } from '@/types';

function extractTags(content: string): { tags: string[], mentions: string[], metaTags: string[] } {
  const tags: string[] = [];
  const mentions: string[] = [];
  const metaTags: string[] = [];

  const tagRegex = /(#\w+)/g;
  const mentionRegex = /(@\w+)/g;
  const metaTagRegex = /(\*\w+)/g;

  let match;
  while ((match = tagRegex.exec(content)) !== null) {
    tags.push(match[1].substring(1));
  }
  while ((match = mentionRegex.exec(content)) !== null) {
    mentions.push(match[1].substring(1));
  }
  while ((match = metaTagRegex.exec(content)) !== null) {
    metaTags.push(match[1].substring(1));
  }

  return { tags, mentions, metaTags };
}

const CreatePostSchema = z.object({
  content: z.string().min(1, 'Post content cannot be empty.'),
  postType: z.custom<PostType>(),
  postMethod: z.custom<PostMethod>(),
  circleId: z.string().optional(),
  attachedWork: z.string().optional(), // JSON string
  metaTags: z.string().optional(), // JSON string array
});


// export async function createPost(prevState: any, formData: FormData) {
//   console.log("postdata",formData)
//   const validatedFields = CreatePostSchema.safeParse(Object.fromEntries(formData));
//   console.log("postdata",validatedFields)
  
//   if (!validatedFields.success) {
//     return {
//       error: 'Validation failed.',
//       fieldErrors: validatedFields.error.flatten().fieldErrors,
//     };
//   }

//   const { content, postType, postMethod, circleId, attachedWork: attachedWorkValue } = validatedFields.data;

//   if (postMethod === 'circle' && !circleId) {
//     return {
//         error: 'Validation failed.',
//         fieldErrors: { circleId: ['A circle must be selected for a circle post.'] }
//     }
//   }
  
//   if (content.replace(/<[^>]+>/g, '').trim().length === 0) {
//     return {
//       error: 'Validation failed.',
//       fieldErrors: { content: ['Post content cannot be empty.'] },
//     };
//   }

//   try {
//     let attachedWork: AttachedWork | undefined;
//     if (attachedWorkValue) {
//       try {
//         attachedWork = JSON.parse(attachedWorkValue);
//       } catch (e) {
//         console.error("⚠️ Failed to parse attachedWork JSON", e);
//       }
//     }

//     const userProfile = await getUserProfile();
//     const { tags, mentions, metaTags } = extractTags(content);
    
//     // await addPostToService({
//     //     content, 
//     //     postType, 
//     //     userProfile, 
//     //     postMethod, 
//     //     circleId, 
//     //     attachedWork,
//     //     tags,
//     //     mentions,
//     //     metaTags
//     // });

//     const postPayload = {
//       content,
//       postType,
//       userProfile,
//       postMethod,
//       // prevent Firestore undefined issue
//       ...(circleId ? { circleId } : {}),  
//       ...(attachedWork ? { attachedWork } : {}),
//       tags,
//       mentions,
//       metaTags
//     };

//       await addPostToService(postPayload);

//     revalidatePath('/admin/profile');
//     revalidatePath('/admin/activity');

//     return { success: true };
//   } catch (error: any) {
//     console.error("🔥 Error in createPost:", error);
//     return { error: error.message };
//   }
// }

export async function createPost(prevState: any, formData: FormData) {
  console.log("📩 Raw formData:", Object.fromEntries(formData));

  const validatedFields = CreatePostSchema.safeParse(Object.fromEntries(formData));
  console.log("✅ Validated fields result:", validatedFields);

  if (!validatedFields.success) {
    console.warn("⚠️ Validation failed:", validatedFields.error.flatten());
    return {
      error: 'Validation failed.',
      fieldErrors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const { content, postType, postMethod, circleId, attachedWork: attachedWorkValue, metaTags: metaTagsValue } = validatedFields.data;

  console.log("📝 Extracted values:", { content, postType, postMethod, circleId, attachedWorkValue });

  if (postMethod === 'circle' && !circleId) {
    console.warn("⚠️ Missing circleId for circle post");
    return {
      error: 'Validation failed.',
      fieldErrors: { circleId: ['A circle must be selected for a circle post.'] }
    }
  }

  if (content.replace(/<[^>]+>/g, '').trim().length === 0) {
    console.warn("⚠️ Content is empty after stripping HTML");
    return {
      error: 'Validation failed.',
      fieldErrors: { content: ['Post content cannot be empty.'] },
    };
  }

  try {
    let attachedWork: AttachedWork | undefined;
    if (attachedWorkValue) {
      try {
        attachedWork = JSON.parse(attachedWorkValue);
        console.log("📎 Parsed attachedWork:", attachedWork);
      } catch (e) {
        console.error("⚠️ Failed to parse attachedWork JSON", e);
      }
    }

    const userProfile = await getUserProfile();
    console.log("👤 User profile:", userProfile);

    const { tags, mentions, metaTags } = extractTags(content);
    let extraMetaTags: string[] = [];
    if (metaTagsValue) {
      try {
        const parsed = JSON.parse(metaTagsValue);
        if (Array.isArray(parsed)) {
          extraMetaTags = parsed.filter((x: any) => typeof x === 'string');
        }
      } catch (e) {
        console.warn('Invalid metaTags JSON provided');
      }
    }
    console.log("🏷️ Extracted tags:", { tags, mentions, metaTags });

    const postPayload = {
      content,
      postType,
      userProfile,
      postMethod,
      // prevent Firestore undefined issue
      ...(circleId ? { circleId } : {}),  
      ...(attachedWork ? { attachedWork } : {}),
      tags,
      mentions,
      metaTags: [...metaTags, ...extraMetaTags]
    };

    console.log("📦 Final postPayload:", postPayload);

    const created = await addPostToService(postPayload);

    revalidatePath('/admin/profile');
    revalidatePath('/admin/activity');
    if (postMethod === 'circle' && circleId) {
      revalidatePath(`/admin/circles/${circleId}`);
    }

    return { success: true, post: created };
  } catch (error: any) {
    console.error("🔥 Error in createPost:", error);
    return { error: error.message };
  }
}

function cleanObject(obj: Record<string, any>) {
  return Object.fromEntries(
    Object.entries(obj).filter(([_, v]) => v !== undefined)
  );
}

const UpdatePostSchema = z.object({
  postId: z.string().min(1),
  content: z.string().min(1, 'Post content cannot be empty.'),
  postType: z.custom<PostType>(),
});

export async function updatePost(prevState: any, formData: FormData) {
    const validatedFields = UpdatePostSchema.safeParse(Object.fromEntries(formData));

    if (!validatedFields.success) {
        return {
            error: "Validation failed.",
            fieldErrors: validatedFields.error.flatten().fieldErrors,
        };
    }
    
    const { postId, content, postType } = validatedFields.data;

    if (content.replace(/<[^>]+>/g, '').trim().length === 0) {
        return { error: 'Validation failed.', fieldErrors: { content: ['Post content cannot be empty.'] } };
    }

    try {
        const { tags, mentions, metaTags } = extractTags(content);
        await updatePostInService(postId, { content, postType, tags, mentions, metaTags });
        revalidatePath('/admin/profile');
        revalidatePath('/admin/activity');
        return { success: true, message: 'Post updated successfully.' };
    } catch (error: any) {
        return { error: error.message };
    }
}

export async function handleReaction(postId: string, reaction: keyof Post['reactions']) {
  try {
    await updatePostReactions(postId, reaction);
    revalidatePath('/admin/profile');
    revalidatePath('/admin/activity');
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}


export async function evolvePostAction(prevState: any, formData: FormData) {
    const postId = formData.get('postId') as string;
    if (!postId) return { error: "Post ID is missing." };

    try {
        await evolvePostInService(postId);
        revalidatePath('/admin/profile');
        revalidatePath('/admin/my-evolutions');
        return { success: true, message: 'Post is now evolving!' };
    } catch (error: any) {
        return { error: error.message };
    }
}

export async function addSparkAction(prevState: any, formData: FormData) {
    const SparkSchema = z.object({
        postId: z.string(),
        content: z.string().min(1, "Spark content cannot be empty."),
    });
    const validatedFields = SparkSchema.safeParse(Object.fromEntries(formData));
    if (!validatedFields.success) { return { error: "Validation failed" }};
    try {
        const userProfile = await getUserProfile();
        await addSparkToPost(validatedFields.data.postId, validatedFields.data.content, userProfile);
        revalidatePath('/admin/profile');
        revalidatePath('/admin/activity');
        return { success: true, message: 'Spark added!' };
    } catch (error: any) {
        return { error: error.message };
    }
}

export async function toggleGlowAction(postId: string) {
    try {
        const userProfile = await getUserProfile();
        await toggleGlowOnPost(postId, userProfile.email); // Use real user ID
        revalidatePath('/admin/profile');
        revalidatePath('/admin/activity');
        return { success: true };
    } catch (error: any) {
        return { error: error.message };
    }
}


export async function createAnswer(prevState: any, formData: FormData) {
    const content = formData.get('content') as string | null;
    
    if (!content || content.replace(/<[^>]+>/g, '').trim().length === 0) {
        return {
            error: 'Validation failed.',
            fieldErrors: { content: ['Answer cannot be empty.'] },
        };
    }

    const postId = formData.get('postId') as string;

    if (!postId) {
        return { 
            error: 'Validation failed.',
            fieldErrors: { postId: ['Post ID is missing'] },
        };
    }

    try {
        const userProfile = await getUserProfile();
        const post = await getPost(postId);
        
        if (post?.author.id) {
            await addNotification(post.author.id, {
                type: 'comment', // Using 'comment' type for replies
                actor: userProfile,
                title: `New Reply on Your Post`,
                message: `${userProfile.name} replied to your post: "${post.content.substring(0, 50)}..."`,
                link: `/admin/activity`, // Or a more specific link to the post
            });
        }
        
        await addAnswerToService(postId, content, userProfile);
        revalidatePath('/admin/profile');
        revalidatePath('/admin/activity');
        return { success: true };
    } catch (error: any) {
        return { error: error.message };
    }
}

export async function handleAnswerReaction(postId: string, answerId: string, reaction: 'upvote' | 'downvote') {
    try {
        await updateAnswerReaction(postId, answerId, reaction);
        revalidatePath('/admin/profile');
        revalidatePath('/admin/activity');
        return { success: true };
    } catch (error: any) {
        return { error: error.message };
    }
}

export async function acceptAnswer(postId: string, answerId: string) {
    try {
        await setAcceptedAnswer(postId, answerId);
        revalidatePath('/admin/profile');
        revalidatePath('/admin/activity');
        return { success: true };
    } catch (error: any) {
        return { error: error.message };
    }
}

const DeletePostSchema = z.object({
  postId: z.string().min(1, 'Post ID is required.'),
});

const DeleteAnswerSchema = z.object({
  postId: z.string().min(1, 'Post ID is required.'),
  answerId: z.string().min(1, 'Answer ID is required.'),
});

export async function deletePost(prevState: any, formData: FormData) {
  const userProfile = await getUserProfile();
  const validatedFields = DeletePostSchema.safeParse(Object.fromEntries(formData));

  if (!validatedFields.success) {
    return { error: 'Invalid data.' };
  }

  try {
    await deletePostFromService(validatedFields.data.postId, userProfile.email);
    revalidatePath('/admin/profile');
    revalidatePath('/admin/activity');
    return { success: true, message: 'Post deleted successfully.' };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function deleteAnswer(prevState: any, formData: FormData) {
  const userProfile = await getUserProfile();
  const validatedFields = DeleteAnswerSchema.safeParse(Object.fromEntries(formData));
  
  if (!validatedFields.success) {
    return { error: 'Invalid data.' };
  }

  try {
    await deleteAnswerFromService(
      validatedFields.data.postId,
      validatedFields.data.answerId,
      userProfile.email
    );
    revalidatePath('/admin/profile');
    revalidatePath('/admin/activity');
    return { success: true, message: 'Reply deleted successfully.' };
  } catch (error: any) {
    return { error: error.message };
  }
}

    
