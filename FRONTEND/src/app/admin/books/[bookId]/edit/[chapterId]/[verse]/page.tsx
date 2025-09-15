
'use client';

import React, { useActionState, useState, useEffect, useCallback, useTransition } from 'react';
import { notFound, useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useFormStatus } from 'react-dom';
import type { Editor, Range } from '@tiptap/react';
import { getArticle as getArticleData } from '@/services/book.service';
import { getQuoteData } from '@/services/quote.service';
import { updateArticle } from '@/actions/book.actions';
import type { ContentBlock, BookContent, Chapter, BookStructure, Quote, QuoteCategory, GlossaryCategory, Article as ArticleType } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { EditorNotesDisplay } from '@/components/admin/editor/notes-display';
import { CommentaryDialog, AddBlockDialog, SourceInfoDialog } from '@/components/admin/profile-forms';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetDescription } from '@/components/ui/sheet';
import { Loader2, Save, ArrowLeft, Trash2, Plus, Eye, ChevronLeft, ChevronRight, Menu, CheckCircle2 } from 'lucide-react';
import { ALL_COMMENTARY_TYPES, getTypeLabelById, getSanskritLabelById, ALL_SOURCE_TYPES, getIastLabelById } from '@/types/sanskrit.types';
import { Separator } from '@/components/ui/separator';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { ArticleRenderer } from '@/components/article-renderer';
import dynamic from 'next/dynamic';
import { IntellicitePanel } from '@/components/admin/intellicite-panel';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { useDebounce } from '@/hooks/use-debounce';
import { CreateQuoteDialog } from '@/components/admin/quote-forms';
import { Transliterate } from '@/components/transliteration-provider';
import { EditorToolbar } from '@/components/admin/editor/toolbar';

const RichTextEditor = dynamic(() => import('@/components/admin/rich-text-editor').then(mod => mod.RichTextEditor), { 
    ssr: false, 
    loading: () => <div className="prose-styling min-h-[120px] w-full rounded-md border border-input bg-transparent px-3 py-2 animate-pulse" /> 
});


function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" size="sm" disabled={pending}>
            {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Save Changes
        </Button>
    );
}

