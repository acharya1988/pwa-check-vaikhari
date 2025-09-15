import { getApps, initializeApp, cert, App } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { readFileSync } from 'node:fs';
import path from 'node:path';

let app: App;

function initializeAdminApp() {
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
      return app;
    } catch (e) {
      console.error("[backend] FIREBASE_SERVICE_ACCOUNT_KEY_BASE64 parse failed.", e);
    }
  }

  if (process.env.FIREBASE_CREDENTIALS_FILE) {
    try {
      const p = process.env.FIREBASE_CREDENTIALS_FILE as string;
      const tryPaths = [p, path.resolve(process.cwd(), '..', p)];
      let jsonStr = '';
      let ok = false;
      for (const cand of tryPaths) {
        try { jsonStr = readFileSync(cand, 'utf8'); ok = true; break; } catch {}
      }
      if (!ok) throw new Error(`File not found at ${tryPaths.join(' or ')}`);
      const serviceAccount = JSON.parse(jsonStr);
      const projectId = serviceAccount.project_id;
      if (projectId) {
        if (!process.env.GOOGLE_CLOUD_PROJECT) process.env.GOOGLE_CLOUD_PROJECT = projectId;
        if (!process.env.GCLOUD_PROJECT) process.env.GCLOUD_PROJECT = projectId;
      }
      const app = initializeApp({ credential: cert(serviceAccount), projectId });
      return app;
    } catch (e) {
      console.error("[backend] FIREBASE_CREDENTIALS_FILE read failed.", e);
    }
  }

  if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    try {
      let raw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY as string;
      if ((raw.startsWith('"') && raw.endsWith('"')) || (raw.startsWith("'") && raw.endsWith("'"))) {
        raw = raw.slice(1, -1);
      }
      const serviceAccount = JSON.parse(raw);
      const projectId = serviceAccount.project_id;
      if (projectId) {
        if (!process.env.GOOGLE_CLOUD_PROJECT) process.env.GOOGLE_CLOUD_PROJECT = projectId;
        if (!process.env.GCLOUD_PROJECT) process.env.GCLOUD_PROJECT = projectId;
      }
      const app = initializeApp({ credential: cert(serviceAccount), projectId });
      return app;
    } catch (e) {
      console.error("[backend] FIREBASE_SERVICE_ACCOUNT_KEY parse failed.", e);
    }
  }

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
    return app;
  }

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

