'use server';

import { getDb } from '@/lib/mongo';

export async function testDbConnection() {
  console.log("[testDbConnection] Starting database test...");

  if (!process.env.MONGODB_URI) {
    console.error("[testDbConnection] MONGODB_URI is missing in .env file");
    return { error: 'MONGODB_URI is not configured. Please add it to your .env file.' };
  }

  try {
    const db = await getDb();
    const ping = await db.command({ ping: 1 });
    console.log("[testDbConnection] Database connection established.", ping);
    return { success: true, db: db.databaseName };
  } catch (error) {
    console.error("[testDbConnection] Error occurred:", error);
    if (error instanceof Error) {
      return { error: error.message };
    }
    return { error: 'Unknown error occurred while connecting to the database.' };
  }
}

export async function inspectDb(limit: number = 2) {
  try {
    const db = await getDb();
    const dbName = db.databaseName;
    const colls = await db.listCollections().toArray();
    const out: any[] = [];
    for (const c of colls) {
      const name = c.name;
      const coll = db.collection(name);
      const count = await coll.countDocuments();
      const sampleDocs = await coll.find({}).limit(limit).toArray();
      const sample = sampleDocs.map((d: any) => {
        const copy: any = {};
        for (const k of Object.keys(d)) {
          if (k === '_id') continue;
          const v = (d as any)[k];
          const t = typeof v;
          copy[k] = t === 'string' ? v.slice(0, 120) : t;
        }
        return copy;
      });
      out.push({ name, count, sample });
    }
    return { ok: true, db: dbName, collections: out };
  } catch (e: any) {
    return { ok: false, error: e?.message || 'inspect-failed' };
  }
}
