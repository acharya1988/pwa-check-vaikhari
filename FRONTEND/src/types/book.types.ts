

import type { PostAuthor, Comment, ContentBlock, Genre } from '.';

export interface VolumeInfo {
    seriesName: string;
    volumeNumber?: number;
}

export interface BookCategory {
    id: string;
    name: string;
    genreId: string;
}

export interface Book {
    id: string;
    name: string;
    genreId: string;
    categoryId: string;
    visibility: 'private' | 'circle' | 'public';
    isAnnounced: boolean;
    coverUrl?: string;
    profileUrl?: string;
    volumeInfo?: VolumeInfo;
    ownerId?: string;
    organizationId?: string;
    organizationName?: string;
    structureType?: 'regular' | 'serial';
}

export type BookWithStats = Book & {
    authorName?: string;
    publishedAt?: number;
    shortDescription?: string;
    rating: number;
    views: number;
};

export interface StandaloneArticleCategory {
    id: string;
    name: string;
}

export interface ArticleFeedback {
  likes: number;
  dislikes: number;
  insightful: number;
  uplifting: number;
  views: number;
  scores: { value: number; count: number }[];
}


export interface StandaloneArticle {
    id:string;
    title: string;
    tagline?: string;
    description?: string;
    type: 'article' | 'abstract' | 'whitepaper';
    categoryId: string;
    genreId?: string;
    subCategoryId?: string;
    content: string;
    createdAt: number;
    updatedAt: number;
    ownerId?: string;
    feedback?: ArticleFeedback;
    visibility: 'private' | 'circle' | 'public';
    circleIds: string[];
    isAnnounced: boolean;
    sourceDrift?: {
        bookId: string;
        chapterId: string;
        verse: string;
        blockId: string;
    };
    tags?: string[];
    taggedUserIds?: string[];
    taggedOrganizationIds?: string[];
    taggedBookIds?: string[];
    taggedCircleIds?: string[];
}

export interface NewBookData {
  name: string;
  genreId: string;
  categoryId: string;
  subtitle?: string;
  description?: string;
  shortDescription?: string;
  authorName?: string;
  publishedAt?: string;
  coverUrl?: string;
  profileUrl?: string;
  publisher?: string;
  isbn?: string;
  designer?: string;
  subject?: string;
  sourceTypes?: string[];
  commentaryTypes?: string[];
  volumeInfo?: VolumeInfo;
  ownerId?: string;
  organizationId?: string;
  organizationName?: string;
  structureType?: 'regular' | 'serial';
};

export interface GroupedBookByGenre {
    genre: Genre;
    series: SeriesGroup[];
    standaloneBooks: Book[];
}

export interface SeriesInfo {
    name: string;
    description: string;
}

export interface SeriesGroup {
    seriesName: string;
    description?: string;
    volumes: Book[];
    genreId: string;
}

export interface BookStructure {
  sourceTypes: string[];
  commentaryTypes: string[];
}

export interface BookContent {
    bookId: string;
    bookName: string;
    genreId: string;
    categoryId: string;
    subtitle: string;
    description: string;
    shortDescription: string;
    authorName?: string;
    publishedAt?: number;
    coverUrl: string;
    profileUrl: string;
    publisher: string;
    isbn: string;
    designer: string;
    subject: string;
    chapters: Chapter[];
    structure: BookStructure;
    visibility: 'private' | 'circle' | 'public';
    circleIds: string[];
    isAnnounced: boolean;
    volumeInfo?: VolumeInfo;
    ownerId?: string;
    organizationId?: string;
    organizationName?: string;
    structureType?: 'regular' | 'serial';
}

export interface Article {
    verse: string | number;
    title: string;
    content: ContentBlock[];
    tags: string[];
    status: 'draft' | 'published';
    author: PostAuthor;
    createdAt: number;
    updatedAt: number;
    feedback?: ArticleFeedback;
    comments?: Comment[];
}

export interface Chapter {
    id: string | number;
    name: string;
    topic?: string;
    articles: Article[];
    children?: Chapter[];
}
