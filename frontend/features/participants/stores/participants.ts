import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { removeAccents } from '~/utils/string'
import { transponderDisplay } from '~/utils/transponder'
import type { ApiRunner, ApiTeam } from '~/types/api'

export interface RunnerCreateInput {
  firstName: string
  lastName: string
  email?: string
  teamId?: number
}

export interface RunnerUpdateInput {
  firstName: string
  lastName: string
  email?: string
  /** `null` = retirer l'équipe (API) */
  teamId?: number | null
}

type RunnerNormalized = ApiRunner & {
  fullName: string
  teamName: string
  activeTransponder: string | null
  status: 'en_piste' | 'au_repos'
}

export const useParticipantsStore = defineStore('participants', () => {
  const search = ref('')
  const filterEquipe = ref<number | null>(null)
  const filterStatus = ref<'tous' | 'en_piste' | 'au_repos'>('tous')
  const loading = ref(false)
  const saving = ref(false)
  const error = ref<string | null>(null)

  const runners = ref<ApiRunner[]>([])
  const teams = ref<ApiTeam[]>([])

  const fetchAll = async () => {
    loading.value = true
    error.value = null
    const api = useApi()
    try {
      const [runnersData, teamsData] = await Promise.all([
        api.get<ApiRunner[]>('/runners'),
        api.get<ApiTeam[]>('/teams'),
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

  const createRunner = async (data: RunnerCreateInput) => {
    saving.value = true
    const api = useApi()
    try {
      const body: Record<string, unknown> = {
        firstName: data.firstName,
        lastName: data.lastName,
        ...(data.email ? { email: data.email } : {}),
        ...(data.teamId != null ? { teamId: data.teamId } : {}),
      }
      return await api.post<ApiRunner>('/runner', body)
    } finally {
      saving.value = false
    }
  }

  const updateRunner = async (id: number, data: RunnerUpdateInput) => {
    saving.value = true
    const api = useApi()
    try {
      const body: Record<string, unknown> = {
        firstName: data.firstName,
        lastName: data.lastName,
      }
      if (data.email !== undefined) body.email = data.email || null
      if (data.teamId === null) body.teamId = null
      else if (data.teamId !== undefined) body.teamId = data.teamId

      return await api.put<ApiRunner>(`/runner/${id}`, body)
    } finally {
      saving.value = false
    }
  }

  const deleteRunner = async (id: number) => {
    saving.value = true
    const api = useApi()
    try {
      await api.del(`/runner/${id}`)
      runners.value = runners.value.filter((r) => r.id !== id)
    } finally {
      saving.value = false
    }
  }

  const runnersNormalized = computed<RunnerNormalized[]>(() =>
    runners.value.map((r) => {
      const team = teams.value.find((t) => t.id === (r.teamId ?? r.team?.id))
      const out = r.transponders?.find((t) => t.status === 'OUT')
      const activeTransponder = transponderDisplay(out)
      return {
        ...r,
        fullName: `${r.firstName || ''} ${r.lastName || ''}`.trim(),
        teamName: team?.name || r.teamName || 'Sans équipe',
        activeTransponder,
        status: activeTransponder ? 'en_piste' : 'au_repos',
      }
    }),
  )

  const availableTeams = computed(() => teams.value.map((t) => ({ title: t.name ?? '', value: t.id })))

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
    if (filterEquipe.value != null)
      list = list.filter((p) => (p.teamId ?? p.team?.id) === filterEquipe.value)
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

  const getMockRunners = (): ApiRunner[] => [
    { id: 1, firstName: 'Marie', lastName: 'Dupont', teamId: 1, transponders: [{ reference: 'TR-002', status: 'OUT' }] },
    { id: 2, firstName: 'Thomas', lastName: 'Bernard', teamId: 1, transponders: [] },
    { id: 3, firstName: 'Sophie', lastName: 'Martin', teamId: 2, transponders: [] },
    { id: 4, firstName: 'Lucas', lastName: 'Petit', teamId: 3, transponders: [{ reference: 'TR-045', status: 'OUT' }] },
    { id: 5, firstName: 'Emma', lastName: 'Rousseau', teamId: 4, transponders: [] },
    { id: 6, firstName: 'Hugo', lastName: 'Dubois', teamId: 5, transponders: [] },
    { id: 7, firstName: 'Claire', lastName: 'Moreau', teamId: 6, transponders: [{ reference: 'TR-067', status: 'OUT' }] },
  ]

  const resetFilters = () => {
    search.value = ''
    filterEquipe.value = null
    filterStatus.value = 'tous'
  }

  const getMockTeams = (): ApiTeam[] => [
    { id: 1, name: 'Les Flèches' },
    { id: 2, name: 'Team INSA' },
    { id: 3, name: 'Les Rapides' },
    { id: 4, name: 'Sprint Masters' },
    { id: 5, name: 'Les Coureurs' },
    { id: 6, name: 'Team Endurance' },
  ]

  return {
    search,
    filterEquipe,
    filterStatus,
    loading,
    saving,
    error,
    runners,
    teams,
    runnersNormalized,
    filteredParticipants,
    availableTeams,
    stats,
    fetchAll,
    createRunner,
    updateRunner,
    deleteRunner,
    resetFilters,
  }
})
