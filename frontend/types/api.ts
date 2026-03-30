/** Types API minimaux partagés (stores / pages). */

export interface ApiEdition {
  id: number
  name: string
  active: boolean
  startDate: string
  endDate: string
}

export type TransponderStatusApi = 'EN_ATTENTE' | 'ATTRIBUE' | 'PERDU' | 'RECUPERE' | 'DEFAILLANT'

export interface ApiTransponderRef {
  id?: number
  reference?: string
  status?: string
}

/** Réf. transpondeur côté liste coureur (API ou mock démo). */
export interface ApiRunnerTransponderRef {
  reference?: string
  status?: string
}

export interface ApiRunner {
  id: number
  firstName?: string
  lastName?: string
  teamId: number
  team?: { id: number }
  email?: string
  teamName?: string
  transponders?: ApiRunnerTransponderRef[]
}

export interface ApiCourse {
  id: number
  name: string
  distanceTour?: number
  dateAndTime?: string
  editionId?: number
}

export interface ApiTeam {
  id: number
  name?: string
  /** Alias possible côté UI legacy */
  nom?: string
  nbTour?: number | null
  courseId?: number
  /** Capitaine (FK Prisma). */
  respRunnerId?: number | null
  /** Coureur désigné comme responsable du transpondeur. */
  transponderHolderRunnerId?: number | null
  /** Course terminée (transpondeur récupéré) — plus d’attribution. */
  courseFinished?: boolean
  runners?: ApiRunner[]
  transponders?: ApiTransponderRef[]
}

export interface TransponderStats {
  EN_ATTENTE: number
  ATTRIBUE: number
  PERDU: number
  RECUPERE: number
  DEFAILLANT: number
}

/** Transaction telle que renvoyée par l’API (champs Prisma + include optionnel). */
export interface TransponderTransaction {
  id: number
  transponderId: number
  teamId: number | null
  userId: number
  dateTime: string
  type: TransponderStatusApi
  user?: { id: number; firstName?: string; lastName?: string; email?: string }
  /** Présent sur GET /transactions/team/:id ou /transactions/transponder/:id lorsque le backend inclut la relation. */
  transponder?: { id: number; status?: TransponderStatusApi }
  team?: { id: number; name?: string } | null
}



export interface ApiTransponder {
  id: number
  reference?: string
  status: TransponderStatusApi
  editionId: number
  teamId?: number | null
  team?: { id: number; name?: string; num?: number } | null
}
