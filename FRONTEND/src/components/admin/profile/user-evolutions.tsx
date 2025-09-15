
'use client';
import { PostCard } from '@/components/social/post-card';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { GitBranch } from 'lucide-react';
import type { Post, UserProfile } from '@/types';

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
                    {posts.map(post => <PostCard key={post.id} post={post} userProfile={userProfile} />)}
                </div>
            </CardContent>
        </Card>
    )
}
