"use client";
import React, { useMemo, useState, useEffect, useRef } from "react";
import { useActionState } from "react";
import { AnnounceWorkDialog } from "@/components/social/announce-work-dialog";
import type { Post as ServicePost, PostType as ServicePostType } from "@/types/social.types";
import { createPost as createPostAction } from "@/actions/post.actions";
import { requestToJoinCircleAction, manageCircleRequest } from "@/actions/profile.actions";
import type { CircleRequest as DbCircleRequest } from "@/types";

/**
 * Vaikhari – Circle Page
 * Single-file, production-ready React + Tailwind UI you can drop into Next.js (App Router friendly).
 * - No external UI deps required. (Uses basic Tailwind + a few inline SVG icons.)
 * - Accessible: keyboard-focusable tabs, ARIA roles, semantic landmarks.
 * - Mobile-first, responsive up to ultra-wide.
 * - Admin-aware affordances are shown when currentUserRole === 'admin' | 'moderator'.
 * - Replace mock data + handlers with your data sources (Mongo/Firestore).
 */

// ---------------------------
// Types (map to Mongo collections)
// ---------------------------
export type CircleRole = "owner" | "admin" | "moderator" | "member" | "pending" | "guest";

export interface Circle {
  id: string;
  slug: string;
  name: string;
  tagline?: string;
  coverUrl?: string;
  avatarUrl?: string;
  isPrivate?: boolean;
  category?: string; // e.g., Ayurveda, Sanskrit, Jyotisha
  createdAt: string; // ISO
  memberCount: number;
  postCount: number;
  aboutMarkdown?: string;
  rules: { id: string; title: string; body: string }[];
}

export type PostType =
  | "Prashna" // question
  | "PurvaPaksha" // opening argument
  | "UttaraPaksha" // counter-argument
  | "Samadhana" // resolution
  | "Sutra" // aphorism / key point
  | "Thought"
  | "Reflection"
  | "Poetry"
  | "Note" // general text
  | "Media"; // link/image/video

export interface Post {
  id: string;
  author: {
    id: string;
    name: string;
    avatarUrl?: string;
    role: CircleRole;
  };
  createdAt: string;
  type: PostType;
  title?: string;
  content: string; // markdown/plaintext (render as needed)
  tags?: string[];
  reactions?: { emoji: string; count: number }[];
  commentCount?: number;
  pinned?: boolean;
}

export interface Member {
  id: string;
  name: string;
  avatarUrl?: string;
  title?: string; // e.g., Vaidya, Scholar, Student
  role: CircleRole;
  joinedAt: string;
  expertise?: string[]; // chips
}

// No mock data. Component expects real data via props.

// ---------------------------
// Utilities
// ---------------------------
const cn = (...xs: (string | false | undefined)[]) => xs.filter(Boolean).join(" ");

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

// ---------------------------
// Icons (inline SVG)
// ---------------------------
const IconLock = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
    <path
      fill="currentColor"
      d="M12 1a5 5 0 00-5 5v3H6a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2v-8a2 2 0 00-2-2h-1V6a5 5 0 00-5-5zm-3 8V6a3 3 0 116 0v3H9z"
    />
  </svg>
);
const IconBell = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
    <path
      fill="currentColor"
      d="M12 22a2 2 0 002-2H10a2 2 0 002 2zm6-6V11a6 6 0 10-12 0v5L4 18v2h16v-2l-2-2z"
    />
  </svg>
);
const IconPlus = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
    <path fill="currentColor" d="M11 11V5h2v6h6v2h-6v6h-2v-6H5v-2z" />
  </svg>
);
const IconPin = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
    <path fill="currentColor" d="M14 2l-1 7 5 5-3 3-5-5-7 1 11-11z" />
  </svg>
);

// ---------------------------
// Tabbed Layout
// ---------------------------
const TABS = ["Posts", "Members", "About", "Rules"] as const;

type Tab = typeof TABS[number];

