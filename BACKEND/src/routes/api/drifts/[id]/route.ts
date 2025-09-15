import { NextRequest, NextResponse } from "next/server";
import { mongo } from "@/lib/mongo";
import Drift from "@/models/Drift";
import { getUserId } from "@/lib/api/user";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  await mongo();
  const item = await Drift.findById(params.id).lean();
  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ item });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  await mongo();
  await getUserId(req); // ensure auth path; currently unused
  const patch = await req.json();
  const item = await Drift.findByIdAndUpdate(params.id, patch, { new: true }).lean();
  return NextResponse.json({ item });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  await mongo();
  await getUserId(req);
  await Drift.findByIdAndDelete(params.id);
  return NextResponse.json({ ok: true });
}

