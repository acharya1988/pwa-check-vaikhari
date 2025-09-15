import { NextResponse } from "next/server";
import { mongo } from "@/lib/mongo";
import LibraryItem from "@/models/LibraryItem";
import { getUserId } from "@/lib/api/user";
export async function POST(req) {
    await mongo();
    const userId = await getUserId(req);
    const { refId, refType, title, author, coverUrl, meta } = await req.json();
    await LibraryItem.updateOne({ userId, refId }, { $set: { userId, refId, refType, title, author, coverUrl, meta } }, { upsert: true });
    const item = await LibraryItem.findOne({ userId, refId }).lean();
    return NextResponse.json({ item });
}
