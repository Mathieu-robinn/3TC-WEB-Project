<template>
  <v-dialog
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    v-bind="equipeDetailDialogAttrs"
    scrollable
  >
    <v-card rounded="xl" v-if="equipe">

      <!-- Modal Header (always dark gradient – works in both modes) -->
      <div class="modal-header pa-5 pb-4">
        <div class="d-flex align-center justify-space-between">
          <div class="d-flex align-center ga-5 flex-grow-1 me-2" style="min-width: 0">
            <v-avatar :color="statutColor" size="48" class="flex-shrink-0">
              <span class="text-body-1 font-weight-bold text-white">{{ (equipe.name || equipe.nom || '?')[0] }}</span>
            </v-avatar>
            <div class="pl-1" style="min-width: 0">
              <div class="text-h6 font-weight-bold text-white">{{ equipe.name || equipe.nom }}</div>
              <div class="mt-3">
                <v-chip :color="statutColor" size="x-small" variant="flat" class="font-weight-bold equipe-header-status-chip">
                  {{ statutLabel }}
                </v-chip>
              </div>
              <div class="text-caption text-white-60 mt-2">Capitaine: {{ equipe.capitaine }}</div>
            </div>
          </div>
          <v-btn icon="mdi-close" variant="text" color="white" class="flex-shrink-0" @click="$emit('update:modelValue', false)" />
        </div>

        <!-- Mini KPIs -->
        <v-row class="mt-4" density="comfortable">
          <v-col cols="4">
            <div class="mini-kpi">
              <div class="text-h5 font-weight-black text-white">{{ equipe.nbTour || 0 }}</div>
              <div class="text-caption text-white-60 text-uppercase">Tours</div>
            </div>
          </v-col>
          <v-col cols="4">
            <div class="mini-kpi">
              <div class="text-h5 font-weight-black text-white">{{ membres.length }}</div>
              <div class="text-caption text-white-60 text-uppercase">Coureurs</div>
            </div>
          </v-col>
          <v-col cols="4">
            <div class="mini-kpi">
              <div class="text-h5 font-weight-black" :class="equipe.transpondeur ? 'text-blue-lighten-2' : 'text-white-40'">
                {{ equipe.transpondeur || '—' }}
              </div>
              <div class="text-caption text-white-60 text-uppercase">Transpondeur</div>
            </div>
          </v-col>
        </v-row>
      </div>

      <!-- Modal Content -->
      <v-card-text class="pa-5">
        <v-row>
          <!-- Runners list -->
          <v-col cols="12" md="6">
            <div class="section-label mb-3">
              <v-icon size="16" color="primary" class="mr-1">mdi-account-multiple</v-icon>
              <span>Coureurs ({{ membres.length }})</span>
            </div>
            <v-select
              v-if="canManageTeams && membres.length > 0"
              v-model="selectedCaptainId"
              class="mb-3"
              :items="captainSelectItems"
              item-title="title"
              item-value="value"
              label="Capitaine"
              variant="outlined"
              density="comfortable"
              rounded="lg"
              hide-details="auto"
              @update:model-value="onCaptainChange"
            />

            <div v-if="membres.length === 0" class="empty-runners d-flex flex-column align-center justify-center py-8">
              <v-icon size="40" color="grey" class="mb-2">mdi-account-question-outline</v-icon>
              <span class="text-body-2 text-medium-emphasis">Aucun coureur inscrit</span>
            </div>
            <div class="runners-list" v-else>
              <div
                v-for="(membre, idx) in membres"
                :key="membre.id || idx"
                class="runner-item d-flex align-start ga-3 flex-wrap"
                :class="{ 'runner-captain': isCaptain(membre), 'runner-holder': isTransponderHolder(membre) }"
              >
                <v-avatar size="32" :color="isCaptain(membre) ? 'primary' : undefined" class="mr-0 flex-shrink-0">
                  <span class="text-caption font-weight-bold" :class="isCaptain(membre) ? 'text-white' : ''">
                    {{ getInitials(membre) }}
                  </span>
                </v-avatar>
                <div class="flex-grow-1 runner-item-text" style="min-width: 0">
                  <div class="text-body-2 font-weight-medium">{{ getFullName(membre) }}</div>
                  <div v-if="membre.email" class="text-caption text-medium-emphasis runner-item-email">{{ membre.email }}</div>
                </div>
                <div class="d-flex flex-wrap ga-2 justify-end runner-item-chips w-100 w-sm-auto ps-sm-0">
                  <v-chip v-if="isCaptain(membre)" color="primary" size="x-small" variant="tonal">Capitaine</v-chip>
                  <v-chip v-if="isTransponderHolder(membre)" color="blue" size="x-small" variant="tonal">Resp transpondeur</v-chip>
                </div>
              </div>
            </div>
          </v-col>

          <!-- Transponder section -->
          <v-col cols="12" md="6">
            <div class="section-label mb-3">
              <v-icon size="16" color="primary" class="mr-1">mdi-timer-outline</v-icon>
              <span>Transpondeur actuel</span>
            </div>

            <v-card v-if="pendingTransponder" class="transponder-pending-card pa-4 mb-2" rounded="lg" elevation="0">
              <div class="d-flex flex-column flex-sm-row align-stretch align-sm-center ga-4">
                <div class="d-flex align-start align-sm-center ga-5 flex-grow-1" style="min-width: 0">
                  <div class="transponder-icon-wrap transponder-icon-wrap--spaced flex-shrink-0">
                    <v-icon color="blue" size="22">mdi-link-variant</v-icon>
                  </div>
                  <div class="flex-grow-1 pt-sm-0" style="min-width: 0">
                    <div class="text-subtitle-1 font-weight-bold text-blue">{{ transponderNumeroLabel(pendingTransponder) }}</div>
                    <div class="text-caption text-medium-emphasis mt-2">En attente de remise au coureur</div>
                  </div>
                </div>
                <v-chip color="blue" size="x-small" variant="flat" class="align-self-start align-self-sm-center flex-shrink-0">
                  En attente
                </v-chip>
              </div>
            </v-card>

            <v-card v-else-if="activeTransponder" class="transponder-active-card pa-4 mb-2" rounded="lg" elevation="0">
              <div
                class="d-flex flex-column flex-sm-row align-stretch align-sm-center ga-4 transponder-active-card__row"
              >
                <div class="d-flex align-start align-sm-center ga-5 flex-grow-1" style="min-width: 0">
                  <div class="transponder-icon-wrap transponder-icon-wrap--spaced flex-shrink-0">
                    <v-icon color="blue" size="22">mdi-timer</v-icon>
                  </div>
                  <div class="flex-grow-1 pt-sm-0" style="min-width: 0">
                    <div class="text-subtitle-1 font-weight-bold text-blue">{{ transponderNumeroLabel(activeTransponder) }}</div>
                    <div class="text-caption text-medium-emphasis mt-2">Donné · En cours d'utilisation</div>
                  </div>
                </div>
                <v-chip color="green" size="x-small" variant="flat" class="transponder-actif-chip align-self-start align-self-sm-center flex-shrink-0">
                  Donné
                </v-chip>
              </div>
            </v-card>
            <div v-else class="no-transponder-card pa-5 rounded-lg text-center mb-2">
              <v-icon size="36" :color="equipeCourseTerminee ? 'teal' : 'grey'" class="mb-2">
                {{ equipeCourseTerminee ? 'mdi-flag-checkered' : 'mdi-timer-off-outline' }}
              </v-icon>
              <p class="text-body-2 text-medium-emphasis">
                {{
                  equipeCourseTerminee
                    ? 'Course terminée — aucune opération possible.'
                    : 'Aucune puce liée à cette équipe.'
                }}
              </p>
            </div>

            <div
              class="d-flex flex-column flex-sm-row flex-wrap ga-4 mb-4 transponder-action-btns"
            >
              <template v-if="activeTransponder?.id != null && canOperateTransponders">
                <v-btn
                  color="warning"
                  variant="tonal"
                  rounded="lg"
                  size="small"
                  class="transponder-action-btn"
                  prepend-icon="mdi-arrow-u-left-bottom"
                  :loading="transpondersStore.saving"
                  @click="onUnassign"
                >
                  Récupérer
                </v-btn>
                <v-btn
                  color="deep-orange"
                  variant="tonal"
                  rounded="lg"
                  size="small"
                  class="transponder-action-btn"
                  prepend-icon="mdi-flash-alert"
                  :loading="transpondersStore.saving"
                  @click="onMarkAsDefective"
                >
                  Déclarer défaillant
                </v-btn>
                <v-btn
                  color="error"
                  variant="tonal"
                  rounded="lg"
                  size="small"
                  class="transponder-action-btn"
                  prepend-icon="mdi-alert-circle"
                  :loading="transpondersStore.saving"
                  @click="onMarkAsLost"
                >
                  Déclarer perdu
                </v-btn>
              </template>
              <template v-else-if="pendingTransponder && !equipeCourseTerminee">
                <v-btn
                  v-if="canOperateTransponders"
                  color="primary"
                  variant="flat"
                  rounded="lg"
                  size="small"
                  prepend-icon="mdi-hand-extended"
                  :loading="transpondersStore.saving"
                  @click="openGiveDialog"
                >
                  Marquer comme donné
                </v-btn>
                <v-btn
                  v-if="canUnlinkTransponderFromTeam"
                  color="grey"
                  variant="tonal"
                  rounded="lg"
                  size="small"
                  prepend-icon="mdi-link-off"
                  :loading="transpondersStore.saving"
                  @click="onUnlink"
                >
                  Délier la puce
                </v-btn>
              </template>
              <v-btn
                v-else-if="showLinkTransponderButton"
                color="primary"
                variant="flat"
                rounded="lg"
                size="small"
                prepend-icon="mdi-link-variant"
                :loading="transpondersStore.saving"
                @click="openLinkDialog"
              >
                Lier à une équipe
              </v-btn>
            </div>

            <!-- Transactions liées à cette équipe -->
            <div class="section-label mb-3 mt-2">
              <v-icon size="16" color="primary" class="mr-1">mdi-history</v-icon>
              <span>Historique</span>
            </div>
            <div v-if="store.historiqueLoading" class="d-flex justify-center align-center py-8">
              <v-progress-circular indeterminate color="primary" size="36" width="3" />
            </div>
            <v-alert
              v-else-if="store.historiqueError"
              type="warning"
              variant="tonal"
              density="compact"
              rounded="lg"
              class="text-body-2"
            >
              {{ store.historiqueError }}
            </v-alert>
            <div v-else-if="store.historique?.length">
              <v-timeline density="compact" align="start" side="end">
                <v-timeline-item
                  v-for="evt in store.historique"
                  :key="evt.id"
                  :dot-color="transactionTypeMeta(evt.type).color"
                  size="x-small"
                >
                  <div class="text-caption font-weight-bold">{{ formatTransactionDate(evt.dateTime) }}</div>
                  <div class="text-body-2 text-medium-emphasis">{{ transactionTypeMeta(evt.type).label }}</div>
                  <div v-if="actorLabelFromTransaction(evt)" class="text-caption text-medium-emphasis mt-1">
                    Par : {{ actorLabelFromTransaction(evt) }}
                  </div>
                  <v-chip size="x-small" variant="outlined" class="mt-1 font-weight-medium">
                    {{ transponderLabel(evt) }}
                  </v-chip>
                </v-timeline-item>
              </v-timeline>
            </div>
            <div v-else class="no-history-card pa-4 rounded-lg text-center">
              <v-icon size="24" color="grey" class="mb-1">mdi-clock-outline</v-icon>
              <p class="text-caption text-medium-emphasis">Aucun historique disponible</p>
            </div>
          </v-col>
        </v-row>
      </v-card-text>

      <v-card-actions class="px-5 pb-5 pt-0">
        <v-btn color="grey" variant="text" rounded="lg" @click="$emit('update:modelValue', false)">Fermer</v-btn>
        <v-spacer />
        <v-btn
          v-if="canManageTeams"
          color="primary"
          variant="flat"
          rounded="lg"
          prepend-icon="mdi-pencil"
          @click="emit('edit', equipe)"
        >
          Modifier
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <!-- Liaison admin : puce initialisée → équipe -->
  <v-dialog v-model="linkDialog" v-bind="linkDialogAttrs">
    <v-card rounded="xl" elevation="8">
      <v-card-title class="d-flex align-center gap-2 pt-5 px-6">
        <v-icon color="primary">mdi-link-variant</v-icon>
        <span>Lier à une équipe</span>
      </v-card-title>
      <v-card-subtitle class="px-6 pb-2">
        Équipe <strong>{{ equipe?.name || equipe?.nom || '—' }}</strong>
      </v-card-subtitle>
      <v-divider />
      <v-card-text class="px-6 pt-4">
        <p class="text-body-2 text-medium-emphasis mb-4">
          Choisissez une puce <strong>initialisée</strong> à associer à cette équipe (préparation prestataire).
        </p>
        <div v-if="transpondersStore.loading" class="d-flex justify-center py-6">
          <v-progress-circular indeterminate color="primary" size="36" />
        </div>
        <v-alert
          v-else-if="initialisedForLink.length === 0"
          type="info"
          variant="tonal"
          rounded="lg"
          density="compact"
        >
          Aucune puce initialisée disponible. Créez-en depuis la page Transpondeurs.
        </v-alert>
        <v-select
          v-else
          v-model="selectedLinkTransponderId"
          :items="linkSelectItems"
          item-title="title"
          item-value="value"
          label="Puce à lier"
          variant="outlined"
          density="comfortable"
          rounded="lg"
          hide-details="auto"
        />
      </v-card-text>
      <v-divider />
      <v-card-actions class="px-6 py-4 gap-2">
        <v-spacer />
        <v-btn variant="text" rounded="lg" @click="linkDialog = false">Annuler</v-btn>
        <v-btn
          color="primary"
          variant="flat"
          rounded="lg"
          :disabled="selectedLinkTransponderId == null"
          :loading="transpondersStore.saving"
          prepend-icon="mdi-check"
          @click="onConfirmLink"
        >
          Confirmer la liaison
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <!-- Remise au coureur (bénévole / admin) -->
  <v-dialog v-model="giveDialog" v-bind="giveDialogAttrs">
      <v-card rounded="xl" elevation="8">
        <v-card-title class="d-flex align-center gap-2 pt-5 px-6">
          <v-icon color="primary">mdi-hand-extended</v-icon>
          <span>Marquer comme donné</span>
        </v-card-title>
        <v-card-subtitle class="px-6 pb-2">
          Équipe <strong>{{ equipe?.name || equipe?.nom || '—' }}</strong>
          <span v-if="pendingTransponder"> · {{ transponderNumeroLabel(pendingTransponder) }}</span>
        </v-card-subtitle>
        <v-divider />
        <v-card-text class="px-6 pt-4">
          <v-select
            v-if="membres.length > 0"
            v-model="selectedHolderRunnerId"
            :items="holderSelectItems"
            item-title="title"
            item-value="value"
            label="Remis à (coureur)"
            variant="outlined"
            density="comfortable"
            rounded="lg"
            hide-details="auto"
          />
          <v-alert v-else type="warning" variant="tonal" rounded="lg" density="compact">
            Aucun coureur dans cette équipe.
          </v-alert>
        </v-card-text>
        <v-divider />
        <v-card-actions class="px-6 py-4 gap-2">
          <v-spacer />
          <v-btn variant="text" rounded="lg" @click="giveDialog = false">Annuler</v-btn>
          <v-btn
            color="primary"
            variant="flat"
            rounded="lg"
            :disabled="pendingTransponder?.id == null || selectedHolderRunnerId == null"
            :loading="transpondersStore.saving"
            prepend-icon="mdi-check"
            @click="onConfirmGive"
          >
            Confirmer la remise
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

  <v-snackbar v-model="snackbar.show" :color="snackbar.color" rounded="lg" timeout="3000" location="bottom right">
    <v-icon class="mr-2">{{ snackbar.icon }}</v-icon>
    {{ snackbar.message }}
  </v-snackbar>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useMobileDialogAttrs } from '~/composables/useMobileDialogAttrs'
