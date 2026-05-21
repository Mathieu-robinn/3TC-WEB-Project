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
            variant="tonal"
            color="white"
            prepend-icon="mdi-download"
            rounded="lg"
            class="flex-grow-1 flex-sm-grow-0"
            :disabled="store.loading || !store.transponders.length"
            @click="exportTranspondersCsv()"
          >
            Exporter
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

    <div class="transponders-content pa-3 pa-md-6 pt-3 pt-md-4">
      <v-alert v-if="store.error" type="warning" variant="tonal" rounded="lg" class="mb-4" density="compact">
        {{ store.error }}
      </v-alert>

      <v-card class="controls-bar mb-5" rounded="xl" elevation="0">
        <v-card-text class="pa-3">
          <template v-if="isPhoneFilters">
            <div class="d-flex align-center ga-2">
              <v-text-field
                v-model="store.search"
                class="flex-grow-1"
                prepend-inner-icon="mdi-magnify"
                placeholder="Référence, ID ou équipe…"
                variant="solo-filled"
                density="compact"
                hide-details
                rounded="lg"
                flat
                clearable
              />
              <v-btn
                icon
                variant="tonal"
                rounded="lg"
                density="comfortable"
                :aria-expanded="phoneFiltersExpanded"
                aria-label="Afficher ou masquer les filtres"
                @click="togglePhoneFilters"
              >
                <v-icon size="22">{{ phoneFiltersExpanded ? 'mdi-chevron-up' : 'mdi-triangle-small-down' }}</v-icon>
              </v-btn>
            </div>
            <v-expand-transition>
              <div v-show="phoneFiltersExpanded" class="mt-3">
                <v-row density="comfortable" align="center">
                  <v-col cols="12">
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
                  <v-col cols="12">
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
              </div>
            </v-expand-transition>
          </template>
          <v-row v-else density="comfortable" align="center">
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

        <div v-if="isMobileTable" class="tp-mobile-list pa-2">
          <div v-if="store.loading" class="d-flex justify-center py-8">
            <v-progress-circular indeterminate color="primary" size="32" />
          </div>
          <div
            v-else-if="!tableItems.length"
            class="text-center text-medium-emphasis py-12"
          >
            Aucun transpondeur ne correspond aux filtres.
          </div>
          <div
            v-for="item in tableItems"
            v-else
            :key="item.id"
            class="tp-mobile-card pa-2"
          >
            <div class="d-flex align-start ga-2">
              <v-checkbox
                v-if="isAdmin"
                v-model="selectedIds"
                :value="item.id"
                density="compact"
                hide-details
                class="tp-mobile-card__check flex-shrink-0 mt-0"
              />
              <div class="flex-grow-1 min-w-0">
                <div class="d-flex align-center justify-space-between flex-wrap ga-2 mb-1">
                  <span class="text-body-2 font-weight-medium">{{ labelFor(item) }}</span>
                  <v-chip
                    :color="store.statusColor(item.status)"
                    variant="tonal"
                    size="small"
                    class="font-weight-medium flex-shrink-0"
                  >
                    {{ store.statusLabel(item.status) }}
                  </v-chip>
                </div>
                <div v-if="item.team" class="d-flex align-center ga-1 text-caption text-medium-emphasis mb-2">
                  <v-icon size="14">mdi-account-group</v-icon>
                  <span class="text-truncate">{{ item.team.name || `Équipe #${item.team.id}` }}</span>
                </div>
                <div v-else class="text-caption text-medium-emphasis mb-2">—</div>
                <TransponderRowActions
                  :item="item"
                  :saving="store.saving"
                  compact
                  @link="openLinkDialog"
                  @unlink="onUnlink"
                  @give="openGiveDialog"
                  @unassign="onUnassign"
                  @defective="onMarkAsDefective"
                  @lost="onMarkAsLost"
                  @initialise="onMarkAsInitialise"
                  @history="openHistoryDialog"
                />
              </div>
            </div>
          </div>
        </div>

        <div v-else class="table-scroll-x">
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
              <TransponderRowActions
                :item="item"
                :saving="store.saving"
                @link="openLinkDialog"
                @unlink="onUnlink"
                @give="openGiveDialog"
                @unassign="onUnassign"
                @defective="onMarkAsDefective"
                @lost="onMarkAsLost"
                @initialise="onMarkAsInitialise"
                @history="openHistoryDialog"
              />
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

    <!-- Dialog liaison admin -->
    <v-dialog v-model="linkDialog" v-bind="linkDialogAttrs">
      <v-card rounded="xl" elevation="8">
        <div class="form-header pa-4 d-flex align-center flex-wrap gap-2">
          <v-icon color="white">mdi-link-variant</v-icon>
          <span class="text-h6 text-white font-weight-bold">Lier à une équipe</span>
          <v-spacer />
          <span class="text-body-2 text-white-70">
            #{{ selectedTransponder?.id }}
            <span v-if="selectedTransponder"> · {{ labelFor(selectedTransponder) }}</span>
          </span>
        </div>

        <v-card-text class="px-6 pt-4">
          <p class="text-body-2 text-medium-emphasis mb-4">
            Préparation prestataire : associez la puce à une équipe <strong>sans transpondeur lié ou donné</strong>.
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

        </v-card-text>

        <v-divider />

        <v-card-actions class="px-6 py-4 gap-2">
          <v-spacer />
          <v-btn variant="text" rounded="lg" @click="closeLinkDialog">Annuler</v-btn>
          <v-btn
            color="primary"
            variant="flat"
            rounded="lg"
            :disabled="!selectedTeamId"
            :loading="store.saving"
            prepend-icon="mdi-check"
            @click="onConfirmLink"
          >
            Confirmer la liaison
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Dialog remise au coureur -->
    <v-dialog v-model="giveDialog" v-bind="giveDialogAttrs">
      <v-card rounded="xl" elevation="8">
        <div class="form-header pa-4 d-flex align-center flex-wrap gap-2">
          <v-icon color="white">mdi-hand-extended</v-icon>
          <span class="text-h6 text-white font-weight-bold">Marquer comme donné</span>
          <v-spacer />
          <span class="text-body-2 text-white-70">
            <span v-if="selectedTransponder"> · {{ labelFor(selectedTransponder) }}</span>
            <span v-if="giveTeamName"> · {{ giveTeamName }}</span>
          </span>
        </div>
        <v-card-text class="px-6 pt-4">
          <p class="text-body-2 text-medium-emphasis mb-4">
            Indiquez à quel coureur la puce est remise.
          </p>
          <div v-if="giveLoading" class="d-flex justify-center py-6">
            <v-progress-circular indeterminate color="primary" size="36" />
          </div>
          <v-select
            v-else-if="giveHolderSelectItems.length > 0"
            v-model="selectedHolderRunnerId"
            :items="giveHolderSelectItems"
            item-title="title"
            item-value="value"
            label="Remis à (coureur)"
            variant="outlined"
            density="comfortable"
            rounded="lg"
            hide-details="auto"
          />
          <v-alert v-else type="warning" variant="tonal" rounded="lg" density="compact">
            Aucun coureur trouvé pour cette équipe.
          </v-alert>
        </v-card-text>
        <v-divider />
        <v-card-actions class="px-6 py-4 gap-2">
          <v-spacer />
          <v-btn variant="text" rounded="lg" @click="closeGiveDialog">Annuler</v-btn>
          <v-btn
            color="primary"
            variant="flat"
            rounded="lg"
            :disabled="!selectedHolderRunnerId || giveTeamId == null"
            :loading="store.saving"
            prepend-icon="mdi-check"
            @click="onConfirmGive"
          >
            Confirmer (donné)
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
import { usePhoneFilterExpand } from '~/composables/usePhoneFilterExpand'
import TransponderRowActions from '~/features/transpondeurs/components/TransponderRowActions.vue'
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
import { csvFilename, downloadCsv } from '~/utils/csvExport'
import { TRANSPONDEURS_CSV_HEADERS, transpondersToCsvRows } from '~/utils/exportRows'

