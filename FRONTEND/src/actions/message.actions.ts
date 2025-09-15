'use server';

import { revalidatePath } from 'next/cache';
import { 
    getConversationsForUser as getConvos,
    getMessagesForConversation as getMsgs,
    sendMessage as sendMsg,
    createNewConversation as createConvo
} from '@/services/message.service';
import { getUserProfile } from '@/services/user.service';
import { VAIKHARI_USER_PROFILE } from '@/types';
import type { Conversation, UserProfile } from '@/types';

export async function getConversationsForCurrentUser() {
    const user = await getUserProfile();
    return getConvos(user.email);
}

export async function getMessages(conversationId: string) {
    return getMsgs(conversationId);
}

// Back-compat export expected by messages-client
export async function getMessagesForConversation(conversationId: string) {
    return getMsgs(conversationId);
}

export async function sendMessageAction(conversationId: string, content: string) {
    try {
        const user = await getUserProfile();
        const result = await sendMsg(conversationId, user, content);
        revalidatePath('/admin/messages');
        return { success: true, message: result };
    } catch (e: any) {
        return { error: e.message };
    }
}

export async function createNewConversation(participants: UserProfile[], metadata?: Partial<Omit<Conversation, 'id' | 'participants' | 'lastMessage'>>): Promise<Conversation> {
    const newConversation = await createConvo(participants, metadata || {});
    revalidatePath('/admin/messages');
    return newConversation;
}


export async function createNewAIChat() {
    const user = await getUserProfile();
    if (!user) {
        throw new Error("User not found");
    }
    const newConversation = await createConvo([user, VAIKHARI_USER_PROFILE], {
        isAiChat: true,
        name: `Chat with VAIA - ${new Date().toLocaleString()}`,
    });
    revalidatePath('/admin/copilot');
    return newConversation;
}