function ArticleEditor({
    title,
    setTitle,
    chapterName,
    verse,
    blocks,
    setBlocks,
    bookStructure,
    activeEditor,
    setActiveEditor,
    editorInstances,
    setEditorInstances,
    activeGlossary,
    onNewQuoteFound
}: {
    title: string;
    setTitle: (title: string) => void;
    chapterName: string;
    verse: string | number;
    blocks: Partial<ContentBlock>[];
    setBlocks: React.Dispatch<React.SetStateAction<Partial<ContentBlock>[]>>;
    bookStructure: BookStructure | undefined;
    activeEditor: string | null;
    setActiveEditor: (id: string | null) => void;
    editorInstances: Map<string, Editor>;
    setEditorInstances: React.Dispatch<React.SetStateAction<Map<string, Editor>>>;
    activeGlossary: GlossaryCategory | null;
    onNewQuoteFound: (text: string, range: Range) => void;
}) {
    const [isClearConfirmOpen, setIsClearConfirmOpen] = useState(false);
    const [dialogState, setDialogState] = useState<{ type: 'commentary' | 'source' | null, blockId: string | null }>({ type: null, blockId: null });

    const updateBlock = useCallback((id: string, updates: Partial<Omit<ContentBlock, 'id'>>) => {
        setBlocks(currentBlocks =>
          currentBlocks.map(block =>
            block.id === id ? { ...block, ...updates } : block
          )
        );
    }, [setBlocks]);

    const addBlock = useCallback((type: string) => {
        const newBlock: Partial<ContentBlock> = {
          id: crypto.randomUUID(),
          sanskrit: '',
          type,
        };
        setBlocks(currentBlocks => [...currentBlocks, newBlock]);
        
        const isCommentary = ALL_COMMENTARY_TYPES.includes(type);
        if (isCommentary) {
            setTimeout(() => setDialogState({ type: 'commentary', blockId: newBlock.id! }), 0);
        } else {
             setTimeout(() => setDialogState({ type: 'source', blockId: newBlock.id! }), 0);
        }
        setActiveEditor(newBlock.id!);
    }, [setBlocks, setActiveEditor]);

    const removeBlock = (id: string) => {
        setBlocks(currentBlocks => currentBlocks.filter(block => block.id !== id));
    };
    
    const setEditorInstance = useCallback((id: string, editor: Editor) => {
        setEditorInstances(prev => new Map(prev).set(id, editor));
    }, [setEditorInstances]);

    const removeEditorInstance = useCallback((id: string) => {
        setEditorInstances(prev => {
            const newMap = new Map(prev);
            newMap.delete(id);
            return newMap;
        });
    }, [setEditorInstances]);

    const blockToEditForDialog = dialogState.blockId ? blocks.find(b => b.id === dialogState.blockId) : null;
    const POETIC_TYPES = ['shloka', 'sutra', 'padya', 'richa', 'mantra', 'upanishad'];

    return (
        <>
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
                        <AlertDialogAction onClick={() => { setBlocks([]); setEditorInstances(new Map()); setIsClearConfirmOpen(false); }}>
                            Yes, Clear All
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
            <CommentaryDialog
                open={dialogState.type === 'commentary'}
                onOpenChange={(isOpen) => !isOpen && setDialogState({ type: null, blockId: null })}
                initialData={blockToEditForDialog?.commentary || { type: blockToEditForDialog?.type || 'bhashya', author: '', workName: '', shortName: ''}}
                onSave={(data) => {
                    if (dialogState.blockId) {
                        updateBlock(dialogState.blockId, { type: data.type, commentary: data });
                    }
                    setDialogState({ type: null, blockId: null });
                }}
            />
             <SourceInfoDialog
                open={dialogState.type === 'source'}
                onOpenChange={(isOpen) => !isOpen && setDialogState({ type: null, blockId: null })}
                blockType={blockToEditForDialog?.type || 'shloka'}
            />

            <div className="p-8 sm:p-12 bg-card note-editor note-context clearfix w-full">
                <div className="flex justify-between items-start mb-6 border-b pb-4">
                    <div>
                        <Input 
                            name="title" 
                            value={title} 
                            onChange={e => setTitle(e.target.value)} 
                            className="text-3xl font-bold font-headline h-auto p-2 border-0 shadow-none focus-visible:ring-0 mb-1" 
                        />
                        <h2 className="text-xl text-muted-foreground font-headline pl-2">
                            {chapterName}, Verse {verse}
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
                            const isCommentary = ALL_COMMENTARY_TYPES.includes(block!.type!);
                            const isSource = ALL_SOURCE_TYPES.includes(block!.type!);
                            const useTightSpacing = prevBlock && POETIC_TYPES.includes(block!.type!) && POETIC_TYPES.includes(prevBlock!.type!);
                            return (
                                <React.Fragment key={block!.id}>
                                    {index > 0 && <Separator className={useTightSpacing ? "my-1" : "my-6"} />}
                                    <div className="article-editor-block relative">
                                        {activeEditor === block!.id && (
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                className="absolute top-1 right-1 h-7 w-7 rounded-full z-10"
                                                onClick={() => removeBlock(block!.id!)}
                                            >
                                                <Trash2 className="h-4 w-4 text-destructive" />
                                            </Button>
                                        )}

                                        <div className="mb-2">
                                            {isCommentary ? (
                                                <div 
                                                    className="font-bold text-xl text-primary/80 font-headline cursor-pointer hover:bg-muted p-2 rounded-md" 
                                                    onClick={() => setDialogState({ type: 'commentary', blockId: block!.id! })}
                                                >
                                                     <Transliterate>
                                                        {block!.commentary ? (
                                                            <>{block!.commentary.shortName} - {getSanskritLabelById(block!.type!)}</>
                                                        ) : (
                                                            <>Add details for: {getSanskritLabelById(block!.type!)}...</>
                                                        )}
                                                    </Transliterate>
                                                    <span className="inline-block h-0.5 w-[8%] bg-primary/80 align-middle ml-2 rounded-full" />
                                                </div>
                                            ) : isSource ? (
                                                 <div 
                                                    className="font-bold text-xl text-foreground/80 font-headline cursor-pointer hover:bg-muted p-2 rounded-md" 
                                                    onClick={() => setDialogState({ type: 'source', blockId: block!.id! })}
                                                >
                                                     <Transliterate>{getIastLabelById(block!.type!)} ({getSanskritLabelById(block!.type!)})</Transliterate>
                                                     <span className="inline-block h-0.5 w-[8%] bg-foreground/80 align-middle ml-2 rounded-full" />
                                                </div>
                                            ): null}
                                        </div>
                                        <RichTextEditor
                                            id={block!.id!}
                                            content={block!.sanskrit!}
                                            onChange={(value) => updateBlock(block!.id!, { sanskrit: value })}
                                            placeholder="Type here..."
                                            onFocus={() => setActiveEditor(block!.id!)}
                                            setEditorInstance={setEditorInstance}
                                            removeEditorInstance={removeEditorInstance}
                                            activeGlossary={activeGlossary}
                                            onNewQuoteFound={onNewQuoteFound}
                                        />
                                    </div>
                                </React.Fragment>
                            )
                        })
                    ) : (
                        <div className="text-center text-muted-foreground p-8 border-2 border-dashed rounded-lg flex flex-col items-center justify-center min-h-[200px]">
                            <p className="mb-4">This article has no content blocks.</p>
                            <AddBlockDialog onAddBlock={addBlock} structure={bookStructure}>
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
             {blocks.length > 0 && (
                 <AddBlockDialog onAddBlock={addBlock} structure={bookStructure}>
                    <Button
                        type="button"
                        size="icon"
                        className="fixed z-10 bottom-8 right-8 h-14 w-14 rounded-full shadow-lg"
                        aria-label="Add Content Block"
                    >
                        <Plus className="h-8 w-8" />
                    </Button>
                </AddBlockDialog>
            )}
        </>
    );
}