import { transponderNumeroLabel } from '~/utils/transponder'
import { useEquipesStore } from '~/features/equipes/stores/equipes'
import { useTranspondersStore } from '~/features/transpondeurs/stores/transpondeurs'
import { usePermissions } from '~/composables/usePermissions'
import { actorLabelFromTransaction, transponderLabelFromTransaction } from '~/utils/transponderTransactionDisplay'
import type { ApiRunner, ApiTransponderRef, TransponderStatusApi, TransponderTransaction } from '~/types/api'

const equipeDetailDialogAttrs = useMobileDialogAttrs(760)
const linkDialogAttrs = useMobileDialogAttrs(520)
const giveDialogAttrs = useMobileDialogAttrs(520)

const { canOperateTransponders, canLinkTransponderToTeam, canUnlinkTransponderFromTeam } =
  usePermissions()

const props = defineProps({
  modelValue: Boolean,
  equipe: Object,
  /** Aligné API : mutations d’équipe réservées aux admins. */
  canManageTeams: { type: Boolean, default: false },
})

const emit = defineEmits(['update:modelValue', 'edit', 'equipe-updated', 'change-captain'])

const store = useEquipesStore()
const transpondersStore = useTranspondersStore()

const linkDialog = ref(false)
const giveDialog = ref(false)
const selectedLinkTransponderId = ref<number | null>(null)
const selectedHolderRunnerId = ref<number | null>(null)
const selectedCaptainId = ref<number | null>(null)

