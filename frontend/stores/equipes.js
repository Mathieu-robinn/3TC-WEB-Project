import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useEquipesStore = defineStore('equipes', () => {
  const search = ref('')
  const filterTranspondeur = ref('tous')
  const filterNbMembres = ref(null)
  const sortBy = ref('ranking') // 'ranking' | 'name' | 'members'
  const loading = ref(false)
  const saving = ref(false)
  const error = ref(null)

  const equipes = ref([])
  const ranking = ref([])

  const removeAccents = (str) =>
    str ? str.normalize('NFD').replace(/[\u0300-\u036f]/g, '') : ''

  // ── API ──────────────────────────────────────────────────────
  const fetchEquipes = async () => {
    loading.value = true
    error.value = null
    const api = useApi()
    try {
      const [teamsData, rankingData] = await Promise.all([
        api.get('/teams'),
        api.get('/teams/ranking'),
      ])
      equipes.value = Array.isArray(teamsData) ? teamsData : []
      ranking.value = Array.isArray(rankingData) ? rankingData : []
    } catch (e) {
      console.error('Erreur fetch équipes:', e)
      error.value = 'Mode démonstration — API non disponible'
      equipes.value = getMockEquipes()
      ranking.value = getMockRanking()
    } finally {
      loading.value = false
    }
  }

  const createTeam = async (data) => {
    saving.value = true
    const api = useApi()
    try {
      // POST /team  body: { num, name, courseId }
      const created = await api.post('/team', data)
      equipes.value.push(created)
      return created
    } finally {
      saving.value = false
    }
  }

  const updateTeam = async (id, data) => {
    saving.value = true
    const api = useApi()
    try {
      // PUT /team/:id  body: { nbTour, ... }
      const updated = await api.put(`/team/${id}`, data)
      const idx = equipes.value.findIndex((t) => t.id === id)
      if (idx !== -1) equipes.value[idx] = { ...equipes.value[idx], ...updated }
      return updated
    } finally {
      saving.value = false
    }
  }

  const deleteTeam = async (id) => {
    saving.value = true
    const api = useApi()
    try {
      await api.del(`/team/${id}`)
      equipes.value = equipes.value.filter((t) => t.id !== id)
    } finally {
      saving.value = false
    }
  }

  // ── Computed ─────────────────────────────────────────────────
  const equipesWithStatus = computed(() =>
    equipes.value.map((e) => {
      const inRanking = ranking.value.find((r) => r.id === e.id)
      const nbTour = inRanking?.nbTour ?? e.nbTour ?? 0
      const runners = e.runners || []
      const runnerWithTransponder = runners.find((r) => r.transponders?.some((t) => t.status === 'OUT'))
      const activeRef = runnerWithTransponder?.transponders?.find((t) => t.status === 'OUT')?.reference || null
      let statut = runners.length === 0 ? 'sans_transpondeur' : activeRef ? 'en_piste' : 'en_attente'

      return {
        ...e,
        nbTour,
        statut,
        membres: runners,
        capitaine: runners[0] ? `${runners[0].firstName} ${runners[0].lastName}` : 'N/A',
        transpondeur: activeRef,
      }
    }),
  )

  const rankingWithDetails = computed(() =>
    ranking.value.map((t, idx) => ({ ...t, rank: idx + 1 })),
  )

  const filteredEquipes = computed(() => {
    let list = equipesWithStatus.value
    const s = removeAccents(search.value.toLowerCase())
    if (s) {
      list = list.filter(
        (e) =>
          removeAccents(e.name?.toLowerCase() || '').includes(s) ||
          removeAccents(e.capitaine?.toLowerCase() || '').includes(s) ||
          String(e.id).includes(s),
      )
    }
    if (filterTranspondeur.value === 'avec') list = list.filter((e) => !!e.transpondeur)
    if (filterTranspondeur.value === 'sans') list = list.filter((e) => !e.transpondeur)
    if (filterNbMembres.value) list = list.filter((e) => e.membres.length === parseInt(filterNbMembres.value))
    if (sortBy.value === 'ranking') list = [...list].sort((a, b) => (b.nbTour || 0) - (a.nbTour || 0))
    else if (sortBy.value === 'name') list = [...list].sort((a, b) => (a.name || '').localeCompare(b.name || ''))
    else if (sortBy.value === 'members') list = [...list].sort((a, b) => b.membres.length - a.membres.length)
    return list
  })

  const availableNbMembres = computed(() => {
    const counts = equipesWithStatus.value.map((e) => e.membres.length)
    return [...new Set(counts)].sort((a, b) => a - b)
  })

  const stats = computed(() => ({
    total: equipes.value.length,
    enPiste: equipesWithStatus.value.filter((e) => e.statut === 'en_piste').length,
    enAttente: equipesWithStatus.value.filter((e) => e.statut === 'en_attente').length,
    sansTranspondeur: equipesWithStatus.value.filter((e) => e.statut === 'sans_transpondeur').length,
  }))

  // ── Mock fallback ─────────────────────────────────────────────
  const getMockEquipes = () => [
    { id: 1, name: 'Les Flèches', nbTour: 42, runners: [{ id: 1, firstName: 'Thomas', lastName: 'Bernard', transponders: [{ reference: 'TR-002', status: 'OUT' }] }, { id: 2, firstName: 'Marie', lastName: 'Dupont', transponders: [] }] },
    { id: 2, name: 'Team INSA', nbTour: 38, runners: [{ id: 3, firstName: 'Sophie', lastName: 'Martin', transponders: [] }] },
    { id: 3, name: 'Les Rapides', nbTour: 35, runners: [{ id: 4, firstName: 'Lucas', lastName: 'Petit', transponders: [{ reference: 'TR-045', status: 'OUT' }] }] },
    { id: 4, name: 'Sprint Masters', nbTour: 31, runners: [{ id: 5, firstName: 'Emma', lastName: 'Rousseau', transponders: [] }] },
    { id: 5, name: 'Les Coureurs', nbTour: 28, runners: [{ id: 6, firstName: 'Hugo', lastName: 'Dubois', transponders: [] }] },
    { id: 6, name: 'Team Endurance', nbTour: 25, runners: [{ id: 7, firstName: 'Claire', lastName: 'Moreau', transponders: [{ reference: 'TR-067', status: 'OUT' }] }] },
  ]
  const getMockRanking = () => getMockEquipes().map((e) => ({ id: e.id, name: e.name, nbTour: e.nbTour }))

  return {
    search, filterTranspondeur, filterNbMembres, sortBy, loading, saving, error,
    equipes, ranking, rankingWithDetails, equipesWithStatus,
    filteredEquipes, availableNbMembres, stats,
    fetchEquipes, createTeam, updateTeam, deleteTeam,
  }
})
