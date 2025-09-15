

'use client';

import React, { useActionState, useRef, useEffect, useState, useCallback } from 'react';
import { useFormStatus } from 'react-dom';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { createPost } from '@/actions/post.actions';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Send, BrainCircuit, ScrollText, HelpCircle, PenLine, BookOpen, Layers3, ChevronDown, Plus, X } from 'lucide-react';
import { VaikhariLogo } from '../icons';
import type { PostType, UserProfile, Circle, ChintanaCategory, ChintanaPostType, Quote, QuoteCategory } from '@/types';
import { AnnounceWorkDialog, type AttachedWork } from './announce-work-dialog';
import { useEditor, EditorContent, type Editor, type Range } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { CitationNode, CustomBlockquote, QuoteSuggestions, QuoteCapture, TagSuggestion, MentionSuggestion, MetaTagSuggestion } from '@/components/admin/editor/tiptap-extensions';
import { TextSelectionMenu } from '@/components/text-selection-menu';
import { UserCitationDialog } from '@/components/user-citation-dialog';
import { CreateQuoteDialog } from '@/components/admin/quote-forms';
import { getQuoteData } from '@/services/quote.service';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { CreateThreadDialog } from './create-chintana-thread-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose } from '@/components/ui/dialog';

function SubmitButton({ isChintana }: { isChintana?: boolean }) {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" size="icon" variant="ghost" className="rounded-full flex-shrink-0 group hover:bg-transparent" disabled={pending}>
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : (
                isChintana ? <Layers3 className="h-8 w-8 text-primary transition-transform duration-200 group-hover:scale-[1.15]" /> : <VaikhariLogo className="h-8 w-8 transition-transform duration-200 group-hover:scale-[1.35]" />
            )}
        </Button>
    );
}

const postTypes: { value: PostType, label: string, icon: React.ElementType }[] = [
    { value: 'thought', label: 'Thought', icon: BrainCircuit },
    { value: 'reflection', label: 'Reflection', icon: ScrollText },
    { value: 'sutra', label: 'Sutra', icon: VaikhariLogo },
    { value: 'question', label: 'Question', icon: HelpCircle },
    { value: 'poetry', label: 'Poetry', icon: PenLine },
];

function AttachedWorkPreview({ work, onRemove }: { work: AttachedWork, onRemove: () => void }) {
    return (
        <div className="px-3 pb-2">
            <Card className="bg-muted relative group">
                <button type="button" onClick={onRemove} className="absolute top-1 right-1 z-10 h-6 w-6 rounded-full bg-background/50 hover:bg-background flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <X className="h-4 w-4" />
                </button>
                <Link href={work?.href} className="block group">
                    <div className="p-3 flex items-center gap-3">
                        {work.profileUrl && (
                            <div className="w-12 h-16 relative flex-shrink-0">
                                <Image src={work.profileUrl} alt={work.title} layout="fill" objectFit="cover" className="rounded-sm shadow-md" data-ai-hint="book cover" />
                            </div>
                        )}
                        <div className="flex-1 min-w-0">
                            <p className="text-xs text-muted-foreground font-medium">
                           {work.type === 'book' ? 'Book Announcement' : work.type === 'book-article' ? 'Book Article' : 'Standalone Article'}
                            </p>
                            <p className="font-semibold leading-tight group-hover:underline">{work.title}</p>
                            {work.parentTitle && <p className="text-sm text-muted-foreground truncate">{work.parentTitle}</p>}
                            {work.type === 'book' && work.description && (
                                <div 
                                    className="text-xs text-muted-foreground line-clamp-2 prose-sm prose-p:my-0"
                                    dangerouslySetInnerHTML={{ __html: work.description }} 
                                />
                            )}
                        </div>
                    </div>
                </Link>
            </Card>
        </div>
    );
}

