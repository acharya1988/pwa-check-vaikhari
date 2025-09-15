
'use client';

import { useState, useActionState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Button } from "@/components/ui/button";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import { Star, Eye, CalendarIcon, Library, LayoutGrid, List, BookOpenCheck, Bookmark } from 'lucide-react';
import type { BookWithStats, Bookmark } from '@/types';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { toggleFavoriteBook } from '@/actions/profile.actions';
import { useToast } from '@/hooks/use-toast';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { BookFormDialog } from '@/components/admin/profile-forms';
import { getBookCategories } from '@/services/book.service';

function FavoriteButton({ book, isFavorited }: { book: BookWithStats; isFavorited: boolean }) {
    const [state, formAction] = useActionState(toggleFavoriteBook, null);
    const { toast } = useToast();
    const [optimisticFavorited, setOptimisticFavorited] = useState(isFavorited);

    useEffect(() => {
        setOptimisticFavorited(isFavorited);
    }, [isFavorited]);

    useEffect(() => {
        if (state?.success) {
            toast({ description: state.message });
        }
        if (state?.error) {
            toast({ variant: 'destructive', title: 'Error', description: state.error });
            setOptimisticFavorited(isFavorited); // Revert on error
        }
    }, [state, toast, isFavorited]);

    const handleFormAction = (formData: FormData) => {
        setOptimisticFavorited(prev => !prev);
        formAction(formData);
    };
    
    return (
        <form action={handleFormAction}>
            <input type="hidden" name="bookId" value={book.id} />
             <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                         <Button type="submit" variant="ghost" size="sm">
                            <Bookmark className={cn("mr-2 h-4 w-4", optimisticFavorited && "fill-primary text-primary")} />
                            {optimisticFavorited ? 'Saved' : 'Save for Later'}
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>{optimisticFavorited ? 'Remove from Favorites' : 'Add to Favorites'}</p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        </form>
    );
}

function BookCard({ book, favoritedBookIds }: { book: BookWithStats, favoritedBookIds: Set<string | undefined> }) {
    const readNowLink = `/admin/living-document?bookId=${book.id}`; // Simplified link to reader

    return (
        <Card className="flex flex-col h-full overflow-hidden transition-shadow hover:shadow-xl">
            <Link href={`/books/${book.id}`} className="block group">
                <div className="relative aspect-[4/5] bg-muted">
                     <Image
                        src={book.profileUrl || 'https://placehold.co/400x500.png'}
                        alt={book.name}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        data-ai-hint="book cover"
                    />
                </div>
            </Link>
            <CardHeader className="p-4">
                <div className="flex items-center gap-1 text-xs text-amber-500">
                    {[...Array(5)].map((_, i) => (
                        <Star key={i} className={cn('h-4 w-4', i < Math.round(book.rating / 2) ? 'fill-amber-400' : 'fill-muted stroke-muted-foreground')} />
                    ))}
                    <span className="text-muted-foreground ml-1">({book.rating.toFixed(1)})</span>
                </div>
                <CardTitle className="text-lg leading-tight line-clamp-2">{book.name}</CardTitle>
                {book.authorName && <CardDescription>by {book.authorName}</CardDescription>}
            </CardHeader>
            <CardContent className="p-4 pt-0 flex-grow">
                 <p className="text-sm text-muted-foreground line-clamp-3">{book.shortDescription}</p>
            </CardContent>
            <CardFooter className="p-4 pt-0 flex flex-col gap-2 items-stretch">
                <div className="flex justify-between items-center text-xs text-muted-foreground">
                    {book.publishedAt && 
                        <div className="flex items-center gap-1.5">
                            <CalendarIcon className="h-3 w-3" />
                            <span>{format(new Date(book.publishedAt), 'MMM yyyy')}</span>
                        </div>
                    }
                    <div className="flex items-center gap-1.5">
                        <Eye className="h-3 w-3" />
                        <span>{book.views} views</span>
                    </div>
                </div>
                <div className="flex gap-2 w-full">
                     <Button asChild className="flex-1" variant="outline">
                        <Link href={`/books/${book.id}`}>Explore</Link>
                    </Button>
                    <Button asChild className="flex-1">
                        <Link href={readNowLink}>
                            <BookOpenCheck className="mr-2 h-4 w-4" />
                            Read Now
                        </Link>
                    </Button>
                </div>
            </CardFooter>
        </Card>
    )
}

