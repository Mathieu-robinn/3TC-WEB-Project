import { defineStore } from 'pinia';
import { io, Socket } from 'socket.io-client';
import type { Conversation, Message } from '../types/communication';
import { useAuthStore } from '../../auth/stores/auth';

interface CommunicationState {
  conversations: Conversation[];
  activeConversationId: number | null;
  messages: Record<number, Message[]>; // conversationId -> messages
  socket: Socket | null;
  isConnected: boolean;
}

function toIsoString(createdAt: unknown): string {
  if (typeof createdAt === 'string') return createdAt;
  if (createdAt instanceof Date) return createdAt.toISOString();
  return new Date(String(createdAt)).toISOString();
}

/** Payload émis par le backend sur l’événement `conversationNewMessage`. */
function normalizeWsMessage(raw: unknown): Message | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  const id = o.id;
  const conversationId = o.conversationId;
  const senderUserId = o.senderUserId;
  const content = o.content;
  const messageType = o.messageType;
  if (typeof id !== 'number' || typeof conversationId !== 'number' || typeof senderUserId !== 'number') {
    return null;
  }
  if (typeof content !== 'string') return null;
  if (messageType !== 'TEXT' && messageType !== 'IMAGE') return null;

  const senderRaw = o.sender;
  let sender: Message['sender'];
  if (senderRaw && typeof senderRaw === 'object') {
    const s = senderRaw as Record<string, unknown>;
    sender = {
      id: typeof s.id === 'number' ? s.id : senderUserId,
      firstName: typeof s.firstName === 'string' ? s.firstName : '',
      lastName: typeof s.lastName === 'string' ? s.lastName : '',
      email: typeof s.email === 'string' ? s.email : '',
    };
  }

  return {
    id,
    conversationId,
    senderUserId,
    content,
    messageType,
    createdAt: toIsoString(o.createdAt),
    sender,
  };
}

export const useCommunicationStore = defineStore('communication', {
  state: (): CommunicationState => ({
    conversations: [],
    activeConversationId: null,
    messages: {},
    socket: null,
    isConnected: false,
  }),
  getters: {
    activeConversation: (state) =>
      state.conversations.find((c) => c.id === state.activeConversationId),
    activeMessages: (state) =>
      state.activeConversationId ? state.messages[state.activeConversationId] || [] : [],
    totalUnreadCount: (state) =>
      state.conversations.reduce((sum, c) => sum + (c.unreadCount ?? 0), 0),
  },
  actions: {
    initSocket() {
      if (this.socket) return;

      const config = useRuntimeConfig();
      const token = useCookie('auth_token').value;

      if (!token) return;

      this.socket = io(config.public.apiBase, {
        auth: { token },
      });

      this.socket.on('connect', () => {
        this.isConnected = true;
      });

      this.socket.on('disconnect', () => {
        this.isConnected = false;
      });

      this.socket.on('conversationNewMessage', (raw: unknown) => {
        this.handleConversationNewMessage(raw);
      });
    },

    disconnectSocket() {
      if (this.socket) {
        this.socket.removeAllListeners();
        this.socket.disconnect();
        this.socket = null;
        this.isConnected = false;
      }
    },

    handleConversationNewMessage(raw: unknown) {
      const newMessage = normalizeWsMessage(raw);
      if (!newMessage) return;

      const cid = newMessage.conversationId;
      const uid = useAuthStore().user?.id ?? 0;
      const iso = newMessage.createdAt;

      const conv = this.conversations.find((x) => x.id === cid);
      if (conv) {
        conv.lastMessageAt = iso;
      }

      if (this.activeConversationId === cid) {
        const prev = this.messages[cid] ?? [];
        if (prev.some((m) => m.id === newMessage.id)) return;
        this.messages = { ...this.messages, [cid]: [...prev, newMessage] };
        void this.markConversationRead(cid);
      } else if (newMessage.senderUserId !== uid) {
        const c = this.conversations.find((x) => x.id === cid);
        if (c) {
          c.unreadCount = (c.unreadCount ?? 0) + 1;
        }
      }
    },

    async fetchConversations() {
      const nuxtApp = useNuxtApp();
      const api = await nuxtApp.runWithContext(() => useApi());
      try {
        const data = await api.get<Conversation[]>('/messaging/conversations');
        this.conversations = data;
      } catch (e) {
        console.error('Failed to fetch conversations', e);
      }
    },

    async markConversationRead(conversationId: number) {
      const nuxtApp = useNuxtApp();
      const api = await nuxtApp.runWithContext(() => useApi());
      try {
        await api.patch(`/messaging/conversations/${conversationId}/read`, {});
        const conv = this.conversations.find((c) => c.id === conversationId);
        if (conv) conv.unreadCount = 0;
      } catch (e) {
        console.error('Failed to mark conversation read', e);
      }
    },

    async selectConversation(id: number) {
      this.activeConversationId = id;
      await this.fetchMessages(id);
      await this.markConversationRead(id);
    },

    async fetchMessages(conversationId: number) {
      const nuxtApp = useNuxtApp();
      const api = await nuxtApp.runWithContext(() => useApi());
      try {
        const data = await api.get(`/messaging/conversations/${conversationId}/messages`);
        this.messages = { ...this.messages, [conversationId]: data };
      } catch (e) {
        console.error('Failed to fetch messages', e);
      }
    },

    async sendMessage(conversationId: number, content: string, messageType: 'TEXT' | 'IMAGE' = 'TEXT') {
      const nuxtApp = useNuxtApp();
      const api = await nuxtApp.runWithContext(() => useApi());
      try {
        const message = await api.post<Message>(`/messaging/conversations/${conversationId}/messages`, {
          content,
          messageType,
        });
        const prev = this.messages[conversationId] ?? [];
        const exists = prev.find((m) => m.id === message.id);
        if (!exists) {
          const authStore = useAuthStore();
          const m: Message = {
            ...message,
            createdAt: toIsoString(message.createdAt as unknown),
            sender: message.sender ?? {
              id: authStore.user?.id ?? 0,
              firstName: authStore.user?.firstName ?? '',
              lastName: authStore.user?.lastName ?? '',
              email: authStore.user?.email ?? '',
            },
          };
          this.messages = { ...this.messages, [conversationId]: [...prev, m] };
        }
        await this.markConversationRead(conversationId);
      } catch (e) {
        console.error('Failed to send message', e);
      }
    },
  },
});
