

'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useFormStatus, useActionState } from 'react-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { createAnswer } from '@/actions/post.actions';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Send } from 'lucide-react';
import type { UserProfile, Quote, QuoteCategory } from '@/types';

// Tiptap imports
import { useEditor, EditorContent, type Editor, type Range } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { CitationNode, CustomBlockquote, QuoteSuggestions, TagSuggestion, MentionSuggestion, MetaTagSuggestion } from '@/components/admin/editor/tiptap-extensions';
import { TextSelectionMenu } from '@/components/text-selection-menu';
import { UserCitationDialog } from '@/components/user-citation-dialog';
import { CreateQuoteDialog } from '@/components/admin/quote-forms';
import { getQuoteData } from '@/services/quote.service';

function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" disabled={pending}>
            {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
            Post Answer
        </Button>
    );
}

export function CreateAnswerForm({ postId, userProfile }: { postId: string, userProfile: UserProfile }) {
    const [state, formAction] = useActionState(createAnswer, null);
    const { toast } = useToast();
    const formRef = useRef<HTMLFormElement>(null);
    const [content, setContent] = useState('');
    
    const [quoteCategories, setQuoteCategories] = useState<QuoteCategory[]>([]);
    const [quoteDialogState, setQuoteDialogState] = useState<{ open: boolean; text: string; range: Range | null }>({ open: false, text: '', range: null });
    const [citationDialogState, setCitationDialogState] = useState({ open: false, text: '' });

    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                blockquote: false, // Use custom blockquote
            }),
            Placeholder.configure({
                placeholder: 'Write your answer... Use [[ for citations, or " for quotes...',
            }),
            CitationNode,
            CustomBlockquote,
            QuoteSuggestions,
            TagSuggestion,
            MentionSuggestion,
            MetaTagSuggestion,
        ],
        onUpdate: ({ editor }) => {
            setContent(editor.getHTML());
        },
        editorProps: {
            attributes: {
                class: 'min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
            },
        },
    });

    useEffect(() => {
        getQuoteData().then(setQuoteCategories);
    }, []);
    
    useEffect(() => {
        if (state?.success) {
            toast({ title: "Answer Posted!" });
            editor?.commands.clearContent();
            formRef.current?.reset();
        }
        if (state?.error) {
            if (state.fieldErrors?.content) {
                 toast({ variant: 'destructive', title: "Validation Error", description: state.fieldErrors.content[0] });
            } else {
                 toast({ variant: 'destructive', title: "Error", description: state.error });
            }
        }
    }, [state, toast, editor]);
    
     const handleTextSelection = useCallback((text: string) => {
        if (text) {
            setQuoteDialogState(prev => ({ ...prev, text }));
            setCitationDialogState(prev => ({...prev, text }));
        }
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
            <UserCitationDialog
                open={citationDialogState.open}
                onOpenChange={(isOpen) => setCitationDialogState({ open: isOpen, text: '' })}
                sanskritText={citationDialogState.text}
                source={{ name: `Post Answer`, location: `Post ID: ${postId}` }}
            />
            <CreateQuoteDialog
                open={quoteDialogState.open}
                onOpenChange={(isOpen) => setQuoteDialogState(prev => ({ ...prev, open: isOpen }))}
                initialQuote={quoteDialogState.text}
                onQuoteCreated={handleQuoteCreated}
                categories={quoteCategories}
            />
            <Card>
                <CardContent className="p-4">
                    <form action={formAction} ref={formRef} className="flex items-start gap-4">
                         <Avatar>
                            <AvatarImage src={userProfile.avatarUrl} alt={userProfile.name} data-ai-hint="person avatar" />
                            <AvatarFallback>{userProfile.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 space-y-2">
                            <input type="hidden" name="postId" value={postId} />
                            <input type="hidden" name="content" value={content} />
                             <TextSelectionMenu
                                onSelectText={handleTextSelection}
                                onSaveCitation={() => setCitationDialogState(prev => ({...prev, open: true}))}
                                onCreateQuote={() => {
                                    const selection = window.getSelection();
                                    if (selection && selection.rangeCount > 0) {
                                        const range = selection.getRangeAt(0);
                                        setQuoteDialogState(prev => ({ ...prev, open: true, range }));
                                    }
                                }}
                            >
                                <EditorContent editor={editor} />
                            </TextSelectionMenu>
                            {state?.fieldErrors?.content && (
                                <p className="text-sm text-destructive">{state.fieldErrors.content[0]}</p>
                             )}
                             <div className="flex justify-end">
                                <SubmitButton />
                            </div>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </>
    );
}

    
