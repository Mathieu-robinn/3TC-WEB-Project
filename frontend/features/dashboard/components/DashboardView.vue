<template>
  <v-container fluid class="pa-0 dashboard-page">

    <!-- Hero Header -->
    <div class="dashboard-hero pa-4 pa-md-6 pb-5">
      <div class="d-flex flex-column flex-sm-row align-start align-sm-center justify-space-between flex-wrap gap-3 mb-4">
        <div>
          <h1 class="text-h5 font-weight-black text-white">Dashboard</h1>
          <p class="text-body-2 text-white-70 mt-1">
            <v-icon size="14" class="mr-1">mdi-circle</v-icon>
            Données en temps réel · {{ new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }) }}
          </p>
        </div>
        <div class="d-flex flex-wrap gap-2 w-100 w-sm-auto">
          <v-btn icon="mdi-refresh" variant="tonal" color="white" size="small" @click="refreshAll" :loading="loading" />
          <v-chip color="green" variant="flat" size="small" class="font-weight-bold">
            <v-icon start size="10">mdi-circle</v-icon>
            EN DIRECT
          </v-chip>
        </div>
      </div>

      <!-- Countdown -->
      <v-card class="countdown-card pa-4" rounded="xl" elevation="0">
        <div class="d-flex flex-column flex-sm-row align-start align-sm-center justify-space-between gap-3">
          <div class="min-w-0">
            <div class="text-caption text-medium-emphasis text-uppercase font-weight-bold mb-1">
              <v-icon size="12" class="mr-1">mdi-flag-checkered</v-icon>Temps restant
            </div>
            <div class="countdown-display d-flex align-center flex-wrap gap-1">
              <div class="countdown-box">
                <span class="countdown-num">{{ countdown.hours }}</span>
                <span class="countdown-lbl">h</span>
              </div>
              <span class="countdown-sep">:</span>
              <div class="countdown-box">
                <span class="countdown-num">{{ countdown.minutes }}</span>
                <span class="countdown-lbl">m</span>
              </div>
              <span class="countdown-sep">:</span>
              <div class="countdown-box">
                <span class="countdown-num">{{ countdown.seconds }}</span>
                <span class="countdown-lbl">s</span>
              </div>
            </div>
          </div>
          <v-icon size="48" color="primary" style="opacity:0.3">mdi-timer-outline</v-icon>
        </div>
      </v-card>
    </div>

    <div class="pa-4 pa-md-6 pt-4">

      <!-- KPI Row -->
      <v-row class="mb-4">
        <v-col cols="6" sm="3" v-for="kpi in kpis" :key="kpi.label">
          <v-card class="kpi-card pa-3 pa-sm-4" rounded="xl" elevation="0">
            <div class="d-flex align-center justify-space-between mb-3">
              <div class="kpi-icon-wrap" :style="`background: ${kpi.bgColor}`">
                <v-icon size="18" :color="kpi.color">{{ kpi.icon }}</v-icon>
              </div>
              <v-chip :color="kpi.trend > 0 ? 'green' : 'grey'" size="x-small" variant="tonal">
                {{ kpi.trend > 0 ? '+' : '' }}{{ kpi.trend }}
              </v-chip>
            </div>
            <div class="text-h4 font-weight-black mb-1 dashboard-kpi-value">{{ kpi.value }}</div>
            <div class="text-caption text-medium-emphasis">{{ kpi.label }}</div>
          </v-card>
        </v-col>
      </v-row>

      <v-row>
        <!-- Transponder Stats -->
        <v-col cols="12" md="5">
          <v-card class="data-card pa-4 pa-md-5" rounded="xl" elevation="0" height="100%">
            <div class="d-flex flex-column flex-sm-row align-start align-sm-center justify-space-between gap-2 mb-4">
              <div class="text-subtitle-1 font-weight-bold">État des Transpondeurs</div>
              <v-btn size="x-small" variant="text" color="primary" to="/transpondeurs">Voir tout</v-btn>
            </div>
            <div v-for="s in transponderStatusList" :key="s.key" class="mb-4">
              <div class="d-flex justify-space-between mb-1">
                <div class="d-flex align-center gap-2">
                  <v-chip :color="s.color" size="x-small" variant="flat" class="font-weight-bold">{{ s.label }}</v-chip>
                </div>
                <span class="text-body-2 font-weight-bold">{{ s.value }}</span>
              </div>
              <v-progress-linear
                :model-value="transpStore.totalStats.total > 0 ? (s.value / transpStore.totalStats.total) * 100 : 0"
                :color="s.color"
                rounded
                height="8"
                bg-color="grey-lighten-3"
              />
            </div>
            <v-divider class="my-3" />
            <div class="d-flex justify-space-between text-caption text-medium-emphasis">
              <span>Total</span>
              <span class="font-weight-bold text-body-2">{{ transpStore.totalStats.total }}</span>
            </div>
          </v-card>
        </v-col>

        <!-- Live Ranking Top 5 -->
        <v-col cols="12" md="7">
          <v-card class="data-card pa-4 pa-md-5" rounded="xl" elevation="0" height="100%">
            <div class="d-flex flex-column flex-sm-row align-start align-sm-center justify-space-between gap-2 mb-4">
              <div class="text-subtitle-1 font-weight-bold">🏆 Classement en direct</div>
              <v-btn size="x-small" variant="text" color="primary" to="/equipes">Voir tout</v-btn>
            </div>
            <div v-if="equipeStore.loading" class="d-flex justify-center py-6">
              <v-progress-circular indeterminate color="primary" size="32" />
            </div>
            <div v-else>
              <div
                v-for="(team, idx) in top5"
                :key="team.id"
                class="ranking-row d-flex align-center py-2"
                :class="{ 'ranking-top': idx < 3 }"
              >
                <div class="rank-badge mr-3" :class="`rank-${idx + 1}`">
                  {{ idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : idx + 1 }}
                </div>
                <div class="flex-grow-1">
                  <div class="text-body-2 font-weight-bold">{{ team.name }}</div>
                </div>
                <v-chip color="primary" size="x-small" variant="tonal" class="font-weight-bold">
                  {{ team.nbTour }} tours
                </v-chip>
              </div>
              <div v-if="!top5.length" class="text-center pa-6 text-medium-emphasis text-body-2">
                Chargement du classement...
              </div>
            </div>
          </v-card>
        </v-col>
      </v-row>

      <!-- Recent Transactions -->
      <v-row class="mt-1">
        <v-col cols="12">
          <v-card class="data-card pa-4 pa-md-5" rounded="xl" elevation="0">
            <div class="d-flex flex-column flex-sm-row align-start align-sm-center justify-space-between gap-2 mb-4">
              <div class="text-subtitle-1 font-weight-bold">Dernières transactions</div>
              <v-btn size="x-small" variant="text" color="primary" to="/transpondeurs">Historique complet</v-btn>
            </div>
            <div v-if="!recentTransactions.length" class="text-center pa-5 text-medium-emphasis text-body-2">
              <v-icon size="32" class="mb-2">mdi-swap-horizontal</v-icon><br>Aucune transaction récente
            </div>
            <v-list lines="one" density="compact" class="pa-0" v-else>
              <v-list-item v-for="tx in recentTransactions" :key="tx.id" class="px-0">
                <template #prepend>
                  <v-avatar :color="tx.type === 'OUT' ? 'orange' : 'green'" size="32" class="mr-3">
                    <v-icon size="16" color="white">{{ tx.type === 'OUT' ? 'mdi-arrow-up' : 'mdi-arrow-down' }}</v-icon>
                  </v-avatar>
                </template>
                <v-list-item-title class="text-body-2">
                  Puce {{ tx.transponder?.reference || tx.transponderId }} →
                  {{ tx.runner ? `${tx.runner.firstName} ${tx.runner.lastName}` : 'Coureur inconnu' }}
                </v-list-item-title>
                <v-list-item-subtitle class="text-caption">
                  {{ tx.type === 'OUT' ? 'Distribution' : 'Retour' }} · {{ formatDate(tx.createdAt) }}
                </v-list-item-subtitle>
                <template #append>
                  <v-chip :color="tx.type === 'OUT' ? 'orange' : 'green'" size="x-small" variant="tonal">
                    {{ tx.type }}
                  </v-chip>
                </template>
              </v-list-item>
            </v-list>
          </v-card>
        </v-col>
      </v-row>

      <!-- Quick Action Row -->
      <v-row class="mt-1">
        <v-col cols="12" sm="4" v-for="action in quickActions" :key="action.label">
          <v-card class="action-card pa-4 pa-md-5" rounded="xl" elevation="0" :to="action.to">
            <div class="d-flex align-center gap-3 mb-3">
              <div class="action-icon-wrap" :style="`background: ${action.bgColor}`">
                <v-icon :color="action.color" size="22">{{ action.icon }}</v-icon>
              </div>
              <div>
                <div class="text-subtitle-2 font-weight-bold">{{ action.label }}</div>
                <div class="text-caption text-medium-emphasis">{{ action.sub }}</div>
              </div>
            </div>
            <v-chip :color="action.color" size="x-small" variant="tonal" class="font-weight-bold">
              {{ action.count }}
            </v-chip>
          </v-card>
        </v-col>
      </v-row>
    </div>
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useEquipesStore } from '~/features/equipes/stores/equipes'
import { useParticipantsStore } from '~/features/participants/stores/participants'
import { useTranspondersStore } from '~/features/transpondeurs/stores/transpondeurs'

