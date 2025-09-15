

'use client';

import React, { useState, useMemo, useEffect, useCallback, useActionState, useRef } from 'react';
import type { Post, UserProfile, Circle, ChintanaThread, ChintanaCategory, TodayStory } from '@/types';
import { useTabs } from '@/hooks/use-tabs';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { CreatePostForm } from '@/components/social/create-post-form';
import { PostCard } from '@/components/social/post-card';
import { ChintanaThreadListItem } from '@/components/social/chintana-thread-list-item';
import { TodayBar } from '@/components/social/today/TodayBar';
import { getTodayStories } from '@/services/today.service';
import './today.css';

// --- Sub-components for better organization ---

function ActivityFeed({ posts, userProfile }: { posts: Post[]; userProfile: UserProfile }) {
    if (posts.length === 0) {
        return (
            <Card className="text-center py-12">
                <CardHeader>
                    <CardTitle>The Wall is Quiet</CardTitle>
                    <CardDescription>No posts found in this feed. Why not create one?</CardDescription>
                </CardHeader>
            </Card>
        );
    }

    return (
        <div className="space-y-4 md:space-y-6">
            {posts.map(post => (
                <PostCard key={post.id} post={post} userProfile={userProfile} />
            ))}
        </div>
    );
}

function ChintanaFeed({ threads }: { threads: ChintanaThread[] }) {
    if (threads.length === 0) {
        return (
             <Card className="mt-4 text-center">
                <CardHeader>
                    <CardTitle>No Chintana Threads</CardTitle>
                    <CardDescription>Start a new thread to begin a structured discourse.</CardDescription>
                </CardHeader>
            </Card>
        );
    }
    return (
        <div className="space-y-4">
            {threads.map(thread => (
                <ChintanaThreadListItem key={thread.id} thread={thread} />
            ))}
        </div>
    )
}

function MainContent({
    activeTab,
    posts,
    chintanaThreads,
    userProfile,
    userCircles,
    chintanaCategories
} : {
    activeTab: string;
    posts: Post[];
    chintanaThreads: ChintanaThread[];
    userProfile: UserProfile;
    userCircles: Circle[];
    chintanaCategories: ChintanaCategory[];
}) {
    const [stories, setStories] = useState<TodayStory[]>([]);
    const [isLoadingStories, setIsLoadingStories] = useState(true);

    const fetchStories = useCallback(() => {
        setIsLoadingStories(true);
        getTodayStories().then(setStories).finally(() => setIsLoadingStories(false));
      }, []);

    useEffect(() => {
        if (activeTab !== 'chintana') {
            fetchStories();
        }
    }, [fetchStories, activeTab]);
    
   const filteredPosts = useMemo(() => {
    const circleMemberIds = new Set(userCircles.flatMap(c => c.members.map(m => m.userId)));

    switch (activeTab) {
      case 'my-posts':
        return posts.filter(p => p.author.id === userProfile.email);
      
      case 'circle-feed':
        // Show posts from circle members that are specifically posted to a circle
        return posts.filter(p => 
            p.postMethod === 'circle' && p.circleId && userCircles.some(c => c.id === p.circleId)
        );

      case 'feed':
      default:
        // Show only public feed posts
        return posts.filter(p => p.postMethod === 'feed' || !p.postMethod);
    }
  }, [activeTab, posts, userProfile.email, userCircles]);



    return (
        <div className="flex-1 overflow-y-auto">
            <div className="p-4 md:px-8 lg:px-12">
                 {activeTab !== 'chintana' && (
                    <section id="vk-today-root" className="my-6">
                        <TodayBar 
                            stories={stories} 
                            isLoading={isLoadingStories} 
                            currentUser={userProfile}
                            onStoryCreated={fetchStories}
                        />
                    </section>
                )}

                <div className="max-w-3xl mx-auto space-y-6">
                    <CreatePostForm
                        userProfile={userProfile}
                        circles={userCircles}
                        context={{ type: activeTab }}
                        onPostCreated={() => {}}
                        chintanaCategories={chintanaCategories}
                    />
                    {activeTab === 'chintana' 
                        ? <ChintanaFeed threads={chintanaThreads} /> 
                        : <ActivityFeed posts={filteredPosts} userProfile={userProfile} />
                    }
                </div>
            </div>
        </div>
    )
}


// --- Main Client Component ---

export function ActivityPageClient({
  posts,
  userProfile,
  userCircles,
  chintanaThreads,
  chintanaCategories,
}: {
  posts: Post[];
  userProfile: UserProfile;
  userCircles: Circle[];
  chintanaThreads: ChintanaThread[];
  chintanaCategories: ChintanaCategory[];
}) {
  const { activeTab, handleTabChange } = useTabs('feed');

  return (
    <div className="h-full flex flex-col">
      <div className="sticky top-0 z-20 flex justify-center py-2 bg-background">
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-auto">
            <TabsList className="rounded-full h-12 inline-flex bg-muted p-1 text-muted-foreground">
                <TabsTrigger value="feed">Feed</TabsTrigger>
                <TabsTrigger value="my-posts">My Posts</TabsTrigger>
                <TabsTrigger value="circle-feed">Circle Feed</TabsTrigger>
                <TabsTrigger value="chintana">Chintana</TabsTrigger>
            </TabsList>
        </Tabs>
      </div>
      
      <MainContent
        activeTab={activeTab}
        posts={posts}
        chintanaThreads={chintanaThreads}
        userProfile={userProfile}
        userCircles={userCircles}
        chintanaCategories={chintanaCategories}
      />
    </div>
  );
}
