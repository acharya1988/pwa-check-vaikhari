
"use server";

import type { Conversation, Message, UserProfile, Circle } from '@/types';
import { stripHtml } from './service-utils';
import { addNotification } from './user.service';
import { getDb } from '@/lib/mongo';
import { serializeMongo } from '@/lib/serialize';

const CONVERSATIONS_COLLECTION = 'conversations';
const CIRCLES_COLLECTION = 'circles';
const MESSAGES_COLLECTION = 'messages';

export async function getConversationsForUser(userId?: string): Promise<Conversation[]> {
  const db = await getDb();
  const conversationsRaw = userId
    ? await db.collection<Conversation>(CONVERSATIONS_COLLECTION).find({ participantIds: userId }).toArray()
    : await db.collection<Conversation>(CONVERSATIONS_COLLECTION).find({}).sort({ 'lastMessage.timestamp': -1 }).toArray();
  const conversations = serializeMongo(conversationsRaw) as Conversation[];

  if (userId) {
    const userCircles = await db
      .collection<Circle>(CIRCLES_COLLECTION)
      .find({ 'members.userId': userId })
      .toArray();

    const circleConversations: Conversation[] = await Promise.all(
      userCircles.map(async (circle) => {
        const lastMsg = await db
          .collection<Message>(MESSAGES_COLLECTION)
          .find({ conversationId: circle.id })
          .sort({ timestamp: -1 })
          .limit(1)
          .toArray();
        let lastMessage = { text: circle.description || 'No messages yet.', timestamp: circle.createdAt } as any;
        if (lastMsg.length > 0) {
          lastMessage = { text: stripHtml(lastMsg[0].content), timestamp: lastMsg[0].timestamp };
        }
        return {
          id: circle.id,
          type: 'group',
          name: circle.name,
          avatarUrl: undefined,
          participants: (circle.members || []).map((m: any) => ({ id: m.userId, name: m.name, avatarUrl: m.avatarUrl })),
          participantIds: (circle.members || []).map((m: any) => m.userId),
          lastMessage,
        } as Conversation;
      })
    );

    const all = [...(conversations as any[]), ...circleConversations];
    const unique = Array.from(new Map(all.map((i: any) => [i.id, i])).values());
    unique.sort((a: any, b: any) => b.lastMessage.timestamp - a.lastMessage.timestamp);
    return serializeMongo(unique) as Conversation[];
  }

  return conversations as Conversation[];
}

async function getConversationOrCircle(conversationId: string): Promise<{ data: Conversation | Circle; collectionName: string } | null> {
  const db = await getDb();
  const convo = await db.collection<Conversation>(CONVERSATIONS_COLLECTION).findOne({ id: conversationId });
  if (convo) return { data: convo as any, collectionName: CONVERSATIONS_COLLECTION };
  const circle = await db.collection<Circle>(CIRCLES_COLLECTION).findOne({ id: conversationId });
  if (circle) return { data: circle as any, collectionName: CIRCLES_COLLECTION };
  return null;
}

export async function getMessagesForConversation(conversationId: string): Promise<Message[]> {
  const convo = await getConversationOrCircle(conversationId);
  if (!convo) return [];
  const db = await getDb();
  const list = await db
    .collection<Message>(MESSAGES_COLLECTION)
    .find({ conversationId })
    .sort({ timestamp: 1 })
    .toArray();
  return serializeMongo(list) as any as Message[];
}

export async function createNewConversation(participants: UserProfile[], metadata: Partial<Omit<Conversation, 'id' | 'participants' | 'lastMessage' | 'participantIds'>>): Promise<Conversation> {
  const db = await getDb();
  const id = globalThis.crypto?.randomUUID ? globalThis.crypto.randomUUID() : (Math.random().toString(36).slice(2) + Date.now());
  const convo: Conversation = {
    id,
    type: metadata.type || 'dm',
    name: metadata.name,
    avatarUrl: metadata.avatarUrl,
    participants: participants.map(p => ({ id: p.email, name: p.name, avatarUrl: p.avatarUrl })),
    participantIds: participants.map(p => p.email),
    lastMessage: { text: 'Conversation started.', timestamp: Date.now() },
    ...metadata,
  } as Conversation;
  await db.collection(CONVERSATIONS_COLLECTION).insertOne(convo as any);
  return convo;
}

export async function sendMessage(conversationId: string, author: UserProfile, content: string): Promise<Message> {
  const convo = await getConversationOrCircle(conversationId);
  if (!convo) throw new Error('Conversation or Circle not found');
  const db = await getDb();
  const { data: conversationData, collectionName } = convo;

  const id = globalThis.crypto?.randomUUID ? globalThis.crypto.randomUUID() : (Math.random().toString(36).slice(2) + Date.now());
  const newMessage: Message = {
    id,
    conversationId,
    authorId: author.email,
    content,
    timestamp: Date.now(),
    read: false,
    type: 'text',
  };
  await db.collection(MESSAGES_COLLECTION).insertOne(newMessage as any);
  const updatePayload: any = { lastMessage: { text: stripHtml(content).substring(0, 100), timestamp: newMessage.timestamp } };
  if (collectionName === CIRCLES_COLLECTION) updatePayload.updatedAt = newMessage.timestamp;
  if (collectionName === CONVERSATIONS_COLLECTION) await db.collection(CONVERSATIONS_COLLECTION).updateOne({ id: conversationId }, { $set: updatePayload });
  else if (collectionName === CIRCLES_COLLECTION) await db.collection(CIRCLES_COLLECTION).updateOne({ id: conversationId }, { $set: updatePayload });

  const participants = 'participants' in conversationData ? conversationData.participants : conversationData.members;
  for (const participant of participants) {
    const participantId = 'id' in participant ? participant.id : participant.userId;
    if (participantId !== author.email) {
      await addNotification(participantId, {
        type: 'message',
        actor: { id: author.email, name: author.name, avatarUrl: author.avatarUrl },
        title: `New Message in ${conversationData.name}`,
        message: stripHtml(content).substring(0, 100),
        link: `/admin/messages`,
      });
    }
  }
  return newMessage;
}
