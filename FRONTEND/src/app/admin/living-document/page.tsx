
import { getBooks, getBookContent } from '@/services/book.service';
import { getFullGlossary } from '@/services/glossary.service';
import { getBookmarksForUser } from '@/services/user.service';
import { getThemeForBook, getDefaultTheme } from '@/services/theme.service';
import type { Book, BookContent, GlossaryTerm, Bookmark } from '@/types';
import { LivingDocumentClient } from '@/components/admin/living-document/living-document-client';
import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { LoadingAnimation } from '@/components/loading-animation';

async function LivingDocumentPageLoader({ bookId }: { bookId?: string }) {
    const [books, glossary, bookmarks, defaultTheme] = await Promise.all([
        getBooks(),
        getFullGlossary(),
        getBookmarksForUser('default-user'), // Assuming a default user
        getDefaultTheme(),
    ]);

    let initialBookContent: BookContent | null = null;
    let initialTheme = defaultTheme;
    let targetBookId = bookId || books[0]?.id;

    if (!targetBookId && books.length > 0) {
        targetBookId = books[0].id;
    }
    
    if (targetBookId) {
        initialBookContent = await getBookContent(targetBookId);
        const bookTheme = await getThemeForBook(targetBookId);
        initialTheme = bookTheme || defaultTheme;
    }
    
    if (targetBookId && !initialBookContent) {
        // This can happen if the bookId in URL is invalid.
        // Instead of notFound, perhaps redirect to the base page or show an error.
        // For now, we'll let it pass null to the client to handle.
    }

    return (
        <LivingDocumentClient
            books={books}
            initialBookContent={initialBookContent}
            initialTheme={initialTheme}
            glossary={glossary}
            bookmarks={bookmarks}
            defaultTheme={defaultTheme}
            selectedBookId={targetBookId || null}
        />
    );
}

export default async function LivingDocumentPage({ searchParams }: { searchParams: Promise<{ bookId?: string }> }) {
    const { bookId } = await searchParams;

    return (
        <Suspense fallback={<LoadingAnimation />}>
            <LivingDocumentPageLoader bookId={bookId} />
        </Suspense>
    );
}
