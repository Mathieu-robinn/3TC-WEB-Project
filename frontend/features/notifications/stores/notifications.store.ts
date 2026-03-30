import { defineStore } from 'pinia'
import type { Socket } from 'socket.io-client'
import type { ApiNotification, NotificationAudienceApi, NotificationTypeApi } from '~/types/api'
import { useAuthStore } from '~/features/auth/stores/auth'

const TYPE_ORDER: Record<NotificationTypeApi, number> = {
  EMERGENCY: 0,
  ALERT: 1,
  INFO: 2,
}

export type NotifUiFilter = 'all' | 'unseen' | 'unprocessed' | 'emergency' | 'alert'
export type NotifSortDate = 'desc' | 'asc'

function sortItemsStorage(list: ApiNotification[]): ApiNotification[] {
  return [...list].sort((a, b) => {
    const ta = TYPE_ORDER[a.type]
    const tb = TYPE_ORDER[b.type]
    if (ta !== tb) return ta - tb
    return new Date(b.date).getTime() - new Date(a.date).getTime()
  })
}

function formatDateForSearch(iso: string): string {
  try {
    return new Date(iso).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })
  } catch {
    return iso
  }
}

function matchesSearch(n: ApiNotification, q: string): boolean {
  const s = q.trim().toLowerCase()
  if (!s) return true
  if (n.message.toLowerCase().includes(s)) return true
  if (formatDateForSearch(n.date).toLowerCase().includes(s)) return true
  if (n.sender) {
    const name = `${n.sender.firstName} ${n.sender.lastName}`.toLowerCase()
    if (name.includes(s)) return true
    if (n.sender.email?.toLowerCase().includes(s)) return true
  }
  return false
}

function applyUiFilter(list: ApiNotification[], f: NotifUiFilter): ApiNotification[] {
  if (f === 'unseen') return list.filter((n) => n.state === 'UNSEEN')
  if (f === 'unprocessed') return list.filter((n) => !n.processed)
  if (f === 'emergency') return list.filter((n) => n.type === 'EMERGENCY')
  if (f === 'alert') return list.filter((n) => n.type === 'ALERT')
  return list
}

/** Nom affiché dans le toast : expéditeur mégaphone ou auteur déduit du message automatique. */
export function authorLabelForToast(n: ApiNotification): string | null {
  if (n.sender) {
    const name = `${n.sender.firstName} ${n.sender.lastName}`.trim()
    return name || null
  }
  const m = n.message.match(/^(.+?)\s+a\s+(attribué|récupéré|déclaré)/i)
  if (m) return m[1].trim()
  return null
}

/** Non traitées d’abord, puis traitées ; dans chaque bloc tri par date. */
function sortWithinCategory(items: ApiNotification[], dateDesc: boolean): ApiNotification[] {
  const unprocessed = items.filter((n) => !n.processed)
  const processed = items.filter((n) => n.processed)
  const cmp = (a: ApiNotification, b: ApiNotification) => {
    const ta = new Date(a.date).getTime()
    const tb = new Date(b.date).getTime()
    return dateDesc ? tb - ta : ta - tb
  }
  unprocessed.sort(cmp)
  processed.sort(cmp)
  return [...unprocessed, ...processed]
}

function normalizeNotification(n: ApiNotification): ApiNotification {
  return { ...n, sender: n.sender ?? null }
}

export interface AdminToast {
  key: string
  type: 'ALERT' | 'EMERGENCY'
  message: string
  /** Auteur (mégaphone ou acteur extrait du message transpondeur). */
  authorLabel: string | null
}

let boundSocket: Socket | null = null
let socketHandler: ((payload: ApiNotification) => void) | null = null

