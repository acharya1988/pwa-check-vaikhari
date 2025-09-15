
'use client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { GitBranch } from 'lucide-react';
import type { Post, UserProfile } from '@/types';
import { EvolvePostDialog } from '@/components/social/evolve-post-dialog';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { SocialContentRenderer } from '@/components/social/social-content-renderer';
import { formatDistanceToNow } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowRight } from 'lucide-react';

function EvolveButton({ post }: { post: Post }) {
    const [isEvolveDialogOpen, setIsEvolveDialogOpen] = useState(false);

    if (post.evolvedTo) {
        let href = '#';
        if (post.evolvedTo.type === 'standalone-article') {
            href = `/admin/articles/edit/${post.evolvedTo.id}`;
        } else if (post.evolvedTo.type === 'book-chapter') {
            // Simplified link for now. Needs a way to know the chapter and book.
            href = `/admin/books/${post.evolvedTo.id}`;
        }

        return (
            <Button asChild variant="ghost" size="sm">
                <Link href={href}>
                    View Evolution <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
            </Button>
        );
    }
    
    return (
        <>
            <EvolvePostDialog post={post} open={isEvolveDialogOpen} onOpenChange={setIsEvolveDialogOpen} />
            <Button variant="outline" size="sm" onClick={() => setIsEvolveDialogOpen(true)}>
                <GitBranch className="mr-2 h-4 w-4" /> Evolve
            </Button>
        </>
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
                    {posts.map(post => (
                        <div key={post.id} className="flex gap-4 items-start">
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
                            <div className="flex-shrink-0">
                                <EvolveButton post={post} />
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}