function RightSidebarPanel({
    tags,
    setTags,
    activeEditorInstance,
    blocks,
    activeGlossary,
    setActiveGlossary,
    articleData,
    highlightTarget,
    handleHighlight,
    formAction
}: {
    tags: string[];
    setTags: (tags: string[]) => void;
    activeEditorInstance: Editor | null;
    blocks: Partial<ContentBlock>[];
    activeGlossary: GlossaryCategory | null;
    setActiveGlossary: (glossary: GlossaryCategory | null) => void;
    articleData: { book: BookContent, chapter: any, article: ArticleType } | null;
    highlightTarget: string | null;
    handleHighlight: (id: string) => void;
    formAction: (payload: FormData) => void;
}) {
    const router = useRouter();

    return (
        <IntellicitePanel 
            tags={tags} 
            onTagsChange={setTags} 
            editor={activeEditorInstance} 
            blocks={blocks}
            activeGlossary={activeGlossary}
            onActiveGlossaryChange={setActiveGlossary}
            articleInfo={articleData}
            highlightTarget={highlightTarget}
            onHighlight={handleHighlight}
            headerActions={
                <div className="flex flex-wrap items-center justify-end gap-2">
                    <Sheet>
                        <SheetTrigger asChild>
                            <Button variant="outline" size="sm" type="button"><Eye className="mr-2 h-4 w-4" />Preview</Button>
                        </SheetTrigger>
                        <SheetContent className="w-full sm:max-w-4xl">
                            <SheetHeader>
                            <SheetTitle>Article Preview</SheetTitle>
                            <SheetDescription>
                                {articleData?.chapter.name}, Shloka {articleData?.article.verse}
                            </SheetDescription>
                            </SheetHeader>
                            <ScrollArea className="h-[calc(100vh-80px)]">
                            <div className="p-4 note-editor">
                                <ArticleRenderer blocks={blocks.map(b => ({...b, id: b.id || '', sanskrit: b.sanskrit || '', type: b.type || 'shloka'})) as ContentBlock[]} />
                            </div>
                            </ScrollArea>
                        </SheetContent>
                    </Sheet>
                    <Button variant="ghost" size="sm" type="button" onClick={() => router.push(`/admin/books/${articleData?.book.bookId}`)}>Cancel</Button>
                    <SubmitButton />
                </div>
            }
        />
    );
}

