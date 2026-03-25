<template>
  <v-container fluid class="pa-0 participants-page">

    <!-- Hero Header -->
    <div class="hero-header pa-6 pb-4">
      <div class="d-flex align-center justify-space-between flex-wrap gap-3">
        <div>
          <div class="d-flex align-center mb-1">
            <div class="hero-icon-wrap mr-3">
              <v-icon size="22" color="white">mdi-account-multiple</v-icon>
            </div>
            <h1 class="text-h5 font-weight-bold text-white">Gestion des Participants</h1>
          </div>
          <p class="text-body-2 text-white-70 ml-13">{{ store.stats.total }} coureurs inscrits • Édition 2026</p>
        </div>
        <div class="d-flex gap-2">
          <v-btn variant="tonal" color="white" rounded="pill" class="text-white font-weight-bold px-4" @click="store.fetchAll()" :loading="store.loading" prepend-icon="mdi-refresh">
            Actualiser
          </v-btn>
          <v-btn variant="flat" color="white" rounded="pill" class="text-primary font-weight-bold px-5" @click="openCreate()" prepend-icon="mdi-plus">
            Ajouter
          </v-btn>
        </div>
      </div>

      <!-- KPI Row -->
      <v-row class="mt-4" dense>
        <v-col cols="6" sm="3" v-for="kpi in kpis" :key="kpi.label">
          <div class="kpi-chip">
            <div class="kpi-icon" :class="`bg-${kpi.color}-alpha`">
              <v-icon size="16" :color="kpi.color">{{ kpi.icon }}</v-icon>
            </div>
            <div>
              <div class="kpi-value">{{ kpi.value }}</div>
              <div class="kpi-label">{{ kpi.label }}</div>
            </div>
          </div>
        </v-col>
      </v-row>
    </div>

    <div class="pa-6 pt-4">

      <!-- Controls Bar -->
      <v-card class="controls-bar mb-5" rounded="xl" elevation="0">
        <v-card-text class="pa-3">
          <v-row dense align="center">
            <v-col cols="12" md="4">
              <v-text-field
                v-model="store.search"
                prepend-inner-icon="mdi-magnify"
                placeholder="Rechercher un participant ou une équipe..."
                variant="solo-filled"
                density="compact"
                hide-details
                rounded="lg"
                flat
                clearable
              />
            </v-col>
            <v-col cols="6" sm="4" md="2">
              <v-select
                v-model="store.filterEquipe"
                :items="[{ title: 'Toutes les équipes', value: null }, ...store.availableTeams]"
                item-title="title"
                item-value="value"
                variant="solo-filled"
                density="compact"
                hide-details
                rounded="lg"
                flat
                clearable
                label="Équipe"
              />
            </v-col>
            <v-col cols="6" sm="4" md="2">
              <v-select
                v-model="store.filterStatus"
                :items="statusOptions"
                item-title="title"
                item-value="value"
                variant="solo-filled"
                density="compact"
                hide-details
                rounded="lg"
                flat
                prepend-inner-icon="mdi-filter"
                clearable
                label="Statut"
                @update:model-value="(v) => { if (v == null) store.filterStatus = 'tous' }"
              />
            </v-col>
            <v-col cols="12" sm="4" md="2">
              <v-btn
                variant="tonal"
                color="secondary"
                rounded="lg"
                block
                class="text-none"
                prepend-icon="mdi-filter-off"
                @click="store.resetFilters()"
              >
                Réinitialiser
              </v-btn>
            </v-col>
            <v-col cols="12" sm="4" md="2">
              <v-btn-toggle v-model="viewMode" mandatory density="compact" rounded="lg" class="w-100 d-flex">
                <v-btn value="list" icon="mdi-format-list-bulleted" class="flex-grow-1" />
                <v-btn value="grid" icon="mdi-view-grid" class="flex-grow-1" />
              </v-btn-toggle>
            </v-col>
          </v-row>
        </v-card-text>
      </v-card>

      <!-- Loading -->
      <div v-if="store.loading" class="d-flex justify-center py-16">
        <v-progress-circular indeterminate color="primary" size="48" />
      </div>

      <!-- Error -->
      <v-alert v-else-if="store.error" type="warning" variant="tonal" rounded="xl" class="mb-4">
        {{ store.error }}
      </v-alert>

      <!-- LIST VIEW -->
      <v-card v-if="!store.loading && viewMode === 'list'" rounded="xl" elevation="0" class="data-card">
        <v-list lines="two" class="pa-0">
          <template v-for="(p, idx) in store.filteredParticipants" :key="p.id">
            <v-list-item class="participant-item px-5 py-3">
              <template #prepend>
                <v-avatar :color="p.activeTransponder ? 'blue' : 'grey-lighten-2'" size="44" class="mr-2">
                  <span class="text-body-2 font-weight-bold" :class="p.activeTransponder ? 'text-white' : 'text-grey-darken-2'">
                    {{ initials(p) }}
                  </span>
                </v-avatar>
              </template>

              <v-list-item-title class="font-weight-semibold">{{ p.fullName }}</v-list-item-title>
              <v-list-item-subtitle class="text-caption">
                <v-icon size="11" class="mr-1">mdi-account-group-outline</v-icon>{{ p.teamName }}
              </v-list-item-subtitle>

              <template #append>
                <div class="d-flex align-center gap-2 flex-wrap justify-end">
                  <v-chip v-if="p.activeTransponder" color="blue" size="x-small" variant="tonal" prepend-icon="mdi-timer">
                    {{ p.activeTransponder }}
                  </v-chip>
                  <v-chip v-else color="grey" size="x-small" variant="tonal">Au repos</v-chip>
                  <v-chip :color="p.activeTransponder ? 'green' : 'grey'" size="x-small" variant="flat" class="font-weight-bold d-none d-sm-flex">
                    {{ p.activeTransponder ? 'En piste' : 'Repos' }}
                  </v-chip>
                  <div class="d-flex gap-1">
                    <v-btn icon="mdi-eye-outline" size="x-small" variant="text" color="primary" @click="openDetails(p)" />
                    <v-btn icon="mdi-pencil-outline" size="x-small" variant="text" color="grey" @click="openEdit(p)" />
                    <v-btn icon="mdi-delete-outline" size="x-small" variant="text" color="red" @click="confirmDelete(p)" />
                  </div>
                </div>
              </template>
            </v-list-item>
            <v-divider v-if="idx < store.filteredParticipants.length - 1" />
          </template>

          <div v-if="!store.filteredParticipants.length" class="empty-state py-12">
            <v-icon size="52" color="grey-lighten-1" class="mb-3">mdi-account-search-outline</v-icon>
            <p class="text-medium-emphasis">Aucun participant ne correspond aux filtres</p>
          </div>
        </v-list>
      </v-card>

      <!-- GRID VIEW -->
      <v-row v-if="!store.loading && viewMode === 'grid'">
        <v-col v-for="p in store.filteredParticipants" :key="p.id" cols="12" sm="6" md="4" lg="3">
          <v-card class="participant-card" rounded="xl" elevation="0">
            <div class="participant-card-accent" :class="p.activeTransponder ? 'accent-blue' : 'accent-grey'"></div>
            <v-card-text class="pa-4 text-center">
              <v-avatar :color="p.activeTransponder ? 'blue' : 'grey-lighten-2'" size="60" class="mb-3">
                <span class="text-h6 font-weight-bold" :class="p.activeTransponder ? 'text-white' : 'text-grey-darken-2'">
                  {{ initials(p) }}
                </span>
              </v-avatar>
              <div class="text-subtitle-1 font-weight-bold">{{ p.fullName }}</div>
              <div class="text-caption text-medium-emphasis mb-3">{{ p.teamName }}</div>
              <v-chip v-if="p.activeTransponder" color="blue" size="small" variant="flat" prepend-icon="mdi-timer" class="mb-3">
                {{ p.activeTransponder }}
              </v-chip>
              <v-chip v-else color="grey" size="small" variant="tonal" class="mb-3">Au repos</v-chip>
              
              <v-divider class="mb-3" />
              <div class="d-flex justify-center gap-1">
                <v-btn icon="mdi-eye-outline" size="small" variant="text" color="primary" @click="openDetails(p)" />
                <v-btn icon="mdi-pencil-outline" size="small" variant="text" color="grey" @click="openEdit(p)" />
                <v-btn icon="mdi-delete-outline" size="small" variant="text" color="red" @click="confirmDelete(p)" />
              </div>
            </v-card-text>
          </v-card>
        </v-col>
        <v-col cols="12" v-if="!store.filteredParticipants.length">
          <div class="empty-state py-12">
            <v-icon size="52" color="grey-lighten-1" class="mb-3">mdi-account-search-outline</v-icon>
            <p class="text-medium-emphasis">Aucun participant trouvé</p>
          </div>
        </v-col>
      </v-row>
    </div>

    <!-- Create / Edit Dialog -->
    <v-dialog v-model="showForm" max-width="520" persistent>
      <v-card rounded="xl">
        <div class="form-header pa-5">
          <div class="d-flex justify-space-between align-center">
            <div class="text-h6 font-weight-bold text-white">
              {{ editingRunner ? 'Modifier le participant' : 'Ajouter un participant' }}
            </div>
            <v-btn icon="mdi-close" variant="text" color="white" @click="showForm = false" />
          </div>
        </div>
        <v-card-text class="pa-5">
          <v-alert v-if="formError" type="error" variant="tonal" density="compact" rounded="lg" class="mb-4">
            {{ formError }}
          </v-alert>
          <v-row dense>
            <v-col cols="6">
              <v-text-field v-model="form.firstName" label="Prénom *" variant="outlined" density="comfortable" :rules="[v => !!v || 'Requis']" />
            </v-col>
            <v-col cols="6">
              <v-text-field v-model="form.lastName" label="Nom *" variant="outlined" density="comfortable" :rules="[v => !!v || 'Requis']" />
            </v-col>
            <v-col cols="12">
              <v-select
                v-model="form.teamId"
                :items="store.availableTeams"
                item-title="title"
                item-value="value"
                label="Équipe"
                variant="outlined"
                density="comfortable"
                clearable
              />
            </v-col>
          </v-row>
        </v-card-text>
        <v-card-actions class="px-5 pb-5 pt-0">
          <v-btn variant="text" @click="showForm = false">Annuler</v-btn>
          <v-spacer />
          <v-btn
            color="primary"
            variant="flat"
            rounded="lg"
            :loading="store.saving"
            :disabled="!form.firstName || !form.lastName"
            @click="submitForm()"
          >
            {{ editingRunner ? 'Enregistrer' : 'Ajouter' }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Delete Confirmation -->
    <v-dialog v-model="showDeleteConfirm" max-width="420">
      <v-card rounded="xl">
        <v-card-text class="pa-6 text-center">
          <v-alert v-if="deleteError" type="error" variant="tonal" density="compact" rounded="lg" class="mb-4 text-start">
            {{ deleteError }}
          </v-alert>
          <v-icon size="52" color="red" class="mb-4">mdi-delete-alert-outline</v-icon>
          <div class="text-h6 font-weight-bold mb-2">Supprimer ce participant ?</div>
          <div class="text-body-2 text-medium-emphasis">
            <strong>{{ deletingRunner?.fullName }}</strong> sera définitivement supprimé.
          </div>
        </v-card-text>
        <v-card-actions class="pb-5 px-5">
          <v-btn variant="text" @click="showDeleteConfirm = false">Annuler</v-btn>
          <v-spacer />
          <v-btn color="red" variant="flat" rounded="lg" :loading="store.saving" @click="executeDelete()">
            Supprimer
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Details Modal -->
    <ParticipantDetailsModal v-model="showDetails" :participant="selectedParticipant" />
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted, reactive } from 'vue'
import { useParticipantsStore } from '~/features/participants/stores/participants'

