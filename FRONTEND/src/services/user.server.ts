import type { AppUser } from "./user.service";
import { getDb } from "@/lib/mongo";
import { serializeMongo } from "@/lib/serialize";

export async function getUserProfileByUidServer(uid: string): Promise<AppUser | null> {
  const db = await getDb();
  const user = await db.collection("users").findOne({ _id: uid });
  if (!user) return null;
  return {
    uid: user._id,
    email: (user as any).email || null,
    name: (user as any).displayName,
    phoneNumber: (user as any).phone || null,
    mfaEnrolled: !!(user as any).mfaEnrolled,
    createdAt: (user as any).createdAt,
    lastLoginAt: (user as any).lastLoginAt,
  } as AppUser;
}

export async function getUserProfileByEmailServer(email: string): Promise<AppUser | null> {
  const db = await getDb();
  const profile = await db.collection("user_profiles").findOne({ id: email });
  return profile ? (serializeMongo(profile) as any as AppUser) : null;
}
