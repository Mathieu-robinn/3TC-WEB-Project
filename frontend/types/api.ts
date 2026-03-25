/** Types API minimaux partagés (stores / pages). */

export type TransponderStatusApi = 'NEW' | 'IN' | 'OUT' | 'LOST'

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
  transponders?: ApiTransponderRef[]
}

export interface ApiTeam {
  id: number
  name?: string
  /** Alias possible côté UI legacy */
  nom?: string
  nbTour?: number | null
  courseId?: number
  runners?: ApiRunner[]
}

export interface TransponderStats {
  NEW: number
  IN: number
  OUT: number
  LOST: number
}

export interface ApiTransponder {
  id: number
  reference?: string
  status: TransponderStatusApi
}