const store = useParticipantsStore()
const viewMode = ref('list')

// Form state
const showForm = ref(false)
const editingRunner = ref(null)
const form = reactive({ firstName: '', lastName: '', teamId: null })
const formError = ref('')

// Delete state
const showDeleteConfirm = ref(false)
const deletingRunner = ref(null)
const deleteError = ref('')

// Details state
const showDetails = ref(false)
const selectedParticipant = ref(null)

onMounted(() => store.fetchAll())

const kpis = computed(() => [
  { label: 'Total', value: store.stats.total, icon: 'mdi-account', color: 'blue' },
  { label: 'En piste', value: store.stats.enPiste, icon: 'mdi-run', color: 'green' },
  { label: 'Au repos', value: store.stats.auRepos, icon: 'mdi-sleep', color: 'orange' },
  { label: 'Équipes', value: store.stats.equipes, icon: 'mdi-account-group', color: 'purple' },
])

const statusOptions = [
  { title: 'Tous les statuts', value: 'tous' },
  { title: 'En piste', value: 'en_piste' },
  { title: 'Au repos', value: 'au_repos' },
]

const initials = (p) => {
  const fn = (p.firstName || p.prenom || '')
  const ln = (p.lastName || p.nom || '')
  return ((fn[0] || '') + (ln[0] || '')).toUpperCase()
}