const snackbar = ref({ show: false, message: '', color: 'success', icon: 'mdi-check-circle' })
function showSnackbar(message: string, color = 'success', icon = 'mdi-check-circle') {
  snackbar.value = { show: true, message, color, icon }
}

const teamId = computed(() => props.equipe?.id ?? null)

const activeTransponder = computed(() => {
  const list = (props.equipe?.transponders || []) as ApiTransponderRef[]
  return list.find((t) => t.status === 'DONNE') ?? null
})

const pendingTransponder = computed(() => {
  const list = (props.equipe?.transponders || []) as ApiTransponderRef[]
  return list.find((t) => t.status === 'EN_ATTENTE') ?? null
})

const showLinkTransponderButton = computed(
  () =>
    canLinkTransponderToTeam.value &&
    !equipeCourseTerminee.value &&
    membres.value.length > 0 &&
    !activeTransponder.value &&
    !pendingTransponder.value,
)

const initialisedForLink = computed(() =>
  transpondersStore.transponders.filter((t) => t.status === 'INITIALISE'),
)

const linkSelectItems = computed(() =>
  initialisedForLink.value.map((t) => ({
    title: transponderNumeroLabel(t),
    value: t.id,
  })),
)

const holderSelectItems = computed(() => {
  const list = (props.equipe?.membres || []) as ApiRunner[]
  return list.map((m) => ({
    title: `${m.firstName || ''} ${m.lastName || ''}`.trim() || `Coureur #${m.id}`,
    value: m.id,
  }))
})

