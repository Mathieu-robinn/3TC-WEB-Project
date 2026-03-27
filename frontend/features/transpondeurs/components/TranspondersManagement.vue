<template>
  <v-container fluid class="pa-6 transponders-page">
    <!-- Header -->
    <div class="d-flex justify-space-between align-center mb-6 flex-wrap gap-3">
      <div class="d-flex align-center">
        <v-icon size="32" color="grey-darken-2" class="mr-3">mdi-timer-outline</v-icon>
        <div>
          <h1 class="text-h4 font-weight-bold">Gestion des Transpondeurs</h1>
          <p class="text-body-2 text-medium-emphasis mb-0">{{ store.totalStats.total }} puces · API</p>
        </div>
      </div>
      <div class="d-flex align-center gap-3 flex-wrap">
        <v-text-field
          v-model="store.search"
          prepend-inner-icon="mdi-magnify"
          placeholder="Référence, ID ou équipe..."
          variant="outlined"
          density="compact"
          hide-details
          rounded="lg"
          clearable
          style="max-width: 280px"
        />
        <v-select
          v-model="store.filterStatus"
          :items="statusFilterItems"
          item-title="title"
          item-value="value"
          variant="outlined"
          density="compact"
          hide-details
          rounded="lg"
          clearable
          style="max-width: 200px"
          label="Statut"
          @update:model-value="(v) => { if (v == null) store.filterStatus = 'tous' }"
        />
        <v-btn variant="tonal" rounded="lg" prepend-icon="mdi-refresh" :loading="store.loading" @click="store.fetchAll()">
          Actualiser
        </v-btn>
        <v-btn color="primary" variant="flat" rounded="lg" prepend-icon="mdi-plus" :loading="store.saving" @click="onAdd">
          Ajouter
        </v-btn>
      </div>
    </div>

    <v-alert v-if="store.error" type="warning" variant="tonal" rounded="lg" class="mb-4" density="compact">
      {{ store.error }}
    </v-alert>

    <!-- Stats chips -->
    <div class="d-flex gap-3 flex-wrap mb-5">
      <v-chip color="blue" variant="tonal" prepend-icon="mdi-new-box">
        <strong class="mr-1">{{ store.totalStats.DISPONIBLE || 0 }}</strong> Disponibles
      </v-chip>
      <v-chip color="green" variant="tonal" prepend-icon="mdi-run">
        <strong class="mr-1">{{ store.totalStats.ATTRIBUE || 0 }}</strong> Attribués
      </v-chip>
      <v-chip color="red" variant="tonal" prepend-icon="mdi-alert-circle">
        <strong class="mr-1">{{ store.totalStats.PERDU || 0 }}</strong> Perdus
      </v-chip>
    </div>

    <div v-if="store.loading" class="d-flex justify-center py-16">
      <v-progress-circular indeterminate color="primary" size="48" />
    </div>

    <v-card v-else rounded="lg" elevation="0" class="data-border">
      <v-table>
        <thead>
          <tr>
            <th class="text-caption text-uppercase text-medium-emphasis">ID</th>
            <th class="text-caption text-uppercase text-medium-emphasis">Libellé</th>
            <th class="text-caption text-uppercase text-medium-emphasis">Statut</th>
            <th class="text-caption text-uppercase text-medium-emphasis">Équipe assignée</th>
            <th class="text-caption text-uppercase text-medium-emphasis text-center">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="t in store.filteredTransponders" :key="t.id">
            <td class="font-weight-medium text-body-2">{{ t.id }}</td>
            <td class="text-body-2">{{ labelFor(t) }}</td>
            <td>
              <v-chip
                :color="store.statusColor(t.status)"
                variant="tonal"
                size="small"
                class="font-weight-medium"
              >
                {{ store.statusLabel(t.status) }}
              </v-chip>
            </td>
            <td class="font-weight-medium">
              <div v-if="t.runner" class="d-flex align-center gap-2">
                <v-icon size="16" color="primary">mdi-run</v-icon>
                <span>{{ t.runner.firstName }} {{ t.runner.lastName }}</span>
                <span v-if="t.team" class="text-caption text-medium-emphasis ms-1">({{ t.team.name || `#${t.team.id}` }})</span>
              </div>
              <div v-else-if="t.team" class="d-flex align-center gap-2 text-medium-emphasis">
                <v-icon size="16">mdi-account-group</v-icon>
                <span>{{ t.team.name || `Équipe #${t.team.id}` }}</span>
              </div>
              <span v-else class="text-medium-emphasis">—</span>
            </td>
            <td class="text-center">
              <div class="d-flex justify-center gap-1">
                <!-- Bouton assigner une équipe (disponibles pour assignation) -->
                <v-btn
                  v-if="canAssign(t)"
                  icon
                  variant="text"
                  size="small"
                  color="primary"
                  title="Assigner à une équipe"
                  @click="openAssignDialog(t)"
                >
                  <v-icon size="18">mdi-account-group-outline</v-icon>
                </v-btn>
                <!-- Bouton désassigner -->
                <v-btn
                  v-if="t.team || t.runner"
                  icon
                  variant="text"
                  size="small"
                  color="warning"
                  title="Retirer l'assignation"
                  :loading="store.saving"
                  @click="onUnassign(t)"
                >
                  <v-icon size="18">mdi-link-off</v-icon>
                </v-btn>
                <!-- Bouton déclarer perdu -->
                <v-btn
                  v-if="t.status !== 'PERDU'"
                  icon
                  variant="text"
                  size="small"
                  color="red"
                  title="Déclarer perdu"
                  :loading="store.saving"
                  @click="onMarkAsLost(t)"
                >
                  <v-icon size="18">mdi-alert-circle</v-icon>
                </v-btn>
                <v-btn icon variant="text" size="small" disabled title="Historique (bientôt)">
                  <v-icon size="18">mdi-history</v-icon>
                </v-btn>
              </div>
            </td>
          </tr>
        </tbody>
      </v-table>
      <div v-if="!store.filteredTransponders.length" class="text-center text-medium-emphasis py-12">
        Aucun transpondeur ne correspond aux filtres.
      </div>
    </v-card>

    <!-- Dialog d'assignation -->
    <v-dialog v-model="assignDialog" max-width="540" persistent>
      <v-card rounded="xl" elevation="8">
        <v-card-title class="d-flex align-center gap-2 pt-5 px-6">
          <v-icon color="primary">mdi-account-group-outline</v-icon>
          <span>Assigner le transpondeur</span>
        </v-card-title>
        <v-card-subtitle class="px-6 pb-2">
          Transpondeur <strong>#{{ selectedTransponder?.id }}</strong>
          <span v-if="selectedTransponder?.reference"> · {{ selectedTransponder.reference }}</span>
        </v-card-subtitle>

        <v-divider />

        <v-card-text class="px-6 pt-4">
          <p class="text-body-2 text-medium-emphasis mb-4">
            Sélectionnez une équipe <strong>sans transpondeur actif</strong> ou dont le transpondeur a été perdu :
          </p>

          <div v-if="store.loadingTeams" class="d-flex justify-center py-6">
            <v-progress-circular indeterminate color="primary" size="36" />
          </div>

          <v-alert
            v-else-if="store.unassignedTeams.length === 0"
            type="success"
            variant="tonal"
            rounded="lg"
            density="compact"
          >
            Toutes les équipes ont déjà un transpondeur actif. 🎉
          </v-alert>

          <v-list v-else lines="two" rounded="lg" class="team-list">
            <v-list-item
              v-for="team in store.unassignedTeams"
              :key="team.id"
              :class="{ 'selected-team': selectedTeamId === team.id }"
              rounded="lg"
              class="mb-1 team-item"
              @click="selectedTeamId = team.id"
            >
              <template #prepend>
                <v-avatar
                  :color="selectedTeamId === team.id ? 'primary' : 'surface-variant'"
                  size="38"
                >
                  <v-icon :color="selectedTeamId === team.id ? 'white' : 'grey'">
                    {{ selectedTeamId === team.id ? 'mdi-check' : 'mdi-account-group' }}
                  </v-icon>
                </v-avatar>
              </template>
              <v-list-item-title class="font-weight-medium">
                {{ team.name || `Équipe #${team.id}` }}
              </v-list-item-title>
              <v-list-item-subtitle>
                <span v-if="teamHasLostTransponder(team)" class="text-red">
                  <v-icon size="14" class="mr-1">mdi-alert</v-icon>Transpondeur perdu
                </span>
                <span v-else class="text-medium-emphasis">Sans transpondeur</span>
              </v-list-item-subtitle>
            </v-list-item>
          </v-list>

          <v-expand-transition>
            <div v-if="selectedTeamId" class="mt-4 px-2">
              <p class="text-body-2 font-weight-medium mb-3">Sélectionnez le coureur responsable du transpondeur :</p>
              <v-select
                v-model="selectedRunnerId"
                :items="runnersForSelectedTeam"
                item-title="fullName"
                item-value="id"
                placeholder="-- Choisir un coureur --"
                variant="outlined"
                density="comfortable"
                hide-details
                prepend-inner-icon="mdi-run"
                bg-color="surface"
              >
                <template #item="{ props, item }">
                  <v-list-item v-bind="props" prepend-icon="mdi-account" />
                </template>
              </v-select>
              <div v-if="runnersForSelectedTeam.length === 0" class="text-caption text-error mt-1">
                Aucun coureur enregistré pour cette équipe. Impossible d'assigner.
              </div>
            </div>
          </v-expand-transition>
        </v-card-text>

        <v-divider />

        <v-card-actions class="px-6 py-4 gap-2">
          <v-spacer />
          <v-btn variant="text" rounded="lg" @click="closeAssignDialog">Annuler</v-btn>
          <v-btn
            color="primary"
            variant="flat"
            rounded="lg"
            :disabled="!selectedRunnerId"
            :loading="store.saving"
            prepend-icon="mdi-check"
            @click="onConfirmAssign"
          >
            Confirmer l'assignation
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Snackbar feedback -->
    <v-snackbar v-model="snackbar.show" :color="snackbar.color" rounded="lg" timeout="3000" location="bottom right">
      <v-icon class="mr-2">{{ snackbar.icon }}</v-icon>
      {{ snackbar.message }}
    </v-snackbar>
  </v-container>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useTranspondersStore } from '~/features/transpondeurs/stores/transpondeurs'
