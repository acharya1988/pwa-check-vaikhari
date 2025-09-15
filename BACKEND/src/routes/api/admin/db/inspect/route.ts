import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongo";

export const runtime = 'nodejs';

export async function GET(req: Request) {
  try {
    const db = await getDb();
    const url = new URL(req.url);
    const limit = Number(url.searchParams.get('limit') || '3');
    const colls = await db.listCollections().toArray();
    const out: any[] = [];
    for (const c of colls) {
      const name = c.name;
      const count = await db.collection(name).countDocuments();
      const sampleDocs = await db.collection(name).find({}).limit(limit).toArray();
      const sample = sampleDocs.map((d: any) => {
        const copy: any = {};
        for (const k of Object.keys(d)) {
          if (k === '_id') continue;
          const v = d[k];
          const t = typeof v;
          copy[k] = t === 'string' ? (v as string).slice(0, 200) : t;
        }
        return copy;
      });
      out.push({ name, count, sample });
    }
    return NextResponse.json({ ok: true, db: db.databaseName, collections: out });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'inspect-failed' }, { status: 500 });
  }
}

