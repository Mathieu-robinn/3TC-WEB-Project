import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { removeAccents } from '~/utils/string'
import { transponderNumeroLabel } from '~/utils/transponder'
import type { ApiCourse, ApiRunner, ApiTeam } from '~/types/api'

export interface RunnerCreateInput {
  firstName: string
  lastName: string
  email?: string
  teamId: number
}

export interface RunnerUpdateInput {
  firstName: string
  lastName: string
  email?: string
  teamId?: number
}

type RunnerNormalized = ApiRunner & {
  fullName: string
  teamName: string
  activeTransponder: string | null
  status: 'en_piste' | 'au_repos' | 'course_terminee'
  isCaptain: boolean
  isTransponderHolder: boolean
}

export const useParticipantsStore = defineStore('participants', () => {
  const search = ref('')
  const filterEquipe = ref<number | null>(null)
  const filterCourseId = ref<number | null>(null)
  /** Tous les coureurs, uniquement capitaines d’équipe, ou responsable transpondeur */
  const filterRole = ref<'tous' | 'capitaine' | 'resp_transpondeur'>('tous')
  const filterStatus = ref<'tous' | 'en_piste' | 'au_repos' | 'course_terminee'>('tous')
  const loading = ref(false)
  const saving = ref(false)
  const error = ref<string | null>(null)

  const runners = ref<ApiRunner[]>([])
  const teams = ref<ApiTeam[]>([])
  const courses = ref<ApiCourse[]>([])

  const fetchAll = async () => {
    loading.value = true
    error.value = null
    const api = useApi()
    try {
      const [runnersData, teamsData, coursesData] = await Promise.all([
        api.get<ApiRunner[]>('/runners'),
        api.get<ApiTeam[]>('/teams'),
        api.get<ApiCourse[]>('/courses'),
      ])
      runners.value = Array.isArray(runnersData) ? runnersData : []
      teams.value = Array.isArray(teamsData) ? teamsData : []
      courses.value = Array.isArray(coursesData) ? coursesData : []
      const courseIds = new Set(courses.value.map((c) => c.id))
      const teamIds = new Set(teams.value.map((t) => t.id))
      if (filterCourseId.value != null && !courseIds.has(filterCourseId.value)) {
        filterCourseId.value = null
      }
      if (filterEquipe.value != null && !teamIds.has(filterEquipe.value)) {
        filterEquipe.value = null
      }
    } catch (e) {
      console.error('Erreur fetch participants:', e)
      error.value = 'Mode démonstration — API non disponible'
      runners.value = getMockRunners()
      teams.value = getMockTeams()
      courses.value = getMockCourses()
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
        teamId: data.teamId,
        ...(data.email ? { email: data.email } : {}),
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
      if (data.teamId !== undefined) body.teamId = data.teamId

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
      const out = r.transponders?.find((t) => t.status === 'OUT' || t.status === 'ATTRIBUE')
      const activeTransponder = out ? transponderNumeroLabel(out) : null
      const courseFinished = team?.courseFinished === true
      let status: RunnerNormalized['status']
      if (courseFinished) status = 'course_terminee'
      else if (activeTransponder) status = 'en_piste'
      else status = 'au_repos'
      const isCaptain = team?.respRunnerId != null && r.id === team.respRunnerId
      const isTransponderHolder =
        team?.transponderHolderRunnerId != null && r.id === team.transponderHolderRunnerId
      return {
        ...r,
        fullName: `${r.firstName || ''} ${r.lastName || ''}`.trim(),
        teamName: team?.name || r.teamName || 'Sans équipe',
        activeTransponder,
        status,
        isCaptain,
        isTransponderHolder,
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
    if (filterCourseId.value != null) {
      list = list.filter((p) => {
        const team = teams.value.find((t) => t.id === (p.teamId ?? p.team?.id))
        return team?.courseId === filterCourseId.value
      })
    }
    if (filterEquipe.value != null)
      list = list.filter((p) => (p.teamId ?? p.team?.id) === filterEquipe.value)
    if (filterRole.value === 'capitaine') list = list.filter((p) => p.isCaptain)
    if (filterRole.value === 'resp_transpondeur')
      list = list.filter((p) => p.isTransponderHolder)
    if (filterStatus.value === 'en_piste') list = list.filter((p) => p.status === 'en_piste')
    if (filterStatus.value === 'au_repos') list = list.filter((p) => p.status === 'au_repos')
    if (filterStatus.value === 'course_terminee')
      list = list.filter((p) => p.status === 'course_terminee')
    return list
  })

  const stats = computed(() => ({
    total: runners.value.length,
    enPiste: runnersNormalized.value.filter((r) => r.status === 'en_piste').length,
    auRepos: runnersNormalized.value.filter((r) => r.status === 'au_repos').length,
    courseTerminee: runnersNormalized.value.filter((r) => r.status === 'course_terminee').length,
    equipes: teams.value.length,
  }))

  const getMockRunners = (): ApiRunner[] => [
    { id: 1, firstName: 'Marie', lastName: 'Dupont', teamId: 1, transponders: [{ reference: 'TR-002', status: 'ATTRIBUE' }] },
    { id: 2, firstName: 'Thomas', lastName: 'Bernard', teamId: 1, transponders: [] },
    { id: 3, firstName: 'Sophie', lastName: 'Martin', teamId: 2, transponders: [] },
    { id: 4, firstName: 'Lucas', lastName: 'Petit', teamId: 3, transponders: [{ reference: 'TR-045', status: 'ATTRIBUE' }] },
    { id: 5, firstName: 'Emma', lastName: 'Rousseau', teamId: 4, transponders: [] },
    { id: 6, firstName: 'Hugo', lastName: 'Dubois', teamId: 5, transponders: [] },
    { id: 7, firstName: 'Claire', lastName: 'Moreau', teamId: 6, transponders: [{ reference: 'TR-067', status: 'ATTRIBUE' }] },
  ]

  const resetFilters = () => {
    search.value = ''
    filterEquipe.value = null
    filterCourseId.value = null
    filterStatus.value = 'tous'
  }

  const getMockCourses = (): ApiCourse[] => [
    { id: 1, name: '24 Heures' },
    { id: 2, name: '12 Heures' },
  ]

  const getMockTeams = (): ApiTeam[] => [
    {
      id: 1,
      name: 'Les Flèches',
      courseId: 1,
      respRunnerId: 1,
      transponderHolderRunnerId: 1,
      courseFinished: false,
    },
    { id: 2, name: 'Team INSA', courseId: 1, respRunnerId: 3, courseFinished: true },
    { id: 3, name: 'Les Rapides', courseId: 1, respRunnerId: 4, transponderHolderRunnerId: 4, courseFinished: false },
    { id: 4, name: 'Sprint Masters', courseId: 1, respRunnerId: 5, courseFinished: false },
    { id: 5, name: 'Les Coureurs', courseId: 1, respRunnerId: 6, courseFinished: false },
    { id: 6, name: 'Team Endurance', courseId: 2, respRunnerId: 7, transponderHolderRunnerId: 7, courseFinished: false },
  ]

  return {
    search,
    filterEquipe,
    filterCourseId,
    filterRole,
    filterStatus,
    loading,
    saving,
    error,
    runners,
    teams,
    courses,
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
