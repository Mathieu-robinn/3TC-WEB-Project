<template>
  <v-container fluid class="pa-0 dashboard-page">
    <div class="dashboard-hero pa-4 pa-md-6 pb-5">
      <div class="d-flex flex-column flex-sm-row align-start align-sm-center justify-space-between flex-wrap gap-4">
        <div class="min-w-0">
          <h1 class="text-h5 font-weight-black text-white mb-1">
            {{ isAdmin ? 'Dashboard Admin' : 'Espace Bénévole' }}
          </h1>
          <p class="text-body-2 text-white-70 d-flex align-center flex-wrap ga-2 mb-0">
            <v-icon size="14">mdi-circle</v-icon>
            <span>Données en temps réel</span>
            <span>·</span>
            <span>{{ heroDate }}</span>
          </p>
        </div>
        <div class="d-flex flex-wrap gap-2 w-100 w-sm-auto">
          <v-btn icon="mdi-refresh" variant="tonal" color="white" size="small" :loading="loading" @click="refreshAll" />
        </div>
      </div>
    </div>

    <div class="pa-4 pa-md-6 pt-4">
      <v-row class="dashboard-grid" align="stretch">
        <v-col cols="12" lg="8">
          <v-row class="mb-1">
            <v-col cols="12" sm="6" xl="3" v-for="kpi in kpis" :key="kpi.label">
              <v-card class="kpi-card pa-4" rounded="xl" elevation="0" height="100%">
                <div class="d-flex align-start justify-space-between ga-3 mb-4">
                  <div class="kpi-icon-wrap" :style="`background: ${kpi.bgColor}`">
                    <v-icon size="18" :color="kpi.color">{{ kpi.icon }}</v-icon>
                  </div>
                  <v-chip size="x-small" variant="tonal" :color="kpi.color" class="font-weight-bold">
                    {{ kpi.shortLabel }}
                  </v-chip>
                </div>
                <div class="text-h4 font-weight-black mb-2 dashboard-kpi-value">{{ kpi.value }}</div>
                <div class="text-caption text-medium-emphasis">{{ kpi.label }}</div>
              </v-card>
            </v-col>
          </v-row>

          <v-row class="mb-1">
            <v-col cols="12" md="6" v-if="isAdmin">
              <v-card class="data-card pa-4 pa-md-5" rounded="xl" elevation="0" height="100%">
                <div class="section-header mb-4">
                  <div>
                    <div class="text-subtitle-1 font-weight-bold">État des transpondeurs</div>
                    <div class="text-caption text-medium-emphasis">Répartition complète du parc</div>
                  </div>
                  <v-btn size="x-small" variant="text" color="primary" to="/transpondeurs">Voir tout</v-btn>
                </div>

                <div v-for="s in transponderStatusList" :key="s.key" class="status-row">
                  <div class="d-flex justify-space-between align-center ga-3 mb-2">
                    <v-chip :color="s.color" size="x-small" variant="flat" class="font-weight-bold">{{ s.label }}</v-chip>
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

                <v-divider class="my-4" />

                <div class="d-flex justify-space-between text-caption text-medium-emphasis">
                  <span>Total des puces</span>
                  <span class="font-weight-bold text-body-2">{{ transpStore.totalStats.total }}</span>
                </div>
              </v-card>
            </v-col>

            <v-col cols="12" :md="isAdmin ? 6 : 12">
              <v-card class="data-card pa-4 pa-md-5" rounded="xl" elevation="0" height="100%">
                <div class="section-header mb-4">
                  <div>
                    <div class="text-subtitle-1 font-weight-bold">
                      {{ isAdmin ? 'Dernières transactions' : 'Mes dernières transactions' }}
                    </div>
                    <div class="text-caption text-medium-emphasis">Vue rapide des mouvements de puces</div>
                  </div>
                  <v-btn size="x-small" variant="text" color="primary" @click="showHistoryDialog = true">
                    Historique complet
                  </v-btn>
                </div>

                <div v-if="!recentTransactions.length" class="empty-state-card">
                  <v-icon size="32" class="mb-2">mdi-swap-horizontal</v-icon>
                  <span>Aucune transaction récente</span>
                </div>

                <v-list v-else lines="one" density="compact" class="pa-0 recent-list">
                  <v-list-item v-for="tx in recentTransactions" :key="tx.id" class="px-0 recent-list__item">
                    <template #prepend>
                      <v-avatar :color="txTypeColor(tx.type)" size="34" class="recent-list__avatar">
                        <v-icon size="16" color="white">{{ txTypeIcon(tx.type) }}</v-icon>
                      </v-avatar>
                    </template>
                    <v-list-item-title class="text-body-2 font-weight-medium">
                      Puce {{ tx.transponder?.numero || tx.transponderId }} →
                      {{ tx.team?.name || 'Équipe inconnue' }}
                    </v-list-item-title>
                    <v-list-item-subtitle class="text-caption">
                      {{ txTypeLabel(tx.type) }} · {{ formatDate(tx.dateTime) }}
                    </v-list-item-subtitle>
                    <template #append>
                      <v-chip :color="txTypeColor(tx.type)" size="x-small" variant="tonal">{{ txTypeLabel(tx.type) }}</v-chip>
                    </template>
                  </v-list-item>
                </v-list>
              </v-card>
            </v-col>
          </v-row>

          <v-row>
            <v-col cols="12" :sm="isAdmin ? 4 : 6" v-for="action in quickActions" :key="action.label">
              <v-card class="action-card pa-4 pa-md-5" rounded="xl" elevation="0" :to="action.to" height="100%">
                <div class="d-flex align-center ga-3 mb-4">
                  <div class="action-icon-wrap" :style="`background: ${action.bgColor}`">
                    <v-icon :color="action.color" size="22">{{ action.icon }}</v-icon>
                  </div>
                  <div class="min-w-0">
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
        </v-col>

        <v-col cols="12" lg="4" v-if="isAdmin">
          <v-card class="data-card pa-4 pa-md-5 notifications-card" rounded="xl" elevation="0" height="100%">
            <div class="section-header mb-4">
              <div>
                <div class="text-subtitle-1 font-weight-bold">Notifications</div>
                <div class="text-caption text-medium-emphasis">Menu visible directement depuis le dashboard</div>
              </div>
              <v-btn size="x-small" variant="text" color="primary" :loading="notifStore.loading" @click="notifStore.fetchNotifications()">
                Actualiser
              </v-btn>
            </div>

            <div class="notif-toolbar">
              <v-text-field
                v-model="notifStore.notifSearch"
                density="compact"
                variant="outlined"
                hide-details
                clearable
                placeholder="Rechercher…"
                prepend-inner-icon="mdi-magnify"
              />
              <v-select
                v-model="notifStore.notifFilter"
                :items="notifFilterItems"
                item-title="title"
                item-value="value"
                density="compact"
                variant="outlined"
                hide-details
                label="Filtrer"
              />
              <v-select
                v-model="notifStore.notifSortDate"
                :items="notifSortItems"
                item-title="title"
                item-value="value"
                density="compact"
                variant="outlined"
                hide-details
                label="Trier"
              />
            </div>

            <div class="notifications-card__body">
              <div v-if="notifStore.loading && !notifStore.items.length" class="empty-state-card">
                Chargement…
              </div>
              <div v-else-if="!notifStore.items.length" class="empty-state-card">
                Aucune notification.
              </div>
              <div v-else-if="!notifMenuHasRows" class="empty-state-card">
                Aucune notification ne correspond à ces critères.
              </div>
              <template v-else>
                <div v-if="notifSections.emergencyList.length" class="notif-section">
                  <div class="text-caption font-weight-bold text-error mb-2">Urgence</div>
                  <NotifMenuItems
                    :items="notifSections.emergencyList"
                    :is-dark="true"
                    emphasis="error"
                    @seen="notifStore.markSeen"
                    @processed="notifStore.markProcessed"
                  />
                </div>
                <div v-if="notifSections.alertList.length" class="notif-section">
                  <div class="text-caption font-weight-bold text-orange-darken-3 mb-2">Alerte</div>
                  <NotifMenuItems
                    :items="notifSections.alertList"
                    :is-dark="true"
                    emphasis="warning"
                    @seen="notifStore.markSeen"
                    @processed="notifStore.markProcessed"
                  />
                </div>
                <div v-if="notifSections.infoList.length" class="notif-section">
                  <div class="text-caption font-weight-bold text-medium-emphasis mb-2">Information</div>
                  <NotifMenuItems
                    :items="notifSections.infoList"
                    :is-dark="true"
                    emphasis="muted"
                    @seen="notifStore.markSeen"
                    @processed="notifStore.markProcessed"
                  />
                </div>
              </template>
            </div>
          </v-card>
        </v-col>
      </v-row>
    </div>

    <v-dialog v-model="showHistoryDialog" max-width="860">
      <v-card rounded="xl">
        <v-card-title class="d-flex align-center justify-space-between ga-3 py-4 px-5">
          <span class="text-h6 font-weight-bold">Historique complet</span>
          <v-btn icon="mdi-close" variant="text" @click="showHistoryDialog = false" />
        </v-card-title>
        <v-divider />
        <v-card-text class="px-5 py-4">
          <div v-if="!sortedTransactions.length" class="empty-state-card">
            Aucune transaction disponible.
          </div>
          <div v-else class="history-list">
            <div v-for="tx in sortedTransactions" :key="tx.id" class="history-item">
              <div class="history-item__main">
                <div class="d-flex align-center flex-wrap ga-2 mb-1">
                  <v-chip size="x-small" :color="txTypeColor(tx.type)" variant="flat">{{ txTypeLabel(tx.type) }}</v-chip>
                  <span class="text-body-2 font-weight-medium">
                    Puce {{ tx.transponder?.numero || tx.transponderId }}
                  </span>
                  <span class="text-medium-emphasis">→</span>
                  <span class="text-body-2">{{ tx.team?.name || 'Équipe inconnue' }}</span>
                </div>
                <div class="text-caption text-medium-emphasis">
                  {{ formatDateLong(tx.dateTime) }}
                  <span v-if="tx.user">· {{ tx.user.firstName || '' }} {{ tx.user.lastName || '' }}</span>
                </div>
              </div>
            </div>
          </div>
        </v-card-text>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useAuthStore } from '~/features/auth/stores/auth'
