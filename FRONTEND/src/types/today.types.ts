
'use client';
import type { AttachedWork } from '.';

export type StoryType = 'sloka' | 'sutra' | 'announce' | 'thought' | 'event';
export type StoryBackground = 'paper' | 'minimal' | 'mural' | 'maroon' | string;

export interface TodayStoryStyle {
    background: string;
    textColor: string;
    fontSize: number;
}

export interface TodayStory {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatarUrl: string;
  type: StoryType;
  title?: string;
  content: {
    text: string;
    script: 'devanagari' | 'iast';
    transliteration?: string;
    chandas?: string;
    source?: string;
    audioUrl?: string;
    bg?: StoryBackground;
    style?: TodayStoryStyle; // New rich style object
    attachedWork?: AttachedWork;
  };
  category?: string;
  tags?: string[];
  visibility: {
    createdAt: number | string; // Allow string from client
    expiryAt: number | string;  // Allow string from client
    isArchived?: boolean;
  };
  createdAt: number;
  updatedAt: number;
  version: number;
}
