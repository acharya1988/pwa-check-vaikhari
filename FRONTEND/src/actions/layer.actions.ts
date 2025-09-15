
'use server';

import { revalidatePath } from 'next/cache';
import { deleteLayer as apiDeleteLayer, updateLayer as apiUpdateLayer } from '@/services/api/vaikhariApi';

export async function deleteLayer(prevState: any, formData: FormData) {
  const layerId = formData.get('layerId') as string;
  if (!layerId) return { error: 'Layer ID is missing.' };
  try {
    await apiDeleteLayer(layerId);
    revalidatePath('/admin/my-layers');
    return { success: true, message: 'Layer deleted successfully.' };
  } catch (error: any) {
    return { error: `Failed to delete layer: ${error.message}` };
  }
}

export async function updateLayer(prevState: any, formData: FormData) {
  const layerId = formData.get('layerId') as string;
  const content = formData.get('content') as string;
  if (!layerId || !content) return { error: 'Missing required fields for update.' };
  try {
    await apiUpdateLayer(layerId, { content, updatedAt: Date.now() });
    revalidatePath('/admin/my-layers');
    return { success: true, message: 'Layer updated successfully.' };
  } catch (e: any) {
    return { error: `Failed to update layer: ${e.message}` };
  }
}
