<template>
  <v-container fluid class="pa-0 admin-page transponders-page">
    <div class="hero-header pa-4 pa-md-6 pb-4">
      <div class="d-flex flex-column flex-md-row align-start align-md-center justify-space-between gap-4">
        <div>
          <div class="d-flex align-center mb-1">
            <div class="hero-icon-wrap mr-3">
              <v-icon color="white" size="22">mdi-nfc-variant</v-icon>
            </div>
            <h1 class="text-h5 font-weight-bold text-white">Transpondeurs</h1>
          </div>
          <p class="text-body-2 text-white-70 ml-0 ml-md-13">
            {{ store.totalStats.total ?? 0 }} puces · {{ store.filteredTransponders.length }} affichée(s) avec les filtres
          </p>
        </div>
        <div class="d-flex flex-column flex-sm-row flex-wrap w-100 w-md-auto admin-hero-actions">
          <v-btn
            variant="tonal"
            color="white"
            prepend-icon="mdi-refresh"
            rounded="lg"
            class="flex-grow-1 flex-sm-grow-0"
            :loading="store.loading"
            @click="store.fetchAll()"
          >
            Actualiser
          </v-btn>
          <v-btn
            v-if="isAdmin"
            color="error"
            variant="flat"
            rounded="lg"
            prepend-icon="mdi-delete-sweep"
            class="flex-grow-1 flex-sm-grow-0"
            :disabled="!selectedIds.length"
            :loading="store.saving"
            @click="onBulkDelete"
          >
            Supprimer la sélection
          </v-btn>
          <v-btn
            v-if="canCreateTransponder"
            color="white"
            class="text-primary font-weight-bold flex-grow-1 flex-sm-grow-0"
            variant="flat"
            rounded="lg"
            prepend-icon="mdi-plus"
            :loading="store.saving"
            @click="openBatchDialog"
          >
            Ajouter des puces
          </v-btn>
        </div>
      </div>

      <v-row class="mt-4">
        <v-col v-for="(kpi, i) in kpis" :key="i" cols="12" sm="6" md="4" lg="2">
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
      <v-alert v-if="store.error" type="warning" variant="tonal" rounded="lg" class="mb-4" density="compact">
        {{ store.error }}
      </v-alert>

      <v-card class="controls-bar mb-5" rounded="xl" elevation="0">
        <v-card-text class="pa-3">
          <v-row density="comfortable" align="center">
            <v-col cols="12" md="5">
              <v-text-field
                v-model="store.search"
                prepend-inner-icon="mdi-magnify"
                placeholder="Référence, ID ou équipe…"
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
                v-model="store.filterStatus"
                :items="statusFilterItems"
                item-title="title"
                item-value="value"
                label="Statut"
                variant="solo-filled"
                density="compact"
                hide-details
                rounded="lg"
                flat
                clearable
                @update:model-value="(v) => { if (v == null) store.filterStatus = 'tous' }"
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
                @click="store.resetFilters()"
              >
                Réinitialiser les filtres
              </v-btn>
            </v-col>
          </v-row>
        </v-card-text>
      </v-card>

      <v-card class="list-card" rounded="xl" elevation="0">
        <v-toolbar density="comfortable" color="transparent" class="px-2">
          <v-toolbar-title class="text-subtitle-1 font-weight-bold">Liste des puces</v-toolbar-title>
        </v-toolbar>
        <v-divider />

        <div class="table-scroll-x">
        <v-data-table
          v-model="selectedIds"
          :headers="tableHeaders"
          :items="tableItems"
          :loading="store.loading"
          item-value="id"
          :show-select="isAdmin"
          select-strategy="all"
          class="elevation-0 transponders-data-table"
          density="comfortable"
          hide-default-footer
          :items-per-page="-1"
        >
          <template #item.numero="{ item }">
            <span class="text-body-2 font-weight-medium">{{ labelFor(item) }}</span>
          </template>
          <template #item.status="{ item }">
            <v-chip
              :color="store.statusColor(item.status)"
              variant="tonal"
              size="small"
              class="font-weight-medium"
            >
              {{ store.statusLabel(item.status) }}
            </v-chip>
          </template>
          <template #item.teamName="{ item }">
            <div v-if="item.team" class="d-flex align-center gap-2 text-medium-emphasis">
              <v-icon size="16">mdi-account-group</v-icon>
              <span>{{ item.team.name || `Équipe #${item.team.id}` }}</span>
            </div>
            <span v-else class="text-medium-emphasis">—</span>
          </template>
          <template #item.actions="{ item }">
            <div class="d-flex justify-end gap-1">
              <template v-if="canOperateTransponders">
                <v-btn
                  v-if="item.status === 'EN_ATTENTE'"
                  icon
                  variant="text"
                  size="small"
                  color="primary"
                  title="Assigner à une équipe"
                  @click="openAssignDialog(item)"
                >
                  <v-icon size="18">mdi-account-group-outline</v-icon>
                </v-btn>
                <v-btn
                  v-if="item.status === 'ATTRIBUE'"
                  icon
                  variant="text"
                  size="small"
                  color="warning"
                  title="Récupérer le transpondeur (fin de course)"
                  :loading="store.saving"
                  @click="onUnassign(item)"
                >
                  <v-icon size="18">mdi-arrow-u-left-bottom</v-icon>
                </v-btn>
                <v-btn
                  v-if="item.status === 'ATTRIBUE'"
                  icon
                  variant="text"
                  size="small"
                  color="deep-orange"
                  title="Déclarer défaillant (retire la puce de l'équipe)"
                  :loading="store.saving"
                  @click="onMarkAsDefective(item)"
                >
                  <v-icon size="18">mdi-flash-alert</v-icon>
                </v-btn>
                <v-btn
                  v-if="item.status === 'ATTRIBUE'"
                  icon
                  variant="text"
                  size="small"
                  color="red"
                  title="Déclarer perdu"
                  :loading="store.saving"
                  @click="onMarkAsLost(item)"
                >
                  <v-icon size="18">mdi-alert-circle</v-icon>
                </v-btn>
              </template>
              <template v-if="canRestockTransponder">
                <v-btn
                  v-if="item.status === 'DEFAILLANT'"
                  icon
                  variant="text"
                  size="small"
                  color="primary"
                  title="Remettre en stock (en attente)"
                  :loading="store.saving"
                  @click="onMarkAsEnAttente(item)"
                >
                  <v-icon size="18">mdi-package-variant</v-icon>
                </v-btn>
                <v-btn
                  v-if="item.status === 'PERDU'"
                  icon
                  variant="text"
                  size="small"
                  color="primary"
                  title="Remettre en stock (puce retrouvée)"
                  :loading="store.saving"
                  @click="onMarkAsEnAttente(item)"
                >
                  <v-icon size="18">mdi-package-variant</v-icon>
                </v-btn>
              </template>
              <v-btn
                icon
                variant="text"
                size="small"
                color="primary"
                title="Historique des opérations sur cette puce"
                @click="openHistoryDialog(item)"
              >
                <v-icon size="18">mdi-history</v-icon>
              </v-btn>
            </div>
          </template>
          <template #no-data>
            <div class="text-center text-medium-emphasis py-12">
              Aucun transpondeur ne correspond aux filtres.
            </div>
          </template>
        </v-data-table>
        </div>
      </v-card>
    </div>

    <!-- Dialog d'assignation -->
    <v-dialog v-model="assignDialog" v-bind="assignDialogAttrs">
      <v-card rounded="xl" elevation="8">
        <div class="form-header pa-4 d-flex align-center flex-wrap gap-2">
          <v-icon color="white">mdi-account-group-outline</v-icon>
          <span class="text-h6 text-white font-weight-bold">Assigner le transpondeur</span>
          <v-spacer />
          <span class="text-body-2 text-white-70">
            #{{ selectedTransponder?.id }}
            <span v-if="selectedTransponder"> · {{ labelFor(selectedTransponder) }}</span>
          </span>
        </div>

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

          <v-select
            v-if="selectedTeamId && holderSelectItems.length > 0"
            v-model="selectedHolderRunnerId"
            class="mt-4"
            :items="holderSelectItems"
            item-title="title"
            item-value="value"
            label="Remis à (coureur)"
            variant="outlined"
            density="comfortable"
            rounded="lg"
            hide-details="auto"
          />
        </v-card-text>

        <v-divider />

        <v-card-actions class="px-6 py-4 gap-2">
          <v-spacer />
          <v-btn variant="text" rounded="lg" @click="closeAssignDialog">Annuler</v-btn>
          <v-btn
            color="primary"
            variant="flat"
            rounded="lg"
            :disabled="!selectedTeamId || !selectedHolderRunnerId"
            :loading="store.saving"
            prepend-icon="mdi-check"
            @click="onConfirmAssign"
          >
            Confirmer l'assignation
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>


    <!-- Historique d'un transpondeur -->
    <v-dialog v-model="historyDialog" v-bind="historyDialogAttrs" scrollable>
      <v-card rounded="xl" v-if="historyTransponder">
        <div class="form-header pa-4 d-flex align-center">
          <v-icon color="white" class="mr-2">mdi-history</v-icon>
          <span class="text-h6 text-white font-weight-bold">Historique</span>
          <span class="text-body-2 text-white-70 ml-3 d-none d-sm-inline">· {{ labelFor(historyTransponder) }}</span>
          <v-spacer />
          <v-btn icon variant="text" color="white" @click="historyDialog = false">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </div>
        <v-card-text class="px-5 py-4">
          <div v-if="store.transponderHistoryLoading" class="d-flex justify-center py-8">
            <v-progress-circular indeterminate color="primary" size="40" />
          </div>
          <v-alert
            v-else-if="store.transponderHistoryError"
            type="warning"
            variant="tonal"
            density="compact"
            rounded="lg"
          >
            {{ store.transponderHistoryError }}
          </v-alert>
          <div v-else-if="store.transponderHistory.length">
            <v-timeline density="compact" align="start" side="end">
              <v-timeline-item
                v-for="evt in store.transponderHistory"
                :key="evt.id"
                :dot-color="transactionTypeMeta(evt.type).color"
                size="x-small"
              >
                <div class="text-caption font-weight-bold">{{ formatTransactionDate(evt.dateTime) }}</div>
                <div class="text-body-2 text-medium-emphasis">{{ transactionTypeMeta(evt.type).label }}</div>
                <div v-if="evt.team?.name" class="text-caption text-medium-emphasis mt-1">
                  Équipe : {{ evt.team.name }}
                </div>
                <div v-if="actorLabelFromTransaction(evt)" class="text-caption text-medium-emphasis mt-1">
                  Par : {{ actorLabelFromTransaction(evt) }}
                </div>
                <v-chip size="x-small" variant="outlined" class="mt-1 font-weight-medium">
                  {{ transponderLabelFromTransaction(evt) }}
                </v-chip>
              </v-timeline-item>
            </v-timeline>
          </div>
          <div v-else class="text-center text-medium-emphasis py-8">
            <v-icon size="40" color="grey" class="mb-2">mdi-clock-outline</v-icon>
            <p class="text-body-2">Aucune opération enregistrée pour cette puce.</p>
          </div>
        </v-card-text>
        <v-card-actions class="px-5 pb-4">
          <v-spacer />
          <v-btn variant="text" rounded="lg" @click="historyDialog = false">Fermer</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Ajout en lot -->
    <v-dialog v-model="batchDialog" v-bind="batchDialogAttrs">
      <v-card rounded="xl" elevation="8">
        <div class="form-header pa-4 d-flex align-center gap-2">
          <v-icon color="white">mdi-nfc-variant</v-icon>
          <span class="text-h6 text-white font-weight-bold">Ajouter des puces</span>
          <v-spacer />
          <v-btn icon variant="text" color="white" @click="closeBatchDialog">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </div>
        <v-card-text class="px-6 pt-2">
          <p class="text-body-2 text-medium-emphasis mb-3">
            Indiquez des numéros séparés par des virgules et des plages avec un tiret, par ex.
            <code class="text-body-2">1-10, 15, 17-20</code>.
          </p>
          <v-textarea
            v-model="batchInput"
            variant="outlined"
            rows="3"
            rounded="lg"
            hide-details="auto"
            placeholder="1-10, 15, 17-20"
            :error-messages="batchError ? [batchError] : []"
          />
        </v-card-text>
        <v-card-actions class="px-6 py-4 gap-2">
          <v-spacer />
          <v-btn variant="text" rounded="lg" @click="closeBatchDialog">Annuler</v-btn>
          <v-btn
            color="primary"
            variant="flat"
            rounded="lg"
            :loading="store.saving"
            prepend-icon="mdi-check"
            @click="onConfirmBatch"
          >
            Valider
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
import { useDisplay } from 'vuetify/framework'
import { useMobileDialogAttrs } from '~/composables/useMobileDialogAttrs'
import { useTranspondersStore } from '~/features/transpondeurs/stores/transpondeurs'
import { usePermissions } from '~/composables/usePermissions'
import { transponderNumeroLabel } from '~/utils/transponder'
import { parseTransponderNumberRanges } from '~/utils/transponderNumberRanges'
import {
  transactionTypeMeta,
  formatTransactionDate,
  transponderLabelFromTransaction,
  actorLabelFromTransaction,
} from '~/utils/transponderTransactionDisplay'

