<template>
  <v-container fluid class="pa-0 admin-page participants-page">

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
          <p class="text-body-2 text-white-70 ml-13">
            {{ store.stats.total }} coureur(s) inscrit(s) · {{ store.filteredParticipants.length }} affiché(s) avec les filtres
          </p>
        </div>
        <div class="d-flex flex-wrap gap-2">
          <v-btn
            variant="tonal"
            color="white"
            rounded="lg"
            prepend-icon="mdi-refresh"
            :loading="store.loading"
            @click="store.fetchAll()"
          >
            Actualiser
          </v-btn>
          <v-btn
            v-if="canManageRunners"
            variant="flat"
            color="white"
            rounded="lg"
            prepend-icon="mdi-account-plus"
            class="text-primary font-weight-bold"
            @click="openCreate()"
          >
            Nouveau participant
          </v-btn>
        </div>
      </div>

      <!-- KPI Row -->
      <v-row class="mt-4" density="comfortable">
        <v-col cols="6" sm="4" md="2" v-for="kpi in kpis" :key="kpi.label">
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
          <v-row density="comfortable" align="center">
            <v-col cols="12" sm="6" md="4" lg="3">
              <v-text-field
                v-model="store.search"
                prepend-inner-icon="mdi-magnify"
                placeholder="Participant, équipe…"
                variant="solo-filled"
                density="compact"
                hide-details
                rounded="lg"
                flat
                clearable
              />
            </v-col>
            <v-col cols="12" sm="6" md="4" lg="2">
              <v-select
                v-model="store.filterCourseId"
                :items="courseFilterItems"
                item-title="title"
                item-value="value"
                variant="solo-filled"
                density="compact"
                hide-details
                rounded="lg"
                flat
                clearable
                label="Discipline"
              />
            </v-col>
            <v-col cols="12" sm="6" md="4" lg="2">
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
            <v-col cols="12" sm="6" md="4" lg="2">
              <v-select
                v-model="store.filterRole"
                :items="roleFilterItems"
                item-title="title"
                item-value="value"
                variant="solo-filled"
                density="compact"
                hide-details
                rounded="lg"
                flat
                clearable
                label="Fonction"
                @update:model-value="onRoleFilterChange"
              />
            </v-col>
            <v-col cols="12" sm="6" md="4" lg="2">
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
            <v-col cols="12" md="auto" class="d-flex flex-wrap justify-md-end align-center gap-2 ms-md-auto">
              <v-btn
                variant="tonal"
                color="secondary"
                rounded="lg"
                class="text-none flex-grow-1 flex-sm-grow-0"
                min-width="160"
                prepend-icon="mdi-filter-off"
                @click="store.resetFilters()"
              >
                Réinitialiser
              </v-btn>
              <v-btn-toggle v-model="viewMode" mandatory density="compact" rounded="lg" class="flex-grow-1 flex-sm-grow-0">
                <v-btn value="list" icon="mdi-format-list-bulleted" />
                <v-btn value="grid" icon="mdi-view-grid" />
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
            <v-list-item class="participant-item px-5 py-3" @click="openDetails(p)">
              <template #prepend>
                <v-avatar
                  :color="p.status === 'en_piste' ? 'blue' : p.status === 'course_terminee' ? 'teal' : p.status === 'au_repos' ? 'error' : 'grey-lighten-2'"
                  size="44"
                  class="mr-2"
                >
                  <span class="text-body-2 font-weight-bold text-white">
                    {{ initials(p) }}
                  </span>
                </v-avatar>
              </template>

              <v-list-item-title class="font-weight-semibold">{{ p.fullName }}</v-list-item-title>
              <v-list-item-subtitle class="text-caption">
                <v-icon size="11" class="mr-1">mdi-account-group-outline</v-icon>{{ p.teamName }}
              </v-list-item-subtitle>

              <template #append>
                <div class="d-flex align-center flex-wrap justify-end participant-badges">
                  <v-chip v-if="p.isCaptain" color="primary" size="x-small" variant="tonal">Capitaine</v-chip>
                  <v-chip v-if="p.isTransponderHolder" color="blue" size="x-small" variant="tonal">Resp transpondeur</v-chip>
                  <v-chip v-if="p.activeTransponder" color="blue" size="x-small" variant="tonal" prepend-icon="mdi-timer">
                    {{ p.activeTransponder }}
                  </v-chip>
                  <v-chip :color="participantStatusColor(p)" size="x-small" variant="flat" class="font-weight-bold">
                    {{ participantStatusLabel(p) }}
                  </v-chip>
                  <div class="d-flex gap-1" @click.stop>
                    <v-btn icon="mdi-eye-outline" size="x-small" variant="text" color="primary" @click="openDetails(p)" />
                    <template v-if="canManageRunners">
                      <v-btn icon="mdi-pencil-outline" size="x-small" variant="text" color="grey" @click="openEdit(p)" />
                      <v-btn icon="mdi-delete-outline" size="x-small" variant="text" color="red" @click="confirmDelete(p)" />
                    </template>
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
          <v-card class="participant-card" rounded="xl" elevation="0" role="button" tabindex="0" @click="openDetails(p)">
            <div
              class="participant-card-accent"
              :class="
                p.status === 'en_piste'
                  ? 'accent-blue'
                  : p.status === 'course_terminee'
                    ? 'accent-teal'
                    : p.status === 'au_repos'
                      ? 'accent-error'
                      : 'accent-grey'
              "
            ></div>
            <v-card-text class="pa-4 text-center">
              <v-avatar
                :color="p.status === 'en_piste' ? 'blue' : p.status === 'course_terminee' ? 'teal' : p.status === 'au_repos' ? 'error' : 'grey-lighten-2'"
                size="60"
                class="mb-3"
              >
                <span class="text-h6 font-weight-bold text-white">
                  {{ initials(p) }}
                </span>
              </v-avatar>
              <div class="text-subtitle-1 font-weight-bold">{{ p.fullName }}</div>
              <div class="text-caption text-medium-emphasis mb-2">{{ p.teamName }}</div>
              <div class="d-flex flex-wrap justify-center participant-badges mb-2">
                <v-chip v-if="p.isCaptain" color="primary" size="x-small" variant="tonal">Capitaine</v-chip>
                <v-chip v-if="p.isTransponderHolder" color="blue" size="x-small" variant="tonal">Resp transpondeur</v-chip>
              </div>
              <v-chip v-if="p.activeTransponder" color="blue" size="small" variant="flat" prepend-icon="mdi-timer" class="mb-2">
                {{ p.activeTransponder }}
              </v-chip>
              <v-chip :color="participantStatusColor(p)" size="small" variant="flat" class="font-weight-bold mb-3">
                {{ participantStatusLabel(p) }}
              </v-chip>
              <v-divider class="mb-3" />
              <div class="d-flex justify-center gap-1" @click.stop>
                <v-btn icon="mdi-eye-outline" size="small" variant="text" color="primary" @click="openDetails(p)" />
                <template v-if="canManageRunners">
                  <v-btn icon="mdi-pencil-outline" size="small" variant="text" color="grey" @click="openEdit(p)" />
                  <v-btn icon="mdi-delete-outline" size="small" variant="text" color="red" @click="confirmDelete(p)" />
                </template>
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
    <v-dialog v-model="showForm" max-width="520">
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
          <v-row density="comfortable">
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
                label="Équipe *"
                variant="outlined"
                density="comfortable"
                :rules="[v => v != null || 'Requis']"
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
            :disabled="!form.firstName || !form.lastName || form.teamId == null"
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
    <ParticipantDetailsModal v-model="showDetails" :participant="selectedParticipant" @participant-updated="store.fetchAll()" />
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted, reactive } from 'vue'
import { useParticipantsStore } from '~/features/participants/stores/participants'
import { usePermissions } from '~/composables/usePermissions'

