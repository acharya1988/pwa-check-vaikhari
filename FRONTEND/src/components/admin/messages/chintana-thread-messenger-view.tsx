
'use client';

import React, { useState, useEffect, useRef, useActionState, useCallback, useMemo } from 'react';
import { useFormStatus } from 'react-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem, SelectGroup, SelectLabel } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ChintanaReactionButtons, FlagFallacyDialog } from '@/components/social/chintana-reaction-buttons';
import { ScrollArea } from '@/components/ui/scroll-area';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '@/components/ui/alert-dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useEditor, EditorContent, type Editor, type Range } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { CitationNode, CustomBlockquote, QuoteSuggestions, TagSuggestion, MentionSuggestion, MetaTagSuggestion } from '@/components/admin/editor/tiptap-extensions';
import { TextSelectionMenu } from '@/components/text-selection-menu';
import { UserCitationDialog } from '@/components/user-citation-dialog';
import { CreateQuoteDialog } from '@/components/admin/quote-forms';
import { Input } from '@/components/ui/input';

const postTypeColorStyles: Record<ChintanaPostType, string> = {
    'prashna': 'bg-gradient-to-br from-blue-500 to-cyan-500 text-white',
    'purva-paksha': 'bg-blue-100 dark:bg-blue-900/50',
    'uttara-paksha': 'bg-yellow-100 dark:bg-yellow-900/50',
    'samadhana': 'bg-cyan-100 dark:bg-cyan-900/50',
    'siddhanta': 'bg-green-100 dark:bg-green-900/50',
    'vicara': 'bg-gray-200 dark:bg-gray-700/80',
    'fallacy-flag': 'bg-red-100 dark:bg-red-900/50 border border-destructive/50',
};

const flattenPostsWithReplies = (posts: ChintanaPost[], level = 0): (ChintanaPost & { level: number })[] => {
    let allPosts: (ChintanaPost & { level: number })[] = [];
    posts.forEach(post => {
        allPosts.push({ ...post, level }); // Add parent with its level
        if (post.replies && post.replies.length > 0) {
            const childPosts = flattenPostsWithReplies(post.replies, level + 1);
            allPosts = allPosts.concat(childPosts);
        }
    });
    return allPosts;
};

function PostBubble({ post, currentUser, onReply, onNewQuote }: { 
    post: ChintanaPost & { level?: number };
    currentUser: UserProfile;
    onReply: (post: ChintanaPost) => void;
    onNewQuote: (text: string, range: Range) => void;
}) {
    const isAuthor = post.author.id === currentUser.email;
    const postTypeConfig = CHINTANA_POST_TYPES.find(p => p.id === post.postType);
    const bubbleStyle = postTypeColorStyles[post.postType] || 'bg-card';
    const isFallacy = post.postType === 'fallacy-flag';
    const [showActions, setShowActions] = useState(false);
    
    let alignmentClass = 'items-start';
    if(post.postType === 'siddhanta') alignmentClass = 'items-center';
    else if(isAuthor) alignmentClass = 'items-end';

    const [selectedText, setSelectedText] = useState('');
    const [isCitationDialogOpen, setIsCitationDialogOpen] = useState(false);

    const handleTextSelection = useCallback((text: string) => {
        if (text) {
            setSelectedText(text);
        }
    }, []);

    return (
        <>
        <UserCitationDialog 
            open={isCitationDialogOpen} 
            onOpenChange={setIsCitationDialogOpen} 
            sanskritText={selectedText}
            source={{ name: `Chintana Thread`, location: `Post by ${post.author.name}`}}
            defaultCategoryId="collected-from-post"
        />
        <div 
            className={cn("flex flex-col gap-1 w-full", alignmentClass)} 
            style={{ paddingLeft: !isAuthor ? `${(post.level || 0) * 1.5}rem` : '0', paddingRight: isAuthor ? `${(post.level || 0) * 1.5}rem` : '0' }}
            onMouseEnter={() => setShowActions(true)}
            onMouseLeave={() => setShowActions(false)}
        >
            <div className={cn(
                "max-w-[85%] rounded-xl p-3 shadow-sm", 
                bubbleStyle,
                isAuthor ? "rounded-br-none" : "rounded-bl-none"
            )}>
                <div className="flex justify-between items-baseline gap-2">
                    <p className="font-semibold text-sm">{post.author.name}</p>
                    <p className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}</p>
                </div>
                
                {postTypeConfig && <Badge variant="outline" className="text-xs mt-1 mb-2 bg-background/50">{postTypeConfig.name}</Badge>}
                
                {isFallacy && post.title && <h4 className="font-bold text-base mb-2 text-destructive">{post.title}</h4>}
                
                <div className="mt-1">
                     <TextSelectionMenu 
                        onSelectText={handleTextSelection}
                        onSaveCitation={() => setIsCitationDialogOpen(true)}
                        onCreateQuote={() => {
                            const selection = window.getSelection();
                            if (selection && selection.rangeCount > 0) {
                                const range = selection.getRangeAt(0);
                                onNewQuote(selectedText, range);
                            }
                        }}
                    >
                        <SocialContentRenderer htmlString={post.content} />
                    </TextSelectionMenu>
                </div>
            </div>

            {showActions && (
                <div className="mt-1 flex items-center justify-end gap-1">
                    <ChintanaReactionButtons threadId="" postId={post.id} reactions={post.reactions} />
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onReply(post)} title="Reply">
                        <ReplyIcon className="h-4 w-4 text-muted-foreground" />
                    </Button>
                </div>
            )}
        </div>
        </>
    );
}

