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
        this.socket.disconnect();
        this.socket = null;
        this.isConnected = false;
      }
    },

    async fetchConversations() {
      const nuxtApp = useNuxtApp();
      const api = await nuxtApp.runWithContext(() => useApi());
      try {
        const data = await api.get('/messaging/conversations');
        this.conversations = data;
      } catch (e) {
        console.error('Failed to fetch conversations', e);
      }
    },

    async selectConversation(id: number) {
      this.activeConversationId = id;
      // Always reload messages when switching conversations to pick up new ones
      await this.fetchMessages(id);
      this.listenToConversation(id);
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
        // Immediately push the sent message to the local store (don't wait for WS)
        if (!this.messages[conversationId]) {
          this.messages[conversationId] = [];
        }
        // Avoid duplicates in case WS also delivers it
        const exists = this.messages[conversationId].find(m => m.id === message.id);
        if (!exists) {
          // Get current user info for the sender field
          const authStore = useAuthStore();
          const m: Message = {
            ...message,
            sender: message.sender ?? {
              id: authStore.user?.id ?? 0,
              firstName: authStore.user?.firstName ?? '',
              lastName: authStore.user?.lastName ?? '',
              email: authStore.user?.email ?? '',
            }
          };
          this.messages[conversationId].push(m);
        }
      } catch (e) {
        console.error('Failed to send message', e);
      }
    },

    listenToConversation(conversationId: number) {
      if (!this.socket) return;
      const eventName = `conversation:${conversationId}:newMessage`;
      
      // Ensure we don't listen multiple times
      this.socket.off(eventName);
      this.socket.on(eventName, (newMessage: Message) => {
        if (!this.messages[conversationId]) {
          this.messages[conversationId] = [];
        }
        // Prevent duplicate if we already optimistically added it
        const exists = this.messages[conversationId].find(m => m.id === newMessage.id);
        if (!exists) {
          this.messages[conversationId].push(newMessage);
        }
      });
    }
  }
});