function Tabs({ value, onChange }: { value: Tab; onChange: (t: Tab) => void }) {
  return (
    <div className="border-b border-border">
      <div role="tablist" aria-label="Circle sections" className="-mb-px flex gap-2 overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t}
            role="tab"
            aria-selected={value === t}
            onClick={() => onChange(t)}
            className={cn(
              "px-4 py-2 text-sm font-medium rounded-t-md focus:outline-none focus-visible:ring",
              value === t
                ? "bg-card text-card-foreground border-x border-t border-border"
                : "text-muted-foreground hover:bg-muted"
            )}
          >
            {t}
          </button>
        ))}
      </div>
    </div>
  );
}

// ---------------------------
// Post Composer (stub)
// ---------------------------
function PostComposer({ circleId, onCreated, currentUser }: { circleId: string; onCreated?: (p: Post) => void; currentUser?: { email: string; name: string; avatarUrl?: string } | null }) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [state, createAction] = useActionState(createPostAction as any, null);
  const [category, setCategory] = useState<'general' | 'technical'>('general');
  const [generalType, setGeneralType] = useState<'Thought' | 'Reflection' | 'Poetry'>('Thought');
  const [technicalType, setTechnicalType] = useState<'Prashna' | 'PurvaPaksha' | 'UttaraPaksha' | 'Samadhana' | 'Sutra'>('Prashna');
  const [announceOpen, setAnnounceOpen] = useState(false);
  const [attachedWork, setAttachedWork] = useState<any | null>(null);
  // Prevent re-firing onCreated for the same post and make callback stable
  const lastHandledIdRef = useRef<string | null>(null);
  const onCreatedRef = useRef<typeof onCreated>();
  useEffect(() => {
    onCreatedRef.current = onCreated;
  }, [onCreated]);

  function mapUiTypeToService(): ServicePostType {
    if (category === 'general') {
      if (generalType === 'Thought') return 'thought' as ServicePostType;
      if (generalType === 'Reflection') return 'reflection' as ServicePostType;
      return 'poetry' as ServicePostType;
    }
    if (technicalType === 'Prashna') return 'question' as ServicePostType;
    if (technicalType === 'Sutra') return 'sutra' as ServicePostType;
    return 'thought' as ServicePostType;
  }

  useEffect(() => {
    if ((state as any)?.success && (state as any)?.post) {
      const sp = (state as any).post as ServicePost;
      // Only handle once per created post id
      if (sp.id && lastHandledIdRef.current !== sp.id) {
        lastHandledIdRef.current = sp.id;
        const mapped: Post = {
          id: sp.id,
          author: { id: sp.author.id, name: sp.author.name, avatarUrl: sp.author.avatarUrl, role: "member" },
          createdAt: new Date(sp.createdAt).toISOString(),
          type: sp.postType === 'question' ? 'Prashna' : sp.postType === 'sutra' ? 'Sutra' : (generalType as any) || 'Note',
          title: undefined,
          content: sp.content,
          tags: sp.tags,
          reactions: [],
          commentCount: 0,
          pinned: false,
        };
        onCreatedRef.current?.(mapped);
        setTitle("");
        setContent("");
        setAttachedWork(null);
      }
    }
  }, [state, generalType]);

  const composed = title ? `${title}\n\n${content}` : content;
  const metaTags = useMemo(() => {
    if (category === 'technical') {
      return [technicalType.toLowerCase()];
    }
    return [] as string[];
  }, [category, technicalType]);

  return (
    <div id="composer" className="rounded-2xl border border-border bg-card text-card-foreground p-4 shadow-sm">
      <form action={createAction} className="flex items-start gap-3">
        <img src={currentUser?.avatarUrl || '/media/pexels-life-of-pix-7974.jpg'} alt="you" className="h-9 w-9 rounded-full" />
        <div className="flex-1">
          <div className="flex flex-wrap gap-2 items-center">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as any)}
              className="rounded-md border border-border bg-transparent px-2 py-1 text-sm"
              aria-label="Post category"
            >
              <option value="general" className="bg-card">General</option>
              <option value="technical" className="bg-card">Technical</option>
            </select>
            {category === 'general' ? (
              <select
                value={generalType}
                onChange={(e) => setGeneralType(e.target.value as any)}
                className="rounded-md border border-border bg-transparent px-2 py-1 text-sm"
                aria-label="General post type"
              >
                {['Thought','Reflection','Poetry'].map((t) => (
                  <option key={t} value={t} className="bg-card">{t}</option>
                ))}
              </select>
            ) : (
              <select
                value={technicalType}
                onChange={(e) => setTechnicalType(e.target.value as any)}
                className="rounded-md border border-border bg-transparent px-2 py-1 text-sm"
                aria-label="Technical post type"
              >
                {['Prashna','PurvaPaksha','UttaraPaksha','Samadhana','Sutra'].map((t) => (
                  <option key={t} value={t} className="bg-card">{t}</option>
                ))}
              </select>
            )}
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Title (optional)"
              className="flex-1 rounded-md border border-border bg-transparent px-3 py-1 text-sm"
            />
          </div>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write your post…"
            className="mt-2 w-full rounded-md border border-border bg-transparent px-3 py-2 text-sm min-h-[80px]"
          />
          <input type="hidden" name="content" value={composed} />
          <input type="hidden" name="postType" value={mapUiTypeToService() as any} />
          <input type="hidden" name="postMethod" value="circle" />
          <input type="hidden" name="circleId" value={circleId} />
          {metaTags.length > 0 && (
            <input type="hidden" name="metaTags" value={JSON.stringify(metaTags)} />
          )}
          {attachedWork && (
            <input type="hidden" name="attachedWork" value={JSON.stringify(attachedWork)} />
          )}
          <div className="mt-2 flex items-center justify-between">
            <div className="flex gap-2 text-sm text-muted-foreground">
              <span className="cursor-pointer">#Tags</span>
              <span className="cursor-pointer">@Mention</span>
              <button type="button" onClick={() => setAnnounceOpen(true)} className="underline">Announce</button>
            </div>
            <button
              type="submit"
              disabled={!content.trim()}
              className="inline-flex items-center gap-2 rounded-lg bg-primary text-primary-foreground px-3 py-1.5 text-sm hover:opacity-90"
            >
              <IconPlus />
              Post
            </button>
          </div>
          {(state as any)?.error && (
            <p className="text-sm text-destructive mt-2">{(state as any).error}</p>
          )}
          {attachedWork && (
            <div className="mt-2 text-xs text-muted-foreground">
              Attached: {attachedWork.title}
              <button type="button" className="ml-2 underline" onClick={() => setAttachedWork(null)}>Remove</button>
            </div>
          )}
        </div>
      </form>
      <AnnounceWorkDialog
        open={announceOpen}
        onOpenChange={setAnnounceOpen}
        onWorkSelected={(work) => setAttachedWork(work)}
      />
    </div>
  );
}

