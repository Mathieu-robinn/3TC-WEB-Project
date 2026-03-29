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
              <span class="text-h6 font-weight-bold" :class="participant.status === 'au_repos' ? 'text-grey-darken-2' : 'text-white'">
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

        <div v-if="history.length">
          <v-timeline density="compact" align="start" side="end">
            <v-timeline-item
              v-for="(evt, i) in history"
              :key="i"
              dot-color="primary"
              size="x-small"
            >
              <div class="text-body-2 font-weight-medium">{{ evt.event }}</div>
              <div class="text-caption text-medium-emphasis">{{ evt.date }}</div>
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
        <v-btn color="primary" variant="flat" rounded="lg" prepend-icon="mdi-timer-plus">
          Assigner puce
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { computed } from 'vue'
import { transponderDisplay } from '~/utils/transponder'

const props = defineProps({
  modelValue: Boolean,
  participant: Object
})

defineEmits(['update:modelValue'])

const initials = computed(() => {
  const fn = props.participant?.firstName || props.participant?.prenom || ''
  const ln = props.participant?.lastName || props.participant?.nom || ''
  return ((fn[0] || '') + (ln[0] || '')).toUpperCase()
})

const avatarColor = computed(() => {
  const s = props.participant?.status
  if (s === 'en_piste') return 'blue'
  if (s === 'course_terminee') return 'teal'
  return 'grey-lighten-2'
})

const statusLabel = computed(() => {
  const s = props.participant?.status
  if (s === 'course_terminee') return 'Course terminée'
  if (s === 'en_piste') return 'En piste'
  return 'Au repos'
})

const statusChipColor = computed(() => {
  const s = props.participant?.status
  if (s === 'course_terminee') return 'teal-lighten-2'
  if (s === 'en_piste') return 'green-lighten-2'
  return 'orange-lighten-2'
})

const history = computed(() => {
  return props.participant?.historique
    || props.participant?.transponders?.map((t) => ({
        date: '—',
        event: `Transpondeur ${transponderDisplay(t) ?? '?'} — ${t.status}`,
      }))
    || []
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
