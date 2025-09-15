

'use server';

import { getDb } from '@/lib/mongo';
import { serializeMongo } from '@/lib/serialize';
import type { SeriesInfo } from '@/types';

export async function getSeriesData(): Promise<SeriesInfo[]> {
    const db = await getDb();
    const list = await db.collection<SeriesInfo>('series').find({}).toArray();
    return serializeMongo(list) as any as SeriesInfo[];
}

export async function getSeriesNames(): Promise<string[]> {
    const series = await getSeriesData();
    return series.map(s => s.name);
}

export async function updateSeries(seriesName: string, data: Partial<Omit<SeriesInfo, 'name'>>): Promise<SeriesInfo> {
    const db = await getDb();
    const existing = await db.collection<SeriesInfo>('series').findOne({ name: seriesName });
    if (existing) {
      await db.collection('series').updateOne({ name: seriesName }, { $set: data });
      return { ...(existing as any), ...data, name: seriesName } as SeriesInfo;
    } else {
      const newSeries = { name: seriesName, description: data.description || '' } as any;
      await db.collection('series').insertOne(newSeries);
      return newSeries as SeriesInfo;
    }
}
