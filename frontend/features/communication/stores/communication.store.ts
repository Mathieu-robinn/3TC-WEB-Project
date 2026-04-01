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
    },

    disconnectSocket() {
      if (this.socket) {
        this.socket.removeAllListeners();
        this.socket.disconnect();
        this.socket = null;
        this.isConnected = false;
      }
    },

    attachConversationListeners() {
      if (!this.socket) return;

      this.conversations.forEach((conv) => {
        const eventName = `conversation:${conv.id}:newMessage`;
        this.socket!.off(eventName);
        this.socket!.on(eventName, (newMessage: Message) => {
          const cid = conv.id;
          const uid = useAuthStore().user?.id ?? 0;
          if (this.activeConversationId === cid) {
            if (!this.messages[cid]) {
              this.messages[cid] = [];
            }
            const exists = this.messages[cid].find((m) => m.id === newMessage.id);
            if (!exists) {
              this.messages[cid].push(newMessage);
            }
            void this.markConversationRead(cid);
          } else if (newMessage.senderUserId !== uid) {
            const c = this.conversations.find((x) => x.id === cid);
            if (c) {
              c.unreadCount = (c.unreadCount ?? 0) + 1;
            }
          }
        });
      });
    },

    async fetchConversations() {
      const nuxtApp = useNuxtApp();
      const api = await nuxtApp.runWithContext(() => useApi());
      try {
        const data = await api.get<Conversation[]>('/messaging/conversations');
        this.conversations = data;
        this.attachConversationListeners();
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
      this.attachConversationListeners();
    },

    async fetchMessages(conversationId: number) {
      const nuxtApp = useNuxtApp();
      const api = await nuxtApp.runWithContext(() => useApi());
      try {
        const data = await api.get(`/messaging/conversations/${conversationId}/messages`);
        this.messages[conversationId] = data;
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
        if (!this.messages[conversationId]) {
          this.messages[conversationId] = [];
        }
        const exists = this.messages[conversationId].find((m) => m.id === message.id);
        if (!exists) {
          const authStore = useAuthStore();
          const m: Message = {
            ...message,
            sender: message.sender ?? {
              id: authStore.user?.id ?? 0,
              firstName: authStore.user?.firstName ?? '',
              lastName: authStore.user?.lastName ?? '',
              email: authStore.user?.email ?? '',
            },
          };
          this.messages[conversationId].push(m);
        }
        await this.markConversationRead(conversationId);
      } catch (e) {
        console.error('Failed to send message', e);
      }
    },
  },
});
