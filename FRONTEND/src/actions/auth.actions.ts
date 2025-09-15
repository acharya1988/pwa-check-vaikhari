
'use server';

import { redirect } from 'next/navigation';
import { auth } from '@/lib/firebase/config';
import { 
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
} from 'firebase/auth';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { createUserProfile } from '@/services/user.service';

const LoginSchema = z.object({
    email: z.string().email('Please enter a valid email address.'),
    password: z.string().min(6, 'Password must be at least 6 characters long.'),
});

const SignupSchema = z.object({
    name: z.string().min(2, 'Name is required.'),
    email: z.string().email('Please enter a valid email address.'),
    password: z.string().min(6, 'Password must be at least 6 characters long.'),
});


export async function signIn(prevState: any, formData: FormData) {
    const validatedFields = LoginSchema.safeParse(Object.fromEntries(formData.entries()));

    if (!validatedFields.success) {
        return {
            error: "Validation failed.",
            fieldErrors: validatedFields.error.flatten().fieldErrors,
        };
    }
    
    const { email, password } = validatedFields.data;

    try {
        await signInWithEmailAndPassword(auth, email, password);
    } catch (error: any) {
        // This is now primarily handled on the client, but we keep server-side
        // validation as a fallback/for non-JS environments.
        switch (error.code) {
            case 'auth/invalid-credential':
                return { error: 'Invalid email or password. Please try again.' };
            case 'auth/user-disabled':
                return { error: 'This account has been disabled. Please contact support.' };
            case 'auth/too-many-requests':
                return { error: 'Too many failed attempts. Please try again later.' };
            default:
                return { error: 'An unexpected error occurred. Please try again.' };
        }
    }
    
    revalidatePath('/admin', 'layout');
    redirect('/admin/activity');
}


export async function signUp(prevState: any, formData: FormData) {
     const validatedFields = SignupSchema.safeParse(Object.fromEntries(formData.entries()));

    if (!validatedFields.success) {
        return {
            error: "Validation failed.",
            fieldErrors: validatedFields.error.flatten().fieldErrors,
        };
    }
    
    const { email, password, name } = validatedFields.data;

    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        
        await createUserProfile({
            uid: userCredential.user.uid,
            email: userCredential.user.email!,
            name: name,
            avatarUrl: userCredential.user.photoURL || `https://placehold.co/128x128.png`
        });
        
    } catch (error: any) {
        switch (error.code) {
            case 'auth/email-already-in-use':
                return { error: 'This email address is already in use.' };
            case 'auth/invalid-email':
                return { error: 'Please enter a valid email address.' };
            case 'auth/weak-password':
                return { error: 'Password should be at least 6 characters.' };
            case 'auth/too-many-requests':
                return { error: 'Too many sign-up attempts. Please try again later.' };
            default:
                return { error: 'An unexpected error occurred during sign-up.' };
        }
    }

    return { success: true };
}
