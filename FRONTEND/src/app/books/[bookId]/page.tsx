
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getBookContent } from '@/services/book.service';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChapterBrowser } from '@/components/chapter-browser';
import { ArrowLeft, BookOpenCheck } from 'lucide-react';
import { AddToFavoritesButton } from './add-to-favorites-button';
import { getUserProfile } from '@/services/user.service';
import { getBookmarksForUser } from '@/services/user.service';

export default async function ExploreBookPage({ params: { bookId } }: { params: { bookId: string } }) {
    const book = await getBookContent(bookId);

    if (!book) {
        notFound();
    }

    const user = await getUserProfile();
    const bookmarks = await getBookmarksForUser(user.email);
    const isFavorited = bookmarks.some(b => b.type === 'book' && b.bookId === bookId);

    const firstArticle = book.chapters?.[0]?.articles?.[0];
    const readNowLink = firstArticle ? `/articles/${book.bookId}/${book.chapters[0].id}/${firstArticle.verse}` : `/admin/living-document?bookId=${book.bookId}`;

    return (
        <div className="space-y-8">
             <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <Button asChild variant="link" className="p-0 text-muted-foreground">
                    <Link href="/admin/profile">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Bookshelf
                    </Link>
                </Button>
            </div>

            <div className="relative h-80 w-full bg-muted">
                {book.coverUrl && <Image src={book.coverUrl} alt={`${book.bookName} cover`} className="h-full w-full object-cover" width={1200} height={400} data-ai-hint="book cover background" />}
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-transparent" />
            </div>
            
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="relative flex items-end gap-6 -mt-24">
                    <div className="relative h-48 w-36 flex-shrink-0 rounded-md border-4 border-background bg-muted shadow-lg">
                        {book.profileUrl && <Image src={book.profileUrl} alt={`${book.bookName} profile`} className="h-full w-full object-cover rounded-sm" width={200} height={300} data-ai-hint="book cover" />}
                    </div>
                    <div className="pb-4 flex-1 flex flex-col sm:flex-row justify-between sm:items-end gap-4">
                        <div>
                            <h1 className="text-4xl font-bold font-devanagari">{book.bookName}</h1>
                            {book.subtitle && <p className="text-2xl text-muted-foreground">{book.subtitle}</p>}
                        </div>
                        <div className="flex items-center gap-2">
                            <AddToFavoritesButton bookId={book.bookId} isFavorited={isFavorited} />
                            <Button asChild>
                                <Link href={readNowLink}>
                                    <BookOpenCheck className="mr-2 h-4 w-4" />
                                    Read Now
                                </Link>
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

             <div className="container mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
                <Card>
                    <CardContent className="pt-6">
                        <h3 className="font-semibold text-lg">About this Book</h3>
                        {book.description ? (
                            <div 
                                className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground mt-2" 
                                dangerouslySetInnerHTML={{ __html: book.description }} 
                            />
                        ) : (
                            <p className="text-muted-foreground text-sm mt-2">No description provided.</p>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Content Structure</CardTitle>
                        <CardDescription>
                            Browse the chapters and articles within {book.bookName}.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ChapterBrowser chapters={book.chapters} bookId={book.bookId} />
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
