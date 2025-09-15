
'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, NotebookText, Book, MessageSquare, FileText, LayoutGrid, List } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Transliterate, TransliterationProvider } from '@/components/transliteration-provider';
import type { Bookmark, StandaloneArticle } from '@/types';
import { stripHtml } from '@/services/service-utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

function NoteCard({ note }: { note: Bookmark }) {
  let contextLink = '/';
  if (note.type === 'book' || (note.type === 'block' && note.chapterId)) {
    contextLink = `/articles/${note.bookId}/${note.chapterId}/${note.verse}`;
  } else if (note.type === 'standalone-article' || (note.type === 'block' && note.bookId && !note.chapterId)) {
    contextLink = `/admin/articles/edit/${note.bookId}`;
  } else if (note.type === 'post') {
      contextLink = `/admin/profile?tab=wall`; // General link for now
  }

  return (
    <Card>
        <CardHeader>
            <CardTitle className="text-base font-semibold">{note.articleTitle || note.bookName}</CardTitle>
            <CardDescription>
                Note on a block from {note.bookName}
            </CardDescription>
        </CardHeader>
        <CardContent>
            {note.blockTextPreview && (
                 <blockquote className="border-l-2 pl-3 italic text-sm text-muted-foreground mb-2">
                    <Transliterate>{stripHtml(note.blockTextPreview)}...</Transliterate>
                </blockquote>
            )}
            <p className="text-sm">{note.note}</p>
        </CardContent>
        <CardFooter className="flex justify-between items-center text-xs text-muted-foreground">
            <span>
                Noted {formatDistanceToNow(new Date(note.createdAt), { addSuffix: true })}
            </span>
             <Button asChild variant="ghost" size="sm">
                <Link href={contextLink}>
                    View Context <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
            </Button>
        </CardFooter>
    </Card>
  );
}

function NoteListItem({ note }: { note: Bookmark }) {
    let contextLink = '/';
    if (note.type === 'book' || (note.type === 'block' && note.chapterId)) {
        contextLink = `/articles/${note.bookId}/${note.chapterId}/${note.verse}`;
    } else if (note.type === 'standalone-article' || (note.type === 'block' && note.bookId && !note.chapterId)) {
        contextLink = `/admin/articles/edit/${note.bookId}`;
    } else if (note.type === 'post') {
        contextLink = `/admin/profile?tab=wall`;
    }

    return (
        <TableRow>
            <TableCell>
                <p className="font-semibold">{note.note}</p>
                {note.blockTextPreview && (
                    <blockquote className="border-l-2 pl-2 italic text-xs text-muted-foreground mt-1">
                        <Transliterate>{stripHtml(note.blockTextPreview)}...</Transliterate>
                    </blockquote>
                )}
            </TableCell>
            <TableCell>{note.articleTitle || note.bookName}</TableCell>
            <TableCell className="text-right text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(note.createdAt), { addSuffix: true })}
            </TableCell>
            <TableCell className="text-right">
                 <Button asChild variant="ghost" size="sm">
                    <Link href={contextLink}>View</Link>
                </Button>
            </TableCell>
        </TableRow>
    )
}

function NotesDisplay({ notes, view }: { notes: Bookmark[], view: 'grid' | 'list' }) {
    if (notes.length === 0) {
        return (
            <div className="text-center py-12 border-2 border-dashed rounded-lg">
                <NotebookText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No notes found in this category.</p>
            </div>
        );
    }
    
    if (view === 'list') {
        return (
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Note</TableHead>
                        <TableHead>Context</TableHead>
                        <TableHead className="text-right">Date</TableHead>
                        <TableHead className="w-[80px]"></TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {notes.map(note => <NoteListItem key={note.id} note={note} />)}
                </TableBody>
            </Table>
        )
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {notes.map(note => <NoteCard key={note.id} note={note} />)}
        </div>
    );
}

const noteCategories = [
    { id: 'book', label: 'Book Notes', icon: Book },
    { id: 'discussion', label: 'Discussion Notes', icon: MessageSquare },
    { id: 'post', label: 'Post Notes', icon: MessageSquare },
    { id: 'article', label: 'Article Notes', icon: FileText },
    { id: 'whitepaper', label: 'White Paper Notes', icon: FileText },
    { id: 'abstract', label: 'Abstract Notes', icon: FileText },
    { id: 'uncategorized', label: 'Uncategorized', icon: NotebookText },
];

export function MyNotesClient({ notes, standaloneArticles }: { notes: Bookmark[], standaloneArticles: StandaloneArticle[] }) {
  const [view, setView] = useState<'grid' | 'list'>('grid');
  
  const standaloneArticleMap = useMemo(() => {
    const map = new Map<string, StandaloneArticle>();
    standaloneArticles.forEach(article => map.set(article.id, article));
    return map;
  }, [standaloneArticles]);

  const categorizedNotes = useMemo(() => {
        const groups: Record<string, Bookmark[]> = {
            book: [],
            discussion: [],
            post: [],
            article: [],
            whitepaper: [],
            abstract: [],
            uncategorized: [],
        };

        notes.forEach(note => {
            if (note.type === 'book' || (note.type === 'block' && note.chapterId)) {
                groups.book.push(note);
            } else if (note.type === 'block' && note.bookId && standaloneArticleMap.has(note.bookId)) {
                const article = standaloneArticleMap.get(note.bookId);
                if (article) {
                    if (article.type === 'whitepaper') groups.whitepaper.push(note);
                    else if (article.type === 'abstract') groups.abstract.push(note);
                    else groups.article.push(note);
                } else {
                    groups.uncategorized.push(note);
                }
            } else if (note.type === 'post') {
                groups.post.push(note);
            } else {
                groups.uncategorized.push(note);
            }
        });

        return groups;
  }, [notes, standaloneArticleMap]);


  if (notes.length === 0) {
    return (
      <div className="text-center py-12 border-2 border-dashed rounded-lg">
        <NotebookText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-muted-foreground">You haven't made any notes yet.</p>
        <p className="text-sm mt-1">Select text within the Living Document to add a note.</p>
      </div>
    );
  }

  return (
    <TransliterationProvider>
        <div className="flex justify-end mb-4">
            <ToggleGroup type="single" value={view} onValueChange={(v) => { if (v) setView(v as any) }}>
                <ToggleGroupItem value="grid" aria-label="Grid view"><LayoutGrid className="h-4 w-4" /></ToggleGroupItem>
                <ToggleGroupItem value="list" aria-label="List view"><List className="h-4 w-4" /></ToggleGroupItem>
            </ToggleGroup>
        </div>
        <Tabs defaultValue="book" className="w-full">
            <TabsList className="grid w-full grid-cols-7">
                {noteCategories.map(cat => {
                    const notesForCat = categorizedNotes[cat.id] || [];
                    return (
                         <TabsTrigger key={cat.id} value={cat.id} className="text-xs font-bold px-2">
                            {cat.label} ({notesForCat.length})
                        </TabsTrigger>
                    )
                })}
            </TabsList>
            
            {noteCategories.map(cat => {
                 const notesForCat = categorizedNotes[cat.id] || [];
                 return (
                    <TabsContent key={cat.id} value={cat.id} className="mt-6">
                       <NotesDisplay notes={notesForCat} view={view} />
                    </TabsContent>
                 )
            })}
        </Tabs>
    </TransliterationProvider>
  );
}
