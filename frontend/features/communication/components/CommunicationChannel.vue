<template>
  <v-container
    fluid
    class="fill-height communication-container"
    :class="{
      'communication-container--mobile': isMobileComm,
      'communication-container--chat-open': isMobileComm && mobileChatPane,
      'pa-0': isMobileComm,
      'pa-4 pt-4 pt-md-8': !isMobileComm,
    }"
  >
    <v-row
      class="fill-height no-gutters glass-panel overflow-hidden"
      :class="{
        'rounded-xl elevation-10': !isMobileComm,
        'glass-panel--mobile-list': isMobileComm && !mobileChatPane,
        'glass-panel--mobile-chat': isMobileComm && mobileChatPane,
      }"
    >
      <!-- Liste des conversations -->
      <v-col
        v-show="showConversationList"
        cols="12"
        md="4"
        lg="3"
        class="fill-height comm-list-col pb-0"
      >
        <div class="comm-list-shell">
          <ConversationList
            :conversations="commStore.conversations"
            :active-id="commStore.activeConversationId"
            :current-user-id="authStore.user?.id || 0"
            :can-create-conversations="authStore.user?.role === 'ADMIN' || authStore.user?.role === 'SUPER_ADMIN'"
            :is-mobile="isMobileComm"
            @select="selectConversation"
            @refresh="onConversationCreated"
          />
        </div>
      </v-col>

      <!-- Desktop : colonne chat -->
      <v-col
        v-if="!isMobileComm"
        cols="12"
        md="8"
        lg="9"
        class="fill-height pb-0 bg-transparent"
      >
        <v-fade-transition mode="out-in">
          <ChatWindow
            v-if="commStore.activeConversation"
            :key="commStore.activeConversationId"
            :conversation="commStore.activeConversation"
            :messages="commStore.activeMessages"
            :current-user-id="authStore.user?.id || 0"
            :show-mobile-back="false"
            :is-mobile-chat="false"
            :reserve-fab-space="true"
            @send="sendMessage"
            @group-updated="commStore.fetchConversations()"
            @mobile-back="onMobileChatBack"
          />
          <EmptyChatState v-else />
        </v-fade-transition>
      </v-col>
    </v-row>

    <!-- Mobile : chat fixe sous la barre layout -->
    <div
      v-if="isMobileComm && mobileChatPane"
      ref="chatShellRef"
      class="comm-chat-shell"
    >
      <v-fade-transition mode="out-in">
        <ChatWindow
          v-if="commStore.activeConversation"
          :key="commStore.activeConversationId"
          :conversation="commStore.activeConversation"
          :messages="commStore.activeMessages"
          :current-user-id="authStore.user?.id || 0"
          :show-mobile-back="true"
          :is-mobile-chat="true"
          :reserve-fab-space="false"
          @send="sendMessage"
          @group-updated="commStore.fetchConversations()"
          @mobile-back="onMobileChatBack"
        />
        <EmptyChatState v-else show-back @back="onMobileChatBack" />
      </v-fade-transition>
    </div>
  </v-container>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useCommunicationStore } from '../stores/communication.store'
import { useAuthStore } from '../../auth/stores/auth'
import { useMobileNav } from '~/composables/useMobileNav'
import { useVisualViewportInsets } from '~/composables/useVisualViewportInsets'

import ConversationList from './ConversationList.vue'
import ChatWindow from './ChatWindow.vue'
import EmptyChatState from './EmptyChatState.vue'

const commStore = useCommunicationStore()
const authStore = useAuthStore()
const { isMobileNav: isMobileComm } = useMobileNav()

const mobileChatPane = ref(false)
const chatShellRef = ref<HTMLElement | null>(null)

const vvEnabled = computed(() => isMobileComm.value && mobileChatPane.value)
const { bindRoot, unbindRoot } = useVisualViewportInsets(vvEnabled)

const showConversationList = computed(
  () => !isMobileComm.value || !mobileChatPane.value,
)

watch(chatShellRef, (el) => {
  if (el && vvEnabled.value) bindRoot(el)
})

watch(vvEnabled, (on) => {
  if (on && chatShellRef.value) bindRoot(chatShellRef.value)
  else unbindRoot()
})

onMounted(async () => {
  authStore.hydrateUserFromToken()
  commStore.activeConversationId = null
  commStore.messages = {}
  commStore.initSocket()
  await commStore.fetchConversations()
})

watch(isMobileComm, (mobile) => {
  if (!mobile) mobileChatPane.value = false
})

watch(
  () => commStore.activeConversationId,
  (id) => {
    if (isMobileComm.value && id == null) mobileChatPane.value = false
  },
)

const selectConversation = (id: number) => {
  commStore.selectConversation(id)
  if (isMobileComm.value) mobileChatPane.value = true
}

const onMobileChatBack = () => {
  mobileChatPane.value = false
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
    if (isMobileComm.value) mobileChatPane.value = true
  }
}
</script>

<style scoped lang="scss">
.communication-container {
  height: calc(100dvh - var(--layout-mobile-top, 0px));
  max-height: calc(100dvh - var(--layout-mobile-top, 0px));
  box-sizing: border-box;
  background: radial-gradient(circle at top right, rgba(var(--v-theme-primary), 0.05), transparent 40%),
    radial-gradient(circle at bottom left, rgba(var(--v-theme-secondary), 0.05), transparent 40%);
}

.communication-container--mobile {
  min-height: 0;
  height: 100%;
  max-height: 100%;
}

.glass-panel {
  background: rgba(var(--v-theme-surface), 0.65);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.08) !important;
}

@media (min-width: 960px) {
  .comm-list-col {
    border-right: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  }
}
</style>
