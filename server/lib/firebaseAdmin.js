import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { readFileSync } from "node:fs";

export function getFirebaseAuth() {
  if (!getApps().length) {
    // 1) Preferred: full JSON service account in FIREBASE_SERVICE_ACCOUNT_KEY_BASE64
    const base64 = process.env.FIREBASE_SERVICE_ACCOUNT_KEY_BASE64;
    if (base64) {
      try {
        const jsonStr = Buffer.from(base64, "base64").toString("utf8");
        const serviceAccount = JSON.parse(jsonStr);
        const projectId = serviceAccount.project_id;
        if (projectId) {
          if (!process.env.GOOGLE_CLOUD_PROJECT) process.env.GOOGLE_CLOUD_PROJECT = projectId;
          if (!process.env.GCLOUD_PROJECT) process.env.GCLOUD_PROJECT = projectId;
        }
        initializeApp({ credential: cert(serviceAccount), projectId });
      } catch (e) {
        console.error("[firebase-admin] Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY_BASE64.", e);
      }
    }

    // 2) Credentials file path
    if (!getApps().length && process.env.FIREBASE_CREDENTIALS_FILE) {
      try {
        const path = process.env.FIREBASE_CREDENTIALS_FILE;
        const jsonStr = readFileSync(path, "utf8");
        const serviceAccount = JSON.parse(jsonStr);
        const projectId = serviceAccount.project_id;
        if (projectId) {
          if (!process.env.GOOGLE_CLOUD_PROJECT) process.env.GOOGLE_CLOUD_PROJECT = projectId;
          if (!process.env.GCLOUD_PROJECT) process.env.GCLOUD_PROJECT = projectId;
        }
        initializeApp({ credential: cert(serviceAccount), projectId });
      } catch (e) {
        console.error("[firebase-admin] Failed to read FIREBASE_CREDENTIALS_FILE.", e);
      }
    }

    // 3) Inline JSON string env
    if (!getApps().length && process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
      try {
        let raw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
        if ((raw.startsWith('"') && raw.endsWith('"')) || (raw.startsWith("'") && raw.endsWith("'"))) {
          raw = raw.slice(1, -1);
        }
        const serviceAccount = JSON.parse(raw);
        const projectId = serviceAccount.project_id;
        if (projectId) {
          if (!process.env.GOOGLE_CLOUD_PROJECT) process.env.GOOGLE_CLOUD_PROJECT = projectId;
          if (!process.env.GCLOUD_PROJECT) process.env.GCLOUD_PROJECT = projectId;
        }
        initializeApp({ credential: cert(serviceAccount), projectId });
      } catch (e) {
        console.error("[firebase-admin] Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY.", e);
      }
    }

    // 4) Explicit pieces
    const { FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY } = process.env;
    if (!getApps().length && FIREBASE_PROJECT_ID && FIREBASE_CLIENT_EMAIL && FIREBASE_PRIVATE_KEY) {
      if (!process.env.GOOGLE_CLOUD_PROJECT) process.env.GOOGLE_CLOUD_PROJECT = FIREBASE_PROJECT_ID;
      if (!process.env.GCLOUD_PROJECT) process.env.GCLOUD_PROJECT = FIREBASE_PROJECT_ID;
      initializeApp({
        credential: cert({
          projectId: FIREBASE_PROJECT_ID,
          clientEmail: FIREBASE_CLIENT_EMAIL,
          privateKey: FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
        }),
        projectId: FIREBASE_PROJECT_ID,
      });
    }

    if (!getApps().length) {
      console.warn("[firebase-admin] Initialized WITHOUT credentials. Set FIREBASE_* envs for verification.");
      initializeApp();
    }
  }
  return getAuth();
}