function SubmitButton({ children }: { children: React.ReactNode }) {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" disabled={pending}>
            {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            {children}
        </Button>
    )
}

function ReplyForm({
    threadId,
    replyingTo,
    onCancel,
    onReplyPosted
}: {
    threadId: string;
    replyingTo: ChintanaPost;
    onCancel: () => void;
    onReplyPosted: () => void;
}) {
    const [state, formAction] = useActionState(addPostToThread, null);
    const { toast } = useToast();
    const formRef = useRef<HTMLFormElement>(null);
    const [content, setContent] = useState('');
    
    const editor = useEditor({
        extensions: [
            StarterKit.configure({ blockquote: false }),
            Placeholder.configure({ placeholder: 'Write your reply...' }),
            CitationNode,
            CustomBlockquote,
            QuoteSuggestions,
            TagSuggestion,
            MentionSuggestion,
            MetaTagSuggestion,
        ],
        onUpdate: ({ editor }) => setContent(editor.getHTML()),
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
    
    return (
        <Card className="m-2">
            <CardHeader className="p-3">
                 <div className="flex justify-between items-center">
                    <p className="text-sm font-semibold">Replying to {replyingTo.author.name}</p>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onCancel}><X className="h-4 w-4" /></Button>
                </div>
                 <blockquote className="border-l-2 pl-2 text-xs italic text-muted-foreground line-clamp-2">
                   <SocialContentRenderer htmlString={replyingTo.content} />
                </blockquote>
            </CardHeader>
            <CardContent className="p-3 pt-0">
                <form ref={formRef} action={formAction} className="space-y-2">
                    <input type="hidden" name="threadId" value={threadId} />
                    <input type="hidden" name="replyToPostId" value={replyingTo.id} />
                    <input type="hidden" name="content" value={content} />
                    
                    <EditorContent editor={editor} className="min-h-[100px] w-full rounded-md border border-input bg-card px-3 py-2 text-sm" />

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
                        <SubmitButton>Post Reply</SubmitButton>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}

export function ChintanaThreadMessengerView({ thread, currentUser, onReplyPosted }: { 
    thread: ChintanaThread, 
    currentUser: UserProfile,
    onReplyPosted?: () => void,
}) {
    const [replyingTo, setReplyingTo] = useState<ChintanaPost | null>(null);
    const [quoteCategories, setQuoteCategories] = React.useState<QuoteCategory[]>([]);
    const [quoteDialogState, setQuoteDialogState] = React.useState<{ open: boolean; text: string; range: Range | null }>({ open: false, text: '', range: null });

     useEffect(() => {
        getQuoteData().then(setQuoteCategories);
    }, []);

    const handleNewQuoteFound = React.useCallback((text: string, range: Range) => {
        setQuoteDialogState({ open: true, text, range });
    }, []);

    const handleQuoteCreated = React.useCallback((newQuote?: Quote) => {
        setQuoteDialogState({ open: false, text: '', range: null });
        if (newQuote) {
             navigator.clipboard.writeText(`"${newQuote.quote}" - ${newQuote.author}`);
        }
    }, []);

    const flatPosts = useMemo(() => {
        return flattenPostsWithReplies(thread.posts);
    }, [thread.posts]);
    
    const handleReplyPosted = () => {
        setReplyingTo(null);
        if (onReplyPosted) onReplyPosted();
    }
    
    return (
      <div className="flex flex-col h-full bg-muted/30">
          <CreateQuoteDialog
            open={quoteDialogState.open}
            onOpenChange={(isOpen) => setQuoteDialogState(prev => ({ ...prev, open: isOpen }))}
            initialQuote={quoteDialogState.text}
            onQuoteCreated={handleQuoteCreated}
            categories={quoteCategories}
            defaultCategoryId="collected-from-post"
        />
          <ScrollArea className="flex-1">
              <div className="p-4 md:p-6 space-y-4">
                  {flatPosts.map((post) => (
                      <PostBubble key={post.id} post={post} currentUser={currentUser} onReply={setReplyingTo} onNewQuote={handleNewQuoteFound} />
                  ))}
              </div>
          </ScrollArea>
           <footer className="p-2 border-t bg-card flex-shrink-0">
               {replyingTo ? (
                   <ReplyForm 
                    threadId={thread.id} 
                    replyingTo={replyingTo} 
                    onCancel={() => setReplyingTo(null)}
                    onReplyPosted={handleReplyPosted}
                   />
               ) : (
                    <div className="text-center text-sm text-muted-foreground p-2">Click on a message to reply.</div>
               )}
           </footer>
      </div>
    )
}
