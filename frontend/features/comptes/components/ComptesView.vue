<template>
  <v-container fluid class="pa-6">
    <div class="d-flex align-center justify-space-between flex-wrap gap-3 mb-6">
      <div class="d-flex align-center">
        <v-icon size="32" color="grey-darken-2" class="mr-3">mdi-account-supervisor-outline</v-icon>
        <div>
          <h1 class="text-h4 font-weight-bold">Comptes</h1>
          <p class="text-body-2 text-medium-emphasis mb-0">Créer des comptes administrateurs ou bénévoles</p>
        </div>
      </div>
      <v-btn
        color="primary"
        variant="flat"
        rounded="lg"
        prepend-icon="mdi-refresh"
        :loading="loading"
        @click="fetchUsers"
      >
        Actualiser
      </v-btn>
    </div>

    <v-row>
      <v-col cols="12" lg="5">
        <v-card rounded="lg" elevation="0" class="border pa-4">
          <div class="text-subtitle-1 font-weight-bold mb-4">Nouveau compte</div>
          <v-form @submit.prevent="submit">
            <v-text-field
              v-model="form.email"
              label="Email *"
              type="email"
              variant="outlined"
              density="comfortable"
              class="mb-2"
              :rules="[v => !!v || 'Requis']"
            />
            <v-text-field
              v-model="form.password"
              label="Mot de passe *"
              type="password"
              variant="outlined"
              density="comfortable"
              class="mb-2"
              hint="Au moins 8 caractères"
              persistent-hint
              :rules="[v => (v && v.length >= 8) || 'Minimum 8 caractères']"
            />
            <v-text-field
              v-model="form.firstName"
              label="Prénom *"
              variant="outlined"
              density="comfortable"
              class="mb-2"
              :rules="[v => !!v || 'Requis']"
            />
            <v-text-field
              v-model="form.lastName"
              label="Nom *"
              variant="outlined"
              density="comfortable"
              class="mb-2"
              :rules="[v => !!v || 'Requis']"
            />
            <v-text-field
              v-model="form.phone"
              label="Téléphone"
              variant="outlined"
              density="comfortable"
              class="mb-2"
            />
            <v-select
              v-model="form.role"
              :items="roleItems"
              item-title="title"
              item-value="value"
              label="Rôle *"
              variant="outlined"
              density="comfortable"
              class="mb-4"
            />
            <v-btn type="submit" color="primary" block rounded="lg" :loading="submitting" :disabled="!canSubmit">
              Créer le compte
            </v-btn>
          </v-form>
        </v-card>
      </v-col>
      <v-col cols="12" lg="7">
        <v-card rounded="lg" elevation="0" class="border pa-0">
          <v-data-table
            :headers="headers"
            :items="users"
            :loading="loading"
            class="elevation-0"
            density="comfortable"
            hide-default-footer
            :items-per-page="-1"
          >
            <template #item.role="{ item }">
              <v-chip size="small" :color="item.role === 'ADMIN' ? 'red' : 'blue'" variant="flat">
                {{ item.role === 'ADMIN' ? 'Admin' : 'Bénévole' }}
              </v-chip>
            </template>
            <template #item.actions="{ item }">
              <v-btn
                icon="mdi-pencil"
                variant="text"
                size="small"
                aria-label="Modifier"
                @click="openEdit(item)"
              />
              <v-btn
                icon="mdi-delete-outline"
                variant="text"
                size="small"
                color="error"
                :disabled="currentUserId != null && item.id === currentUserId"
                aria-label="Supprimer"
                @click="askDelete(item)"
              />
            </template>
          </v-data-table>
        </v-card>
      </v-col>
    </v-row>

    <v-dialog v-model="editOpen" max-width="520" scrollable>
      <v-card rounded="lg">
        <v-card-title class="text-h6">Modifier le compte</v-card-title>
        <v-card-text>
          <v-text-field
            v-model="editForm.email"
            label="Email"
            type="email"
            variant="outlined"
            density="comfortable"
            class="mb-2"
          />
          <v-text-field
            v-model="editForm.password"
            label="Nouveau mot de passe (optionnel)"
            type="password"
            variant="outlined"
            density="comfortable"
            hint="Laisser vide pour ne pas changer. Minimum 8 caractères si renseigné."
            persistent-hint
            class="mb-4"
          />
          <v-text-field
            v-model="editForm.firstName"
            label="Prénom"
            variant="outlined"
            density="comfortable"
            class="mb-2"
          />
          <v-text-field
            v-model="editForm.lastName"
            label="Nom"
            variant="outlined"
            density="comfortable"
            class="mb-2"
          />
          <v-text-field
            v-model="editForm.phone"
            label="Téléphone"
            variant="outlined"
            density="comfortable"
            class="mb-2"
          />
          <v-select
            v-model="editForm.role"
            :items="roleItems"
            item-title="title"
            item-value="value"
            label="Rôle"
            variant="outlined"
            density="comfortable"
          />
        </v-card-text>
        <v-card-actions class="px-4 pb-4">
          <v-spacer />
          <v-btn variant="text" rounded="lg" @click="editOpen = false">Annuler</v-btn>
          <v-btn color="primary" variant="flat" rounded="lg" :loading="editSaving" @click="saveEdit">
            Enregistrer
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="deleteOpen" max-width="420">
      <v-card rounded="lg">
        <v-card-title class="text-h6">Supprimer le compte ?</v-card-title>
        <v-card-text v-if="deleteTarget">
          Cette action est définitive pour
          <strong>{{ deleteTarget.email }}</strong>
          .
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="deleteOpen = false">Annuler</v-btn>
          <v-btn color="error" variant="flat" :loading="deleteLoading" @click="confirmDelete">Supprimer</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-snackbar v-model="snackbar.show" :color="snackbar.color" timeout="4000">
      {{ snackbar.text }}
    </v-snackbar>
  </v-container>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'

