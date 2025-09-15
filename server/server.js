import "dotenv/config";
import http from "node:http";
import { URL } from "node:url";
import { setCors, json, readBody } from "./lib/http.js";
import { Router } from "./router.js";
import { getFirebaseAuth } from "./lib/firebaseAdmin.js";
import { serializeCookie } from "./lib/cookies.js";
import { verifyAndGetUser, SESSION } from "./lib/auth.js";
import { registerMigratedEndpoints, dynamicRoutes } from "./migrated/register.js";

const PORT = Number(process.env.PORT || 4000);
const ORIGIN = process.env.CORS_ORIGIN || "http://localhost:5173";
const isProd = process.env.NODE_ENV === "production";
const maxDays = Number(process.env.SESSION_COOKIE_MAX_DAYS || "14");
const expiresIn = maxDays * 24 * 60 * 60 * 1000;

const router = new Router();

// --- Auth session endpoints (parity with src/app/api/session/route.ts) ---
router.on("POST", "/api/session", async (req, res) => {
  try {
    const { idToken } = await readBody(req);
    if (!idToken) return json(res, 400, { error: "Missing idToken" });
    const adminAuth = getFirebaseAuth();
    const decoded = await adminAuth.verifyIdToken(idToken, true);
    const cookie = await adminAuth.createSessionCookie(idToken, { expiresIn });
    res.setHeader(
      "Set-Cookie",
      serializeCookie(SESSION.name, cookie, {
        httpOnly: true,
        secure: isProd,
        sameSite: "Lax",
        path: "/",
        maxAge: expiresIn,
      })
    );
    return json(res, 200, { ok: true, uid: decoded.uid });
  } catch (e) {
    console.error("[api/session] error", e?.errorInfo || e);
    return json(res, 401, { error: e?.message || "session-error" });
  }
});

router.on("DELETE", "/api/session", async (_req, res) => {
  res.setHeader(
    "Set-Cookie",
    serializeCookie(SESSION.name, "", {
      httpOnly: true,
      secure: isProd,
      sameSite: "Lax",
      path: "/",
      expires: new Date(0),
    })
  );
  return json(res, 200, { ok: true });
});

// Common utility endpoints already present in repo
router.on("GET", "/api/me", async (req, res) => {
  const user = await verifyAndGetUser(req);
  if (!user) return json(res, 401, { error: "UNAUTHENTICATED" });
  return json(res, 200, { user });
});

router.on("GET", "/healthz", async (_req, res) => json(res, 200, { ok: true }));

// Register migrated endpoints
registerMigratedEndpoints(router);

function setCommonHeaders(res, req) {
  setCors(res, req, ORIGIN);
}

const server = http.createServer(async (req, res) => {
  // Attach request reference for helpers (e.g., optional compression)
  // This is safe and only used when an env flag enables compression.
  // overflow-guard: non-visual server tweak
  // @ts-ignore
  res._req = req;
  setCommonHeaders(res, req);
  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    return res.end();
  }
  const url = new URL(req.url, `http://${req.headers.host}`);
  const handler = router.match(req.method, url.pathname);
  if (handler) {
    try {
      await handler(req, res, url);
    } catch (e) {
      console.error(e);
      json(res, 500, { error: "INTERNAL_ERROR" });
    }
    return;
  }

  // Dynamic routes
  for (const r of dynamicRoutes) {
    if (r.method === req.method && r.pattern.test(url.pathname)) {
      try {
        await r.handler(req, res, url);
      } catch (e) {
        console.error(e);
        json(res, 500, { error: "INTERNAL_ERROR" });
      }
      return;
    }
  }

  json(res, 404, { error: "Not Found" });
});

server.listen(PORT, () => {
  console.log(`Node core API listening on http://localhost:${PORT}`);
});
