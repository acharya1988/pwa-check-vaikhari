

'use client';

import React, { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { ThumbsUp, ThumbsDown, BrainCircuit, Heart, Quote, Loader2 } from 'lucide-react';
import { handleReaction } from '@/actions/post.actions';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import type { Post } from '@/types';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { createQuoteFromPost } from '@/actions/quote.actions';

type ReactionType = keyof Omit<Post['reactions'], 'cites'>;

function Reaction({
  reaction,
  post,
  children,
  label,
}: {
  reaction: ReactionType;
  post: Post;
  children: React.ReactNode;
  label: string;
}) {
    const [isPending, startTransition] = useTransition();
    const [optimisticCount, setOptimisticCount] = useState(post.reactions[reaction]);
    const { toast } = useToast();

    const onReactionClick = () => {
        startTransition(async () => {
            setOptimisticCount(c => c + 1);
            const result = await handleReaction(post.id, reaction);
            if(result?.error) {
                toast({ variant: 'destructive', title: 'Error', description: result.error });
                setOptimisticCount(c => c > 0 ? c - 1 : 0); // Revert
            }
        });
    };
    
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            onClick={onReactionClick}
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


function QuoteButton({ post }: { post: Post }) {
    const [isPending, startTransition] = useTransition();
    const { toast } = useToast();

    const handleQuoteClick = () => {
        startTransition(async () => {
            const result = await createQuoteFromPost(post.content, post.author.name);
            if (result.success) {
                toast({ title: 'Success!', description: result.message });
            } else {
                 toast({ variant: 'destructive', title: 'Error', description: result.error });
            }
        });
    };

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button variant="ghost" size="sm" onClick={handleQuoteClick} disabled={isPending} className="flex items-center gap-1.5 px-2">
                        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Quote className="h-4 w-4" />}
                         <span className="text-xs text-muted-foreground">{post.reactions.cites || 0}</span>
                    </Button>
                </TooltipTrigger>
                <TooltipContent><p>Quote this Post</p></TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}


export function ReactionButtons({ post }: { post: Post }) {
    
    const reactionConfig: { name: ReactionType, label: string, icon: React.ElementType }[] = [
        { name: 'likes', label: 'Like', icon: ThumbsUp },
        { name: 'dislikes', label: 'Dislike', icon: ThumbsDown },
        { name: 'insightful', label: 'Insightful', icon: BrainCircuit },
        { name: 'uplifting', label: 'Uplifting', icon: Heart },
    ];

    return (
        <div className="flex items-center gap-1 flex-wrap">
            {reactionConfig.map(({ name, label, icon: Icon }) => (
                <Reaction key={name} reaction={name} post={post} label={label}>
                    <Icon className="h-4 w-4" />
                </Reaction>
            ))}
            {!post.attachedWork && <QuoteButton post={post} />}
        </div>
    );
}