const equipeStore = useEquipesStore()
const partStore = useParticipantsStore()
const transpStore = useTranspondersStore()

const loading = ref(false)

const refreshAll = async () => {
  loading.value = true
  await Promise.all([
    equipeStore.fetchEquipes(),
    partStore.fetchAll(),
    transpStore.fetchAll(),
    transpStore.fetchTransactions(),
  ])
  loading.value = false
}

onMounted(() => {
  refreshAll()
  startCountdown()
})

onUnmounted(() => {
  if (interval) clearInterval(interval)
})

// ── KPIs ────────────────────────────────────────────────────────
const kpis = computed(() => [
  {
    label: 'Transpondeurs actifs', value: transpStore.totalStats.OUT || 0,
    icon: 'mdi-timer', color: 'orange', bgColor: 'rgba(255,152,0,0.12)', trend: 0,
  },
  {
    label: 'Équipes en course', value: equipeStore.stats.enPiste,
    icon: 'mdi-account-group', color: 'green', bgColor: 'rgba(76,175,80,0.12)', trend: 0,
  },
  {
    label: 'Coureurs inscrits', value: partStore.stats.total,
    icon: 'mdi-run', color: 'blue', bgColor: 'rgba(33,150,243,0.12)', trend: 0,
  },
  {
    label: 'Puces perdues', value: transpStore.totalStats.LOST || 0,
    icon: 'mdi-alert-circle', color: 'red', bgColor: 'rgba(244,67,54,0.12)', trend: 0,
  },
])

