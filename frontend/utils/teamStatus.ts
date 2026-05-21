import type { ApiTeam } from '~/types/api'

export type TeamStatusCode =
  | 'en_piste'
  | 'en_attente_remise'
  | 'en_attente'
  | 'terminé'
  | 'aucun membre'

const STATUS_LABELS: Record<TeamStatusCode, string> = {
  en_piste: 'En piste',
  en_attente_remise: 'En attente de remise',
  en_attente: 'Sans puce',
  terminé: 'Terminé',
  'aucun membre': 'Sans puce',
}

type TeamWithTransponders = Pick<ApiTeam, 'courseFinished' | 'runners' | 'transponders'> & {
  transpondeurs?: { status?: string }[]
}

export function computeTeamStatus(team: TeamWithTransponders | null | undefined): TeamStatusCode {
  if (!team) return 'aucun membre'
  const runners = team.runners ?? []
  const teamTransponders = (team.transponders ?? team.transpondeurs ?? []) as { status?: string }[]
  const givenTp = teamTransponders.find((t) => t.status === 'DONNE')
  const pendingTp = teamTransponders.find((t) => t.status === 'EN_ATTENTE')

  if (team.courseFinished) return 'terminé'
  if (runners.length === 0) return 'aucun membre'
  if (givenTp) return 'en_piste'
  if (pendingTp) return 'en_attente_remise'
  return 'en_attente'
}

export function teamStatusLabel(team: TeamWithTransponders | null | undefined): string {
  return STATUS_LABELS[computeTeamStatus(team)]
}

export function teamStatusLabelFromCode(code: TeamStatusCode): string {
  return STATUS_LABELS[code]
}
