
'use client';

import React, { useState, useMemo, useEffect, useCallback, useActionState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Book,
  PanelLeft,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { getBooks, getBookContent } from '@/services/book.service';
import { getFullGlossary } from '@/services/glossary.service';
import { getBookmarksForUser } from '@/services/user.service';
import type { Book as BookInfo, BookContent as BookContentType, Chapter, Article, ContentBlock, GlossaryTerm, Bookmark, QuoteCategory, GlossaryCategory, Quote, BookTheme } from '@/types';
import { PublicArticleRenderer, ArticleHeader } from '@/components/public-article-renderer';
import { TextSelectionMenu } from '@/components/text-selection-menu';
import { UserCitationDialog } from '@/components/user-citation-dialog';
import { CreateQuoteDialog } from '@/components/admin/quote-forms';
import { CommentFormDialog } from '@/components/comment-form-dialog';
import { LivingDocumentSidebar } from '@/components/admin/living-document/living-document-sidebar';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { ALL_COMMENTARY_TYPES, getTypeLabelById } from '@/types';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetClose, SheetTrigger, SheetDescription } from '@/components/ui/sheet';
import type { Range } from '@tiptap/react';
import { Button } from '@/components/ui/button';
import { ChevronDown, Menu, X } from 'lucide-react';
import { ArticleMetadataBar } from '@/components/article-metadata-bar';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import { ReaderHeader } from '@/components/reader-header';
import { notFound } from 'next/navigation';
import { ArticleComments } from '@/components/article-comments';
import { handleArticleFeedback } from '@/app/articles/actions';
import { getQuoteData } from '@/services/quote.service';
import { getThemeForBook, getDefaultTheme } from '@/services/theme.service';
import { ThemeApplier } from '@/components/theme/ThemeApplier';
import { BookThemeProvider } from '@/components/theme/BookThemeContext';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { LivingDocumentReaderPage } from './living-document-page';
import { LanguageProvider } from '@/components/language-provider';

interface LivingDocumentClientProps {
  books: BookInfo[];
  initialBookContent: BookContentType | null;
  initialTheme: BookTheme;
  glossary: GlossaryTerm[];
  bookmarks: Bookmark[];
  defaultTheme: BookTheme;
  selectedBookId: string | null;
}

export function LivingDocumentClient({ 
    books, 
    initialBookContent,
    initialTheme,
    glossary,
    bookmarks: initialBookmarks,
    defaultTheme,
    selectedBookId: initialSelectedBookId,
}: LivingDocumentClientProps) {
  
  const router = useRouter();

  const [selectedBookContent, setSelectedBookContent] = useState<BookContentType | null>(initialBookContent);
  const [activeTheme, setActiveTheme] = useState<BookTheme>(initialTheme);
  const [isLoading, setIsLoading] = useState(false);

  const selectedBookId = selectedBookContent?.bookId || initialSelectedBookId;

  const handleSelectBook = useCallback(async (bookId: string) => {
    setIsLoading(true);
    router.push(`/admin/living-document?bookId=${bookId}`);
    try {
      const [content, theme] = await Promise.all([
        getBookContent(bookId),
        getThemeForBook(bookId),
      ]);
      
      setSelectedBookContent(content);
      setActiveTheme(theme || defaultTheme);
    } catch (error) {
      console.error("Failed to load book data:", error);
    } finally {
      setIsLoading(false);
    }
  }, [router, defaultTheme]);
  
  if (isLoading) {
    return (
        <div className="flex h-screen w-full items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin" />
        </div>
    );
  }

  return (
    <LanguageProvider>
      <BookThemeProvider theme={activeTheme}>
          <LivingDocumentReaderPage
              books={books}
              selectedBookId={selectedBookId}
              onSelectBook={handleSelectBook}
              bookContent={selectedBookContent}
              glossary={glossary}
              bookmarks={initialBookmarks}
              isLoading={isLoading}
          />
      </BookThemeProvider>
    </LanguageProvider>
  );
}