const store = useTranspondersStore()
const { isAdmin, canOperateTransponders, canCreateTransponder, canRestockTransponder } = usePermissions()
const display = useDisplay()

const selectedIds = ref([])

const transponderHeadersBase = [
  { title: 'Numéro', key: 'numero', sortable: true },
  { title: 'Statut', key: 'status', sortable: true },
  { title: 'Équipe assignée', key: 'teamName', sortable: true },
  { title: '', key: 'actions', sortable: false, align: 'end', width: '200px' },
]

const tableHeaders = computed(() => {
  if (display.smAndDown.value) return transponderHeadersBase.filter((h) => h.key !== 'teamName')
  return transponderHeadersBase
})

const assignDialogAttrs = useMobileDialogAttrs(540)
const historyDialogAttrs = useMobileDialogAttrs(560)
const batchDialogAttrs = useMobileDialogAttrs(520)

const tableItems = computed(() =>
  store.filteredTransponders.map((t) => ({
    ...t,
    teamName: t.team?.name || '',
  })),
)

watch([() => store.search, () => store.filterStatus], () => {
  selectedIds.value = []
})

async function onBulkDelete() {
  if (!isAdmin.value || !selectedIds.value.length) return
  if (
    !confirm(
      `Supprimer définitivement ${selectedIds.value.length} transpondeur(s) ? Les puces encore attribuées à une équipe seront refusées.`,
    )
  )
    return
  try {
    await store.deleteTranspondersBatch(selectedIds.value)
    selectedIds.value = []
    showSnackbar('Transpondeur(s) supprimé(s)', 'success', 'mdi-check-circle')
  } catch {
    showSnackbar('Suppression impossible (vérifiez les attributions ou les droits).', 'error', 'mdi-alert-circle')
  }
}

