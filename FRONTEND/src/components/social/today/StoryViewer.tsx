
'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, Play, Pause, MoreVertical, MessageSquare, Link as LinkIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { TodayStory } from '@/types';
import Image from 'next/image';
import { ScriptSwitcher } from '@/components/script-switcher';
import { formatDistanceToNow } from 'date-fns';
import { SocialContentRenderer } from '../social-content-renderer';
import Link from 'next/link';

const BACKGROUND_STYLES: Record<string, React.CSSProperties> = {
    paper: { backgroundImage: `url('/media/paper_texture.jpg')`, backgroundSize: 'cover' },
    minimal: { backgroundColor: '#1a1a1a' },
    mural: { backgroundImage: `url('https://placehold.co/500x900.png')`, backgroundSize: 'cover' },
    maroon: { backgroundColor: '#800000' },
};

function StoryCard({ story, isActive }: { story: TodayStory, isActive: boolean }) {
    const backgroundStyle = story.content.style?.background || '#1a1a1a';
    const textColor = story.content.style?.textColor || '#ffffff';
    const fontSize = story.content.style?.fontSize || 26;

    return (
        <motion.div
            className="vk-today-viewer__story-card"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: isActive ? 1 : 0.8, opacity: isActive ? 1 : 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: 'easeInOut' }}
        >
            <div className="vk-today-viewer__bg" style={{ background: backgroundStyle }} />
             <div className="vk-today-viewer__bg" style={{background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 40%, transparent 60%, rgba(0,0,0,0.7) 100%)'}}></div>
            <div className="vk-today-viewer__text-content" style={{ color: textColor }}>
                {story.title && <div className="text-sm opacity-75 mb-2">{story.title}</div>}
                <div 
                    className="font-serif whitespace-pre-wrap"
                    style={{ fontSize: `${fontSize}px`, lineHeight: 1.4 }}
                >
                    <SocialContentRenderer htmlString={story.content.text} />
                </div>
                 {story.content.attachedWork && (
                    <Button asChild variant="outline" className="mt-4 bg-white/10 border-white/20 text-white hover:bg-white/20">
                        <Link href={story.content.attachedWork.href}>
                            <LinkIcon className="mr-2 h-4 w-4" /> View Announcement
                        </Link>
                    </Button>
                 )}
            </div>
        </motion.div>
    )
}

export function StoryViewer({ stories, initialIndex, onClose }: { stories: TodayStory[], initialIndex: number, onClose: () => void }) {
    const [currentIndex, setCurrentIndex] = useState(initialIndex);
    const [isPlaying, setIsPlaying] = useState(true);
    const [progress, setProgress] = useState(0);
    const timerRef = useRef<NodeJS.Timeout>();

    const story = stories[currentIndex];

    const goToNext = useCallback(() => {
        if (currentIndex < stories.length - 1) {
            setCurrentIndex(prev => prev + 1);
        } else {
            onClose();
        }
    }, [currentIndex, stories.length, onClose]);

    const goToPrev = () => {
        if (currentIndex > 0) {
            setCurrentIndex(prev => prev - 1);
        }
    };
    
    useEffect(() => {
        setProgress(0);
        setIsPlaying(true);
    }, [currentIndex]);
    
    useEffect(() => {
        if (isPlaying) {
            timerRef.current = setInterval(() => {
                setProgress(prev => {
                    if (prev >= 100) {
                        goToNext();
                        return 0;
                    }
                    return prev + 100 / (5 * 10); // 5 seconds per story, 10 updates per second
                });
            }, 100);
        } else {
            clearInterval(timerRef.current);
        }
        return () => clearInterval(timerRef.current);
    }, [isPlaying, goToNext]);


    return (
        <motion.div 
            className="vk-today-viewer"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
        >
            <div className="vk-today-viewer__content" onClick={(e) => e.stopPropagation()}>
                <div className="vk-today-viewer__story-area" onClick={() => setIsPlaying(p => !p)}>
                    <AnimatePresence>
                        {stories.map((s, index) => (
                            index === currentIndex && <StoryCard key={s.id} story={s} isActive={true} />
                        ))}
                    </AnimatePresence>
                    
                    <div className="vk-today-viewer__progress-bar">
                        <div className="vk-today-viewer__progress-indicator" style={{ width: `${progress}%` }} />
                    </div>

                    <div className="vk-today-viewer__header">
                        <div className="vk-today-viewer__author">
                             <Avatar className="h-8 w-8 border-2 border-white/50">
                                <AvatarImage src={story.authorAvatarUrl} alt={story.authorName} />
                                <AvatarFallback>{story.authorName.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div className="space-y-0">
                                <p className="vk-today-viewer__author-name">{story.authorName}</p>
                                <p className="text-xs text-white/80">{formatDistanceToNow(new Date(story.createdAt), { addSuffix: true })}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-1">
                             <Button variant="ghost" size="icon" className="text-white h-8 w-8" onClick={() => setIsPlaying(p => !p)}>
                                {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                            </Button>
                            <Button variant="ghost" size="icon" className="text-white h-8 w-8" onClick={onClose}>
                                <X className="h-5 w-5" />
                            </Button>
                        </div>
                    </div>
                    
                    <button className="vk-today-viewer__nav left-0" onClick={(e) => { e.stopPropagation(); goToPrev(); }}></button>
                    <button className="vk-today-viewer__nav right-0" onClick={(e) => { e.stopPropagation(); goToNext(); }}></button>
                </div>

                <div className="vk-today-viewer__context-box">
                    <div className="flex justify-between items-center">
                        <div>
                            {story.content.source && <p className="font-semibold">{story.content.source}</p>}
                            {story.tags && story.tags.length > 0 && (
                                <div className="flex gap-1 mt-1">
                                    {story.tags.map(tag => <Badge key={tag} variant="secondary">{tag}</Badge>)}
                                </div>
                            )}
                        </div>
                        <div className="flex items-center gap-1">
                            <ScriptSwitcher />
                        </div>
                    </div>
                </div>

                 <div className="vk-today-viewer__actions p-2 border-t flex justify-around">
                    <Button variant="ghost"><MessageSquare className="h-5 w-5 mr-2" /> Reply</Button>
                    <Button variant="ghost">🙏</Button>
                    <Button variant="ghost">🌸</Button>
                    <Button variant="ghost">📚</Button>
                </div>
            </div>
        </motion.div>
    );
}
