import { NextResponse } from "next/server";
import { mongo, getDb } from "@/lib/mongo";
import Drift from "@/models/Drift";
import { getUserId } from "@/lib/api/user";
export async function GET(req) {
    await mongo();
    const userId = await getUserId(req);
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q") || "";
    const status = searchParams.get("status") || undefined;
    const filter = { userId };
    if (status)
        filter.status = status;
    if (q)
        filter.$text = { $search: q };
    let items = await Drift.find(filter).sort({ updatedAt: -1 }).lean();
    // Fallback: if no drifts exist yet, surface legacy layers as drifts (read-only view)
    if (!items || items.length === 0) {
        const db = await getDb();
        const layers = await db
            .collection("layers")
            .find({ userId })
            .sort({ timestamp: -1 })
            .limit(50)
            .toArray();
        items = (layers || []).map((l) => ({
            _id: l._id,
            userId,
            title: l.articleTitle || l.title || "Layer",
            sourceType: "Book",
            sourceId: l.bookId,
            sourceTitle: l.bookName || l.chapterName,
            sourceAuthor: l.ownerId || undefined,
            sourceRef: String(l.verse ?? ""),
            sourceAnchor: l.verse ? `verse-${l.verse}` : l.blockId,
            excerpt: String(l.blockSanskrit || "").replace(/<[^>]*>/g, ""),
            content: l.content || "",
            tags: [],
            status: "draft",
            createdAt: l.timestamp ? new Date(l.timestamp) : undefined,
            updatedAt: l.timestamp ? new Date(l.timestamp) : undefined,
        }));
    }
    return NextResponse.json({ items });
}
export async function POST(req) {
    await mongo();
    const userId = await getUserId(req);
    const body = await req.json();
    const doc = await Drift.create({ ...body, userId });
    return NextResponse.json({ item: doc });
}