const store = useParticipantsStore()
const { canManageRunners } = usePermissions()
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
  { label: 'Sans puce', value: store.stats.auRepos, icon: 'mdi-timer-off', color: 'error' },
  { label: 'Course terminée', value: store.stats.courseTerminee, icon: 'mdi-flag-checkered', color: 'teal' },
  { label: 'Équipes', value: store.stats.equipes, icon: 'mdi-account-group', color: 'purple' },
])

const statusOptions = [
  { title: 'Tous les statuts', value: 'tous' },
  { title: 'En piste', value: 'en_piste' },
  { title: 'Sans puce', value: 'au_repos' },
  { title: 'Course terminée', value: 'course_terminee' },
]

const roleFilterItems = [
  { title: 'Tous', value: 'tous' },
  { title: 'Capitaines', value: 'capitaine' },
  { title: 'Responsable transpondeur', value: 'resp_transpondeur' },
]

function onRoleFilterChange(v) {
  if (v == null) store.filterRole = 'tous'
}

function participantStatusLabel(p) {
  if (p.status === 'course_terminee') return 'Course terminée'
  if (p.status === 'en_piste') return 'En piste'
  return 'Sans puce'
}

function participantStatusColor(p) {
  if (p.status === 'course_terminee') return 'teal'
  if (p.status === 'en_piste') return 'green'
  return 'error'
}

const courseFilterItems = computed(() => [
  { title: 'Toutes les disciplines', value: null },
  ...store.courses.map((c) => ({ title: c.name, value: c.id })),
])

const initials = (p) => {
  const fn = (p.firstName || p.prenom || '')
  const ln = (p.lastName || p.nom || '')
  return ((fn[0] || '') + (ln[0] || '')).toUpperCase()
}

const openCreate = () => {
  if (!canManageRunners.value) return
  editingRunner.value = null
  form.firstName = ''
  form.lastName = ''
  form.teamId = store.availableTeams[0]?.value ?? null
  formError.value = ''
  showForm.value = true
}

const openEdit = (p) => {
  if (!canManageRunners.value) return
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
  if (!canManageRunners.value) return
  deletingRunner.value = p
  deleteError.value = ''
  showDeleteConfirm.value = true
}

const submitForm = async () => {
  if (!canManageRunners.value) return
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
  if (!canManageRunners.value) return
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
.accent-teal { background: #00897b; }
.accent-error { background: rgb(var(--v-theme-error)); }
.accent-grey { background: #bdbdbd; }

.empty-state {
  display: flex; flex-direction: column; align-items: center;
  justify-content: center; text-align: center;
}

.participant-badges {
  gap: 10px;
  row-gap: 8px;
}
.participant-badges .v-chip {
  margin: 0;
}
</style>
