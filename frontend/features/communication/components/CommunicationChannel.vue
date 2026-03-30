<template>
  <v-container
    fluid
    class="fill-height communication-container"
    :class="{ 'communication-container--mobile': isMobileComm, 'pa-2 pt-2': isMobileComm, 'pa-4 pt-4 pt-md-8': !isMobileComm }"
  >
    <v-row class="fill-height no-gutters glass-panel rounded-xl overflow-hidden elevation-10">
      <!-- Liste des conversations -->
      <v-col
        v-show="showConversationList"
        cols="12"
        md="4"
        lg="3"
        class="fill-height comm-list-col pb-0"
      >
        <ConversationList
          :conversations="commStore.conversations"
          :active-id="commStore.activeConversationId"
          :current-user-id="authStore.user?.id || 0"
          :can-create-conversations="authStore.user?.role === 'ADMIN'"
          @select="selectConversation"
          @refresh="onConversationCreated"
        />
      </v-col>

      <!-- Fenêtre de chat -->
      <v-col
        v-show="showChatColumn"
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
            :show-mobile-back="isMobileComm && mobileChatPane"
            @send="sendMessage"
            @group-updated="commStore.fetchConversations()"
            @mobile-back="onMobileChatBack"
          />
          <div
            v-else
            class="d-flex fill-height flex-column align-center justify-center text-medium-emphasis px-4"
          >
            <v-icon icon="mdi-forum-outline" size="80" class="mb-6 opacity-20 color-primary"></v-icon>
            <h2 class="text-h5 text-md-h4 font-weight-light mb-2 text-center">Messagerie</h2>
            <p class="text-body-2 text-md-body-1 text-center">Sélectionnez une conversation pour commencer à discuter.</p>
            <v-btn
              v-if="isMobileComm && mobileChatPane"
              class="mt-6"
              variant="tonal"
              prepend-icon="mdi-arrow-left"
              @click="onMobileChatBack"
            >
              Retour aux conversations
            </v-btn>
          </div>
        </v-fade-transition>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useCommunicationStore } from '../stores/communication.store'
import { useAuthStore } from '../../auth/stores/auth'
import { useMobileNav } from '~/composables/useMobileNav'

import ConversationList from './ConversationList.vue'
import ChatWindow from './ChatWindow.vue'

const commStore = useCommunicationStore()
const authStore = useAuthStore()
const { isMobileNav: isMobileComm } = useMobileNav()

const mobileChatPane = ref(false)

const showConversationList = computed(
  () => !isMobileComm.value || !mobileChatPane.value,
)
const showChatColumn = computed(() => !isMobileComm.value || mobileChatPane.value)

onMounted(async () => {
  authStore.hydrateUserFromToken()
  // Ne pas conserver une conversation active d'une navigation précédente.
  // La sélection doit être faite uniquement via clic utilisateur.
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
  /* Hauteur utile sous la barre mobile (variable héritée du layout default) */
  height: calc(100dvh - var(--layout-mobile-top, 0px));
  max-height: calc(100dvh - var(--layout-mobile-top, 0px));
  box-sizing: border-box;
  background: radial-gradient(circle at top right, rgba(var(--v-theme-primary), 0.05), transparent 40%),
    radial-gradient(circle at bottom left, rgba(var(--v-theme-secondary), 0.05), transparent 40%);
}

.communication-container--mobile {
  min-height: 0;
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
