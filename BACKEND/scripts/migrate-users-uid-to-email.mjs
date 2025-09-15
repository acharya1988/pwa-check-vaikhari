#!/usr/bin/env node
// One-time migration: copy users/{uid} docs to users/{email}
// Usage:
//  node scripts/migrate-users-uid-to-email.mjs --apply --delete-old
// Requires Firebase Admin creds via FIREBASE_SERVICE_ACCOUNT_KEY (JSON) or explicit envs.

import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

function initAdmin() {
  if (getApps().length) return;
  const base64 = process.env.FIREBASE_SERVICE_ACCOUNT_KEY_BASE64;
  if (base64) {
    const jsonStr = Buffer.from(base64, 'base64').toString('utf8');
    const serviceAccount = JSON.parse(jsonStr);
    initializeApp({ credential: cert(serviceAccount), projectId: serviceAccount.project_id });
    return;
  }
  if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
    initializeApp({ credential: cert(serviceAccount), projectId: serviceAccount.project_id });
    return;
  }
  if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
    initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      }),
      projectId: process.env.FIREBASE_PROJECT_ID,
    });
    return;
  }
  throw new Error('Admin credentials missing. Set FIREBASE_SERVICE_ACCOUNT_KEY or FIREBASE_PROJECT_ID/CLIENT_EMAIL/PRIVATE_KEY');
}

function argsHas(flag) {
  return process.argv.includes(flag);
}

async function main() {
  const APPLY = argsHas('--apply');
  const DELETE_OLD = argsHas('--delete-old');

  initAdmin();
  const db = getFirestore();

  console.log(`[migrate] Scanning users collection...`);
  const snap = await db.collection('users').get();
  let considered = 0, migrated = 0, skipped = 0, deleted = 0;

  for (const doc of snap.docs) {
    considered++;
    const data = doc.data() || {};
    const email = data.email;
    if (!email) {
      console.log(`- skip: ${doc.id} has no email field`);
      skipped++;
      continue;
    }
    if (doc.id === email) {
      // already migrated
      skipped++;
      continue;
    }

    console.log(`- migrate: ${doc.id} -> ${email}`);
    if (APPLY) {
      await db.collection('users').doc(email).set({ ...data, uid: doc.id, migratedFromUid: true }, { merge: true });
      migrated++;
      if (DELETE_OLD) {
        await doc.ref.delete();
        deleted++;
      }
    }
  }

  console.log(`[migrate] considered=${considered} migrated=${migrated} skipped=${skipped} deleted=${deleted}`);
  if (!APPLY) {
    console.log('Dry run only. Re-run with --apply to write changes. Add --delete-old to remove old uid docs.');
  }
}

main().catch((e) => { console.error(e); process.exit(1); });

