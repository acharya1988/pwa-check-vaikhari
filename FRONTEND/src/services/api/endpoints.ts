export const API = {
  books: { categories: "/api/v1/books/categories", byId: (id: string) => `/api/v1/books/${id}` },
  circles: { list: "/api/v1/circles" },
  library: { list: "/api/v1/library", collect: "/api/v1/library/collect", itemByRef: (refId: string) => `/api/v1/library/items/${refId}` },
  profile: { me: "/api/v1/profile/me" },
  layers: { list: "/api/v1/layers" },
  drifts: { list: "/api/v1/drifts", byId: (id: string) => `/api/v1/drifts/${id}` },
  session: { me: "/api/v1/session/me", session: "/api/v1/session" },
  admin: { stats: "/api/v1/admin/stats" },
} as const;

