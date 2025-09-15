
'use server';

import type { VaiaSession, VaiaInteraction } from '@/types';
import { getDb } from '@/lib/mongo';

// Firestore Integration: This service now interacts with the 'vaia_sessions' collection in Firestore.

export async function getInteractionLogs(): Promise<VaiaSession[]> {
  const db = await getDb();
  return (await db
    .collection<VaiaSession>('vaia_sessions')
    .find({})
    .sort({ timestamp: -1 })
    .toArray()) as any as VaiaSession[];
}

export async function logInteraction(
    sessionId: string,
    userId: string,
    userRole: string,
    userInteraction: VaiaInteraction,
    assistantInteraction: VaiaInteraction
): Promise<void> {
    const db = await getDb();
    const update: any = {
      // Initialize metadata only on first insert. Do not touch 'interactions' here
      // to avoid conflicts with the $push operator below.
      $setOnInsert: { sessionId, userId, userRole },
      $set: { timestamp: Date.now() },
      // $push will create the 'interactions' array if it doesn't exist.
      $push: { interactions: { $each: [userInteraction as any, assistantInteraction as any] } },
    };
    await db
      .collection<VaiaSession>('vaia_sessions')
      .updateOne(
        { sessionId },
        update,
        { upsert: true }
      );
}