const store = useTranspondersStore()
const {
  isAdmin,
  canOperateTransponders,
  canCreateTransponder,
  canRestockTransponder,
  canLinkTransponderToTeam,
  canUnlinkTransponderFromTeam,
} = usePermissions()
const display = useDisplay()
const isMobileTable = computed(() => display.smAndDown.value)
const { isPhoneFilters, phoneFiltersExpanded, togglePhoneFilters } = usePhoneFilterExpand()

const selectedIds = ref([])

const transponderHeadersBase = [
  { title: 'Numéro', key: 'numero', sortable: true },
  { title: 'Statut', key: 'status', sortable: true },
  { title: 'Équipe assignée', key: 'teamName', sortable: true },
  { title: '', key: 'actions', sortable: false, align: 'end', width: '200px' },
]

const tableHeaders = transponderHeadersBase

const linkDialogAttrs = useMobileDialogAttrs(540)
const giveDialogAttrs = useMobileDialogAttrs(480)
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
    label: 'Initialisés',
    value: String(store.totalStats.INITIALISE || 0),
    icon: 'mdi-nfc-variant',
    iconBg: 'bg-purple-alpha',
  },
  {
    label: 'En attente',
    value: String(store.totalStats.EN_ATTENTE || 0),
    icon: 'mdi-link-variant',
    iconBg: 'bg-blue-alpha',
  },
  {
    label: 'Donnés',
    value: String(store.totalStats.DONNE || 0),
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

// --- Dialog liaison ---
const linkDialog = ref(false)
const giveDialog = ref(false)
const selectedTransponder = ref(null)
const selectedTeamId = ref(null)
const selectedHolderRunnerId = ref(null)
const giveTeamId = ref(null)
const giveTeamName = ref('')
const giveLoading = ref(false)
const giveHolderSelectItems = ref([])

async function openLinkDialog(transponder) {
  if (!canLinkTransponderToTeam.value) return
  selectedTransponder.value = transponder
  selectedTeamId.value = null
  linkDialog.value = true
  await store.fetchUnassignedTeams()
}

function closeLinkDialog() {
  linkDialog.value = false
  selectedTransponder.value = null
  selectedTeamId.value = null
}

async function openGiveDialog(transponder) {
  if (!canOperateTransponders.value) return
  selectedTransponder.value = transponder
  giveTeamId.value = transponder.team?.id ?? transponder.teamId ?? null
  giveTeamName.value = transponder.team?.name || ''
  selectedHolderRunnerId.value = null
  giveHolderSelectItems.value = []
  giveDialog.value = true
  giveLoading.value = true
  try {
    const api = useApi()
    const teams = await api.get('/teams')
    const team = Array.isArray(teams) ? teams.find((t) => t.id === giveTeamId.value) : null
    const runners = team?.runners ?? []
    giveHolderSelectItems.value = runners.map((m) => ({
      title: `${m.firstName || ''} ${m.lastName || ''}`.trim() || `Coureur #${m.id}`,
      value: m.id,
    }))
    if (runners.length) {
      const cap = team?.respRunnerId
      selectedHolderRunnerId.value =
        cap != null && runners.some((r) => r.id === cap) ? cap : runners[0].id
    }
    if (team?.name) giveTeamName.value = team.name
  } catch {
    giveHolderSelectItems.value = []
  } finally {
    giveLoading.value = false
  }
}

function closeGiveDialog() {
  giveDialog.value = false
  selectedTransponder.value = null
  giveTeamId.value = null
  giveTeamName.value = ''
  selectedHolderRunnerId.value = null
  giveHolderSelectItems.value = []
}

function teamHasLostTransponder(team) {
  const transponders = team.transponders || []
  return (
    transponders.length > 0 &&
    transponders.every((t) => t.status === 'PERDU' || t.status === 'DEFAILLANT')
  )
}

async function onConfirmLink() {
  if (!canLinkTransponderToTeam.value) return
  if (!selectedTransponder.value || !selectedTeamId.value) return
  try {
    await store.linkTransponderToTeam(selectedTransponder.value.id, selectedTeamId.value)
    closeLinkDialog()
    showSnackbar('Transpondeur lié à l\'équipe.', 'success', 'mdi-check-circle')
  } catch {
    showSnackbar('Erreur lors de la liaison', 'error', 'mdi-alert-circle')
  }
}

async function onConfirmGive() {
  if (!canOperateTransponders.value) return
  if (!selectedTransponder.value || giveTeamId.value == null || !selectedHolderRunnerId.value) return
  try {
    await store.assignTransponder(
      selectedTransponder.value.id,
      giveTeamId.value,
      selectedHolderRunnerId.value,
    )
    closeGiveDialog()
    showSnackbar('Transpondeur donné au coureur.', 'success', 'mdi-check-circle')
  } catch {
    showSnackbar('Erreur lors de la remise', 'error', 'mdi-alert-circle')
  }
}

async function onUnlink(transponder) {
  if (!canUnlinkTransponderFromTeam.value) return
  if (!confirm(`Délier le transpondeur #${transponder.id} de l'équipe ?`)) return
  try {
    await store.unlinkTransponderFromTeam(transponder.id)
    showSnackbar('Transpondeur délié.', 'info', 'mdi-link-off')
  } catch {
    showSnackbar('Erreur lors du déliage', 'error', 'mdi-alert-circle')
  }
}

async function onUnassign(transponder) {
  if (!canOperateTransponders.value) return
  if (transponder.status !== 'DONNE') return
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

async function onMarkAsInitialise(transponder) {
  if (!canRestockTransponder.value) return
  const msg =
    transponder.status === 'PERDU'
      ? `La puce #${transponder.id} a été retrouvée. Remettre en initialisé ?`
      : `Remettre le transpondeur #${transponder.id} en initialisé ?`
  if (!confirm(msg)) return
  try {
    await store.markAsInitialise(transponder.id)
    showSnackbar('Transpondeur remis en initialisé', 'success', 'mdi-package-variant')
  } catch {
    showSnackbar('Erreur lors de la mise à jour', 'error', 'mdi-alert-circle')
  }
}

// --- Snackbar ---
const snackbar = ref({ show: false, message: '', color: 'success', icon: 'mdi-check-circle' })
function showSnackbar(message, color = 'success', icon = 'mdi-check-circle') {
  snackbar.value = { show: true, message, color, icon }
}

function exportTranspondersCsv() {
  if (!isAdmin.value) return
  const rows = transpondersToCsvRows(store.transponders)
  if (!rows.length) return
  downloadCsv(csvFilename('transpondeurs'), [...TRANSPONDEURS_CSV_HEADERS], rows)
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

.tp-mobile-list {
  max-width: 100%;
  overflow-x: hidden;
}

.tp-mobile-card {
  border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.08);
}

.tp-mobile-card:last-child {
  border-bottom: none;
}

.tp-mobile-card__check :deep(.v-selection-control) {
  min-height: 32px;
}
</style>
