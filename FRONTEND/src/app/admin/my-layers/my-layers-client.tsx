
'use client';

import React, { useState, useEffect, useCallback, useActionState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { LayoutGrid, List, Layers, MoreVertical, Edit, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { stripHtml } from '@/services/service-utils';
import { Transliterate, TransliterationProvider } from '@/components/transliteration-provider';
import type { LayerAnnotation } from '@/types';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Button } from '@/components/ui/button';
import { deleteLayer, updateLayer } from '@/actions/layer.actions';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import dynamic from 'next/dynamic';
import { EditorToolbar } from '@/components/admin/editor/toolbar';
import type { Editor } from '@tiptap/react';

const RichTextEditor = dynamic(() => import('@/components/admin/rich-text-editor').then(mod => mod.RichTextEditor), { 
    ssr: false, 
    loading: () => <div className="prose-styling min-h-[120px] w-full rounded-md border border-input bg-transparent px-3 py-2 animate-pulse" /> 
});


interface GroupedLayers {
    [bookId: string]: {
        bookName: string;
        chapters: {
            [chapterId: string]: {
                chapterName: string;
                articles: {
                    [verse: string]: {
                        articleTitle: string;
                        layers: LayerAnnotation[];
                    }
                }
            }
        }
    }
}

function EditLayerDialog({ layer, onLayerUpdated }: { layer: LayerAnnotation, onLayerUpdated: () => void }) {
    const [open, setOpen] = useState(false);
    const [state, formAction] = useActionState(updateLayer, null);
    const [content, setContent] = useState(layer.content);
    const [editor, setEditor] = useState<Editor | null>(null);
    const { toast } = useToast();

    useEffect(() => {
        if (state?.success) {
            toast({ title: "Success!", description: "Layer updated." });
            onLayerUpdated();
            setOpen(false);
        }
        if (state?.error) {
            toast({ variant: 'destructive', title: 'Error', description: state.error });
        }
    }, [state, toast, onLayerUpdated]);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DropdownMenuItem onSelect={e => e.preventDefault()} onClick={() => setOpen(true)}>
                <Edit className="mr-2 h-4 w-4" /> Edit Layer
            </DropdownMenuItem>
            <DialogContent className="sm:max-w-3xl">
                <DialogHeader>
                    <DialogTitle>Edit Layer</DialogTitle>
                </DialogHeader>
                <form action={formAction}>
                    <input type="hidden" name="layerId" value={layer.id} />
                    <input type="hidden" name="content" value={content} />
                    <div className="space-y-4 my-4">
                        <blockquote className="border-l-2 pl-3 italic text-sm text-muted-foreground">
                           <Transliterate>{stripHtml(layer.blockSanskrit || '')}</Transliterate>
                        </blockquote>
                        <div className="border rounded-md">
                            <EditorToolbar editor={editor} />
                            <RichTextEditor
                                id={`edit-layer-${layer.id}`}
                                content={content}
                                onChange={setContent}
                                setEditorInstance={(id, ed) => setEditor(ed)}
                                removeEditorInstance={() => setEditor(null)}
                                placeholder="Edit your annotation..."
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <DialogClose asChild><Button variant="ghost">Cancel</Button></DialogClose>
                        <Button type="submit">Save Changes</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}

function LayerActions({ layer, onLayerDeleted, onLayerUpdated }: { layer: LayerAnnotation, onLayerDeleted: () => void, onLayerUpdated: () => void }) {
    const [state, formAction] = useActionState(deleteLayer, null);
    const { toast } = useToast();
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);

    useEffect(() => {
        if (state?.success) {
            toast({ title: 'Success', description: 'Layer deleted.' });
            onLayerDeleted();
            setIsDeleteOpen(false);
        }
        if (state?.error) {
            toast({ variant: 'destructive', title: 'Error', description: state.error });
        }
    }, [state, toast, onLayerDeleted]);

    return (
        <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                     <Button variant="ghost" size="icon" className="h-7 w-7 flex-shrink-0">
                        <MoreVertical className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                    <EditLayerDialog layer={layer} onLayerUpdated={onLayerUpdated} />
                    <AlertDialogTrigger asChild>
                        <DropdownMenuItem onSelect={e => e.preventDefault()} className="text-destructive focus:text-destructive">
                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                        </DropdownMenuItem>
                    </AlertDialogTrigger>
                </DropdownMenuContent>
            </DropdownMenu>
             <AlertDialogContent>
                <form action={formAction}>
                    <input type="hidden" name="layerId" value={layer.id} />
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>This will permanently delete this layer. This action cannot be undone.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <Button type="submit" variant="destructive">Delete</Button>
                    </AlertDialogFooter>
                </form>
            </AlertDialogContent>
        </AlertDialog>
    );
}

