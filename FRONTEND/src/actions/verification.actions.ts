
'use server';

import { z } from 'zod';
import { sendEmailOtp, verifyEmailOtp } from '@/ai/flows/email-otp';
import { auth } from '@/lib/firebase/config';
import { updateUserProfileInService } from '@/services/user.service';

const SendSchema = z.object({
    email: z.string().email(),
});

export async function sendEmailOtpAction(prevState: any, formData: FormData) {
    const validatedFields = SendSchema.safeParse({ email: formData.get('email') });
    if (!validatedFields.success) {
        return { error: 'Invalid email address provided.' };
    }
    try {
        const result = await sendEmailOtp({ email: validatedFields.data.email });
        return { success: result.success };
    } catch (e: any) {
        return { error: e.message };
    }
}

const VerifySchema = z.object({
    otp: z.string().length(6, 'OTP must be 6 digits.'),
});

export async function verifyEmailOtpAction(prevState: any, formData: FormData) {
    const validatedFields = VerifySchema.safeParse({ otp: formData.get('otp') });
    if (!validatedFields.success) {
        return { error: 'Invalid OTP format.', fieldErrors: validatedFields.error.flatten().fieldErrors };
    }
    
    const currentUser = auth.currentUser;
    if (!currentUser) {
        return { error: 'You must be logged in to verify your email.' };
    }

    try {
        console.log("checking here")
        const result = await verifyEmailOtp({ email: currentUser.email!, otp: validatedFields.data.otp });
        console.log("resultrr",result)
        if (result.success) {
            return { success: true };
        } else {
            return { error: result.error || 'Verification failed.' };
        }
    } catch (e: any) {
        return { error: e.message };
    }
}
