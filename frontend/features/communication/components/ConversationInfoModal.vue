<template>
  <v-dialog v-model="internalValue" max-width="480" transition="dialog-bottom-transition">
    <v-card class="glass-modal rounded-xl overflow-hidden">
      <v-toolbar color="transparent" class="px-2">
        <v-toolbar-title class="text-h6 font-weight-bold">Détails de la conversation</v-toolbar-title>
        <v-spacer></v-spacer>
        <v-btn icon="mdi-close" variant="text" @click="internalValue = false"></v-btn>
      </v-toolbar>

      <v-card-text>
        <!-- Avatar + Name -->
        <div class="text-center mb-4 mt-2">
          <v-avatar :color="conversation.type === 'GROUP' ? 'secondary' : 'primary'" size="64" class="elevation-3 mb-3">
            <v-icon :icon="conversation.type === 'GROUP' ? 'mdi-account-group' : 'mdi-account'" color="white" size="32"></v-icon>
          </v-avatar>

          <!-- Editable name (GROUP + admin only) -->
          <div v-if="conversation.type === 'GROUP' && isAdmin">
            <div v-if="!editingName" class="d-flex align-center justify-center gap-2">
              <h2 class="text-h5 font-weight-bold">{{ conversation.name || `Groupe #${conversation.id}` }}</h2>
              <v-btn icon="mdi-pencil" size="x-small" variant="text" color="primary" @click="startEditName"></v-btn>
            </div>
            <div v-else class="d-flex align-center gap-2 px-4">
              <v-text-field
                v-model="newName"
                density="compact"
                variant="outlined"
                hide-details
                autofocus
                class="flex-grow-1"
                @keyup.enter="saveName"
                @keyup.esc="editingName = false"
              ></v-text-field>
              <v-btn icon="mdi-check" size="small" color="success" variant="tonal" :loading="savingName" @click="saveName"></v-btn>
              <v-btn icon="mdi-close" size="small" variant="text" @click="editingName = false"></v-btn>
            </div>
          </div>
          <h2 v-else class="text-h5 font-weight-bold">{{ conversation.name || `Conversation #${conversation.id}` }}</h2>

          <p class="text-subtitle-1 text-medium-emphasis mt-1">
            {{ conversation.type === 'GROUP' ? 'Groupe' : 'Privé' }}
          </p>
        </div>

        <v-divider class="mb-4"></v-divider>

        <h3 class="text-subtitle-2 mb-3">Participants ({{ conversation.participants?.length || 0 }})</h3>

        <v-list class="bg-transparent" lines="two">
          <v-list-item
            v-for="part in conversation.participants"
            :key="part.id"
            class="px-0 rounded-lg mb-1"
          >
            <template v-slot:prepend>
              <v-avatar color="indigo-lighten-4" class="mr-3 text-white">
                <span class="text-caption font-weight-bold">
                  {{ part.user?.firstName?.charAt(0) }}{{ part.user?.lastName?.charAt(0) }}
                </span>
              </v-avatar>
            </template>

            <v-list-item-title class="font-weight-medium">
              {{ part.user?.firstName }} {{ part.user?.lastName }}
            </v-list-item-title>
            <v-list-item-subtitle class="text-caption">
              <v-chip
                :color="part.role === 'ADMIN' ? 'primary' : 'default'"
                size="x-small"
                variant="tonal"
                class="mr-1"
              >
                {{ part.role === 'ADMIN' ? 'Administrateur' : 'Membre' }}
              </v-chip>
            </v-list-item-subtitle>

            <!-- Promote/demote button: only for group admins, not on self -->
            <template v-if="conversation.type === 'GROUP' && isAdmin && part.userId !== currentUserId" v-slot:append>
              <div class="d-flex align-center gap-2">
                <v-tooltip
                  :text="part.role === 'ADMIN' ? 'Rétrograder Membre' : 'Promouvoir Admin'"
                  location="left"
                >
                  <template v-slot:activator="{ props: tooltipProps }">
                    <v-btn
                      v-bind="tooltipProps"
                      :icon="part.role === 'ADMIN' ? 'mdi-shield-remove' : 'mdi-shield-crown'"
                      size="small"
                      variant="text"
                      :color="part.role === 'ADMIN' ? 'error' : 'primary'"
                      :loading="promotingId === part.id"
                      @click="toggleRole(part)"
                    ></v-btn>
                  </template>
                </v-tooltip>

                <v-tooltip text="Retirer du groupe" location="left">
                  <template v-slot:activator="{ props: tooltipProps }">
                    <v-btn
                      v-bind="tooltipProps"
                      icon="mdi-account-minus-outline"
                      size="small"
                      variant="text"
                      color="error"
                      :loading="removingId === part.id"
                      @click="removeParticipant(part)"
                    ></v-btn>
                  </template>
                </v-tooltip>
              </div>
            </template>
          </v-list-item>
        </v-list>

        <!-- Add participant (group admin only) -->
        <div v-if="conversation.type === 'GROUP' && isAdmin" class="mt-4">
          <h3 class="text-subtitle-2 mb-2">Ajouter un participant</h3>
          <v-select
            v-model="selectedUserToAdd"
            :items="userOptions"
            item-title="title"
            item-value="id"
            density="compact"
            variant="outlined"
            hide-details
            rounded="lg"
            label="Utilisateur"
          ></v-select>
          <div class="d-flex justify-end mt-3">
            <v-btn
              color="primary"
              variant="flat"
              rounded="lg"
              :disabled="selectedUserToAdd == null || addingParticipant"
              :loading="addingParticipant"
              @click="addParticipant"
            >
              Ajouter
            </v-btn>
          </div>
        </div>

        <!-- Error snackbar -->
        <v-alert v-if="error" type="error" density="compact" class="mt-3" variant="tonal">{{ error }}</v-alert>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import type { Conversation, ConversationParticipant, UserSnippet } from '../types/communication'

