import { json } from "../lib/http.js";
import { getDb } from "../lib/mongo.js";

// Matches GET /api/circles/:id/posts
export default async function handler(req, res, url) {
  // Extract :id from pathname
  const parts = url.pathname.split("/").filter(Boolean); // ["api","circles",":id","posts"]
  const id = parts[2];
  const params = url.searchParams;
  const beforeStr = params.get("before");
  const limitStr = params.get("limit");
  const before = beforeStr ? Number(beforeStr) : undefined;
  const limit = limitStr ? Number(limitStr) : undefined;

  const db = await getDb();
  const filter = { circleId: id };
  if (before) filter.createdAt = { $lt: before };
  const lim = Math.min(Math.max(limit ?? 10, 1), 100);
  const list = await db
    .collection("circle_posts")
    .find(filter)
    .sort({ createdAt: -1 })
    .limit(lim + 1)
    .toArray();

  // Ensure minimal mapping parity to UI shape
  const items = list.map((p) => ({
    id: p.id,
    author: {
      id: p.author?.id,
      name: p.author?.name,
      avatarUrl: p.author?.avatarUrl,
      role: "member",
    },
    createdAt: new Date(p.createdAt).toISOString(),
    type: p.postType === "question" ? "Prashna" : p.postType === "sutra" ? "Sutra" : "Note",
    title: undefined,
    content: p.content,
    tags: p.tags || [],
    reactions: [],
    commentCount: 0,
    pinned: false,
  }));

  const hasMore = items.length > lim;
  const sliced = hasMore ? items.slice(0, lim) : items;
  return json(res, 200, { items: sliced, hasMore });
}