const openCreate = () => {
  editingRunner.value = null
  form.firstName = ''
  form.lastName = ''
  form.teamId = null
  formError.value = ''
  showForm.value = true
}

const openEdit = (p) => {
  editingRunner.value = p
  form.firstName = p.firstName || p.prenom || ''
  form.lastName = p.lastName || p.nom || ''
  form.teamId = p.teamId ?? p.team?.id ?? null
  formError.value = ''
  showForm.value = true
}

const openDetails = (p) => {
  selectedParticipant.value = p
  showDetails.value = true
}

const confirmDelete = (p) => {
  deletingRunner.value = p
  deleteError.value = ''
  showDeleteConfirm.value = true
}

const submitForm = async () => {
  formError.value = ''
  try {
    if (editingRunner.value) {
      await store.updateRunner(editingRunner.value.id, { ...form })
    } else {
      await store.createRunner({ ...form })
    }
    await store.fetchAll()
    showForm.value = false
  } catch (e) {
    const m = e?.data?.message ?? e?.message
    formError.value = Array.isArray(m) ? m.join(', ') : m || 'Une erreur est survenue'
  }
}

const executeDelete = async () => {
  deleteError.value = ''
  try {
    await store.deleteRunner(deletingRunner.value.id)
    await store.fetchAll()
    showDeleteConfirm.value = false
  } catch (e) {
    const m = e?.data?.message ?? e?.message
    deleteError.value = Array.isArray(m) ? m.join(', ') : m || 'Suppression impossible'
  }
}
</script>