// ---------------------------
// Post Card
// ---------------------------
function PostCard({ p }: { p: Post }) {
  return (
    <article className="rounded-2xl border border-border bg-card text-card-foreground p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <img src={p.author.avatarUrl} alt={p.author.name} className="h-10 w-10 rounded-full" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 text-sm">
            <span className="font-medium truncate">{p.author.name}</span>
            <span className="text-muted-foreground">· {timeAgo(p.createdAt)}</span>
            <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-xs">
              {p.type}
            </span>
            {p.pinned && (
              <span className="flex items-center gap-1 text-xs text-amber-600 ml-2">
                <IconPin /> Pinned
              </span>
            )}
          </div>
          {p.title && <h3 className="mt-1 text-base font-semibold">{p.title}</h3>}
          <p className="mt-1 text-sm whitespace-pre-wrap">{p.content}</p>
          {!!p.tags?.length && (
            <div className="mt-2 flex flex-wrap gap-1">
              {p.tags!.map((t) => (
                <span key={t} className="text-xs rounded-full bg-muted px-2 py-0.5">
                  #{t}
                </span>
              ))}
            </div>
          )}
          <div className="mt-3 flex items-center gap-4 text-sm text-muted-foreground">
            <button className="hover:underline">Reply</button>
            <div className="flex items-center gap-1">
              {p.reactions?.map((r) => (
                <span key={r.emoji} className="inline-flex items-center gap-1">
                  <span>{r.emoji}</span>
                  <span className="text-xs">{r.count}</span>
                </span>
              ))}
            </div>
            <span>· {p.commentCount ?? 0} comments</span>
          </div>
        </div>
      </div>
    </article>
  );
}

