import { defineStore } from 'pinia'
import { parseJwtPayload } from '~/composables/useJwtAuth'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null as any,
  }),
  getters: {
    isAuthenticated: () => {
      const token = useCookie('auth_token')
      return !!token.value
    },
    currentUserId: (state) => state.user?.id ?? 0,
  },
  actions: {
    async fetchCurrentUser() {
      const token = useCookie('auth_token')
      if (!token.value) return null

      const payload = parseJwtPayload(token.value)
      const rawSub = payload?.sub
      if (rawSub === undefined || rawSub === null) return null
      const id = typeof rawSub === 'string' ? Number.parseInt(rawSub, 10) : Number(rawSub)
      if (!Number.isFinite(id) || id <= 0) return null

      const api = useApi()
      const u = (await api.get(`/user/${id}`)) as Record<string, unknown>
      if (!u || typeof u !== 'object') return null

      this.user = {
        id: Number(u.id),
        email: String(u.email ?? ''),
        firstName: String(u.firstName ?? ''),
        lastName: String(u.lastName ?? ''),
        phone: u.phone != null ? String(u.phone) : null,
        role: u.role,
      }

      return this.user
    },

    /** Après F5 ou si le login n’a pas renvoyé prénom/nom : recharge depuis l’API via le `sub` du JWT. */
    async hydrateUserFromToken() {
      const token = useCookie('auth_token')
      if (!token.value) return
      const hasName = !!(this.user?.firstName?.trim() || this.user?.lastName?.trim())
      if (hasName) return
      try {
        await this.fetchCurrentUser()
      } catch (e) {
        console.warn('erreur hydrate', e) /* token invalide ou hors ligne */
      }
    },

    async login(email: string, password: string) {
      try {
        const api = useApi()
        const response: any = await api.post('/auth/login', { email, password })

        // Create cookie with 24 hours maxAge
        const token = useCookie('auth_token', { maxAge: 60 * 60 * 24, path: '/' })
        token.value = response.accessToken

        this.user = response.user
        return true
      } catch (error: any) {
        console.error('Erreur de connexion:', error.response?._data || error)
        throw new Error(error.response?._data?.message || 'Identifiants incorrects')
      }
    },
    logout() {
      const token = useCookie('auth_token', { path: '/' })
      token.value = null
      this.user = null
    },
  },
})
