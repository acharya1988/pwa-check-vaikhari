import { NextResponse } from "next/server";
import { verifyRequestAndGetUser } from "@/lib/auth";
import { getDb } from "@/lib/mongo";
export const runtime = 'nodejs';
export async function GET() {
    const res = await verifyRequestAndGetUser();
    if (!res.ok)
        return NextResponse.json({ error: res.error }, { status: res.status });
    const { user } = res;
    const db = await getDb();
    const id = user.email || user._id;
    if (!id)
        return NextResponse.json({ error: 'NO_ID' }, { status: 400 });
    const profiles = db.collection('user_profiles');
    const existing = await profiles.findOne({ id });
    if (!existing) {
        const profile = {
            id,
            name: user.displayName || 'New User',
            email: user.email || null,
            avatarUrl: user.photoURL || '/media/default-avatar.png',
            coverUrl: '/media/default-cover.png',
            coverPosition: '50% 50%',
            bio: '',
            verificationStatus: 'unverified',
            mfaEnrolled: !!user.mfaEnrolled,
            onboardingCompleted: false,
            stats: { views: 0, messages: 0, circles: 0, rating: 0, bookCount: 0, articlesPublished: 0, whitepapersPublished: 0 },
            createdAt: Date.now(),
            updatedAt: Date.now(),
        };
        await profiles.insertOne(profile);
        return NextResponse.json({ profile });
    }
    return NextResponse.json({ profile: existing });
}
