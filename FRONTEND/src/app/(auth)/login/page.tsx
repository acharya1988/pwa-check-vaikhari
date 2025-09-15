

'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);

  async function setServerSessionCookie(): Promise<boolean> {
    const idToken = await auth.currentUser!.getIdToken(true);
    const res = await fetch('/api/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken }),
    });
    if (!res.ok) {
      try {
        const j = await res.json();
        console.error('Failed to set server session:', j);
      } catch {}
      return false;
    }
    return true;
  }

  async function afterSignedInBootstrap() {
    const ok = await setServerSessionCookie();
    if (!ok) {
      toast({ variant: 'destructive', title: 'Login error', description: 'Could not establish server session. Please try again.' });
      return;
    }
    router.push('/admin/activity');
  }

  async function signInWithGoogle() {
    setBusy(true);
    try {
      await signInWithPopup(auth, new GoogleAuthProvider());
      await afterSignedInBootstrap();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Google sign-in failed',
        description: error?.message ?? 'Unknown error',
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen grid place-items-center p-6">
      <div className="w-full max-w-sm space-y-4">
        <h1 className="text-2xl font-semibold text-center">Continue with Google</h1>
        <Button className="w-full" onClick={signInWithGoogle} disabled={busy}>
          {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Sign in with Google'}
        </Button>
      </div>
    </div>
  );
}
