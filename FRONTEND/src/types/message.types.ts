
import type { UserProfile } from '.';

export interface ConversationParticipant {
  id: string;
  name: string;
  avatarUrl: string;
}

export interface Conversation {
  id: string;
  type: 'dm' | 'group';
  participants: ConversationParticipant[];
  participantIds: string[]; // For querying
  name?: string; // For groups
  avatarUrl?: string; // For groups
  lastMessage: {
    text: string;
    timestamp: number;
  };
  unreadCount?: number;
  isOnline?: boolean;
}

export interface Message {
  id: string;
  conversationId: string;
  authorId: string;
  content: string;
  timestamp: number;
  read: boolean;
  type: 'text' | 'image' | 'file';
  imageUrl?: string;
}
