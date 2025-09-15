

'use client';

import React, { useActionState, useState, useEffect, useCallback } from 'react';
import { useParams, useRouter, notFound } from 'next/navigation';
import Link from 'next/link';
import { useFormStatus } from 'react-dom';
import type { Editor, Range } from '@tiptap/react';
import { getBookContent } from '@/services/book.service';
import { getQuoteData } from '@/services/quote.service';
import { createArticle } from '@/actions/book.actions';
import type { ContentBlock, BookContent, Chapter, BookStructure, Quote, QuoteCategory, GlossaryCategory } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { EditorNotesDisplay } from '@/components/admin/editor/notes-display';
import { CommentaryDialog, AddBlockDialog, SourceInfoDialog } from '@/components/admin/profile-forms';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetDescription } from '@/components/ui/sheet';
import { Loader2, Save, List, ArrowLeft, Trash2, Plus, Eye, ChevronLeft, ChevronRight, Menu } from 'lucide-react';
import { ALL_COMMENTARY_TYPES, getTypeLabelById } from '@/types';
import { Separator } from '@/components/ui/separator';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { ArticleRenderer } from '@/components/article-renderer';
import dynamic from 'next/dynamic';
import { IntellicitePanel } from '@/components/admin/intellicite-panel';
import { cn } from '@/lib/utils';
import { ArticleTocDisplay } from '@/components/admin/book-forms';
import { EditorToolbar } from '@/components/admin/editor/toolbar';
import { CreateQuoteDialog } from '@/components/admin/quote-forms';
import { useIsMobile } from '@/hooks/use-mobile';


const RichTextEditor = dynamic(() => import('@/components/admin/rich-text-editor').then(mod => mod.RichTextEditor), { 
    ssr: false, 
    loading: () => <div className="prose-styling min-h-[120px] w-full rounded-md border border-input bg-transparent px-3 py-2 animate-pulse" /> 
});

type CreateArticleState = {
    error?: string;
    fieldErrors?: any;
    success?: boolean;
    redirectPath?: string;
}

function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" size="sm" disabled={pending}>
            {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Create Article
        </Button>
    );
}

