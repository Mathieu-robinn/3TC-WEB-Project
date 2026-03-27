import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { ApiTeam, ApiTransponder, TransponderStats, TransponderStatusApi } from '~/types/api'

const emptyStats = (): TransponderStats => ({ NEW: 0, IN: 0, OUT: 0, LOST: 0 })

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
      stats.value = { NEW: 5, IN: 10, OUT: 18, LOST: 2 }
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

  const createTransponder = async (data: { status?: TransponderStatusApi } = {}) => {
    saving.value = true
    const api = useApi()
    try {
      const created = await api.post<ApiTransponder>('/transponder', { status: data.status || 'NEW' })
      transponders.value.push(created)
      await fetchAll()
      return created
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

  const assignTransponder = async (transponderId: number, teamId: number | null, runnerId: number | null) => {
    saving.value = true
    const api = useApi()
    try {
      const updated = await api.put<ApiTransponder>(`/transponder/${transponderId}/assign`, { teamId, runnerId })
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
      await fetchAll()
      return updated
    } finally {
      saving.value = false
    }
  }

  const statuses: TransponderStatusApi[] = ['DISPONIBLE', 'ATTRIBUE', 'PERDU']

  const statusColor = (s: string) =>
    ({ DISPONIBLE: 'blue', ATTRIBUE: 'green', PERDU: 'red' } as Record<string, string>)[s] || 'grey'

  const statusLabel = (s: string) =>
    ({ DISPONIBLE: 'Disponible', ATTRIBUE: 'Attribué', PERDU: 'Perdu' } as Record<string, string>)[s] || s

  const filteredTransponders = computed(() => {
    let list = transponders.value
    const s = search.value.toLowerCase()
    if (s)
      list = list.filter(
        (t) =>
          t.reference?.toLowerCase().includes(s) ||
          String(t.id).includes(s) ||
          t.team?.name?.toLowerCase().includes(s) ||
          t.runner?.firstName?.toLowerCase().includes(s) ||
          t.runner?.lastName?.toLowerCase().includes(s),
      )
    if (filterStatus.value !== 'tous') list = list.filter((t) => t.status === filterStatus.value)
    return list
  })

  const totalStats = computed(() => ({
    total: transponders.value.length,
    ...stats.value,
  }))

  const getMockTransponders = (): ApiTransponder[] =>
    Array.from({ length: 10 }, (_, i) => ({
      id: i + 1,
      reference: `TR-${String(i + 1).padStart(3, '0')}`,
      status: (['NEW', 'IN', 'OUT', 'LOST'] as const)[i % 4],
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
    filteredTransponders,
    totalStats,
    statuses,
    statusColor,
    statusLabel,
    fetchAll,
    fetchTransactions,
    fetchUnassignedTeams,
    createTransponder,
    updateTransponder,
    createTransaction,
    assignTransponder,
    unassignTransponder,
    markAsLost,
  }
})
