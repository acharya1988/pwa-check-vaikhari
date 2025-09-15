
import type { Comment } from '.';

export interface DashboardStats {
  totalBooks: number;
  publishedArticles: number;
  totalCitations: number;
  totalBookmarks: number;
  totalChintanaThreads: number;
  totalChintanaPosts: number;
  recentComments: {
    id: string;
    body: string;
    bookId: string;
    chapterId: string | number;
    articleVerse: string | number;
    articleTitle: string;
    timestamp: number;
  }[];
  engagementStats: {
    likes: number;
    dislikes: number;
    totalComments: number;
    commentReasonCounts: { name: string; value: number }[];
  };
}
