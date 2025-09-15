import { NextResponse } from "next/server";
export const runtime = 'nodejs';
import { adminAuth } from "@/lib/firebase/admin";
export async function POST(req) {
    try {
        const { idToken } = await req.json();
        if (!idToken)
            return NextResponse.json({ error: "Missing idToken" }, { status: 400 });
        // Pre-verify for clearer error when credentials/project mismatch
        const decoded = await adminAuth.verifyIdToken(idToken, true);
        const expiresIn = 14 * 24 * 60 * 60 * 1000;
        const session = await adminAuth.createSessionCookie(idToken, { expiresIn });
        const res = NextResponse.json({ ok: true, uid: decoded.uid });
        res.cookies.set("session", session, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: "lax",
            path: "/",
            maxAge: expiresIn / 1000,
        });
        return res;
    }
    catch (e) {
        console.error('[api/session] error', e?.errorInfo || e);
        return NextResponse.json({ error: e?.message || 'session-error' }, { status: 401 });
    }
}
export async function DELETE() {
    const res = NextResponse.json({ ok: true });
    res.cookies.set("session", "", {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: "lax",
        path: "/",
        expires: new Date(0),
    });
    return res;
}
