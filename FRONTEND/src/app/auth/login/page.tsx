
'use client';

import React, { useState, useActionState, useEffect } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { User, Lock, Mail, Loader2 } from 'lucide-react';
import { signIn, signUp } from '@/actions/auth.actions';
import { GoogleSignInButton } from '@/components/auth/google-signin-button';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { useFormStatus } from 'react-dom';

function SubmitButton({ label }: { label: string }) {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" className="btn solid" disabled={pending}>
            {pending ? <Loader2 className="animate-spin" /> : label}
        </Button>
    )
}

function SignupButton() {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" className="btn" disabled={pending}>
            {pending ? <Loader2 className="animate-spin" /> : 'Sign up'}
        </Button>
    )
}


export default function LoginPage() {
    const [isSignUpMode, setIsSignUpMode] = useState(false);
    const [signInState, signInAction] = useActionState(signIn, null);
    const [signUpState, signUpAction] = useActionState(signUp, null);
    const { toast } = useToast();

    useEffect(() => {
        if(signInState?.error) {
            toast({ variant: 'destructive', title: 'Sign In Failed', description: signInState.error });
        }
    }, [signInState, toast]);

    useEffect(() => {
        if(signUpState?.error) {
            toast({ variant: 'destructive', title: 'Sign Up Failed', description: signUpState.error });
        }
        if(signUpState?.success) {
            toast({ title: 'Welcome!', description: 'Your account has been created.' });
        }
    }, [signUpState, toast]);

    return (
        <div className={cn("login-container", isSignUpMode && "sign-up-mode")}>
            <div className="forms-container">
                <div className="signin-signup">
                    <form action={signInAction} className="sign-in-form">
                        <h2 className="title">Sign in</h2>
                        {/* <div className="input-field">
                            <User className="icon" />
                            <input type="email" placeholder="Email" name="email" required />
                        </div>
                        <div className="input-field">
                            <Lock className="icon" />
                            <input type="password" placeholder="Password" name="password" required />
                        </div>
                        <SubmitButton label="Login" /> */}
                        <p className="social-text"> Sign in with social platforms</p>
                        <div className="social-media">
                            <GoogleSignInButton />
                        </div>
                    </form>
                    <form action={signUpAction} className="sign-up-form">
                        <h2 className="title">Sign up</h2>
                        {/* <div className="input-field">
                            <User className="icon" />
                            <input type="text" placeholder="Full Name" name="name" required/>
                        </div>
                        <div className="input-field">
                            <Mail className="icon" />
                            <input type="email" placeholder="Email" name="email" required/>
                        </div>
                        <div className="input-field">
                            <Lock className="icon" />
                            <input type="password" placeholder="Password" name="password" required/>
                        </div>
                        <SignupButton /> */}
                        <p className="social-text">Sign up with social platforms</p>
                         <div className="social-media">
                            <GoogleSignInButton />
                        </div>
                    </form>
                </div>
            </div>

            <div className="panels-container">
                <div className="panel left-panel">
                    <div className="content">
                        <h3>New here ?</h3>
                        <p>
                            Embark on a journey of knowledge. Join our community of scholars and explorers.
                        </p>
                        <button className="btn transparent" id="sign-up-btn" onClick={() => setIsSignUpMode(true)}>
                            Sign up
                        </button>
                    </div>
                     <Image data-ai-hint="man book" src="https://placehold.co/600x500.png" className="image" alt="" width={600} height={500} />
                </div>
                <div className="panel right-panel">
                    <div className="content">
                        <h3>One of us ?</h3>
                        <p>
                           Welcome back! Continue your exploration of ancient wisdom and contribute to the collective knowledge.
                        </p>
                        <button className="btn transparent" id="sign-in-btn" onClick={() => setIsSignUpMode(false)}>
                            Sign in
                        </button>
                    </div>
                    <Image data-ai-hint="meditation peace" src="https://placehold.co/500x500.png" className="image" alt="" width={500} height={500} />
                </div>
            </div>
        </div>
    );
}