const props = defineProps<{
  modelValue: boolean;
  conversation: Conversation;
  currentUserId: number;
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'updated'): void
}>()

const api = useApi()

const internalValue = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

// Is the current user an admin of this conversation?
const isAdmin = computed(() => {
  const me = props.conversation.participants?.find(p => p.userId === props.currentUserId)
  return me?.role === 'ADMIN'
})

// — Edit group name —
const editingName = ref(false)
const newName = ref('')
const savingName = ref(false)
const error = ref('')

const startEditName = () => {
  newName.value = props.conversation.name ?? ''
  editingName.value = true
  error.value = ''
}

const saveName = async () => {
  if (!newName.value.trim()) return
  savingName.value = true
  error.value = ''
  try {
    await api.patch(`/messaging/conversations/${props.conversation.id}/name`, { name: newName.value.trim() })
    editingName.value = false
    emit('updated')
  } catch (e: any) {
    error.value = e?.data?.message || 'Erreur lors du renommage.'
  } finally {
    savingName.value = false
  }
}

// — Promote / demote participant —
const promotingId = ref<number | null>(null)
const removingId = ref<number | null>(null)

const toggleRole = async (part: ConversationParticipant) => {
  promotingId.value = part.id
  error.value = ''
  const newRole = part.role === 'ADMIN' ? 'MEMBER' : 'ADMIN'
  try {
    await api.patch(
      `/messaging/conversations/${props.conversation.id}/participants/${part.id}/role`,
      { role: newRole }
    )
    emit('updated')
  } catch (e: any) {
    error.value = e?.data?.message || 'Erreur lors du changement de rôle.'
  } finally {
    promotingId.value = null
  }
}

// — Add / remove participant —
const allUsers = ref<UserSnippet[]>([])
const selectedUserToAdd = ref<number | null>(null)
const addingParticipant = ref(false)

const userOptions = computed(() => {
  const currentIds = new Set((props.conversation.participants ?? []).map((p) => p.userId))
  return allUsers.value
    .filter((u) => !currentIds.has(u.id) && u.id !== props.currentUserId)
    .map((u) => ({ id: u.id, title: `${u.firstName} ${u.lastName}` }))
})

onMounted(async () => {
  try {
    allUsers.value = await api.get('/messaging/users')
  } catch (e) {
    // Ignore: user management is optional, error is surfaced on actual actions
    console.warn('Erreur chargement utilisateurs', e)
  }
})

const addParticipant = async () => {
  if (selectedUserToAdd.value == null) return
  addingParticipant.value = true
  error.value = ''

  try {
    await api.post(`/messaging/conversations/${props.conversation.id}/participants`, {
      userId: selectedUserToAdd.value,
    })
    selectedUserToAdd.value = null
    emit('updated')
  } catch (e: any) {
    error.value = e?.data?.message || "Erreur lors de l'ajout du participant."
  } finally {
    addingParticipant.value = false
  }
}

const removeParticipant = async (part: ConversationParticipant) => {
  removingId.value = part.id
  error.value = ''

  try {
    await api.del(`/messaging/conversations/${props.conversation.id}/participants/${part.id}`)
    emit('updated')
  } catch (e: any) {
    error.value = e?.data?.message || 'Erreur lors du retrait du participant.'
  } finally {
    removingId.value = null
  }
}

// Reset state when modal closes
watch(internalValue, (val) => {
  if (!val) {
    editingName.value = false
    error.value = ''
  }
})
</script>

<style scoped lang="scss">
.glass-modal {
  background: rgba(var(--v-theme-surface), 0.85) !important;
  backdrop-filter: blur(20px);
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
}
</style>
