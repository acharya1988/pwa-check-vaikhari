
'use client';

import React, { useActionState, useEffect, useRef, useState, type ReactNode, useCallback } from 'react';
import { useFormStatus } from 'react-dom';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
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
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { ScrollArea } from './ui/scroll-area';
import { getMediaFiles } from '@/services/media.service';
import { useToast } from '@/hooks/use-toast';
import { createOrganizationAction, updateProfileImage } from '@/actions/profile.actions';
import { Loader2, Check, Edit, Plus, ArrowLeft, ArrowRight, Trash2, Search } from 'lucide-react';
import { MediaUploader } from './admin/media-uploader';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';
import type { Organization, UserProfile, Article, BookContent, Chapter, ContentBlock, StandaloneArticleCategory } from '@/types';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Stepper, StepperItem, StepperLabel, StepperSeparator } from '@/components/ui/stepper';
import { CreatableCombobox } from '@/components/ui/creatable-combobox';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { handleAddLayer, handleLeaveSpark, handleStartDrift, handleConnectPoint, saveBlockNote } from '@/app/articles/actions';
import { searchLinkableArticles, type LinkableArticle } from '@/services/book.service';
import { EditorToolbar } from '@/components/admin/editor/toolbar';
import type { Editor } from '@tiptap/react';
import { Transliterate } from '@/components/transliteration-provider';
import { Separator } from '@/components/ui/separator';
import parse from 'html-react-parser';
import { useDebounce } from '@/hooks/use-debounce';
import { stripHtml } from '@/services/service-utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { createStandaloneArticleCategory } from '@/actions/standalone-article.actions';
import { getStandaloneArticleCategories } from '@/services/standalone-article.service';

const RichTextEditor = dynamic(() => import('@/components/admin/rich-text-editor').then(mod => mod.RichTextEditor), {
    ssr: false,
    loading: () => <div className="min-h-[150px] w-full rounded-md border border-input bg-transparent px-3 py-2 animate-pulse" />
});


function SubmitButton({ children }: { children: ReactNode }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {children}
    </Button>
  );
}

function useInteractionDialog(state: any, onOpenChange: (open: boolean) => void) {
    const { toast } = useToast();
    const formRef = useRef<HTMLFormElement>(null);

    useEffect(() => {
        if (state?.success) {
            toast({ title: "Success!", description: state.message });
            onOpenChange(false);
            formRef.current?.reset();
        }
        if (state?.error) {
            toast({ variant: 'destructive', title: 'Error', description: state.error });
        }
    }, [state, toast, onOpenChange]);
    
    return formRef;
}

interface DialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    articleInfo: { book: BookContent; chapter: Chapter; article: Article };
    block: ContentBlock;
}

