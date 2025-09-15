import { NextResponse } from "next/server";
import { mongo } from "@/lib/mongo";
import Layer from "@/models/Layer";
import { getUserId } from "@/lib/api/user";
export async function GET(req) {
    await mongo();
    const userId = await getUserId(req);
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q") || "";
    const type = searchParams.get("type") || undefined;
    const filter = { userId };
    if (type)
        filter.type = type;
    if (q)
        filter.$or = [
            { title: { $regex: q, $options: "i" } },
            { text: { $regex: q, $options: "i" } },
            { sourceTitle: { $regex: q, $options: "i" } },
        ];
    const items = await Layer.find(filter).sort({ updatedAt: -1 }).lean();
    return NextResponse.json({ items });
}
export async function POST(req) {
    await mongo();
    const userId = await getUserId(req);
    const body = await req.json();
    const item = await Layer.create({ ...body, userId });
    return NextResponse.json({ item });
}