export const useNotificationsStore = defineStore('notifications', {
  state: () => ({
    items: [] as ApiNotification[],
    adminToasts: [] as AdminToast[],
    loading: false,
    notifFilter: 'unprocessed' as NotifUiFilter,
    notifSortDate: 'desc' as NotifSortDate,
    notifSearch: '',
  }),

  getters: {
    unseenCount: (state) => state.items.filter((n) => n.state === 'UNSEEN').length,

    /** Listes affichées dans le menu (filtre + recherche + tri par catégorie). */
    sectionLists(state): {
      emergencyList: ApiNotification[]
      alertList: ApiNotification[]
      infoList: ApiNotification[]
    } {
      const q = state.notifSearch.trim().toLowerCase()
      let base = state.items.filter((n) => matchesSearch(n, q))
      base = applyUiFilter(base, state.notifFilter)
      const dateDesc = state.notifSortDate === 'desc'
      return {
        emergencyList: sortWithinCategory(
          base.filter((n) => n.type === 'EMERGENCY'),
          dateDesc,
        ),
        alertList: sortWithinCategory(
          base.filter((n) => n.type === 'ALERT'),
          dateDesc,
        ),
        infoList: sortWithinCategory(
          base.filter((n) => n.type === 'INFO'),
          dateDesc,
        ),
      }
    },
  },

  actions: {
    bindSocket(socket: Socket | null) {
      if (!socket) return
      if (boundSocket === socket) return
      if (boundSocket && socketHandler) {
        boundSocket.off('newNotification', socketHandler)
      }
      boundSocket = socket
      socketHandler = (payload: ApiNotification) => {
        this.applyIncomingPayload(payload)
      }
      socket.on('newNotification', socketHandler)
    },

    unbindSocket() {
      if (boundSocket && socketHandler) {
        boundSocket.off('newNotification', socketHandler)
      }
      boundSocket = null
      socketHandler = null
    },

    applyIncomingPayload(payload: ApiNotification) {
      const auth = useAuthStore()
      const row = normalizeNotification(payload)
      const idx = this.items.findIndex((n) => n.id === row.id)
      if (idx === -1) {
        this.items.push(row)
      } else {
        this.items[idx] = row
      }
      this.items = sortItemsStorage(this.items)
      if (auth.user?.role === 'ADMIN' && (row.type === 'ALERT' || row.type === 'EMERGENCY')) {
        this.pushAdminToast(row)
      }
    },

    pushAdminToast(row: ApiNotification) {
      if (row.type !== 'ALERT' && row.type !== 'EMERGENCY') return
      const key = `${Date.now()}-${Math.random().toString(36).slice(2)}`
      const authorLabel = authorLabelForToast(row)
      this.adminToasts.push({ key, type: row.type, message: row.message, authorLabel })
      window.setTimeout(() => {
        this.adminToasts = this.adminToasts.filter((t) => t.key !== key)
      }, 8000)
    },

    dismissToast(key: string) {
      this.adminToasts = this.adminToasts.filter((t) => t.key !== key)
    },

    async fetchNotifications() {
      const api = useApi()
      this.loading = true
      try {
        const data = await api.get<ApiNotification[]>('/notifications')
        this.items = Array.isArray(data)
          ? sortItemsStorage(data.map((n) => normalizeNotification(n)))
          : []
      } catch (e) {
        console.error('fetchNotifications', e)
      } finally {
        this.loading = false
      }
    },

    async markSeen(id: number) {
      const api = useApi()
      const updated = normalizeNotification(await api.patch<ApiNotification>(`/notifications/${id}/seen`, {}))
      const i = this.items.findIndex((n) => n.id === id)
      if (i !== -1) this.items[i] = updated
      this.items = sortItemsStorage(this.items)
    },

    async markProcessed(id: number) {
      const api = useApi()
      const updated = normalizeNotification(
        await api.patch<ApiNotification>(`/notifications/${id}/processed`, {}),
      )
      const i = this.items.findIndex((n) => n.id === id)
      if (i !== -1) this.items[i] = updated
      this.items = sortItemsStorage(this.items)
    },

    async sendManual(body: { type: NotificationTypeApi; message: string; audience: NotificationAudienceApi }) {
      const api = useApi()
      await api.post('/notifications/send', body)
    },
  },
})
