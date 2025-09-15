
"use server";

import type { UserProfile, Bookmark, Notification } from "@/types";
import { getServerUser } from "@/lib/auth/server";
import { getDb } from "@/lib/mongo";
import { ObjectId } from "mongodb";
import { serializeMongo } from "@/lib/serialize";

export type AppRole = "Researcher" | "Doctor" | "Student" | "Enthusiast";
export interface AppUser {
  uid: string;
  email: string | null;
  name?: string;
  handle?: string; // unique
  role?: AppRole;
  mfaEnrolled?: boolean;
  phoneNumber?: string | null;
  profileCompleted?: boolean;
  providerIds?: string[];
  createdAt?: any;
  lastLoginAt?: any;
}

// Upsert user on login (Mongo)
export async function upsertAndMapUser(params: {
  uid: string;
  email: string | null;
  providerIds: string[];
}) {
  const { uid, email, providerIds } = params;
  const db = await getDb();
  const users = db.collection<any>("users");
  const now = new Date();
  await users.updateOne(
    { _id: uid as any },
    {
      $setOnInsert: { createdAt: now, roles: ["user"], status: "active", mfaEnrolled: false },
      $set: { email, providerIds, lastLoginAt: now },
    },
    { upsert: true }
  );
}

export async function getUserProfileByUid(uid: string): Promise<AppUser | null> {
  const db = await getDb();
  const user = await db.collection<any>("users").findOne({ _id: uid as any });
  if (!user) return null;
  return {
    uid: String(user._id),
    email: user.email || null,
    name: user.displayName,
    handle: (user as any).handle,
    role: (user as any).role,
    mfaEnrolled: user.mfaEnrolled,
    phoneNumber: user.phone || null,
    profileCompleted: (user as any).profileCompleted,
    providerIds: (user as any).providerIds,
    createdAt: user.createdAt,
    lastLoginAt: user.lastLoginAt,
  } as AppUser;
}

// Get profile by email/id (used in actions)
export async function getUserProfileById(id: string): Promise<UserProfile | null> {
  const db = await getDb();
  const prof = await db.collection("user_profiles").findOne({ id });
  return prof ? (serializeMongo(prof) as unknown as UserProfile) : null;
}

export async function setMfaEnrolledAndPhone(uid: string, phoneNumber: string | null) {
  const db = await getDb();
  await db
    .collection<any>("users")
    .updateOne({ _id: uid as any }, { $set: { mfaEnrolled: true, phone: phoneNumber } }, { upsert: true });
}

/** Reserve a handle atomically (docId = handleLower).
 *  Returns true if reserved, false if already taken.
 */
export async function reserveHandle(uid: string, handle: string) {
  const handleLower = handle.trim().toLowerCase();
  const db = await getDb();
  const res = await db
    .collection("reservedHandles")
    .updateOne({ id: handleLower }, { $setOnInsert: { id: handleLower, uid, createdAt: new Date() } }, { upsert: true });
  // If upsertedId exists, we inserted new; otherwise it already existed
  return !!(res.upsertedId && (res.upsertedId as any) !== null);
}

export async function completeUserProfile(
  email: string,
  data: { name: string; handle: string; role: AppRole }
) {
  const db = await getDb();
  await db
    .collection("user_profiles")
    .updateOne(
      { id: email },
      { $set: { ...data, profileCompleted: true, updatedAt: new Date() }, $setOnInsert: { createdAt: new Date(), email } },
      { upsert: true }
    );
}

// --- Compat helpers expected by rest of app ---

export async function isSuperAdmin(userId: string): Promise<boolean> {
  const db = await getDb();
  // Check roles in Mongo
  const byEmail = await db.collection("users").findOne({ email: userId });
  if (byEmail && Array.isArray((byEmail as any).roles) && (byEmail as any).roles.includes("superadmin")) return true;
  // Bootstrap fallback via env
  const roots = (process.env.ROOT_ADMIN_EMAILS || "").split(/[,\s]+/).map((s) => s.trim().toLowerCase());
  return !!(userId && roots.includes(userId.toLowerCase()));
}

export async function getUserProfile(userId?: string): Promise<UserProfile> {
  const db = await getDb();
  const server = await getServerUser();
  const email = userId || server?.email || server?.uid || "";
  if (!email) throw new Error("No authenticated user");
  const prof = await db.collection("user_profiles").findOne({ id: email });
  if (!prof) throw new Error("User profile not found");
  return serializeMongo(prof) as unknown as UserProfile;
}

export async function updateUserProfileInService(
  data: Partial<UserProfile>,
  userId?: string
): Promise<UserProfile> {
  const db = await getDb();
  const server = await getServerUser();
  const email = userId || server?.email || server?.uid || "";
  if (!email) throw new Error("No authenticated user");
  await db
    .collection("user_profiles")
    .updateOne({ id: email }, { $set: { ...data, updatedAt: Date.now() }, $setOnInsert: { createdAt: Date.now(), id: email } }, { upsert: true });
  const prof = await db.collection("user_profiles").findOne({ id: email });
  return serializeMongo(prof) as unknown as UserProfile;
}

