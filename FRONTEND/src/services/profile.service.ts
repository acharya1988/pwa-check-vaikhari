
'use server';

import slugify from 'slugify';
import type { Organization, OrgInput, UserProfile, Circle, CircleMember, CircleRequest } from '@/types';
import { getUserProfile, isSuperAdmin } from './user.service';
import { getDb } from '@/lib/mongo';
import { serializeMongo } from '@/lib/serialize';

const ORGANIZATIONS_COLLECTION = 'organizations';
const CIRCLES_COLLECTION = 'circles';


// --- Organization Service Functions ---

export async function getOrganizations(): Promise<Organization[]> {
    const dbm = await getDb();
    const list = await dbm.collection<Organization>(ORGANIZATIONS_COLLECTION).find({}).toArray();
    return serializeMongo(list) as Organization[];
}

export async function getOrganization(id: string): Promise<Organization | null> {
    const dbm = await getDb();
    const org = await dbm.collection<Organization>(ORGANIZATIONS_COLLECTION).findOne({ id });
    return org ? (serializeMongo(org) as Organization) : null;
}

export async function createOrganization(
    owner: UserProfile,
    data: Partial<Omit<Organization, 'id' | 'ownerId' | 'createdAt' | 'members'>>
): Promise<Organization> {
    try {
        if (!data.name) throw new Error("Organization name is required.");

        const id = slugify(data.name, { lower: true, strict: true });
        if (!id) throw new Error("Could not generate a valid ID from the organization name.");
        
        const dbm = await getDb();
        const exists = await dbm.collection(ORGANIZATIONS_COLLECTION).findOne({ id });
        if (exists) {
            throw new Error('An organization with this name already exists.');
        }

        const newOrganization: Organization = {
            ...(data as any),
            id,
            ownerId: owner.email,
            createdAt: Date.now(),
            updatedAt: Date.now(),
            members: [
                {
                    userId: owner.email,
                    name: owner.name,
                    avatarUrl: owner.avatarUrl,
                    role: 'admin'
                }
            ],
        };

        const dbm2 = await getDb();
        await dbm2.collection(ORGANIZATIONS_COLLECTION).insertOne(newOrganization as any);
        return newOrganization;
    } catch (error: any) {
        console.error("❌ Error in createOrganization:", error);
        throw error;
    }
}


export async function updateOrganization(
  orgId: string,
  data: Partial<Omit<Organization, 'id' | 'ownerId' | 'createdAt' | 'members'>>
): Promise<Organization> {
  const user = await getUserProfile();
  const dbm = await getDb();
  const existingOrg = await dbm.collection<Organization>(ORGANIZATIONS_COLLECTION).findOne({ id: orgId });
  if (!existingOrg) {
    throw new Error('Organization not found.');
  }

  if (existingOrg.ownerId !== user.email && !await isSuperAdmin(user.email)) {
    throw new Error('You are not authorized to edit this organization.');
  }

  const updatedData = {
    ...data,
    updatedAt: Date.now(),
  };
  await dbm.collection(ORGANIZATIONS_COLLECTION).updateOne({ id: orgId }, { $set: updatedData });
  return { ...(existingOrg as any), ...updatedData } as Organization;
}

export async function deleteOrganization(organizationId: string): Promise<void> {
    const user = await getUserProfile();
    const dbm = await getDb();
    const org = await dbm.collection<Organization>(ORGANIZATIONS_COLLECTION).findOne({ id: organizationId });
    if (!org) throw new Error("Organization not found");
    if (org.ownerId !== user.email && !(await isSuperAdmin(user.email))) {
        throw new Error("You are not authorized to delete this organization.");
    }
    await dbm.collection(ORGANIZATIONS_COLLECTION).deleteOne({ id: organizationId });
}


// --- Circle Service Functions ---

export async function getCircles(): Promise<Circle[]> {
  const dbm = await getDb();
  const list = await dbm.collection<Circle>(CIRCLES_COLLECTION).find({}).toArray();
  return serializeMongo(list) as Circle[];
}

export async function getCircle(id: string): Promise<Circle | null> {
  const dbm = await getDb();
  const circle = await dbm.collection<Circle>(CIRCLES_COLLECTION).findOne({ id });
  return circle ? (serializeMongo(circle) as Circle) : null;
}

export async function getCirclesForUser(userId: string): Promise<Circle[]> {
  if (!userId) return [];
  const dbm = await getDb();
  const list = await dbm
    .collection<Circle>(CIRCLES_COLLECTION)
    .find({ 'members.userId': userId })
    .toArray();
  return serializeMongo(list) as Circle[];
}

export async function getAdministeredCircles(userId?: string): Promise<Circle[]> {
    const targetUserId = userId || (await getUserProfile()).email;
    if (!targetUserId) return [];

    const circles = await getCirclesForUser(targetUserId);
    const isAdmin = await isSuperAdmin(targetUserId);
    return circles.filter(c => {
        const isCircleAdmin = c.members.some(m => m.userId === targetUserId && m.role === 'admin');
        return isAdmin || c.ownerId === targetUserId || isCircleAdmin;
    });
}

