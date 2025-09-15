
'use client';

import { getClonedContent } from '@/services/super-admin.service';
import { getInteractionLogs } from '@/services/ai-interaction-log.service';
import { getDiscoverableUsers } from '@/services/user.service';
import type { SuperAdminContent, TaggedContent, Post, VaiaSession, UserProfile } from '@/types';
import { useEffect, useState, useMemo } from 'react';
import { SuperAdminDashboard } from './dashboard';
import { TagTrainerClient } from './tag-trainer';
import { VaiaLoggerClient } from './vaia-logger';
import { VerificationAdminClient } from './verification-admin';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LoadingAnimation } from '@/components/loading-animation';

function PageSkeleton() {
    return <LoadingAnimation />;
}

export default function SuperAdminPage() {
    const [allContent, setAllContent] = useState<SuperAdminContent[]>([]);
    const [taggedContent, setTaggedContent] = useState<TaggedContent[]>([]);
    const [interactionLogs, setInteractionLogs] = useState<VaiaSession[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        setIsLoading(true);
        Promise.all([
            getClonedContent(),
            getInteractionLogs(),
        ]).then(([content, logs]) => {
            setAllContent(content);
            setInteractionLogs(logs);

            const contentByTag: Record<string, TaggedContent> = {};
            content.forEach(item => {
                let tags: string[] = [];

                if (item.contentType === 'post') {
                    // Use postType as a tag for posts
                    const post = item.content as Post;
                    if (post.postType) {
                       tags.push(post.postType);
                    }
                } else if (item.content?.tags) {
                    // Use existing tags for other content types
                    tags = item.content.tags;
                }
                
                if (Array.isArray(tags)) {
                    tags.forEach(tag => {
                        if (!tag) return;
                        if (!contentByTag[tag]) {
                            contentByTag[tag] = { tag, count: 0, items: [] };
                        }
                        contentByTag[tag].count++;
                        contentByTag[tag].items.push(item);
                    });
                }
            });
            setTaggedContent(Object.values(contentByTag).sort((a, b) => b.count - a.count));
            setIsLoading(false);
        });
    }, []);

    if (isLoading) {
        return <PageSkeleton />;
    }

    return (
        <Tabs defaultValue="repository" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="repository">Content Repository</TabsTrigger>
                <TabsTrigger value="ai-training">AI Tag Trainer</TabsTrigger>
                <TabsTrigger value="vaia-logs">VAIA Logs</TabsTrigger>
            </TabsList>
            <TabsContent value="repository" className="mt-6">
                <SuperAdminDashboard allContent={allContent} />
            </TabsContent>
            <TabsContent value="ai-training" className="mt-6">
                <TagTrainerClient content={taggedContent} />
            </TabsContent>
            <TabsContent value="vaia-logs" className="mt-6">
                <VaiaLoggerClient logs={interactionLogs} />
            </TabsContent>
        </Tabs>
    )
}
