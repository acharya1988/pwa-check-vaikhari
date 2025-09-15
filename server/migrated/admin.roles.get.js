import { json } from "../lib/http.js";
import { verifyAndGetUser } from "../lib/auth.js";
import { getDb } from "../lib/mongo.js";

export default async function handler(req, res, url) {
  const user = await verifyAndGetUser(req);
  if (!user) return json(res, 401, { error: "UNAUTHENTICATED" });
  if (!user.roles?.includes("superadmin")) return json(res, 403, { error: "FORBIDDEN" });

  const db = await getDb();
  const users = db.collection("users");

  const uid = url.searchParams.get("uid");
  const email = url.searchParams.get("email");
  if (!uid && !email) return json(res, 400, { error: "uid or email required" });

  let out = null;
  if (uid) out = await users.findOne({ _id: uid });
  else if (email) out = await users.findOne({ email });
  return json(res, 200, { user: out });
}

