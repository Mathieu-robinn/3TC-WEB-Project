<template>
  <v-container fluid class="pa-0 admin-page comptes-page">
    <div class="hero-header pa-4 pa-md-6 pb-4">
      <div class="d-flex flex-column flex-md-row align-start align-md-center justify-space-between gap-4">
        <div>
          <div class="d-flex align-center mb-1">
            <div class="hero-icon-wrap mr-3">
              <v-icon color="white" size="22">mdi-account-supervisor</v-icon>
            </div>
            <h1 class="text-h5 font-weight-bold text-white">Comptes</h1>
          </div>
          <p class="text-body-2 text-white-70 ml-0 ml-md-13">{{ comptesHeroSubtitle }}</p>
        </div>
        <div class="d-flex flex-column flex-sm-row flex-wrap gap-2 w-100 w-md-auto">
          <v-btn
            variant="tonal"
            color="white"
            prepend-icon="mdi-refresh"
            rounded="lg"
            class="flex-grow-1 flex-sm-grow-0"
            :loading="loading"
            @click="fetchUsers"
          >
            Actualiser
          </v-btn>
          <v-btn
            color="white"
            class="text-primary font-weight-bold flex-grow-1 flex-sm-grow-0"
            variant="flat"
            rounded="lg"
            prepend-icon="mdi-account-plus"
            @click="openCreateDialog"
          >
            Nouveau compte
          </v-btn>
        </div>
      </div>

      <v-row class="mt-4">
        <v-col v-for="(kpi, i) in kpis" :key="i" cols="12" sm="6" md="4">
          <div class="kpi-chip">
            <div class="kpi-icon" :class="kpi.iconBg">
              <v-icon size="18" color="white">{{ kpi.icon }}</v-icon>
            </div>
            <div class="min-w-0">
              <div class="kpi-value text-truncate">{{ kpi.value }}</div>
              <div class="kpi-label">{{ kpi.label }}</div>
            </div>
          </div>
        </v-col>
      </v-row>
    </div>

    <div class="pa-4 pa-md-6 pt-4">
      <v-card class="controls-bar mb-5" rounded="xl" elevation="0">
        <v-card-text class="pa-3">
          <v-row density="comfortable" align="center">
            <v-col cols="12" md="5">
              <v-text-field
                v-model="filterSearch"
                prepend-inner-icon="mdi-magnify"
                placeholder="Email, nom, prénom, téléphone…"
                variant="solo-filled"
                density="compact"
                hide-details
                rounded="lg"
                flat
                clearable
              />
            </v-col>
            <v-col cols="12" sm="6" md="3">
              <v-select
                v-model="filterRole"
                :items="roleFilterItems"
                item-title="title"
                item-value="value"
                label="Rôle"
                variant="solo-filled"
                density="compact"
                hide-details
                rounded="lg"
                flat
                clearable
                @update:model-value="onRoleFilterChange"
              />
            </v-col>
            <v-col cols="12" sm="6" md="4">
              <v-btn
                variant="tonal"
                color="secondary"
                rounded="lg"
                block
                class="text-none"
                prepend-icon="mdi-filter-off"
                @click="resetCompteFilters"
              >
                Réinitialiser les filtres
              </v-btn>
            </v-col>
          </v-row>
        </v-card-text>
      </v-card>

      <v-card class="list-card" rounded="xl" elevation="0">
        <v-toolbar density="comfortable" color="transparent" class="px-2">
          <v-toolbar-title class="text-subtitle-1 font-weight-bold">Comptes enregistrés</v-toolbar-title>
        </v-toolbar>
        <v-divider />
        <div class="table-scroll-x">
        <v-data-table
          :headers="tableHeaders"
          :items="filteredUsers"
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
            <v-tooltip
              :disabled="!deleteUserDisabled(item)"
              location="top"
              :text="deleteUserDisabledHint(item)"
            >
              <template #activator="{ props: tipProps }">
                <span v-bind="tipProps" class="d-inline-flex">
                  <v-btn
                    icon="mdi-delete-outline"
                    variant="text"
                    size="small"
                    color="error"
                    :disabled="deleteUserDisabled(item)"
                    aria-label="Supprimer"
                    @click="askDelete(item)"
                  />
                </span>
              </template>
            </v-tooltip>
          </template>
        </v-data-table>
        </div>
      </v-card>
    </div>

    <v-dialog v-model="createOpen" v-bind="compteFormDialogAttrs" scrollable>
      <v-card rounded="xl">
        <div class="form-header pa-4 d-flex align-center">
          <v-icon color="white" class="mr-2">mdi-account-plus</v-icon>
          <span class="text-h6 text-white font-weight-bold">Nouveau compte</span>
          <v-spacer />
          <v-btn icon variant="text" color="white" @click="createOpen = false">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </div>
        <v-card-text class="pa-4 pt-4">
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
            <div class="d-flex justify-end gap-2">
              <v-btn variant="text" rounded="lg" @click="createOpen = false">Annuler</v-btn>
              <v-btn type="submit" color="primary" rounded="lg" :loading="submitting" :disabled="!canSubmit">
                Créer le compte
              </v-btn>
            </div>
          </v-form>
        </v-card-text>
      </v-card>
    </v-dialog>

    <v-dialog v-model="editOpen" v-bind="compteFormDialogAttrs" scrollable>
      <v-card rounded="xl">
        <div class="form-header pa-4 d-flex align-center">
          <v-icon color="white" class="mr-2">mdi-pencil</v-icon>
          <span class="text-h6 text-white font-weight-bold">Modifier le compte</span>
          <v-spacer />
          <v-btn icon variant="text" color="white" @click="editOpen = false">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </div>
        <v-card-text class="pa-4 pt-4">
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

    <v-dialog v-model="deleteOpen" v-bind="compteDeleteDialogAttrs">
      <v-card rounded="xl">
        <v-card-title class="text-h6 pa-4">Supprimer le compte ?</v-card-title>
        <v-card-text v-if="deleteTarget" class="px-4">
          Cette action est définitive pour
          <strong>{{ deleteTarget.email }}</strong>
          .
        </v-card-text>
        <v-card-actions class="px-4 pb-4">
          <v-spacer />
          <v-btn variant="text" rounded="lg" @click="deleteOpen = false">Annuler</v-btn>
          <v-btn color="error" variant="flat" rounded="lg" :loading="deleteLoading" @click="confirmDelete">Supprimer</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-snackbar v-model="snackbar.show" :color="snackbar.color" timeout="4000" rounded="lg" location="bottom right">
      {{ snackbar.text }}
    </v-snackbar>
  </v-container>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useDisplay } from 'vuetify/framework'
