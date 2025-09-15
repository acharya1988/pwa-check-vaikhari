

import { getArticleWithContext } from '@/services/book.service';
import { getFullGlossary } from '@/services/glossary.service';
import { notFound } from 'next/navigation';
import { ArticlePageUI } from '@/components/article-page-ui';
import { LanguageProvider } from '@/components/language-provider';
import { TransliterationProvider } from '@/components/transliteration-provider';
import { getThemeForBook, getDefaultTheme } from '@/services/theme.service';
import { BookThemeProvider } from '@/components/theme/BookThemeContext';
import { CopilotProvider } from '@/contexts/copilot-context';

export default async function ArticleDisplayPage({ params }: { params: { slug: string[] } }) {
  const [bookId, chapterId, verse] = params.slug;

  if (!bookId || !chapterId || !verse) {
    notFound();
  }

  const [articleData, glossary, theme, defaultTheme] = await Promise.all([
    getArticleWithContext(bookId, chapterId, verse),
    getFullGlossary(),
    getThemeForBook(bookId),
    getDefaultTheme()
  ]);

  if (!articleData) {
    notFound();
  }
  
  const finalTheme = theme || defaultTheme;

  return (
    <CopilotProvider>
      <BookThemeProvider theme={finalTheme}>
        <LanguageProvider>
          <TransliterationProvider>
            <ArticlePageUI
              book={articleData.book}
              chapter={articleData.chapter}
              article={articleData.article}
              prevArticle={articleData.prevArticle}
              nextArticle={articleData.nextArticle}
              glossary={glossary}
            />
          </TransliterationProvider>
        </LanguageProvider>
      </BookThemeProvider>
    </CopilotProvider>
  );
}
