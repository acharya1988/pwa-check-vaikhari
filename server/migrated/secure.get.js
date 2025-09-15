import { json } from "../lib/http.js";
import { verifyAndGetUser } from "../lib/auth.js";

export default async function handler(req, res, url) {
  const role = (url.searchParams.get("role") || "admin");
  const user = await verifyAndGetUser(req);
  if (!user) return json(res, 401, { error: "UNAUTHENTICATED" });
  if (role && !user.roles?.includes(role)) return json(res, 403, { error: "FORBIDDEN" });
  return json(res, 200, { ok: true, roleRequired: role, user: user._id });
}

