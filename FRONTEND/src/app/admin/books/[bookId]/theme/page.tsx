

import { getBookContent } from "@/services/book.service";
import { getThemeForBook, getDefaultTheme } from "@/services/theme.service";
import { notFound } from "next/navigation";
import { BookThemeEditor } from "@/components/theme/BookThemeEditor";
import { BookThemeProvider } from "@/components/theme/BookThemeContext";
import { LanguageProvider } from "@/components/language-provider";

export default async function BookThemeEditorPage({ params: { bookId } }: { params: { bookId: string } }) {

  if (!bookId) {
    notFound();
  }

  const [bookContent, initialTheme, defaultTheme] = await Promise.all([
    getBookContent(bookId),
    getThemeForBook(bookId),
    getDefaultTheme()
  ]);

  if (!bookContent) {
    notFound();
  }

  const themeToLoad = initialTheme.bookId === 'default' ? { ...initialTheme, bookId } : initialTheme;
  
  return (
    <LanguageProvider>
        <BookThemeProvider theme={themeToLoad}>
            <BookThemeEditor
                initialTheme={themeToLoad}
                defaultTheme={defaultTheme}
                bookContent={bookContent}
            />
        </BookThemeProvider>
    </LanguageProvider>
  );
}