import { transponderDisplay } from '~/utils/transponder'

const store = useTranspondersStore()

// --- Filtres ---
const statusFilterItems = computed(() => [
  { title: 'Tous les statuts', value: 'tous' },
  ...store.statuses.map((s) => ({ title: store.statusLabel(s), value: s })),
])

function labelFor(t) {
  return transponderDisplay(t) || `#${t.id}`
}

// --- Ajout ---
async function onAdd() {
  try {
    await store.createTransponder({ status: 'DISPONIBLE' })
    showSnackbar('Transpondeur créé avec succès', 'success', 'mdi-check-circle')
  } catch {
    /* erreurs réseau gérées côté store */
  }
}

// --- Dialog assignation ---
const assignDialog = ref(false)
const selectedTransponder = ref(null)
const selectedTeamId = ref(null)
const selectedRunnerId = ref(null)

const runnersForSelectedTeam = computed(() => {
  if (!selectedTeamId.value) return []
  const team = store.unassignedTeams.find((t) => t.id === selectedTeamId.value)
  if (!team || !team.runners) return []
  return team.runners.map((r) => ({ ...r, fullName: `${r.firstName} ${r.lastName}` }))
})

// Réinitialiser le coureur quand l'équipe change
watch(selectedTeamId, () => {
  selectedRunnerId.value = null
})

