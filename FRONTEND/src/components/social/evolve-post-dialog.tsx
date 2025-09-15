
'use client';

import React, { useState, useEffect, useRef, useActionState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectGroup, SelectLabel, SelectItem } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ArrowRight } from 'lucide-react';
import type { Post, Book, StandaloneArticleCategory } from '@/types';
import { getBooks } from '@/services/book.service';
import { getStandaloneArticleCategories } from '@/services/standalone-article.service';
import { createStandaloneArticle } from '@/actions/standalone-article.actions';
import { createArticle } from '@/actions/book.actions';

interface EvolvePostDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    post: Post;
}

export function EvolvePostDialog({ open, onOpenChange, post }: EvolvePostDialogProps) {
    const [view, setView] = useState<'root' | 'standalone' | 'book'>('root');
    const [books, setBooks] = useState<Book[]>([]);
    const [categories, setCategories] = useState<StandaloneArticleCategory[]>([]);
    const router = useRouter();
    
    useEffect(() => {
        if (open) {
            getBooks().then(setBooks);
            getStandaloneArticleCategories().then(setCategories);
        }
    }, [open]);

    const handleReset = () => {
        onOpenChange(false);
        setTimeout(() => setView('root'), 300);
    };

    return (
        <Dialog open={open} onOpenChange={handleReset}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Evolve Post</DialogTitle>
                    <DialogDescription>
                        {view === 'root' ? 'Choose how to evolve this post.' : 'Provide the necessary details.'}
                    </DialogDescription>
                </DialogHeader>

                {view === 'root' && (
                    <div className="grid grid-cols-2 gap-4 pt-4">
                        <Button variant="outline" className="h-24 text-base" onClick={() => setView('standalone')}>
                            Into Standalone Article
                        </Button>
                        <Button variant="outline" className="h-24 text-base" onClick={() => setView('book')}>
                            Into Book Chapter
                        </Button>
                    </div>
                )}
                
                {view === 'standalone' && (
                    <StandaloneForm post={post} categories={categories} onComplete={handleReset} />
                )}

                {view === 'book' && (
                    <BookChapterForm post={post} books={books} onComplete={handleReset} />
                )}

            </DialogContent>
        </Dialog>
    );
}

function StandaloneForm({ post, categories, onComplete }: { post: Post, categories: StandaloneArticleCategory[], onComplete: () => void }) {
    const [state, formAction] = useActionState(createStandaloneArticle, null);
    const { toast } = useToast();
    const router = useRouter();

    useEffect(() => {
        if (state?.success && state.redirectPath) {
            toast({ description: "Article created from post." });
            onComplete();
            router.push(state.redirectPath);
        }
        if (state?.error) {
            toast({ variant: 'destructive', title: "Error", description: state.error });
        }
    }, [state, toast, onComplete, router]);

    return (
        <form action={formAction} className="space-y-4 pt-4">
            <input type="hidden" name="content" value={post.content} />
            <input type="hidden" name="type" value="article" />
            <input type="hidden" name="sourcePostId" value={post.id} />
            <div>
                <Label htmlFor="title">Article Title</Label>
                <Input id="title" name="title" required />
            </div>
            <div>
                <Label htmlFor="categoryId">Category</Label>
                <Select name="categoryId" required>
                    <SelectTrigger><SelectValue placeholder="Select a category" /></SelectTrigger>
                    <SelectContent>
                        {categories.map(cat => <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>
            <DialogFooter>
                 <Button type="submit">Create Article</Button>
            </DialogFooter>
        </form>
    );
}

function BookChapterForm({ post, books, onComplete }: { post: Post, books: Book[], onComplete: () => void }) {
    const [state, formAction] = useActionState(createArticle, null);
    const { toast } = useToast();
    const router = useRouter();
    const [selectedBookId, setSelectedBookId] = useState<string>('');

    useEffect(() => {
        if (state?.success && state.redirectPath) {
            toast({ description: "Book article created from post." });
            onComplete();
            router.push(state.redirectPath);
        }
        if (state?.error) {
            toast({ variant: 'destructive', title: "Error", description: state.error });
        }
    }, [state, toast, onComplete, router]);
    
    return (
        <form action={formAction} className="space-y-4 pt-4">
            <input type="hidden" name="content" value={post.content} />
            <div>
                <Label htmlFor="bookId">Book</Label>
                <Select name="bookId" required onValueChange={setSelectedBookId}>
                    <SelectTrigger><SelectValue placeholder="Select a book" /></SelectTrigger>
                    <SelectContent>
                        {books.map(book => <SelectItem key={book.id} value={book.id}>{book.name}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>
            {selectedBookId && (
                <>
                     <div>
                        <Label htmlFor="chapterId">Chapter</Label>
                        <p className="text-xs text-muted-foreground">This feature is simplified. In a full implementation, you'd select a chapter here.</p>
                        <Input id="chapterId" name="chapterId" required placeholder="Enter Chapter ID manually for now" />
                    </div>
                     <div>
                        <Label htmlFor="title">New Article Title</Label>
                        <Input id="title" name="title" required />
                    </div>
                     <div>
                        <Label htmlFor="verse">Verse Number/ID</Label>
                        <Input id="verse" name="verse" required />
                    </div>
                </>
            )}
            <DialogFooter>
                <Button type="submit" disabled={!selectedBookId}>Create Article in Book</Button>
            </DialogFooter>
        </form>
    );
}