export default function EditArticlePage() {
    const params = useParams();
    const bookId = params.bookId as string;
    const chapterId = params.chapterId as string;
    const verse = params.verse as string;
    const router = useRouter();
    const { toast } = useToast();
    const isMobile = useIsMobile();
    
    const [articleData, setArticleData] = useState<{ book: BookContent, chapter: any, article: ArticleType } | null>(null);
    const [title, setTitle] = useState('');
    const [blocks, setBlocks] = useState<Partial<ContentBlock>[]>([]);
    const [tags, setTags] = useState<string[]>([]);
    const [activeEditor, setActiveEditor] = useState<string | null>(null);
    const [editorInstances, setEditorInstances] = useState<Map<string, Editor>>(new Map());
    
    const [isPanelOpen, setIsPanelOpen] = useState(true);
    const [activeGlossary, setActiveGlossary] = useState<GlossaryCategory | null>(null);
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    
    const [quoteCategories, setQuoteCategories] = React.useState<QuoteCategory[]>([]);
    const [quoteDialogState, setQuoteDialogState] = React.useState<{ open: boolean; text: string; range: Range | null }>({ open: false, text: '', range: null });

    const [highlightTarget, setHighlightTarget] = useState<string | null>(null);
    const [isFullyLoaded, setIsFullyLoaded] = useState(false);

    const [state, formAction] = useActionState(updateArticle, null);
    const [isAutoSaving, startAutoSaveTransition] = useTransition();

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
        if (bookId && chapterId && verse) {
            getArticleData(bookId, chapterId, verse).then(data => {
                if (!data) {
                    notFound();
                } else {
                    setArticleData(data);
                    setTitle(data.article.title);
                    setBlocks(data.article.content);
                    setTags(data.article.tags || []);
                    setTimeout(() => setIsFullyLoaded(true), 100);
                }
            });
        }
    }, [bookId, chapterId, verse]);
    
    const debouncedBlocks = useDebounce(blocks, 2000);
    const debouncedTitle = useDebounce(title, 2000);

    useEffect(() => {
        if (!isFullyLoaded) return;

        const performAutoSave = () => {
            const formData = new FormData();
            formData.append('bookId', bookId);
            formData.append('chapterId', String(chapterId));
            formData.append('verse', String(verse));
            formData.append('title', title);
            formData.append('content', JSON.stringify(blocks));
            formData.append('tags', JSON.stringify(tags));
            
            startAutoSaveTransition(() => {
                formAction(formData);
            });
        }

        performAutoSave();

    }, [debouncedBlocks, debouncedTitle, tags, isFullyLoaded, bookId, chapterId, verse, title, blocks, formAction, startAutoSaveTransition]);


    useEffect(() => {
        if (state?.success && isFullyLoaded) {
            toast({
              title: (
                <div className="flex items-center">
                  <CheckCircle2 className="mr-2 h-4 w-4 text-green-500" />
                  <span>Saved</span>
                </div>
              ),
              duration: 2000,
            });
        }
        if (state?.error) {
            toast({ variant: 'destructive', title: "Update Failed", description: state.error });
        }
    }, [state, toast, isFullyLoaded]);

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

    if (!articleData) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
        );
    }
    
    const { book, chapter, article } = articleData;
    const activeEditorInstance = activeEditor ? editorInstances.get(activeEditor) : null;
    
    const handleHighlight = (elementId: string) => {
        setHighlightTarget(elementId);
        setTimeout(() => setHighlightTarget(null), 1200);
    };

    const panelContent = <RightSidebarPanel 
        tags={tags}
        setTags={setTags}
        activeEditorInstance={activeEditorInstance}
        blocks={blocks}
        activeGlossary={activeGlossary}
        setActiveGlossary={setActiveGlossary}
        articleData={articleData}
        highlightTarget={highlightTarget}
        handleHighlight={handleHighlight}
        formAction={formAction}
    />

    return (
        <div className="h-screen flex flex-col bg-muted/40">
            <CreateQuoteDialog
                open={quoteDialogState.open}
                onOpenChange={(isOpen) => setQuoteDialogState(prev => ({ ...prev, open: isOpen }))}
                initialQuote={quoteDialogState.text}
                onQuoteCreated={handleQuoteCreated}
                categories={quoteCategories}
            />
            <form action={formAction} className="flex-1 flex flex-col min-h-0">
                <input type="hidden" name="bookId" value={bookId} />
                <input type="hidden" name="chapterId" value={String(chapterId)} />
                <input type="hidden" name="verse" value={String(article.verse)} />
                <input type="hidden" name="tags" value={JSON.stringify(tags)} />
                <input type="hidden" name="title" value={title} />
                <input type="hidden" name="content" value={JSON.stringify(blocks)} />
                
                <header className="flex items-center justify-between gap-4 p-4 border-b bg-background sticky top-0 z-20">
                     <div className="flex items-center gap-2">
                         <Button variant="link" className="p-0 h-auto text-muted-foreground" asChild>
                            <Link href={`/admin/books/${bookId}`}><ArrowLeft className="mr-2 h-4 w-4" /> Back to {book.bookName}</Link>
                        </Button>
                     </div>
                     <div className="flex items-center gap-2">
                        {isAutoSaving && <span className="text-xs text-muted-foreground flex items-center gap-1"><Loader2 className="h-3 w-3 animate-spin"/>Saving...</span>}
                        {state?.success && isFullyLoaded && <span className="text-xs text-muted-foreground">Saved</span>}
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
                           <ArticleEditor 
                                title={title}
                                setTitle={setTitle}
                                chapterName={chapter.name}
                                verse={article.verse}
                                blocks={blocks}
                                setBlocks={setBlocks}
                                bookStructure={book.structure}
                                activeEditor={activeEditor}
                                setActiveEditor={setActiveEditor}
                                editorInstances={editorInstances}
                                setEditorInstances={setEditorInstances}
                                activeGlossary={activeGlossary}
                                onNewQuoteFound={handleNewQuoteFound}
                           />
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
                                title="Toggle Assistant Panel"
                            >
                                {isPanelOpen ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
                            </Button>
                        </div>
                    )}
                </div>
            </form>
        </div>
    )
}

    