export async function createUserProfile(data: {
  email: string;
  name: string;
  avatarUrl?: string;
}): Promise<UserProfile> {
  const db = await getDb();
  const defaults: any = {
    name: data.name,
    email: data.email,
    avatarUrl: data.avatarUrl || "/media/default-avatar.png",
    coverUrl: "/media/default-cover.png",
    coverPosition: "50% 50%",
    bio: "",
    verificationStatus: "unverified",
    mfaEnrolled: false as any,
    onboardingCompleted: false as any,
    stats: { views: 0, messages: 0, circles: 0, rating: 0, bookCount: 0, articlesPublished: 0, whitepapersPublished: 0 } as any,
    createdAt: Date.now() as any,
    updatedAt: Date.now() as any,
  };
  await db
    .collection("user_profiles")
    .updateOne({ id: data.email }, { $setOnInsert: defaults as any }, { upsert: true });
  const prof = await db.collection("user_profiles").findOne({ id: data.email });
  return serializeMongo(prof) as unknown as UserProfile;
}

// --- Social graph helpers (compat) ---
// Note: These helpers are referenced by client components. Implement minimal
// versions that query expected collections if present; otherwise return [].

export async function getFollowers(userId: string): Promise<UserProfile[]> {
  if (!userId) return [];
  const db = await getDb();
  // Expect a collection mapping follower -> target
  const rel = await db.collection<any>("user_follows").find({ targetId: userId }).toArray();
  const ids = Array.from(new Set(rel.map((r: any) => r.userId).filter(Boolean)));
  if (!ids.length) return [];
  const profiles = await db.collection("user_profiles").find({ id: { $in: ids } }).toArray();
  return serializeMongo(profiles) as unknown as UserProfile[];
}

export async function getFollowing(userId: string): Promise<UserProfile[]> {
  if (!userId) return [];
  const db = await getDb();
  const rel = await db.collection<any>("user_follows").find({ userId }).toArray();
  const ids = Array.from(new Set(rel.map((r: any) => r.targetId).filter(Boolean)));
  if (!ids.length) return [];
  const profiles = await db.collection("user_profiles").find({ id: { $in: ids } }).toArray();
  return serializeMongo(profiles) as unknown as UserProfile[];
}

export async function getBookmarksForUser(userId: string): Promise<Bookmark[]> {
  if (!userId) return [];
  const db = await getDb();
  const list = await db.collection("user_bookmarks").find({ userId }).toArray();
  return serializeMongo(list) as unknown as Bookmark[];
}

export async function toggleBookmark(
  bookmarkData: Omit<Bookmark, "id" | "createdAt" | "isBookmark">
): Promise<{ action: "added" | "removed" }> {
  const { userId } = bookmarkData as any;
  const db = await getDb();
  const docId = `${(bookmarkData as any).type}-${(bookmarkData as any).bookId || (bookmarkData as any).blockId || (bookmarkData as any).postId || ""}-${(bookmarkData as any).chapterId || ""}-${(bookmarkData as any).verse || ""}`;
  const existing = await db.collection("user_bookmarks").findOne({ id: docId, userId });
  if (existing && (existing as any).isBookmark) {
    await db.collection("user_bookmarks").updateOne({ id: docId, userId }, { $set: { isBookmark: false } });
    return { action: "removed" };
  } else {
    await db
      .collection("user_bookmarks")
      .updateOne(
        { id: docId, userId },
        { $set: { ...(bookmarkData as any), id: docId, createdAt: Date.now(), isBookmark: true } },
        { upsert: true }
      );
    return { action: "added" };
  }
}

export async function addNotification(
  userId: string,
  notif: Omit<Notification, "id" | "userId" | "isRead" | "createdAt"> & { id?: string }
) {
  const db = await getDb();
  const id = (notif as any).id || new ObjectId().toString();
  await db
    .collection("user_notifications")
    .updateOne(
      { id, userId },
      { $set: { ...(notif as any), id, userId, isRead: false, createdAt: Date.now() } },
      { upsert: true }
    );
}

export async function getNotifications(userId: string): Promise<Notification[]> {
  const db = await getDb();
  const list = await db
    .collection("user_notifications")
    .find({ userId })
    .sort({ createdAt: -1 })
    .toArray();
  return serializeMongo(list) as unknown as Notification[];
}

// Save a user's block note (articles → drift/notes)
export async function saveBlockNoteToDb(input: {
  userId: string;
  bookId: string;
  chapterId: string;
  verse: string | number;
  blockId: string;
  note: string;
  bookName?: string;
  articleTitle?: string;
  blockTextPreview?: string;
  type?: string;
}) {
  const db = await getDb();
  const id = new ObjectId().toString();
  const doc = {
    ...input,
    id,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  } as any;
  await db.collection('user_notes').updateOne({ id }, { $set: doc }, { upsert: true });
  return { id };
}

// Discoverable users for people browser, mentions, etc.
export async function getDiscoverableUsers(): Promise<UserProfile[]> {
  const db = await getDb();
  const list = await db
    .collection<UserProfile>("user_profiles")
    .find({})
    .project({ _id: 0 })
    .sort({ "stats.views": -1, createdAt: -1 })
    .limit(300)
    .toArray();
  return serializeMongo(list) as unknown as UserProfile[];
}
