import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useTranspondersStore = defineStore('transpondeurs', () => {
  const loading = ref(false)
  const saving = ref(false)
  const error = ref(null)
  const search = ref('')
  const filterStatus = ref('tous')

  const transponders = ref([])
  const stats = ref({ NEW: 0, IN: 0, OUT: 0, LOST: 0 })
  const transactions = ref([])

  // ── API ──────────────────────────────────────────────────────
  const fetchAll = async () => {
    loading.value = true
    error.value = null
    const api = useApi()
    try {
      const [tData, sData] = await Promise.all([
        api.get('/transponders'),           // GET /transponders
        api.get('/transponders/stats'),     // GET /transponders/stats
      ])
      transponders.value = Array.isArray(tData) ? tData : []
      stats.value = sData || { NEW: 0, IN: 0, OUT: 0, LOST: 0 }
    } catch (e) {
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
      const data = await api.get('/transactions')  // GET /transactions
      transactions.value = Array.isArray(data) ? data : []
    } catch (e) {
      transactions.value = []
    }
  }

  const createTransponder = async (data = {}) => {
    // POST /transponder  body: { status: 'NEW' }
    saving.value = true
    const api = useApi()
    try {
      const created = await api.post('/transponder', { status: data.status || 'NEW' })
      transponders.value.push(created)
      await fetchAll() // refresh stats
      return created
    } finally {
      saving.value = false
    }
  }

  const updateTransponder = async (id, data) => {
    // PUT /transponder/:id  body: { status }
    saving.value = true
    const api = useApi()
    try {
      const updated = await api.put(`/transponder/${id}`, data)
      const idx = transponders.value.findIndex((t) => t.id === id)
      if (idx !== -1) transponders.value[idx] = { ...transponders.value[idx], ...updated }
      await fetchAll() // refresh stats
      return updated
    } finally {
      saving.value = false
    }
  }

  const createTransaction = async (data) => {
    // POST /transaction  body: { transponder: { connect: { id } }, runner: { connect: { id } }, user: { connect: { id } }, type }
    saving.value = true
    const api = useApi()
    try {
      const tx = await api.post('/transaction', data)
      await Promise.all([fetchAll(), fetchTransactions()])
      return tx
    } finally {
      saving.value = false
    }
  }

  // ── Computed ─────────────────────────────────────────────────
  const statuses = ['NEW', 'IN', 'OUT', 'LOST']

  const statusColor = (s) => ({ NEW: 'blue', IN: 'green', OUT: 'orange', LOST: 'red' }[s] || 'grey')
  const statusLabel = (s) => ({ NEW: 'Disponible', IN: 'En stock', OUT: 'Distribué', LOST: 'Perdu' }[s] || s)

  const filteredTransponders = computed(() => {
    let list = transponders.value
    const s = search.value.toLowerCase()
    if (s) list = list.filter((t) => t.reference?.toLowerCase().includes(s) || String(t.id).includes(s))
    if (filterStatus.value !== 'tous') list = list.filter((t) => t.status === filterStatus.value)
    return list
  })

  const totalStats = computed(() => ({
    total: transponders.value.length,
    ...stats.value,
  }))

  // ── Mock fallback ─────────────────────────────────────────────
  const getMockTransponders = () =>
    Array.from({ length: 10 }, (_, i) => ({
      id: i + 1,
      reference: `TR-${String(i + 1).padStart(3, '0')}`,
      status: ['NEW', 'IN', 'OUT', 'LOST'][i % 4],
    }))

  return {
    search, filterStatus, loading, saving, error,
    transponders, stats, transactions, filteredTransponders, totalStats,
    statuses, statusColor, statusLabel,
    fetchAll, fetchTransactions, createTransponder, updateTransponder, createTransaction,
  }
})
