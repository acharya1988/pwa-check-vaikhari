

'use server';

import { getDb } from '@/lib/mongo';
import type { LayerAnnotation } from '@/types';

const LAYERS_COLLECTION = 'layers';

export async function addLayerToDb(layerData: Omit<LayerAnnotation, 'id'>): Promise<LayerAnnotation> {
  const db = await getDb();
  const id = globalThis.crypto?.randomUUID ? globalThis.crypto.randomUUID() : (Math.random().toString(36).slice(2) + Date.now());
  const newLayer: LayerAnnotation = { ...layerData, id } as any;
  await db.collection(LAYERS_COLLECTION).insertOne(newLayer as any);
  return newLayer as LayerAnnotation;
}

export async function getLayersForUser(userId: string): Promise<LayerAnnotation[]> {
  const db = await getDb();
  const layers = await db.collection<LayerAnnotation>(LAYERS_COLLECTION).find({ userId }).sort({ timestamp: -1 }).toArray();
  return layers as any as LayerAnnotation[];
}