<style scoped>
.participants-page {
  background: transparent;
  min-height: 100vh;
}

.hero-header {
  background: linear-gradient(135deg, #0f172a 0%, #1e3a5f 55%, #0f2040 100%);
  position: relative;
  overflow: hidden;
}

.hero-header::before {
  content: '';
  position: absolute;
  inset: 0;
  background: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.03'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
}

.hero-icon-wrap {
  width: 40px; height: 40px;
  background: rgba(255,255,255,0.15);
  border-radius: 10px;
  display: flex; align-items: center; justify-content: center;
}

.text-white-70 { color: rgba(255,255,255,0.7); }

.kpi-chip {
  display: flex; align-items: center; gap: 10px;
  background: rgba(255,255,255,0.1);
  backdrop-filter: blur(4px);
  border: 1px solid rgba(255,255,255,0.15);
  border-radius: 12px; padding: 10px 14px;
}

.kpi-icon {
  width: 32px; height: 32px; border-radius: 8px;
  display: flex; align-items: center; justify-content: center;
}

.bg-blue-alpha { background: rgba(66,133,244,0.3); }
.bg-green-alpha { background: rgba(52,199,89,0.3); }
.bg-orange-alpha { background: rgba(255,149,0,0.3); }
.bg-purple-alpha { background: rgba(175,82,222,0.3); }
.bg-red-alpha { background: rgba(255,59,48,0.3); }

.kpi-value { font-size: 1.2rem; font-weight: 800; color: white; line-height: 1; }
.kpi-label { font-size: 0.7rem; color: rgba(255,255,255,0.65); text-transform: uppercase; letter-spacing: 0.05em; margin-top: 2px; }

.controls-bar { border: 1px solid rgba(var(--v-theme-on-surface), 0.12); background: rgb(var(--v-theme-surface)); }

.data-card { border: 1px solid rgba(var(--v-theme-on-surface), 0.12); background: rgb(var(--v-theme-surface)); }

.participant-item {
  cursor: pointer;
  transition: background 0.15s;
}
.participant-item:hover { background: rgba(0,0,0,0.02); }

.participant-card {
  border: 1px solid rgba(var(--v-theme-on-surface), 0.12);
  background: rgb(var(--v-theme-surface));
  position: relative;
  overflow: hidden;
  transition: all 0.2s ease;
}
.participant-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0,0,0,0.08) !important;
}

.participant-card-accent {
  position: absolute; top: 0; left: 0; right: 0; height: 3px;
}
.accent-blue { background: #1976d2; }
.accent-grey { background: #bdbdbd; }

.form-header {
  background: linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%);
  border-radius: 12px 12px 0 0;
}

.empty-state {
  display: flex; flex-direction: column; align-items: center;
  justify-content: center; text-align: center;
}
</style>
