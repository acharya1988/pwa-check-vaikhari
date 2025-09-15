
'use client';

import React, { useState, useActionState, useEffect } from 'react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, ThumbsUp, ThumbsDown, Loader2, MoreVertical, Trash2, Pencil } from 'lucide-react';
import { type Answer, type UserProfile } from '@/types';
import { formatDistanceToNow } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { handleAnswerReaction, acceptAnswer, deleteAnswer } from '@/actions/post.actions';
import { cn } from '@/lib/utils';
import { SocialContentRenderer } from './social-content-renderer';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

function ReactionButton({
  postId,
  answerId,
  reaction,
  count,
  children,
}: {
  postId: string;
  answerId: string;
  reaction: 'upvote' | 'downvote';
  count: number;
  children: React.ReactNode;
}) {
  const [isPending, startTransition] = React.useTransition();
  const { toast } = useToast();

  const handleClick = () => {
    startTransition(async () => {
      const result = await handleAnswerReaction(postId, answerId, reaction);
      if (result?.error) {
        toast({ variant: 'destructive', title: 'Error', description: result.error });
      }
    });
  };

  return (
    <Button variant="ghost" size="sm" onClick={handleClick} disabled={isPending}>
      {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : children}
      {count}
    </Button>
  );
}

function AcceptButton({ postId, answerId }: { postId: string, answerId: string }) {
     const [isPending, startTransition] = React.useTransition();
    const { toast } = useToast();

    const handleClick = () => {
        startTransition(async () => {
            const result = await acceptAnswer(postId, answerId);
            if (result?.error) {
                toast({ variant: 'destructive', title: 'Error', description: result.error });
            } else {
                toast({ title: 'Success', description: 'Accepted answer marked.' });
            }
        });
    }

    return (
         <Button variant="outline" size="sm" onClick={handleClick} disabled={isPending}>
             {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
            Accept Answer
        </Button>
    )
}

function AnswerActions({ postId, answerId, isAnswerAuthor }: { postId: string, answerId: string, isAnswerAuthor: boolean }) {
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [state, formAction] = useActionState(deleteAnswer, null);
    const { toast } = useToast();

    useEffect(() => {
        if (state?.success) {
            toast({ description: state.message });
            setIsDeleteOpen(false);
        }
        if (state?.error) {
            toast({ variant: 'destructive', title: 'Error', description: state.error });
        }
    }, [state, toast]);
    
    if (!isAnswerAuthor) return null;

    return (
         <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                     <DropdownMenuItem>
                        <Pencil className="mr-2 h-4 w-4" /> Edit Reply
                    </DropdownMenuItem>
                    <AlertDialogTrigger asChild>
                        <DropdownMenuItem className="text-destructive focus:text-destructive">
                            <Trash2 className="mr-2 h-4 w-4" /> Delete Reply
                        </DropdownMenuItem>
                    </AlertDialogTrigger>
                </DropdownMenuContent>
            </DropdownMenu>
            <AlertDialogContent>
                <form action={formAction}>
                    <input type="hidden" name="postId" value={postId} />
                    <input type="hidden" name="answerId" value={answerId} />
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete this reply. This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction asChild>
                           <Button type="submit" variant="destructive">Delete</Button>
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </form>
            </AlertDialogContent>
        </AlertDialog>
    );
}

export function AnswerCard({
  answer,
  postId,
  isAccepted,
  isPostAuthor,
  isQuestion,
  userProfile,
}: {
  answer: Answer;
  postId: string;
  isAccepted: boolean;
  isPostAuthor: boolean;
  isQuestion: boolean;
  userProfile: UserProfile;
}) {

  const isAnswerAuthor = userProfile.email === answer.author.id;

  return (
    <Card className={cn(isAccepted && 'border-2 border-success bg-success/10')}>
      <CardHeader className="flex flex-row items-start gap-4 space-y-0 p-4">
        <Avatar>
          <AvatarImage src={answer.author.avatarUrl} alt={answer.author.name} data-ai-hint="person avatar" />
          <AvatarFallback>{answer.author.name.charAt(0)}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <p className="font-semibold">{answer.author.name}</p>
          <p className="text-xs text-muted-foreground">
            Answered {formatDistanceToNow(new Date(answer.createdAt), { addSuffix: true })}
          </p>
        </div>
         <div className="flex items-center gap-2">
            {isAccepted && (
                <Badge variant="success" className="gap-1.5">
                    <Check className="h-4 w-4" /> Accepted
                </Badge>
            )}
             <AnswerActions postId={postId} answerId={answer.id} isAnswerAuthor={isAnswerAuthor} />
         </div>
      </CardHeader>
      <CardContent className="px-4 pb-4 pt-0">
        <SocialContentRenderer htmlString={answer.content} />
      </CardContent>
      <CardFooter className="flex justify-between p-2 border-t">
        <div className="flex items-center gap-1">
           <ReactionButton postId={postId} answerId={answer.id} reaction="upvote" count={answer.upvotes}>
              <ThumbsUp className="mr-2 h-4 w-4" />
          </ReactionButton>
          <ReactionButton postId={postId} answerId={answer.id} reaction="downvote" count={answer.downvotes}>
              <ThumbsDown className="mr-2 h-4 w-4" />
          </ReactionButton>
        </div>
        <div className="flex items-center">
             {isQuestion && isPostAuthor && !isAccepted && (
                <AcceptButton postId={postId} answerId={answer.id} />
            )}
        </div>
      </CardFooter>
    </Card>
  );
}
