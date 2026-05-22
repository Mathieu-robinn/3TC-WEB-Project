/** Types API minimaux partagés (stores / pages). */

export interface ApiEdition {
  id: number
  name: string
  active: boolean
  startDate: string
  endDate: string
}

export interface ImportLineIssue {
  line: number
  message: string
}

export interface ImportParticipantsResult {
  dryRun: boolean
  created: { courses: number; teams: number; runners: number }
  skipped: number
  errors: ImportLineIssue[]
  warnings: ImportLineIssue[]
}

export type TransponderStatusApi =
  | 'INITIALISE'
  | 'EN_ATTENTE'
  | 'DONNE'
  | 'PERDU'
  | 'RECUPERE'
  | 'DEFAILLANT'

export interface ApiTransponderRef {
  id?: number
  numero?: number
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
  phone?: string
  teamName?: string
  transponders?: ApiRunnerTransponderRef[]
}

export type CourseCategoryApi = 'SOLO' | 'LOISIR' | 'COMPETITION'

export interface ApiCourse {
  id: number
  name: string
  category: CourseCategoryApi
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
  INITIALISE: number
  EN_ATTENTE: number
  DONNE: number
  PERDU: number
  RECUPERE: number
  DEFAILLANT: number
}

export type NotificationTypeApi = 'INFO' | 'ALERT' | 'EMERGENCY'
export type NotificationStateApi = 'SEEN' | 'UNSEEN'

export interface ApiNotificationSender {
  id: number
  firstName: string
  lastName: string
  email: string
}

export interface ApiNotification {
  id: number
  type: NotificationTypeApi
  message: string
  date: string
  state: NotificationStateApi
  processed: boolean
  /** Présent pour les envois manuels (mégaphone). */
  sender: ApiNotificationSender | null
}

export type NotificationAudienceApi = 'ADMINS' | 'BENEVOLES' | 'ALL'

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
  transponder?: { id: number; status?: TransponderStatusApi; numero?: number; reference?: string }
  team?: { id: number; name?: string } | null
}



export interface ApiTransponder {
  id: number
  /** Numéro métier unique pour l’édition (affichage principal). */
  numero: number
  reference?: string
  status: TransponderStatusApi
  editionId: number
  teamId?: number | null
  team?: { id: number; name?: string; num?: number } | null
}
