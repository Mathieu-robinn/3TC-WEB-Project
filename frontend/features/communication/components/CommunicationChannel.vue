<template>
  <v-container fluid class="fill-height pa-4 communication-container pt-8">
    <v-row class="fill-height no-gutters glass-panel rounded-xl overflow-hidden elevation-10">
      
      <!-- Liste des conversations (Sidebar) -->
      <v-col cols="12" md="4" lg="3" class="fill-height border-e pb-0">
        <ConversationList
          :conversations="commStore.conversations"
          :active-id="commStore.activeConversationId"
          :current-user-id="authStore.user?.id || 0"
          @select="selectConversation"
          @refresh="onConversationCreated"
        />
      </v-col>

      <!-- Fenêtre de chat main -->
      <v-col cols="12" md="8" lg="9" class="fill-height pb-0 bg-transparent">
        <v-fade-transition mode="out-in">
          <ChatWindow
            v-if="commStore.activeConversation"
            :key="commStore.activeConversationId"
            :conversation="commStore.activeConversation"
            :messages="commStore.activeMessages"
            :current-user-id="authStore.user?.id || 0"
            @send="sendMessage"
            @group-updated="commStore.fetchConversations()"
          />
          <div v-else class="d-flex fill-height flex-column align-center justify-center text-medium-emphasis">
            <v-icon icon="mdi-forum-outline" size="80" class="mb-6 opacity-20 color-primary"></v-icon>
            <h2 class="text-h4 font-weight-light mb-2">Messagerie</h2>
            <p class="text-body-1">Sélectionnez une conversation pour commencer à discuter.</p>
          </div>
        </v-fade-transition>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import { useCommunicationStore } from '../stores/communication.store'
import { useAuthStore } from '../../auth/stores/auth'

import ConversationList from './ConversationList.vue'
import ChatWindow from './ChatWindow.vue'

const commStore = useCommunicationStore()
const authStore = useAuthStore()

onMounted(async () => {
  authStore.initFromToken()
  commStore.initSocket()
  await commStore.fetchConversations()
})

onUnmounted(() => {
  commStore.disconnectSocket()
})

const selectConversation = (id: number) => {
  commStore.selectConversation(id)
}

const sendMessage = async (content: string, type: 'TEXT' | 'IMAGE' = 'TEXT') => {
  if (commStore.activeConversationId) {
    await commStore.sendMessage(commStore.activeConversationId, content, type)
  }
}

const onConversationCreated = async (newId?: number) => {
  await commStore.fetchConversations()
  if (newId) {
    commStore.selectConversation(newId)
  }
}
</script>

<style scoped lang="scss">
.communication-container {
  height: calc(100vh - 64px); /* assuming a standard toolbar height */
  background: radial-gradient(circle at top right, rgba(var(--v-theme-primary), 0.05), transparent 40%),
              radial-gradient(circle at bottom left, rgba(var(--v-theme-secondary), 0.05), transparent 40%);
}

.glass-panel {
  background: rgba(var(--v-theme-surface), 0.65);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.08) !important;
}

.border-e {
  border-right: 1px solid rgba(var(--v-theme-on-surface), 0.08);
}
</style>
