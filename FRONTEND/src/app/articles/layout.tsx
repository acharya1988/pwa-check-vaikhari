

import { Toaster } from "@/components/ui/toaster"
import { BookThemeProvider } from "@/components/theme/BookThemeContext";
import { getDefaultTheme } from "@/services/theme.service";


export default async function ArticlesLayout({ children }: { children: React.ReactNode }) {
  // Although the specific page will load the book's theme,
  // we provide the default theme as a fallback for the layout itself.
  const defaultTheme = await getDefaultTheme();

  return (
    <BookThemeProvider theme={defaultTheme}>
        {children}
        <Toaster />
    </BookThemeProvider>
  );
}
