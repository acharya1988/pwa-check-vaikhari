
'use server';

import slugify from 'slugify';
import { getDb } from '@/lib/mongo';
import type { SubCategory } from '@/types/genre.types';

export async function addSubCategoryToCategory(
    categoryId: string,
    subCategoryName: string
): Promise<SubCategory> {
    const newId = slugify(subCategoryName, { lower: true, strict: true });
    const db = await getDb();
    const existing = await db.collection('sub_categories').findOne({ id: newId });
    if (existing) return existing as any as SubCategory;
    const newSubCategory: SubCategory = { id: newId, name: subCategoryName, categoryId };
    await db.collection('sub_categories').insertOne(newSubCategory as any);
    return newSubCategory;
}
