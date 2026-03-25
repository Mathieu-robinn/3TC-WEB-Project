<template>
  <v-container fluid class="pa-0 equipes-page">

    <!-- Hero Header -->
    <div class="hero-header pa-6 pb-4">
      <div class="d-flex align-center justify-space-between flex-wrap gap-3">
        <div>
          <div class="d-flex align-center mb-1">
            <div class="hero-icon-wrap mr-3">
              <v-icon size="22" color="white">mdi-account-group</v-icon>
            </div>
            <h1 class="text-h5 font-weight-bold text-white">Gestion des Équipes</h1>
          </div>
          <p class="text-body-2 text-white-70 ml-13">{{ store.stats.total }} équipes inscrites • Édition 2026</p>
        </div>
        <div class="d-flex gap-2">
          <v-btn variant="tonal" color="white" rounded="lg" prepend-icon="mdi-refresh"
            @click="store.fetchEquipes()" :loading="store.loading">
            Actualiser
          </v-btn>
          <v-btn variant="flat" color="white" rounded="lg" prepend-icon="mdi-plus"
            class="text-primary font-weight-bold" @click="openCreate()">
            Nouvelle équipe
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
                placeholder="Rechercher une équipe..."
                variant="solo-filled" density="compact" hide-details rounded="lg" flat
                clearable
              />
            </v-col>
            <v-col cols="6" sm="4" md="2">
              <v-select
                v-model="store.filterTranspondeur"
                :items="transponderOptions" item-title="title" item-value="value"
                variant="solo-filled" density="compact" hide-details rounded="lg" flat
                clearable
                @update:model-value="(v) => { if (v == null) store.filterTranspondeur = 'tous' }"
              />
            </v-col>
            <v-col cols="6" sm="4" md="2">
              <v-select
                v-model="store.sortBy"
                :items="sortOptions" item-title="title" item-value="value"
                variant="solo-filled" density="compact" hide-details rounded="lg" flat
                prepend-inner-icon="mdi-sort"
                clearable
                @update:model-value="(v) => { if (v == null) store.sortBy = 'ranking' }"
              />
            </v-col>
            <v-col cols="6" sm="4" md="2">
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
                <v-btn value="grid" icon="mdi-view-grid" class="flex-grow-1" />
                <v-btn value="list" icon="mdi-format-list-bulleted" class="flex-grow-1" />
                <v-btn value="ranking" icon="mdi-podium" class="flex-grow-1" />
              </v-btn-toggle>
            </v-col>
          </v-row>
        </v-card-text>
      </v-card>

      <!-- Loading -->
      <div v-if="store.loading" class="d-flex justify-center align-center py-16">
        <v-progress-circular indeterminate color="primary" size="48" />
      </div>

      <!-- Error -->
      <v-alert v-else-if="store.error" type="warning" variant="tonal" rounded="xl" class="mb-4">
        {{ store.error }}
      </v-alert>

      <!-- GRID VIEW -->
      <div v-if="!store.loading && viewMode === 'grid'">
        <v-row>
          <v-col v-for="equipe in store.filteredEquipes" :key="equipe.id" cols="12" sm="6" lg="4">
            <v-card class="team-card" rounded="xl" elevation="0" @click="openDetails(equipe)">
              <div class="team-card-accent" :class="`accent-${getStatutColor(equipe.statut)}`"></div>
              <v-card-text class="pa-5">
                <!-- Team header -->
                <div class="d-flex justify-space-between align-start mb-3">
                  <div class="d-flex align-center">
                    <v-avatar :color="getStatutColor(equipe.statut)" size="40" class="mr-3">
                      <span class="text-body-2 font-weight-bold text-white">
                        {{ (equipe.name || equipe.nom || '?')[0] }}
                      </span>
                    </v-avatar>
                    <div>
                      <div class="text-subtitle-1 font-weight-bold line-clamp-1">{{ equipe.name || equipe.nom }}</div>
                      <div class="text-caption text-medium-emphasis">{{ equipe.capitaine }}</div>
                    </div>
                  </div>
                  <div class="d-flex flex-column align-end gap-1">
                    <v-chip :color="getStatutColor(equipe.statut)" size="x-small" variant="flat" class="font-weight-bold">
                      {{ getStatutLabel(equipe.statut) }}
                    </v-chip>
                  </div>
                </div>

                <!-- Stats bar -->
                <v-divider class="mb-3" />
                <div class="d-flex justify-space-between text-center">
                  <div>
                    <div class="text-h6 font-weight-bold text-primary">{{ equipe.nbTour || 0 }}</div>
                    <div class="text-caption text-medium-emphasis">Tours</div>
                  </div>
                  <v-divider vertical />
                  <div>
                    <div class="text-h6 font-weight-bold">{{ equipe.membres.length }}</div>
                    <div class="text-caption text-medium-emphasis">Coureurs</div>
                  </div>
                  <v-divider vertical />
                  <div>
                    <v-icon :color="equipe.transpondeur ? 'blue' : 'grey'" size="20">
                      mdi-timer{{ equipe.transpondeur ? '' : '-off' }}
                    </v-icon>
                    <div class="text-caption text-medium-emphasis mt-1">{{ equipe.transpondeur || 'Aucun' }}</div>
                  </div>
                </div>
              </v-card-text>

              <!-- Card actions -->
              <v-card-actions class="px-5 pb-4 pt-0" @click.stop>
                <v-btn size="x-small" variant="text" color="primary" prepend-icon="mdi-eye" @click="openDetails(equipe)">Détails</v-btn>
                <v-spacer />
                <v-btn size="x-small" icon="mdi-pencil" variant="text" color="grey" @click="openEdit(equipe)" />
                <v-btn size="x-small" icon="mdi-delete" variant="text" color="error" @click="confirmDelete(equipe)" />
              </v-card-actions>
            </v-card>
          </v-col>

          <!-- Empty state -->
          <v-col cols="12" v-if="!store.filteredEquipes.length">
            <div class="empty-state py-16 d-flex flex-column align-center">
              <v-icon size="56" color="grey" class="mb-4">mdi-clipboard-text-search-outline</v-icon>
              <p class="text-subtitle-1 text-medium-emphasis">Aucune équipe ne correspond aux filtres.</p>
              <v-btn class="mt-4" variant="tonal" color="primary" @click="openCreate()">Créer une équipe</v-btn>
            </div>
          </v-col>
        </v-row>
      </div>

      <!-- LIST VIEW -->
      <div v-if="!store.loading && viewMode === 'list'">
        <v-card rounded="xl" elevation="0" class="list-card">
          <v-list lines="two" class="pa-0">
            <template v-for="(equipe, i) in store.filteredEquipes" :key="equipe.id">
              <v-list-item class="list-item px-5 py-3" @click="openDetails(equipe)">
                <template #prepend>
                  <v-avatar :color="getStatutColor(equipe.statut)" size="44" class="mr-2">
                    <span class="text-body-1 font-weight-bold text-white">{{ (equipe.name || equipe.nom || '?')[0] }}</span>
                  </v-avatar>
                </template>
                <v-list-item-title class="font-weight-semibold">{{ equipe.name || equipe.nom }}</v-list-item-title>
                <v-list-item-subtitle>{{ equipe.capitaine }} · {{ equipe.membres.length }} coureur(s)</v-list-item-subtitle>
                <template #append>
                  <div class="d-flex align-center gap-2">
                    <div class="text-center d-none d-sm-block">
                      <div class="text-subtitle-2 font-weight-bold text-primary">{{ equipe.nbTour || 0 }}</div>
                      <div class="text-caption text-medium-emphasis">tours</div>
                    </div>
                    <v-chip v-if="equipe.transpondeur" color="blue" size="x-small" variant="tonal">{{ equipe.transpondeur }}</v-chip>
                    <v-chip :color="getStatutColor(equipe.statut)" size="x-small" variant="flat" class="font-weight-bold">
                      {{ getStatutLabel(equipe.statut) }}
                    </v-chip>
                    <v-btn icon="mdi-pencil" size="x-small" variant="text" color="grey" @click.stop="openEdit(equipe)" />
                    <v-btn icon="mdi-delete" size="x-small" variant="text" color="error" @click.stop="confirmDelete(equipe)" />
                  </div>
                </template>
              </v-list-item>
              <v-divider v-if="i < store.filteredEquipes.length - 1" />
            </template>
            <div v-if="!store.filteredEquipes.length" class="py-10 d-flex flex-column align-center">
              <v-icon size="48" color="grey" class="mb-3">mdi-clipboard-text-search-outline</v-icon>
              <p class="text-medium-emphasis">Aucune équipe trouvée</p>
            </div>
          </v-list>
        </v-card>
      </div>

      <!-- RANKING VIEW -->
      <div v-if="!store.loading && viewMode === 'ranking'">
        <v-card rounded="xl" elevation="0" class="list-card">
          <!-- Podium top 3 -->
          <div class="podium-section pa-5 pb-0" v-if="store.rankingWithDetails.length >= 3">
            <div class="d-flex justify-center align-end gap-4 mb-4">
              <div class="podium-item" v-for="pos in podiumOrder" :key="pos">
                <div class="podium-avatar" :class="`pos-${pos}`">
                  <v-avatar :size="pos === 1 ? 56 : 44" :color="podiumColor(pos)" class="mb-1">
                    <span class="text-body-1 font-weight-bold text-white">{{ (store.rankingWithDetails[pos - 1]?.name || '?')[0] }}</span>
                  </v-avatar>
                  <div class="podium-medal">{{ podiumMedal(pos) }}</div>
                </div>
                <div class="text-caption font-weight-bold text-center pt-1" style="max-width: 80px; word-break: break-word;">
                  {{ store.rankingWithDetails[pos - 1]?.name }}
                </div>
                <div class="text-caption text-primary font-weight-bold text-center">
                  {{ store.rankingWithDetails[pos - 1]?.nbTour }} tours
                </div>
                <div class="podium-block" :class="`block-${pos}`"></div>
              </div>
            </div>
          </div>

          <v-table>
            <thead>
              <tr>
                <th class="text-center" style="width:60px">#</th>
                <th>Équipe</th>
                <th class="text-center">Coureurs</th>
                <th class="text-center">Tours</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="team in store.rankingWithDetails" :key="team.id"
                class="ranking-row" style="cursor: pointer"
                @click="openDetailById(team.id)"
              >
                <td class="text-center">
                  <span v-if="team.rank <= 3" class="text-h6">{{ podiumMedal(team.rank) }}</span>
                  <span v-else class="text-subtitle-2 font-weight-bold text-medium-emphasis">{{ team.rank }}</span>
                </td>
                <td>
                  <div class="d-flex align-center">
                    <v-avatar :color="podiumColor(team.rank)" size="32" class="mr-3">
                      <span class="text-caption font-weight-bold text-white">{{ (team.name || '?')[0] }}</span>
                    </v-avatar>
                    <span class="font-weight-medium">{{ team.name }}</span>
                  </div>
                </td>
                <td class="text-center">
                  <span class="text-body-2 text-medium-emphasis">
                    {{ store.equipesWithStatus.find(e => e.id === team.id)?.membres?.length || 0 }}
                  </span>
                </td>
                <td class="text-center">
                  <v-chip color="primary" size="small" variant="tonal" class="font-weight-bold">{{ team.nbTour }}</v-chip>
                </td>
              </tr>
            </tbody>
          </v-table>
        </v-card>
      </div>
    </div>

    <!-- Details Modal -->
    <EquipeDetailsModal v-model="isModalOpen" :equipe="selectedEquipe" @edit="openEdit" />

    <!-- Create / Edit Dialog -->
    <v-dialog v-model="showForm" max-width="520" persistent>
      <v-card rounded="xl">
        <div class="form-header pa-5">
          <div class="text-h6 font-weight-bold text-white">{{ editingTeam ? 'Modifier l\'équipe' : 'Nouvelle équipe' }}</div>
          <div class="text-caption text-white" style="opacity:.7">{{ editingTeam ? 'Mettre à jour les infos' : 'Créer une nouvelle équipe' }}</div>
        </div>
        <v-card-text class="pa-5">
          <v-alert v-if="formError" type="error" variant="tonal" density="compact" rounded="lg" class="mb-4">
            {{ formError }}
          </v-alert>
          <v-row>
            <v-col cols="12">
              <div class="field-label">Nom de l'équipe *</div>
              <v-text-field
                v-model="form.name"
                placeholder="Ex: Les Flèches de l'INSA"
                variant="outlined" density="comfortable" rounded="lg"
                hide-details="auto"
              />
            </v-col>
            <v-col cols="6" v-if="!editingTeam">
              <div class="field-label">Numéro *</div>
              <v-text-field
                v-model.number="form.num"
                type="number" placeholder="42"
                variant="outlined" density="comfortable" rounded="lg" hide-details
              />
            </v-col>
            <v-col cols="6" v-if="!editingTeam">
              <div class="field-label">Parcours (courseId) *</div>
              <v-select
                v-model="form.courseId"
                :items="coursesOptions" item-title="label" item-value="id"
                variant="outlined" density="comfortable" rounded="lg" hide-details
              />
            </v-col>
            <v-col cols="12" v-if="editingTeam">
              <div class="field-label">Nb Tours</div>
              <v-text-field
                v-model.number="form.nbTour"
                type="number" placeholder="0"
                variant="outlined" density="comfortable" rounded="lg" hide-details
              />
            </v-col>
          </v-row>
        </v-card-text>
        <v-card-actions class="px-5 pb-5 pt-0">
          <v-btn color="grey" variant="text" rounded="lg" @click="showForm = false">Annuler</v-btn>
          <v-spacer />
          <v-btn color="primary" variant="flat" rounded="lg" :loading="store.saving" @click="submitForm">
            {{ editingTeam ? 'Mettre à jour' : 'Créer' }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Delete Confirm Dialog -->
    <v-dialog v-model="showDeleteConfirm" max-width="420" persistent>
      <v-card rounded="xl">
        <v-card-title class="pt-5 px-5 text-h6 font-weight-bold">Supprimer l'équipe ?</v-card-title>
        <v-card-text class="px-5">
          <v-alert v-if="deleteError" type="error" variant="tonal" density="compact" rounded="lg" class="mb-4">
            {{ deleteError }}
          </v-alert>
          Cette action est irréversible. L'équipe <strong>{{ deletingTeam?.name }}</strong> et toutes les données associées seront supprimées.
        </v-card-text>
        <v-card-actions class="pa-5 pt-2">
          <v-btn color="grey" variant="text" rounded="lg" @click="showDeleteConfirm = false">Annuler</v-btn>
          <v-spacer />
          <v-btn color="error" variant="flat" rounded="lg" :loading="store.saving" @click="executeDelete">
            Supprimer
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

  </v-container>
</template>

<script setup>
import { ref, computed, reactive, onMounted } from 'vue'
import { useEquipesStore } from '~/features/equipes/stores/equipes'

const store = useEquipesStore()

const viewMode = ref('grid')
const isModalOpen = ref(false)
const selectedEquipe = ref(null)
const showForm = ref(false)
const showDeleteConfirm = ref(false)
const editingTeam = ref(null)
const deletingTeam = ref(null)

// Load courses for the "create team" select
const coursesOptions = ref([])
const loadCourses = async () => {
  try {
    const api = useApi()
    const data = await api.get('/courses')
    coursesOptions.value = Array.isArray(data) ? data.map(c => ({ id: c.id, label: `${c.name} (id:${c.id})` })) : []
  } catch {
    coursesOptions.value = []
  }
}

const form = reactive({ name: '', num: null, courseId: null, nbTour: 0 })
const formError = ref('')
const deleteError = ref('')

onMounted(() => {
  store.fetchEquipes()
  loadCourses()
})

// ── KPIs ──────────────────────────────────────────────────────────────────
const kpis = computed(() => [
  { label: 'Total', value: store.stats.total, icon: 'mdi-account-group', color: 'blue' },
  { label: 'En piste', value: store.stats.enPiste, icon: 'mdi-run', color: 'green' },
  { label: 'En attente', value: store.stats.enAttente, icon: 'mdi-clock-outline', color: 'orange' },
  { label: 'Sans puce', value: store.stats.sansTranspondeur, icon: 'mdi-timer-off', color: 'red' },
])

const podiumOrder = [2, 1, 3]
const transponderOptions = [
  { title: 'Tous', value: 'tous' },
  { title: 'Avec transpondeur', value: 'avec' },
  { title: 'Sans transpondeur', value: 'sans' },
]
const sortOptions = [
  { title: 'Classement', value: 'ranking' },
  { title: 'Nom A→Z', value: 'name' },
  { title: 'Nb coureurs', value: 'members' },
]

// ── CRUD ──────────────────────────────────────────────────────────────────
const openDetails = (equipe) => {
  selectedEquipe.value = equipe
  isModalOpen.value = true
}

const openDetailById = (id) => {
  const equipe = store.equipesWithStatus.find(e => e.id === id)
  if (equipe) openDetails(equipe)
}

const openCreate = () => {
  editingTeam.value = null
  formError.value = ''
  Object.assign(form, { name: '', num: null, courseId: coursesOptions.value[0]?.id || null, nbTour: 0 })
  showForm.value = true
}

const openEdit = (equipe) => {
  isModalOpen.value = false
  editingTeam.value = equipe
  formError.value = ''
  Object.assign(form, { name: equipe.name || equipe.nom || '', num: equipe.num, courseId: equipe.courseId, nbTour: equipe.nbTour || 0 })
  showForm.value = true
}

const submitForm = async () => {
  formError.value = ''
  try {
    if (editingTeam.value) {
      await store.updateTeam(editingTeam.value.id, { name: form.name, nbTour: form.nbTour })
    } else {
      await store.createTeam({ num: form.num, name: form.name, courseId: form.courseId })
    }
    showForm.value = false
    await store.fetchEquipes()
  } catch (e) {
    const m = e?.data?.message ?? e?.message
    formError.value = Array.isArray(m) ? m.join(', ') : m || 'Une erreur est survenue'
  }
}

const confirmDelete = (equipe) => {
  deletingTeam.value = equipe
  deleteError.value = ''
  showDeleteConfirm.value = true
}

const executeDelete = async () => {
  deleteError.value = ''
  try {
    await store.deleteTeam(deletingTeam.value.id)
    showDeleteConfirm.value = false
    await store.fetchEquipes()
  } catch (e) {
    const m = e?.data?.message ?? e?.message
    deleteError.value = Array.isArray(m) ? m.join(', ') : m || 'Suppression impossible'
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────
const getStatutColor = (s) => ({ en_piste: 'green', en_attente: 'orange', sans_transpondeur: 'red' }[s] || 'grey')
const getStatutLabel = (s) => ({ en_piste: 'En piste', en_attente: 'En attente', sans_transpondeur: 'Sans puce' }[s] || s)
const podiumColor = (rank) => ['amber-darken-2', 'grey-darken-1', 'brown-lighten-1'][rank - 1] || 'blue-grey'
const podiumMedal = (rank) => ['🥇', '🥈', '🥉'][rank - 1] || rank
</script>

<style scoped>
.equipes-page { background: transparent; min-height: 100vh; }

.hero-header {
  background: linear-gradient(135deg, #1a1f36 0%, #2d3561 55%, #1a2040 100%);
  position: relative; overflow: hidden;
}
.hero-header::before {
  content: ''; position: absolute; inset: 0;
  background: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.03'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
}

.hero-icon-wrap {
  width: 40px; height: 40px; background: rgba(255,255,255,0.15);
  border-radius: 10px; display: flex; align-items: center; justify-content: center;
}
.text-white-70 { color: rgba(255,255,255,0.7); }

.kpi-chip {
  display: flex; align-items: center; gap: 10px;
  background: rgba(255,255,255,0.1); backdrop-filter: blur(4px);
  border: 1px solid rgba(255,255,255,0.15);
  border-radius: 12px; padding: 10px 14px;
}
.kpi-icon { width: 32px; height: 32px; border-radius: 8px; display: flex; align-items: center; justify-content: center; }
.bg-blue-alpha { background: rgba(66,133,244,0.3); }
.bg-green-alpha { background: rgba(52,199,89,0.3); }
.bg-orange-alpha { background: rgba(255,149,0,0.3); }
.bg-red-alpha { background: rgba(255,59,48,0.3); }
.kpi-value { font-size: 1.2rem; font-weight: 800; color: white; line-height: 1; }
.kpi-label { font-size: 0.7rem; color: rgba(255,255,255,0.65); text-transform: uppercase; letter-spacing: 0.05em; margin-top: 2px; }

.controls-bar { border: 1px solid rgba(var(--v-theme-on-surface), 0.12); background: rgb(var(--v-theme-surface)); }

.team-card {
  border: 1px solid rgba(var(--v-theme-on-surface), 0.12);
  background: rgb(var(--v-theme-surface));
  cursor: pointer; transition: all 0.2s ease; position: relative; overflow: hidden;
}
.team-card:hover { transform: translateY(-3px); box-shadow: 0 12px 32px rgba(0,0,0,0.10) !important; }

.team-card-accent { position: absolute; top: 0; left: 0; right: 0; height: 3px; border-radius: 12px 12px 0 0; }
.accent-green { background: #34c759; }
.accent-orange { background: #ff9500; }
.accent-red { background: #ff3b30; }
.accent-grey { background: #8e8e93; }

.line-clamp-1 {
  display: -webkit-box;
  -webkit-line-clamp: 1;
  line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.list-card {
  border: 1px solid rgba(var(--v-theme-on-surface), 0.12);
  background: rgb(var(--v-theme-surface));
}
.list-item { cursor: pointer; transition: background 0.15s; }
.list-item:hover { background: rgba(var(--v-theme-on-surface), 0.04); }

.empty-state { text-align: center; }

/* Podium */
.podium-section { background: transparent; }
.podium-item { display: flex; flex-direction: column; align-items: center; }
.podium-avatar { position: relative; display: flex; flex-direction: column; align-items: center; }
.podium-medal { position: absolute; top: -8px; right: -8px; font-size: 1rem; }

.pos-1 .v-avatar { box-shadow: 0 0 20px rgba(255,193,7,0.4); }
.podium-block {
  width: 80px; border-radius: 4px 4px 0 0;
  background: rgba(var(--v-theme-on-surface), 0.08);
  margin-top: 8px;
}
.block-1 { height: 60px; }
.block-2 { height: 45px; }
.block-3 { height: 32px; }

.ranking-row:hover { background: rgba(var(--v-theme-on-surface), 0.04); }

.form-header {
  background: linear-gradient(135deg, #1a1f36 0%, #2d3561 100%);
  border-radius: 12px 12px 0 0;
}
.field-label {
  font-size: 0.8rem; font-weight: 600; margin-bottom: 6px;
  color: rgba(var(--v-theme-on-surface), 0.7);
}
</style>