const transponderStatusList = computed(() => [
  { key: 'OUT', label: 'Distribué', color: 'orange', value: transpStore.totalStats.OUT || 0 },
  { key: 'IN', label: 'En stock', color: 'green', value: transpStore.totalStats.IN || 0 },
  { key: 'NEW', label: 'Neuf', color: 'blue', value: transpStore.totalStats.NEW || 0 },
  { key: 'LOST', label: 'Perdu', color: 'red', value: transpStore.totalStats.LOST || 0 },
])

const top5 = computed(() => equipeStore.rankingWithDetails.slice(0, 5))

const recentTransactions = computed(() =>
  [...transpStore.transactions]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5),
)

const quickActions = computed(() => [
  {
    label: 'Transpondeurs', sub: 'Gérer les puces',
    icon: 'mdi-timer-outline', color: 'orange', bgColor: 'rgba(255,152,0,0.1)',
    count: `${transpStore.totalStats.OUT || 0} distribués`, to: '/transpondeurs',
  },
  {
    label: 'Équipes', sub: 'Voir le classement',
    icon: 'mdi-account-group-outline', color: 'primary', bgColor: 'rgba(33,150,243,0.1)',
    count: `${equipeStore.stats.total} équipes`, to: '/equipes',
  },
  {
    label: 'Participants', sub: 'Gérer les coureurs',
    icon: 'mdi-account-outline', color: 'green', bgColor: 'rgba(76,175,80,0.1)',
    count: `${partStore.stats.total} coureurs`, to: '/participants',
  },
])

