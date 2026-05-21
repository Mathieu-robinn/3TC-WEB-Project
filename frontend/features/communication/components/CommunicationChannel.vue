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

    <!-- Mobile : chat fixe aligné sur le visual viewport -->
    <div
      v-if="isMobileComm && mobileChatPane"
      ref="chatShellRef"
      class="comm-chat-shell"
    >
      <div class="comm-chat-shell__inner">
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
          @viewport-sync="syncViewport"
        />
        <EmptyChatState v-else show-back @back="onMobileChatBack" />
      </div>
    </div>
  </v-container>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useCommunicationStore } from '../stores/communication.store'
import { useAuthStore } from '../../auth/stores/auth'
import { useMobileNav } from '~/composables/useMobileNav'
import {
  useVisualViewportInsets,
  getLayoutTopPx,
} from '~/composables/useVisualViewportInsets'

import ConversationList from './ConversationList.vue'
import ChatWindow from './ChatWindow.vue'
import EmptyChatState from './EmptyChatState.vue'

const commStore = useCommunicationStore()
const authStore = useAuthStore()
const { isMobileNav: isMobileComm } = useMobileNav()

const mobileChatPane = ref(false)
const chatShellRef = ref<HTMLElement | null>(null)
const layoutTopPx = ref(getLayoutTopPx())

const vvEnabled = computed(() => isMobileComm.value && mobileChatPane.value)
const { bindRoot, unbindRoot, sync } = useVisualViewportInsets(vvEnabled, layoutTopPx)

let savedHtmlOverflow = ''
let savedBodyOverflow = ''

const setBodyScrollLock = (lock: boolean) => {
  if (typeof document === 'undefined') return
  if (lock) {
    savedHtmlOverflow = document.documentElement.style.overflow
    savedBodyOverflow = document.body.style.overflow
    document.documentElement.style.overflow = 'hidden'
    document.body.style.overflow = 'hidden'
  } else {
    document.documentElement.style.overflow = savedHtmlOverflow
    document.body.style.overflow = savedBodyOverflow
  }
}

const syncViewport = () => {
  layoutTopPx.value = getLayoutTopPx()
  sync()
  requestAnimationFrame(() => sync())
}

const showConversationList = computed(
  () => !isMobileComm.value || !mobileChatPane.value,
)

watch(chatShellRef, (el) => {
  if (el && vvEnabled.value) bindRoot(el)
})

watch(vvEnabled, (on) => {
  if (on) {
    setBodyScrollLock(true)
    if (chatShellRef.value) bindRoot(chatShellRef.value)
    nextTick(() => syncViewport())
  } else {
    setBodyScrollLock(false)
    unbindRoot()
  }
})

watch(mobileChatPane, (open) => {
  if (isMobileComm.value && open) {
    nextTick(() => syncViewport())
  }
})

onMounted(async () => {
  layoutTopPx.value = getLayoutTopPx()
  authStore.hydrateUserFromToken()
  commStore.activeConversationId = null
  commStore.messages = {}
  commStore.initSocket()
  await commStore.fetchConversations()
})

onUnmounted(() => {
  setBodyScrollLock(false)
  unbindRoot()
})

watch(isMobileComm, (mobile) => {
  if (!mobile) {
    mobileChatPane.value = false
    setBodyScrollLock(false)
  }
})

watch(
  () => commStore.activeConversationId,
  (id) => {
    if (isMobileComm.value && id == null) mobileChatPane.value = false
  },
)

const selectConversation = (id: number) => {
  commStore.selectConversation(id)
  if (isMobileComm.value) {
    mobileChatPane.value = true
    nextTick(() => syncViewport())
  }
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
    if (isMobileComm.value) {
      mobileChatPane.value = true
      nextTick(() => syncViewport())
    }
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