function BookListItem({ book, favoritedBookIds }: { book: BookWithStats, favoritedBookIds: Set<string | undefined> }) {
    const readNowLink = `/admin/living-document?bookId=${book.id}`;
    return (
        <Card className="flex flex-col sm:flex-row overflow-hidden transition-shadow hover:shadow-lg">
            <div className="flex-shrink-0 sm:w-40 relative sm:h-auto h-48 bg-muted">
                <Image
                    src={book.profileUrl || 'https://placehold.co/400x600.png'}
                    alt={book.name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 100vw, 10rem"
                    data-ai-hint="book cover"
                />
            </div>
            <div className="flex flex-col flex-1">
                 <CardHeader className="p-4">
                    <div className="flex justify-between items-start">
                        <div>
                             <CardTitle className="text-lg leading-tight">{book.name}</CardTitle>
                            {book.authorName && <CardDescription>by {book.authorName}</CardDescription>}
                        </div>
                         <div className="flex items-center gap-1 text-xs text-amber-500">
                            {[...Array(5)].map((_, i) => (
                                <Star key={i} className={cn('h-4 w-4', i < Math.round(book.rating / 2) ? 'fill-amber-400' : 'fill-muted stroke-muted-foreground')} />
                            ))}
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-4 pt-0 flex-grow">
                    <p className="text-sm text-muted-foreground line-clamp-2">{book.shortDescription}</p>
                </CardContent>
                <CardFooter className="p-4 pt-0 flex justify-between items-end">
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        {book.publishedAt && 
                            <div className="flex items-center gap-1.5">
                                <CalendarIcon className="h-3 w-3" />
                                <span>{format(new Date(book.publishedAt), 'MMM yyyy')}</span>
                            </div>
                        }
                        <div className="flex items-center gap-1.5">
                            <Eye className="h-3 w-3" />
                            <span>{book.views} views</span>
                        </div>
                    </div>
                     <div className="flex gap-2">
                        <FavoriteButton book={book} isFavorited={favoritedBookIds.has(book.id)} />
                         <Button asChild className="flex-1" variant="outline">
                            <Link href={`/books/${book.id}`}>Explore</Link>
                        </Button>
                        <Button asChild className="flex-1">
                            <Link href={readNowLink}>Read Now</Link>
                        </Button>
                    </div>
                </CardFooter>
            </div>
        </Card>
    )
}

export function UserBookshelf({ books, bookmarks, isOwner = false }: { books: BookWithStats[], bookmarks: Bookmark[], isOwner?: boolean }) {
    const [view, setView] = useState<'grid' | 'list'>('grid');
    const [categories, setCategories] = useState<any[]>([]);
    const favoritedBookIds = useMemo(() => new Set(bookmarks.filter(b => b.type === 'book').map(b => b.bookId)), [bookmarks]);

    useEffect(() => {
        getBookCategories().then(setCategories);
    }, []);

    return (
        <div>
            <CardHeader className="flex-row items-center justify-between flex-wrap gap-4 px-0">
                <div>
                    <CardTitle>My Bookshelf</CardTitle>
                    <CardDescription>Explore the collected wisdom from your library of texts.</CardDescription>
                </div>
                 {isOwner && (
                    <BookFormDialog trigger={<Button>Create Book</Button>} categories={categories} />
                )}
            </CardHeader>
            <CardContent className="px-0">
                {books.length > 0 ? (
                    <div className="space-y-4">
                        <div className="flex justify-end">
                            <ToggleGroup type="single" value={view} onValueChange={(v) => { if (v) setView(v as any) }}>
                                <ToggleGroupItem value="grid" aria-label="Grid view"><LayoutGrid className="h-4 w-4" /></ToggleGroupItem>
                                <ToggleGroupItem value="list" aria-label="List view"><List className="h-4 w-4" /></ToggleGroupItem>
                            </ToggleGroup>
                        </div>
                        {view === 'grid' ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                                {books.map(book => <BookCard key={book.id} book={book} favoritedBookIds={favoritedBookIds} />)}
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {books.map(book => <BookListItem key={book.id} book={book} favoritedBookIds={favoritedBookIds} />)}
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="text-center py-12 border-2 border-dashed rounded-lg">
                        <Library className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">{isOwner ? "Your" : "This user's"} bookshelf is empty.</p>
                        {isOwner && (
                            <BookFormDialog 
                                trigger={<Button size="sm" className="mt-4">Add a book</Button>} 
                                categories={categories}
                            />
                        )}
                    </div>
                )}
            </CardContent>
        </div>
    );
}
