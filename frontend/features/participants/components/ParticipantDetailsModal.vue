<template>
  <v-dialog :model-value="modelValue" @update:model-value="$emit('update:modelValue', $event)" max-width="600" scrollable>
    <v-card rounded="xl" v-if="participant">

      <!-- Header -->
      <div class="modal-header pa-5">
        <div class="d-flex align-center justify-space-between">
          <div class="d-flex align-center gap-3">
            <v-avatar
              :color="avatarColor"
              size="52"
            >
              <span class="text-h6 font-weight-bold text-white">
                {{ initials }}
              </span>
            </v-avatar>
            <div>
              <div class="text-h6 font-weight-bold text-white">{{ participant.fullName }}</div>
              <div class="text-caption" style="color: rgba(255,255,255,0.65)">
                <v-icon size="11" class="mr-1">mdi-account-group-outline</v-icon>{{ participant.teamName }}
              </div>
            </div>
          </div>
          <v-btn icon="mdi-close" variant="text" color="white" @click="$emit('update:modelValue', false)" />
        </div>

        <!-- Rôles + mini stats -->
        <div class="d-flex flex-wrap gap-1 mt-3">
          <v-chip v-if="participant.isCaptain" color="primary" size="small" variant="flat">Capitaine</v-chip>
          <v-chip v-if="participant.isTransponderHolder" color="blue-lighten-1" size="small" variant="flat">Resp transpondeur</v-chip>
        </div>
        <v-row class="mt-4" density="comfortable">
          <v-col cols="6">
            <div class="mini-kpi">
              <v-chip v-if="participant.activeTransponder" color="blue-lighten-3" size="small" variant="flat" prepend-icon="mdi-timer" class="font-weight-bold">
                {{ participant.activeTransponder }}
              </v-chip>
              <v-chip v-else color="grey-lighten-1" size="small" variant="flat">Aucun transpondeur</v-chip>
              <div class="text-caption text-white-60 mt-1">Transpondeur actif</div>
            </div>
          </v-col>
          <v-col cols="6">
            <div class="mini-kpi">
              <v-chip :color="statusChipColor" size="small" variant="flat" class="font-weight-bold">
                {{ statusLabel }}
              </v-chip>
              <div class="text-caption text-white-60 mt-1">Statut actuel</div>
            </div>
          </v-col>
        </v-row>
      </div>

      <!-- Content -->
      <v-card-text class="pa-5">

        <!-- Info section -->
        <div class="section-label mb-3">
          <v-icon size="16" color="primary" class="mr-1">mdi-information-outline</v-icon>
          Informations
        </div>
        <v-card class="info-card pa-4 mb-5 rounded-lg" elevation="0">
          <v-row density="comfortable">
            <v-col cols="6">
              <div class="text-caption text-medium-emphasis">Prénom</div>
              <div class="text-body-2 font-weight-medium">{{ participant.firstName || participant.prenom || '—' }}</div>
            </v-col>
            <v-col cols="6">
              <div class="text-caption text-medium-emphasis">Nom</div>
              <div class="text-body-2 font-weight-medium">{{ participant.lastName || participant.nom || '—' }}</div>
            </v-col>
            <v-col cols="12" class="mt-2">
              <div class="text-caption text-medium-emphasis">Équipe</div>
              <div class="text-body-2 font-weight-medium">{{ participant.teamName }}</div>
            </v-col>
          </v-row>
        </v-card>

        <!-- History section -->
        <div class="section-label mb-3">
          <v-icon size="16" color="primary" class="mr-1">mdi-history</v-icon>
          Historique transpondeur
        </div>

        <div v-if="historyLoading" class="d-flex justify-center py-6">
          <v-progress-circular indeterminate color="primary" size="36" width="3" />
        </div>
        <v-alert
          v-else-if="historyError"
          type="warning"
          variant="tonal"
          density="compact"
          rounded="lg"
          class="mb-4 text-body-2"
        >
          {{ historyError }}
        </v-alert>
        <div v-else-if="history.length">
          <v-timeline density="compact" align="start" side="end">
            <v-timeline-item
              v-for="evt in history"
              :key="evt.key"
              :dot-color="evt.color"
              size="x-small"
            >
              <div class="text-body-2 font-weight-medium">{{ evt.event }}</div>
              <div class="text-caption text-medium-emphasis">{{ evt.date }}</div>
              <div v-if="evt.actor" class="text-caption text-medium-emphasis mt-1">Par : {{ evt.actor }}</div>
            </v-timeline-item>
          </v-timeline>
        </div>
        <div v-else class="empty-history text-center pa-6 rounded-lg">
          <v-icon size="36" color="grey-lighten-1" class="mb-2">mdi-clock-outline</v-icon>
          <p class="text-body-2 text-medium-emphasis">Aucun historique disponible</p>
        </div>
      </v-card-text>

      <v-card-actions class="px-5 pb-5 pt-0">
        <v-btn variant="text" color="grey" @click="$emit('update:modelValue', false)">Fermer</v-btn>
        <v-spacer />
        <v-btn
          v-if="showAssignTeamTransponder"
          color="primary"
          variant="flat"
          rounded="lg"
          prepend-icon="mdi-nfc-variant"
          :loading="transpondersStore.saving"
          @click="openAssignTeamDialog"
        >
          Assigner une puce à l'équipe
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <!-- Assignation équipe + détenteur = ce coureur -->
  <v-dialog v-model="assignTeamDialog" max-width="480">
    <v-card rounded="xl" elevation="8">
      <div class="modal-header pa-4 d-flex align-center gap-2">
        <v-icon color="white">mdi-nfc-variant</v-icon>
        <span class="text-h6 text-white font-weight-bold">Assigner une puce</span>
      </div>
      <v-card-text class="px-6 pt-4">
        <p class="text-body-2 text-medium-emphasis mb-4">
          Choisissez une puce <strong>en attente</strong> pour l’équipe ; elle sera remise à
          <strong>{{ participant?.fullName }}</strong>.
        </p>
        <div v-if="transpondersStore.loading" class="d-flex justify-center py-6">
          <v-progress-circular indeterminate color="primary" size="36" />
        </div>
        <v-alert
          v-else-if="!assignSelectItems.length"
          type="warning"
          variant="tonal"
          rounded="lg"
          density="compact"
        >
          Aucune puce en attente disponible.
        </v-alert>
        <v-select
          v-else
          v-model="selectedTransponderId"
          :items="assignSelectItems"
          item-title="title"
          item-value="value"
          label="Puce à assigner"
          variant="outlined"
          density="comfortable"
          rounded="lg"
          hide-details="auto"
        />
      </v-card-text>
      <v-card-actions class="px-6 py-4 gap-2">
        <v-spacer />
        <v-btn variant="text" rounded="lg" @click="assignTeamDialog = false">Annuler</v-btn>
        <v-btn
          color="primary"
          variant="flat"
          rounded="lg"
          :disabled="selectedTransponderId == null"
          :loading="transpondersStore.saving"
          prepend-icon="mdi-check"
          @click="onConfirmAssignTeam"
        >
          Confirmer
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { transponderNumeroLabel } from '~/utils/transponder'
import { useParticipantsStore } from '~/features/participants/stores/participants'
import { useTranspondersStore } from '~/features/transpondeurs/stores/transpondeurs'
import { usePermissions } from '~/composables/usePermissions'
import type { ApiTeam, ApiTransponderRef } from '~/types/api'
import {
  actorLabelFromTransaction,
  formatTransactionDate,
  transactionTypeMeta,
  transponderLabelFromTransaction,
} from '~/utils/transponderTransactionDisplay'