const historyDialog = ref(false)
const historyTransponder = ref(null)

async function openHistoryDialog(t) {
  historyTransponder.value = t
  store.clearTransponderHistory()
  historyDialog.value = true
  await store.fetchTransponderHistory(t.id)
}

function onHistoryDialogClosed() {
  historyTransponder.value = null
  store.clearTransponderHistory()
}

watch(historyDialog, (open) => {
  if (!open) onHistoryDialogClosed()
})

// --- Filtres ---
const statusFilterItems = computed(() => [
  { title: 'Tous les statuts', value: 'tous' },
  ...store.statuses.map((s) => ({ title: store.statusLabel(s), value: s })),
])

const kpis = computed(() => [
  {
    label: 'En attente',
    value: String(store.totalStats.EN_ATTENTE || 0),
    icon: 'mdi-new-box',
    iconBg: 'bg-blue-alpha',
  },
  {
    label: 'Attribués',
    value: String(store.totalStats.ATTRIBUE || 0),
    icon: 'mdi-run',
    iconBg: 'bg-green-alpha',
  },
  {
    label: 'Perdus',
    value: String(store.totalStats.PERDU || 0),
    icon: 'mdi-alert-circle',
    iconBg: 'bg-red-alpha',
  },
  {
    label: 'Récupérés',
    value: String(store.totalStats.RECUPERE || 0),
    icon: 'mdi-arrow-u-left-bottom',
    iconBg: 'bg-orange-alpha',
  },
  {
    label: 'Défaillants',
    value: String(store.totalStats.DEFAILLANT || 0),
    icon: 'mdi-flash-alert',
    iconBg: 'bg-deep-orange-alpha',
  },
])

