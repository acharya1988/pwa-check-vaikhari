import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongo";
import { adminAuth } from "@/lib/firebase/admin";
import { verifyRequestAndGetUser } from "@/lib/auth";
export const runtime = 'nodejs';
const allowed = ["user", "editor", "moderator", "admin", "superadmin"];
export async function POST(req) {
    const authz = await verifyRequestAndGetUser("superadmin");
    if (!authz.ok)
        return NextResponse.json({ error: authz.error }, { status: authz.status });
    const body = await req.json().catch(() => ({}));
    let { uid, email, roles } = body;
    if (!roles || !Array.isArray(roles) || roles.length === 0) {
        return NextResponse.json({ error: "roles required" }, { status: 400 });
    }
    roles = Array.from(new Set(roles.filter((r) => allowed.includes(r))));
    if (roles.length === 0)
        return NextResponse.json({ error: "no valid roles" }, { status: 400 });
    try {
        // Resolve uid if missing
        if (!uid) {
            if (email) {
                try {
                    const rec = await adminAuth.getUserByEmail(email);
                    uid = rec.uid;
                }
                catch {
                    // try lookup in Mongo by email
                    const db = await getDb();
                    const existing = await db.collection("users").findOne({ email });
                    uid = existing?._id;
                }
            }
        }
        if (!uid)
            return NextResponse.json({ error: "uid or valid email required" }, { status: 400 });
        const db = await getDb();
        const users = db.collection("users");
        // Upsert roles in Mongo
        await users.updateOne({ _id: uid }, { $set: { roles } }, { upsert: true });
        // Optional: mirror to Firebase custom claims for client checks
        try {
            await adminAuth.setCustomUserClaims(uid, { roles });
        }
        catch { }
        const user = await users.findOne({ _id: uid });
        return NextResponse.json({ ok: true, user });
    }
    catch (e) {
        return NextResponse.json({ error: e?.message || "role-update-failed" }, { status: 500 });
    }
}
export async function GET(req) {
    const authz = await verifyRequestAndGetUser("superadmin");
    if (!authz.ok)
        return NextResponse.json({ error: authz.error }, { status: authz.status });
    const url = new URL(req.url);
    const uid = url.searchParams.get("uid");
    const email = url.searchParams.get("email");
    if (!uid && !email)
        return NextResponse.json({ error: "uid or email required" }, { status: 400 });
    const db = await getDb();
    const users = db.collection("users");
    let user = null;
    if (uid)
        user = await users.findOne({ _id: uid });
    else if (email)
        user = await users.findOne({ email: email });
    return NextResponse.json({ user });
}
