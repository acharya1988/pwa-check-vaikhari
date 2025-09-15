"use server";

import slugify from "slugify";
import type { Organization, OrgInput } from "@/types";
import { getUserProfile, isSuperAdmin } from "./user.service";
import { getDb } from "@/lib/mongo";
import { serializeMongo } from "@/lib/serialize";

const ORGANIZATIONS_COLLECTION = "organizations";

export async function getOrganizations(): Promise<Organization[]> {
  const db = await getDb();
  const all = await db.collection<Organization>(ORGANIZATIONS_COLLECTION).find({}).toArray();
  return serializeMongo(all) as Organization[];
}

export async function getOrganization(id: string): Promise<Organization | null> {
  const db = await getDb();
  const org = await db.collection<Organization>(ORGANIZATIONS_COLLECTION).findOne({ id });
  return (org ? (serializeMongo(org) as Organization) : null);
}

export async function checkOrganizationHandle(handle: string): Promise<{ available: boolean }> {
  if (!handle) return { available: false };
  const db = await getDb();
  const exists = await db.collection(ORGANIZATIONS_COLLECTION).findOne({ id: handle });
  return { available: !exists };
}

export async function getAdministeredOrganizations(): Promise<Organization[]> {
  const db = await getDb();
  const user = await getUserProfile();
  const isAdmin = await isSuperAdmin(user.email);

  if (isAdmin) return getOrganizations();

  const [owned, member] = await Promise.all([
    db.collection<Organization>(ORGANIZATIONS_COLLECTION).find({ ownerId: user.email }).toArray(),
    db
      .collection<Organization>(ORGANIZATIONS_COLLECTION)
      .find({ "members.userId": user.email, "members.role": { $in: ["admin", "editor"] } })
      .toArray(),
  ]);

  const combined = [...owned, ...member] as Organization[];
  const unique = Array.from(new Map(combined.map((o) => [o.id, o])).values());
  return serializeMongo(unique) as Organization[];
}

export async function saveOrganizationProfile(orgData: OrgInput): Promise<Organization> {
  const db = await getDb();
  const user = await getUserProfile();
  const id = orgData.handle;
  const existing = (await db.collection<Organization>(ORGANIZATIONS_COLLECTION).findOne({ id })) as Organization | null;

  if (existing) {
    if (existing.ownerId !== user.email && !(await isSuperAdmin(user.email))) {
      throw new Error("You are not authorized to edit this organization.");
    }
    const updated: Partial<Organization> = { ...(orgData as any), updatedAt: Date.now() };
    await db.collection(ORGANIZATIONS_COLLECTION).updateOne({ id }, { $set: updated });
    return serializeMongo({ ...existing, ...updated }) as Organization;
  } else {
    const created: Organization = {
      ...(orgData as any),
      id,
      ownerId: user.email,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      verificationStatus: "pending",
    } as any;
    await db.collection(ORGANIZATIONS_COLLECTION).insertOne(created as any);
    return serializeMongo(created) as Organization;
  }
}