const { currentUserId } = useJwtAuth()

type StaffUser = {
  id: number
  email: string
  firstName: string
  lastName: string
  phone: string | null
  role: 'ADMIN' | 'BENEVOLE'
}

const api = useApi()

const users = ref<StaffUser[]>([])
const loading = ref(false)
const submitting = ref(false)

const form = reactive({
  email: '',
  password: '',
  firstName: '',
  lastName: '',
  phone: '',
  role: 'BENEVOLE' as 'ADMIN' | 'BENEVOLE',
})

const roleItems = [
  { title: 'Bénévole', value: 'BENEVOLE' },
  { title: 'Administrateur', value: 'ADMIN' },
]

const headers = [
  { title: 'ID', key: 'id', width: '72px' },
  { title: 'Email', key: 'email' },
  { title: 'Prénom', key: 'firstName' },
  { title: 'Nom', key: 'lastName' },
  { title: 'Tél.', key: 'phone' },
  { title: 'Rôle', key: 'role' },
  { title: '', key: 'actions', sortable: false, width: '108px' },
]

const editOpen = ref(false)
const editSaving = ref(false)
const editForm = reactive({
  id: 0,
  email: '',
  password: '',
  firstName: '',
  lastName: '',
  phone: '',
  role: 'BENEVOLE' as 'ADMIN' | 'BENEVOLE',
})

const deleteOpen = ref(false)
const deleteLoading = ref(false)
const deleteTarget = ref<StaffUser | null>(null)

const snackbar = reactive({ show: false, text: '', color: 'success' as string })

const canSubmit = computed(() => {
  return (
    !!form.email &&
    form.password.length >= 8 &&
    !!form.firstName &&
    !!form.lastName &&
    !!form.role
  )
})

function showSnackbar(text: string, color: string) {
  snackbar.text = text
  snackbar.color = color
  snackbar.show = true
}

async function fetchUsers() {
  loading.value = true
  try {
    users.value = await api.get<StaffUser[]>('/users')
  } catch (e: any) {
    showSnackbar(e?.data?.message || e?.message || 'Impossible de charger les comptes', 'error')
  } finally {
    loading.value = false
  }
}

async function submit() {
  if (!canSubmit.value) return
  submitting.value = true
  try {
    const body: Record<string, unknown> = {
      email: form.email.trim(),
      password: form.password,
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      role: form.role,
    }
    if (form.phone?.trim()) body.phone = form.phone.trim()

    await api.post('/user', body)
    showSnackbar('Compte créé.', 'success')
    form.email = ''
    form.password = ''
    form.firstName = ''
    form.lastName = ''
    form.phone = ''
    form.role = 'BENEVOLE'
    await fetchUsers()
  } catch (e: any) {
    const msg =
      e?.data?.message ||
      (Array.isArray(e?.data?.message) ? e.data.message.join(', ') : null) ||
      e?.message ||
      'Erreur lors de la création'
    showSnackbar(msg, 'error')
  } finally {
    submitting.value = false
  }
}

function openEdit(u: StaffUser) {
  editForm.id = u.id
  editForm.email = u.email
  editForm.password = ''
  editForm.firstName = u.firstName
  editForm.lastName = u.lastName
  editForm.phone = u.phone ?? ''
  editForm.role = u.role
  editOpen.value = true
}

async function saveEdit() {
  if (!editForm.email.trim() || !editForm.firstName.trim() || !editForm.lastName.trim()) {
    showSnackbar('Email, prénom et nom sont requis.', 'error')
    return
  }
  if (editForm.password && editForm.password.length < 8) {
    showSnackbar('Le mot de passe doit faire au moins 8 caractères.', 'error')
    return
  }
  editSaving.value = true
  try {
    const body: Record<string, unknown> = {
      email: editForm.email.trim(),
      firstName: editForm.firstName.trim(),
      lastName: editForm.lastName.trim(),
      role: editForm.role,
    }
    if (editForm.phone?.trim()) body.phone = editForm.phone.trim()
    else body.phone = null
    if (editForm.password.length >= 8) body.password = editForm.password

    await api.put(`/user/${editForm.id}`, body)
    showSnackbar('Compte mis à jour.', 'success')
    editOpen.value = false
    await fetchUsers()
  } catch (e: any) {
    const msg =
      e?.data?.message ||
      (Array.isArray(e?.data?.message) ? e.data.message.join(', ') : null) ||
      e?.message ||
      'Erreur lors de la mise à jour'
    showSnackbar(msg, 'error')
  } finally {
    editSaving.value = false
  }
}

function askDelete(u: StaffUser) {
  deleteTarget.value = u
  deleteOpen.value = true
}

async function confirmDelete() {
  if (!deleteTarget.value) return
  deleteLoading.value = true
  try {
    await api.del(`/user/${deleteTarget.value.id}`)
    showSnackbar('Compte supprimé.', 'success')
    deleteOpen.value = false
    deleteTarget.value = null
    await fetchUsers()
  } catch (e: any) {
    const msg =
      e?.data?.message ||
      (Array.isArray(e?.data?.message) ? e.data.message.join(', ') : null) ||
      e?.message ||
      'Impossible de supprimer ce compte'
    showSnackbar(msg, 'error')
  } finally {
    deleteLoading.value = false
  }
}

onMounted(() => {
  fetchUsers()
})
</script>

<style scoped>
.border {
  border: 1px solid rgba(0, 0, 0, 0.12) !important;
}
</style>
