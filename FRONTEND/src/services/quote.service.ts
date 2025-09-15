

"use server";

import slugify from 'slugify';
import type { Quote, QuoteCategory } from '@/types';
import { searchQuotesContextually } from '@/ai/flows/search-quotes-contextually';
import { readJsonFile } from './db';
import { getDb } from '@/lib/mongo';
import { serializeMongo } from '@/lib/serialize';


const QUOTE_CATEGORIES_COLLECTION = 'quote_categories';
const QUOTES_COLLECTION = 'quotes';

async function seedInitialQuoteData() {
  const dbm = await getDb();
  const count = await dbm.collection(QUOTES_COLLECTION).countDocuments();
  if (count > 0) {
    // Ensure 'collected-from-post' exists
    const exists = await dbm.collection(QUOTE_CATEGORIES_COLLECTION).findOne({ id: 'collected-from-post' });
    if (!exists) await dbm.collection(QUOTE_CATEGORIES_COLLECTION).insertOne({ id: 'collected-from-post', name: 'Collected from Posts' });
    return;
  }

  const legacyData = await readJsonFile<QuoteCategory[]>('src/lib/corpus/quotes.json');
  if (!legacyData || legacyData.length === 0) {
    const unc = await dbm.collection(QUOTE_CATEGORIES_COLLECTION).findOne({ id: 'uncategorized' });
    if (!unc) await dbm.collection(QUOTE_CATEGORIES_COLLECTION).insertOne({ id: 'uncategorized', name: 'Uncategorized' });
    return;
  }

  const catBulk: any[] = [];
  const quoteBulk: any[] = [];
  for (const category of legacyData) {
    catBulk.push({ id: category.id, name: category.name });
    for (const quote of category.quotes) {
      const id = quote.id || `quote-${Date.now()}-${Math.random()}`;
      quoteBulk.push({ ...quote, categoryId: category.id, id });
    }
  }
  if (catBulk.length) await dbm.collection(QUOTE_CATEGORIES_COLLECTION).insertMany(catBulk);
  if (quoteBulk.length) await dbm.collection(QUOTES_COLLECTION).insertMany(quoteBulk);
  await dbm.collection(QUOTE_CATEGORIES_COLLECTION).updateOne(
    { id: 'collected-from-post' },
    { $set: { id: 'collected-from-post', name: 'Collected from Posts' } },
    { upsert: true }
  );
}


export async function getQuoteData(): Promise<QuoteCategory[]> {
  await seedInitialQuoteData();
  const dbm = await getDb();
  const categories = await dbm.collection(QUOTE_CATEGORIES_COLLECTION).find({}).toArray();
  const allQuotes = await dbm.collection(QUOTES_COLLECTION).find({}).toArray();
  const combined = (categories as any[]).map((cat) => ({
    ...(cat as any),
    quotes: (allQuotes as any[]).filter((q) => q.categoryId === (cat as any).id),
  }));
  return serializeMongo(combined) as QuoteCategory[];
}

export async function addQuoteCategory(name: string): Promise<QuoteCategory> {
  const id = slugify(name, { lower: true, strict: true });
  const dbm = await getDb();
  const exists = await dbm.collection(QUOTE_CATEGORIES_COLLECTION).findOne({ id });
  if (exists) throw new Error('A quote category with this name already exists.');
  const newCategory = { id, name } as any;
  await dbm.collection(QUOTE_CATEGORIES_COLLECTION).insertOne(newCategory);
  return { ...newCategory, quotes: [] } as QuoteCategory;
}

export async function addQuote(categoryId: string, quoteData: Omit<Quote, 'id'>): Promise<Quote> {
  const dbm = await getDb();
  const id = globalThis.crypto?.randomUUID ? globalThis.crypto.randomUUID() : (Math.random().toString(36).slice(2) + Date.now());
  const newQuote = { ...quoteData, id, categoryId } as any;
  await dbm.collection(QUOTES_COLLECTION).insertOne(newQuote);
  return newQuote as Quote;
}


export async function searchQuotes(query: string): Promise<Quote[]> {
  const dbm = await getDb();
  const allQuotes = (await dbm.collection(QUOTES_COLLECTION).find({}).toArray()) as Quote[];
  if (!query) return allQuotes;
  const q = query.toLowerCase();
  const results: Quote[] = [];
  for (const quote of allQuotes) {
    if (
      (quote.title || '').toLowerCase().includes(q) ||
      (quote.quote || '').toLowerCase().includes(q) ||
      (quote.author || '').toLowerCase().includes(q)
    ) {
      results.push(quote);
    }
  }
  return results.slice(0, 10);
}


export async function suggestQuotesForArticle(articleText: string): Promise<Quote[]> {
    if (articleText.length < 50) return [];

    try {
        const allQuotes = await searchQuotes('');
        
        if (allQuotes.length === 0) return [];

        const result = await searchQuotesContextually({ articleText, quotes: allQuotes });
        return result.relevantQuotes || [];

    } catch (e) {
        console.error('AI Quote Suggestion Error:', e);
        return [];
    }
}
