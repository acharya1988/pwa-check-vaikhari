import { api } from "./client";
import { API } from "./endpoints";

export type BookCategory = { _id: string; name: string; order?: number };

export async function fetchDrifts(params?: { q?: string; status?: string }) {
  const { data } = await api.get(API.drifts.list, { params });
  return data.items as any[];
}

export async function fetchLayers(params?: { q?: string; type?: string }) {
  const { data } = await api.get(API.layers.list, { params });
  return data.items as any[];
}

export async function updateLayer(id: string, patch: any) {
  const { data } = await api.patch(`${API.layers.list}/${id}`, patch);
  return data.item as any;
}

export async function deleteLayer(id: string) {
  const { data } = await api.delete(`${API.layers.list}/${id}`);
  return data.ok as boolean;
}

export async function fetchLibrary() {
  const { data } = await api.get(API.library.list);
  return data.items as any[];
}

export async function collectLibrary(payload: { refId: string; refType: string; title?: string; author?: string; coverUrl?: string; meta?: any }) {
  const { data } = await api.post(API.library.collect, payload);
  return data.item as any;
}

export async function fetchLibraryItem(refId: string) {
  const { data } = await api.get(API.library.itemByRef(refId));
  return data.item as any;
}

export async function fetchProfileMe() {
  const { data } = await api.get(API.profile.me);
  return data.profile as any;
}
