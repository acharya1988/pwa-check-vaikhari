

'use client';

import React, { useState, useEffect, useRef, useActionState } from 'react';
import Image from 'next/image';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Book, FileText, ChevronRight, ChevronLeft, LayoutGrid, List } from 'lucide-react';
import { getBooks, getBookContent, getBookCategories } from '@/services/book.service';
import { getStandaloneArticles } from '@/services/standalone-article.service';
import type { Book as BookInfo, BookContent as BookContentType, Chapter, Article, StandaloneArticle, BookCategory } from '@/types';
import { Card } from '../ui/card';
import { ToggleGroup, ToggleGroupItem } from '../ui/toggle-group';
import Link from 'next/link';

export interface AttachedWork {
  type: 'book-article' | 'standalone-article' | 'book';
  href: string;
  title: string;
  parentTitle?: string;
  coverUrl?: string;
  profileUrl?: string;
  description?: string;
}

interface AnnounceWorkDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onWorkSelected: (work: AttachedWork) => void;
}

export function AnnounceWorkDialog({ open, onOpenChange, onWorkSelected }: AnnounceWorkDialogProps) {
    const [view, setView] = useState<'root' | 'books' | 'standalone' | 'chapters'>('root');
    const [loading, setLoading] = useState(false);
    
    const [books, setBooks] = useState<BookInfo[]>([]);
    const [bookCategories, setBookCategories] = useState<BookCategory[]>([]);
    const [standaloneArticles, setStandaloneArticles] = useState<StandaloneArticle[]>([]);
    
    const [selectedBook, setSelectedBook] = useState<BookContentType | null>(null);
    const [chapterPath, setChapterPath] = useState<Chapter[]>([]);
    const [bookViewMode, setBookViewMode] = useState<'grid' | 'list'>('grid');

    useEffect(() => {
        if (open) {
            setLoading(true);
            Promise.all([getBooks(), getStandaloneArticles(), getBookCategories()]).then(([bookData, standaloneData, categoryData]) => {
                setBooks(bookData);
                setStandaloneArticles(standaloneData);
                setBookCategories(categoryData);
                setLoading(false);
            });
        } else {
            // Reset state on close
            setTimeout(() => {
                setView('root');
                setSelectedBook(null);
                setChapterPath([]);
            }, 300)
        }
    }, [open]);

    const handleSelectBook = async (bookId: string) => {
        setLoading(true);
        const content = await getBookContent(bookId);
        if (content) {
            setSelectedBook(content);
            setView('chapters');
        }
        setLoading(false);
    };

    const handleSelectChapter = (chapter: Chapter) => {
        setChapterPath(prev => [...prev, chapter]);
    };
    
    const handleBack = () => {
        if (chapterPath.length > 0) {
            setChapterPath(prev => prev.slice(0, -1));
        } else if (view === 'chapters') {
            setSelectedBook(null);
            setView('books');
        } else if (view === 'books' || view === 'standalone') {
            setView('root');
        }
    };
    
    const selectArticle = (article: Article) => {
        if (!selectedBook) return;
        const chapterForArticle = chapterPath.length > 0 
            ? chapterPath[chapterPath.length - 1] 
            : selectedBook.chapters.find(c => c.articles.some(a => a.verse === article.verse));

        if (!chapterForArticle) return;

        onWorkSelected({
            type: 'book-article',
            href: `/articles/${selectedBook.bookId}/${chapterForArticle.id}/${article.verse}`,
            title: article.title,
            parentTitle: selectedBook.bookName,
        });
        onOpenChange(false);
    }
    
    const selectBook = async (book: BookInfo) => {
        setLoading(true);
        const bookContent = await getBookContent(book.id);
        setLoading(false);

        if (bookContent) {
            const category = bookCategories.find(c => c.id === bookContent.categoryId);
            onWorkSelected({
                type: 'book',
                href: `/admin/books/${book.id}`,
                title: bookContent.bookName,
                parentTitle: category?.name,
                description: bookContent.description || bookContent.subtitle,
                coverUrl: bookContent.coverUrl,
                profileUrl: bookContent.profileUrl,
            });
            onOpenChange(false);
        }
    };

    const selectStandalone = (article: StandaloneArticle) => {
        onWorkSelected({
            type: 'standalone-article',
            href: `/admin/articles/edit/${article.id}`,
            title: article.title,
            parentTitle: article.type.charAt(0).toUpperCase() + article.type.slice(1),
        });
        onOpenChange(false);
    }
    
    const hasSubItems = (chapter: Chapter) => (chapter.children && chapter.children.length > 0) || (chapter.articles && chapter.articles.length > 0)

    const renderContent = () => {
        if(loading) return <div className="flex justify-center items-center h-48"><Loader2 className="h-8 w-8 animate-spin" /></div>;

        if (view === 'chapters' && selectedBook) {
            const currentChapter = chapterPath.length > 0 ? chapterPath[chapterPath.length - 1] : null;
            const itemsToBrowse = currentChapter || selectedBook;
            const chaptersToShow = 'chapters' in itemsToBrowse ? itemsToBrowse.chapters : (itemsToBrowse.children || []);
            const articlesToShow = 'articles' in itemsToBrowse ? itemsToBrowse.articles : [];

             return (
                 <div className="space-y-2">
                    {articlesToShow?.map(article => (
                        <Button key={String(article.verse)} variant="outline" className="w-full justify-start font-semibold" onClick={() => selectArticle(article)}>{article.title}</Button>
                    ))}
                    {chaptersToShow?.map((chapter: Chapter) => (
                        <Button key={String(chapter.id)} variant="ghost" className="w-full justify-between" onClick={() => handleSelectChapter(chapter)} disabled={!hasSubItems(chapter)}>
                            {chapter.name} <ChevronRight className="h-4 w-4" />
                        </Button>
                    ))}
                </div>
             )
        }
        
        if (view === 'books') {
             if (bookViewMode === 'list') {
                return (
                    <div className="space-y-2">
                        {books.map(book => (
                            <div key={book.id} className="flex items-center gap-2 rounded-md border p-2">
                                <div className="w-10 h-14 relative flex-shrink-0">
                                    <Image 
                                        src={book.profileUrl || 'https://placehold.co/400x600.png'} 
                                        alt={book.name} 
                                        fill 
                                        className="object-cover rounded-sm"
                                        sizes="40px"
                                        data-ai-hint="book cover"
                                    />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-semibold truncate">{book.name}</p>
                                </div>
                                <div className="flex items-center gap-1">
                                    <Button size="sm" variant="secondary" onClick={() => selectBook(book)}>Announce</Button>
                                    <Button size="sm" variant="outline" onClick={() => handleSelectBook(book.id)}>Select Chapter</Button>
                                </div>
                            </div>
                        ))}
                    </div>
                );
            }
            return (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {books.map(book => 
                        <Card key={book.id} className="group overflow-hidden">
                            <div 
                                className="relative aspect-[3/4] w-full bg-muted cursor-pointer"
                                onClick={() => handleSelectBook(book.id)}
                                title={`Select articles from ${book.name}`}
                            >
                                {book.profileUrl && (
                                    <Image 
                                        src={book.profileUrl} 
                                        alt={book.name} 
                                        fill 
                                        className="object-cover group-hover:scale-105 transition-transform"
                                        sizes="(max-width: 640px) 50vw, 33vw"
                                        data-ai-hint="book cover"
                                    />
                                )}
                                 <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <p className="text-white text-xs font-bold">{book.name}</p>
                                </div>
                            </div>
                            <div className="p-1">
                                <Button size="sm" variant="secondary" className="w-full h-auto text-xs py-1" onClick={() => selectBook(book)}>
                                    Announce This Book
                                </Button>
                            </div>
                        </Card>
                    )}
                </div>
            )
        }

        if (view === 'standalone') {
             return (
                 <div className="space-y-2">
                    {standaloneArticles.map(article => <Button key={article.id} variant="ghost" className="w-full justify-start" onClick={() => selectStandalone(article)}>{article.title}</Button>)}
                </div>
            )
        }

        return (
            <div className="grid grid-cols-2 gap-4">
                <Button variant="outline" className="h-24 flex-col gap-2" onClick={() => setView('books')}><Book className="h-8 w-8" /> Book Content</Button>
                <Button variant="outline" className="h-24 flex-col gap-2" onClick={() => setView('standalone')}><FileText className="h-8 w-8" /> Standalone Articles</Button>
            </div>
        )
    }
    
    const currentTitle = chapterPath.length > 0
      ? chapterPath[chapterPath.length - 1].name
      : selectedBook?.bookName || 'Announce Work';


    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <div className="flex items-center justify-between">
                        <DialogTitle className="flex items-center gap-2">
                           {(view !== 'root') && <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleBack}><ChevronLeft className="h-4 w-4" /></Button>}
                            {currentTitle}
                        </DialogTitle>
                        {view === 'books' && (
                            <ToggleGroup type="single" value={bookViewMode} onValueChange={(v) => { if (v) setBookViewMode(v as any)}}>
                                <ToggleGroupItem value="grid" aria-label="Grid view"><LayoutGrid className="h-4 w-4" /></ToggleGroupItem>
                                <ToggleGroupItem value="list" aria-label="List view"><List className="h-4 w-4" /></ToggleGroupItem>
                            </ToggleGroup>
                        )}
                    </div>
                    <DialogDescription>Select a piece of your work to attach to your post.</DialogDescription>
                </DialogHeader>
                <ScrollArea className="h-72 border rounded-md p-2">
                    {renderContent()}
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
}