const props = defineProps({
  modelValue: Boolean,
  participant: Object,
})

const emit = defineEmits(['update:modelValue', 'participant-updated'])

const participantsStore = useParticipantsStore()
const transpondersStore = useTranspondersStore()
const { canOperateTransponders } = usePermissions()

const assignTeamDialog = ref(false)
const selectedTransponderId = ref<number | null>(null)

const initials = computed(() => {
  const fn = props.participant?.firstName || props.participant?.prenom || ''
  const ln = props.participant?.lastName || props.participant?.nom || ''
  return ((fn[0] || '') + (ln[0] || '')).toUpperCase()
})

const avatarColor = computed(() => {
  const s = props.participant?.status
  if (s === 'en_piste') return 'blue'
  if (s === 'course_terminee') return 'teal'
  if (s === 'au_repos') return 'error'
  return 'grey-lighten-2'
})

const statusLabel = computed(() => {
  const s = props.participant?.status
  if (s === 'course_terminee') return 'Course terminée'
  if (s === 'en_piste') return 'En piste'
  return 'Sans puce'
})

const statusChipColor = computed(() => {
  const s = props.participant?.status
  if (s === 'course_terminee') return 'teal-lighten-2'
  if (s === 'en_piste') return 'green-lighten-2'
  return 'error'
})

