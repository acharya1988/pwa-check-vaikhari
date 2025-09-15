import { notFound } from 'next/navigation';
import CircleView from '@/app/admin/circles/circle-view';
import { getCircle } from '@/services/profile.service';
import { getCirclePosts } from '@/services/post.service';
import { getUserProfile } from '@/services/user.service';
import type { Circle as DbCircle, CircleMember, UserProfile } from '@/types';
import type { Post as DbPost } from '@/types/social.types';

function mapMemberRole(role: CircleMember['role']): 'owner' | 'admin' | 'moderator' | 'member' | 'pending' | 'guest' {
  if (role === 'admin') return 'admin';
  // No explicit moderator in DB role; keep as member for now
  return 'member';
}

function toUiCircle(circle: DbCircle, postCount: number) {
  return {
    id: circle.id,
    slug: circle.id,
    name: circle.name,
    tagline: circle.description,
    coverUrl: (circle as any).coverUrl as string | undefined,
    avatarUrl: (circle as any).avatarUrl as string | undefined,
    isPrivate: circle.type === 'organization' ? true : false,
    category: undefined as string | undefined,
    createdAt: new Date(circle.createdAt).toISOString(),
    memberCount: circle.members?.length || 0,
    postCount,
    aboutMarkdown: circle.description || undefined,
    rules: [],
  };
}

function toUiMembers(circle: DbCircle) {
  return (circle.members || []).map((m) => ({
    id: m.userId,
    name: m.name,
    avatarUrl: m.avatarUrl,
    title: undefined,
    role: m.userId === circle.ownerId ? 'owner' : mapMemberRole(m.role),
    joinedAt: new Date(circle.createdAt).toISOString(),
    expertise: undefined,
  }));
}

function toUiPosts(posts: DbPost[]) {
  return posts.map((p) => ({
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
}

export default async function CirclePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const circle = await getCircle(id);
  if (!circle) return notFound();

  const { items: posts } = await getCirclePosts(id, { limit: 10 });

  let currentUserRole: 'owner' | 'admin' | 'moderator' | 'member' | 'pending' | 'guest' = 'guest';
  let currentUser: Pick<UserProfile, 'email' | 'name' | 'avatarUrl'> | null = null;
  try {
    const user = await getUserProfile();
    currentUser = { email: user.email, name: user.name, avatarUrl: user.avatarUrl };
    const member = circle.members?.find((m) => m.userId === user.email);
    if (user.email === circle.ownerId) currentUserRole = 'owner';
    else if (member?.role === 'admin') currentUserRole = 'admin';
    else if (member) currentUserRole = 'member';
    else if (circle.requests?.some((r) => r.userId === user.email)) currentUserRole = 'pending';
  } catch (_) {
    // unauthenticated; keep guest
  }

  const uiCircle = toUiCircle(circle, posts.length);
  const uiMembers = toUiMembers(circle);
  const uiPosts = toUiPosts(posts);

  return (
    <CircleView
      initialCircle={uiCircle as any}
      initialMembers={uiMembers as any}
      initialPosts={uiPosts as any}
      currentUserRole={currentUserRole}
      initialRequests={(circle.requests || []) as any}
      currentUser={currentUser as any}
    />
  );
}
