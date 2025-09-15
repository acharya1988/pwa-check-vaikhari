import LibraryItem from "../models/LibraryItem.js";
import { getDb } from "../config/db.js";

export async function listLibraryItems(userId: string) {
  return LibraryItem.find({ userId }).sort({ updatedAt: -1 }).lean();
}

export async function upsertCollect(userId: string, payload: any) {
  const { refId, refType, title, author, coverUrl, meta } = payload || {};
  await LibraryItem.updateOne(
    { userId, refId },
    { $set: { userId, refId, refType, title, author, coverUrl, meta } },
    { upsert: true }
  );
  return LibraryItem.findOne({ userId, refId }).lean();
}

export async function getLibraryItemOrFallback(refId: string) {
  const lib = await LibraryItem.findOne({ refId }).lean();
  if (lib) return lib;
  try {
    const db = await getDb();
    const catalog = await db.collection('books').findOne({ id: refId } as any);
    if (catalog) {
      return {
        refId: (catalog as any).id,
        refType: 'Book',
        title: (catalog as any).name,
        author: (catalog as any).authorName,
        coverUrl: (catalog as any).profileUrl,
        meta: { pages: (catalog as any).pages }
      };
    }
  } catch {}
  return null;
}

