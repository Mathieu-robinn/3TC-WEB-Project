<template>
  <v-container fluid class="pa-0 admin-page logs-page">
    <div class="hero-header pa-4 pa-md-6 pb-4">
      <div class="d-flex flex-column flex-md-row align-start align-md-center justify-space-between gap-4">
        <div>
          <div class="d-flex align-center mb-1">
            <div class="hero-icon-wrap mr-3">
              <v-icon color="white" size="22">mdi-text-box-outline</v-icon>
            </div>
            <h1 class="text-h5 font-weight-bold text-white">Logs</h1>
          </div>
          <p class="text-body-2 text-white-70 ml-0 ml-md-13">
            Journal d’audit · {{ total }} entrée(s) · réservé aux administrateurs
          </p>
        </div>
        <div class="d-flex flex-wrap w-100 w-md-auto admin-hero-actions">
          <v-btn
            variant="tonal"
            color="white"
            prepend-icon="mdi-refresh"
            rounded="lg"
            :loading="loading"
            @click="fetchLogs"
          >
            Actualiser
          </v-btn>
        </div>
      </div>
    </div>

    <div class="pa-4 pa-md-6 pt-4">
      <v-card class="controls-bar mb-5" rounded="xl" elevation="0">
        <v-card-text class="pa-3">
          <v-row density="comfortable" align="center">
            <v-col cols="12" md="4">
              <v-select
                v-model="filterTypes"
                :items="logTypeItems"
                item-title="title"
                item-value="value"
                label="Types de log"
                variant="solo-filled"
                density="compact"
                hide-details
                rounded="lg"
                flat
                multiple
                chips
                closable-chips
                clearable
              />
            </v-col>
            <v-col cols="12" md="4">
              <v-text-field
                v-model="filterUserSearch"
                prepend-inner-icon="mdi-account-search"
                placeholder="Prénom ou nom de l’auteur"
                variant="solo-filled"
                density="compact"
                hide-details
                rounded="lg"
                flat
                clearable
              />
            </v-col>
            <v-col cols="12" sm="6" md="2">
              <v-select
                v-model="filterSort"
                :items="sortItems"
                item-title="title"
                item-value="value"
                label="Tri"
                variant="solo-filled"
                density="compact"
                hide-details
                rounded="lg"
                flat
              />
            </v-col>
            <v-col cols="12" sm="6" md="2">
              <v-btn
                variant="tonal"
                color="secondary"
                rounded="lg"
                block
                class="text-none"
                prepend-icon="mdi-filter-off"
                @click="resetFilters"
              >
                Réinitialiser
              </v-btn>
            </v-col>
            <v-col cols="12" sm="6" md="3">
              <v-text-field
                v-model="filterFrom"
                type="datetime-local"
                label="À partir de"
                variant="solo-filled"
                density="compact"
                hide-details
                rounded="lg"
                flat
                clearable
              />
            </v-col>
            <v-col cols="12" sm="6" md="3">
              <v-text-field
                v-model="filterTo"
                type="datetime-local"
                label="Jusqu’à"
                variant="solo-filled"
                density="compact"
                hide-details
                rounded="lg"
                flat
                clearable
              />
            </v-col>
            <v-col cols="12" md="6" class="d-flex align-center">
              <v-btn color="primary" rounded="lg" prepend-icon="mdi-filter" class="text-none" @click="applyFilters">
                Appliquer les filtres
              </v-btn>
            </v-col>
          </v-row>
        </v-card-text>
      </v-card>

      <v-card class="list-card" rounded="xl" elevation="0">
        <v-toolbar density="comfortable" color="transparent" class="px-2">
          <v-toolbar-title class="text-subtitle-1 font-weight-bold">Entrées</v-toolbar-title>
        </v-toolbar>
        <v-divider />
        <div class="table-scroll-x">
        <v-data-table
          :headers="tableHeaders"
          :items="items"
          item-value="id"
          :loading="loading"
          class="elevation-0 logs-table"
          density="comfortable"
          hide-default-footer
          :items-per-page="-1"
          @click:row="onRowClick"
        >
          <template #item.dateTime="{ item }">
            {{ formatDate(item.dateTime) }}
          </template>
          <template #item.type="{ item }">
            <v-chip size="small" variant="tonal" color="primary" class="text-caption">
              {{ logTypeLabel(item.type) }}
            </v-chip>
          </template>
          <template #item.user="{ item }">
            <span class="text-body-2">{{ userLabel(item.user) }}</span>
          </template>
          <template #item.message="{ item }">
            <span class="text-body-2 message-preview">{{ truncate(item.message, 120) }}</span>
          </template>
        </v-data-table>
        </div>
        <v-divider />
        <div class="d-flex flex-wrap align-center justify-space-between gap-3 pa-4">
          <span class="text-body-2 text-medium-emphasis">Page {{ page }} / {{ pageCount || 1 }}</span>
          <v-pagination
            v-model="page"
            :length="pageCount"
            :total-visible="paginationTotalVisible"
            rounded="lg"
            density="comfortable"
            @update:model-value="() => fetchLogs()"
          />
        </div>
      </v-card>
    </div>

    <v-dialog v-model="detailOpen" v-bind="detailDialogAttrs" scrollable>
      <v-card rounded="xl">
        <v-card-title class="d-flex align-center justify-space-between">
          <span>Détail du log</span>
          <v-btn icon variant="text" @click="detailOpen = false">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>
        <v-divider />
        <v-card-text v-if="detailLoading" class="pa-6 text-center">
          <v-progress-circular indeterminate color="primary" />
        </v-card-text>
        <v-card-text v-else-if="detailLog" class="pa-4">
          <dl class="detail-dl">
            <dt>Identifiant</dt>
            <dd>{{ detailLog.id }}</dd>
            <dt>Date / heure</dt>
            <dd>{{ formatDate(detailLog.dateTime) }}</dd>
            <dt>Type</dt>
            <dd>{{ logTypeLabel(detailLog.type) }} ({{ detailLog.type }})</dd>
            <dt>Auteur</dt>
            <dd>
              {{ userLabel(detailLog.user) }}
              <div class="text-caption text-medium-emphasis">{{ detailLog.user.email }} · {{ detailLog.user.role }}</div>
            </dd>
            <dt>Message</dt>
            <dd class="message-full">{{ detailLog.message }}</dd>
            <template v-if="detailLog.details != null">
              <dt>Détails (JSON)</dt>
              <dd>
                <pre class="details-pre">{{ detailsJson(detailLog.details) }}</pre>
              </dd>
            </template>
          </dl>
        </v-card-text>
        <v-card-text v-else class="pa-4 text-error">Impossible de charger ce log.</v-card-text>
      </v-card>
    </v-dialog>

    <v-snackbar v-model="snackbar.show" :color="snackbar.color" :timeout="4000">
      {{ snackbar.text }}
    </v-snackbar>
  </v-container>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useDisplay } from 'vuetify/framework'
