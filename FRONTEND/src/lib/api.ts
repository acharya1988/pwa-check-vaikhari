"use client";
// Tiny fetch wrapper with in-memory dedupe
const cache = new Map<string, Promise<any>>();

export async function api<T = any>(input: string, init?: RequestInit & { dedupeKey?: string }) {
  const key = init?.dedupeKey || `${init?.method || 'GET'} ${input}`;
  if (cache.has(key)) return cache.get(key)! as Promise<T>;
  const p = (async () => {
    const res = await fetch(input, { ...init, credentials: 'include' });
    if (!res.ok) throw new Error(`API ${res.status}`);
    const data = (await res.json()) as T;
    return data;
  })();
  cache.set(key, p);
  try {
    const out = await p;
    return out;
  } finally {
    cache.delete(key);
  }
}

export function bindLoader(setLoading: (v: boolean) => void) {
  return async function <T>(fn: () => Promise<T>): Promise<T> {
    setLoading(true);
    try { return await fn(); } finally { setLoading(false); }
  };
}

