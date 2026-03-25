<template>
  <v-dialog :model-value="modelValue" @update:model-value="$emit('update:modelValue', $event)" max-width="760" scrollable>
    <v-card rounded="xl" v-if="equipe">

      <!-- Modal Header (always dark gradient – works in both modes) -->
      <div class="modal-header pa-5 pb-4">
        <div class="d-flex align-center justify-space-between">
          <div class="d-flex align-center gap-3">
            <v-avatar :color="statutColor" size="48">
              <span class="text-body-1 font-weight-bold text-white">{{ (equipe.name || equipe.nom || '?')[0] }}</span>
            </v-avatar>
            <div>
              <div class="text-h6 font-weight-bold text-white">{{ equipe.name || equipe.nom }}</div>
              <div class="d-flex align-center gap-2 mt-1">
                <v-chip :color="statutColor" size="x-small" variant="flat" class="font-weight-bold">{{ statutLabel }}</v-chip>
                <span class="text-caption text-white-60">Capitaine: {{ equipe.capitaine }}</span>
              </div>
            </div>
          </div>
          <v-btn icon="mdi-close" variant="text" color="white" @click="$emit('update:modelValue', false)" />
        </div>

        <!-- Mini KPIs -->
        <v-row class="mt-4" dense>
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

            <div v-if="membres.length === 0" class="empty-runners d-flex flex-column align-center justify-center py-8">
              <v-icon size="40" color="grey" class="mb-2">mdi-account-question-outline</v-icon>
              <span class="text-body-2 text-medium-emphasis">Aucun coureur inscrit</span>
            </div>
            <div class="runners-list" v-else>
              <div
                v-for="(membre, idx) in membres"
                :key="membre.id || idx"
                class="runner-item d-flex align-center"
                :class="{ 'runner-captain': idx === 0 }"
              >
                <v-avatar size="32" :color="idx === 0 ? 'primary' : undefined" class="mr-3">
                  <span class="text-caption font-weight-bold" :class="idx === 0 ? 'text-white' : ''">
                    {{ getInitials(membre) }}
                  </span>
                </v-avatar>
                <div class="flex-grow-1">
                  <div class="text-body-2 font-weight-medium">{{ getFullName(membre) }}</div>
                  <div class="text-caption text-medium-emphasis" v-if="membre.email">{{ membre.email }}</div>
                </div>
                <v-chip v-if="idx === 0" color="primary" size="x-small" variant="tonal">Capitaine</v-chip>
                <v-chip v-else-if="getTransponder(membre)" color="blue" size="x-small" variant="tonal">
                  {{ getTransponder(membre) }}
                </v-chip>
              </div>
            </div>
          </v-col>

          <!-- Transponder section -->
          <v-col cols="12" md="6">
            <div class="section-label mb-3">
              <v-icon size="16" color="primary" class="mr-1">mdi-timer-outline</v-icon>
              <span>Transpondeur actuel</span>
            </div>

            <v-card v-if="equipe.transpondeur" class="transponder-active-card pa-4 mb-4" rounded="lg" elevation="0">
              <div class="d-flex align-center gap-3">
                <div class="transponder-icon-wrap">
                  <v-icon color="blue" size="22">mdi-timer</v-icon>
                </div>
                <div>
                  <div class="text-subtitle-1 font-weight-bold text-blue">{{ equipe.transpondeur }}</div>
                  <div class="text-caption text-medium-emphasis">Actif · En cours d'utilisation</div>
                </div>
                <v-spacer />
                <v-chip color="green" size="x-small" variant="flat">Actif</v-chip>
              </div>
            </v-card>
            <div v-else class="no-transponder-card pa-5 rounded-lg text-center mb-4">
              <v-icon size="36" color="grey" class="mb-2">mdi-timer-off-outline</v-icon>
              <p class="text-body-2 text-medium-emphasis">Aucun transpondeur assigné</p>
            </div>

            <!-- Last transactions from this team's runners -->
            <div class="section-label mb-3 mt-2">
              <v-icon size="16" color="primary" class="mr-1">mdi-history</v-icon>
              <span>Historique</span>
            </div>
            <div v-if="equipe.historiqueTranspondeurs?.length">
              <v-timeline density="compact" align="start" side="end">
                <v-timeline-item
                  v-for="(evt, i) in equipe.historiqueTranspondeurs" :key="i"
                  dot-color="primary" size="x-small"
                >
                  <div class="text-caption font-weight-bold">{{ evt.date }}</div>
                  <div class="text-body-2 text-medium-emphasis">{{ evt.event }}</div>
                  <v-chip size="x-small" variant="outlined" class="mt-1">{{ evt.transpondeur }}</v-chip>
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
        <v-btn color="primary" variant="flat" rounded="lg" prepend-icon="mdi-pencil" @click="$emit('edit', equipe)">
          Modifier
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  modelValue: Boolean,
  equipe: Object,
})

defineEmits(['update:modelValue', 'edit'])

const statutColor = computed(() => ({
  en_piste: 'green',
  en_attente: 'orange',
  sans_transpondeur: 'red',
}[props.equipe?.statut] || 'grey'))

const statutLabel = computed(() => ({
  en_piste: 'En piste',
  en_attente: 'En attente',
  sans_transpondeur: 'Sans puce',
}[props.equipe?.statut] || props.equipe?.statut))

// runners come from equipe.membres (already computed in store as array of Runner objects)
const membres = computed(() => props.equipe?.membres || [])

const getFullName = (m) => typeof m === 'string' ? m : `${m.firstName || ''} ${m.lastName || ''}`.trim()
const getInitials = (m) => getFullName(m).split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
const getTransponder = (m) => {
  if (typeof m === 'string') return null
  return m.transponders?.find(t => t.status === 'OUT')?.reference || null
}
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
  background: rgb(var(--v-theme-surface-variant, var(--v-theme-surface)));
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  border-radius: 12px; padding: 4px 0;
  max-height: 280px; overflow-y: auto;
}

.empty-runners {
  background: rgb(var(--v-theme-surface-variant, var(--v-theme-surface)));
  border: 1px dashed rgba(var(--v-theme-on-surface), 0.12);
  border-radius: 12px;
}

.runner-item {
  padding: 8px 14px; transition: background 0.15s;
  border-radius: 8px; margin: 2px 4px;
}
.runner-item:hover { background: rgba(var(--v-theme-on-surface), 0.04); }
.runner-captain { background: rgba(var(--v-theme-primary), 0.06); }

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

.no-transponder-card {
  background: rgba(var(--v-theme-on-surface), 0.04);
  border: 1px dashed rgba(var(--v-theme-on-surface), 0.16);
}

.no-history-card {
  background: rgba(var(--v-theme-on-surface), 0.04);
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
}
</style>
