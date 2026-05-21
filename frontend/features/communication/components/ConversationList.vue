<template>
  <v-card
    class="conversation-list fill-height d-flex flex-column rounded-lg elevation-3 border"
    :class="{ 'conversation-list--mobile': isMobile }"
  >
    <v-toolbar color="transparent" flat class="px-2 conversation-list__header">
      <v-toolbar-title class="text-h6 font-weight-bold">Messages</v-toolbar-title>
      <v-spacer />
      <v-btn
        v-if="canCreateConversations"
        icon="mdi-plus-circle"
        color="primary"
        variant="tonal"
        size="small"
        @click="showNewChat = true"
      />
    </v-toolbar>

    <v-divider />

    <v-list
      class="flex-grow-1 overflow-y-auto pa-2 bg-transparent conversation-list__scroll"
      bg-color="transparent"
      lines="two"
    >
      <v-list-item
        v-for="conv in conversations"
        :key="conv.id"
        :value="conv.id"
        class="mb-2 rounded-lg transition-swing conversation-item"
        :class="{ 'conversation-item--mobile': isMobile }"
        :active="activeId === conv.id"
        color="primary"
        @click="$emit('select', conv.id)"
      >
        <template #prepend>
          <v-avatar :color="conv.type === 'GROUP' ? 'secondary' : 'primary'" class="elevation-1">
            <v-icon :icon="conv.type === 'GROUP' ? 'mdi-account-group' : 'mdi-account'" />
          </v-avatar>
        </template>

        <v-list-item-title
          :class="conv.unreadCount && conv.unreadCount > 0 ? 'font-weight-bold' : 'font-weight-medium'"
        >
          {{ convTitle(conv) }}
        </v-list-item-title>

        <v-list-item-subtitle
          :class="conv.unreadCount && conv.unreadCount > 0 ? 'text-caption mt-1 font-weight-bold' : 'text-caption mt-1'"
        >
          Dernier message : {{ conv.lastMessageAt ? new Date(conv.lastMessageAt).toLocaleDateString() : 'Jamais' }}
        </v-list-item-subtitle>

        <template v-if="conv.unreadCount && conv.unreadCount > 0" #append>
          <v-chip color="error" size="x-small" variant="flat" class="font-weight-bold">
            {{ conv.unreadCount > 99 ? '99+' : conv.unreadCount }}
          </v-chip>
        </template>
      </v-list-item>

      <div v-if="conversations.length === 0" class="text-center pa-4 text-medium-emphasis">
        <v-icon icon="mdi-message-off" size="large" class="mb-2" />
        <p>Aucune conversation</p>
      </div>
    </v-list>

    <NewConversationModal v-model="showNewChat" @created="onChatCreated" />
  </v-card>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { Conversation } from '../types/communication'
import NewConversationModal from './NewConversationModal.vue'

const props = defineProps<{
  conversations: Conversation[]
  activeId: number | null
  currentUserId: number
  canCreateConversations: boolean
  isMobile?: boolean
}>()

const convTitle = (conv: Conversation): string => {
  if (conv.name) return conv.name
  if (conv.type === 'PRIVATE' && conv.participants?.length) {
    const other = conv.participants.find((p) => p.userId !== props.currentUserId)
    if (other?.user) {
      return `${other.user.firstName} ${other.user.lastName}`
    }
  }
  return `Conversation #${conv.id}`
}

const emit = defineEmits<{
  (e: 'select', id: number): void
  (e: 'refresh', newId?: number): void
}>()

const showNewChat = ref(false)

const onChatCreated = (newId: number) => {
  emit('refresh', newId)
}
</script>

<style scoped lang="scss">
.conversation-list {
  background: rgba(var(--v-theme-surface), 0.6) !important;
  backdrop-filter: blur(12px);
}

.conversation-list--mobile {
  border-radius: 0 !important;
  border: none !important;
  box-shadow: none !important;
  height: 100%;
  min-height: 0;
}

.conversation-list__header {
  flex-shrink: 0;
  position: sticky;
  top: 0;
  z-index: 2;
  background: rgba(var(--v-theme-surface), 0.92);
  backdrop-filter: blur(8px);
}

.conversation-list__scroll {
  min-height: 0;
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
}

.conversation-item {
  border: 1px solid transparent;
  &:hover {
    background: rgba(var(--v-theme-primary), 0.05);
    border-color: rgba(var(--v-theme-primary), 0.1);
    transform: translateY(-1px);
  }
}

.conversation-item--mobile {
  min-height: 56px;
}
</style>
