import type { Request } from 'express';
import { adminAuth } from '../config/firebase-admin.js';
import { getDb } from '../config/db.js';

export type AppRole = 'user' | 'admin' | 'superadmin';

export interface AppUser {
  _id: string; // uid
  email?: string;
  phone?: string;
  displayName?: string;
  photoURL?: string;
  mfaEnrolled?: boolean;
  roles: AppRole[];
  lastLoginAt?: Date;
}

export function defaultNewUser(uid: string, patch: Partial<AppUser> = {}): AppUser {
  return {
    _id: uid,
    roles: ['user'],
    ...patch,
  } as AppUser;
}

const SESSION_COOKIE_NAME = 'session';

export async function verifyRequestAndGetUserExpress(req: Request, requiredRole?: AppRole) {
  try {
    const cookieHeader = req.headers['cookie'] || '';
    const cookies = Object.fromEntries(cookieHeader.split(';').map(v => v.trim().split('=')) as any);
    const sessionCookie = cookies[SESSION_COOKIE_NAME];

    const authz = req.headers['authorization'];
    let decoded: import('firebase-admin/auth').DecodedIdToken | null = null;
    if (sessionCookie) {
      decoded = await adminAuth.verifySessionCookie(sessionCookie, true).catch(() => null);
    }
    if (!decoded && typeof authz === 'string' && authz.startsWith('Bearer ')) {
      const idToken = authz.slice('Bearer '.length).trim();
      decoded = await adminAuth.verifyIdToken(idToken, true).catch(() => null);
    }
    if (!decoded) return { ok: false as const, status: 401, error: 'UNAUTHENTICATED' };

    const db = await getDb();
    const users = db.collection<AppUser>('users');
    const uid = decoded.uid;
    const email = decoded.email || undefined;
    const phone = (decoded as any).phone_number || undefined;
    const displayName = (decoded.name as string | undefined) || undefined;
    const photoURL = decoded.picture || undefined;
    const mfaEnrolled = Array.isArray((decoded as any)?.firebase?.sign_in_second_factor)
      ? (decoded as any).firebase.sign_in_second_factor.length > 0
      : !!(decoded as any)?.firebase?.second_factor_identifier;

    const existing = await users.findOne({ _id: uid });
    let user = existing as AppUser | null;
    const now = new Date();
    if (!existing) {
      const newUser = defaultNewUser(uid, { email, phone, displayName, photoURL, mfaEnrolled, lastLoginAt: now });
      await users.insertOne(newUser as any);
      user = newUser;
    } else {
      await users.updateOne({ _id: uid }, { $set: { email, phone, displayName, photoURL, mfaEnrolled, lastLoginAt: now } });
      user = (await users.findOne({ _id: uid })) as any;
    }

    if (!user) return { ok: false as const, status: 500, error: 'USER_UPSERT_FAILED' };

    const rootAdmins = (process.env.ROOT_ADMIN_EMAILS || '')
      .split(/[\s,]+/)
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);
    const isRootAdmin = !!(decoded.email && rootAdmins.includes(decoded.email.toLowerCase()));
    if (isRootAdmin && !user.roles.includes('superadmin')) {
      user = { ...user, roles: Array.from(new Set([...(user.roles || []), 'superadmin'])) } as AppUser;
    }

    if (requiredRole && !user.roles.includes(requiredRole)) {
      return { ok: false as const, status: 403, error: 'FORBIDDEN' };
    }

    return { ok: true as const, user };
  } catch (e) {
    return { ok: false as const, status: 500, error: 'AUTH_ERROR' };
  }
}
