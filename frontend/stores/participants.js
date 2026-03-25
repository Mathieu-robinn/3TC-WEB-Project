import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useParticipantsStore = defineStore('participants', () => {
  const search = ref('')
  const filterEquipe = ref(null)
  const filterStatus = ref('tous')
  const loading = ref(false)
  const saving = ref(false)
  const error = ref(null)

  const runners = ref([])
  const teams = ref([])

  const removeAccents = (str) =>
    str ? str.normalize('NFD').replace(/[\u0300-\u036f]/g, '') : ''

  // ── API ──────────────────────────────────────────────────────
  const fetchAll = async () => {
    loading.value = true
    error.value = null
    const api = useApi()
    try {
      const [runnersData, teamsData] = await Promise.all([
        api.get('/runners'),   // GET /runners
        api.get('/teams'),     // GET /teams
      ])
      runners.value = Array.isArray(runnersData) ? runnersData : []
      teams.value = Array.isArray(teamsData) ? teamsData : []
    } catch (e) {
      console.error('Erreur fetch participants:', e)
      error.value = 'Mode démonstration — API non disponible'
      runners.value = getMockRunners()
      teams.value = getMockTeams()
    } finally {
      loading.value = false
    }
  }

  const createRunner = async (data) => {
    // POST /runner  body: { firstName, lastName, email?, team: { connect: { id } } }
    saving.value = true
    const api = useApi()
    try {
      const body = {
        firstName: data.firstName,
        lastName: data.lastName,
        ...(data.email ? { email: data.email } : {}),
        ...(data.teamId ? { team: { connect: { id: data.teamId } } } : {}),
      }
      const created = await api.post('/runner', body)
      runners.value.push(created)
      return created
    } catch (e) {
      // Optimistic local add
      const mock = {
        id: Date.now(), firstName: data.firstName, lastName: data.lastName,
        teamId: data.teamId, transponders: [],
      }
      runners.value.push(mock)
      return mock
    } finally {
      saving.value = false
    }
  }

  const deleteRunner = async (id) => {
    // DELETE /runner/:id
    saving.value = true
    const api = useApi()
    try {
      await api.del(`/runner/${id}`)
    } catch (e) {
      console.warn('DELETE runner failed, removing locally anyway')
    } finally {
      runners.value = runners.value.filter((r) => r.id !== id)
      saving.value = false
    }
  }

  // ── Computed ─────────────────────────────────────────────────
  const runnersNormalized = computed(() =>
    runners.value.map((r) => {
      const team = teams.value.find((t) => t.id === (r.teamId || r.team?.id))
      const activeTransponder = r.transponders?.find((t) => t.status === 'OUT')?.reference || null
      return {
        ...r,
        fullName: `${r.firstName || ''} ${r.lastName || ''}`.trim(),
        teamName: team?.name || r.teamName || 'Sans équipe',
        activeTransponder,
        status: activeTransponder ? 'en_piste' : 'au_repos',
      }
    }),
  )

  const availableTeams = computed(() =>
    teams.value.map((t) => ({ title: t.name, value: t.id })),
  )

  const filteredParticipants = computed(() => {
    let list = runnersNormalized.value
    const s = removeAccents(search.value.toLowerCase())
    if (s) {
      list = list.filter(
        (p) =>
          removeAccents(p.fullName.toLowerCase()).includes(s) ||
          removeAccents(p.teamName.toLowerCase()).includes(s),
      )
    }
    if (filterEquipe.value) list = list.filter((p) => (p.teamId || p.team?.id) === filterEquipe.value)
    if (filterStatus.value === 'en_piste') list = list.filter((p) => p.status === 'en_piste')
    if (filterStatus.value === 'au_repos') list = list.filter((p) => p.status === 'au_repos')
    return list
  })

  const stats = computed(() => ({
    total: runners.value.length,
    enPiste: runnersNormalized.value.filter((r) => r.activeTransponder).length,
    auRepos: runnersNormalized.value.filter((r) => !r.activeTransponder).length,
    equipes: teams.value.length,
  }))

  // ── Mock fallback ─────────────────────────────────────────────
  const getMockRunners = () => [
    { id: 1, firstName: 'Marie', lastName: 'Dupont', teamId: 1, transponders: [{ reference: 'TR-002', status: 'OUT' }] },
    { id: 2, firstName: 'Thomas', lastName: 'Bernard', teamId: 1, transponders: [] },
    { id: 3, firstName: 'Sophie', lastName: 'Martin', teamId: 2, transponders: [] },
    { id: 4, firstName: 'Lucas', lastName: 'Petit', teamId: 3, transponders: [{ reference: 'TR-045', status: 'OUT' }] },
    { id: 5, firstName: 'Emma', lastName: 'Rousseau', teamId: 4, transponders: [] },
    { id: 6, firstName: 'Hugo', lastName: 'Dubois', teamId: 5, transponders: [] },
    { id: 7, firstName: 'Claire', lastName: 'Moreau', teamId: 6, transponders: [{ reference: 'TR-067', status: 'OUT' }] },
  ]
  const getMockTeams = () => [
    { id: 1, name: 'Les Flèches' }, { id: 2, name: 'Team INSA' },
    { id: 3, name: 'Les Rapides' }, { id: 4, name: 'Sprint Masters' },
    { id: 5, name: 'Les Coureurs' }, { id: 6, name: 'Team Endurance' },
  ]

  return {
    search, filterEquipe, filterStatus, loading, saving, error,
    runners, teams, runnersNormalized, filteredParticipants,
    availableTeams, stats,
    fetchAll, createRunner, deleteRunner,
  }
})
