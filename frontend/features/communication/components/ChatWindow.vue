<template>
  <v-card class="chat-window d-flex flex-column fill-height elevation-3 rounded-lg overflow-hidden border">
    
    <!-- Header -->
    <v-toolbar color="surface" elevation="1" class="px-4 header-glass">
      <v-avatar :color="conversation?.type === 'GROUP' ? 'secondary' : 'primary'" size="40" class="mr-3 elevation-2">
        <v-icon :icon="conversation?.type === 'GROUP' ? 'mdi-account-group' : 'mdi-account'" color="white"></v-icon>
      </v-avatar>
      <div class="d-flex flex-column">
        <span class="text-subtitle-1 font-weight-bold lh-normal">
          {{ convTitle }}
        </span>
        <span class="text-caption text-medium-emphasis lh-normal">
          {{ conversation?.type === 'GROUP' ? 'Groupe' : 'Privé' }}
        </span>
      </div>
      <v-spacer></v-spacer>
      <v-btn icon="mdi-information-outline" variant="plain" color="primary" @click="showInfo = true"></v-btn>
    </v-toolbar>

    <!-- Messages Area -->
    <v-card-text class="messages-container flex-grow-1 overflow-y-auto pa-4" ref="messagesContainer">
      <div v-if="messages.length === 0" class="d-flex fill-height align-center justify-center flex-column text-medium-emphasis">
        <v-icon icon="mdi-chat-processing-outline" size="64" class="mb-4 opacity-50"></v-icon>
        <div class="text-h6">Envoyez le premier message</div>
        <p class="text-body-2">Cette conversation est vide.</p>
      </div>
      
      <MessageBubble
        v-for="(msg, index) in messages"
        :key="msg.id"
        :message="msg"
        :current-user-id="currentUserId"
        :show-name="true"
        :prev-message="index > 0 ? messages[index - 1] : null"
        :next-message="index < messages.length - 1 ? messages[index + 1] : null"
      />
    </v-card-text>

    <!-- Input Area -->
    <v-divider></v-divider>
    <v-card-actions class="pa-3 bg-surface input-glass d-flex align-center">
      <v-text-field
        v-model="newMessage"
        placeholder="Écrivez votre message..."
        variant="solo-filled"
        density="compact"
        hide-details
        rounded="pill"
        class="flex-grow-1 px-1 chat-input"
        bg-color="background"
        @keyup.enter="send"
      >
        <template v-slot:append-inner>
          <v-btn 
            icon="mdi-send" 
            size="small"
            color="primary"
            variant="flat"
            class="send-btn"
            :disabled="!newMessage.trim()"
            @click="send"
          ></v-btn>
        </template>
      </v-text-field>
    </v-card-actions>

    <ConversationInfoModal
      v-model="showInfo"
      :conversation="conversation"
      :current-user-id="currentUserId"
      @updated="$emit('groupUpdated')"
    />
  </v-card>
</template>

<script setup lang="ts">
import { ref, watch, nextTick, onMounted, computed } from 'vue'
import type { Conversation, Message } from '../types/communication'
import MessageBubble from './MessageBubble.vue'
import ConversationInfoModal from './ConversationInfoModal.vue'

const props = defineProps<{
  conversation: Conversation;
  messages: Message[];
  currentUserId: number;
}>()

const emit = defineEmits<{
  (e: 'send', content: string, type: 'TEXT' | 'IMAGE'): void
  (e: 'groupUpdated'): void
}>()

const newMessage = ref('')
const messagesContainer = ref<HTMLElement | null>(null)
const showInfo = ref(false)

// Smart title for private conversations: show the other person's name
const convTitle = computed(() => {
  const conv = props.conversation
  if (!conv) return ''
  if (conv.name) return conv.name
  if (conv.type === 'PRIVATE' && conv.participants?.length) {
    const other = conv.participants.find(p => p.userId !== props.currentUserId)
    if (other?.user) return `${other.user.firstName} ${other.user.lastName}`
  }
  return `Conversation #${conv.id}`
})

const scrollToBottom = async () => {
  await nextTick()
  if (messagesContainer.value) {
    const el = messagesContainer.value.$el || messagesContainer.value
    el.scrollTop = el.scrollHeight
  }
}

watch(() => props.messages, () => {
  scrollToBottom()
}, { deep: true })

onMounted(() => {
  scrollToBottom()
})

const send = () => {
  if (!newMessage.value.trim()) return
  emit('send', newMessage.value, 'TEXT')
  newMessage.value = ''
}
</script>

<style scoped lang="scss">
.chat-window {
  background: rgba(var(--v-theme-surface), 0.7);
  backdrop-filter: blur(16px);
}

.messages-container {
  background-color: rgba(var(--v-theme-background), 0.4);
  /* Custom scrollbar for webkit */
  &::-webkit-scrollbar {
    width: 6px;
  }
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  &::-webkit-scrollbar-thumb {
    background-color: rgba(var(--v-theme-on-surface), 0.2);
    border-radius: 10px;
  }
}

.lh-normal {
  line-height: 1.2;
}

.header-glass {
  background: rgba(var(--v-theme-surface), 0.85) !important;
  backdrop-filter: blur(8px);
  z-index: 10;
}

.input-glass {
  background: rgba(var(--v-theme-surface), 0.85) !important;
  backdrop-filter: blur(8px);
  z-index: 10;
}

.chat-input {
  :deep(.v-field) {
    border-radius: 24px !important;
    box-shadow: inset 0 2px 4px rgba(0,0,0,0.05);
  }
}

.send-btn {
  border-radius: 50%;
  margin-right: -4px;
  transition: transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  
  &:active {
    transform: scale(0.9);
  }
}
</style>
