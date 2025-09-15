
'use client';

import type { PostAuthor, Category, SubCategory } from ".";
import { CHINTANA_CATEGORIES, CHINTANA_POST_TYPES } from './chintana.constants';

export type ChintanaCategory = typeof CHINTANA_CATEGORIES[number];
export type ChintanaPostType = typeof CHINTANA_POST_TYPES[number]['id'];

export interface ChintanaPostReactions {
    upvotes: number;
    downvotes: number;
    insightful: number;
    love: number;
    pramanaRequested: number;
    explanationRequested: number;
    fallacyFlagged: number;
}


export interface ChintanaPost {
    id: string;
    author: PostAuthor;
    postType: ChintanaPostType;
    title?: string; // For fallacy flags
    content: string;
    createdAt: number;
    reactions: ChintanaPostReactions;
    replies: ChintanaPost[];
}

export interface ChintanaThread {
    id: string;
    title: string;
    author: PostAuthor;
    genreId: string;
    categoryId: string;
    subCategoryId?: string;
    tags: string[]; // user-defined tags
    createdAt: number;
    updatedAt: number;
    posts: ChintanaPost[];
    followers: string[]; // array of userIds
}