import { useMobileDialogAttrs } from '~/composables/useMobileDialogAttrs'

const { currentUserId } = useJwtAuth()
const display = useDisplay()
const compteFormDialogAttrs = useMobileDialogAttrs(520)
const compteDeleteDialogAttrs = useMobileDialogAttrs(420)

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
const createOpen = ref(false)

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

const comptesHeadersBase = [
  { title: 'ID', key: 'id', width: '72px' },
  { title: 'Email', key: 'email' },
  { title: 'Prénom', key: 'firstName' },
  { title: 'Nom', key: 'lastName' },
  { title: 'Tél.', key: 'phone' },
  { title: 'Rôle', key: 'role' },
  { title: '', key: 'actions', sortable: false, width: '108px' },
]

const tableHeaders = computed(() => {
  if (!display.smAndDown.value) return comptesHeadersBase
  const drop = new Set(['id', 'phone', 'firstName', 'lastName'])
  return comptesHeadersBase.filter((h) => !drop.has(h.key))
})

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

const kpis = computed(() => {
  const list = users.value
  const admins = list.filter((u) => u.role === 'ADMIN').length
  const ben = list.filter((u) => u.role === 'BENEVOLE').length
  return [
    {
      label: 'Comptes',
      value: String(list.length),
      icon: 'mdi-account-multiple',
      iconBg: 'bg-blue-alpha',
    },
    {
      label: 'Administrateurs',
      value: String(admins),
      icon: 'mdi-shield-account',
      iconBg: 'bg-red-alpha',
    },
    {
      label: 'Bénévoles',
      value: String(ben),
      icon: 'mdi-account-heart',
      iconBg: 'bg-green-alpha',
    },
  ]
})

const filterSearch = ref('')
const filterRole = ref<'tous' | 'ADMIN' | 'BENEVOLE'>('tous')

const roleFilterItems = [
  { title: 'Tous les rôles', value: 'tous' },
  { title: 'Administrateur', value: 'ADMIN' },
  { title: 'Bénévole', value: 'BENEVOLE' },
]

const filteredUsers = computed(() => {
  let list = users.value
  const q = filterSearch.value.trim().toLowerCase()
  if (q) {
    list = list.filter(
      (u) =>
        u.email.toLowerCase().includes(q) ||
        u.firstName.toLowerCase().includes(q) ||
        u.lastName.toLowerCase().includes(q) ||
        (u.phone != null && u.phone.toLowerCase().includes(q)),
    )
  }
  if (filterRole.value !== 'tous') {
    list = list.filter((u) => u.role === filterRole.value)
  }
  return list
})

const comptesHeroSubtitle = computed(
  () =>
    `${users.value.length} compte(s) · ${filteredUsers.value.length} affiché(s) avec les filtres`,
)

function resetCompteFilters() {
  filterSearch.value = ''
  filterRole.value = 'tous'
}

function onRoleFilterChange(v: 'tous' | 'ADMIN' | 'BENEVOLE' | null) {
  filterRole.value = v ?? 'tous'
}

const canSubmit = computed(() => {
  return (
    !!form.email &&
    form.password.length >= 8 &&
    !!form.firstName &&
    !!form.lastName &&
    !!form.role
  )
})

function openCreateDialog() {
  createOpen.value = true
}

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
    createOpen.value = false
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

function deleteUserDisabled(u: StaffUser): boolean {
  if (u.role === 'ADMIN') return true
  if (currentUserId.value != null && u.id === currentUserId.value) return true
  return false
}

function deleteUserDisabledHint(u: StaffUser): string {
  if (u.role === 'ADMIN') return 'Les comptes administrateur ne peuvent pas être supprimés depuis cette interface.'
  if (currentUserId.value != null && u.id === currentUserId.value)
    return 'Vous ne pouvez pas supprimer votre propre compte.'
  return ''
}

function askDelete(u: StaffUser) {
  if (deleteUserDisabled(u)) return
  deleteTarget.value = u
  deleteOpen.value = true
}

async function confirmDelete() {
  if (!deleteTarget.value) return
  if (deleteUserDisabled(deleteTarget.value)) {
    deleteOpen.value = false
    deleteTarget.value = null
    return
  }
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
/* Styles partagés : ~/assets/css/admin-pages.css (.admin-page, .hero-header, etc.) */
</style>
