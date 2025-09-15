
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Book, FileText, ArrowRight, Star, Eye, MessageSquare, ThumbsUp, ThumbsDown, BrainCircuit, Heart, Loader2, Bookmark as BookmarkIcon } from 'lucide-react';
import type { ActivityFeedItem } from '@/lib/data-service';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import { handleArticleFeedback } from '@/app/articles/actions';
import { handleStandaloneArticleFeedback } from '@/actions/standalone-article.actions';
import { Separator } from '@/components/ui/separator';

function ActivityReactionButtons({ item }: { item: ActivityFeedItem }) {
    const [isPending, startTransition] = React.useTransition();
    const { toast } = useToast();

    const onReactionClick = (action: 'like' | 'dislike' | 'insightful' | 'uplifting') => {
        startTransition(async () => {
            const formData = new FormData();
            formData.append('action', action);
            let result;

            if (item.type === 'book-article') {
                formData.append('bookId', item.articleInfo.bookId);
                formData.append('chapterId', String(item.articleInfo.chapterId));
                formData.append('verse', String(item.articleInfo.verse));
                result = await handleArticleFeedback(null, formData);
            } else { // standalone-article
                formData.append('articleId', item.articleInfo.verse); // verse holds the id for standalone
                result = await handleStandaloneArticleFeedback(null, formData);
            }
            if (result?.error) {
                toast({ variant: 'destructive', title: 'Error', description: result.error });
            }
        });
    };
    
    const reactionConfig: { name: 'likes' | 'dislikes' | 'insightful' | 'uplifting', label: string, icon: React.ElementType }[] = [
        { name: 'likes', label: 'Like', icon: ThumbsUp },
        { name: 'dislikes', label: 'Dislike', icon: ThumbsDown },
        { name: 'insightful', label: 'Insightful', icon: BrainCircuit },
        { name: 'uplifting', label: 'Uplifting', icon: Heart },
    ];
    
    return (
        <div className="flex items-center gap-1 flex-wrap">
             <TooltipProvider>
                {reactionConfig.map(({ name, label, icon: Icon }) => (
                     <Tooltip key={name} delayDuration={100}>
                        <TooltipTrigger asChild>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onReactionClick(name)}
                                disabled={isPending}
                                className="flex items-center gap-1.5 px-2"
                            >
                                {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Icon className="h-4 w-4" />}
                                <span className="text-xs text-muted-foreground">{item.feedback?.[name] ?? 0}</span>
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent><p>{label}</p></TooltipContent>
                     </Tooltip>
                ))}
            </TooltipProvider>
        </div>
    );
}

function WishlistButton() {
    const { toast } = useToast();
    const handleClick = () => toast({ title: 'Feature coming soon!', description: 'Wishlisting will be available in a future update.' });
    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button variant="ghost" size="sm" onClick={handleClick}>
                        <BookmarkIcon className="mr-2 h-4 w-4" />
                        Wishlist
                    </Button>
                </TooltipTrigger>
                <TooltipContent><p>Add to your wishlist</p></TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}


export function ActivityPostCard({ item }: { item: ActivityFeedItem }) {
    const Icon = item.type === 'book-article' ? Book : FileText;
    
    const feedback = item.feedback || { likes: 0, dislikes: 0, insightful: 0, uplifting: 0, views: 0 };
    const totalPositive = (feedback.likes || 0) + (feedback.insightful || 0) + (feedback.uplifting || 0);
    const totalReactions = totalPositive + (feedback.dislikes || 0);
    const rating = totalReactions > 0 ? (totalPositive / totalReactions) * 5 : 0;
    const filledStars = Math.round(rating);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
        >
            <Card className="hover:shadow-lg transition-shadow duration-300 overflow-hidden">
                <CardHeader className="p-4">
                    <div className="flex items-start gap-4">
                        <Avatar className="h-12 w-12 border">
                            <AvatarImage src={item.author.avatarUrl} alt={item.author.name} data-ai-hint="person avatar" />
                            <AvatarFallback>{item.author.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                            <CardTitle className="text-lg leading-snug">
                                <Link href={item.href} className="hover:underline">{item.title}</Link>
                            </CardTitle>
                            <CardDescription className="flex items-center gap-2 mt-1 text-xs">
                                <Icon className="h-3 w-3" />
                                <span>{item.parentTitle}</span>
                                <span className="text-muted-foreground/50">|</span>
                                <span>Updated {formatDistanceToNow(new Date(item.timestamp), { addSuffix: true })}</span>
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                    <div className="flex flex-wrap gap-2">
                        {item.tags.map(tag => (
                            <Badge key={tag} variant="secondary">#{tag}</Badge>
                        ))}
                    </div>
                </CardContent>
                <CardFooter className="bg-muted/50 p-2 flex flex-col items-start gap-2">
                     <div className="flex justify-between w-full px-2 text-xs text-muted-foreground">
                        <div className="flex items-center gap-3">
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger className="flex items-center gap-1">
                                        {[...Array(5)].map((_, i) => (
                                            <Star key={i} className={cn('h-4 w-4', i < filledStars ? 'text-amber-400 fill-amber-400' : 'text-muted-foreground/50')} />
                                        ))}
                                    </TooltipTrigger>
                                    <TooltipContent><p>Community Rating: {rating.toFixed(1)} / 5.0</p></TooltipContent>
                                </Tooltip>
                                <Tooltip>
                                    <TooltipTrigger className="flex items-center gap-1">
                                        <Eye className="h-4 w-4" />
                                        <span>{feedback.views || 0}</span>
                                    </TooltipTrigger>
                                    <TooltipContent><p>Views</p></TooltipContent>
                                </Tooltip>
                                <Tooltip>
                                    <TooltipTrigger className="flex items-center gap-1" asChild>
                                        <Link href={item.href + '#comments'}>
                                            <MessageSquare className="h-4 w-4" />
                                            <span>{item.commentCount || 0}</span>
                                        </Link>
                                    </TooltipTrigger>
                                    <TooltipContent><p>Comments</p></TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        </div>
                        <Button asChild size="sm" variant="ghost" className="text-primary hover:text-primary">
                            <Link href={item.href}>
                                Read Now <ArrowRight className="ml-2 h-4 w-4" />
                            </Link>
                        </Button>
                    </div>
                    <Separator className="my-1" />
                    <div className="flex justify-between w-full px-2">
                        <ActivityReactionButtons item={item} />
                        <WishlistButton />
                    </div>
                </CardFooter>
            </Card>
        </motion.div>
    )
}
