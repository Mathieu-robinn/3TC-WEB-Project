<template>
  <v-card
    class="chat-window d-flex flex-column fill-height elevation-3 rounded-lg overflow-hidden border"
    :class="{
      'chat-window--fab-safe': reserveFabSpace,
      'chat-window--mobile': isMobileChat,
    }"
  >
    <!-- Header -->
    <v-toolbar color="surface" elevation="1" class="px-2 px-sm-4 header-glass chat-header">
      <v-btn
        v-if="showMobileBack"
        icon="mdi-arrow-left"
        variant="text"
        class="mr-1"
        aria-label="Retour à la liste des conversations"
        @click="emit('mobileBack')"
      />
      <v-avatar :color="conversation?.type === 'GROUP' ? 'secondary' : 'primary'" size="40" class="mr-3 elevation-2">
        <v-icon :icon="conversation?.type === 'GROUP' ? 'mdi-account-group' : 'mdi-account'" color="white" />
      </v-avatar>
      <div class="d-flex flex-column min-w-0">
        <span class="text-subtitle-1 font-weight-bold lh-normal text-truncate">
          {{ convTitle }}
        </span>
        <span v-if="!isMobileChat" class="text-caption text-medium-emphasis lh-normal">
          {{ conversation?.type === 'GROUP' ? 'Groupe' : 'Privé' }}
        </span>
      </div>
      <v-spacer />
      <v-btn icon="mdi-information-outline" variant="plain" color="primary" @click="showInfo = true" />
    </v-toolbar>

    <!-- Messages Area -->
    <div ref="messagesScrollEl" class="messages-container flex-grow-1 pa-4">
      <div
        v-if="messages.length === 0"
        class="d-flex fill-height align-center justify-center flex-column text-medium-emphasis"
      >
        <v-icon icon="mdi-chat-processing-outline" size="64" class="mb-4 opacity-50" />
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
    </div>

    <!-- Input Area (mobile : fixé au-dessus du clavier via --keyboard-inset) -->
    <div
      ref="composerEl"
      class="chat-composer bg-surface input-glass"
      :class="{ 'chat-composer--pinned': isMobileChat }"
    >
      <v-divider />
      <div class="chat-input-row pa-3">
        <v-textarea
          v-model="newMessage"
          placeholder="Écrivez votre message..."
          variant="solo-filled"
          density="compact"
          hide-details
          rounded="lg"
          rows="1"
          auto-grow
          :max-rows="4"
          class="flex-grow-1 flex-shrink-1 min-w-0 chat-input"
          bg-color="background"
          @focus="onInputFocus"
          @keydown.enter="onEnterKey"
          @click="emit('viewportSync')"
        />
        <v-btn
          icon="mdi-send"
          size="large"
          color="primary"
          variant="flat"
          class="send-btn flex-shrink-0"
          rounded="pill"
          :disabled="!newMessage.trim()"
          aria-label="Envoyer"
          @click="send"
        />
      </div>
    </div>

    <ConversationInfoModal
      v-model="showInfo"
      :conversation="conversation"
      :current-user-id="currentUserId"
      @updated="$emit('groupUpdated')"
    />
  </v-card>
</template>

<script setup lang="ts">
import { ref, watch, nextTick, onMounted, onUnmounted, computed } from 'vue'
import type { Conversation, Message } from '../types/communication'
import MessageBubble from './MessageBubble.vue'
import ConversationInfoModal from './ConversationInfoModal.vue'

const props = withDefaults(
  defineProps<{
    conversation: Conversation
    messages: Message[]
    currentUserId: number
    showMobileBack?: boolean
    isMobileChat?: boolean
    reserveFabSpace?: boolean
  }>(),
  { showMobileBack: false, isMobileChat: false, reserveFabSpace: false },
)

const emit = defineEmits<{
  (e: 'send', content: string, type: 'TEXT' | 'IMAGE'): void
  (e: 'groupUpdated'): void
  (e: 'mobileBack'): void
  (e: 'viewportSync'): void
}>()

const newMessage = ref('')
const messagesScrollEl = ref<HTMLElement | null>(null)
const composerEl = ref<HTMLElement | null>(null)
const showInfo = ref(false)

const COMPOSER_HEIGHT_VAR = '--comm-composer-height'

