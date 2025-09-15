
"use server";

import slugify from 'slugify';
import type { GlossaryCategory, GlossaryTerm } from '@/types';
import { readJsonFile } from './db';
import { getDb } from '@/lib/mongo';
import { serializeMongo } from '@/lib/serialize';

const GLOSSARY_CATEGORIES_COLLECTION = 'glossary_categories';
const GLOSSARY_TERMS_COLLECTION = 'glossary_terms';

// Seed glossary data into Mongo if collections are empty.
async function seedInitialGlossaryData() {
  const db = await getDb();
  const catCount = await db.collection(GLOSSARY_CATEGORIES_COLLECTION).countDocuments();
  if (catCount === 0) {
    const defaultCategories = [
      { id: 'uncategorized', name: 'Uncategorized', scope: 'local', colorTheme: 'gray' },
      { id: 'vedanta-terms', name: 'Vedanta Terms', scope: 'global', colorTheme: 'saffron' },
    ];
    if (defaultCategories.length) await db.collection(GLOSSARY_CATEGORIES_COLLECTION).insertMany(defaultCategories as any[]);
  }

  const termsCount = await db.collection(GLOSSARY_TERMS_COLLECTION).countDocuments();
  if (termsCount === 0) {
    const legacyData = await readJsonFile<GlossaryCategory[]>('src/lib/corpus/glossary.json');
    if (legacyData) {
      const bulk: any[] = [];
      legacyData.forEach(category => {
        category.terms.forEach(term => {
          bulk.push({ ...term, categoryId: category.id });
        });
      });
      if (bulk.length) await db.collection(GLOSSARY_TERMS_COLLECTION).insertMany(bulk as any[]);
    }
  }
}

export async function getGlossaryData(): Promise<GlossaryCategory[]> {
  await seedInitialGlossaryData();
  const db = await getDb();
  const categories = await db.collection<GlossaryCategory>(GLOSSARY_CATEGORIES_COLLECTION).find({}).toArray();
  const allTerms = await db.collection<GlossaryTerm & { categoryId: string }>(GLOSSARY_TERMS_COLLECTION).find({}).toArray();
  const combined = (categories as any[]).map((cat) => ({
    ...(cat as any),
    terms: (allTerms as any[])
      .filter((t) => t.categoryId === (cat as any).id)
      .sort((a, b) => a.term.localeCompare(b.term, 'kn-IN')),
  }));
  return serializeMongo(combined) as GlossaryCategory[];
}

export async function getFullGlossary(): Promise<GlossaryTerm[]> {
  const db = await getDb();
  const list = await db.collection<GlossaryTerm>(GLOSSARY_TERMS_COLLECTION).find({}).toArray();
  return serializeMongo(list) as GlossaryTerm[];
}

export async function addGlossaryCategory(name: string): Promise<GlossaryCategory> {
  const id = slugify(name, { lower: true, strict: true });
  const db = await getDb();
  const existing = await db.collection(GLOSSARY_CATEGORIES_COLLECTION).findOne({ id });
  if (existing) throw new Error('A glossary category with this name already exists.');
  const newCategory = { id, name, scope: 'local', colorTheme: 'blue' } as any;
  await db.collection(GLOSSARY_CATEGORIES_COLLECTION).insertOne(newCategory);
  return { ...newCategory, terms: [] } as GlossaryCategory;
}

export async function addGlossaryTerm(categoryId: string, termData: Omit<GlossaryTerm, 'id'>): Promise<GlossaryTerm> {
  const db = await getDb();
  const existing = await db.collection(GLOSSARY_TERMS_COLLECTION).findOne({ term: termData.term });
  if (existing) throw new Error('A term with this exact Sanskrit spelling already exists.');
  const newDocId = globalThis.crypto?.randomUUID ? globalThis.crypto.randomUUID() : (Math.random().toString(36).slice(2) + Date.now());
  const newTerm = { ...termData, id: newDocId, categoryId } as any;
  await db.collection(GLOSSARY_TERMS_COLLECTION).insertOne(newTerm);
  return newTerm as GlossaryTerm;
}


export async function bulkAddTermsToCategory(categoryId: string, terms: Omit<GlossaryTerm, 'id'>[]): Promise<{ added: number, skipped: number }> {
  const db = await getDb();
  const existingDocs = await db.collection(GLOSSARY_TERMS_COLLECTION).find({}, { projection: { term: 1, _id: 0 } } as any).toArray();
  const existingTerms = new Set(existingDocs.map((d: any) => d.term));

  const toInsert: any[] = [];
  let added = 0;
  let skipped = 0;
  for (const termData of terms) {
    if (existingTerms.has(termData.term)) { skipped++; continue; }
    const id = globalThis.crypto?.randomUUID ? globalThis.crypto.randomUUID() : (Math.random().toString(36).slice(2) + Date.now());
    toInsert.push({ ...termData, id, categoryId });
    existingTerms.add(termData.term);
    added++;
  }
  if (toInsert.length) await db.collection(GLOSSARY_TERMS_COLLECTION).insertMany(toInsert);
  return { added, skipped };
}