import { useEquipesStore } from '~/features/equipes/stores/equipes'
import { useNotificationsStore } from '~/features/notifications/stores/notifications.store'
import NotifMenuItems from '~/features/notifications/components/NotifMenuItems.vue'
import { useParticipantsStore } from '~/features/participants/stores/participants'
import { useTranspondersStore } from '~/features/transpondeurs/stores/transpondeurs'
import type { TransponderStatusApi, TransponderTransaction } from '~/types/api'

const authStore = useAuthStore()
const equipeStore = useEquipesStore()
const partStore = useParticipantsStore()
const transpStore = useTranspondersStore()
const notifStore = useNotificationsStore()

const isAdmin = computed(() => authStore.user?.role === 'ADMIN' || authStore.user?.role === 'SUPER_ADMIN')
const loading = ref(false)
const showHistoryDialog = ref(false)

const notifFilterItems = [
  { title: 'Toutes', value: 'all' },
  { title: 'Non traitées', value: 'unprocessed' },
  { title: 'Non vues', value: 'unseen' },
  { title: 'Urgences', value: 'emergency' },
  { title: 'Alertes', value: 'alert' },
]
const notifSortItems = [
  { title: 'Plus récentes', value: 'desc' },
  { title: 'Plus anciennes', value: 'asc' },
]

