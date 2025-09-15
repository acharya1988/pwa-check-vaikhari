import { getDb } from "../config/db.js";
export async function getOrCreateProfile(user) {
    const db = await getDb();
    const id = user.email || user._id;
    if (!id)
        throw new Error('NO_ID');
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
        return profile;
    }
    return existing;
}
