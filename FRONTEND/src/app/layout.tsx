
import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from '@/components/auth/auth-provider';
// import { ThemeProvider } from '@/components/theme-provider';
import { ThemeProvider } from '@/components/theme-provider';
import { TestDbButton } from '@/components/testdb';
import OverflowInspector from '@/dev/OverflowInspector';


export const metadata: Metadata = {
  title: 'VAIKHARI',
  description: 'Modern Saraswati Sabha',
};

// Force dynamic rendering across the app to avoid build-time DB connections
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  
  return (
    
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Adishila:wght@400;700&amp;family=Inter:wght@400;500;600;700&amp;family=Literata:ital,opsz,wght@0,7..72,400;1,7..72,400;0,7..72,700;1,7..72,700&amp;family=Montserrat:wght@100;200;300;400;500;600;700;800;900&amp;display=swap" rel="stylesheet" />
      
    
<link rel="manifest" href="/manifest.webmanifest" />
<meta name="theme-color" content="#854628" />
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-title" content="Vaikhari" />
<meta name="apple-mobile-web-app-status-bar-style" content="default" />
<link rel="apple-touch-icon" href="/icons/icon-192.png" />


      </head>
      <body className="font-body antialiased bg-background" suppressHydrationWarning>
        <ThemeProvider>
            {process.env.NODE_ENV === 'development' ? <OverflowInspector /> : null}
            <AuthProvider>
              {/* <div className="fixed bottom-4 right-4">
                <TestDbButton />
              </div> */}
                {children}
                <Toaster />
            </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