export default function CreateArticlePage() {
    const params = useParams();
    const router = useRouter();
    const { toast } = useToast();
    const isMobile = useIsMobile();
    
    const bookId = params.bookId as string;
    const chapterId = params.chapterId as string;

    const [bookData, setBookData] = useState<BookContent | null>(null);
    const [chapterData, setChapterData] = useState<Chapter | null>(null);

    const [verse, setVerse] = useState('');
    const [title, setTitle] = useState('');
    const [blocks, setBlocks] = useState<Partial<ContentBlock>[]>([]);
    const [tags, setTags] = useState<string[]>([]);
    const [activeEditor, setActiveEditor] = useState<string | null>(null);
    const [editorInstances, setEditorInstances] = useState<Map<string, Editor>>(new Map());
    const [isClearConfirmOpen, setIsClearConfirmOpen] = useState(false);
    const [commentaryDialogState, setCommentaryDialogState] = useState<{ open: boolean; blockId: string | null }>({ open: false, blockId: null });
    const [isPanelOpen, setIsPanelOpen] = useState(true);
    const [activeGlossary, setActiveGlossary] = useState<GlossaryCategory | null>(null);
    const [isSheetOpen, setIsSheetOpen] = useState(false);

    const [quoteCategories, setQuoteCategories] = React.useState<QuoteCategory[]>([]);
    const [quoteDialogState, setQuoteDialogState] = React.useState<{ open: boolean; text: string; range: Range | null }>({ open: false, text: '', range: null });
    
    const [state, formAction] = useActionState<CreateArticleState, FormData>(createArticle, {} as CreateArticleState);

    const POETIC_TYPES = ['shloka', 'sutra', 'padya', 'richa', 'mantra', 'upanishad'];
    
     useEffect(() => {
        getQuoteData().then(setQuoteCategories);
    }, []);

    const findChapterInTree = (chapters: Chapter[], id: string): Chapter | null => {
        for (const chapter of chapters) {
            if (chapter.id === id) return chapter;
            if (chapter.children) {
                const found = findChapterInTree(chapter.children, id);
                if (found) return found;
            }
        }
        return null;
    }

    useEffect(() => {
        if (bookId && chapterId) {
            getBookContent(bookId).then(data => {
                if (!data) {
                    notFound();
                } else {
                    setBookData(data);
                    const chapter = findChapterInTree(data.chapters, chapterId);
                    if (!chapter) {
                        notFound();
                    }
                    setChapterData(chapter);
                    const nextArticleNumber = (chapter.articles?.length || 0) + 1;
                    setVerse(String(nextArticleNumber));
                    setTitle(`Article ${nextArticleNumber}`);
                }
            });
        }
    }, [bookId, chapterId]);
    
    useEffect(() => {
        if (state?.success && state.redirectPath) {
            toast({ title: "Success!", description: "Article created successfully." });
            router.push(state.redirectPath);
        }
        if (state?.error) {
            toast({ variant: 'destructive', title: "Creation Failed", description: state.error });
        }
    }, [state, toast, router]);

    const handleGlobalClick = useCallback((event: MouseEvent) => {
        const target = event.target as HTMLElement;
        const isInEditorBlock = target.closest('.article-editor-block');
        const isInToolbar = target.closest('.editor-toolbar-container');
        const isInPopper = target.closest('[data-radix-popper-content-wrapper], .tippy-box, [role="dialog"], [role="menu"]');
        const isInPanel = target.closest('#intellicite-panel-container, [data-radix-dialog-content]');


        if (!isInEditorBlock && !isInPopper && !isInPanel && !isInToolbar) {
            setActiveEditor(null);
        }
    }, []);

    useEffect(() => {
        document.addEventListener('mousedown', handleGlobalClick);
        return () => {
            document.removeEventListener('mousedown', handleGlobalClick);
        };
    }, [handleGlobalClick]);

    const updateBlock = useCallback((id: string, updates: Partial<Omit<ContentBlock, 'id'>>) => {
        setBlocks(currentBlocks =>
          currentBlocks.map(block =>
            block.id === id ? { ...block, ...updates } : block
          )
        );
    }, []);

    const addBlock = useCallback((type: string) => {
        const newBlock: Partial<ContentBlock> = {
          id: crypto.randomUUID(),
          sanskrit: '',
          type,
        };
        setBlocks(currentBlocks => [...currentBlocks, newBlock]);
        
        const isCommentary = ALL_COMMENTARY_TYPES.includes(type);
        if (isCommentary) {
            setTimeout(() => setCommentaryDialogState({ open: true, blockId: newBlock.id! }), 0);
        }
        setActiveEditor(newBlock.id!);
    }, []);

    const removeBlock = (id: string) => {
        setBlocks(currentBlocks => currentBlocks.filter(block => block.id !== id));
    };

    const handleClearBlocks = () => {
        setBlocks([]);
        setEditorInstances(new Map());
        setIsClearConfirmOpen(false);
    };

    const setEditorInstance = useCallback((id: string, editor: Editor) => {
        setEditorInstances(prev => new Map(prev).set(id, editor));
    }, []);

    const removeEditorInstance = useCallback((id: string) => {
        setEditorInstances(prev => {
            const newMap = new Map(prev);
            newMap.delete(id);
            return newMap;
        });
    }, []);
    
    const handleNewQuoteFound = useCallback((text: string, range: Range) => {
        setQuoteDialogState({ open: true, text, range });
    }, []);

    const handleQuoteCreated = React.useCallback((newQuote?: Quote) => {
        const range = quoteDialogState.range;
        if (!newQuote || !range || !editorInstances.size) {
            setQuoteDialogState({ open: false, text: '', range: null });
            return;
        }

        const editor = activeEditor ? editorInstances.get(activeEditor) : Array.from(editorInstances.values())[0];
        if (!editor) return;
        
        editor.chain().focus().deleteRange(range).insertContent({
            type: 'blockquote',
            attrs: { author: newQuote.author },
            content: [{ type: 'paragraph', content: [{ type: 'text', text: newQuote.quote }] }]
        }).run();
        setQuoteDialogState({ open: false, text: '', range: null });
    }, [editorInstances, activeEditor, quoteDialogState.range]);

    const blockToEditForDialog = commentaryDialogState.blockId ? blocks.find(b => b.id === commentaryDialogState.blockId) : null;
    const activeEditorInstance = activeEditor ? editorInstances.get(activeEditor) : null;

    if (!bookData || !chapterData) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
        );
    }
    
    const panelContent = (
        <IntellicitePanel 
            tags={tags} 
            onTagsChange={setTags} 
            editor={activeEditorInstance} 
            blocks={blocks}
            activeGlossary={activeGlossary}
            onActiveGlossaryChange={setActiveGlossary}
            articleInfo={null} // No article context on create page
            highlightTarget={null}
            onHighlight={() => {}}
            headerActions={
                <div className="flex w-full items-center justify-between gap-2">
                    <Sheet>
                        <SheetTrigger asChild>
                            <Button variant="outline" size="sm" type="button"><Eye className="mr-2 h-4 w-4" />Preview</Button>
                        </SheetTrigger>
                        <SheetContent className="w-full sm:max-w-4xl">
                            <SheetHeader>
                                <SheetTitle>Article Preview</SheetTitle>
                                <SheetDescription>{chapterData.name}, Verse {verse}</SheetDescription>
                            </SheetHeader>
                            <ScrollArea className="h-[calc(100vh-80px)]">
                                <div className="p-4 note-editor">
                                    <ArticleRenderer blocks={blocks.map(b => ({...b, id: b.id || '', sanskrit: b.sanskrit || '', type: b.type || 'shloka'})) as ContentBlock[]} />
                                </div>
                            </ScrollArea>
                        </SheetContent>
                    </Sheet>
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" type="button" onClick={() => router.push(`/admin/books/${bookId}`)}>Cancel</Button>
                        <SubmitButton />
                    </div>
                 </div>
            }
        />
    );


    return (
        <div className="h-screen flex flex-col bg-muted">
            <CreateQuoteDialog
                open={quoteDialogState.open}
                onOpenChange={(isOpen) => setQuoteDialogState(prev => ({ ...prev, open: isOpen }))}
                initialQuote={quoteDialogState.text}
                onQuoteCreated={handleQuoteCreated}
                categories={quoteCategories}
            />
             <AlertDialog open={isClearConfirmOpen} onOpenChange={setIsClearConfirmOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action will permanently remove all content blocks. This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleClearBlocks}>
                            Yes, Clear All
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
            <CommentaryDialog
                open={commentaryDialogState.open}
                onOpenChange={(isOpen) => !isOpen && setCommentaryDialogState({ open: false, blockId: null })}
                initialData={blockToEditForDialog?.commentary || { type: blockToEditForDialog?.type || 'bhashya', author: '', workName: '', shortName: ''}}
                onSave={(data) => {
                    if (commentaryDialogState.blockId) {
                        updateBlock(commentaryDialogState.blockId, { type: data.type, commentary: data });
                    }
                    setCommentaryDialogState({ open: false, blockId: null });
                }}
            />
            <form action={formAction} className="flex-1 flex flex-col min-h-0">
                <input type="hidden" name="bookId" value={bookId} />
                <input type="hidden" name="chapterId" value={chapterId} />
                <input type="hidden" name="verse" value={verse} />
                <input type="hidden" name="title" value={title} />
                <input type="hidden" name="content" value={JSON.stringify(blocks)} />
                <input type="hidden" name="tags" value={JSON.stringify(tags)} />

                <header className="flex items-center justify-between gap-4 p-4 border-b bg-background sticky top-0 z-20">
                     <div className="flex-1 min-w-0">
                         <Button variant="link" className="p-0 h-auto text-muted-foreground" asChild>
                            <Link href={`/admin/books/${bookId}`}><ArrowLeft className="mr-2 h-4 w-4" /> Back to {bookData.bookName}</Link>
                        </Button>
                    </div>
                     <div className="flex items-center gap-2">
                         {isMobile && (
                            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                                <SheetTrigger asChild>
                                    <Button variant="outline" size="icon"><Menu className="h-4 w-4" /></Button>
                                </SheetTrigger>
                                <SheetContent className="w-[340px] p-0 flex flex-col">
                                    {panelContent}
                                </SheetContent>
                            </Sheet>
                         )}
                     </div>
                </header>

                <div className="flex-1 flex flex-row overflow-hidden">
                    <main className="flex-1 flex flex-col overflow-hidden bg-muted/40">
                         {activeEditorInstance && (
                            <div className="editor-toolbar-container flex-shrink-0 border-b z-10 bg-background/95 backdrop-blur-sm">
                                <EditorToolbar editor={activeEditorInstance} />
                            </div>
                        )}
                        <div className="flex-1 overflow-y-auto">
                            <div className="p-8 sm:p-12 bg-card note-editor note-context clearfix w-full">
                                <div className="flex justify-between items-start mb-6 border-b pb-4">
                                    <div>
                                        <h1 className="text-3xl font-bold font-headline">{title}</h1>
                                        <h2 className="text-xl text-muted-foreground font-headline">
                                            {chapterData.name}, Verse {verse}
                                        </h2>
                                    </div>
                                    {blocks.length > 0 && (
                                        <Button type="button" variant="destructive" size="sm" onClick={() => setIsClearConfirmOpen(true)}>
                                            <Trash2 className="mr-2 h-4 w-4" /> Clear All
                                        </Button>
                                    )}
                                </div>
                                <div className="article-editor-content">
                                    {blocks.length > 0 ? (
                                        blocks.map((block, index) => {
                                            const prevBlock = index > 0 ? blocks[index - 1] : null;
                                            const useTightSpacing = prevBlock && POETIC_TYPES.includes(block!.type!) && POETIC_TYPES.includes(prevBlock!.type!);
                                            return (
                                                <React.Fragment key={block!.id}>
                                                    {index > 0 && <Separator className={useTightSpacing ? "my-1" : "my-6"} />}
                                                    <div className="article-editor-block relative">
                                                        {activeEditor === block!.id && (
                                                            <Button type="button" variant="ghost" size="icon" className="absolute top-1 right-1 h-7 w-7 rounded-full z-10" onClick={() => removeBlock(block!.id!)}>
                                                                <Trash2 className="h-4 w-4 text-destructive" />
                                                            </Button>
                                                        )}
                                                        {ALL_COMMENTARY_TYPES.includes(block!.type!) && (
                                                            <div className="mb-2">
                                                                {block!.commentary ? (
                                                                    <h3 className="font-semibold text-lg cursor-pointer hover:bg-muted p-2 rounded-md" onClick={() => setCommentaryDialogState({ open: true, blockId: block!.id! })}>
                                                                        {block!.commentary.shortName}: {getTypeLabelById(block!.type!)}
                                                                    </h3>
                                                                ) : (
                                                                    <Button type="button" variant="link" size="sm" className="h-auto p-0 text-sm text-muted-foreground italic" onClick={() => setCommentaryDialogState({ open: true, blockId: block!.id! })}>
                                                                        Add commentary details...
                                                                    </Button>
                                                                )}
                                                            </div>
                                                        )}
                                                        <RichTextEditor
                                                            id={block!.id!}
                                                            content={block!.sanskrit!}
                                                            onChange={(value) => updateBlock(block!.id!, { sanskrit: value })}
                                                            placeholder="Type here..."
                                                            onFocus={() => {
                                                                setActiveEditor(block!.id!);
                                                                if (ALL_COMMENTARY_TYPES.includes(block!.type!) && !block!.commentary) {
                                                                    setCommentaryDialogState({ open: true, blockId: block!.id! });
                                                                }
                                                            }}
                                                            setEditorInstance={setEditorInstance}
                                                            removeEditorInstance={removeEditorInstance}
                                                            activeGlossary={activeGlossary}
                                                            onNewQuoteFound={handleNewQuoteFound}
                                                        />
                                                    </div>
                                                </React.Fragment>
                                            )
                                        })
                                    ) : (
                                        <div className="text-center text-muted-foreground p-8 border-2 border-dashed rounded-lg flex flex-col items-center justify-center min-h-[200px]">
                                            <p className="mb-4">This article has no content blocks.</p>
                                            <AddBlockDialog onAddBlock={addBlock} structure={bookData.structure}>
                                                <Button type="button" variant="default" size="lg">
                                                    <Plus className="mr-2 h-4 w-4" />
                                                    Add First Block
                                                </Button>
                                            </AddBlockDialog>
                                        </div>
                                    )}
                                    <EditorNotesDisplay blocks={blocks} />
                                </div>
                            </div>
                        </div>
                    </main>
                    {!isMobile && (
                        <div id="intellicite-panel-container" className="relative flex-shrink-0 border-l">
                            <aside 
                                className={cn(
                                    "bg-card transition-all duration-300 ease-in-out h-full overflow-hidden",
                                    isPanelOpen ? "w-[340px]" : "w-0"
                                )}
                            >
                                <div className="w-[340px] h-full">
                                    {panelContent}
                                </div>
                            </aside>
                            <Button 
                                type="button"
                                variant="outline" 
                                size="icon" 
                                onClick={() => setIsPanelOpen(!isPanelOpen)}
                                className="absolute top-1/2 -left-4 -translate-y-1/2 rounded-full h-8 w-8 z-10 bg-background hover:bg-muted"
                                title="Toggle Intellicite Panel"
                            >
                                {isPanelOpen ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
                            </Button>
                        </div>
                    )}
                </div>
            </form>
            {blocks.length > 0 && (
                <AddBlockDialog onAddBlock={addBlock} structure={bookData.structure}>
                    <Button type="button" size="icon" className="fixed z-10 bottom-8 right-8 h-14 w-14 rounded-full shadow-lg" aria-label="Add Content Block">
                        <Plus className="h-8 w-8" />
                    </Button>
                </AddBlockDialog>
            )}
        </div>
    )
}
