#!/usr/bin/env node
/*
  Migrate Firestore users => MongoDB
  - Copies users collection
  - Copies subcollections: users/{id}/bookmarks => user_bookmarks
                           users/{id}/notifications => user_notifications

  Env required:
    MONGODB_URI=mongodb://localhost:27017
    MONGODB_DB=vaikhari

  Firebase Admin credentials via one of:
    FIREBASE_SERVICE_ACCOUNT_KEY_BASE64 (preferred)
    FIREBASE_CREDENTIALS_FILE
    FIREBASE_SERVICE_ACCOUNT_KEY (inline JSON)
    or FIREBASE_PROJECT_ID + FIREBASE_CLIENT_EMAIL + FIREBASE_PRIVATE_KEY
*/

import { MongoClient } from 'mongodb';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';

function initAdmin() {
  if (getApps().length) return;
  const base64 = process.env.FIREBASE_SERVICE_ACCOUNT_KEY_BASE64;
  if (base64) {
    const jsonStr = Buffer.from(base64, 'base64').toString('utf8');
    const serviceAccount = JSON.parse(jsonStr);
    initializeApp({ credential: cert(serviceAccount), projectId: serviceAccount.project_id });
    return;
  }
  if (process.env.FIREBASE_CREDENTIALS_FILE) {
    const fs = await import('node:fs/promises');
    const p = process.env.FIREBASE_CREDENTIALS_FILE;
    const jsonStr = await fs.readFile(p, 'utf8');
    const serviceAccount = JSON.parse(jsonStr);
    initializeApp({ credential: cert(serviceAccount), projectId: serviceAccount.project_id });
    return;
  }
  if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    let raw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    if ((raw.startsWith('"') && raw.endsWith('"')) || (raw.startsWith("'") && raw.endsWith("'"))) raw = raw.slice(1, -1);
    const serviceAccount = JSON.parse(raw);
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
  console.error('Missing Firebase Admin credentials.');
  process.exit(1);
}

function tsToDate(v) {
  if (!v) return undefined;
  if (v instanceof Date) return v;
  if (v instanceof Timestamp) return v.toDate();
  if (typeof v === 'number') return new Date(v);
  if (typeof v === 'object' && v._seconds) return new Date(v._seconds * 1000);
  return undefined;
}

function pick(obj, keys) {
  const out = {};
  for (const k of keys) if (obj[k] !== undefined) out[k] = obj[k];
  return out;
}

async function run() {
  const uri = process.env.MONGODB_URI;
  const dbName = process.env.MONGODB_DB;
  if (!uri || !dbName) {
    console.error('Set MONGODB_URI and MONGODB_DB');
    process.exit(1);
  }
  initAdmin();
  const fsdb = getFirestore();
  const client = new MongoClient(uri);
  await client.connect();
  const mongo = client.db(dbName);

  const usersCol = fsdb.collection('users');
  const usersSnap = await usersCol.get();
  console.log(`Found ${usersSnap.size} user docs.`);

  const usersOut = mongo.collection('users');
  const profilesOut = mongo.collection('user_profiles');
  // Helpful indexes for uniqueness and lookups
  try { await mongo.collection('reservedHandles').createIndex({ id: 1 }, { unique: true }); } catch {}
  try { await mongo.collection('user_bookmarks').createIndex({ userId: 1, id: 1 }, { unique: true }); } catch {}
  try { await mongo.collection('user_notifications').createIndex({ userId: 1, id: 1 }, { unique: true }); } catch {}
  const bookmarksOut = mongo.collection('user_bookmarks');
  const notificationsOut = mongo.collection('user_notifications');

  let count = 0;
  for (const doc of usersSnap.docs) {
    const d = doc.data();
    const uid = d.uid || doc.id;
    const email = d.email || (doc.id.includes('@') ? doc.id : undefined);
    const appUser = {
      _id: uid,
      email: email || null,
      phone: d.phoneNumber || d.phone || null,
      displayName: d.name || d.displayName || undefined,
      photoURL: d.avatarUrl || d.photoURL || undefined,
      roles: Array.isArray(d.roles) && d.roles.length ? d.roles : ["user"],
      status: 'active',
      mfaEnrolled: !!d.mfaEnrolled,
      createdAt: tsToDate(d.createdAt) || new Date(),
      lastLoginAt: tsToDate(d.lastLoginAt) || tsToDate(d.updatedAt) || new Date(),
    };
    await usersOut.updateOne({ _id: appUser._id }, { $set: appUser }, { upsert: true });

    // Profile copy (keep original schema for app UIs)
    const profileDoc = {
      ...d,
      id: email || uid,
      email: email || d.email || null,
      uid,
      createdAt: tsToDate(d.createdAt) || new Date(),
      updatedAt: tsToDate(d.updatedAt) || new Date(),
      lastLoginAt: tsToDate(d.lastLoginAt) || undefined,
    };
    await profilesOut.updateOne({ id: profileDoc.id }, { $set: profileDoc }, { upsert: true });

    // Subcollections
    const bSnap = await usersCol.doc(doc.id).collection('bookmarks').get();
    for (const b of bSnap.docs) {
      const bd = b.data();
      await bookmarksOut.updateOne(
        { id: b.id, userId: profileDoc.id },
        { $set: { ...bd, id: b.id, userId: profileDoc.id } },
        { upsert: true }
      );
    }
    const nSnap = await usersCol.doc(doc.id).collection('notifications').get();
    for (const n of nSnap.docs) {
      const nd = n.data();
      await notificationsOut.updateOne(
        { id: n.id, userId: profileDoc.id },
        { $set: { ...nd, id: n.id, userId: profileDoc.id } },
        { upsert: true }
      );
    }

    count++;
    if (count % 50 === 0) console.log(`Migrated ${count}/${usersSnap.size} users...`);
  }

  console.log(`Done. Migrated ${count} users.`);
  await client.close();
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
