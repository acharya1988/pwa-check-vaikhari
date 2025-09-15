
import { getUserProfile } from '@/services/user.service';
import { AdminLayoutClient } from '@/app/admin/layout-client';
import { Toaster } from "@/components/ui/toaster"
import { CopilotProvider } from '@/contexts/copilot-context';

export default async function SocialLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const userProfile = await getUserProfile();

  return (
    <CopilotProvider>
      <AdminLayoutClient userProfile={userProfile}>
        {children}
      </AdminLayoutClient>
    </CopilotProvider>
  );
}
