
import { getUserProfile } from '@/services/user.service';
import { AdminLayoutClient } from '@/app/admin/layout-client';
import { Toaster } from "@/components/ui/toaster"

export default async function BooksLayout({ children }: { children: React.ReactNode }) {
  const userProfile = await getUserProfile();

  return (
    <>
      <AdminLayoutClient userProfile={userProfile}>
        {children}
      </AdminLayoutClient>
      <Toaster />
    </>
  );
}
