
'use client';

import React, { useState, useEffect, useRef, useActionState, useCallback, useMemo } from 'react';
import { useFormStatus } from 'react-dom';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import type { ChintanaThread, ChintanaPost, UserProfile, ChintanaPostType, ChintanaPostReactions, Quote, QuoteCategory } from '@/types';
import { addPostToThread, handlePostReaction, deleteChintanaThread } from '@/actions/chintana.actions';
import { getQuoteData } from '@/services/quote.service';
import { ArrowLeft, MessageSquare, BrainCircuit, Loader2, Send, ThumbsDown, ThumbsUp, MoreVertical, Trash2, Pencil, AlertTriangle, PlusCircle, Bookmark, Printer, ReplyIcon, X, Bookmark as BookmarkIcon } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { SocialContentRenderer } from '@/components/social/social-content-renderer';
import { CHINTANA_POST_TYPES } from '@/types/chintana.constants';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem, SelectGroup, SelectLabel } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ChintanaReactionButtons, FlagFallacyDialog } from '@/components/social/chintana-reaction-buttons';
import { ScrollArea } from '@/components/ui/scroll-area';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';

import { useEditor, EditorContent, type Editor, type Range } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { CitationNode, CustomBlockquote, QuoteSuggestions, TagSuggestion, MentionSuggestion, MetaTagSuggestion } from '@/components/admin/editor/tiptap-extensions';
import { TextSelectionMenu } from '@/components/text-selection-menu';
import { UserCitationDialog } from '@/components/user-citation-dialog';
import { CreateQuoteDialog } from '@/components/admin/quote-forms';


function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" disabled={pending}>
            {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Post Reply'}
        </Button>
    )
}

function ReplyForm({ threadId, parentPostId, onCancel, onReplyPosted }: { 
    threadId: string; 
    parentPostId: string; 
    onCancel: () => void,
    onReplyPosted: () => void 
}) {
    const [state, formAction] = useActionState(addPostToThread, null);
    const { toast } = useToast();
    const formRef = useRef<HTMLFormElement>(null);
    const [content, setContent] = useState('');
    const [quoteCategories, setQuoteCategories] = useState<QuoteCategory[]>([]);
    const [quoteDialogState, setQuoteDialogState] = useState<{ open: boolean; text: string; range: Range | null }>({ open: false, text: '', range: null });
    const [citationDialogState, setCitationDialogState] = useState({ open: false, text: '' });
    
    useEffect(() => {
        getQuoteData().then(setQuoteCategories);
    }, []);

    const editor = useEditor({
        extensions: [
            StarterKit.configure({ blockquote: false }),
            Placeholder.configure({ placeholder: 'Write your reply... Use [[ for citations, or " for quotes...' }),
            CitationNode,
            CustomBlockquote,
            QuoteSuggestions,
            TagSuggestion,
            MentionSuggestion,
            MetaTagSuggestion,
        ],
        onUpdate: ({ editor }) => setContent(editor.getHTML()),
        editorProps: {
            attributes: {
                class: 'min-h-[120px] w-full rounded-md border border-input bg-card px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
            },
        },
    });

    useEffect(() => {
        if (state?.success) {
            toast({ title: 'Reply posted!' });
            formRef.current?.reset();
            editor?.commands.clearContent();
            onReplyPosted();
        }
        if (state?.error) {
            toast({ variant: 'destructive', title: 'Error', description: state.error });
        }
    }, [state, toast, onReplyPosted, editor]);
    
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
            <UserCitationDialog open={citationDialogState.open} onOpenChange={(isOpen) => setCitationDialogState({ open: isOpen, text: '' })} sanskritText={citationDialogState.text} source={{ name: `Chintana Thread ${threadId}`, location: `Reply to post ${parentPostId}` }} />
            <CreateQuoteDialog open={quoteDialogState.open} onOpenChange={(isOpen) => setQuoteDialogState(prev => ({ ...prev, open: isOpen }))} initialQuote={quoteDialogState.text} onQuoteCreated={handleQuoteCreated} categories={quoteCategories} />
            <Card className="mt-2">
                <CardContent className="p-4">
                    <form ref={formRef} action={formAction} className="space-y-3">
                        <input type="hidden" name="threadId" value={threadId} />
                        <input type="hidden" name="replyToPostId" value={parentPostId} />
                        <input type="hidden" name="content" value={content} />
                        
                        <TextSelectionMenu onSelectText={handleTextSelection} onSaveCitation={() => setCitationDialogState(prev => ({ ...prev, open: true }))} onCreateQuote={() => {
                            const selection = window.getSelection();
                            if (selection && selection.rangeCount > 0) {
                                const range = selection.getRangeAt(0);
                                setQuoteDialogState(prev => ({ ...prev, open: true, range }));
                            }
                        }}>
                            <EditorContent editor={editor} />
                        </TextSelectionMenu>

                        <div className="flex justify-between items-center">
                            <Select name="postType" defaultValue="uttara-paksha" required>
                                <SelectTrigger className="w-auto h-8 text-xs">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectGroup>
                                        <SelectLabel>Reply Type</SelectLabel>
                                        {CHINTANA_POST_TYPES.filter(p => !['prashna', 'purva-paksha'].includes(p.id)).map(p => (
                                            <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                                        ))}
                                    </SelectGroup>
                                </SelectContent>
                            </Select>
                            <div className="flex gap-2">
                                <Button type="button" variant="ghost" size="sm" onClick={onCancel}>Cancel</Button>
                                <SubmitButton />
                            </div>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </>
    );
}