// ── Helpers ──────────────────────────────────────────────────────
const formatDate = (d) => {
  if (!d) return '—'
  return new Date(d).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}

// ── Countdown ────────────────────────────────────────────────────
const countdown = ref({ hours: '24', minutes: '00', seconds: '00' })
let interval = null
let endTime = null

const startCountdown = () => {
  endTime = new Date()
  endTime.setHours(endTime.getHours() + 24)
  interval = setInterval(() => {
    const diff = endTime - new Date()
    if (diff <= 0) {
      countdown.value = { hours: '00', minutes: '00', seconds: '00' }
      clearInterval(interval)
      return
    }
    countdown.value = {
      hours: String(Math.floor(diff / 3600000)).padStart(2, '0'),
      minutes: String(Math.floor((diff % 3600000) / 60000)).padStart(2, '0'),
      seconds: String(Math.floor((diff % 60000) / 1000)).padStart(2, '0'),
    }
  }, 1000)
}
</script>

<style scoped>
.dashboard-page { background: transparent; min-height: 100vh; }

.dashboard-hero {
  background: linear-gradient(135deg, #1a1f36 0%, #2d3561 60%, #1a2040 100%);
  position: relative; overflow: hidden;
}
.dashboard-hero::before {
  content: '';
  position: absolute; inset: 0;
  background: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.03'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
}
.text-white-70 { color: rgba(255,255,255,0.7); }

.countdown-card {
  background: rgba(255,255,255,0.08);
  border: 1px solid rgba(255,255,255,0.12);
  backdrop-filter: blur(8px);
  position: relative; z-index: 1;
}
.countdown-display { gap: 6px; }
.countdown-box { display: flex; align-items: baseline; gap: 2px; }
.countdown-num { font-size: 2rem; font-weight: 900; color: white; line-height: 1; }
.countdown-lbl { font-size: 0.7rem; color: rgba(255,255,255,0.5); text-transform: uppercase; }
.countdown-sep { font-size: 1.5rem; font-weight: 700; color: rgba(255,255,255,0.3); }

.kpi-card { border: 1px solid rgba(var(--v-theme-on-surface), 0.12); transition: box-shadow 0.2s; }
.kpi-card:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.08) !important; }
.kpi-icon-wrap { width: 36px; height: 36px; border-radius: 10px; display: flex; align-items: center; justify-content: center; }

.data-card { border: 1px solid rgba(var(--v-theme-on-surface), 0.12); }

.ranking-row { border-radius: 8px; padding: 6px 8px; transition: background 0.15s; }
.ranking-row:hover { background: rgba(0,0,0,0.02); }
.ranking-top { background: rgba(var(--v-theme-primary), 0.02); }
.rank-badge {
  width: 28px; height: 28px;
  display: flex; align-items: center; justify-content: center;
  font-size: 0.75rem; font-weight: 800;
  border-radius: 50%; background: #f5f6fa;
  flex-shrink: 0;
}
.rank-1, .rank-2, .rank-3 { font-size: 1rem; background: transparent; }

.action-card {
  border: 1px solid rgba(var(--v-theme-on-surface), 0.12);
  cursor: pointer; text-decoration: none; display: block;
  transition: all 0.2s ease;
}
.action-card:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(0,0,0,0.08) !important; }
.action-icon-wrap { width: 44px; height: 44px; border-radius: 12px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }

@media (max-width: 600px) {
  .countdown-num { font-size: 1.35rem; }
  .countdown-sep { font-size: 1.1rem; }
  .dashboard-kpi-value { font-size: 1.35rem !important; line-height: 1.2; }
}
</style>
