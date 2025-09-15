

import type { Article, Chapter, Comment } from '@/types';

export function migrateArticle(article: Partial<Article> & { text_sanskrit?: string; english?: string }): Article {
    const englishFromRoot = (article as any).english;
    delete (article as any).english;

    if (!article.content) {
        article.content = [];
    }
    
    if (article.text_sanskrit) {
        article.content.push({ 
            id: crypto.randomUUID(), 
            type: 'shloka', 
            sanskrit: article.text_sanskrit, 
            originalLang: 'sa',
            translations: (article as any).text_english ? { en: (article as any).text_english } : {},
        });
    }

    article.content = article.content.map(block => {
        const englishFromBlock = (block as any).english;
        delete (block as any).english;
        
        if (!block.translations) {
            block.translations = {};
        }
        if (englishFromBlock && !block.translations.en) {
            block.translations.en = englishFromBlock;
        }
        if (!block.originalLang) {
            block.originalLang = 'sa';
        }
        if (!block.type) {
            block.type = 'shloka';
        }
        return block;
    });

    if (englishFromRoot) {
        if (article.content.length > 0) {
            if (!article.content[0].translations) {
                article.content[0].translations = {};
            }
            if (!article.content[0].translations.en) {
                article.content[0].translations.en = englishFromRoot;
            }
        }
    }
    
    delete article.text_sanskrit;
    
    if (!article.status) {
        article.status = 'published';
    }
    if (!article.title) {
        article.title = `Verse ${article.verse}`;
    }
    if (!article.tags) {
        article.tags = [];
    }
    if (!article.author) {
      article.author = { id: 'vakyateam', name: 'VakyaVerse Team', avatarUrl: '/media/_cce41b04-07a0-4c49-bd66-7d2b4a59f1a7.jpg' };
    }
    if(!article.createdAt) {
      article.createdAt = Date.now() - (1000 * 60 * 60 * 24 * Math.floor(Math.random() * 30)); // random date in last 30 days
    }
    if(!article.updatedAt) {
      article.updatedAt = article.createdAt;
    }
     if (!article.feedback) {
        article.feedback = {
            likes: 0,
            dislikes: 0,
            insightful: 0,
            uplifting: 0,
            views: 0,
            scores: Array.from({ length: 10 }, (_, i) => ({ value: i + 1, count: 0 })),
        };
    } else {
        if (article.feedback.insightful === undefined) article.feedback.insightful = 0;
        if (article.feedback.uplifting === undefined) article.feedback.uplifting = 0;
    }
    if (!article.comments) {
        article.comments = [];
    } else {
        const ensureReplies = (comments: Comment[]) => {
            for (const comment of comments) {
                if (!comment.replies) {
                    comment.replies = [];
                }
                if (comment.replies.length > 0) {
                    ensureReplies(comment.replies);
                }
            }
        };
        ensureReplies(article.comments);
    }
    return article as Article;
}

export async function findChapterRecursive(chapters: Chapter[], chapterId: string | number): Promise<Chapter | null> {
    for (const chapter of chapters) {
        if (String(chapter.id) === String(chapterId)) {
            return chapter;
        }
        if (chapter.children) {
            const found = await findChapterRecursive(chapter.children, chapterId);
            if (found) return found;
        }
    }
    return null;
}

export async function findArticleRecursive(
  chapters: Chapter[],
  chapterId: string | number,
  verse: string | number
): Promise<{ chapter: Chapter; article: Article } | null> {
  for (const chapter of chapters) {
    if (String(chapter.id) === String(chapterId)) {
      const article = chapter.articles.find(a => String(a.verse) === String(verse));
      if (article) {
        return { chapter, article };
      }
    }
    if (chapter.children) {
      const found = await findArticleRecursive(chapter.children, chapterId, verse);
      if (found) return found;
    }
  }
  return null;
}

export const stripHtml = (html: string) => {
    if (typeof window === 'undefined') {
        return html.replace(/<[^>]*>?/gm, ' ').replace(/\s+/g, ' ').trim();
    }
    const doc = new DOMParser().parseFromString(html, 'text/html');
    return doc.body.textContent || "";
};
