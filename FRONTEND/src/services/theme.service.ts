
"use server";

import type { BookTheme } from '@/types';
import { THEME_PRESETS } from '@/components/theme/theme-presets';
import { getDb } from '@/lib/mongo';
import { serializeMongo } from '@/lib/serialize';

async function seedDefaultTheme() {
  const db = await getDb();
  const existing = await db.collection('themes').findOne({ id: 'default' });
  if (!existing) {
    await db.collection('themes').insertOne({ id: 'default', ...(THEME_PRESETS[0] as any) });
  }
}

export async function getDefaultTheme(): Promise<BookTheme> {
  await seedDefaultTheme();
  const db = await getDb();
  const doc = await db.collection('themes').findOne({ id: 'default' });
  return (doc ? (serializeMongo(doc) as any as BookTheme) : THEME_PRESETS[0]);
}

export async function getThemeForBook(bookId: string): Promise<BookTheme> {
  const db = await getDb();
  const doc = await db.collection('themes').findOne({ id: bookId });
  if (doc) return serializeMongo(doc) as any as BookTheme;
  return await getDefaultTheme();
}

export async function getThemePresetByName(themeName: string): Promise<BookTheme> {
  const foundTheme = THEME_PRESETS.find(p => p.themeName === themeName);
  return foundTheme || (await getDefaultTheme());
}


export async function saveThemeForBook(bookId: string, theme: BookTheme): Promise<void> {
  const db = await getDb();
  await db.collection('themes').updateOne({ id: bookId }, { $set: { ...theme, id: bookId } }, { upsert: true });
}

export async function saveThemeAsDefault(theme: BookTheme): Promise<void> {
  const db = await getDb();
  const newDefault = { ...theme, isDefault: true, id: 'default' };
  await db.collection('themes').updateOne({ id: 'default' }, { $set: newDefault }, { upsert: true });
}
