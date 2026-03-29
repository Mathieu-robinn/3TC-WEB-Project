import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { removeAccents } from '~/utils/string'
import { transponderDisplay } from '~/utils/transponder'
import type { ApiCourse, ApiTeam, TransponderTransaction } from '~/types/api'

type SortKey = 'ranking' | 'name' | 'members'

type TeamWithStatus = ApiTeam & {
  statut: string
  membres: NonNullable<ApiTeam['runners']>
  capitaine: string
  transpondeur: string | null
}

export const useEquipesStore = defineStore('equipes', () => {
  const search = ref('')
  const filterTranspondeur = ref<'tous' | 'avec' | 'sans'>('tous')
  const filterNbMembres = ref<number | null>(null)
  const filterCourseId = ref<number | null>(null)
  const sortBy = ref<SortKey>('ranking')
  const loading = ref(false)
  const saving = ref(false)
  const error = ref<string | null>(null)

  const equipes = ref<ApiTeam[]>([])
  const historique = ref<TransponderTransaction[]>([])
  const historiqueLoading = ref(false)
  const historiqueError = ref<string | null>(null)
  const ranking = ref<ApiTeam[]>([])
  const courses = ref<ApiCourse[]>([])

  const fetchEquipes = async () => {
    loading.value = true
    error.value = null
    const api = useApi()
    try {
      const [teamsData, rankingData, coursesData] = await Promise.all([
        api.get<ApiTeam[]>('/teams'),
        api.get<ApiTeam[]>('/teams/ranking'),
        api.get<ApiCourse[]>('/courses'),
      ])
      equipes.value = Array.isArray(teamsData) ? teamsData : []
      ranking.value = Array.isArray(rankingData) ? rankingData : []
      courses.value = Array.isArray(coursesData) ? coursesData : []
      const courseIds = new Set(courses.value.map((c) => c.id))
      if (filterCourseId.value != null && !courseIds.has(filterCourseId.value)) {
        filterCourseId.value = null
      }
    } catch (e) {
      console.error('Erreur fetch équipes:', e)
      error.value = 'Mode démonstration — API non disponible'
      equipes.value = getMockEquipes()
      ranking.value = getMockRanking()
      courses.value = getMockCourses()
    } finally {
      loading.value = false
    }
  }

  const clearTeamHistorique = () => {
    historique.value = []
    historiqueError.value = null
  }

  const fetchHistoriqueTranspondeurs = async (teamId: number) => {
    historiqueLoading.value = true
    historiqueError.value = null
    const api = useApi()
    try {
      const data = await api.get<TransponderTransaction[]>(`/transactions/team/${teamId}`)
      historique.value = Array.isArray(data) ? data : []
    } catch (e) {
      console.error('Erreur fetch historique:', e)
      historique.value = []
      historiqueError.value = 'Impossible de charger l’historique des transactions.'
    } finally {
      historiqueLoading.value = false
    }
  }

  const createTeam = async (data: Record<string, unknown>) => {
    saving.value = true
    const api = useApi()
    try {
      const created = await api.post<ApiTeam>('/team', data)
      equipes.value.push(created)
      return created
    } finally {
      saving.value = false
    }
  }

  const updateTeam = async (id: number, data: Record<string, unknown>) => {
    saving.value = true
    const api = useApi()
    try {
      const updated = await api.put<ApiTeam>(`/team/${id}`, data)
      const idx = equipes.value.findIndex((t) => t.id === id)
      if (idx !== -1) equipes.value[idx] = { ...equipes.value[idx], ...updated }
      return updated
    } finally {
      saving.value = false
    }
  }

  const deleteTeam = async (id: number) => {
    saving.value = true
    const api = useApi()
    try {
      await api.del(`/team/${id}`)
      equipes.value = equipes.value.filter((t) => t.id !== id)
    } finally {
      saving.value = false
    }
  }

  const equipesWithStatus = computed<TeamWithStatus[]>(() =>
    equipes.value.map((e) => {
      const inRanking = ranking.value.find((r) => r.id === e.id)
      const nbTour = inRanking?.nbTour ?? e.nbTour ?? 0
      const runners = e.runners || []

      const activeTransponders = (e.transponders || (e as any).transpondeurs || [])
        .filter((t: any) => t.status === 'ATTRIBUE')
        .map((t: any) => transponderDisplay(t))

      const activeRef = activeTransponders.length > 0 ? activeTransponders.join('  ·  ') : null

      const statut = e.courseFinished
        ? 'terminé'
        : runners.length === 0
          ? 'aucun membre'
          : activeRef
            ? 'en_piste'
            : 'en_attente'

      const captainRunner =
        e.respRunnerId != null ? runners.find((r) => r.id === e.respRunnerId) : undefined
      const capitaine = captainRunner
        ? `${captainRunner.firstName ?? ''} ${captainRunner.lastName ?? ''}`.trim()
        : runners[0]
          ? `${runners[0].firstName ?? ''} ${runners[0].lastName ?? ''}`.trim()
          : 'N/A'

      return {
        ...e,
        nbTour,
        statut,
        membres: runners,
        capitaine,
        transpondeur: activeRef,
      }
    }),
  )

  const rankingWithDetails = computed(() => ranking.value.map((t, idx) => ({ ...t, rank: idx + 1 })))

  const filteredRankingWithDetails = computed(() => {
    let list = ranking.value
    if (filterCourseId.value != null) {
      list = list.filter((t) => t.courseId === filterCourseId.value)
    }
    return list.map((t, idx) => ({ ...t, rank: idx + 1 }))
  })

  const filteredEquipes = computed(() => {
    let list = equipesWithStatus.value
    const s = removeAccents(search.value.toLowerCase())
    if (s) {
      list = list.filter(
        (e) =>
          removeAccents((e.name ?? '').toLowerCase()).includes(s) ||
          removeAccents(e.capitaine.toLowerCase()).includes(s) ||
          String(e.id).includes(s),
      )
    }
    if (filterCourseId.value != null) list = list.filter((e) => e.courseId === filterCourseId.value)
    if (filterTranspondeur.value === 'avec') list = list.filter((e) => !!e.transpondeur)
    if (filterTranspondeur.value === 'sans') list = list.filter((e) => !e.transpondeur)
    if (filterNbMembres.value != null)
      list = list.filter((e) => e.membres.length === filterNbMembres.value)
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
    sansTranspondeur: equipesWithStatus.value.filter((e) => e.statut === 'aucun membre').length,
    termine: equipesWithStatus.value.filter((e) => e.statut === 'terminé').length,
  }))

  const resetFilters = () => {
    search.value = ''
    filterTranspondeur.value = 'tous'
    filterNbMembres.value = null
    filterCourseId.value = null
    sortBy.value = 'ranking'
  }

  const getMockEquipes = (): ApiTeam[] => [
    {
      id: 1,
      name: 'Les Flèches',
      nbTour: 42,
      courseId: 1,
      runners: [
        {
          id: 1,
          firstName: 'Thomas',
          lastName: 'Martin',
        },
        { id: 2, firstName: 'Marie', lastName: 'Dupont' },
      ],
      transponders: [{ reference: 'TR-002', status: 'ATTRIBUE' }],
    },
    {
      id: 2,
      name: 'Team INSA',
      nbTour: 38,
      courseId: 1,
      runners: [{ id: 3, firstName: 'Sophie', lastName: 'Martin' }],
    },
    {
      id: 3,
      name: 'Les Rapides',
      nbTour: 18,
      courseId: 1,
      runners: [{ id: 4, firstName: 'Lucas', lastName: 'Petit' }],
      transponders: [{ reference: 'TR-045', status: 'ATTRIBUE' }],
    },
    {
      id: 4,
      name: 'Sprint Masters',
      nbTour: 31,
      courseId: 1,
      runners: [{ id: 5, firstName: 'Emma', lastName: 'Rousseau' }],
    },
    {
      id: 5,
      name: 'Les Coureurs',
      nbTour: 28,
      courseId: 1,
      runners: [{ id: 6, firstName: 'Hugo', lastName: 'Dubois' }],
    },
    {
      id: 6,
      name: 'Team Endurance',
      nbTour: 12,
      courseId: 2,
      runners: [{ id: 7, firstName: 'Claire', lastName: 'Moreau' }],
      transponders: [{ reference: 'TR-067', status: 'ATTRIBUE' }],
    },
  ]
  const getMockRanking = () =>
    getMockEquipes().map((e) => ({
      id: e.id,
      name: e.name,
      nbTour: e.nbTour,
      courseId: e.courseId,
    }))

  const getMockCourses = (): ApiCourse[] => [
    { id: 1, name: '24 Heures' },
    { id: 2, name: '12 Heures' },
  ]

  return {
    search,
    filterTranspondeur,
    filterNbMembres,
    filterCourseId,
    sortBy,
    loading,
    saving,
    error,
    equipes,
    ranking,
    courses,
    historique,
    historiqueLoading,
    historiqueError,
    clearTeamHistorique,
    rankingWithDetails,
    filteredRankingWithDetails,
    equipesWithStatus,
    filteredEquipes,
    availableNbMembres,
    stats,
    fetchEquipes,
    fetchHistoriqueTranspondeurs,
    createTeam,
    updateTeam,
    deleteTeam,
    resetFilters,
  }
})
