import { NextRequest, NextResponse } from 'next/server';
import { getCirclePosts } from '@/services/post.service';

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const { searchParams } = new URL(req.url);
  const beforeStr = searchParams.get('before');
  const limitStr = searchParams.get('limit');
  const before = beforeStr ? Number(beforeStr) : undefined;
  const limit = limitStr ? Number(limitStr) : undefined;

  const { items, hasMore } = await getCirclePosts(id, { before, limit });

  // Map service posts to UI posts expected by circle-view
  const ui = items.map((p) => ({
    id: p.id,
    author: {
      id: p.author.id,
      name: p.author.name,
      avatarUrl: p.author.avatarUrl,
      role: 'member' as const,
    },
    createdAt: new Date(p.createdAt).toISOString(),
    type: (p.postType === 'question' ? 'Prashna' : p.postType === 'sutra' ? 'Sutra' : 'Note') as any,
    title: undefined,
    content: p.content,
    tags: p.tags || [],
    reactions: [],
    commentCount: 0,
    pinned: false,
  }));

  return NextResponse.json({ items: ui, hasMore });
}
