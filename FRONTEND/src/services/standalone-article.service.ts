

'use server';

import slugify from 'slugify';
import type { StandaloneArticle, StandaloneArticleCategory } from '@/types';
import { readJsonFile } from './db';
import { updatePost } from './post.service';
import { getDb } from '@/lib/mongo';
import { serializeMongo } from '@/lib/serialize';

async function seedInitialCategories() {
  const dbm = await getDb();
  const count = await dbm.collection('standalone_article_categories').countDocuments();
  if (count === 0) {
    await dbm.collection('standalone_article_categories').insertOne({ id: 'uncategorized', name: 'Uncategorized' });
  }
}

export async function getStandaloneArticleCategories(): Promise<StandaloneArticleCategory[]> {
    await seedInitialCategories();
    const dbm = await getDb();
    const list = await dbm.collection('standalone_article_categories').find({}).toArray();
    return serializeMongo(list) as StandaloneArticleCategory[];
}

export async function addStandaloneArticleCategory(name: string): Promise<StandaloneArticleCategory> {
    const id = slugify(name, { lower: true, strict: true });
    const dbm = await getDb();
    const exists = await dbm.collection('standalone_article_categories').findOne({ id });
    if (exists) throw new Error('A category with this name already exists.');
    const newCategory: StandaloneArticleCategory = { id, name } as any;
    await dbm.collection('standalone_article_categories').insertOne(newCategory as any);
    return serializeMongo(newCategory) as StandaloneArticleCategory;
}

export async function getStandaloneArticles(): Promise<StandaloneArticle[]> {
    const dbm = await getDb();
    const count = await dbm.collection('standalone_articles').countDocuments();
    if (count === 0) {
      const legacy = await readJsonFile<StandaloneArticle[]>('src/lib/corpus/standalone-articles.json');
      if (legacy && legacy.length) {
        const prepared = legacy.map((a) => ({ ...a, id: a.id || `article-${Date.now()}` }));
        if (prepared.length) await dbm.collection('standalone_articles').insertMany(prepared as any[]);
        return prepared as StandaloneArticle[];
      }
      return [];
    }
    const raw = (await dbm.collection('standalone_articles').find({}).toArray()) as any[];
    const articles = serializeMongo(raw) as any[];
    return articles.map((article: any) => ({
      ...article,
      ownerId: article.ownerId || 'researcher@vakyaverse.com',
      feedback: article.feedback || { likes: 0, dislikes: 0, insightful: 0, uplifting: 0, views: 0, scores: [] },
      visibility: article.visibility || 'private',
      circleIds: article.circleIds || [],
      isAnnounced: article.isAnnounced || false,
    })) as StandaloneArticle[];
}

export async function getStandaloneArticle(id: string): Promise<StandaloneArticle | null> {
    const dbm = await getDb();
    const article = await dbm.collection('standalone_articles').findOne({ id });
    return article ? (serializeMongo(article) as StandaloneArticle) : null;
}

export async function addStandaloneArticle(data: Partial<Omit<StandaloneArticle, 'id' | 'createdAt' | 'updatedAt' | 'visibility' | 'circleIds' | 'isAnnounced'>> & { ownerId?: string }): Promise<StandaloneArticle> {
    const dbm = await getDb();
    const { sourcePostId, ...articleData } = data as any;
    const id = globalThis.crypto?.randomUUID ? globalThis.crypto.randomUUID() : (Math.random().toString(36).slice(2) + Date.now());
    const newArticle: StandaloneArticle = {
      ...(articleData as any),
      id,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      ownerId: (data as any).ownerId,
      feedback: { likes: 0, dislikes: 0, insightful: 0, uplifting: 0, views: 0, scores: [] },
      visibility: 'private',
      circleIds: [],
      isAnnounced: false,
    } as any;
    await dbm.collection('standalone_articles').insertOne(newArticle as any);
    if (sourcePostId) await updatePost(sourcePostId, { evolvedTo: { type: 'standalone-article', id: newArticle.id, title: (newArticle as any).title } } as any);
    return serializeMongo(newArticle) as StandaloneArticle;
}

export async function updateStandaloneArticleInDb(id: string, data: Partial<Omit<StandaloneArticle, 'id' | 'createdAt'>>): Promise<StandaloneArticle> {
    const dbm = await getDb();
    const existing = await dbm.collection('standalone_articles').findOne({ id });
    if (!existing) throw new Error('Article not found.');
    const updatedData = { ...data, updatedAt: Date.now() } as any;
    await dbm.collection('standalone_articles').updateOne({ id }, { $set: updatedData });
    return serializeMongo({ ...(existing as any), ...updatedData }) as StandaloneArticle;
}

export async function deleteStandaloneArticleFromDb(id: string): Promise<void> {
    const dbm = await getDb();
    await dbm.collection('standalone_articles').deleteOne({ id });
}

export async function writeStandaloneArticles(articles: StandaloneArticle[]): Promise<void> {
    const dbm = await getDb();
    for (const article of articles) {
      await dbm.collection('standalone_articles').updateOne({ id: article.id }, { $set: article as any }, { upsert: true });
    }
}


export interface GroupedStandaloneArticle {
    category: StandaloneArticleCategory;
    articles: StandaloneArticle[];
}

export async function getStandaloneArticlesGroupedByCategory(): Promise<GroupedStandaloneArticle[]> {
    const categories = await getStandaloneArticleCategories();
    const articles = await getStandaloneArticles();
    
    const categoryMap: Record<string, StandaloneArticleCategory> = {};
    categories.forEach(cat => categoryMap[cat.id] = cat);

    const grouped: Record<string, GroupedStandaloneArticle> = {};
    
    categories.forEach(cat => {
        grouped[cat.id] = { category: cat, articles: [] };
    });

    articles.forEach(article => {
        const categoryId = article.categoryId;
        if (grouped[categoryId]) {
            grouped[categoryId].articles.push(article);
        } else {
            if (!grouped['uncategorized']) {
                grouped['uncategorized'] = { category: { id: 'uncategorized', name: 'Uncategorized' }, articles: [] };
            }
            grouped['uncategorized'].articles.push(article);
        }
    });
    
    return Object.values(grouped).filter(group => group.articles.length > 0 || group.category.id === 'uncategorized');
}
