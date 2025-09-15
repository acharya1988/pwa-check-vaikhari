import { Toaster } from "@/components/ui/toaster"

export default function LivingDocumentLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <Toaster />
    </>
  );
}
