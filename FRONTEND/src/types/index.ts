

export * from './book.types';
export * from './citation.types';
export * from './glossary.types';
export * from './misc.types';
export * from './quote.types';
export * from './sanskrit.types';
export * from './social.types';
export * from './user.types';
export * from './dashboard.types';
export * from './import.types';
export * from './message.types';
export * from './training.types';
export * from './theme.types';
export * from './ai.types';
export * from './chintana.types';
export * from './today.types';
export * from './organization.types';
export * from './genre.types';

// Super Admin Content Type
export type ContentType = 'standalone-article' | 'book-article' | 'book' | 'citation' | 'glossary-term' | 'quote' | 'post';

export interface SuperAdminContent {
    id: string; // A unique ID for this cloned entry
    originalContentId: string; // ID of the source content
    contentType: ContentType;
    originalUserId: string;
    sourcePath: string; // e.g., '/articles/{bookId}/{chapterId}/{verse}'
    content: any; // The cloned content object itself
    allowAiSync: boolean;
    createdAt: number;
    updatedAt: number;
}


// AI Interaction Log
export interface VaiaInteraction {
    role: 'user' | 'assistant';
    content: string;
}

export interface VaiaSession {
    sessionId: string;
    userId: string;
    userRole: string;
    timestamp: number;
    interactions: VaiaInteraction[];
    feedback?: 'good' | 'bad';
    notes?: string;
}