import { useApi } from '~/composables/useApi'
import { useMobileDialogAttrs } from '~/composables/useMobileDialogAttrs'

interface LogUser {
  id: number
  firstName: string
  lastName: string
  email: string
  role: string
}

interface LogRow {
  id: number
  dateTime: string
  message: string
  type: string
  userId: number
  details?: unknown | null
  user: LogUser
}

const LOG_TYPE_LABELS: Record<string, string> = {
  ADD_USER: 'Ajout utilisateur',
  DELETE_USER: 'Suppression utilisateur',
  ADD_TRANSPONDER: 'Ajout transpondeur',
  DELETE_TRANSPONDER: 'Suppression transpondeur',
  GIVE_TRANSPONDER: 'Attribution transpondeur',
  LOOSE_TRANSPONDER: 'Transpondeur perdu',
  RETURN_TRANSPONDER: 'Récupération transpondeur',
  DEFECT_TRANSPONDER: 'Transpondeur défaillant',
  NOTIFICATION_MANUAL: 'Notification manuelle',
  NOTIFICATION_AUTOMATIC: 'Notification automatique',
}

const logTypeItems = Object.entries(LOG_TYPE_LABELS).map(([value, title]) => ({ value, title }))

const sortItems = [
  { title: 'Plus récent en premier', value: 'desc' },
  { title: 'Plus ancien en premier', value: 'asc' },
]

const api = useApi()
const display = useDisplay()
const loading = ref(false)
const items = ref<LogRow[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(20)

const filterTypes = ref<string[]>([])
const appliedTypes = ref<string[]>([])
const filterUserSearch = ref('')
const appliedUserSearch = ref('')
const filterSort = ref<'asc' | 'desc'>('desc')
const appliedSort = ref<'asc' | 'desc'>('desc')
const filterFrom = ref('')
const filterTo = ref('')
const appliedFrom = ref('')
const appliedTo = ref('')

const detailOpen = ref(false)
const detailLoading = ref(false)
const detailLog = ref<LogRow | null>(null)

const snackbar = reactive({ show: false, text: '', color: 'success' })

const pageCount = computed(() => Math.max(1, Math.ceil(total.value / pageSize.value)))

const logHeadersBase = [
  { title: 'Date / heure', key: 'dateTime', sortable: false, width: '170px' },
  { title: 'Type', key: 'type', sortable: false, width: '200px' },
  { title: 'Utilisateur', key: 'user', sortable: false, width: '180px' },
  { title: 'Message', key: 'message', sortable: false },
]

const tableHeaders = computed(() => {
  if (display.smAndDown.value) return logHeadersBase.filter((h) => h.key !== 'user')
  return logHeadersBase
})

const paginationTotalVisible = computed(() => (display.smAndDown.value ? 5 : 7))

const detailDialogAttrs = useMobileDialogAttrs(560)

function logTypeLabel(type: string) {
  return LOG_TYPE_LABELS[type] ?? type
}

function userLabel(u: LogUser) {
  return `${u.firstName} ${u.lastName}`.trim() || u.email
}

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleString('fr-FR', {
      dateStyle: 'short',
      timeStyle: 'short',
    })
  } catch {
    return iso
  }
}

