import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { ApiTeam, ApiTransponder, TransponderStats, TransponderStatusApi, TransponderTransaction } from '~/types/api'

const emptyStats = (): TransponderStats => ({
  EN_ATTENTE: 0,
  ATTRIBUE: 0,
  PERDU: 0,
  RECUPERE: 0,
  DEFAILLANT: 0,
})

export const useTranspondersStore = defineStore('transpondeurs', () => {
  const loading = ref(false)
  const saving = ref(false)
  const error = ref<string | null>(null)
  const search = ref('')
  const filterStatus = ref<'tous' | TransponderStatusApi>('tous')

  const transponders = ref<ApiTransponder[]>([])
  const stats = ref<TransponderStats>(emptyStats())
  const transactions = ref<unknown[]>([])
  const unassignedTeams = ref<ApiTeam[]>([])
  const loadingTeams = ref(false)

  /** Historique affiché dans la modale « une puce » (page transpondeurs). */
  const transponderHistory = ref<TransponderTransaction[]>([])
  const transponderHistoryLoading = ref(false)
  const transponderHistoryError = ref<string | null>(null)


  const fetchAll = async () => {
    loading.value = true
    error.value = null
    const api = useApi()
    try {
      const [tData, sData] = await Promise.all([
        api.get<ApiTransponder[]>('/transponders'),
        api.get<TransponderStats>('/transponders/stats'),
      ])
      transponders.value = Array.isArray(tData) ? tData : []
      stats.value = sData && typeof sData === 'object' ? { ...emptyStats(), ...sData } : emptyStats()
    } catch {
      error.value = 'Mode démonstration — API non disponible'
      transponders.value = getMockTransponders()
      stats.value = { EN_ATTENTE: 5, ATTRIBUE: 18, PERDU: 2, RECUPERE: 10, DEFAILLANT: 1 }
    } finally {
      loading.value = false
    }
  }

  const fetchTransactions = async () => {
    const api = useApi()
    try {
      const data = await api.get<unknown[]>('/transactions')
      transactions.value = Array.isArray(data) ? data : []
    } catch {
      transactions.value = []
    }
  }

  const createTransponder = async (data: { numero: number; status?: TransponderStatusApi }) => {
    saving.value = true
    const api = useApi()
    try {
      const created = await api.post<ApiTransponder>('/transponder', {
        numero: data.numero,
        status: data.status || 'EN_ATTENTE',
      })
      transponders.value.push(created)
      await fetchAll()
      return created
    } finally {
      saving.value = false
    }
  }

  const createTranspondersBatch = async (numeros: number[]) => {
    saving.value = true
    const api = useApi()
    try {
      const created = await api.post<ApiTransponder[]>('/transponders/batch', { numeros })
      await fetchAll()
      return created
    } finally {
      saving.value = false
    }
  }

  const deleteTranspondersBatch = async (ids: number[]) => {
    saving.value = true
    const api = useApi()
    try {
      const res = await api.post<{ deleted: number }>('/transponders/delete-batch', { ids })
      await fetchAll()
      return res
    } finally {
      saving.value = false
    }
  }

  const updateTransponder = async (id: number, data: { status: TransponderStatusApi }) => {
    saving.value = true
    const api = useApi()
    try {
      const updated = await api.put<ApiTransponder>(`/transponder/${id}`, data)
      const idx = transponders.value.findIndex((t) => t.id === id)
      if (idx !== -1) transponders.value[idx] = { ...transponders.value[idx], ...updated }
      await fetchAll()
      return updated
    } finally {
      saving.value = false
    }
  }

  const fetchUnassignedTeams = async () => {
    loadingTeams.value = true
    const api = useApi()
    try {
      const data = await api.get<ApiTeam[]>('/transponders/unassigned-teams')
      unassignedTeams.value = Array.isArray(data) ? data : []
    } catch {
      unassignedTeams.value = []
    } finally {
      loadingTeams.value = false
    }
  }

  const assignTransponder = async (
    transponderId: number,
    teamId: number | null,
    holderRunnerId?: number,
  ) => {
    saving.value = true
    const api = useApi()
    try {
      const body: Record<string, unknown> = { teamId }
      if (teamId != null && holderRunnerId != null) body.holderRunnerId = holderRunnerId
      const updated = await api.put<ApiTransponder>(`/transponder/${transponderId}/assign`, body)
      const idx = transponders.value.findIndex((t) => t.id === transponderId)
      if (idx !== -1) transponders.value[idx] = { ...transponders.value[idx], ...updated }
      await Promise.all([fetchAll(), fetchUnassignedTeams()])
      return updated
    } finally {
      saving.value = false
    }
  }

  const unassignTransponder = async (transponderId: number) => {
    saving.value = true
    const api = useApi()
    try {
      const updated = await api.put<ApiTransponder>(`/transponder/${transponderId}/unassign`, {})
      const idx = transponders.value.findIndex((t) => t.id === transponderId)
      if (idx !== -1) transponders.value[idx] = { ...transponders.value[idx], ...updated }
      await Promise.all([fetchAll(), fetchUnassignedTeams()])
      return updated
    } finally {
      saving.value = false
    }
  }

  const createTransaction = async (data: Record<string, unknown>) => {
    saving.value = true
    const api = useApi()
    try {
      const tx = await api.post<unknown>('/transaction', data)
      await Promise.all([fetchAll(), fetchTransactions()])
      return tx
    } finally {
      saving.value = false
    }
  }

  const markAsLost = async (transponderId: number) => {
    saving.value = true
    const api = useApi()
    try {
      const updated = await api.put<ApiTransponder>(`/transponder/${transponderId}`, { status: 'PERDU' })
      const idx = transponders.value.findIndex((t) => t.id === transponderId)
      if (idx !== -1) transponders.value[idx] = { ...transponders.value[idx], ...updated }
      await Promise.all([fetchAll(), fetchUnassignedTeams()])
      return updated
    } finally {
      saving.value = false
    }
  }

  const markAsDefective = async (transponderId: number) => {
    saving.value = true
    const api = useApi()
    try {
      const updated = await api.put<ApiTransponder>(`/transponder/${transponderId}`, { status: 'DEFAILLANT' })
      const idx = transponders.value.findIndex((t) => t.id === transponderId)
      if (idx !== -1) transponders.value[idx] = { ...transponders.value[idx], ...updated }
      await Promise.all([fetchAll(), fetchUnassignedTeams()])
      return updated
    } finally {
      saving.value = false
    }
  }

  /** Remise en circulation (puce réparée / contrôlée). */
  const markAsEnAttente = async (transponderId: number) => {
    saving.value = true
    const api = useApi()
    try {
      const updated = await api.put<ApiTransponder>(`/transponder/${transponderId}`, { status: 'EN_ATTENTE' })
      const idx = transponders.value.findIndex((t) => t.id === transponderId)
      if (idx !== -1) transponders.value[idx] = { ...transponders.value[idx], ...updated }
      await Promise.all([fetchAll(), fetchUnassignedTeams()])
      return updated
    } finally {
      saving.value = false
    }
  }

  const fetchTransponderHistory = async (transponderId: number) => {
    transponderHistoryLoading.value = true
    transponderHistoryError.value = null
    const api = useApi()
    try {
      const data = await api.get<TransponderTransaction[]>(`/transactions/transponder/${transponderId}`)
      transponderHistory.value = Array.isArray(data) ? data : []
    } catch {
      transponderHistory.value = []
      transponderHistoryError.value = "Impossible de charger l'historique de cette puce."
    } finally {
      transponderHistoryLoading.value = false
    }
  }

  const clearTransponderHistory = () => {
    transponderHistory.value = []
    transponderHistoryError.value = null
  }

  const statuses: TransponderStatusApi[] = ['EN_ATTENTE', 'ATTRIBUE', 'PERDU', 'RECUPERE', 'DEFAILLANT']

  const statusColor = (s: string) =>
    ({
      EN_ATTENTE: 'blue',
      ATTRIBUE: 'green',
      PERDU: 'red',
      RECUPERE: 'grey',
      DEFAILLANT: 'deep-orange',
    } as Record<string, string>)[s] || 'grey'

  const statusLabel = (s: string) =>
    ({
      EN_ATTENTE: 'En attente',
      ATTRIBUE: 'Attribué',
      PERDU: 'Perdu',
      RECUPERE: 'Récupéré',
      DEFAILLANT: 'Défaillant',
    } as Record<string, string>)[s] || s

  const filteredTransponders = computed(() => {
    let list = transponders.value
    const s = search.value.toLowerCase()
    if (s)
      list = list.filter(
        (t) =>
          t.reference?.toLowerCase().includes(s) ||
          String(t.numero).includes(s) ||
          String(t.id).includes(s) ||
          t.team?.name?.toLowerCase().includes(s),
      )
    if (filterStatus.value !== 'tous') list = list.filter((t) => t.status === filterStatus.value)
    return list
  })

  const totalStats = computed(() => ({
    total: transponders.value.length,
    ...stats.value,
  }))

  const resetFilters = () => {
    search.value = ''
    filterStatus.value = 'tous'
  }

  const getMockTransponders = (): ApiTransponder[] =>
    Array.from({ length: 10 }, (_, i) => ({
      id: i + 1,
      numero: i + 1,
      editionId: 1,
      reference: `TR-${String(i + 1).padStart(3, '0')}`,
      status: (['EN_ATTENTE', 'RECUPERE', 'ATTRIBUE', 'PERDU', 'DEFAILLANT'] as const)[i % 5],
    }))

  return {
    search,
    filterStatus,
    loading,
    saving,
    error,
    transponders,
    stats,
    transactions,
    unassignedTeams,
    loadingTeams,
    transponderHistory,
    transponderHistoryLoading,
    transponderHistoryError,
    filteredTransponders,
    totalStats,
    statuses,
    statusColor,
    statusLabel,
    fetchAll,
    fetchTransactions,
    fetchUnassignedTeams,
    createTransponder,
    createTranspondersBatch,
    deleteTranspondersBatch,
    updateTransponder,
    createTransaction,
    assignTransponder,
    unassignTransponder,
    markAsLost,
    markAsDefective,
    markAsEnAttente,
    fetchTransponderHistory,
    clearTransponderHistory,
    resetFilters,
  }
})
