import { adminAuth } from '../config/firebase-admin.js';
import { getDb } from '../config/db.js';
export function defaultNewUser(uid, patch = {}) {
    return {
        _id: uid,
        roles: ['user'],
        ...patch,
    };
}
const SESSION_COOKIE_NAME = 'session';
export async function verifyRequestAndGetUserExpress(req, requiredRole) {
    try {
        const cookieHeader = req.headers['cookie'] || '';
        const cookies = Object.fromEntries(cookieHeader.split(';').map(v => v.trim().split('=')));
        const sessionCookie = cookies[SESSION_COOKIE_NAME];
        const authz = req.headers['authorization'];
        let decoded = null;
        if (sessionCookie) {
            decoded = await adminAuth.verifySessionCookie(sessionCookie, true).catch(() => null);
        }
        if (!decoded && typeof authz === 'string' && authz.startsWith('Bearer ')) {
            const idToken = authz.slice('Bearer '.length).trim();
            decoded = await adminAuth.verifyIdToken(idToken, true).catch(() => null);
        }
        if (!decoded)
            return { ok: false, status: 401, error: 'UNAUTHENTICATED' };
        const db = await getDb();
        const users = db.collection('users');
        const uid = decoded.uid;
        const email = decoded.email || undefined;
        const phone = decoded.phone_number || undefined;
        const displayName = decoded.name || undefined;
        const photoURL = decoded.picture || undefined;
        const mfaEnrolled = Array.isArray(decoded?.firebase?.sign_in_second_factor)
            ? decoded.firebase.sign_in_second_factor.length > 0
            : !!decoded?.firebase?.second_factor_identifier;
        const existing = await users.findOne({ _id: uid });
        let user = existing;
        const now = new Date();
        if (!existing) {
            const newUser = defaultNewUser(uid, { email, phone, displayName, photoURL, mfaEnrolled, lastLoginAt: now });
            await users.insertOne(newUser);
            user = newUser;
        }
        else {
            await users.updateOne({ _id: uid }, { $set: { email, phone, displayName, photoURL, mfaEnrolled, lastLoginAt: now } });
            user = (await users.findOne({ _id: uid }));
        }
        if (!user)
            return { ok: false, status: 500, error: 'USER_UPSERT_FAILED' };
        const rootAdmins = (process.env.ROOT_ADMIN_EMAILS || '')
            .split(/[\s,]+/)
            .map((s) => s.trim().toLowerCase())
            .filter(Boolean);
        const isRootAdmin = !!(decoded.email && rootAdmins.includes(decoded.email.toLowerCase()));
        if (isRootAdmin && !user.roles.includes('superadmin')) {
            user = { ...user, roles: Array.from(new Set([...(user.roles || []), 'superadmin'])) };
        }
        if (requiredRole && !user.roles.includes(requiredRole)) {
            return { ok: false, status: 403, error: 'FORBIDDEN' };
        }
        return { ok: true, user };
    }
    catch (e) {
        return { ok: false, status: 500, error: 'AUTH_ERROR' };
    }
}
