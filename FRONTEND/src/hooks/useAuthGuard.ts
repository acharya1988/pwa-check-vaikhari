
"use client";
import { useEffect, useState } from "react";
import { auth } from "@/lib/firebase/config";
import { onAuthStateChanged, type User } from "firebase/auth";
import type { UserProfile } from "@/types";

export type Role = "user" | "admin" | "superadmin";

async function setServerSessionCookie(firebaseUser: User) {
    try {
        const idToken = await firebaseUser.getIdToken(true);
        await fetch('/api/session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ idToken }),
        });
    } catch (error) {
        console.error("Failed to set session cookie:", error);
    }
}


export function useAuthGuard() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [needsProfileCompletion, setNeedsProfileCompletion] = useState(false);
  const [role, setRole] = useState<Role | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (!firebaseUser) {
          setUser(null);
          setNeedsProfileCompletion(false);
          setRole(null);
          setLoading(false);
          return;
        }

        // Set session cookie on auth state change
        await setServerSessionCookie(firebaseUser);

        // Fetch or create server-side profile in Mongo
        await firebaseUser.reload();
        const profRes = await fetch('/api/profile/me', { credentials: 'include' });
        const profJson = await profRes.json();
        const userData = profJson.profile as UserProfile;
        setUser(userData);
        setNeedsProfileCompletion(!userData?.onboardingCompleted);

        // --- Role Logic ---
        const token = await firebaseUser.getIdTokenResult(true);
        setRole((token.claims.role as Role) || "user");

      } catch (err) {
        console.error("useAuthGuard error:", err);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  return { loading, user, needsProfileCompletion, role };
}
