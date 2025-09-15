import { adminAuth } from '../config/firebase-admin.js';
export async function createSession(idToken) {
    const decoded = await adminAuth.verifyIdToken(idToken, true);
    const expiresIn = 14 * 24 * 60 * 60 * 1000;
    const session = await adminAuth.createSessionCookie(idToken, { expiresIn });
    return { session, uid: decoded.uid, expiresIn };
}
