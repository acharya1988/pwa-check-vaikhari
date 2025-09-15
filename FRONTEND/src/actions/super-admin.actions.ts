

'use server';

import { revalidatePath } from 'next/cache';
import { deleteClonedContent, toggleAiSync as toggleAiSyncInService, updateOrganizationStatus } from '@/services/super-admin.service';
import { updateUserProfileInService } from '@/services/user.service';
import { trainOnTag } from '@/ai/flows/train-on-tag';
import type { SuperAdminContent, UserProfile } from '@/types';
import { z } from 'zod';

export async function toggleAiSyncAction(formData: FormData) {
    const contentId = formData.get('contentId') as string;
    if (!contentId) {
        return { error: 'Content ID is missing.' };
    }
    try {
        await toggleAiSyncInService(contentId);
        revalidatePath('/admin/super-admin');
        return { success: true };
    } catch (e: any) {
        return { error: e.message };
    }
}


export async function deleteClonedContentAction(formData: FormData) {
    const contentId = formData.get('contentId') as string;
    if (!contentId) {
        return { error: 'Content ID is missing.' };
    }
    try {
        await deleteClonedContent(contentId);
        revalidatePath('/admin/super-admin');
        return { success: true, message: 'Content removed from repository.' };
    } catch (e: any) {
        return { error: e.message };
    }
}

export async function runTagTrainingAction(prevState: any, formData: FormData) {
    const tag = formData.get('tag') as string;
    const itemsJson = formData.get('items') as string;

    if (!tag || !itemsJson) {
        return { error: "Missing required training data." };
    }

    let items: SuperAdminContent[];
    try {
        items = JSON.parse(itemsJson);
    } catch (e) {
        return { error: "Invalid content format." };
    }

    try {
        const result = await trainOnTag({ tag, contentItems: items });
        return { success: true, message: result.summary };
    } catch (e: any) {
        return { error: `AI training flow failed: ${e.message}` };
    }
}


const VerificationActionSchema = z.object({
  userId: z.string().min(1, 'User ID is required.'),
});

export async function approveVerification(prevState: any, formData: FormData) {
    const validatedFields = VerificationActionSchema.safeParse(Object.fromEntries(formData));
    if (!validatedFields.success) return { error: 'Invalid data' };
    
    try {
        await updateUserProfileInService({ verificationStatus: 'verified' }, validatedFields.data.userId);
        revalidatePath('/admin/super-admin');
        return { success: true, message: 'User has been verified.' };
    } catch (error: any) {
        return { error: `Failed to approve: ${error.message}` };
    }
}

export async function denyVerification(prevState: any, formData: FormData) {
     const validatedFields = VerificationActionSchema.safeParse(Object.fromEntries(formData));
    if (!validatedFields.success) return { error: 'Invalid data' };
    
    try {
        await updateUserProfileInService({ verificationStatus: 'unverified' }, validatedFields.data.userId);
        revalidatePath('/admin/super-admin');
        return { success: true, message: 'Verification request has been denied.' };
    } catch (error: any) {
        return { error: `Failed to deny: ${error.message}` };
    }
}

export async function revokeVerificationAction(prevState: any, formData: FormData) {
    const validatedFields = VerificationActionSchema.safeParse(Object.fromEntries(formData));
    if (!validatedFields.success) return { error: 'Invalid data' };
    
    try {
        await updateUserProfileInService({ verificationStatus: 'revoked' }, validatedFields.data.userId);
        revalidatePath('/admin/super-admin');
        return { success: true, message: 'User verification has been revoked.' };
    } catch (error: any) {
        return { error: `Failed to revoke: ${error.message}` };
    }
}

export async function banUserAction(prevState: any, formData: FormData) {
    const validatedFields = VerificationActionSchema.safeParse(Object.fromEntries(formData));
    if (!validatedFields.success) return { error: 'Invalid data' };
    
    try {
        await updateUserProfileInService({ verificationStatus: 'banned' }, validatedFields.data.userId);
        revalidatePath('/admin/super-admin');
        return { success: true, message: 'User has been banned.' };
    } catch (error: any) {
        return { error: `Failed to ban: ${error.message}` };
    }
}

export async function unbanUserAction(prevState: any, formData: FormData) {
    const validatedFields = VerificationActionSchema.safeParse(Object.fromEntries(formData));
    if (!validatedFields.success) return { error: 'Invalid data' };
    
    try {
        await updateUserProfileInService({ verificationStatus: 'unverified' }, validatedFields.data.userId);
        revalidatePath('/admin/super-admin');
        return { success: true, message: 'User has been unbanned.' };
    } catch (error: any) {
        return { error: `Failed to unban: ${error.message}` };
    }
}

const OrgVerificationActionSchema = z.object({
  organizationId: z.string().min(1, 'Organization ID is required.'),
});

export async function approveOrganization(prevState: any, formData: FormData) {
    const validatedFields = OrgVerificationActionSchema.safeParse(Object.fromEntries(formData));
    if (!validatedFields.success) return { error: 'Invalid data' };
    
    try {
        await updateOrganizationStatus(validatedFields.data.organizationId, 'verified');
        revalidatePath('/admin/super-admin/institutions');
        return { success: true, message: 'Organization has been verified.' };
    } catch (error: any) {
        return { error: `Failed to approve: ${error.message}` };
    }
}

export async function denyOrganization(prevState: any, formData: FormData) {
     const validatedFields = OrgVerificationActionSchema.safeParse(Object.fromEntries(formData));
    if (!validatedFields.success) return { error: 'Invalid data' };
    
    try {
        await updateOrganizationStatus(validatedFields.data.organizationId, 'unverified');
        revalidatePath('/admin/super-admin/institutions');
        return { success: true, message: 'Organization verification has been denied.' };
    } catch (error: any) {
        return { error: `Failed to deny: ${error.message}` };
    }
}

    