function truncate(s: string, n: number) {
  if (s.length <= n) return s
  return `${s.slice(0, n)}…`
}

function detailsJson(d: unknown) {
  try {
    return JSON.stringify(d, null, 2)
  } catch {
    return String(d)
  }
}

function showSnackbar(text: string, color: string) {
  snackbar.text = text
  snackbar.color = color
  snackbar.show = true
}

function buildQuery() {
  const params = new URLSearchParams()
  params.set('page', String(page.value))
  params.set('pageSize', String(pageSize.value))
  params.set('sort', appliedSort.value)
  if (appliedUserSearch.value.trim()) {
    params.set('userSearch', appliedUserSearch.value.trim())
  }
  if (appliedFrom.value) {
    const d = new Date(appliedFrom.value)
    if (!Number.isNaN(d.getTime())) params.set('from', d.toISOString())
  }
  if (appliedTo.value) {
    const d = new Date(appliedTo.value)
    if (!Number.isNaN(d.getTime())) params.set('to', d.toISOString())
  }
  for (const t of appliedTypes.value) {
    params.append('type', t)
  }
  return params.toString()
}

async function fetchLogs() {
  loading.value = true
  try {
    const qs = buildQuery()
    const res = await api.get<{ items: LogRow[]; total: number; page: number; pageSize: number }>(
      `/logs?${qs}`,
    )
    items.value = Array.isArray(res.items) ? res.items : []
    total.value = typeof res.total === 'number' ? res.total : 0
    if (typeof res.pageSize === 'number' && res.pageSize > 0) {
      pageSize.value = res.pageSize
    }
  } catch (e: unknown) {
    const err = e as { data?: { message?: string }; message?: string }
    showSnackbar(err?.data?.message || err?.message || 'Impossible de charger les logs', 'error')
    items.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

function applyFilters() {
  appliedUserSearch.value = filterUserSearch.value
  appliedSort.value = filterSort.value
  appliedFrom.value = filterFrom.value
  appliedTo.value = filterTo.value
  appliedTypes.value = [...filterTypes.value]
  page.value = 1
  void fetchLogs()
}

function resetFilters() {
  filterTypes.value = []
  appliedTypes.value = []
  filterUserSearch.value = ''
  appliedUserSearch.value = ''
  filterSort.value = 'desc'
  appliedSort.value = 'desc'
  filterFrom.value = ''
  filterTo.value = ''
  appliedFrom.value = ''
  appliedTo.value = ''
  page.value = 1
  void fetchLogs()
}

function rowItem(ctx: { item?: LogRow; internalItem?: { raw: LogRow } }): LogRow | null {
  return ctx?.item ?? ctx?.internalItem?.raw ?? null
}

async function onRowClick(_event: unknown, ctx: { item?: LogRow; internalItem?: { raw: LogRow } }) {
  const item = rowItem(ctx)
  if (!item) return
  detailOpen.value = true
  detailLoading.value = true
  detailLog.value = null
  try {
    detailLog.value = await api.get<LogRow>(`/logs/${item.id}`)
  } catch {
    detailLog.value = item
    showSnackbar('Affichage depuis le cache local (détail API indisponible).', 'warning')
  } finally {
    detailLoading.value = false
  }
}

onMounted(() => {
  void fetchLogs()
})
</script>

<style scoped>
.message-preview {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.logs-table :deep(tbody tr) {
  cursor: pointer;
}

.message-full {
  white-space: pre-wrap;
  word-break: break-word;
}

.details-pre {
  font-size: 0.75rem;
  overflow: auto;
  max-height: 220px;
  padding: 12px;
  border-radius: 8px;
  background: rgba(0, 0, 0, 0.06);
  color: rgba(0, 0, 0, 0.86);
  border: 1px solid rgba(0, 0, 0, 0.08);
}

.v-theme--dark .details-pre {
  background: rgba(255, 255, 255, 0.09);
  color: rgba(255, 255, 255, 0.92);
  border: 1px solid rgba(255, 255, 255, 0.14);
}

.detail-dl dt {
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: rgba(0, 0, 0, 0.55);
  margin-top: 12px;
}
.detail-dl dt:first-of-type {
  margin-top: 0;
}
.detail-dl dd {
  margin: 4px 0 0;
}

.v-theme--dark .detail-dl dt {
  color: rgba(255, 255, 255, 0.62);
}
</style>
