
'use client';

import { auth } from '@/lib/firebase/config';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

export function GoogleSignInButton() {
    const { toast } = useToast();
    const router = useRouter();
    
    const handleSignIn = async () => {
        const provider = new GoogleAuthProvider();
        try {
            await signInWithPopup(auth, provider);
            toast({ title: 'Success', description: 'You have been signed in successfully.' });
            router.push('/admin/activity');
        } catch (error: any) {
            // This error occurs when the user closes the popup.
            // We can safely ignore it and not show an error message.
            if (error.code === 'auth/cancelled-popup-request' || error.code === 'auth/popup-closed-by-user') {
                console.log("Google Sign-in popup closed by user.");
                return;
            }

            console.error("Google Sign-in Error:", error);
            toast({
                variant: 'destructive',
                title: 'Sign In Failed',
                description: error.message || 'Failed to sign in with Google. Please try again.'
            });
        }
    };
    
    return (
        <button onClick={handleSignIn} className="login-with-google-btn" type="button">
            Sign in with Google
        </button>
    );
}
