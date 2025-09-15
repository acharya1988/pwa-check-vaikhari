
'use client';

import React, { ReactNode } from 'react';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import { LoadingAnimation } from '@/components/loading-animation';

/**
 * AuthProvider now primarily serves to show a loading state while the
 * initial authentication check is performed by the useAuthGuard hook.
 * Route protection and redirection are handled within the protected layouts.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const { loading } = useAuthGuard();

  if (loading) {
     return (
      <div className="w-full h-screen flex items-center justify-center bg-background">
        <LoadingAnimation />
      </div>
    );
  }

  return <>{children}</>;
}