const captainSelectItems = computed(() => {
  const list = (props.equipe?.membres || []) as ApiRunner[]
  return list.map((m) => ({
    title: `${m.firstName || ''} ${m.lastName || ''}`.trim() || `Coureur #${m.id}`,
    value: m.id,
  }))
})

function defaultHolderRunnerId() {
  const list = (props.equipe?.membres || []) as ApiRunner[]
  const eq = props.equipe as { respRunnerId?: number | null } | undefined
  if (eq?.respRunnerId != null && list.some((m) => m.id === eq.respRunnerId)) return eq.respRunnerId
  return list[0]?.id ?? null
}

function isCaptain(m: ApiRunner) {
  const id = (props.equipe as { respRunnerId?: number | null })?.respRunnerId
  return id != null && m.id === id
}

function isTransponderHolder(m: ApiRunner) {
  const id = (props.equipe as { transponderHolderRunnerId?: number | null })?.transponderHolderRunnerId
  return id != null && m.id === id
}

function onCaptainChange(runnerId: number | null) {
  const teamId = props.equipe?.id
  if (teamId == null || runnerId == null) return
  const currentCaptainId = (props.equipe as { respRunnerId?: number | null })?.respRunnerId ?? null
  if (runnerId === currentCaptainId) return
  emit('change-captain', { teamId, runnerId })
}

