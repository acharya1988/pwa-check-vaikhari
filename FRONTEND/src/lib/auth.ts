import { cookies, headers } from "next/headers";
import { adminAuth } from "@/lib/firebase/admin";
import { getDb } from "@/lib/mongo";
import { defaultNewUser, type AppUser, type AppRole } from "@/models/User";

const SESSION_COOKIE_NAME = "session"; // existing cookie name in this repo

export async function verifyRequestAndGetUser(requiredRole?: AppRole) {
  const h = await headers();
  const c = await cookies();

  // 1) Try cookie-based session (server-side)
  const sessionCookie = c.get(SESSION_COOKIE_NAME)?.value;

  // 2) Fallback: Authorization: Bearer <idToken>
  const authz = h.get("authorization");
  let decoded: import("firebase-admin/auth").DecodedIdToken | null = null;

  if (sessionCookie) {
    decoded = await adminAuth.verifySessionCookie(sessionCookie, true).catch(() => null);
  }
  if (!decoded && authz?.startsWith("Bearer ")) {
    const idToken = authz.slice("Bearer ".length).trim();
    decoded = await adminAuth.verifyIdToken(idToken, true).catch(() => null);
  }

  if (!decoded) {
    return { ok: false as const, status: 401, error: "UNAUTHENTICATED" };
  }

  // Upsert/lookup in Mongo
  const db = await getDb();
  const users = db.collection<AppUser>("users");
  const uid = decoded.uid;

  const email = decoded.email || undefined;
  const phone = (decoded as any).phone_number || undefined;
  const displayName = (decoded.name as string | undefined) || undefined;
  const photoURL = decoded.picture || undefined;
  const mfaEnrolled = Array.isArray((decoded as any)?.firebase?.sign_in_second_factor)
    ? (decoded as any).firebase.sign_in_second_factor.length > 0
    : !!(decoded as any)?.firebase?.second_factor_identifier;

  const existing = await users.findOne({ _id: uid });
  let user = existing;
  const now = new Date();

  if (!existing) {
    const newUser = defaultNewUser(uid, {
      email, phone, displayName, photoURL, mfaEnrolled, lastLoginAt: now,
    });
    await users.insertOne(newUser);
    user = newUser;
  } else {
    await users.updateOne(
      { _id: uid },
      { $set: { email, phone, displayName, photoURL, mfaEnrolled, lastLoginAt: now } }
    );
    user = await users.findOne({ _id: uid });
  }

  if (!user) {
    return { ok: false as const, status: 500, error: "USER_UPSERT_FAILED" };
  }

  // Elevate role dynamically for root admins configured via env (bootstrap convenience)
  const rootAdmins = (process.env.ROOT_ADMIN_EMAILS || "")
    .split(/[,\s]+/)
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  const isRootAdmin = !!(decoded.email && rootAdmins.includes(decoded.email.toLowerCase()));
  if (isRootAdmin && !user.roles.includes("superadmin")) {
    // do not persist silently; enforce at request-time only
    user = { ...user, roles: Array.from(new Set([...(user.roles || []), "superadmin"])) } as AppUser;
  }

  if (requiredRole && !user.roles.includes(requiredRole)) {
    return { ok: false as const, status: 403, error: "FORBIDDEN" };
  }

  return { ok: true as const, user };
}
