

'use client';

import React, { useState, useEffect, useRef, useActionState, useCallback } from 'react';
import { useFormStatus } from 'react-dom';
import { Button } from '@/components/ui/button';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { createChintanaThread } from '@/actions/chintana.actions';
import { Loader2 } from 'lucide-react';
import type { ChintanaCategory, Quote, QuoteCategory, Post } from '@/types';
import { TagInput } from '@/components/ui/tag-input';

import { useEditor, EditorContent, type Editor, type Range } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { CitationNode, CustomBlockquote, QuoteSuggestions } from '@/components/admin/editor/tiptap-extensions';
import { TextSelectionMenu } from '@/components/text-selection-menu';
import { UserCitationDialog } from '@/components/user-citation-dialog';
import { CreateQuoteDialog } from '@/components/admin/quote-forms';
import { getQuoteData } from '@/services/quote.service';
import { GenreSelector } from '@/app/admin/genre/genre-provider-system';

function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" disabled={pending}>
            {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Thread
        </Button>
    );
}

export function CreateThreadDialog({ 
    children,
    open,
    onOpenChange,
    categories, 
    onCircleCreated, 
    post,
    initialContent
}: { 
    children?: React.ReactNode;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    categories: ChintanaCategory[],
    onCircleCreated?: () => void,
    post?: Post,
    initialContent?: string
 }) {
  const [state, formAction] = useActionState(createChintanaThread, null);
  const { toast } = useToast();
  const formRef = useRef<HTMLFormElement>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [content, setContent] = useState(post?.content || initialContent || '');

  const [quoteCategories, setQuoteCategories] = useState<QuoteCategory[]>([]);
  const [quoteDialogState, setQuoteDialogState] = useState<{ open: boolean; text: string; range: Range | null }>({ open: false, text: '', range: null });
  const [citationDialogState, setCitationDialogState] = useState({ open: false, text: '' });


  const editor = useEditor({
    extensions: [
        StarterKit.configure({
            blockquote: false,
        }),
        Placeholder.configure({
            placeholder: 'Share your argument or question... Use [[ for citations or " for quotes.',
        }),
        CitationNode,
        CustomBlockquote,
        QuoteSuggestions,
    ],
    onUpdate: ({ editor }) => {
        setContent(editor.getHTML());
    },
    editorProps: {
        attributes: {
            class: 'min-h-[120px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
        },
    },
  });
  
  // useEffect(() => {
  //   if (open) {
  //     getQuoteData().then(setQuoteCategories);
  //     const initialContent = post?.content || '';
  //     if (editor && editor.getHTML() !== initialContent) {
  //       editor.commands.setContent(initialContent);
  //     }
  //   }
  // }, [open, post, editor]);
  useEffect(() => {
  if (open && editor) {
    getQuoteData().then(setQuoteCategories);
    const init = post?.content || initialContent || '';
    if (init && editor.getHTML() !== init) {
      editor.commands.setContent(init);
      setContent(init); // keep state in sync
    }
  }
}, [open, post, editor, initialContent]);


  useEffect(() => {
    if (state?.success) {
        toast({ title: "Success!", description: state.message });
        onOpenChange(false);
        formRef.current?.reset();
        editor?.commands.clearContent();
        setTags([]);
        onCircleCreated?.();
    }
    if (state?.error) {
        toast({ variant: 'destructive', title: "Error", description: state.error });
    }
  }, [state, toast, onOpenChange, onCircleCreated, editor]);

  const handleTextSelection = useCallback((text: string) => {
    if (text) {
        setQuoteDialogState(prev => ({ ...prev, text }));
        setCitationDialogState(prev => ({...prev, text }));
    }
  }, []);

  const handleNewQuoteFound = useCallback((text: string, range: Range) => {
      setQuoteDialogState({ open: true, text, range });
  }, []);

  const handleQuoteCreated = useCallback((newQuote?: Quote) => {
      const range = quoteDialogState.range;
      if (!newQuote || !range || !editor) return;
      editor.chain().focus().deleteRange(range).insertContent({
          type: 'blockquote',
          attrs: { author: newQuote.author },
          content: [{ type: 'paragraph', content: [{ type: 'text', text: newQuote.quote }] }]
      }).run();
      setQuoteDialogState({ open: false, text: '', range: null });
  }, [editor, quoteDialogState.range]);

  return (
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      {children && <DialogTrigger asChild>{children}</DialogTrigger>}
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Start a New Chintana Thread</DialogTitle>
          <DialogDescription>
            Initiate a structured discourse. Begin with a question (prashna) or a foundational argument (pūrva paksha).
          </DialogDescription>
        </DialogHeader>
        <form ref={formRef} action={formAction} className="space-y-4">
            <input type="hidden" name="initialPostContent" value={content} />
            {post && <input type="hidden" name="sourcePostId" value={post.id} />}
            <div>
                <Label htmlFor="title">Thread Title</Label>
                <Input id="title" name="title" required defaultValue={post ? `Discussion on: ${post.content.substring(0,20)}...` : ''} />
                 {state?.fieldErrors?.title && <p className="text-sm text-destructive mt-1">{state.fieldErrors.title[0]}</p>}
            </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                   <Label>Categorization</Label>
                    <div className="p-4 border rounded-md">
                       <GenreSelector />
                    </div>
                    {state?.fieldErrors?.genreId && <p className="text-sm text-destructive mt-1">{state.fieldErrors.genreId[0]}</p>}
                    {state?.fieldErrors?.categoryId && <p className="text-sm text-destructive mt-1">{state.fieldErrors.categoryId[0]}</p>}
                </div>
                 <div>
                    <Label htmlFor="tags">Tags (comma-separated)</Label>
                    <TagInput value={tags} onChange={setTags} />
                    <input type="hidden" name="tags" value={tags.join(',')} />
                </div>
            </div>
             <div>
                <Label htmlFor="initialPostType">Initial Post Type</Label>
                 <Select name="initialPostType" required defaultValue={post ? 'purva-paksha' : 'prashna'}>
                    <SelectTrigger id="initialPostType">
                        <SelectValue placeholder="Select a post type" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="prashna">Prashna (Question)</SelectItem>
                        <SelectItem value="purva-paksha">Pūrva Paksha (Initial Argument)</SelectItem>
                    </SelectContent>
                </Select>
            </div>
             <div>
                <Label htmlFor="initialPostContent">Content</Label>
                 <TextSelectionMenu
                    onSelectText={handleTextSelection}
                    onSaveCitation={() => setCitationDialogState(prev => ({...prev, open: true}))}
                    onCreateQuote={() => {
                        const selection = window.getSelection();
                        if (selection) {
                            const range = selection.getRangeAt(0);
                            setQuoteDialogState(prev => ({ ...prev, open: true, range }));
                        }
                    }}
                >
                    <EditorContent editor={editor} />
                </TextSelectionMenu>
                {state?.fieldErrors?.initialPostContent && <p className="text-sm text-destructive mt-1">{state.fieldErrors.initialPostContent[0]}</p>}
            </div>

          <DialogFooter>
            <DialogClose asChild><Button variant="ghost">Cancel</Button></DialogClose>
            <SubmitButton />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
    <UserCitationDialog
        open={citationDialogState.open}
        onOpenChange={(isOpen) => setCitationDialogState({ open: isOpen, text: '' })}
        sanskritText={citationDialogState.text}
        source={{ name: `Chintana Thread`, location: `Initial Post` }}
    />
    <CreateQuoteDialog
        open={quoteDialogState.open}
        onOpenChange={(isOpen) => setQuoteDialogState(prev => ({ ...prev, open: isOpen }))}
        initialQuote={quoteDialogState.text}
        onQuoteCreated={handleQuoteCreated}
        categories={quoteCategories}
    />
    </>
  );
}

    
