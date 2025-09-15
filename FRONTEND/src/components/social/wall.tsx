
'use client';

import React, { useState, useMemo } from 'react';
import { PostCard } from '@/components/social/post-card';
import { CreatePostForm } from '@/components/social/create-post-form';
import type { Post, UserProfile, Circle, ChintanaCategory } from '@/types';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';


export function Wall({ posts, userProfile, readOnly = false, circles = [], chintanaCategories = [] }: { posts: Post[], userProfile: UserProfile, readOnly?: boolean, circles?: Circle[], chintanaCategories?: ChintanaCategory[] }) {
    const [isCreatePostOpen, setIsCreatePostOpen] = useState(false);
    
    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();
    // Default to 'my-posts' on profile, 'feed' elsewhere.
    const onProfile = pathname.includes('/profile/');
    const defaultSubTab = onProfile ? 'my-posts' : 'feed';
    const activeSubTab = searchParams.get('subtab') || defaultSubTab;

    const handleTabChange = (value: string) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set('subtab', value);
        
        const currentPathIsProfile = pathname.includes('/profile');
        if (currentPathIsProfile) {
            params.set('tab', 'wall');
        } else {
            params.delete('tab');
        }

        router.replace(`${pathname}?${params.toString()}`);
    };

    const filteredPosts = useMemo(() => {
        if (readOnly) return posts;
        if (onProfile) return posts; // On profile, we only show the user's posts, so no need to filter further

        switch(activeSubTab) {
            case 'my-posts':
                return posts.filter(p => p.author.id === userProfile.email);
            case 'circle-feed':
                const memberIds = new Set(circles.flatMap(c => c.members.map(m => m.userId)));
                // Show posts from circle members, but not the current user's own posts
                return posts.filter(p => memberIds.has(p.author.id) && p.author.id !== userProfile.email);
            case 'feed':
            default:
                return posts;
        }
    }, [activeSubTab, posts, userProfile.email, circles, readOnly, onProfile]);

    return (
        <div className="md:space-y-6">
             {!readOnly && !onProfile && (
                <Tabs value={activeSubTab} onValueChange={handleTabChange} className="w-full mb-4 md:mb-6">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="feed">Feed</TabsTrigger>
                        <TabsTrigger value="my-posts">My Posts</TabsTrigger>
                        <TabsTrigger value="circle-feed">Circle Feed</TabsTrigger>
                    </TabsList>
                </Tabs>
             )}
            
            {!readOnly && (
                <div className="mb-6">
                     <CreatePostForm userProfile={userProfile} onPostCreated={() => router.refresh()} circles={circles} chintanaCategories={chintanaCategories} />
                </div>
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
        </div>
    );
}
