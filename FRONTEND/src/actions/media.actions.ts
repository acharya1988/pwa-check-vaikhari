
'use server';

import { z } from 'zod';
import { addMediaFile } from '@/services/media.service';
import { revalidatePath } from 'next/cache';

const MAX_FILE_SIZE = 4 * 1024 * 1024; // 4MB
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'];

const ImageSchema = z.any()
  .refine(
    (file) => file?.size > 0,
    'A file is required and cannot be empty.'
  )
  .refine(
    (file) => file?.size <= MAX_FILE_SIZE,
    `Max file size is 4MB.`
  )
  .refine(
    (file) => ALLOWED_IMAGE_TYPES.includes(file?.type),
    'Only .jpg, .jpeg, .png, .webp, .gif and .svg files are allowed.'
  );


export async function uploadImage(prevState: any, formData: FormData) {
    const file = formData.get('image');

    // Handle case where no file is selected, providing a clear error message.
    if (!(file instanceof File) || file.size === 0) {
        return { error: 'Please select a file to upload.' };
    }

    const validatedFile = ImageSchema.safeParse(file);

    if (!validatedFile.success) {
        const errorMessage = validatedFile.error.issues[0]?.message || "Validation failed.";
        return {
            error: errorMessage,
        };
    }
    
    const imageFile = validatedFile.data as File;

    try {
        const buffer = Buffer.from(await imageFile.arrayBuffer());
        await addMediaFile(imageFile.name, buffer);

        revalidatePath('/admin/media');
        revalidatePath('/admin/profile'); // also revalidate profile page
        return { success: true, message: 'Image uploaded successfully!' };
    } catch (error: any) {
        console.error('Upload failed:', error);
        return { error: 'Failed to upload image. Please try again.' };
    }
}
