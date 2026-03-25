import { defineStore } from 'pinia'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null as any,
  }),
  getters: {
    isAuthenticated: () => {
      const token = useCookie('auth_token')
      return !!token.value
    },
  },
  actions: {
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