function PostComponent({ post, threadId, level = 0, currentUser }: { post: ChintanaPost, threadId: string, level?: number, currentUser: UserProfile }) {
    const [isReplying, setIsReplying] = useState(false);
    const router = useRouter();
    
    const postTypeConfig = CHINTANA_POST_TYPES.find(p => p.id === post.postType);
    const isFallacy = post.postType === 'fallacy-flag';
    
    const handleReplyPosted = () => {
        setIsReplying(false);
        router.refresh();
    };

    return (
        <div className={cn('relative', level > 0 && 'ml-4 lg:ml-8 pl-4 lg:pl-6 border-l-2')}>
             {isFallacy && (
                <Card className="mb-2 bg-red-50 dark:bg-red-900/20 border-destructive/30">
                    <CardHeader className="p-3">
                        <CardTitle className="flex items-center gap-2 text-base text-destructive">
                           <AlertTriangle className="h-5 w-5" /> Fallacy Flagged: {post.title}
                        </CardTitle>
                    </CardHeader>
                </Card>
            )}
            <div className="flex items-start gap-4">
                <Avatar>
                    <AvatarImage src={post.author.avatarUrl} alt={post.author.name} />
                    <AvatarFallback>{post.author.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                    <div className="flex items-center justify-between">
                         <div>
                            <span className="font-semibold">{post.author.name}</span>
                            <span className="text-sm text-muted-foreground"> • {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}</span>
                         </div>
                    </div>

                    {postTypeConfig && <Badge variant="outline" className="text-xs my-2">{postTypeConfig.name}</Badge>}
                    
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                        <SocialContentRenderer htmlString={post.content} />
                    </div>
                    
                    <div className="mt-2 flex items-center gap-1 -ml-2">
                       <ChintanaReactionButtons threadId={threadId} postId={post.id} reactions={post.reactions} />
                        <Button variant="ghost" size="sm" onClick={() => setIsReplying(!isReplying)}>
                            <ReplyIcon className="mr-2 h-4 w-4" /> Reply
                        </Button>
                    </div>

                    {isReplying && (
                        <ReplyForm threadId={threadId} parentPostId={post.id} onCancel={() => setIsReplying(false)} onReplyPosted={handleReplyPosted} />
                    )}

                    {post.replies && post.replies.length > 0 && (
                        <div className="mt-4 space-y-4">
                            {post.replies.map(reply => (
                                <PostComponent key={reply.id} post={reply} threadId={threadId} level={level + 1} currentUser={currentUser} />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}


export function ChintanaThreadClient({ thread, currentUser }: { thread: ChintanaThread, currentUser: UserProfile }) {
    const router = useRouter();

    return (
        <div className="container mx-auto max-w-4xl py-8 space-y-6">
             <div>
                <Button variant="link" className="p-0 h-auto text-muted-foreground" asChild>
                    <Link href="/admin/chintana"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Chintana Forum</Link>
                </Button>
            </div>
            
            <Card>
                <CardHeader>
                    <CardTitle className="text-3xl">{thread.title}</CardTitle>
                    <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline">{thread.genreId}</Badge>
                        <Badge variant="outline">{thread.categoryId}</Badge>
                        {thread.tags.map(tag => <Badge key={tag} variant="secondary">{tag}</Badge>)}
                    </div>
                </CardHeader>
                <CardContent className="space-y-6">
                    {thread.posts.map((post) => (
                        <React.Fragment key={post.id}>
                            <PostComponent post={post} threadId={thread.id} currentUser={currentUser} />
                            <Separator className="my-6" />
                        </React.Fragment>
                    ))}
                    <div className="pt-6">
                        <h3 className="font-semibold mb-4">Join the Discussion</h3>
                        <ReplyForm threadId={thread.id} parentPostId={thread.posts[thread.posts.length - 1].id} onCancel={() => {}} onReplyPosted={() => router.refresh()} />
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
