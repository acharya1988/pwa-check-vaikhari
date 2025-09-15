import LibraryItem from "../models/LibraryItem.js";
import { getDb } from "../config/db.js";
export async function listLibraryItems(userId) {
    return LibraryItem.find({ userId }).sort({ updatedAt: -1 }).lean();
}
export async function upsertCollect(userId, payload) {
    const { refId, refType, title, author, coverUrl, meta } = payload || {};
    await LibraryItem.updateOne({ userId, refId }, { $set: { userId, refId, refType, title, author, coverUrl, meta } }, { upsert: true });
    return LibraryItem.findOne({ userId, refId }).lean();
}
export async function getLibraryItemOrFallback(refId) {
    const lib = await LibraryItem.findOne({ refId }).lean();
    if (lib)
        return lib;
    try {
        const db = await getDb();
        const catalog = await db.collection('books').findOne({ id: refId });
        if (catalog) {
            return {
                refId: catalog.id,
                refType: 'Book',
                title: catalog.name,
                author: catalog.authorName,
                coverUrl: catalog.profileUrl,
                meta: { pages: catalog.pages }
            };
        }
    }
    catch { }
    return null;
}
