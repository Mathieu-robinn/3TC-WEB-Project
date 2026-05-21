import type { ApiRunner, ApiTeam, ApiTransponder, TransponderStatusApi } from '~/types/api'
import { transponderDisplay } from '~/utils/transponder'
import {
  teamStatusLabel,
  teamStatusLabelFromCode,
  type TeamStatusCode,
} from '~/utils/teamStatus'

const RUNNER_LIST_SEP = ' | '

function runnerFullName(r: { firstName?: string; lastName?: string }): string {
  return `${r.firstName ?? ''} ${r.lastName ?? ''}`.trim()
}

function yesNo(value: boolean): string {
  return value ? 'Oui' : 'Non'
}

function activeTransponderNumero(
  transponders: { status?: string; numero?: number; reference?: string; id?: number }[] | undefined,
): string {
  if (!transponders?.length) return ''
  const given = transponders.find((t) => t.status === 'DONNE')
  const pending = transponders.find((t) => t.status === 'EN_ATTENTE')
  return transponderDisplay(given ?? pending) ?? ''
}

const TRANSPONDER_STATUS_LABELS: Record<TransponderStatusApi, string> = {
  INITIALISE: 'Initialisé',
  EN_ATTENTE: 'En attente',
  DONNE: 'Donné',
  PERDU: 'Perdu',
  RECUPERE: 'Récupéré',
  DEFAILLANT: 'Défaillant',
}

export function transponderStatusLabel(status: string): string {
  return TRANSPONDER_STATUS_LABELS[status as TransponderStatusApi] ?? status
}

export const PARTICIPANTS_CSV_HEADERS = [
  'Prénom',
  'Nom',
  'Email',
  'Téléphone',
  'Équipe',
  'Capitaine',
  'Resp. transpondeur',
  'État de l\'équipe',
] as const

export function participantsToCsvRows(
  runners: (ApiRunner & {
    teamName?: string
    isCaptain?: boolean
    isTransponderHolder?: boolean
    teamId?: number
    team?: { id: number }
  })[],
  teams: ApiTeam[],
): unknown[][] {
  return runners.map((r) => {
    const team = teams.find((t) => t.id === (r.teamId ?? r.team?.id))
    return [
      r.firstName ?? '',
      r.lastName ?? '',
      r.email ?? '',
      r.phone ?? '',
      r.teamName ?? team?.name ?? '',
      yesNo(!!r.isCaptain),
      yesNo(!!r.isTransponderHolder),
      teamStatusLabel(team),
    ]
  })
}

export const EQUIPES_CSV_HEADERS = [
  'Nom',
  'Nombre de coureurs',
  'Coureurs',
  'Capitaine',
  'Numéro transpondeur',
  'Statut',
  'Nombre de tours',
] as const

export function equipesToCsvRows(
  equipes: (ApiTeam & {
    statut?: string
    membres?: ApiRunner[]
    capitaine?: string
    nbTour?: number | null
    transponders?: { status?: string; numero?: number; reference?: string; id?: number }[]
  })[],
): unknown[][] {
  return equipes.map((e) => {
    const membres = e.membres ?? e.runners ?? []
    const statutLabel = e.statut
      ? teamStatusLabelFromCode(e.statut as TeamStatusCode)
      : teamStatusLabel(e)
    return [
      e.name ?? e.nom ?? '',
      membres.length,
      membres.map(runnerFullName).join(RUNNER_LIST_SEP),
      e.capitaine ?? '',
      activeTransponderNumero(e.transponders),
      statutLabel,
      e.nbTour ?? 0,
    ]
  })
}

export const TRANSPONDEURS_CSV_HEADERS = ['Numéro', 'Équipe', 'État'] as const

export function transpondersToCsvRows(transponders: ApiTransponder[]): unknown[][] {
  return transponders.map((t) => [
    t.numero ?? '',
    t.team?.name ?? '',
    transponderStatusLabel(t.status),
  ])
}