function LayerCard({ layer, onLayerAction }: { layer: LayerAnnotation, onLayerAction: () => void }) {
    return (
        <Card className="flex flex-col h-full hover:shadow-lg transition-shadow">
            <CardHeader>
                 <div className="flex justify-between items-start">
                    <CardTitle className="text-base flex-1 pr-2">{layer.articleTitle}</CardTitle>
                    <LayerActions layer={layer} onLayerDeleted={onLayerAction} onLayerUpdated={onLayerAction} />
                </div>
                <CardDescription>
                    From: {layer.bookName}, {layer.chapterName}
                </CardDescription>
            </CardHeader>
            <CardContent className="flex-grow space-y-2">
                 <blockquote className="border-l-2 pl-3 italic text-sm text-muted-foreground line-clamp-2">
                    <Transliterate>{stripHtml(layer.blockSanskrit || '')}</Transliterate>
                </blockquote>
                <div className="prose prose-sm dark:prose-invert max-w-none line-clamp-3" dangerouslySetInnerHTML={{ __html: layer.content }} />
            </CardContent>
            <CardFooter>
                 <Button asChild variant="secondary" size="sm">
                    <Link href={`/articles/${layer.bookId}/${layer.chapterId}/${layer.verse}`}>View Context</Link>
                </Button>
            </CardFooter>
        </Card>
    );
}

export function MyLayersClient({ groupedLayers: initialGroupedLayers, totalLayers: initialTotalLayers }: { groupedLayers: GroupedLayers; totalLayers: number }) {
    const [view, setView] = useState<'grid' | 'list'>('grid');
    const [groupedLayers, setGroupedLayers] = useState(initialGroupedLayers);
    const [totalLayers, setTotalLayers] = useState(initialTotalLayers);

    const onLayerAction = () => {
        // A simple way to refresh data is to re-trigger the server component's fetch.
        // In a more complex app, we might update state locally.
        window.location.reload(); 
    };

    const allLayers = React.useMemo(() => {
        return Object.values(groupedLayers)
            .flatMap(book => Object.values(book.chapters)
            .flatMap(chapter => Object.values(chapter.articles)
            .flatMap(article => article.layers)));
    }, [groupedLayers]);
    
    return (
        <TransliterationProvider>
            <div className="container mx-auto max-w-5xl py-8">
                <div className="mb-6 flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold">My Layers</h1>
                        <p className="text-muted-foreground">
                        Here are all the annotations and layers you've added across various texts, organized by book.
                        </p>
                    </div>
                     <ToggleGroup type="single" value={view} onValueChange={(v) => { if (v) setView(v as any) }}>
                        <ToggleGroupItem value="grid" aria-label="Grid view"><LayoutGrid className="h-4 w-4" /></ToggleGroupItem>
                        <ToggleGroupItem value="list" aria-label="List view"><List className="h-4 w-4" /></ToggleGroupItem>
                    </ToggleGroup>
                </div>
                
                {Object.keys(groupedLayers).length > 0 ? (
                    view === 'list' ? (
                        <Card>
                            <CardHeader>
                                <CardTitle>Your Annotations ({totalLayers})</CardTitle>
                            </CardHeader>
                            <CardContent>
                                 <Accordion type="multiple" className="w-full space-y-4">
                                    {Object.entries(groupedLayers).map(([bookId, bookData]) => (
                                        <AccordionItem value={bookId} key={bookId} className="border rounded-lg">
                                            <AccordionTrigger className="p-4 font-bold text-lg hover:no-underline">
                                                {bookData.bookName}
                                            </AccordionTrigger>
                                            <AccordionContent className="p-4 pt-0">
                                                <Accordion type="multiple" className="w-full space-y-2">
                                                    {Object.entries(bookData.chapters).map(([chapterId, chapterData]) => (
                                                        <AccordionItem value={chapterId} key={chapterId} className="border rounded-md bg-muted/50">
                                                            <AccordionTrigger className="p-3 font-semibold text-md hover:no-underline">
                                                                {chapterData.chapterName}
                                                            </AccordionTrigger>
                                                            <AccordionContent className="p-4 pt-0 bg-background rounded-b-md">
                                                                <div className="space-y-4">
                                                                    {Object.entries(chapterData.articles).map(([verse, articleData]) => (
                                                                        <div key={verse} className="pt-4 border-t first:border-t-0 first:pt-0">
                                                                            <h4 className="font-semibold text-base mb-2">
                                                                                <Link href={`/articles/${bookId}/${chapterId}/${verse}`} className="hover:underline">
                                                                                    {articleData.articleTitle}
                                                                                </Link>
                                                                            </h4>
                                                                            <div className="space-y-4">
                                                                                {articleData.layers.map(layer => (
                                                                                    <div key={layer.id} className="pl-4 border-l-2 relative group">
                                                                                         <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                                            <LayerActions layer={layer} onLayerDeleted={onLayerAction} onLayerUpdated={onLayerAction} />
                                                                                        </div>
                                                                                        <blockquote className="border-l-2 pl-3 italic text-sm text-muted-foreground mb-2">
                                                                                            <Transliterate>{stripHtml(layer.blockSanskrit || '')}</Transliterate>
                                                                                        </blockquote>
                                                                                        <div className="prose prose-sm dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: layer.content }} />
                                                                                    </div>
                                                                                ))}
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </AccordionContent>
                                                        </AccordionItem>
                                                    ))}
                                                </Accordion>
                                            </AccordionContent>
                                        </AccordionItem>
                                    ))}
                                </Accordion>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {allLayers.map(layer => <LayerCard key={layer.id} layer={layer} onLayerAction={onLayerAction} />)}
                        </div>
                    )
                ) : (
                    <div className="text-center py-12 border-2 border-dashed rounded-lg">
                        <Layers className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">You haven't created any layers yet.</p>
                        <p className="text-sm mt-1">Select text within an article to add your first layer.</p>
                    </div>
                )}
            </div>
        </TransliterationProvider>
    );
}
