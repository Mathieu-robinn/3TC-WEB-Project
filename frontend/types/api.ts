/** Types API minimaux partagés (stores / pages). */

export type TransponderStatusApi = 'EN_ATTENTE' | 'ATTRIBUE' | 'PERDU' | 'RECUPERE'

export interface ApiTransponderRef {
  id?: number
  reference?: string
  status?: string
}

export interface ApiRunner {
  id: number
  firstName?: string
  lastName?: string
  teamId?: number
  team?: { id: number }
  email?: string
  teamName?: string
}

export interface ApiTeam {
  id: number
  name?: string
  /** Alias possible côté UI legacy */
  nom?: string
  nbTour?: number | null
  courseId?: number
  runners?: ApiRunner[]
  transponders?: ApiTransponderRef[]
}

export interface TransponderStats {
  EN_ATTENTE: number
  ATTRIBUE: number
  PERDU: number
  RECUPERE: number
}

export interface TransponderTransaction {
  id: number;
  transponderId: number;
  teamId: number;
  userId: number;
  dateTime: string;
  type: TransponderStatusApi;
}



export interface ApiTransponder {
  id: number
  reference?: string
  status: TransponderStatusApi
  teamId?: number | null
  team?: { id: number; name?: string; num?: number } | null
}