async function openLinkDialog() {
  if (!canLinkTransponderToTeam.value) return
  selectedLinkTransponderId.value = null
  linkDialog.value = true
  await transpondersStore.fetchAll()
  if (linkSelectItems.value.length === 1) {
    selectedLinkTransponderId.value = linkSelectItems.value[0].value
  }
}

async function onConfirmLink() {
  const tid = teamId.value
  if (selectedLinkTransponderId.value == null || tid == null) return
  try {
    await transpondersStore.linkTransponderToTeam(selectedLinkTransponderId.value, tid)
    linkDialog.value = false
    showSnackbar('Puce liée à l\'équipe.', 'success', 'mdi-link-variant')
    await refreshAfterTransponderAction()
  } catch {
    showSnackbar('Erreur lors de la liaison.', 'error', 'mdi-alert-circle')
  }
}

async function onUnlink() {
  const id = pendingTransponder.value?.id
  if (id == null || !canUnlinkTransponderFromTeam.value) return
  if (!confirm('Délier cette puce de l\'équipe ?')) return
  try {
    await transpondersStore.unlinkTransponderFromTeam(id)
    showSnackbar('Puce déliée.', 'info', 'mdi-link-off')
    await refreshAfterTransponderAction()
  } catch {
    showSnackbar('Erreur lors du déliage.', 'error', 'mdi-alert-circle')
  }
}

