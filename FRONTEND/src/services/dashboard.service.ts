

'use server';

import { getBooks, getBookData } from './book.service';
import { getCitationData } from './citation.service';
import { getBookmarksForUser, getUserProfile } from './user.service';
import type { DashboardStats, Comment, Article, Chapter, ChintanaThread, ChintanaPost } from '@/types';
import { getChintanaThreads } from './chintana.service';
import { getStandaloneArticles } from './standalone-article.service';

function countComments(comments: Comment[]): number {
    let count = comments.length;
    for (const comment of comments) {
        if (comment.replies) {
            count += countComments(comment.replies);
        }
    }
    return count;
}

function countChintanaPosts(posts: ChintanaPost[]): number {
    let count = posts.length;
    for (const post of posts) {
        if (post.replies) {
            count += countChintanaPosts(post.replies);
        }
    }
    return count;
}


export async function getDashboardStats(): Promise<DashboardStats> {
    const user = await getUserProfile();

    const [allBooks, citationCategories, bookmarks, allChintanaThreads, allStandaloneArticles] = await Promise.all([
        getBooks(),
        getCitationData(),
        getBookmarksForUser(user.email),
        getChintanaThreads(),
        getStandaloneArticles(),
    ]);

    const userBooks = allBooks.filter(b => b.ownerId === user.email);

    let publishedArticles = 0;
    let likes = 0;
    let dislikes = 0;
    let totalComments = 0;
    const commentReasonCounts: Record<string, number> = {};
    const recentComments: DashboardStats['recentComments'] = [];

    const allBookContents = await Promise.all(userBooks.map(book => getBookData(book.id)));
    
    const traverseChaptersForStats = (chapters: Chapter[], bookId: string) => {
        for (const chapter of chapters) {
            if (chapter.articles) {
                for (const article of chapter.articles) {
                    if (article.status === 'published') {
                        publishedArticles++;
                    }

                    likes += article.feedback?.likes || 0;
                    dislikes += article.feedback?.dislikes || 0;
                    
                    if (article.comments) {
                        totalComments += countComments(article.comments);

                        const extractComments = (comments: Comment[], article: Article, chapter: Chapter, bookId: string) => {
                            for (const comment of comments) {
                                recentComments.push({
                                    id: comment.id,
                                    body: comment.body,
                                    bookId: bookId,
                                    chapterId: chapter.id,
                                    articleVerse: article.verse,
                                    articleTitle: article.title,
                                    timestamp: comment.timestamp
                                });
                                comment.reasonTags?.forEach(tag => {
                                    commentReasonCounts[tag] = (commentReasonCounts[tag] || 0) + 1;
                                });

                                if(comment.replies) {
                                    extractComments(comment.replies, article, chapter, bookId);
                                }
                            }
                        }
                        extractComments(article.comments, article, chapter, bookId);
                    }
                }
            }
             if (chapter.children) {
                traverseChaptersForStats(chapter.children, bookId);
            }
        }
    };
    
    for (const bookContent of allBookContents) {
        if (bookContent && bookContent.chapters) {
           traverseChaptersForStats(bookContent.chapters, bookContent.bookId);
        }
    }

    const userStandaloneArticles = allStandaloneArticles.filter(a => a.ownerId === user.email);
    userStandaloneArticles.forEach(article => {
        publishedArticles++;
        likes += article.feedback?.likes || 0;
        dislikes += article.feedback?.dislikes || 0;
    });

    const userChintanaThreads = allChintanaThreads.filter(t => t.author.id === user.email);
    let totalChintanaPosts = 0;
    userChintanaThreads.forEach(thread => {
        totalChintanaPosts += countChintanaPosts(thread.posts);
        thread.posts.forEach(post => {
            likes += post.reactions?.upvotes || 0;
            dislikes += post.reactions?.downvotes || 0;
        });
    });

    const totalCitations = citationCategories.reduce((sum, cat) => sum + cat.citations.length, 0);

    const formattedCommentReasonCounts = Object.entries(commentReasonCounts).map(([name, value]) => ({ name, value }));
    
    recentComments.sort((a,b) => b.timestamp - a.timestamp);
    
    return {
        totalBooks: userBooks.length,
        publishedArticles,
        totalCitations,
        totalBookmarks: bookmarks.length,
        totalChintanaThreads: userChintanaThreads.length,
        totalChintanaPosts,
        recentComments: recentComments.slice(0, 5), // Return top 5 recent
        engagementStats: {
            likes,
            dislikes,
            totalComments,
            commentReasonCounts: formattedCommentReasonCounts,
        }
    };
}
