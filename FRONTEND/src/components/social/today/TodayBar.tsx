
'use client';

import React, { useState } from 'react';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Plus, BookText, BrainCircuit, Rss } from 'lucide-react';
import type { TodayStory, UserProfile } from '@/types';
import Image from 'next/image';
import { StoryViewer } from './StoryViewer';
import { StoryComposer } from './StoryComposer';
import { Skeleton } from '@/components/ui/skeleton';

const STORY_TYPE_EMOJI: Record<TodayStory['type'], string> = {
    sloka: '📜',
    sutra: '✍️',
    announce: '🎉',
    thought: '💡',
    event: '🗓️',
};

function Ring({ story, onSelect }: { story: TodayStory, onSelect: (story: TodayStory) => void }) {
    const backgroundStyle = story.content.style?.background || 'hsl(var(--muted))';
    return (
        <div className="flex flex-col items-center gap-1.5" onClick={() => onSelect(story)}>
             <div className="vk-today-ring">
                <div className="vk-today-ring__bg" style={{ background: backgroundStyle }}></div>
                <div className="vk-today-ring__emoji">
                    {STORY_TYPE_EMOJI[story.type] || '✨'}
                </div>
                <div className="vk-today-ring__border"></div>
                {/* <div className="vk-today-ring__content">
                    <Image
                        src={story.authorAvatarUrl}
                        alt={story.authorName}
                        width={80}
                        height={80}
                        className="vk-today-ring__image"
                        data-ai-hint="person avatar"
                    />
                </div> */}
                <div  className="vk-today-ring__content"
  style={{
    // background: "#f5f5f5",
        background: 'transparent',
    borderRadius: "50%",
    width: "80px",
    height: "80px",
  }}
>
  {story?.title}

</div>

                
                 <p className="vk-today-ring__text">{story.authorName}</p>
             </div>
        </div>
    );
}

function AddStoryRing({ onClick }: { onClick: () => void }) {
    return (
        <div className="flex flex-col items-center gap-1.5" onClick={onClick}>
             <div className="vk-today-ring">
                <div className="vk-today-ring__content border-2 border-dashed flex-col gap-1 text-muted-foreground">
                    <Plus className="h-8 w-8" />
                    <span className="text-xs font-semibold">Add Story</span>
                </div>
             </div>
        </div>
    );
}

export function TodayBar({ stories, isLoading, currentUser, onStoryCreated }: { 
    stories: TodayStory[], 
    isLoading: boolean,
    currentUser: UserProfile,
    onStoryCreated: () => void,
}) {
    const [selectedStoryIndex, setSelectedStoryIndex] = useState<number | null>(null);
    const [isComposerOpen, setIsComposerOpen] = useState(false);

    const handleSelectStory = (story: TodayStory) => {
        const index = stories.findIndex(s => s.id === story.id);
        if (index !== -1) {
            setSelectedStoryIndex(index);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center space-x-4">
                 {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex flex-col items-center gap-1.5">
                        <Skeleton className="h-32 w-20 rounded-lg" />
                    </div>
                 ))}
            </div>
        )
    }
    
    return (
        <>
            <ScrollArea className="w-full whitespace-nowrap">
                <div className="flex w-max space-x-4">
                    <AddStoryRing onClick={() => setIsComposerOpen(true)} />
                    {stories.map(story => (
                      
                        <Ring key={story.id} story={story} onSelect={handleSelectStory} />
                    ))}
                </div>
                <ScrollBar orientation="horizontal" className="h-2" />
            </ScrollArea>

            {selectedStoryIndex !== null && (
                <StoryViewer
                    stories={stories}
                    initialIndex={selectedStoryIndex}
                    onClose={() => setSelectedStoryIndex(null)}
                />
            )}
            
            <StoryComposer 
                open={isComposerOpen}
                onOpenChange={setIsComposerOpen}
                currentUser={currentUser}
                onStoryCreated={onStoryCreated}
            />
        </>
    );
}