function openGiveDialog() {
  if (!canOperateTransponders.value) return
  selectedHolderRunnerId.value = defaultHolderRunnerId()
  giveDialog.value = true
}

async function refreshAfterTransponderAction() {
  const id = props.equipe?.id
  if (id == null) return
  await transpondersStore.fetchAll()
  emit('equipe-updated', id)
  await store.fetchHistoriqueTranspondeurs(id)
}

async function onConfirmGive() {
  const tid = teamId.value
  const transponderId = pendingTransponder.value?.id
  if (transponderId == null || tid == null || selectedHolderRunnerId.value == null) return
  try {
    await transpondersStore.assignTransponder(
      transponderId,
      tid,
      selectedHolderRunnerId.value,
    )
    giveDialog.value = false
    showSnackbar('Transpondeur marqué comme donné.', 'success', 'mdi-check-circle')
    await refreshAfterTransponderAction()
  } catch {
    showSnackbar('Erreur lors de la remise.', 'error', 'mdi-alert-circle')
  }
}

async function onUnassign() {
  const id = activeTransponder.value?.id
  if (id == null) return
  if (!confirm(`Confirmer la récupération du transpondeur #${id} ? Cet état est final.`)) return
  try {
    await transpondersStore.unassignTransponder(id)
    showSnackbar('Transpondeur récupéré.', 'info', 'mdi-arrow-u-left-bottom')
    await refreshAfterTransponderAction()
  } catch {
    showSnackbar('Erreur lors de la récupération.', 'error', 'mdi-alert-circle')
  }
}

async function onMarkAsLost() {
  const id = activeTransponder.value?.id
  if (id == null) return
  if (!confirm(`Confirmer la perte du transpondeur #${id} ?`)) return
  try {
    await transpondersStore.markAsLost(id)
    showSnackbar('Transpondeur déclaré comme perdu.', 'warning', 'mdi-alert-circle')
    await refreshAfterTransponderAction()
  } catch {
    showSnackbar('Erreur lors de la mise à jour.', 'error', 'mdi-alert-circle')
  }
}

async function onMarkAsDefective() {
  const id = activeTransponder.value?.id
  if (id == null) return
  if (
    !confirm(
      `Marquer le transpondeur #${id} comme défaillant ? La puce sera retirée de l'équipe.`,
    )
  )
    return
  try {
    await transpondersStore.markAsDefective(id)
    showSnackbar('Transpondeur marqué comme défaillant.', 'deep-orange', 'mdi-flash-alert')
    await refreshAfterTransponderAction()
  } catch {
    showSnackbar('Erreur lors de la mise à jour.', 'error', 'mdi-alert-circle')
  }
}

function transactionTypeMeta(type: TransponderStatusApi) {
  const map: Record<TransponderStatusApi, { label: string; color: string }> = {
    INITIALISE: { label: 'Initialisé', color: 'blue-grey' },
    EN_ATTENTE: { label: 'En attente (lié)', color: 'blue' },
    DONNE: { label: 'Donné', color: 'primary' },
    PERDU: { label: 'Perdu', color: 'error' },
    RECUPERE: { label: 'Récupéré', color: 'success' },
    DEFAILLANT: { label: 'Défaillant', color: 'deep-orange' },
  }
  return map[type] ?? { label: String(type), color: 'grey' }
}