function labelFor(t) {
  return transponderNumeroLabel(t)
}

// --- Ajout en lot ---
const batchDialog = ref(false)
const batchInput = ref('')
const batchError = ref('')

function openBatchDialog() {
  if (!canCreateTransponder.value) return
  batchInput.value = ''
  batchError.value = ''
  batchDialog.value = true
}

function closeBatchDialog() {
  batchDialog.value = false
  batchInput.value = ''
  batchError.value = ''
}

async function onConfirmBatch() {
  if (!canCreateTransponder.value) return
  batchError.value = ''
  const parsed = parseTransponderNumberRanges(batchInput.value)
  if (!parsed.ok) {
    batchError.value = parsed.error
    return
  }
  try {
    await store.createTranspondersBatch(parsed.numeros)
    closeBatchDialog()
    showSnackbar(`${parsed.numeros.length} puce(s) créée(s)`, 'success', 'mdi-check-circle')
  } catch {
    showSnackbar('Erreur lors de la création des puces', 'error', 'mdi-alert-circle')
  }
}

// --- Dialog assignation ---
const assignDialog = ref(false)
const selectedTransponder = ref(null)
const selectedTeamId = ref(null)
const selectedHolderRunnerId = ref(null)

const selectedUnassignedTeam = computed(() =>
  store.unassignedTeams.find((t) => t.id === selectedTeamId.value),
)

