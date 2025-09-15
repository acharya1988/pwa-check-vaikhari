import { NextResponse } from "next/server";
import { verifyRequestAndGetUser } from "@/lib/auth";
export const runtime = 'nodejs';
export async function GET(req) {
    const url = new URL(req.url);
    const role = (url.searchParams.get("role") || "admin");
    const res = await verifyRequestAndGetUser(role);
    if (!res.ok)
        return NextResponse.json({ error: res.error }, { status: res.status });
    return NextResponse.json({ ok: true, roleRequired: role, user: res.user._id });
}