function formatTransactionDate(iso: string | undefined) {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })
}

function transponderLabel(evt: TransponderTransaction) {
  return transponderLabelFromTransaction(evt)
}

watch(
  () => [(props.equipe as { id?: number | null; respRunnerId?: number | null })?.id, (props.equipe as { respRunnerId?: number | null })?.respRunnerId],
  () => {
    selectedCaptainId.value = (props.equipe as { respRunnerId?: number | null })?.respRunnerId ?? null
  },
  { immediate: true },
)

watch(
  () => props.equipe?.id,
  (newId) => {
    if (newId) {
      store.clearTeamHistorique()
      store.fetchHistoriqueTranspondeurs(newId)
    }
  },
  { immediate: true },
)

const statutColor = computed(() => {
  const s = props.equipe?.statut
  if (s === 'en_piste') return 'green'
  if (s === 'en_attente' || s === 'sans_transpondeur' || s === 'aucun membre') return 'error'
  if (s === 'terminé') return 'teal'
  return 'grey'
})

const statutLabel = computed(() => {
  const s = props.equipe?.statut
  if (s === 'en_piste') return 'En piste'
  if (s === 'en_attente' || s === 'sans_transpondeur' || s === 'aucun membre') return 'Sans puce'
  if (s === 'terminé') return 'Terminé'
  return s ?? ''
})

// runners come from equipe.membres (already computed in store as array of Runner objects)
const membres = computed(() => (props.equipe?.membres || []) as ApiRunner[])

const equipeCourseTerminee = computed(
  () => props.equipe?.statut === 'terminé' || props.equipe?.courseFinished === true,
)

const getFullName = (m: ApiRunner | string) =>
  typeof m === 'string' ? m : `${m.firstName || ''} ${m.lastName || ''}`.trim()

const getInitials = (m: ApiRunner | string) =>
  getFullName(m)
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
</script>

<style scoped>
.modal-header {
  background: linear-gradient(135deg, #1a1f36 0%, #2d3561 100%);
  border-radius: 12px 12px 0 0;
}
.text-white-60 { color: rgba(255,255,255,0.6); }
.text-white-40 { color: rgba(255,255,255,0.35); }

.mini-kpi {
  background: rgba(255,255,255,0.08);
  border: 1px solid rgba(255,255,255,0.12);
  border-radius: 10px; padding: 10px; text-align: center;
}

.section-label {
  font-size: 0.75rem; font-weight: 700;
  text-transform: uppercase; letter-spacing: 0.08em;
  color: rgba(var(--v-theme-on-surface), 0.5);
  display: flex; align-items: center;
}

.runners-list {
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  border-radius: 12px; padding: 4px 0;
  max-height: 280px; overflow-y: auto;
}

.empty-runners {
  background: rgb(var(--v-theme-surface));
  border: 1px dashed rgba(var(--v-theme-on-surface), 0.12);
  border-radius: 12px;
}

.runner-item {
  padding: 8px 14px; transition: background 0.15s;
  border-radius: 8px; margin: 2px 4px;
}
.runner-item:hover { background: rgba(var(--v-theme-on-surface), 0.04); }
.runner-captain { background: rgba(var(--v-theme-primary), 0.06); }
.runner-holder { background: rgba(25, 118, 210, 0.05); }

.transponder-active-card {
  background: rgba(25, 118, 210, 0.08);
  border: 1px solid rgba(25, 118, 210, 0.2);
}
.transponder-icon-wrap {
  width: 40px; height: 40px;
  background: rgba(25, 118, 210, 0.12);
  border-radius: 10px;
  display: flex; align-items: center; justify-content: center;
}

.transponder-icon-wrap--spaced {
  margin-top: 2px;
}

.equipe-header-status-chip {
  margin-top: 2px;
}

.transponder-action-btn {
  width: 100%;
}

@media (min-width: 600px) {
  .transponder-action-btn {
    width: auto;
  }
}

.runner-item-email {
  margin-top: 6px;
  line-height: 1.35;
}

.no-transponder-card {
  background: rgba(var(--v-theme-on-surface), 0.04);
  border: 1px dashed rgba(var(--v-theme-on-surface), 0.16);
}

.no-history-card {
  background: rgba(var(--v-theme-on-surface), 0.04);
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
}
</style>
