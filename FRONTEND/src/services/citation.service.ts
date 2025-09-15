"use server";

import slugify from 'slugify';
import type { Citation, CitationCategory } from '@/types';
import { readJsonFile } from './db';
import { getDb } from '@/lib/mongo';

const CITATIONS_COLLECTION = 'citations';
const CATEGORIES_COLLECTION = 'citation_categories';

// Seed from local JSON if Mongo collections are empty
async function seedInitialCitationData() {
  const dbm = await getDb();
  const catCount = await dbm.collection(CATEGORIES_COLLECTION).countDocuments();
  if (catCount === 0) {
    const defaultCategories = [
      { id: 'uncategorized', name: 'Uncategorized', genreId: 'uncategorized' },
      { id: 'user-saved-notes', name: 'User-Saved Notes', genreId: 'uncategorized' },
      { id: 'collected-from-post', name: 'Collected from Post', genreId: 'uncategorized' },
    ];
    await dbm.collection(CATEGORIES_COLLECTION).insertMany(defaultCategories as any[]);
  }

  const citCount = await dbm.collection(CITATIONS_COLLECTION).countDocuments();
  if (citCount === 0) {
    const legacyData = await readJsonFile<CitationCategory[]>('src/lib/corpus/citations.json');
    if (legacyData && legacyData.length > 0) {
      const bulk: any[] = [];
      const existingCategoryIds = new Set<string>();
      const cats = await dbm
        .collection(CATEGORIES_COLLECTION)
        .find({}, { projection: { id: 1, _id: 0 } } as any)
        .toArray();
      cats.forEach((c: any) => existingCategoryIds.add(c.id));
      for (const category of legacyData) {
        if (!existingCategoryIds.has(category.id)) {
          await dbm
            .collection(CATEGORIES_COLLECTION)
            .insertOne({ id: category.id, name: category.name, genreId: category.genreId || 'shastra' } as any);
          existingCategoryIds.add(category.id);
        }
        for (const citation of category.citations) {
          const docId = slugify(citation.refId, { lower: true, strict: true }) || citation.refId;
          bulk.push({ ...citation, categoryId: category.id, id: docId });
        }
      }
      if (bulk.length) await dbm.collection(CITATIONS_COLLECTION).insertMany(bulk);
    }
  }
}

export async function getCitationData(): Promise<CitationCategory[]> {
  await seedInitialCitationData();
  const dbm = await getDb();
  const categories = await dbm
    .collection<CitationCategory>(CATEGORIES_COLLECTION)
    .find({}, { projection: { _id: 0 } } as any)
    .toArray();
  const allCitations = (await dbm
    .collection<Citation>(CITATIONS_COLLECTION)
    .find({}, { projection: { _id: 0 } } as any)
    .toArray()) as any[];
  return (categories as any[]).map((cat) => ({
    ...(cat as any),
    citations: allCitations
      .filter((c) => c.categoryId === (cat as any).id)
      .sort((a, b) => a.refId.localeCompare(b.refId)),
  })) as CitationCategory[];
}

export async function getCitationCategory(id: string): Promise<CitationCategory | null> {
  const dbm = await getDb();
  const cat = await dbm
    .collection<CitationCategory>(CATEGORIES_COLLECTION)
    .findOne({ id }, { projection: { _id: 0 } } as any);
  if (!cat) return null;
  const citations = (await dbm
    .collection<Citation>(CITATIONS_COLLECTION)
    .find({ categoryId: id }, { projection: { _id: 0 } } as any)
    .toArray()) as Citation[];
  return { ...(cat as any), citations } as CitationCategory;
}

export async function addCitationCategory(name: string): Promise<CitationCategory> {
  const id = slugify(name, { lower: true, strict: true });
  const dbm = await getDb();
  const exists = await dbm.collection(CATEGORIES_COLLECTION).findOne({ id });
  if (exists) {
    throw new Error('A citation category with this name already exists.');
  }
  const newCategory: CitationCategory = { id, name, genreId: 'shastra', citations: [] } as any;
  await dbm.collection(CATEGORIES_COLLECTION).insertOne({ id, name, genreId: 'shastra' } as any);
  return newCategory as CitationCategory;
}

export async function updateCitationCategory(id: string, newName: string): Promise<CitationCategory> {
  if (id === 'uncategorized' || id === 'user-saved-notes') {
    throw new Error('Default collections cannot be renamed.');
  }
  const dbm = await getDb();
  await dbm.collection(CATEGORIES_COLLECTION).updateOne({ id }, { $set: { name: newName } });
  const cat = await dbm.collection<CitationCategory>(CATEGORIES_COLLECTION).findOne({ id });
  return { ...(cat as any), name: newName } as CitationCategory;
}

export async function deleteCitationCategory(id: string): Promise<void> {
  if (id === 'uncategorized' || id === 'user-saved-notes') {
    throw new Error('Cannot delete default collections.');
  }
  const dbm = await getDb();
  await dbm.collection(CITATIONS_COLLECTION).updateMany({ categoryId: id }, { $set: { categoryId: 'uncategorized' } });
  await dbm.collection(CATEGORIES_COLLECTION).deleteOne({ id });
}

