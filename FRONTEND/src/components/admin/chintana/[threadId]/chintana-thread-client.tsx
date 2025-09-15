
'use client';

import React, { useState, useEffect, useRef, useActionState, useTransition, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useFormStatus } from 'react-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button, buttonVariants } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import type { ChintanaThread, ChintanaPost, UserProfile, ChintanaPostType, ChintanaPostReactions, Quote, QuoteCategory } from '@/types';
import { addPostToThread, handlePostReaction, deleteChintanaThread } from '@/actions/chintana.actions';
import { getQuoteData } from '@/services/quote.service';
import { ArrowLeft, MessageSquare, BrainCircuit, Loader2, Send, ThumbsDown, ThumbsUp, MoreVertical, Trash2, Pencil, AlertTriangle, PlusCircle, Bookmark, Printer } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { SocialContentRenderer } from '@/components/social/social-content-renderer';
import { CHINTANA_POST_TYPES } from '@/types/chintana.constants';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
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
import { CitationNode, CustomBlockquote, QuoteSuggestions } from '@/components/admin/editor/tiptap-extensions';
import { TextSelectionMenu } from '@/components/text-selection-menu';
import { UserCitationDialog } from '@/components/user-citation-dialog';
import { CreateQuoteDialog } from '@/components/admin/quote-forms';
import { Input } from '@/components/ui/input';

const postTypeColorStyles: Record<ChintanaPostType, string> = {
    'prashna': 'bg-gradient-to-br from-blue-500 to-cyan-500 text-white',
    'purva-paksha': 'bg-gray-200 dark:bg-gray-700',
    'uttara-paksha': 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700',
    'samadhana': 'bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/50 dark:to-emerald-900/50',
    'siddhanta': 'bg-gradient-to-br from-amber-100 to-yellow-100 dark:from-amber-900/50 dark:to-yellow-900/50',
    'vicara': 'bg-gray-100 dark:bg-gray-800/50',
    'fallacy-flag': 'bg-red-100 dark:bg-red-900/50 border border-destructive/50',
};


function PostBubble({ post, level = 0, currentUser, onReply, onNewQuote }: { 
    post: ChintanaPost, 
    level?: number, 
    currentUser: UserProfile,
    onReply: (post: ChintanaPost) => void;
    onNewQuote: (text: string, range: Range) => void;
}) {
    const isAuthor = post.author.id === currentUser.email;
    const postTypeConfig = CHINTANA_POST_TYPES.find(p => p.id === post.postType);

    const [selectedText, setSelectedText] = useState('');
    const [isCitationDialogOpen, setIsCitationDialogOpen] = useState(false);

    const handleTextSelection = (text: string) => {
        if (text) setSelectedText(text);
    };

    return (
        <div className={cn("flex flex-col gap-1 w-full", isAuthor ? 'items-end' : 'items-start')}>
             <UserCitationDialog 
                open={isCitationDialogOpen} 
                onOpenChange={setIsCitationDialogOpen} 
                sanskritText={selectedText}
                source={{ name: `Chintana Thread`, location: `Post by ${post.author.name}`}}
                defaultCategoryId="collected-from-post"
            />
            <div className={cn("max-w-[80%] rounded-xl p-3 shadow-sm", postTypeColorStyles[post.postType] || 'bg-card')}>
                <div className="flex justify-between items-baseline gap-2">
                    <p className="font-semibold text-sm">{post.author.name}</p>
                    <p className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}</p>
                </div>
                {postTypeConfig && <Badge variant="outline" className="text-xs mt-1">{postTypeConfig.name}</Badge>}
                <div className="mt-2">
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
            {post.replies && post.replies.length > 0 && (
                <div className="w-[95%] space-y-2 mt-2">
                    {post.replies.map(reply => (
                        <PostBubble key={reply.id} post={reply} level={level + 1} currentUser={currentUser} onReply={onReply} onNewQuote={onNewQuote} />
                    ))}
                </div>
            )}
        </div>
    );
}

// Dialogs and other components remain mostly the same...
// ...

export function ChintanaThreadClient({ thread, currentUser, embedded = false, onReplyPosted }: { 
    thread: ChintanaThread, 
    currentUser: UserProfile,
    embedded?: boolean,
    onReplyPosted?: () => void,
}) {
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
          <header className="p-4 border-b bg-card flex-shrink-0">
               <div className="flex items-start justify-between">
                    <div className="flex-1">
                        <h1 className={cn("font-bold", embedded ? "text-lg" : "text-2xl")}>{thread.title}</h1>
                         <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline">{thread.genreId}</Badge>
                            <Badge variant="outline">{thread.categoryId}</Badge>
                            {thread.tags.map(tag => <Badge key={tag} variant="secondary">{tag}</Badge>)}
                        </div>
                    </div>
                    {/* Add actions back here */}
                </div>
          </header>
          <ScrollArea className="flex-1">
              <div className="p-4 md:p-6 space-y-4">
                  {thread.posts.map((post) => (
                      <PostBubble key={post.id} post={post} currentUser={currentUser} onReply={(p) => {}} onNewQuote={handleNewQuoteFound} />
                  ))}
              </div>
          </ScrollArea>
           <footer className="p-4 border-t bg-card flex-shrink-0">
               {/* Add new input form here */}
               <div className="text-center text-sm text-muted-foreground">Replying to threads is coming soon.</div>
           </footer>
      </div>
    )
}
