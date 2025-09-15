import { json, readBody } from "../lib/http.js";
import { verifyAndGetUser } from "../lib/auth.js";
import { getDb } from "../lib/mongo.js";
import { getFirebaseAuth } from "../lib/firebaseAdmin.js";

const allowed = ["user", "editor", "moderator", "admin", "superadmin"];

export default async function handler(req, res) {
  const user = await verifyAndGetUser(req);
  if (!user) return json(res, 401, { error: "UNAUTHENTICATED" });
  if (!user.roles?.includes("superadmin")) return json(res, 403, { error: "FORBIDDEN" });

  const body = await readBody(req);
  let { uid, email, roles } = body || {};
  if (!roles || !Array.isArray(roles) || roles.length === 0) {
    return json(res, 400, { error: "roles required" });
  }
  roles = Array.from(new Set((roles || []).filter((r) => allowed.includes(r))));
  if (roles.length === 0) return json(res, 400, { error: "no valid roles" });

  try {
    if (!uid && email) {
      // Try Firebase first
      try {
        const auth = getFirebaseAuth();
        const rec = await auth.getUserByEmail(email);
        uid = rec.uid;
      } catch {
        // fallback: lookup in Mongo
        const db = await getDb();
        const existing = await db.collection("users").findOne({ email });
        uid = existing?._id;
      }
    }
    if (!uid) return json(res, 400, { error: "uid or valid email required" });

    const db = await getDb();
    const users = db.collection("users");
    await users.updateOne({ _id: uid }, { $set: { roles } }, { upsert: true });
    try {
      const auth = getFirebaseAuth();
      await auth.setCustomUserClaims(uid, { roles });
    } catch {}
    const updated = await users.findOne({ _id: uid });
    return json(res, 200, { ok: true, user: updated });
  } catch (e) {
    return json(res, 500, { error: e?.message || "role-update-failed" });
  }
}