function canAssign(transponder) {
  // On peut assigner si le transpondeur n'a pas d'équipe active
  return !transponder.team && !transponder.runner
}

async function openAssignDialog(transponder) {
  selectedTransponder.value = transponder
  selectedTeamId.value = null
  selectedRunnerId.value = null
  assignDialog.value = true
  await store.fetchUnassignedTeams()
}

function closeAssignDialog() {
  assignDialog.value = false
  selectedTransponder.value = null
  selectedTeamId.value = null
  selectedRunnerId.value = null
}

function teamHasLostTransponder(team) {
  // Vérifie si l'équipe a des transpondeurs tous perdus
  const transponders = team.transponders || []
  return transponders.length > 0 && transponders.every((t) => t.status === 'PERDU')
}

async function onConfirmAssign() {
  if (!selectedTransponder.value || !selectedTeamId.value || !selectedRunnerId.value) return
  try {
    await store.assignTransponder(selectedTransponder.value.id, selectedTeamId.value, selectedRunnerId.value)
    closeAssignDialog()
    showSnackbar('Transpondeur assigné au coureur avec succès !', 'success', 'mdi-check-circle')
  } catch {
    showSnackbar("Erreur lors de l'assignation", 'error', 'mdi-alert-circle')
  }
}

async function onUnassign(transponder) {
  try {
    await store.unassignTransponder(transponder.id)
    showSnackbar('Assignation retirée', 'info', 'mdi-link-off')
  } catch {
    showSnackbar("Erreur lors du retrait", 'error', 'mdi-alert-circle')
  }
}

async function onMarkAsLost(transponder) {
  if (!confirm(`Confirmer la perte du transpondeur #${transponder.id} ?`)) return
  try {
    await store.markAsLost(transponder.id)
    showSnackbar('Transpondeur déclaré comme perdu', 'warning', 'mdi-alert-circle')
  } catch {
    showSnackbar("Erreur lors de la mise à jour", 'error', 'mdi-alert-circle')
  }
}

// --- Snackbar ---
const snackbar = ref({ show: false, message: '', color: 'success', icon: 'mdi-check-circle' })
function showSnackbar(message, color = 'success', icon = 'mdi-check-circle') {
  snackbar.value = { show: true, message, color, icon }
}

onMounted(() => {
  store.fetchAll()
  store.fetchUnassignedTeams()
})
</script>

<style scoped>
.data-border {
  border: 1px solid rgba(var(--v-theme-on-surface), 0.12);
}

.team-list {
  max-height: 320px;
  overflow-y: auto;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.1);
  padding: 4px;
}

.team-item {
  cursor: pointer;
  transition: background-color 0.18s ease;
}

.team-item:hover {
  background-color: rgba(var(--v-theme-primary), 0.06);
}

.selected-team {
  background-color: rgba(var(--v-theme-primary), 0.12) !important;
  border: 1px solid rgba(var(--v-theme-primary), 0.3);
}
</style>
