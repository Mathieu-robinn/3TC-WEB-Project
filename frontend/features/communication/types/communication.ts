export type ConversationType = 'PRIVATE' | 'GROUP';
export type MessageType = 'TEXT' | 'IMAGE';
export type ParticipantRole = 'ADMIN' | 'MEMBER';

export interface UserSnippet {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
}

export interface ConversationParticipant {
  id: number;
  userId: number;
  conversationId: number;
  role: ParticipantRole;
  joinedAt: string;
  lastReadMessageId?: number | null;
  user?: UserSnippet;
}

export interface Conversation {
  id: number;
  name?: string | null;
  type: ConversationType;
  createdByUserId: number;
  lastMessageAt?: string | null;
  participants?: ConversationParticipant[];
  /** Nombre de messages des autres non lus (renvoyé par l’API) */
  unreadCount?: number;
}

export interface Message {
  id: number;
  conversationId: number;
  senderUserId: number;
  content: string;
  messageType: MessageType;
  createdAt: string;
  sender?: UserSnippet;
}
