
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { MessageSquare, GitBranch, HelpCircle, ArrowRight, Eye, Star, Sparkles, Wind, MoreVertical, Trash2, Pencil } from 'lucide-react';
import type { Post, UserProfile, PostType } from '@/types';
import { formatDistanceToNow } from 'date-fns';
import { ReactionButtons } from '@/components/social/reaction-buttons';
import { evolvePostAction } from '@/actions/post.actions';
import { useToast } from '@/hooks/use-toast';
import { Badge, type BadgeProps } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { BrainCircuit, ScrollText, PenLine, BookOpen } from 'lucide-react';
import { VaikhariLogo } from '../icons';
import { AnswerCard } from '@/components/social/answer-card';
import { CreateAnswerForm } from '@/components/social/create-answer-form';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { SocialContentRenderer } from '../social/social-content-renderer';
import { PostActions } from '../social/post-card';
import { EvolvePostDialog } from '../social/evolve-post-dialog';

const postTypeIcons: Record<Post['postType'], React.ElementType> = {
    thought: BrainCircuit,
    reflection: ScrollText,
    sutra: VaikhariLogo,
    question: HelpCircle,
    poetry: PenLine,
};

const postStatusConfig: Record<Post['status'], { label: string, variant: BadgeProps['variant'] }> = {
    raw: { label: 'Raw Thought', variant: 'secondary' },
    'thread-started': { label: 'Thread Started', variant: 'info' },
    drifting: { label: 'Drifting', variant: 'drifting' },
    glowing: { label: 'Glowing', variant: 'glowing' },
    evolving: { label: 'Evolving', variant: 'evolving' },
};

function EvolveButton({ post }: { post: Post }) {
    const { toast } = useToast();
    const [isEvolveDialogOpen, setIsEvolveDialogOpen] = useState(false);

    const handlePromote = async () => {
        const result = await evolvePostAction(post.id);
        if (result?.error) {
            toast({ variant: 'destructive', title: 'Error', description: result.error });
        } else {
            toast({ title: 'Success', description: 'Post is now evolving!' });
        }
    };
    
    if (post.evolvedTo) {
        return (
            <Button asChild variant="ghost" size="sm">
                <Link href={post.evolvedTo.type === 'standalone-article' ? `/admin/articles/edit/${post.evolvedTo.id}` : `/admin/books/${post.evolvedTo.id}`}>
                    <ArrowRight className="mr-2 h-4 w-4" /> View Evolution
                </Link>
            </Button>
        )
    }

    if (post.status === 'evolving') {
        return (
            <>
                <EvolvePostDialog post={post} open={isEvolveDialogOpen} onOpenChange={setIsEvolveDialogOpen} />
                 <Button variant="outline" size="sm" onClick={() => setIsEvolveDialogOpen(true)}>
                    <GitBranch className="mr-2 h-4 w-4" />
                    Evolve
                </Button>
            </>
        )
    }

    return (
        <Button variant="ghost" size="sm" onClick={handlePromote}>
            <GitBranch className="mr-2 h-4 w-4" />
            Mark for Evolution
        </Button>
    );
}


export function UserEvolutions({ posts, userProfile }: { posts: Post[], userProfile: UserProfile }) {
    if (posts.length === 0) {
        return (
             <Card className="text-center py-12 border-2 border-dashed rounded-lg">
                <CardHeader>
                    <div className="mx-auto bg-muted rounded-full p-4 w-fit">
                        <GitBranch className="h-10 w-10 text-muted-foreground" />
                    </div>
                    <CardTitle className="mt-4">No Evolving Posts</CardTitle>
                    <CardDescription>
                        This user hasn't marked any posts to evolve yet.
                    </CardDescription>
                </CardHeader>
            </Card>
        )
    }
    return (
        <Card>
            <CardHeader>
                <CardTitle>Evolutions</CardTitle>
                <CardDescription>Thoughts and ideas that are being developed into more formal works.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-6">
                     {posts.map(post => {
                        const isAuthor = userProfile.email === post.author.id;
                        return (
                            <div key={post.id} className="flex gap-4">
                                <Avatar className="h-10 w-10 border mt-1">
                                    <AvatarImage src={post.author.avatarUrl} alt={post.author.name} data-ai-hint="person avatar" />
                                    <AvatarFallback>{post.author.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                    <SocialContentRenderer htmlString={post.content} />
                                    <div className="mt-2 text-xs text-muted-foreground">
                                        Posted {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
                                    </div>
                                </div>
                                <EvolveButton post={post} />
                            </div>
                        )
                    })}
                </div>
            </CardContent>
        </Card>
    )
}