const participantTeam = computed((): ApiTeam | undefined => {
  const id = props.participant?.teamId ?? props.participant?.team?.id
  if (id == null) return undefined
  return participantsStore.teams.find((t) => t.id === id)
})

const teamHasActiveAssignedTransponder = computed(() => {
  const list = (participantTeam.value?.transponders || []) as ApiTransponderRef[]
  return list.some((t) => t.status === 'ATTRIBUE')
})

const showAssignTeamTransponder = computed(
  () =>
    canOperateTransponders.value &&
    participantTeam.value != null &&
    participantTeam.value.courseFinished !== true &&
    !teamHasActiveAssignedTransponder.value &&
    props.participant?.id != null,
)

const availableToAssign = computed(() =>
  transpondersStore.transponders.filter((t) => t.status === 'EN_ATTENTE'),
)

const assignSelectItems = computed(() =>
  availableToAssign.value.map((t) => ({
    title: transponderNumeroLabel(t),
    value: t.id,
  })),
)

async function openAssignTeamDialog() {
  if (!showAssignTeamTransponder.value) return
  selectedTransponderId.value = null
  assignTeamDialog.value = true
  await transpondersStore.fetchAll()
  if (assignSelectItems.value.length === 1) {
    selectedTransponderId.value = assignSelectItems.value[0].value
  }
}

async function onConfirmAssignTeam() {
  const teamId = participantTeam.value?.id
  const runnerId = props.participant?.id
  if (selectedTransponderId.value == null || teamId == null || runnerId == null) return
  try {
    await transpondersStore.assignTransponder(selectedTransponderId.value, teamId, runnerId)
    assignTeamDialog.value = false
    emit('participant-updated')
    emit('update:modelValue', false)
  } catch {
    /* erreurs gérées par l’API / snackbar parent */
  }
}

const historyLoading = ref(false)
const historyError = ref<string | null>(null)
const history = ref<Array<{ key: string; event: string; date: string; actor: string | null; color: string }>>([])

const participantTeamId = computed(() => props.participant?.teamId ?? props.participant?.team?.id ?? null)

function fallbackHistory() {
  const fallback = props.participant?.historique
    || props.participant?.transponders?.map((t) => ({
      date: '—',
      event: `Transpondeur ${transponderNumeroLabel(t)} — ${t.status}`,
    }))
    || []

  return fallback.map((evt, idx) => ({
    key: `fallback-${idx}`,
    event: evt.event,
    date: evt.date,
    actor: null,
    color: 'primary',
  }))
}

async function loadHistory() {
  const teamId = participantTeamId.value
  if (!props.modelValue || teamId == null) return

  historyLoading.value = true
  historyError.value = null
  try {
    const data = await useApi().get(`/transactions/team/${teamId}`)
    const list = Array.isArray(data) ? data : []
    history.value = list.map((evt: any) => ({
      key: String(evt.id),
      event: `${transactionTypeMeta(evt.type).label} · ${transponderLabelFromTransaction(evt)}`,
      date: formatTransactionDate(evt.dateTime),
      actor: actorLabelFromTransaction(evt),
      color: transactionTypeMeta(evt.type).color,
    }))
  } catch {
    history.value = fallbackHistory()
    historyError.value = "Impossible de charger l'historique des transactions."
  } finally {
    historyLoading.value = false
  }
}

watch(
  () => props.modelValue,
  (open) => {
    if (open) loadHistory()
  },
)

watch(participantTeamId, () => {
  if (props.modelValue) loadHistory()
})
</script>

<style scoped>
.modal-header {
  background: linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%);
  border-radius: 12px 12px 0 0;
}

.text-white-60 { color: rgba(255,255,255,0.6); }

.mini-kpi {
  background: rgba(255,255,255,0.08);
  border: 1px solid rgba(255,255,255,0.12);
  border-radius: 10px;
  padding: 10px 14px;
}

.section-label {
  font-size: 0.75rem; font-weight: 700;
  text-transform: uppercase; letter-spacing: 0.08em;
  color: #666; display: flex; align-items: center;
}

.info-card {
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-theme-on-surface), 0.12);
}

.empty-history {
  background: rgb(var(--v-theme-surface));
  border: 1px dashed rgba(var(--v-theme-on-surface), 0.12);
}
</style>
