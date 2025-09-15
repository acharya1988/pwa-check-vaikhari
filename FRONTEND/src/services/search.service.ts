
'use server';

import type { CorpusEntry } from '@/types';
import { getBookData, getBooks } from './book.service';
import { stripHtml } from './service-utils';

export type { CorpusEntry };

function normalizeSanskrit(text: string): string {
  return text.replace(/[|।,-.!"'()]/g, ' ').replace(/\s+/g, ' ').trim();
}

export async function getFullCorpusForSearch(): Promise<CorpusEntry[]> {
    const books = await getBooks();
    const allEntries: CorpusEntry[] = [];

    for (const book of books) {
        try {
            const content = await getBookData(book.id);
            if (!content || !content.chapters) continue;
            
            const traverseChaptersForArticles = (chapters: any[], bookName: string, action: (article: any, chapter: any, bookName: string) => void) => {
                for (const chapter of chapters) {
                    if (chapter.articles) {
                        chapter.articles
                            .filter((article: any) => article.status === 'published')
                            .forEach((article: any) => action(article, chapter, bookName));
                    }
                    if (chapter.children) {
                        traverseChaptersForArticles(chapter.children, bookName, action);
                    }
                }
            };

            traverseChaptersForArticles(content.chapters, content.bookName, (article, chapter, bookName) => {
                 allEntries.push({
                    book: bookName,
                    chapter: chapter.name,
                    verse: article.verse,
                    text_sanskrit: stripHtml(article.content.map((c:any) => c.sanskrit).join(' \n')),
                    text_english: stripHtml(article.content.flatMap((c:any) => Object.values(c.translations || {})).join(' \n'))
                });
            });
        } catch (error) {
            console.error(`Could not load corpus for ${book.name}`, error);
        }
    }
    return allEntries;
}


export async function searchCorpus(variations: string[]): Promise<CorpusEntry[]> {
  try {
    const fullCorpus: CorpusEntry[] = await getFullCorpusForSearch();
    const matches: CorpusEntry[] = [];

    const variationTokenSets = variations.map(v => new Set(normalizeSanskrit(v).split(' ').filter(t => t.length > 1)));

    for (const entry of fullCorpus) {
      const entryTokens = new Set(normalizeSanskrit(entry.text_sanskrit).split(' '));
      
      for (const vTokens of variationTokenSets) {
        if (vTokens.size === 0) continue;
        
        const intersection = new Set([...vTokens].filter(x => entryTokens.has(x)));
        
        if (intersection.size / vTokens.size > 0.5 && !matches.some(m => m.text_sanskrit === entry.text_sanskrit)) {
          matches.push(entry);
          break; 
        }
      }
    }

    return matches;
  } catch (error) {
    console.error("Error loading or searching corpus:", error);
    return [];
  }
}
