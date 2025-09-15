

'use server';

import { updateUserProfileInService } from '@/services/user.service';
import type { UserProfile } from '@/types';
import { z } from 'zod';
import { redirect } from 'next/navigation';
import { getServerUser } from '@/lib/auth/server';

const OnboardingSchema = z.object({
  name: z.string().min(2, 'Name is required.'),
  username: z.string().min(3, "Username must be at least 3 characters."),
  tagline: z.string().optional(),
});

export async function completeOnboarding(prevState: any, formData: FormData) {
    const validatedFields = OnboardingSchema.safeParse(Object.fromEntries(formData));

    if (!validatedFields.success) {
        return {
            error: "Validation failed.",
            fieldErrors: validatedFields.error.flatten().fieldErrors,
        };
    }
    
    const serverUser = await getServerUser();
    if (!serverUser?.email) {
        return { error: 'User not authenticated. Please try logging in again.' };
    }

    const profileUpdate: Partial<UserProfile> = {
        name: validatedFields.data.name,
        username: validatedFields.data.username,
        tagline: validatedFields.data.tagline,
        onboardingCompleted: true, // Mark onboarding as complete
    };
    
    try {
        await updateUserProfileInService(profileUpdate, serverUser.email);
    } catch (e: any) {
        return { error: `Failed to update profile: ${e.message}` };
    }
    
    redirect('/admin/activity');
}
