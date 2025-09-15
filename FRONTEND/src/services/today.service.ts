
"use server";

import type { TodayStory, UserProfile } from '@/types';
import { getDb } from '@/lib/mongo';
import { serializeMongo } from '@/lib/serialize';

const STORIES_COLLECTION = 'todayStories';

export async function getTodayStories(): Promise<TodayStory[]> {
    const db = await getDb();
    const now = Date.now();
    const list = await db
      .collection<TodayStory>(STORIES_COLLECTION)
      .find({ 'visibility.expiryAt': { $gt: now } })
      .sort({ 'visibility.expiryAt': 1 })
      .toArray();
    return serializeMongo(list) as TodayStory[];
}

export async function createTodayStory(storyData: Omit<TodayStory, 'id' | 'createdAt' | 'updatedAt' | 'version'>): Promise<TodayStory> {
    const db = await getDb();
    const now = Date.now();
    const expiryDate = new Date(storyData.visibility.expiryAt);

    const id = globalThis.crypto?.randomUUID ? globalThis.crypto.randomUUID() : (Math.random().toString(36).slice(2) + Date.now());
    const newStory: TodayStory = {
      ...storyData,
      id,
      createdAt: now,
      updatedAt: now,
      version: 1,
      visibility: { createdAt: now, expiryAt: expiryDate.getTime() },
    } as any;
    await db.collection(STORIES_COLLECTION).insertOne(newStory as any);
    return newStory as TodayStory;
}
