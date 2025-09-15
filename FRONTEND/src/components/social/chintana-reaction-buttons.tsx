
'use client';

import React, { useState, useEffect, useRef, useTransition } from 'react';
import { useFormStatus } from 'react-dom';
import { useActionState } from 'react';
import { Button } from '@/components/ui/button';
import { Lightbulb, MessageSquare, Heart, AlertTriangle, BookOpen, Loader2, ThumbsDown, ThumbsUp } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { addPostToThread, handlePostReaction } from '@/actions/chintana.actions';
import type { ChintanaPostReactions, ChintanaPostType } from '@/types';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

type ReactionType = keyof ChintanaPostReactions;

function SubmitButton({ children }: { children: React.ReactNode }) {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" disabled={pending}>
            {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {children}
        </Button>
    );
}

export function FlagFallacyDialog({ threadId, postId, open, onOpenChange }: { threadId: string, postId: string, open: boolean, onOpenChange: (open: boolean) => void }) {
    const [state, formAction] = useActionState(addPostToThread, null);
    const { toast } = useToast();
    const formRef = useRef<HTMLFormElement>(null);

    useEffect(() => {
        if (state?.success) {
            toast({ title: 'Fallacy Flagged', description: 'Your fallacy flag has been posted.' });
            onOpenChange(false);
            formRef.current?.reset();
        }
        if (state?.error) {
            toast({ variant: 'destructive', title: 'Error', description: state.error });
        }
    }, [state, toast, onOpenChange]);

    return (
         <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Flag a Logical Fallacy</DialogTitle>
                    <DialogDescription>
                        Explain the logical error you've identified in this post. Your explanation will be added as a public reply.
                    </DialogDescription>
                </DialogHeader>
                <form action={formAction} ref={formRef} className="space-y-4">
                    <input type="hidden" name="threadId" value={threadId} />
                    <input type="hidden" name="replyToPostId" value={postId} />
                    <input type="hidden" name="postType" value="fallacy-flag" />

                    <div>
                        <Label htmlFor="fallacy-type">Type of Fallacy (e.g., Ad Hominem)</Label>
                        <Input id="fallacy-type" name="title" required />
                    </div>
                     <div>
                        <Label htmlFor="fallacy-explanation">Reason/Explanation</Label>
                        <Textarea id="fallacy-explanation" name="content" required rows={4} />
                    </div>

                    <DialogFooter>
                        <DialogClose asChild><Button type="button" variant="ghost">Cancel</Button></DialogClose>
                        <SubmitButton>Post Flag</SubmitButton>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

function ReactionButton({ threadId, postId, reaction, count, children, label, isFooter=false }: { threadId: string, postId: string, reaction: ReactionType, count: number, children: React.ReactNode, label: string, isFooter?: boolean }) {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const [optimisticCount, setOptimisticCount] = useState(count);

  useEffect(() => {
    setOptimisticCount(count);
  }, [count])

  const handleClick = () => {
    startTransition(() => {
        setOptimisticCount(c => c + 1);
        const formData = new FormData();
        formData.append('threadId', threadId);
        formData.append('postId', postId);
        formData.append('reaction', reaction);
        handlePostReaction(null, formData).then(state => {
           if (state?.error) {
                toast({ variant: 'destructive', title: 'Error', description: state.error });
                setOptimisticCount(c => c > 0 ? c - 1 : 0); // Revert optimistic update
            }
        });
    });
  };

  if (isFooter) {
    return (
         <Button
            variant="ghost"
            size="sm"
            onClick={handleClick}
            disabled={isPending}
            className="flex items-center justify-start gap-3 px-3 w-full"
        >
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : children}
            <span>{label}</span>
        </Button>
    )
  }

  return (
    <TooltipProvider>
        <Tooltip>
            <TooltipTrigger asChild>
                <Button
                variant="ghost"
                size="sm"
                onClick={handleClick}
                disabled={isPending}
                className="flex items-center gap-1.5 px-2"
                >
                {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : children}
                <span className="text-xs text-muted-foreground">{optimisticCount}</span>
                </Button>
            </TooltipTrigger>
            <TooltipContent>
                <p>{label}</p>
            </TooltipContent>
        </Tooltip>
    </TooltipProvider>
  );
}

interface ReactionButtonsProps {
    threadId: string;
    postId: string;
    reactions: ChintanaPostReactions;
    isFooter?: boolean;
}

export function ChintanaReactionButtons({ threadId, postId, reactions, isFooter = false }: ReactionButtonsProps) {
    const [isFlagDialogOpen, setIsFlagDialogOpen] = useState(false);
    
    const reactionConfig: { name: ReactionType, label: string, icon: React.ElementType }[] = [
        { name: 'upvotes', label: 'Upvote', icon: ThumbsUp },
        { name: 'downvotes', label: 'Downvote', icon: ThumbsDown },
        { name: 'insightful', label: 'Insightful', icon: Lightbulb },
        { name: 'love', label: 'Love', icon: Heart },
        { name: 'pramanaRequested', label: 'Request Pramāṇa', icon: BookOpen },
        { name: 'explanationRequested', label: 'Request Explanation', icon: MessageSquare },
    ];

    if (isFooter) {
        return (
            <div className="w-full flex flex-col items-start">
                {reactionConfig.map(({ name, label, icon: Icon }) => (
                    <ReactionButton 
                        key={name}
                        threadId={threadId}
                        postId={postId}
                        reaction={name}
                        count={reactions[name] || 0}
                        label={label}
                        isFooter={true}
                    >
                        <Icon className="h-4 w-4" />
                    </ReactionButton>
                ))}
                 <Button variant="ghost" size="sm" className="w-full justify-start gap-3 px-3 text-destructive hover:text-destructive" onClick={() => setIsFlagDialogOpen(true)}>
                    <AlertTriangle className="h-4 w-4" />
                    <span>Flag Fallacy</span>
                </Button>
                <FlagFallacyDialog threadId={threadId} postId={postId} open={isFlagDialogOpen} onOpenChange={setIsFlagDialogOpen} />
            </div>
        );
    }

    return (
        <>
        <div className="flex items-center gap-1 flex-wrap">
            {reactionConfig.map(({ name, label, icon: Icon }) => (
                <ReactionButton 
                    key={name}
                    threadId={threadId}
                    postId={postId}
                    reaction={name}
                    count={reactions[name] || 0}
                    label={label}
                >
                    <Icon className="h-4 w-4" />
                </ReactionButton>
            ))}
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button variant="ghost" size="sm" className="flex items-center gap-1.5 px-2" onClick={() => setIsFlagDialogOpen(true)}>
                            <AlertTriangle className="h-4 w-4 text-destructive" />
                            <span className="text-xs text-muted-foreground">{reactions.fallacyFlagged || 0}</span>
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent><p>Flag Fallacy</p></TooltipContent>
                </Tooltip>
            </TooltipProvider>
        </div>
        <FlagFallacyDialog threadId={threadId} postId={postId} open={isFlagDialogOpen} onOpenChange={setIsFlagDialogOpen} />
        </>
    );
}

    