
'use client';

import { useEffect } from 'react';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import { AdminLayoutClient } from './layout-client';
import { Toaster } from "@/components/ui/toaster";
import { CopilotProvider } from '@/contexts/copilot-context';
import { SidebarProvider } from '@/components/ui/sidebar';
import { LanguageProvider, TransliterationProvider } from '@/components/transliteration-provider';
import { LoadingAnimation } from '@/components/loading-animation';
import { useRouter } from 'next/navigation';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { loading, user } = useAuthGuard();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [loading, user, router]);

  if (loading || !user) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-background">
        <LoadingAnimation />
      </div>
    );
  }

  return (
    <CopilotProvider>
      <SidebarProvider>
        <LanguageProvider>
          <TransliterationProvider>
            <AdminLayoutClient userProfile={user}>
              {children}
            </AdminLayoutClient>
          </TransliterationProvider>
        </LanguageProvider>
      </SidebarProvider>
      <Toaster />
    </CopilotProvider>
  );
}