function PostFormActions({ 
    selectedPostType, 
    setSelectedPostType, 
    postMethod, 
    circles,
    setIsAnnounceDialogOpen,
    selectedCircle,
    setSelectedCircle,
}: {
    selectedPostType: PostType;
    setSelectedPostType: (type: PostType) => void;
    postMethod: 'feed' | 'circle';
    circles?: Circle[];
    setIsAnnounceDialogOpen: (open: boolean) => void;
    selectedCircle: string | undefined;
    setSelectedCircle: (id: string | undefined) => void;
}) {
    return (
        <div className="flex items-center gap-1">
            <Select name="postType" value={selectedPostType} onValueChange={(v) => setSelectedPostType(v as PostType)}>
                <SelectTrigger className="w-auto h-8 rounded-full text-xs gap-2 border-primary bg-primary/20 text-primary font-semibold">
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    {postTypes.map(({ value, label, icon: Icon }) => (
                        <SelectItem key={value} value={value}>
                            <div className="flex items-center gap-2"><Icon className="h-4 w-4" /> {label}</div>
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>

            {postMethod === 'circle' && circles && circles.length > 0 && (
                <Select name="circleId" value={selectedCircle} onValueChange={setSelectedCircle} required>
                    <SelectTrigger className="w-auto h-8 rounded-full text-xs gap-2">
                        <SelectValue placeholder="Post to Circle..." />
                    </SelectTrigger>
                    <SelectContent>
                        {circles.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                    </SelectContent>
                </Select>
            )}

            <Button type="button" variant="ghost" size="sm" className="rounded-full h-8" onClick={() => setIsAnnounceDialogOpen(true)}>
                <BookOpen className="mr-2 h-4 w-4" /> Announce
            </Button>
        </div>
    );
}


export function CreatePostForm({ userProfile, onPostCreated, context, circles, chintanaCategories, initialContent }: { 
    userProfile: UserProfile, 
    onPostCreated?: () => void,
    context?: any,
    circles?: Circle[],
    chintanaCategories?: ChintanaCategory[],
    initialContent?: string,
}) {
    const isChintanaMode = context?.type === 'chintana';
    const isCirclePost = context?.type === 'circle-feed';
    const postMethod = isCirclePost ? 'circle' : 'feed';

    const [state, formAction] = useActionState(createPost, null);
    const { toast } = useToast();
    const formRef = useRef<HTMLFormElement>(null);
    
    const [isAnnounceDialogOpen, setIsAnnounceDialogOpen] = useState(false);
    const [isChintanaDialogOpen, setIsChintanaDialogOpen] = useState(false);

    const [attachedWork, setAttachedWork] = useState<AttachedWork | null>(null);
    const [content, setContent] = useState('');
    const [selectedPostType, setSelectedPostType] = useState<PostType>('thought');
    const [selectedCircle, setSelectedCircle] = useState<string | undefined>();
    
    const [quoteCategories, setQuoteCategories] = useState<QuoteCategory[]>([]);
    const [quoteDialogState, setQuoteDialogState] = useState<{ open: boolean; text: string; range: Range | null }>({ open: false, text: '', range: null });
    const [citationDialogState, setCitationDialogState] = useState({ open: false, text: '' });

    const editor = useEditor({
        extensions: [
             StarterKit.configure({
                blockquote: false,
                heading: false,
                horizontalRule: false,
                bulletList: false,
                orderedList: false,
                listItem: false,
            }),
            Placeholder.configure({
                placeholder: 'What’s cooking?',
            }),
            CitationNode,
            CustomBlockquote,
            QuoteSuggestions,
            TagSuggestion,
            MentionSuggestion,
            MetaTagSuggestion,
        ],
        content: initialContent || '',
        onUpdate: ({ editor }) => {
            setContent(editor.getHTML());
        },
    });
    
    useEffect(() => {
        getQuoteData().then(setQuoteCategories);
    }, []);

    useEffect(() => {
        if (initialContent && editor && !editor.isDestroyed && editor.getHTML() !== initialContent) {
          editor.commands.setContent(initialContent);
          setContent(initialContent);
        }
    }, [initialContent, editor]);

    const resetForm = useCallback(() => {
        editor?.commands.clearContent();
        formRef.current?.reset();
        setSelectedPostType('thought');
        setAttachedWork(null);
        setSelectedCircle(undefined);
        onPostCreated?.();
    }, [editor, onPostCreated]);

    useEffect(() => {
        if (state?.success) {
            toast({ title: "Post Created!" });
            resetForm();
        }
        if (state?.error) {
            if (state.fieldErrors?.content) {
                toast({ variant: 'destructive', title: "Validation Error", description: state.fieldErrors.content[0] });
            } else {
                toast({ variant: 'destructive', title: "Error", description: state.error });
            }
        }
    }, [state, toast, resetForm]);
    
    const handleWorkSelected = (work: AttachedWork) => {
        setAttachedWork(work);
    };
    
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
            <AnnounceWorkDialog open={isAnnounceDialogOpen} onOpenChange={setIsAnnounceDialogOpen} onWorkSelected={handleWorkSelected} />
             <UserCitationDialog
                    open={citationDialogState.open}
                    onOpenChange={(isOpen) => setCitationDialogState({ open: isOpen, text: '' })}
                    sanskritText={citationDialogState.text}
                    source={{ name: `Activity Wall Post`, location: `New Post` }}
                />
            <CreateQuoteDialog
                open={quoteDialogState.open}
                onOpenChange={(isOpen) => setQuoteDialogState(prev => ({ ...prev, open: isOpen }))}
                initialQuote={quoteDialogState.text}
                onQuoteCreated={handleQuoteCreated}
                categories={quoteCategories}
            />
            <CreateThreadDialog open={isChintanaDialogOpen} onOpenChange={setIsChintanaDialogOpen} categories={chintanaCategories || []} onCircleCreated={onPostCreated} />

            <div className="w-full max-w-3xl">
                {isChintanaMode ? (
                     <Button onClick={() => setIsChintanaDialogOpen(true)}>
                        <Plus className="mr-2 h-4 w-4" /> Start New Chintana Thread
                    </Button>
                ) : (
                    <form action={formAction} ref={formRef} className="space-y-3">
                        <input type="hidden" name="content" value={content} />
                        <input type="hidden" name="postMethod" value={postMethod} />
                        
                        {postMethod === 'circle' && (
                            <input type="hidden" name="circleId" value={selectedCircle || ''} />
                        )}

                        {attachedWork && (
                            <input type="hidden" name="attachedWork" value={JSON.stringify(attachedWork)} />
                        )}

                        <Card className="flex flex-col rounded-lg shadow-lg border">
                            <div className="flex items-start gap-3 p-3">
                                <Avatar className="h-9 w-9">
                                    <AvatarImage src={userProfile.avatarUrl} alt={userProfile.name} data-ai-hint="person avatar" />
                                    <AvatarFallback>{userProfile.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div 
                                    className="flex-1 tiptap-minimal overflow-y-auto scrollable border rounded-md min-h-[120px] p-2"
                                    onClick={() => editor?.chain().focus().run()}
                                >
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
                                </div>
                            </div>

                            {attachedWork && (
                                <AttachedWorkPreview work={attachedWork} onRemove={() => setAttachedWork(null)} />
                            )}

                            <div className="flex items-center justify-between p-2 border-t mt-2">
                                <PostFormActions
                                    selectedPostType={selectedPostType}
                                    setSelectedPostType={setSelectedPostType}
                                    postMethod={postMethod}
                                    circles={circles}
                                    setIsAnnounceDialogOpen={setIsAnnounceDialogOpen}
                                    selectedCircle={selectedCircle}
                                    setSelectedCircle={setSelectedCircle}
                                />
                                <SubmitButton isChintana={isChintanaMode} />
                            </div>
                        </Card>
                    </form>
                )}
            </div>
        </>
    );
}