const notifSections = computed(() => notifStore.sectionLists)
const notifMenuHasRows = computed(() => {
  const s = notifSections.value
  return s.emergencyList.length + s.alertList.length + s.infoList.length > 0
})

const heroDate = computed(() =>
  new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }),
)

const refreshAll = async () => {
  loading.value = true
  try {
    await Promise.all([
      equipeStore.fetchEquipes(),
      partStore.fetchAll(),
      transpStore.fetchAll(),
      transpStore.fetchTransactions(),
      notifStore.fetchNotifications(),
    ])
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  refreshAll()
})

const kpis = computed(() => {
  const allKpis = [
    {
      label: 'Équipes en course',
      shortLabel: 'Piste',
      value: equipeStore.stats.enPiste,
      icon: 'mdi-account-group',
      color: 'green',
      bgColor: 'rgba(76,175,80,0.12)',
    },
    {
      label: 'Coureurs inscrits',
      shortLabel: 'Total',
      value: partStore.stats.total,
      icon: 'mdi-run',
      color: 'blue',
      bgColor: 'rgba(33,150,243,0.12)',
    },
    {
      label: 'Équipes ayant terminé',
      shortLabel: 'Finish',
      value: equipeStore.stats.termine,
      icon: 'mdi-flag-checkered',
      color: 'teal',
      bgColor: 'rgba(0,137,123,0.12)',
    },
    {
      label: 'Équipes sans puce',
      shortLabel: 'Sans puce',
      value: equipeStore.stats.sansPuce,
      icon: 'mdi-timer-off-outline',
      color: 'deep-orange',
      bgColor: 'rgba(255,87,34,0.12)',
    },
    {
      label: 'Puces perdues ou défaillantes',
      shortLabel: 'Incident',
      value: (transpStore.totalStats.PERDU || 0) + (transpStore.totalStats.DEFAILLANT || 0),
      icon: 'mdi-alert-circle',
      color: 'red',
      bgColor: 'rgba(244,67,54,0.12)',
    },
  ]

  return isAdmin.value ? allKpis : allKpis.slice(0, 2)
})

