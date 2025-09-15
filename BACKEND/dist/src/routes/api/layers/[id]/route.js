import { NextResponse } from "next/server";
import { mongo } from "@/lib/mongo";
import Layer from "@/models/Layer";
export async function GET(_req, { params }) {
    await mongo();
    const item = await Layer.findById(params.id).lean();
    if (!item)
        return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ item });
}
export async function PATCH(req, { params }) {
    await mongo();
    const patch = await req.json();
    const item = await Layer.findByIdAndUpdate(params.id, patch, { new: true }).lean();
    return NextResponse.json({ item });
}
export async function DELETE(_req, { params }) {
    await mongo();
    await Layer.findByIdAndDelete(params.id);
    return NextResponse.json({ ok: true });
}