type CreateCircleData = {
    name: string;
    description: string;
    type: 'personal' | 'organization';
    genreId: string;
    categoryId: string;
    subCategoryId?: string;
    avatarUrl?: string;
    coverUrl?: string;
};

export async function createCircle(
  owner: { id: string; name: string; avatarUrl: string; },
  data: CreateCircleData
): Promise<Circle> {
    const dbm = await getDb();
    const id = slugify(data.name, { lower: true, strict: true }) || `circle-${Date.now()}`;
    const existing = await dbm.collection<Circle>('circles').findOne({ id });
    if (existing) {
        throw new Error('A circle with this name already exists.');
    }
    
    const newCircle: Circle = {
        id,
        name: data.name,
        description: data.description,
        type: data.type,
        genreId: data.genreId,
        categoryId: data.categoryId,
        subCategoryId: data.subCategoryId,
        ownerId: owner.id,
        avatarUrl: data.avatarUrl,
        coverUrl: data.coverUrl,
        members: [{ userId: owner.id, name: owner.name, avatarUrl: owner.avatarUrl, role: 'admin' }],
        requests: [],
        createdAt: Date.now()
    };
    
    await dbm.collection('circles').insertOne(newCircle as any);
    return newCircle;
}

export async function deleteCircle(circleId: string): Promise<void> {
    const user = await getUserProfile();
    const dbm = await getDb();
    const circle = await dbm.collection<Circle>('circles').findOne({ id: circleId });
    if (!circle) throw new Error('Circle not found for deletion.');
    const isAdmin = await isSuperAdmin(user.email);
    if (!isAdmin && circle.ownerId !== user.email) {
        throw new Error('You are not authorized to delete this circle.');
    }

    if (circleId.startsWith('general-circle-')) {
        throw new Error('The General circle cannot be deleted.');
    }
    await dbm.collection('circles').deleteOne({ id: circleId });
}

export async function handleCircleRequest(
    circleId: string, 
    requestUserId: string, 
    action: 'accept' | 'reject',
    role?: CircleMember['role']
): Promise<void> {
    const dbm = await getDb();
    const circle = await dbm.collection<Circle>('circles').findOne({ id: circleId });
    if (!circle) throw new Error('Circle not found.');

    const req = circle.requests?.find((r) => r.userId === requestUserId);
    if (!req) throw new Error('Request not found.');

    const ops: any = { $pull: { requests: { userId: requestUserId } } };
    if (action === 'accept') {
        if (!role) throw new Error('A role is required to accept a member.');
        const member = { userId: req.userId, name: req.name, avatarUrl: req.avatarUrl, role } as CircleMember;
        ops.$addToSet = { members: member };
    }
    await dbm.collection('circles').updateOne({ id: circleId }, ops);
}

export async function addUserToCircle(
  circleId: string, 
  userToAdd: { userId: string, name: string, avatarUrl: string },
  role: 'reader' | 'contributor'
): Promise<void> {
    const dbm = await getDb();
    const circle = await dbm.collection<Circle>('circles').findOne({ id: circleId });
    if (!circle) throw new Error('Circle not found.');
    const isAlready = circle.members?.some(m => m.userId === userToAdd.userId);
    if (isAlready) throw new Error('User is already a member of this circle.');
    await dbm.collection('circles').updateOne(
      { id: circleId },
      { $addToSet: { members: { ...userToAdd, role } } }
    );
}

export async function requestToJoinCircle(circleId: string, message?: string): Promise<void> {
  const dbm = await getDb();
  const user = await getUserProfile();
  const circle = await dbm.collection<Circle>('circles').findOne({ id: circleId });
  if (!circle) throw new Error('Circle not found.');
  const isMember = circle.members?.some(m => m.userId === user.email);
  if (isMember) return;
  const already = circle.requests?.some(r => r.userId === user.email);
  if (already) return;
  const req = {
    userId: user.email,
    name: user.name,
    avatarUrl: user.avatarUrl,
    message,
    requestedAt: Date.now(),
  } as any;
  await dbm.collection('circles').updateOne(
    { id: circleId },
    { $addToSet: { requests: req } }
  );
}


// --- User Profile Service Functions ---

export async function toggleFollow(
  currentUser: UserProfile,
  targetUser: UserProfile
): Promise<{ action: 'followed' | 'unfollowed' }> {
  const dbm = await getDb();
  const current = await dbm.collection('user_profiles').findOne({ id: currentUser.email });
  const isFollowing = Array.isArray((current as any)?.following) && (current as any).following.includes(targetUser.email);

  if (isFollowing) {
    await Promise.all([
      dbm.collection('user_profiles').updateOne({ id: currentUser.email }, { $pull: { following: targetUser.email } }),
      dbm.collection('user_profiles').updateOne({ id: targetUser.email }, { $pull: { followers: currentUser.email } }),
    ]);
    return { action: 'unfollowed' };
  } else {
    await Promise.all([
      dbm.collection('user_profiles').updateOne({ id: currentUser.email }, { $addToSet: { following: targetUser.email } }, { upsert: true }),
      dbm.collection('user_profiles').updateOne({ id: targetUser.email }, { $addToSet: { followers: currentUser.email } }, { upsert: true }),
    ]);
    return { action: 'followed' };
  }
}