const transponderStatusList = computed(() => [
  { key: 'ATTRIBUE', label: 'Distribué', color: 'orange', value: transpStore.totalStats.ATTRIBUE || 0 },
  { key: 'EN_ATTENTE', label: 'En attente', color: 'blue', value: transpStore.totalStats.EN_ATTENTE || 0 },
  { key: 'RECUPERE', label: 'Récupéré', color: 'green', value: transpStore.totalStats.RECUPERE || 0 },
  { key: 'PERDU', label: 'Perdu', color: 'red', value: transpStore.totalStats.PERDU || 0 },
  { key: 'DEFAILLANT', label: 'Défaillant', color: 'deep-orange', value: transpStore.totalStats.DEFAILLANT || 0 },
])

const sortedTransactions = computed<TransponderTransaction[]>(() =>
  [...(transpStore.transactions as TransponderTransaction[])].sort(
    (a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime(),
  ),
)

const recentTransactions = computed(() => {
  let txs = [...sortedTransactions.value]
  if (!isAdmin.value && authStore.user?.id) {
    txs = txs.filter((t) => t.userId === authStore.user?.id)
  }
  return txs.slice(0, 6)
})

const quickActions = computed(() => {
  const actions = [
    {
      label: 'Transpondeurs',
      sub: 'Délivrer, récupérer, déclarer',
      icon: 'mdi-timer-outline',
      color: 'orange',
      bgColor: 'rgba(255,152,0,0.1)',
      count: `${transpStore.totalStats.ATTRIBUE || 0} puces distribuées`,
      to: '/transpondeurs',
    },
    {
      label: 'Équipes',
      sub: 'Suivre les équipes et la course',
      icon: 'mdi-account-group-outline',
      color: 'primary',
      bgColor: 'rgba(33,150,243,0.1)',
      count: `${equipeStore.stats.total} équipes`,
      to: '/equipes',
    },
  ]
  if (isAdmin.value) {
    actions.push({
      label: 'Participants',
      sub: 'Gérer les coureurs',
      icon: 'mdi-account-outline',
      color: 'green',
      bgColor: 'rgba(76,175,80,0.1)',
      count: `${partStore.stats.total} coureurs`,
      to: '/participants',
    })
  }
  return actions
})

function txTypeLabel(type: TransponderStatusApi) {
  if (type === 'ATTRIBUE') return 'Distribution'
  if (type === 'RECUPERE') return 'Retour'
  if (type === 'PERDU') return 'Perdu'
  if (type === 'DEFAILLANT') return 'Défaillant'
  return 'En attente'
}

function txTypeColor(type: TransponderStatusApi) {
  if (type === 'ATTRIBUE') return 'orange'
  if (type === 'RECUPERE') return 'green'
  if (type === 'PERDU') return 'red'
  if (type === 'DEFAILLANT') return 'deep-orange'
  return 'blue'
}

function txTypeIcon(type: TransponderStatusApi) {
  if (type === 'ATTRIBUE') return 'mdi-arrow-up'
  if (type === 'RECUPERE') return 'mdi-arrow-down'
  if (type === 'PERDU') return 'mdi-alert'
  if (type === 'DEFAILLANT') return 'mdi-alert-decagram'
  return 'mdi-circle-outline'
}

function formatDate(d?: string) {
  if (!d) return '—'
  return new Date(d).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}

function formatDateLong(d?: string) {
  if (!d) return '—'
  return new Date(d).toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
</script>

<style scoped>
.dashboard-page {
  background: transparent;
  min-height: 100vh;
}

.dashboard-hero {
  background: linear-gradient(135deg, #1a1f36 0%, #2d3561 60%, #1a2040 100%);
  position: relative;
  overflow: hidden;
}

.dashboard-hero::before {
  content: '';
  position: absolute;
  inset: 0;
  background: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.03'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
}

.text-white-70 {
  color: rgba(255, 255, 255, 0.7);
}

.dashboard-grid {
  row-gap: 8px;
}

.section-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.kpi-card,
.data-card,
.action-card {
  border: 1px solid rgba(var(--v-theme-on-surface), 0.12);
}

.kpi-card {
  transition: box-shadow 0.2s ease;
}

.kpi-card:hover {
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.08) !important;
}

.kpi-icon-wrap {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.status-row + .status-row {
  margin-top: 16px;
}

.recent-list__item + .recent-list__item {
  border-top: 1px solid rgba(var(--v-theme-on-surface), 0.08);
}

.recent-list__avatar {
  margin-right: 12px;
}

.action-card {
  cursor: pointer;
  text-decoration: none;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.action-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.08) !important;
}

.action-icon-wrap {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.notifications-card {
  display: flex;
  flex-direction: column;
}

.notif-toolbar {
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
  margin-bottom: 16px;
}

.notifications-card__body {
  flex: 1;
  overflow-y: auto;
  padding-right: 4px;
}

.notif-section + .notif-section {
  margin-top: 16px;
}

.empty-state-card {
  min-height: 160px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  color: rgba(var(--v-theme-on-surface), 0.56);
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-height: 60vh;
  overflow-y: auto;
}

.history-item {
  border: 1px solid rgba(var(--v-theme-on-surface), 0.1);
  border-radius: 12px;
  padding: 12px 14px;
}

@media (max-width: 960px) {
  .notifications-card__body {
    max-height: 420px;
  }
}

@media (max-width: 600px) {
  .dashboard-kpi-value {
    font-size: 1.5rem !important;
    line-height: 1.2;
  }

  .section-header {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
