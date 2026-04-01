<template>
  <div
    v-if="showUser"
    class="notification-fab"
    :class="{ 'notification-fab--chat-safe': isCommunicationRoute }"
  >
    <v-btn
      color="primary"
      icon="mdi-bullhorn-outline"
      size="large"
      elevation="6"
      class="notification-fab__btn"
      aria-label="Envoyer une notification"
      @click="open = true"
    />
    <v-dialog v-model="open" v-bind="notifFabDialogAttrs" scrollable>
      <v-card>
        <v-card-title class="text-h6">Nouvelle notification</v-card-title>
        <v-card-text>
          <v-select
            v-model="form.type"
            label="Type"
            :items="typeItems"
            item-title="title"
            item-value="value"
            density="comfortable"
            class="mb-3"
          />
          <v-textarea
            v-model="form.message"
            label="Description"
            rows="4"
            density="comfortable"
            auto-grow
            class="mb-3"
          />
          <v-select
            v-if="isAdmin"
            v-model="form.audience"
            label="Destinataires"
            :items="audienceItems"
            item-title="title"
            item-value="value"
            density="comfortable"
          />
          <p v-else class="text-body-2 text-medium-emphasis mb-0">
            Votre message sera envoyé aux administrateurs uniquement.
          </p>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="open = false">Annuler</v-btn>
          <v-btn color="primary" :loading="sending" :disabled="!canSend" @click="submit">Envoyer</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useMobileDialogAttrs } from '~/composables/useMobileDialogAttrs'
import { useAuthStore } from '~/features/auth/stores/auth'
import { useJwtAuth } from '~/composables/useJwtAuth'
import { useNotificationsStore } from '../stores/notifications.store'

const authStore = useAuthStore()
const route = useRoute()
const { token } = useJwtAuth()
const notifStore = useNotificationsStore()

const notifFabDialogAttrs = useMobileDialogAttrs(480)

const open = ref(false)
const sending = ref(false)

const showUser = computed(() => !!(authStore.user || token.value))
const isAdmin = computed(() => authStore.user?.role === 'ADMIN' || authStore.user?.role === 'SUPER_ADMIN')
const isCommunicationRoute = computed(() => route.path.startsWith('/communication'))

const form = reactive({
  type: 'INFO',
  message: '',
  audience: 'ADMINS',
})

const typeItems = [
  { title: 'Information', value: 'INFO' },
  { title: 'Alerte', value: 'ALERT' },
  { title: 'Urgence', value: 'EMERGENCY' },
]

const audienceItems = [
  { title: 'Administrateurs', value: 'ADMINS' },
  { title: 'Bénévoles', value: 'BENEVOLES' },
  { title: 'Tous (admins + bénévoles)', value: 'ALL' },
]

watch(isAdmin, (admin) => {
  if (!admin) form.audience = 'ADMINS'
})

const canSend = computed(() => form.message.trim().length > 0)

async function submit() {
  if (!canSend.value) return
  sending.value = true
  try {
    await notifStore.sendManual({
      type: form.type,
      message: form.message.trim(),
      audience: isAdmin.value ? form.audience : 'ADMINS',
    })
    open.value = false
    form.message = ''
    form.type = 'INFO'
    await notifStore.fetchNotifications()
  } catch (e) {
    console.error(e)
  } finally {
    sending.value = false
  }
}
</script>

<style scoped>
.notification-fab {
  position: fixed;
  right: max(20px, env(safe-area-inset-right, 0px));
  bottom: max(20px, env(safe-area-inset-bottom, 0px));
  z-index: 10040;
}

.notification-fab--chat-safe {
  bottom: max(92px, calc(env(safe-area-inset-bottom, 0px) + 92px));
}

.notification-fab__btn {
  border-radius: 50% !important;
}

@media (max-width: 600px) {
  .notification-fab {
    right: max(14px, env(safe-area-inset-right, 0px));
    bottom: max(14px, env(safe-area-inset-bottom, 0px));
  }

  .notification-fab--chat-safe {
    bottom: max(86px, calc(env(safe-area-inset-bottom, 0px) + 86px));
  }
}
</style>