const updateComposerHeightVar = () => {
  if (!props.isMobileChat || typeof document === 'undefined') return
  const h = composerEl.value?.offsetHeight ?? 72
  document.documentElement.style.setProperty(COMPOSER_HEIGHT_VAR, `${h}px`)
}

const clearComposerHeightVar = () => {
  document.documentElement.style.removeProperty(COMPOSER_HEIGHT_VAR)
}

const convTitle = computed(() => {
  const conv = props.conversation
  if (!conv) return ''
  if (conv.name) return conv.name
  if (conv.type === 'PRIVATE' && conv.participants?.length) {
    const other = conv.participants.find((p) => p.userId !== props.currentUserId)
    if (other?.user) return `${other.user.firstName} ${other.user.lastName}`
  }
  return `Conversation #${conv.id}`
})

const scrollToBottom = async () => {
  await nextTick()
  const el = messagesScrollEl.value
  if (el) el.scrollTop = el.scrollHeight
}

watch(
  () => props.messages,
  () => {
    scrollToBottom()
  },
  { deep: true },
)

let composerResizeObserver: ResizeObserver | null = null

onMounted(() => {
  scrollToBottom()
  nextTick(() => {
    updateComposerHeightVar()
    if (props.isMobileChat && composerEl.value) {
      composerResizeObserver = new ResizeObserver(() => updateComposerHeightVar())
      composerResizeObserver.observe(composerEl.value)
    }
  })
})

onUnmounted(() => {
  composerResizeObserver?.disconnect()
  composerResizeObserver = null
  if (props.isMobileChat) clearComposerHeightVar()
})

watch(
  () => props.isMobileChat,
  (mobile) => {
    if (mobile) nextTick(() => updateComposerHeightVar())
    else clearComposerHeightVar()
  },
)

const onInputFocus = () => {
  scrollToBottom()
  emit('viewportSync')
  nextTick(() => {
    updateComposerHeightVar()
    requestAnimationFrame(() => {
      emit('viewportSync')
      updateComposerHeightVar()
      scrollToBottom()
    })
  })
}

const onEnterKey = (e: KeyboardEvent) => {
  if (e.shiftKey) return
  e.preventDefault()
  send()
}

const send = () => {
  if (!newMessage.value.trim()) return
  emit('send', newMessage.value, 'TEXT')
  newMessage.value = ''
  scrollToBottom()
}
</script>

<style scoped lang="scss">
.chat-window {
  background: rgba(var(--v-theme-surface), 0.7);
  backdrop-filter: blur(16px);
}

.chat-window--mobile {
  display: grid;
  grid-template-rows: auto 1fr auto;
  min-height: 0;
  height: 100%;
  border-radius: 0 !important;
  border: none !important;
  box-shadow: none !important;
}

.chat-header {
  flex-shrink: 0;
  z-index: 2;
}

.chat-window--mobile .chat-header {
  position: sticky;
  top: 0;
}

.messages-container {
  background-color: rgba(var(--v-theme-background), 0.4);
  overflow-y: auto;
  min-height: 0;
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;

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

.chat-window--mobile .messages-container {
  grid-row: 2;
  flex-grow: unset;
}

.chat-composer {
  flex-shrink: 0;
  z-index: 10;
}

.chat-window--mobile .messages-container {
  grid-row: 2;
}

.lh-normal {
  line-height: 1.2;
}

.header-glass {
  background: rgba(var(--v-theme-surface), 0.85) !important;
  backdrop-filter: blur(8px);
}

.input-glass {
  background: rgba(var(--v-theme-surface), 0.85) !important;
  backdrop-filter: blur(8px);
}

.chat-input-row {
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  align-items: flex-end;
  gap: 10px;
  width: 100%;
  box-sizing: border-box;
}

.chat-window--fab-safe .chat-input-row {
  padding-right: 88px !important;
}

.chat-input {
  :deep(.v-field) {
    border-radius: 16px !important;
    box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.05);
  }

  :deep(textarea) {
    font-size: 16px;
    line-height: 1.4;
  }
}

.send-btn {
  transition: transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);

  &:active {
    transform: scale(0.96);
  }
}

@media (max-width: 600px) {
  .chat-window--fab-safe .chat-input-row {
    padding-right: 74px !important;
  }
}
</style>