export function SparkDialog({ open, onOpenChange, articleInfo, block }: DialogProps) {
    const [state, formAction] = useActionState(handleLeaveSpark, null);
    const formRef = useInteractionDialog(state, onOpenChange);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Leave a Spark</DialogTitle>
                    <DialogDescription>Share a brief idea, question, or insight related to this block.</DialogDescription>
                </DialogHeader>
                 <form ref={formRef} action={formAction} className="space-y-4">
                    <input type="hidden" name="bookId" value={articleInfo.book.bookId} />
                    <input type="hidden" name="chapterId" value={String(articleInfo.chapter.id)} />
                    <input type="hidden" name="verse" value={String(articleInfo.article.verse)} />
                    <input type="hidden" name="blockId" value={block.id} />
                    <Textarea name="content" placeholder="What's on your mind?" required />
                    <DialogFooter>
                        <DialogClose asChild><Button variant="ghost">Cancel</Button></DialogClose>
                        <SubmitButton>Leave Spark</SubmitButton>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

export function LayerDialog({ open, onOpenChange, articleInfo, block }: DialogProps) {
    const [state, formAction] = useActionState(handleAddLayer, null);
    const formRef = useInteractionDialog(state, onOpenChange);
    const [content, setContent] = useState('');
    const [editor, setEditor] = useState<Editor | null>(null);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-3xl">
                <DialogHeader>
                    <DialogTitle>Add a Layer</DialogTitle>
                    <DialogDescription>Add a detailed annotation or parallel commentary to this block.</DialogDescription>
                </DialogHeader>
                 <form ref={formRef} action={formAction} className="space-y-4">
                    <input type="hidden" name="bookId" value={articleInfo.book.bookId} />
                    <input type="hidden" name="chapterId" value={String(articleInfo.chapter.id)} />
                    <input type="hidden" name="verse" value={String(articleInfo.article.verse)} />
                    <input type="hidden" name="blockId" value={block.id} />
                    <input type="hidden" name="blockSanskrit" value={block.sanskrit} />
                    <input type="hidden" name="content" value={content} />

                     <blockquote className="border-l-4 pl-4 italic text-muted-foreground my-2 max-h-32 overflow-y-auto scrollable bg-muted p-2 rounded-md">
                        <Transliterate>{parse(block.sanskrit)}</Transliterate>
                    </blockquote>

                    <Separator />

                    <div className="border rounded-md">
                        <EditorToolbar editor={editor} />
                        <RichTextEditor
                            id="layer-editor"
                            content=""
                            onChange={setContent}
                            setEditorInstance={(id, ed) => setEditor(ed)}
                            removeEditorInstance={() => setEditor(null)}
                            placeholder="Your detailed annotation..."
                        />
                    </div>
                    <DialogFooter>
                        <DialogClose asChild><Button type="button" variant="ghost">Cancel</Button></DialogClose>
                        <SubmitButton>Add Layer</SubmitButton>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

export function PointDialog({ open, onOpenChange, articleInfo, block }: DialogProps) {
    const [state, formAction] = useActionState(handleConnectPoint, null);
    const formRef = useInteractionDialog(state, onOpenChange);
    const [searchQuery, setSearchQuery] = useState('');
    const debouncedSearchQuery = useDebounce(searchQuery, 300);
    const [searchResults, setSearchResults] = useState<LinkableArticle[]>([]);
    const [selectedArticle, setSelectedArticle] = useState<LinkableArticle | null>(null);

    useEffect(() => {
        if (debouncedSearchQuery.length > 2) {
            searchLinkableArticles(debouncedSearchQuery).then(setSearchResults);
        } else {
            setSearchResults([]);
        }
    }, [debouncedSearchQuery]);

    useEffect(() => {
        if (!open) {
            setSearchQuery('');
            setSearchResults([]);
            setSelectedArticle(null);
        }
    }, [open])

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Connect Point</DialogTitle>
                    <DialogDescription>Find another article or block to create a semantic link.</DialogDescription>
                </DialogHeader>
                 <form ref={formRef} action={formAction} className="space-y-4">
                    <input type="hidden" name="bookId" value={articleInfo.book.bookId} />
                    <input type="hidden" name="chapterId" value={String(articleInfo.chapter.id)} />
                    <input type="hidden" name="verse" value={String(articleInfo.article.verse)} />
                    <input type="hidden" name="blockId" value={block.id} />
                    {selectedArticle && (
                        <>
                            <input type="hidden" name="targetBookId" value={selectedArticle.url.split('/')[2]} />
                            <input type="hidden" name="targetChapterId" value={selectedArticle.url.split('/')[3]} />
                            <input type="hidden" name="targetVerse" value={selectedArticle.url.split('/')[4]} />
                            <input type="hidden" name="targetArticleTitle" value={selectedArticle.label} />
                        </>
                    )}
                    
                    <div>
                        <Label>Search for article to connect</Label>
                        <div className="relative">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input 
                                placeholder="Search by title, chapter..."
                                className="pl-8"
                                value={searchQuery}
                                onChange={(e) => {
                                    setSearchQuery(e.target.value);
                                    setSelectedArticle(null);
                                }}
                            />
                        </div>
                    </div>
                     {searchResults.length > 0 && !selectedArticle && (
                        <ScrollArea className="h-48 border rounded-md">
                             <div className="p-2 space-y-1">
                                {searchResults.map(res => (
                                    <Button key={res.id} variant="ghost" className="w-full justify-start text-left h-auto" onClick={() => { setSearchQuery(res.label); setSelectedArticle(res); }}>
                                        {res.label}
                                    </Button>
                                ))}
                            </div>
                        </ScrollArea>
                    )}
                     <Textarea name="comment" placeholder="Why is this relevant? (optional)" rows={3} />
                    <DialogFooter>
                        <DialogClose asChild><Button variant="ghost">Cancel</Button></DialogClose>
                        <SubmitButton>Connect Point</SubmitButton>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

function CreateDriftCategoryDialog({ onCategoryCreated }: { onCategoryCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useActionState(createStandaloneArticleCategory, null);
  const { toast } = useToast();

  useEffect(() => {
    if (state?.success) {
      toast({ title: "Success!", description: "Category created." });
      setOpen(false);
      onCategoryCreated();
    }
    if (state?.error) {
      toast({ variant: 'destructive', title: "Error", description: state.error });
    }
  }, [state, toast, onCategoryCreated]);
  
  return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button type="button" variant="outline" size="icon" className="flex-shrink-0" title="Add new category">
            <Plus className="h-4 w-4" />
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Category</DialogTitle>
          </DialogHeader>
          <form action={formAction} className="space-y-4">
            <div>
              <Label htmlFor="category-name">Category Name</Label>
              <Input id="category-name" name="name" required />
            </div>
            <DialogFooter>
              <DialogClose asChild><Button type="button" variant="ghost">Cancel</Button></DialogClose>
              <Button type="submit">Create</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
  );
}


export function DriftDialog({ open, onOpenChange, articleInfo, block }: DialogProps) {
    const [state, formAction] = useActionState(handleStartDrift, null);
    const formRef = useInteractionDialog(state, onOpenChange);
    const [editorContent, setEditorContent] = useState('');
    const [editor, setEditor] = useState<Editor | null>(null);
    const [categories, setCategories] = useState<StandaloneArticleCategory[]>([]);

    const fetchCategories = useCallback(() => {
        getStandaloneArticleCategories().then(setCategories);
    }, []);

    useEffect(() => {
        if(open) {
            fetchCategories();
        }
    }, [open, fetchCategories]);
    
    const handleFormSubmit = (formData: FormData) => {
        const fullContent = `<p>${stripHtml(block.sanskrit)}</p>${editorContent}`;
        formData.set('content', fullContent);
        formAction(formData);
    }
    
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-3xl">
                <DialogHeader>
                    <DialogTitle>Start a Drift</DialogTitle>
                    <DialogDescription>This will create a new standalone article, using this block as the starting point. You can evolve it independently from there.</DialogDescription>
                </DialogHeader>
                 <form ref={formRef} action={handleFormSubmit} className="space-y-4">
                    <input type="hidden" name="bookId" value={articleInfo.book.bookId} />
                    <input type="hidden" name="chapterId" value={String(articleInfo.chapter.id)} />
                    <input type="hidden" name="verse" value={String(articleInfo.article.verse)} />
                    <input type="hidden" name="blockId" value={block.id} />
                    
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                           <Label htmlFor="drift-title">New Article Title</Label>
                           <Input id="drift-title" name="title" required placeholder="Title for your new article" />
                        </div>
                        <div>
                            <Label htmlFor="categoryId">Category</Label>
                            <div className="flex items-center gap-2">
                                <Select name="categoryId" required defaultValue="uncategorized">
                                    <SelectTrigger id="categoryId">
                                        <SelectValue placeholder="Select a category" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {categories.map(category => (
                                        <SelectItem key={category.id} value={category.id}>{category.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <CreateDriftCategoryDialog onCategoryCreated={fetchCategories} />
                            </div>
                        </div>
                    </div>

                     <div>
                        <Label htmlFor="first-paragraph">Your Initial Thought</Label>
                         <blockquote className="border-l-2 pl-3 italic text-sm text-muted-foreground my-2">
                           <Transliterate>{stripHtml(block.sanskrit)}</Transliterate>
                        </blockquote>
                         <div className="border rounded-md">
                            <EditorToolbar editor={editor} />
                            <RichTextEditor
                                id="drift-editor"
                                content=""
                                onChange={setEditorContent}
                                setEditorInstance={(id, ed) => setEditor(ed)}
                                removeEditorInstance={() => setEditor(null)}
                                placeholder="Your initial thoughts, analysis, or questions..."
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <DialogClose asChild><Button type="button" variant="ghost">Cancel</Button></DialogClose>
                        <SubmitButton>Start Drift</SubmitButton>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

export function NoteDialog({ open, onOpenChange, articleInfo, block, existingNote }: DialogProps & { existingNote?: string }) {
    const [state, formAction] = useActionState(saveBlockNote, null);
    const formRef = useInteractionDialog(state, onOpenChange);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{existingNote ? 'Edit' : 'Add'} Private Note</DialogTitle>
                    <DialogDescription>This note is only visible to you. It's linked to the selected block of text.</DialogDescription>
                </DialogHeader>
                 <form ref={formRef} action={formAction} className="space-y-4">
                    <input type="hidden" name="bookId" value={articleInfo.book.bookId} />
                    <input type="hidden" name="chapterId" value={String(articleInfo.chapter.id)} />
                    <input type="hidden" name="verse" value={String(articleInfo.article.verse)} />
                    <input type="hidden" name="blockId" value={block.id} />
                    <input type="hidden" name="bookName" value={articleInfo.book.bookName} />
                    <input type="hidden" name="articleTitle" value={articleInfo.article.title} />
                    <input type="hidden" name="blockTextPreview" value={block.sanskrit.replace(/<[^>]+>/g, ' ').substring(0, 100)} />

                    <Textarea name="note" defaultValue={existingNote} placeholder="Your private reflections..." required rows={6} />
                    {state?.fieldErrors?.note && <p className="text-sm text-destructive mt-1">{state.fieldErrors.note[0]}</p>}
                    <DialogFooter>
                        <DialogClose asChild><Button type="button" variant="ghost">Cancel</Button></DialogClose>
                        <SubmitButton>Save Note</SubmitButton>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
