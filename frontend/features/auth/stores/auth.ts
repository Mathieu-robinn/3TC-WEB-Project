import { defineStore } from 'pinia'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null as { id: number; email: string; role: string; firstName?: string; lastName?: string } | null,
  }),
  getters: {
    isAuthenticated: () => {
      const token = useCookie('auth_token')
      return !!token.value
    },
    currentUserId: (state) => state.user?.id ?? 0,
  },
  actions: {
    // Decode JWT to restore user after page reload (Pinia is not persisted)
    initFromToken() {
      if (this.user) return // already set
      const token = useCookie('auth_token')
      if (!token.value) return
      try {
        // Decode JWT payload (base64url)
        const base64 = token.value.split('.')[1]
        const json = atob(base64.replace(/-/g, '+').replace(/_/g, '/'))
        const payload = JSON.parse(json)
        this.user = {
          id: payload.sub,
          email: payload.email,
          role: payload.role,
          firstName: payload.firstName,
          lastName: payload.lastName,
        }
      } catch (e) {
        console.warn('Could not decode JWT', e)
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