const holderSelectItems = computed(() => {
  const runners = selectedUnassignedTeam.value?.runners ?? []
  return runners.map((m) => ({
    title: `${m.firstName || ''} ${m.lastName || ''}`.trim() || `Coureur #${m.id}`,
    value: m.id,
  }))
})

watch(selectedTeamId, (id) => {
  const team = store.unassignedTeams.find((t) => t.id === id)
  const runners = team?.runners ?? []
  if (!runners.length) {
    selectedHolderRunnerId.value = null
    return
  }
  const cap = team?.respRunnerId
  selectedHolderRunnerId.value =
    cap != null && runners.some((r) => r.id === cap) ? cap : runners[0].id
})

function canAssign(transponder) {
  return transponder.status === 'EN_ATTENTE'
}

async function openAssignDialog(transponder) {
  if (!canOperateTransponders.value) return
  selectedTransponder.value = transponder
  selectedTeamId.value = null
  selectedHolderRunnerId.value = null
  assignDialog.value = true
  await store.fetchUnassignedTeams()
}

function closeAssignDialog() {
  assignDialog.value = false
  selectedTransponder.value = null
  selectedTeamId.value = null
  selectedHolderRunnerId.value = null
}

function teamHasLostTransponder(team) {
  const transponders = team.transponders || []
  return (
    transponders.length > 0 &&
    transponders.every((t) => t.status === 'PERDU' || t.status === 'DEFAILLANT')
  )
}

async function onConfirmAssign() {
  if (!canOperateTransponders.value) return
  if (!selectedTransponder.value || !selectedTeamId.value || !selectedHolderRunnerId.value) return
  try {
    await store.assignTransponder(
      selectedTransponder.value.id,
      selectedTeamId.value,
      selectedHolderRunnerId.value,
    )
    closeAssignDialog()
    showSnackbar('Transpondeur assigné à l\'équipe avec succès !', 'success', 'mdi-check-circle')
  } catch {
    showSnackbar("Erreur lors de l'assignation", 'error', 'mdi-alert-circle')
  }
}

async function onUnassign(transponder) {
  if (!canOperateTransponders.value) return
  if (transponder.status !== 'ATTRIBUE') return
  if (!confirm(`Confirmer la récupération du transpondeur #${transponder.id} ? Cet état est final.`)) return
  try {
    await store.unassignTransponder(transponder.id)
    showSnackbar('Transpondeur récupéré', 'info', 'mdi-arrow-u-left-bottom')
  } catch {
    showSnackbar("Erreur lors de la récupération", 'error', 'mdi-alert-circle')
  }
}

async function onMarkAsLost(transponder) {
  if (!canOperateTransponders.value) return
  if (!confirm(`Confirmer la perte du transpondeur #${transponder.id} ?`)) return
  try {
    await store.markAsLost(transponder.id)
    showSnackbar('Transpondeur déclaré comme perdu', 'warning', 'mdi-alert-circle')
  } catch {
    showSnackbar("Erreur lors de la mise à jour", 'error', 'mdi-alert-circle')
  }
}

async function onMarkAsDefective(transponder) {
  if (!canOperateTransponders.value) return
  if (
    !confirm(
      `Marquer le transpondeur #${transponder.id} comme défaillant ? La puce sera retirée de l'équipe.`,
    )
  )
    return
  try {
    await store.markAsDefective(transponder.id)
    showSnackbar('Transpondeur marqué comme défaillant', 'deep-orange', 'mdi-flash-alert')
  } catch {
    showSnackbar('Erreur lors de la mise à jour', 'error', 'mdi-alert-circle')
  }
}

async function onMarkAsEnAttente(transponder) {
  if (!canRestockTransponder.value) return
  const msg =
    transponder.status === 'PERDU'
      ? `La puce #${transponder.id} a été retrouvée. Remettre en stock (en attente) ?`
      : `Remettre le transpondeur #${transponder.id} en stock (en attente) ?`
  if (!confirm(msg)) return
  try {
    await store.markAsEnAttente(transponder.id)
    showSnackbar('Transpondeur remis en attente', 'success', 'mdi-package-variant')
  } catch {
    showSnackbar('Erreur lors de la mise à jour', 'error', 'mdi-alert-circle')
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

.transponders-data-table :deep(th.sortable) {
  cursor: pointer;
}
</style>
