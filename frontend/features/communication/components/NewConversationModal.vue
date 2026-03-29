<template>
  <v-dialog v-model="internalValue" max-width="500" transition="dialog-bottom-transition">
    <v-card class="glass-modal rounded-xl overflow-hidden">
      <v-toolbar color="transparent" class="px-2">
        <v-toolbar-title class="text-h6 font-weight-bold">Nouvelle conversation</v-toolbar-title>
        <v-spacer></v-spacer>
        <v-btn icon="mdi-close" variant="text" @click="internalValue = false"></v-btn>
      </v-toolbar>

      <v-card-text class="pt-2">
        <!-- Groupe Setup -->
        <v-slide-y-transition>
          <div v-if="selectedUsers.length > 1" class="mb-4">
            <v-text-field
              v-model="groupName"
              label="Nom du groupe (Optionnel)"
              variant="outlined"
              density="comfortable"
              hide-details
              class="mb-2"
            ></v-text-field>
          </div>
        </v-slide-y-transition>

        <p class="text-subtitle-2 mb-2">Sélectionnez les participants :</p>
        
        <v-text-field
          v-model="search"
          prepend-inner-icon="mdi-magnify"
          placeholder="Rechercher un utilisateur..."
          variant="solo-filled"
          density="compact"
          rounded="pill"
          hide-details
          class="mb-4 search-input"
        ></v-text-field>

        <v-list 
          class="user-list overflow-y-auto bg-transparent rounded-lg border" 
          max-height="250"
          select-strategy="multiple"
        >
          <v-list-item
            v-for="user in filteredUsers"
            :key="user.id"
            :value="user.id"
            @click="toggleUser(user.id)"
            class="transition-swing"
            :active="isSelected(user.id)"
            color="primary"
          >
            <template v-slot:prepend>
              <v-avatar color="indigo-lighten-4" size="32" class="mr-3 text-white">
                <span class="text-caption font-weight-bold">
                  {{ user.firstName?.charAt(0) }}{{ user.lastName?.charAt(0) }}
                </span>
              </v-avatar>
            </template>
            
            <v-list-item-title class="font-weight-medium">
              {{ user.firstName }} {{ user.lastName }}
            </v-list-item-title>
            <v-list-item-subtitle class="text-caption mt-1">
              {{ user.email }}
            </v-list-item-subtitle>
            
            <template v-slot:append>
              <v-checkbox-btn
                :model-value="isSelected(user.id)"
                color="primary"
                readonly
              ></v-checkbox-btn>
            </template>
          </v-list-item>
          
          <div v-if="filteredUsers.length === 0" class="text-center pa-4 text-medium-emphasis">
            Aucun utilisateur trouvé
          </div>
        </v-list>
      </v-card-text>

      <v-card-actions class="pa-4 bg-surface-variant d-flex justify-end">
        <v-btn
          color="primary"
          variant="flat"
          rounded="pill"
          class="px-6"
          :disabled="selectedUsers.length === 0 || loading"
          :loading="loading"
          @click="createConversation"
        >
          Créer
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import type { UserSnippet } from '../types/communication'

const props = defineProps<{
  modelValue: boolean;
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'created', conversationId: number): void
}>()

const internalValue = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const search = ref('')
const groupName = ref('')
const users = ref<UserSnippet[]>([])
const selectedUsers = ref<number[]>([])
const loading = ref(false)

const filteredUsers = computed(() => {
  if (!search.value) return users.value
  const s = search.value.toLowerCase()
  return users.value.filter(u => 
    u.firstName.toLowerCase().includes(s) || 
    u.lastName.toLowerCase().includes(s) ||
    u.email.toLowerCase().includes(s)
  )
})

const isSelected = (id: number) => selectedUsers.value.includes(id)

const toggleUser = (id: number) => {
  const idx = selectedUsers.value.indexOf(id)
  if (idx > -1) {
    selectedUsers.value.splice(idx, 1)
  } else {
    selectedUsers.value.push(id)
  }
}

const api = useApi()

onMounted(async () => {
  try {
    const res = await api.get('/messaging/users')
    // Optionnel: filtrer soi-même de la liste si possible (nécessite l'authStore ici)
    users.value = res
  } catch (e) {
    console.error('Erreur chargement utilisateurs', e)
  }
})

watch(internalValue, (val) => {
  if (val) {
    selectedUsers.value = []
    groupName.value = ''
    search.value = ''
  }
})

const createConversation = async () => {
  if (selectedUsers.value.length === 0) return
  loading.value = true
  try {
    const isGroup = selectedUsers.value.length > 1
    const newConv = await api.post<any>('/messaging/conversations', {
      name: groupName.value || null,
      type: isGroup ? 'GROUP' : 'PRIVATE',
      participantIds: selectedUsers.value
    })
    emit('created', newConv.id)
    internalValue.value = false
  } catch (e) {
    console.error('Erreur création conversation', e)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped lang="scss">
.glass-modal {
  background: rgba(var(--v-theme-surface), 0.85) !important;
  backdrop-filter: blur(20px);
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
}

.search-input {
  :deep(.v-field) {
    box-shadow: inset 0 2px 4px rgba(0,0,0,0.05);
  }
}

.user-list {
  background: rgba(var(--v-theme-background), 0.5) !important;
  border-color: rgba(var(--v-theme-on-surface), 0.05) !important;
  
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
</style>
