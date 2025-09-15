"use client";

import useSWR from "swr";

const fetcher = (url: string) => fetch(url, { credentials: 'include' }).then((r) => r.json());

export function useDrifts(q = "", status?: "draft" | "published") {
  const qs = new URLSearchParams();
  if (q) qs.set("q", q);
  if (status) qs.set("status", status);
  const { data, error, isLoading, mutate } = useSWR(`/api/drifts?${qs.toString()}`, fetcher);
  return { drifts: data?.items ?? [], error, isLoading, mutate };
}
