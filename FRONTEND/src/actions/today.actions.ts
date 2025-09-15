
'use server';

import { z } from 'zod';
import { createTodayStory as createStory } from '@/services/today.service';
import type { StoryType, UserProfile, TodayStoryStyle } from '@/types';
import { revalidatePath } from 'next/cache';

const CreateStorySchema = z.object({
  authorId: z.string(),
  authorName: z.string(),
  // authorAvatarUrl: z.string().url(),
    authorAvatarUrl: z.string().refine(
    (val) => /^https?:\/\//.test(val) || val.startsWith("/"),
    { message: "Invalid url" }
  ),

  payload: z.string(), // This will be the stringified JSON payload
});

export async function createTodayStoryAction(prevState: any, formData: FormData) {
  const validatedFields = CreateStorySchema.safeParse(Object.fromEntries(formData));

  if (!validatedFields.success) {
    return {
      error: "Validation failed.",
      fieldErrors: validatedFields.error.flatten().fieldErrors,
    };
  }

  try {
    const { authorId, authorName, authorAvatarUrl, payload: payloadJson } = validatedFields.data;
    
    // The payload is now a JSON string containing the story details
    const payload = JSON.parse(payloadJson);

    // Re-construct the data for the service layer
    const newStoryData = {
        authorId,
        authorName,
        authorAvatarUrl,
        type: payload.type || 'thought', // Default type
        content: {
            text: payload.content,
            style: payload.style,
            script: 'devanagari',
            source: payload.source,
            attachedWork: payload.attachedWork,
        },
        visibility: {
            expiryAt: payload.visibility.expiryAt,
        },
        tags: payload.tags || [],
        title: payload.title || '',
    };
    
    await createStory(newStoryData as any);
    
    revalidatePath('/admin/activity');
    return { success: true, message: 'Story published successfully!' };
  } catch (error: any) {
    console.error("Story creation failed:", error);
    return { error: `Failed to create story: ${error.message}` };
  }
}


