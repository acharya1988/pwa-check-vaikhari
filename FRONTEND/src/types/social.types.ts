

import type { PostAuthor, Spark, Glow, Answer } from '.';

export type PostType = 'thought' | 'reflection' | 'sutra' | 'question' | 'poetry';
export type PostStatus = 'raw' | 'thread-started' | 'drifting' | 'glowing' | 'evolving';
export type PostMethod = 'feed' | 'circle';

export interface AttachedWork {
  type: 'book-article' | 'standalone-article' | 'book';
  href: string;
  title: string;
  parentTitle?: string;
  coverUrl?: string;
  profileUrl?: string;
  description?: string;
}

export interface Post {
  id: string;
  postType: PostType;
  postMethod?: PostMethod;
  circleId?: string;
  status: PostStatus;
  author: PostAuthor;
  content: string;
  tags?: string[];
  mentions?: string[];
  metaTags?: string[];
  attachedWork?: AttachedWork;
  evolvedTo?: {
      type: 'standalone-article' | 'book-chapter';
      id: string;
      title: string;
  };
  createdAt: number;
  views: number;
  reactions: {
    likes: number;
    dislikes: number;
    insightful: number;
    uplifting: number;
    cites: number;
  };
  answers?: Answer[];
  acceptedAnswerId?: string;
  sparks?: Spark[];
  glows?: Glow[];
}

export interface Comment {
    id: string;
    authorId: string;
    timestamp: number;
    title?: string;
    body: string;
    targetText?: string;
    feedback: {
        likes: number;
        dislikes: number;
    };
    reasonTags?: string[];
    replies?: Comment[];
}