// ---------------------------
// Members Grid
// ---------------------------
function MembersGrid({ members }: { members: Member[] }) {
  const [query, setQuery] = useState("");
  const [role, setRole] = useState<CircleRole | "all">("all");

  const filtered = useMemo(() => {
    return members.filter((m) => {
      const okQ = m.name.toLowerCase().includes(query.toLowerCase());
      const okRole = role === "all" ? true : m.role === role;
      return okQ && okRole;
    });
  }, [members, query, role]);

  return (
    <section>
      <div className="mb-3 flex flex-col sm:flex-row gap-2 sm:items-center justify-between">
        <div className="flex gap-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search members…"
            className="w-full sm:w-64 rounded-md border border-border bg-transparent px-3 py-2 text-sm"
          />
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as any)}
            className="rounded-md border border-border bg-transparent px-2 py-2 text-sm"
          >
            <option value="all" className="bg-card">All roles</option>
            {(["owner", "admin", "moderator", "member", "pending", "guest"] as const).map((r) => (
              <option key={r} value={r} className="bg-card">
                {r}
              </option>
            ))}
          </select>
        </div>
        <div className="flex gap-2">
          <button className="rounded-lg border border-border px-3 py-1.5 text-sm">Invite</button>
          <button className="rounded-lg border border-border px-3 py-1.5 text-sm">Requests</button>
        </div>
      </div>
      <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {filtered.map((m) => (
          <li key={m.id} className="rounded-2xl border border-border bg-card text-card-foreground p-4">
            <div className="flex items-center gap-3">
              <img src={m.avatarUrl} alt={m.name} className="h-12 w-12 rounded-full" />
              <div className="min-w-0">
                <p className="font-medium truncate">{m.name}</p>
                <p className="text-sm text-muted-foreground truncate">{m.title}</p>
              </div>
              <span className="ml-auto text-xs rounded-full bg-muted px-2 py-0.5 capitalize">{m.role}</span>
            </div>
            {!!m.expertise?.length && (
              <div className="mt-3 flex flex-wrap gap-1">
                {m.expertise.map((tag) => (
                  <span key={tag} className="text-xs rounded-full bg-muted px-2 py-0.5">
                    {tag}
                  </span>
                ))}
              </div>
            )}
            <div className="mt-3 flex gap-2">
              <button className="text-sm rounded-md border border-border px-2 py-1">Message</button>
              <button className="text-sm rounded-md border border-border px-2 py-1">View profile</button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

// ---------------------------
// About & Rules
// ---------------------------
function About({ circle }: { circle: Circle }) {
  return (
    <div className="prose max-w-none">
      <p className="text-sm text-muted-foreground">Established {new Date(circle.createdAt).toLocaleDateString()} · Category: {circle.category}</p>
      {circle.aboutMarkdown ? (
        <div>
          <MarkdownLite>{circle.aboutMarkdown}</MarkdownLite>
        </div>
      ) : (
        <p className="text-sm">No description yet.</p>
      )}
    </div>
  );
}

function Rules({ circle }: { circle: Circle }) {
  const [ack, setAck] = useState(false);
  return (
    <section>
      <ul className="space-y-3">
        {circle.rules.map((r, idx) => (
          <li key={r.id} className="rounded-2xl border border-border bg-card text-card-foreground p-4">
            <h4 className="font-semibold">{idx + 1}. {r.title}</h4>
            <p className="text-sm text-muted-foreground mt-1">{r.body}</p>
          </li>
        ))}
      </ul>
      <div className="mt-4 flex items-center gap-2">
        <input id="ack" type="checkbox" className="h-4 w-4" checked={ack} onChange={(e) => setAck(e.target.checked)} />
        <label htmlFor="ack" className="text-sm">I acknowledge and agree to follow these rules.</label>
        <button disabled={!ack} className={cn("ml-auto rounded-lg px-3 py-1.5 text-sm", ack ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground cursor-not-allowed")}>Save</button>
      </div>
    </section>
  );
}

// Minimal markdown renderer (bold/italic/inline code/links only)
function MarkdownLite({ children }: { children: string }) {
  const html = useMemo(() =>
    children
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.+?)\*/g, "<em>$1</em>")
      .replace(/`(.+?)`/g, "<code>$1</code>")
      .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" target="_blank" rel="noreferrer" class="underline">$1<\/a>')
  , [children]);
  // eslint-disable-next-line react/no-danger
  return <div dangerouslySetInnerHTML={{ __html: html }} />;
}

// ---------------------------
// Header (cover, avatar, actions)
// ---------------------------
function CircleHeader({ circle, currentUserRole }: { circle: Circle; currentUserRole: CircleRole }) {
  return (
    <header className="relative">
      {/* Cover */}
      <div className="h-40 sm:h-56 w-full overflow-hidden rounded-xl">
        {circle.coverUrl ? (
          <img src={circle.coverUrl} alt="cover" className="h-full w-full object-cover" />
        ) : (
          <div className="h-full w-full bg-muted" />
        )}
      </div>
      {/* Avatar + meta */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between mt-3">
        <div className="flex items-center gap-3">
          {circle.avatarUrl ? (
            <img
              src={circle.avatarUrl}
              alt={circle.name}
              className="h-16 w-16 sm:h-20 sm:w-20 rounded-xl border border-card shadow -mt-10"
            />
          ) : (
            <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-xl border border-border shadow -mt-10 grid place-items-center bg-card text-card-foreground">
              <span className="text-lg font-semibold">{circle.name?.charAt(0) || 'C'}</span>
            </div>
          )}
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-semibold">{circle.name}</h1>
              {circle.isPrivate && (
                <span title="Private circle" className="inline-flex items-center gap-1 text-xs text-muted-foreground bg-muted rounded-full px-2 py-0.5">
                  <IconLock /> Private
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground">{circle.tagline}</p>
            <p className="text-xs text-muted-foreground mt-1">{circle.memberCount.toLocaleString()} members · {circle.postCount.toLocaleString()} posts</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="rounded-lg border border-border px-3 py-1.5 text-sm">Share</button>
          <button className="rounded-lg border border-border px-3 py-1.5 text-sm inline-flex items-center gap-2">
            <IconBell /> Notify
          </button>
          {currentUserRole === "guest" ? (
            <JoinButton circleId={circle.id} />
          ) : currentUserRole === 'pending' ? (
            <button className="rounded-lg bg-muted text-muted-foreground px-3 py-1.5 text-sm" disabled>
              Requested
            </button>
          ) : (
            <a href="#composer" className="rounded-lg bg-primary text-primary-foreground px-3 py-1.5 text-sm">New post</a>
          )}
        </div>
      </div>
    </header>
  );
}

function JoinButton({ circleId }: { circleId: string }) {
  const [state, action] = useActionState(requestToJoinCircleAction as any, null);
  return (
    <form action={action}>
      <input type="hidden" name="circleId" value={circleId} />
      <button
        type="submit"
        className="rounded-lg bg-primary text-primary-foreground px-3 py-1.5 text-sm"
        disabled={(state as any)?.pending || (state as any)?.success}
      >
        {(state as any)?.success ? 'Requested' : 'Join'}
      </button>
    </form>
  );
}

function PendingRequests({ circleId, requests, onHandled }: { circleId: string; requests: DbCircleRequest[]; onHandled: (userId: string) => void }) {
  const count = requests.length;
  if (count === 0) return null;
  return (
    <div className="mt-4 border-t pt-3">
      <div className="flex items-center justify-between">
        <h4 className="font-medium">Pending Requests</h4>
        <span className="text-xs rounded-full bg-muted px-2 py-0.5">{count}</span>
      </div>
      <ul className="mt-2 space-y-2">
        {requests.map((r) => (
          <li key={r.userId} className="flex items-center gap-2">
            <img src={r.avatarUrl} alt={r.name} className="h-7 w-7 rounded-full" />
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{r.name}</p>
              <p className="text-xs text-muted-foreground">Requested {new Date(r.requestedAt).toLocaleString()}</p>
            </div>
            <RequestActions circleId={circleId} request={r} onHandled={onHandled} />
          </li>
        ))}
      </ul>
    </div>
  );
}

function RequestActions({ circleId, request, onHandled }: { circleId: string; request: DbCircleRequest; onHandled: (userId: string) => void }) {
  const [role, setRole] = useState<'reader' | 'contributor'>('reader');
  const [state, act] = useActionState(manageCircleRequest as any, null);
  useEffect(() => {
    if ((state as any)?.success) {
      onHandled(request.userId);
    }
  }, [state]);
  return (
    <form action={act} className="ml-auto flex items-center gap-2">
      <input type="hidden" name="circleId" value={circleId} />
      <input type="hidden" name="requestUserId" value={request.userId} />
      <select name="role" value={role} onChange={(e) => setRole(e.target.value as any)} className="rounded-md border border-border bg-transparent px-2 py-1 text-xs">
        <option value="reader" className="bg-card">Reader</option>
        <option value="contributor" className="bg-card">Contributor</option>
      </select>
      <button name="action" value="accept" className="rounded-md border border-border px-2 py-1 text-xs">Accept</button>
      <button name="action" value="reject" className="rounded-md border border-border px-2 py-1 text-xs text-destructive">Reject</button>
    </form>
  );
}

// ---------------------------
// Main Page
// ---------------------------
export default function CircleView({
  initialCircle,
  initialPosts,
  initialMembers,
  currentUserRole: initialRole,
  initialRequests,
  currentUser,
}: {
  initialCircle: Circle;
  initialPosts: Post[];
  initialMembers: Member[];
  currentUserRole?: CircleRole;
  initialRequests?: DbCircleRequest[];
  currentUser?: { email: string; name: string; avatarUrl?: string } | null;
}) {
  const [circle, setCircle] = useState<Circle>(initialCircle);
  const [tab, setTab] = useState<Tab>("Posts");
  const [posts, setPosts] = useState<Post[]>(() => {
    const seed = initialPosts || [];
    const seen = new Set<string>();
    const out: Post[] = [];
    for (const it of seed) {
      if (!it || !it.id) continue;
      if (seen.has(it.id)) continue;
      seen.add(it.id);
      out.push(it);
    }
    return out;
  });
  const [members] = useState<Member[]>(initialMembers || []);
  const [requests, setRequests] = useState<DbCircleRequest[]>(initialRequests || []);
  const currentUserRole: CircleRole = initialRole || "guest";

  // Infinite scroll state
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  // Ensure unique posts by id while preserving order (leftmost wins)
  function dedupeById(items: Post[]): Post[] {
    const seen = new Set<string>();
    const out: Post[] = [];
    for (const it of items) {
      if (!it || !it.id) continue;
      if (seen.has(it.id)) continue;
      seen.add(it.id);
      out.push(it);
    }
    return out;
  }

  const lastCreatedAtMs = useMemo(() => {
    if (posts.length === 0) return undefined;
    const last = posts[posts.length - 1];
    return new Date(last.createdAt).getTime();
  }, [posts]);

  async function loadMore() {
    if (isLoadingMore || !hasMore) return;
    setIsLoadingMore(true);
    try {
      const params = new URLSearchParams();
      if (lastCreatedAtMs) params.set('before', String(lastCreatedAtMs));
      params.set('limit', '10');
      const res = await fetch(`/api/circles/${circle.id}/posts?` + params.toString(), { cache: 'no-store' });
      const data = await res.json();
      const items = (data.items as Post[]) || [];
      // Merge and de-duplicate by id to avoid duplicate keys
      setPosts((prev) => dedupeById([...prev, ...items]));
      setHasMore(Boolean(data.hasMore));
    } catch (e) {
      // ignore
    } finally {
      setIsLoadingMore(false);
    }
  }

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node) return;
    const io = new IntersectionObserver((entries) => {
      const entry = entries[0];
      if (entry.isIntersecting) {
        loadMore();
      }
    }, { rootMargin: '200px' });
    io.observe(node);
    return () => io.disconnect();
  }, [sentinelRef.current, lastCreatedAtMs, hasMore, isLoadingMore]);

  function handleServerCreated(p: Post) {
    // Prepend and de-duplicate so the newest version wins
    setPosts((prev) => dedupeById([p, ...prev]));
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto w-full max-w-7xl px-3 sm:px-6 py-4">
        <CircleHeader circle={circle} currentUserRole={currentUserRole} />

        {/* Tabs */}
        <div className="mt-4">
          <Tabs value={tab} onChange={setTab} />
        </div>

        {/* Content area */}
        <div className="mt-4 grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Main column */}
          <main className="lg:col-span-8 space-y-3 min-w-0">{/* overflow-guard */}
            {tab === "Posts" && (
              <>
                {/* Composer (hide if guest/pending) */}
                {!["guest", "pending"].includes(currentUserRole) && (
                  <PostComposer circleId={circle.id} onCreated={handleServerCreated} currentUser={currentUser} />
                )}

                {/* Filters */}
                <div className="flex items-center justify-between">
                  <div className="flex gap-2 text-sm">
                    <button className="rounded-lg border border-border px-2 py-1.5">Latest</button>
                    <button className="rounded-lg border border-border px-2 py-1.5">Top</button>
                    <button className="rounded-lg border border-border px-2 py-1.5">Questions</button>
                    <button className="rounded-lg border border-border px-2 py-1.5">Debates</button>
                  </div>
                  <div className="text-sm text-muted-foreground">{posts.length} posts</div>
                </div>

                {/* Feed */}
                <div className="space-y-3">
                  {posts.map((p) => (
                    <PostCard key={p.id} p={p} />
                  ))}
                  {hasMore && (
                    <div ref={sentinelRef} className="py-4 text-center text-sm text-muted-foreground">
                      {isLoadingMore ? 'Loading…' : 'Load more'}
                    </div>
                  )}
                </div>
              </>
            )}

            {tab === "Members" && <MembersGrid members={members} />}

            {tab === "About" && <About circle={circle} />}

            {tab === "Rules" && <Rules circle={circle} />}
          </main>

          {/* Side column */}
          <aside className="lg:col-span-4 space-y-3 min-w-0">{/* overflow-guard */}
            {/* Quick Info */}
            <section className="rounded-2xl border border-border bg-card text-card-foreground p-4">
              <h3 className="font-semibold">About this circle</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {circle.tagline}
              </p>
              <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
                <div>
                  <dt className="text-muted-foreground">Created</dt>
                  <dd>{new Date(circle.createdAt).toLocaleDateString()}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Visibility</dt>
                  <dd>{circle.isPrivate ? "Private" : "Public"}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Members</dt>
                  <dd>{circle.memberCount.toLocaleString()}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Posts</dt>
                  <dd>{circle.postCount.toLocaleString()}</dd>
                </div>
              </dl>
              {/* Optional: tags or categories could be shown here when available */}
            </section>

            {/* Moderators */}
            <section className="rounded-2xl border border-border bg-card text-card-foreground p-4">
              <h3 className="font-semibold">Moderation</h3>
              <ul className="mt-2 space-y-2">
                {members
                  .filter((m) => ["owner", "admin", "moderator"].includes(m.role))
                  .slice(0, 5)
                  .map((m) => (
                    <li key={m.id} className="flex items-center gap-2">
                      <img src={m.avatarUrl} alt={m.name} className="h-7 w-7 rounded-full" />
                      <span className="text-sm">{m.name}</span>
                      <span className="ml-auto text-xs rounded-full bg-muted px-2 py-0.5 capitalize">{m.role}</span>
                    </li>
                  ))}
              </ul>
              {["owner", "admin", "moderator"].includes(currentUserRole) && (
                <PendingRequests circleId={circle.id} requests={requests} onHandled={(userId) => setRequests((prev) => prev.filter(r => r.userId !== userId))} />
              )}
              <div className="mt-3 flex gap-2">
                <button className="rounded-md border border-border px-2 py-1 text-sm">Report</button>
                <button className="rounded-md border border-border px-2 py-1 text-sm">Contact mods</button>
              </div>
            </section>

            {/* Admin tools (visible to admin/moderator) */}
            {["owner", "admin", "moderator"].includes(currentUserRole) && (
              <section className="rounded-2xl border border-border bg-card text-card-foreground p-4">
                <h3 className="font-semibold">Admin tools</h3>
                <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                  <button className="rounded-md border border-border px-2 py-1">Edit about</button>
                  <button className="rounded-md border border-border px-2 py-1">Manage rules</button>
                  <button className="rounded-md border border-border px-2 py-1">Member roles</button>
                  <button className="rounded-md border border-border px-2 py-1">Join requests</button>
                  <button className="rounded-md border border-border px-2 py-1">Pin posts</button>
                  <button className="rounded-md border border-border px-2 py-1">Analytics</button>
                </div>
              </section>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}
