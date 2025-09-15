
'use client';

import React, { useState, useMemo } from 'react';
import { PostCard } from '@/components/social/post-card';
import { CreatePostForm } from '@/components/social/create-post-form';
import type { Post, UserProfile, Circle } from '@/types';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSearchParams, useRouter, usePathname } from 'next/navigation';

export function Wall({ posts, userProfile, readOnly = false, circles = [] }: { posts: Post[], userProfile: UserProfile, readOnly?: boolean, circles?: Circle[] }) {
    const [isCreatePostOpen, setIsCreatePostOpen] = useState(false);
    
    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();
    const activeSubTab = searchParams.get('subtab') || 'feed';

    const handleTabChange = (value: string) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set('subtab', value);
        // We only want the subtab parameter for the 'wall' tab
        params.delete('tab');
        router.replace(`${pathname}?tab=wall&${params.toString()}`);
    };

    const filteredPosts = useMemo(() => {
        if (readOnly) return posts;

        switch(activeSubTab) {
            case 'my-posts':
                return posts.filter(p => p.author.id === userProfile.email);
            case 'circle-feed':
                const memberIds = new Set(circles.flatMap(c => c.members.map(m => m.userId)));
                return posts.filter(p => memberIds.has(p.author.id));
            case 'feed':
            default:
                return posts;
        }
    }, [activeSubTab, posts, userProfile.email, circles, readOnly]);

    return (
        <div className="md:space-y-6">
             {!readOnly && (
                <Tabs value={activeSubTab} onValueChange={handleTabChange} className="w-full mb-4 md:mb-6">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="feed">Feed</TabsTrigger>
                        <TabsTrigger value="my-posts">My Posts</TabsTrigger>
                        <TabsTrigger value="circle-feed">Circle Feed</TabsTrigger>
                    </TabsList>
                </Tabs>
             )}

            <div className="space-y-4 md:space-y-6">
                {filteredPosts.length > 0 ? (
                    filteredPosts.map(post => (
                        <PostCard key={post.id} post={post} userProfile={userProfile} />
                    ))
                ) : (
                    <Card className="text-center py-12">
                         <CardHeader>
                            <CardTitle>The Wall is Quiet</CardTitle>
                            <CardDescription>
                                {readOnly ? "This user hasn't posted anything yet." : "No posts found in this feed. Why not create one?"}
                            </CardDescription>
                        </CardHeader>
                    </Card>
                )}
            </div>

            {!readOnly && (
                <>
                    <Dialog open={isCreatePostOpen} onOpenChange={setIsCreatePostOpen}>
                        <DialogContent className="sm:max-w-2xl">
                            <DialogHeader>
                                <DialogTitle>Create a New Post</DialogTitle>
                                <DialogDescription>Share your thoughts, ask a question, or announce your work.</DialogDescription>
                            </DialogHeader>
                            <CreatePostForm userProfile={userProfile} onPostCreated={() => setIsCreatePostOpen(false)} />
                        </DialogContent>
                    </Dialog>
                    
                    <Button
                        size="icon"
                        className="fixed z-10 bottom-24 right-4 h-16 w-16 rounded-full shadow-lg md:bottom-8 md:right-8"
                        aria-label="Create new post"
                        onClick={() => setIsCreatePostOpen(true)}
                    >
                        <Plus className="h-8 w-8" />
                    </Button>
                </>
            )}
        </div>
    );
}
