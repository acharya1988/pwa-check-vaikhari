import { NextResponse } from "next/server";
import { mongo } from "@/lib/mongo";
import LibraryItem from "@/models/LibraryItem";
import { getUserId } from "@/lib/api/user";
export async function GET(req) {
    await mongo();
    const userId = await getUserId(req);
    const items = await LibraryItem.find({ userId }).sort({ updatedAt: -1 }).lean();
    return NextResponse.json({ items });
}
