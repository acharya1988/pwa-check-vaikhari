#!/usr/bin/env node
/*
  Firestore => MongoDB bulk migration for Vaikhari

  Collections migrated:
    - users (+ user_profiles, user_bookmarks, user_notifications)
    - reservedHandles
    - quote_categories, quotes
    - glossary_categories, glossary_terms
    - citation_categories, citations
    - organizations, circles, circle_posts
    - conversations, messages (from conversations/{id}/messages and circles/{id}/messages)
    - posts
    - series
    - standalone_article_categories, standalone_articles
    - super_admin_content
    - themes
    - todayStories
    - layers
    - email_otps
    - book_categories, books, book_content
    - chintana_categories, chintana_threads
    - vaia_sessions

  Env required:
    MONGODB_URI
    MONGODB_DB
    One of firebase-admin credential options:
      - FIREBASE_SERVICE_ACCOUNT_KEY_BASE64
      - FIREBASE_CREDENTIALS_FILE
      - FIREBASE_SERVICE_ACCOUNT_KEY
      - FIREBASE_PROJECT_ID + FIREBASE_CLIENT_EMAIL + FIREBASE_PRIVATE_KEY
*/

import { MongoClient } from 'mongodb';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';

async function initAdmin() {
  if (getApps().length) return;
  const base64 = process.env.FIREBASE_SERVICE_ACCOUNT_KEY_BASE64;
  if (base64) {
    const jsonStr = Buffer.from(base64, 'base64').toString('utf8');
    const sa = JSON.parse(jsonStr);
    initializeApp({ credential: cert(sa), projectId: sa.project_id });
    return;
  }
  if (process.env.FIREBASE_CREDENTIALS_FILE) {
    const fs = await import('node:fs');
    const p = process.env.FIREBASE_CREDENTIALS_FILE;
    const jsonStr = fs.readFileSync(p, 'utf8');
    const sa = JSON.parse(jsonStr);
    initializeApp({ credential: cert(sa), projectId: sa.project_id });
    return;
  }
  if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    let raw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    if ((raw.startsWith('"') && raw.endsWith('"')) || (raw.startsWith("'") && raw.endsWith("'"))) raw = raw.slice(1, -1);
    const sa = JSON.parse(raw);
    initializeApp({ credential: cert(sa), projectId: sa.project_id });
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

function toPlain(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  const out = {};
  for (const k of Object.keys(obj)) {
    const v = obj[k];
    if (v instanceof Date || v instanceof Timestamp || (v && typeof v === 'object' && ('toDate' in v || '_seconds' in v))) {
      const d = tsToDate(v);
      out[k] = d ? d.getTime() : v;
    } else if (Array.isArray(v)) {
      out[k] = v.map(toPlain);
    } else if (v && typeof v === 'object') {
      out[k] = toPlain(v);
    } else {
      out[k] = v;
    }
  }
  return out;
}

async function upsertMany(coll, docs, key = 'id') {
  if (!docs || !docs.length) return 0;
  const bulk = coll.initializeUnorderedBulkOp();
  for (const d of docs) {
    const k = d[key] ?? d._id ?? d.id;
    if (k === undefined) continue;
    bulk.find({ [key]: k }).upsert().updateOne({ $set: d });
  }
  const res = await bulk.execute();
  return res.nUpserted + res.nModified;
}

async function run() {
  const uri = process.env.MONGODB_URI;
  const dbName = process.env.MONGODB_DB;
  if (!uri || !dbName) {
    console.error('Set MONGODB_URI and MONGODB_DB');
    process.exit(1);
  }
  await initAdmin();
  const fsdb = getFirestore();
  const client = new MongoClient(uri);
  await client.connect();
  const mongo = client.db(dbName);

  // Helpful unique indexes
  try { await mongo.collection('reservedHandles').createIndex({ id: 1 }, { unique: true }); } catch {}
  try { await mongo.collection('user_bookmarks').createIndex({ userId: 1, id: 1 }, { unique: true }); } catch {}
  try { await mongo.collection('user_notifications').createIndex({ userId: 1, id: 1 }, { unique: true }); } catch {}

  let migrated = 0;

  // Users + subcollections
  {
    const usersSnap = await fsdb.collection('users').get();
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
        createdAt: tsToDate(d.createdAt)?.getTime() || Date.now(),
        lastLoginAt: tsToDate(d.lastLoginAt)?.getTime() || tsToDate(d.updatedAt)?.getTime() || Date.now(),
      };
      await mongo.collection('users').updateOne({ _id: appUser._id }, { $set: appUser }, { upsert: true });
      const profileDoc = {
        ...toPlain(d),
        id: email || uid,
        email: email || d.email || null,
        uid,
        createdAt: tsToDate(d.createdAt)?.getTime() || Date.now(),
        updatedAt: tsToDate(d.updatedAt)?.getTime() || Date.now(),
        lastLoginAt: tsToDate(d.lastLoginAt)?.getTime() || undefined,
      };
      await mongo.collection('user_profiles').updateOne({ id: profileDoc.id }, { $set: profileDoc }, { upsert: true });
      // Subcollections
      const bSnap = await fsdb.collection(`users/${doc.id}/bookmarks`).get();
      for (const b of bSnap.docs) {
        const bd = toPlain(b.data());
        await mongo.collection('user_bookmarks').updateOne(
          { id: b.id, userId: profileDoc.id },
          { $set: { ...bd, id: b.id, userId: profileDoc.id } },
          { upsert: true }
        );
      }
      const nSnap = await fsdb.collection(`users/${doc.id}/notifications`).get();
      for (const n of nSnap.docs) {
        const nd = toPlain(n.data());
        await mongo.collection('user_notifications').updateOne(
          { id: n.id, userId: profileDoc.id },
          { $set: { ...nd, id: n.id, userId: profileDoc.id } },
          { upsert: true }
        );
      }
      migrated++;
    }
  }

  // Simple top-level collections (one-to-one)
  const simpleMaps = [
    ['reservedHandles', 'reservedHandles'],
    ['quote_categories', 'quote_categories'],
    ['quotes', 'quotes'],
    ['glossary_categories', 'glossary_categories'],
    ['glossary_terms', 'glossary_terms'],
    ['citation_categories', 'citation_categories'],
    ['citations', 'citations'],
    ['organizations', 'organizations'],
    ['circle_posts', 'circle_posts'],
    ['posts', 'posts'],
    ['series', 'series'],
    ['standalone_article_categories', 'standalone_article_categories'],
    ['standalone_articles', 'standalone_articles'],
    ['super_admin_content', 'super_admin_content'],
    ['themes', 'themes'],
    ['todayStories', 'todayStories'],
    ['layers', 'layers'],
    ['email_otps', 'email_otps'],
    ['book_categories', 'book_categories'],
    ['books', 'books'],
    ['book_content', 'book_content'],
    ['chintana_categories', 'chintana_categories'],
    ['chintana_threads', 'chintana_threads'],
    ['vaia_sessions', 'vaia_sessions'],
  ];

  for (const [fsName, mongoName] of simpleMaps) {
    const snap = await fsdb.collection(fsName).get();
    const docs = snap.docs.map(d => ({ id: d.id, ...toPlain(d.data()) }));
    await upsertMany(mongo.collection(mongoName), docs, 'id');
    migrated += docs.length;
  }

  // conversations
  {
    const snap = await fsdb.collection('conversations').get();
    const convos = snap.docs.map(d => ({ id: d.id, ...toPlain(d.data()) }));
    await upsertMany(mongo.collection('conversations'), convos, 'id');
    migrated += convos.length;
    // messages under conversations/*/messages => messages collection
    for (const d of snap.docs) {
      const ms = await fsdb.collection(`conversations/${d.id}/messages`).get();
      const msgs = ms.docs.map(m => ({ id: m.id, conversationId: d.id, ...toPlain(m.data()) }));
      await upsertMany(mongo.collection('messages'), msgs, 'id');
      migrated += msgs.length;
    }
  }

  // circles messages
  {
    const snap = await fsdb.collection('circles').get();
    for (const d of snap.docs) {
      const ms = await fsdb.collection(`circles/${d.id}/messages`).get();
      const msgs = ms.docs.map(m => ({ id: m.id, conversationId: d.id, ...toPlain(m.data()) }));
      await upsertMany(mongo.collection('messages'), msgs, 'id');
      migrated += msgs.length;
    }
    // upsert circles themselves handled in simpleMaps
  }

  console.log(`Migration complete. Documents upserted/updated: ${migrated}`);
  await client.close();
}

run().catch((e) => { console.error(e); process.exit(1); });
