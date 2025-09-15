import { NextResponse } from "next/server";
import { verifyRequestAndGetUser } from "@/lib/auth";

export const runtime = 'nodejs';

export async function GET() {
  const res = await verifyRequestAndGetUser();
  if (!res.ok) return NextResponse.json({ error: res.error }, { status: res.status });
  return NextResponse.json({ user: res.user });
}

