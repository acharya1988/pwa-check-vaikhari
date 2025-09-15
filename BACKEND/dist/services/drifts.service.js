import DriftModel from "../models/Drift.js";
import { getDb } from "../config/db.js";
export async function listDrifts(userId, q, status) {
    const filter = { userId };
    if (status)
        filter.status = status;
    if (q)
        filter.$text = { $search: q };
    let items = await DriftModel.find(filter).sort({ updatedAt: -1 }).lean();
    if (!items || items.length === 0) {
        const db = await getDb();
        const layers = await db
            .collection('layers')
            .find({ userId })
            .sort({ timestamp: -1 })
            .limit(50)
            .toArray();
        items = (layers || []).map((l) => ({
            _id: l._id,
            userId,
            title: l.articleTitle || l.title || 'Layer',
            sourceType: 'Book',
            sourceId: l.bookId,
            sourceTitle: l.bookName || l.chapterName,
            sourceAuthor: l.ownerId || undefined,
            sourceRef: String(l.verse ?? ''),
            sourceAnchor: l.verse ? `verse-${l.verse}` : l.blockId,
            excerpt: String(l.blockSanskrit || '').replace(/<[^>]*>/g, ''),
            content: l.content || '',
            tags: [],
            status: 'draft',
            createdAt: l.timestamp ? new Date(l.timestamp) : undefined,
            updatedAt: l.timestamp ? new Date(l.timestamp) : undefined,
        }));
    }
    return items;
}
export async function createDrift(userId, body) {
    return DriftModel.create({ ...body, userId });
}
export async function getDrift(id) {
    return DriftModel.findById(id).lean();
}
export async function updateDrift(id, patch) {
    return DriftModel.findByIdAndUpdate(id, patch, { new: true }).lean();
}
export async function deleteDrift(id) {
    await DriftModel.findByIdAndDelete(id);
}
