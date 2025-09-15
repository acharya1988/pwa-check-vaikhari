
'use client';

import React, { useMemo, useActionState, useEffect, useState } from 'react';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Star, BadgeCheck, Eye, ThumbsUp, ThumbsDown, MessageSquare, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import type { Article, BookContent, Chapter, PostAuthor, Comment } from '@/lib/data-service';
import { Button } from './ui/button';
import { handleArticleFeedback } from '@/app/articles/actions';
import { useToast } from '@/hooks/use-toast';

// Helper function to recursively count all comments and replies
const countAllComments = (comments: Comment[]): number => {
    let count = comments.length;
    for (const comment of comments) {
        if (comment.replies) {
            count += countAllComments(comment.replies);
        }
    }
    return count;
};

function StarRating({ articleInfo }: { articleInfo: { book: BookContent; chapter: Chapter; article: Article } }) {
    const { article } = articleInfo;
    const { toast } = useToast();
    const [feedbackState, formAction] = useActionState(handleArticleFeedback, null);
    const [hoveredRating, setHoveredRating] = useState<number | null>(null);
    const [submittedRating, setSubmittedRating] = useState(false);

    useEffect(() => {
        if(feedbackState?.success) {
            toast({ title: 'Thank you!', description: 'Your rating has been recorded.' });
            setSubmittedRating(true);
        }
        if (feedbackState?.error) {
            toast({ variant: 'destructive', title: 'Error', description: feedbackState.error });
        }
    }, [feedbackState, toast]);

    const getRating = () => {
        if (!article.feedback?.scores || article.feedback.scores.reduce((acc, s) => acc + s.count, 0) === 0) return 0;
        const totalScore = article.feedback.scores.reduce((acc, s) => acc + s.value * s.count, 0);
        const totalVotes = article.feedback.scores.reduce((acc, s) => acc + s.count, 0);
        return totalScore / totalVotes;
    };
    const rating = getRating();
    const ratingStars = Math.round(rating / 2);

    const handleRate = (score: number) => {
        const formData = new FormData();
        formData.append('bookId', articleInfo.book.bookId);
        formData.append('chapterId', String(articleInfo.chapter.id));
        formData.append('verse', String(articleInfo.article.verse));
        formData.append('score', String(score));
        formAction(formData);
    }
    
    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <div className="flex items-center gap-0.5" onMouseLeave={() => setHoveredRating(null)}>
                        {[...Array(5)].map((_, i) => {
                            const starValue = i + 1;
                            const ratingValue = (hoveredRating || ratingStars);
                            return (
                                <button key={i} type="button" onClick={() => handleRate(starValue * 2)} onMouseEnter={() => setHoveredRating(starValue)} disabled={submittedRating}>
                                    <Star className={cn('h-3.5 w-3.5', ratingValue >= starValue ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/50')} />
                                </button>
                            );
                        })}
                    </div>
                </TooltipTrigger>
                 <TooltipContent><p>Community Rating: {rating.toFixed(1)} / 10</p></TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}

export function ArticleMetadataBar({
  articleInfo,
  className,
}: {
  articleInfo: { book: BookContent; chapter: Chapter; article: Article };
  className?: string;
}) {
  const { article } = articleInfo;

  const author: PostAuthor = article.author || {
    id: 'vakyateam',
    name: 'VakyaVerse Team',
    avatarUrl: '/media/_cce41b04-07a0-4c49-bd66-7d2b4a59f1a7.jpg',
  };

  const scholarLevel = 'Mimamsaka Scholar';
  const isVerified = true;
  
  const interactionCount = useMemo(() => {
    if (!article || !article.content) return 0;
    let count = countAllComments(article.comments || []);
    article.content.forEach(block => {
      count += (block.sparks?.length || 0);
      count += (block.layers?.length || 0);
      count += (block.points?.length || 0);
    });
    return count;
  }, [article]);

  const lastUpdated =
    article.updatedAt || article.createdAt
      ? format(new Date(article.updatedAt || article.createdAt!), 'PP')
      : 'Not yet updated';

  return (
    <div className={cn('z-20 no-print', className)}>
      <div className="flex items-center justify-between rounded-lg border bg-card/90 p-3 shadow-sm backdrop-blur-sm">
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <Avatar className="h-12 w-12">
            <AvatarImage
              src={author.avatarUrl}
              alt={author.name}
              data-ai-hint="person avatar"
            />
            <AvatarFallback>{author.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0 space-y-1">
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-sm truncate">{author.name}</span>
              {isVerified && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <BadgeCheck className="h-4 w-4 text-blue-500 flex-shrink-0" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Verified Scholar</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
            <p className="text-xs text-muted-foreground leading-tight">{scholarLevel}</p>
            <StarRating articleInfo={articleInfo} />
            <p className="text-xs text-muted-foreground">Updated on {lastUpdated}</p>
          </div>
        </div>
        <div className="flex items-center gap-1 md:gap-2 text-xs md:text-sm text-muted-foreground">
           <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger className="flex items-center gap-1.5 p-2 rounded-md">
                       <MessageSquare className="h-4 w-4" />
                       <span>{interactionCount}</span>
                    </TooltipTrigger>
                    <TooltipContent><p>Total Interactions (Comments, Sparks, etc.)</p></TooltipContent>
                </Tooltip>
                <Tooltip>
                    <TooltipTrigger className="flex items-center gap-1.5 p-2 rounded-md">
                       <Eye className="h-4 w-4" />
                       <span>{article.feedback?.views ?? 0}</span>
                    </TooltipTrigger>
                    <TooltipContent><p>Views</p></TooltipContent>
                </Tooltip>
                 <Tooltip>
                    <TooltipTrigger className="flex items-center gap-1.5 p-2 rounded-md">
                       <ThumbsUp className="h-4 w-4" />
                       <span>{article.feedback?.likes ?? 0}</span>
                    </TooltipTrigger>
                    <TooltipContent><p>Likes</p></TooltipContent>
                </Tooltip>
                 <Tooltip>
                    <TooltipTrigger className="flex items-center gap-1.5 p-2 rounded-md">
                       <ThumbsDown className="h-4 w-4" />
                       <span>{article.feedback?.dislikes ?? 0}</span>
                    </TooltipTrigger>
                    <TooltipContent><p>Dislikes</p></TooltipContent>
                </Tooltip>
          </TooltipProvider>
        </div>
      </div>
    </div>
  );
}