export async function getCitationByRefId(refId: string): Promise<Citation | null> {
  const dbm = await getDb();
  const docId = slugify(refId, { lower: true, strict: true }) || refId;
  let cit = await dbm.collection<Citation>(CITATIONS_COLLECTION).findOne({ id: docId });
  if (cit) return cit as Citation;
  cit = await dbm.collection<Citation>(CITATIONS_COLLECTION).findOne({ refId });
  return (cit as Citation) || null;
}

function areKeywordsEqual(keywords1: string[], keywords2: string[]): boolean {
  if (keywords1.length !== keywords2.length) return false;
  const s1 = [...keywords1].sort();
  const s2 = [...keywords2].sort();
  return s1.every((v, i) => v === s2[i]);
}

export async function addCitation(categoryId: string, citationData: Omit<Citation, 'id'>): Promise<Citation> {
  const dbm = await getDb();
  const snapshot = await dbm.collection<Citation>(CITATIONS_COLLECTION).find({ refId: citationData.refId }).toArray();
  const existingSameKeywords = snapshot.find((doc: any) => areKeywordsEqual(doc.keywords || [], citationData.keywords || []));
  if (existingSameKeywords) throw new Error('A citation with this Ref ID and the exact same keywords already exists.');

  const newDocId = globalThis.crypto?.randomUUID ? globalThis.crypto.randomUUID() : (Math.random().toString(36).slice(2) + Date.now());
  const newCitation = { ...citationData, categoryId, id: newDocId } as any;
  await dbm.collection(CITATIONS_COLLECTION).insertOne(newCitation);
  return newCitation as Citation;
}

export async function updateCitation(
  categoryId: string,
  originalRefId: string,
  citationData: Partial<Omit<Citation, 'id' | 'refId'>> & { refId: string }
): Promise<Citation> {
  const dbm = await getDb();
  const docToUpdate: any = await dbm.collection<Citation>(CITATIONS_COLLECTION).findOne({ refId: originalRefId });
  if (!docToUpdate) throw new Error('Citation to update not found.');

  if (citationData.refId !== originalRefId) {
    const conflictCheck = await getCitationByRefId(citationData.refId);
    if (conflictCheck) throw new Error('A citation with the new Ref ID already exists.');
    const newDocId = globalThis.crypto?.randomUUID ? globalThis.crypto.randomUUID() : (Math.random().toString(36).slice(2) + Date.now());
    const updatedData = { ...docToUpdate, ...citationData, categoryId, id: newDocId } as any;
    await dbm.collection(CITATIONS_COLLECTION).deleteOne({ id: docToUpdate.id });
    await dbm.collection(CITATIONS_COLLECTION).insertOne(updatedData);
    return updatedData as Citation;
  } else {
    const updatedData: any = { ...citationData, categoryId };
    await dbm.collection(CITATIONS_COLLECTION).updateOne({ id: docToUpdate.id }, { $set: updatedData });
    return { ...docToUpdate, ...updatedData } as Citation;
  }
}

export async function deleteCitation(categoryId: string, refId: string): Promise<void> {
  const dbm = await getDb();
  const doc = await dbm.collection<Citation>(CITATIONS_COLLECTION).findOne({ refId });
  if (!doc) throw new Error('Citation to delete not found.');
  await dbm.collection(CITATIONS_COLLECTION).deleteOne({ id: (doc as any).id });
}

export async function bulkAddCitations(categoryId: string, citations: Omit<Citation, 'id'>[]): Promise<{ added: number, skipped: number }> {
  const dbm = await getDb();
  const existingDocs = await dbm
    .collection(CITATIONS_COLLECTION)
    .find({}, { projection: { refId: 1, _id: 0 } } as any)
    .toArray();
  const existingRefIds = new Set(existingDocs.map((d: any) => d.refId));

  const toInsert: any[] = [];
  let added = 0;
  let skipped = 0;
  for (const citation of citations) {
    if (existingRefIds.has(citation.refId)) {
      skipped++;
      continue;
    }
    const docId = slugify(citation.refId, { lower: true, strict: true }) || citation.refId;
    toInsert.push({ ...citation, categoryId, id: docId });
    existingRefIds.add(citation.refId);
    added++;
  }
  if (toInsert.length) await dbm.collection(CITATIONS_COLLECTION).insertMany(toInsert);
  return { added, skipped };
}

export async function searchCitations(query: string): Promise<Citation[]> {
  const dbm = await getDb();
  const allCitations = (await dbm.collection<Citation>(CITATIONS_COLLECTION).find({}).toArray()) as Citation[];
  if (!query) return allCitations;
  const lower = query.toLowerCase();
  const results: Citation[] = [];
  for (const c of allCitations) {
    if (
      (c.keywords || []).some((k) => k.toLowerCase().includes(lower)) ||
      (c.refId || '').toLowerCase().includes(lower) ||
      (c.sanskrit || '').toLowerCase().includes(lower)
    ) {
      results.push(c);
    }
  }
  return results.slice(0, 10);
}

export async function getAllCitationKeywords(): Promise<string[]> {
  const dbm = await getDb();
  const docs = await dbm
    .collection<Citation>(CITATIONS_COLLECTION)
    .find({}, { projection: { keywords: 1, _id: 0 } } as any)
    .toArray();
  const all = new Set<string>();
  for (const d of docs as any[]) (d.keywords || []).forEach((kw: string) => all.add(kw));
  return Array.from(all).sort();
}

