
import { getApps, initializeApp, cert, App } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { readFileSync } from 'node:fs';
import nodePath from 'node:path';

let app: App;

function initializeAdminApp() {
  // Preferred: full JSON service account in FIREBASE_SERVICE_ACCOUNT_KEY_BASE64
  const base64 = process.env.FIREBASE_SERVICE_ACCOUNT_KEY_BASE64;
  if (base64) {
    try {
      const jsonStr = Buffer.from(base64, 'base64').toString('utf8');
      const serviceAccount = JSON.parse(jsonStr);
      const projectId = serviceAccount.project_id;
      if (projectId) {
        if (!process.env.GOOGLE_CLOUD_PROJECT) process.env.GOOGLE_CLOUD_PROJECT = projectId;
        if (!process.env.GCLOUD_PROJECT) process.env.GCLOUD_PROJECT = projectId;
      }
      const app = initializeApp({ credential: cert(serviceAccount), projectId });
      console.info(`[firebase-admin] Initialized with BASE64 service account (projectId=${projectId}).`);
      return app;
    } catch (e) {
      console.error("Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY_BASE64.", e);
    }
  }

  // Try credentials file first if provided (less parsing pitfalls)
  if (process.env.FIREBASE_CREDENTIALS_FILE) {
    try {
      const p = process.env.FIREBASE_CREDENTIALS_FILE as string;
      const cwd = process.cwd().replace(/\\/g, '/');
      const alt = nodePath.resolve(process.cwd(), '..', p);
      // When running from FRONTEND, prefer repo-root file first to avoid ENOENT noise
      const tryPaths = /\/FRONTEND$/.test(cwd) ? [alt, p] : [p, alt];
      let jsonStr = '';
      let ok = false;
      for (const cand of tryPaths) {
        try { jsonStr = readFileSync(cand, 'utf8'); ok = true; break; } catch {}
      }
      if (!ok) throw new Error('FIREBASE_CREDENTIALS_FILE not found in expected locations');
      const serviceAccount = JSON.parse(jsonStr);
      const projectId = serviceAccount.project_id;
      if (projectId) {
        if (!process.env.GOOGLE_CLOUD_PROJECT) process.env.GOOGLE_CLOUD_PROJECT = projectId;
        if (!process.env.GCLOUD_PROJECT) process.env.GCLOUD_PROJECT = projectId;
      }
      const app = initializeApp({ credential: cert(serviceAccount), projectId });
      console.info(`[firebase-admin] Initialized with credentials file (projectId=${projectId}).`);
      return app;
    } catch (_e) {
      // In dev, credentials may be intentionally missing; continue quietly
      // console.info('[firebase-admin] No credentials file found; continuing without credentials');
    }
  }

  // Fallback: inline JSON string env
  if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    try {
      let raw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY as string;
      // If accidentally wrapped in quotes by .env formatting, strip them
      if ((raw.startsWith('"') && raw.endsWith('"')) || (raw.startsWith("'") && raw.endsWith("'"))) {
        raw = raw.slice(1, -1);
      }
      const serviceAccount = JSON.parse(raw);
      // Ensure Project Id is visible to other Google libs
      const projectId = serviceAccount.project_id;
      if (projectId) {
        if (!process.env.GOOGLE_CLOUD_PROJECT) process.env.GOOGLE_CLOUD_PROJECT = projectId;
        if (!process.env.GCLOUD_PROJECT) process.env.GCLOUD_PROJECT = projectId;
      }
      const app = initializeApp({
        credential: cert(serviceAccount),
        projectId,
      });
      console.info(`[firebase-admin] Initialized with service account JSON (projectId=${projectId}).`);
      return app;
    } catch (e) {
      console.error("Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY. Make sure it's a valid JSON string.", e);
      // Fall through to explicit envs or default
    }
  }

  // Fallback: explicit env pieces
  if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
    const projectId = process.env.FIREBASE_PROJECT_ID;
    if (!process.env.GOOGLE_CLOUD_PROJECT) process.env.GOOGLE_CLOUD_PROJECT = projectId!;
    if (!process.env.GCLOUD_PROJECT) process.env.GCLOUD_PROJECT = projectId!;
    const app = initializeApp({
      credential: cert({
        projectId,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY!.replace(/\\n/g, "\n"),
      }),
      projectId,
    });
    console.info(`[firebase-admin] Initialized with explicit env credentials (projectId=${projectId}).`);
    return app;
  }

  // Last resort: help downstream libs by setting project id from public config if available
  if (!process.env.GOOGLE_CLOUD_PROJECT && process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) {
    process.env.GOOGLE_CLOUD_PROJECT = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    process.env.GCLOUD_PROJECT = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  }

  console.info("[firebase-admin] Initialized WITHOUT credentials. Set FIREBASE_SERVICE_ACCOUNT_KEY or FIREBASE_PROJECT_ID/FIREBASE_CLIENT_EMAIL/FIREBASE_PRIVATE_KEY if needed.");
  const app = initializeApp();
  return app;
}

if (!getApps().length) {
  app = initializeAdminApp();
} else {
  app = getApps()[0]!;
}

export const adminAuth = getAuth(app);
export const adminApp = app;
