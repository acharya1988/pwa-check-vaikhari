
'use client';

import React, { useActionState, useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Card, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import type { Bookmark } from '@/types';
import { toggleFavoriteBook } from '@/actions/profile.actions';
import { useToast } from '@/hooks/use-toast';

function UnfavoriteButton({ bookId }: { bookId: string }) {
    const [state, formAction] = useActionState(toggleFavoriteBook, null);
    const { toast } = useToast();

    useEffect(() => {
        if (state?.success) {
            toast({ description: state.message });
        }
        if (state?.error) {
            toast({ variant: 'destructive', description: state.error });
        }
    }, [state, toast]);

    return (
        <form action={formAction}>
            <input type="hidden" name="bookId" value={bookId} />
            <Button type="submit" variant="ghost" size="icon" className="absolute top-1 right-1 h-7 w-7 rounded-full bg-background/50 hover:bg-destructive/20 text-muted-foreground hover:text-destructive z-10">
                <X className="h-4 w-4" />
            </Button>
        </form>
    );
}


export function UserFavorites({ bookmarks }: { bookmarks: Bookmark[] }) {
    if (bookmarks.length === 0) {
        return (
            <div className="text-center py-12 border-2 border-dashed rounded-lg">
                <p className="text-muted-foreground">You haven't saved any books to your favorites yet.</p>
                <Button asChild variant="link" size="sm" className="mt-2">
                    <Link href="/admin/profile?tab=works">Browse works</Link>
                </Button>
            </div>
        );
    }
    
    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {bookmarks.map(bookmark => (
                <Card key={bookmark.id} className="group flex flex-col overflow-hidden relative">
                    <UnfavoriteButton bookId={bookmark.bookId!} />
                    <Link href={`/books/${bookmark.bookId}`} className="block overflow-hidden">
                        <div className="relative aspect-[3/4] w-full bg-muted">
                            {bookmark.profileUrl && (
                                <Image 
                                    src={bookmark.profileUrl} 
                                    alt={bookmark.bookName || ''} 
                                    fill 
                                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                                    sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 20vw"
                                    data-ai-hint="book cover"
                                />
                            )}
                        </div>
                    </Link>
                    <CardFooter className="p-2 flex-col items-start bg-background/90 z-10 mt-auto">
                        <Link href={`/books/${bookmark.bookId}`} className="flex-1 pr-2 w-full">
                            <p className="font-semibold text-sm leading-tight hover:underline truncate">{bookmark.bookName}</p>
                        </Link>
                    </CardFooter>
                </Card>
            ))}
        </div>
    );
}
