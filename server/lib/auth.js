import { getFirebaseAuth } from "./firebaseAdmin.js";
import { getDb } from "./mongo.js";

const SESSION_COOKIE_NAME = "session"; // Keep identical to existing Next API

export async function verifyAndGetUser(req) {
  const cookies = Object.fromEntries(
    (req.headers.cookie || "")
      .split(";")
      .map((s) => s.trim())
      .filter(Boolean)
      .map((kv) => {
        const i = kv.indexOf("=");
        return i >= 0
          ? [decodeURIComponent(kv.slice(0, i)), decodeURIComponent(kv.slice(i + 1))]
          : [kv, ""];
      })
  );
  const bearer = req.headers.authorization?.startsWith("Bearer ")
    ? req.headers.authorization.slice(7).trim()
    : null;

  const auth = getFirebaseAuth();
  let decoded = null;
  try {
    if (cookies[SESSION_COOKIE_NAME]) decoded = await auth.verifySessionCookie(cookies[SESSION_COOKIE_NAME], true);
    if (!decoded && bearer) decoded = await auth.verifyIdToken(bearer, true);
  } catch {
    decoded = null;
  }
  if (!decoded) return null;

  // upsert user in Mongo
  const db = await getDb();
  const Users = db.collection("users");
  const uid = decoded.uid;
  const now = new Date();
  const doc = {
    email: decoded.email || undefined,
    phone: decoded.phone_number || undefined,
    displayName: decoded.name || undefined,
    photoURL: decoded.picture || undefined,
    mfaEnrolled: Array.isArray(decoded?.firebase?.sign_in_second_factor)
      ? decoded.firebase.sign_in_second_factor.length > 0
      : !!decoded?.firebase?.second_factor_identifier,
    lastLoginAt: now,
  };
  const exist = await Users.findOne({ _id: uid });
  if (!exist) {
    const user = { _id: uid, roles: ["user"], status: "active", createdAt: now, ...doc };
    await Users.insertOne(user);
    return applyRootAdminElevate(user);
  } else {
    await Users.updateOne({ _id: uid }, { $set: doc });
    const fresh = await Users.findOne({ _id: uid });
    return applyRootAdminElevate(fresh);
  }
}

function applyRootAdminElevate(user) {
  const rootAdmins = (process.env.ROOT_ADMIN_EMAILS || "")
    .split(/[\s,]+/)
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  const isRootAdmin = !!(user?.email && rootAdmins.includes(user.email.toLowerCase()));
  if (isRootAdmin && !user.roles?.includes("superadmin")) {
    return { ...user, roles: Array.from(new Set([...(user.roles || []), "superadmin"])) };
  }
  return user;
}

export const SESSION = { name: SESSION_COOKIE_NAME };

