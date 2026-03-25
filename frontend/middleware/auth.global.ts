import { useAuthStore } from '~/stores/auth'

export default defineNuxtRouteMiddleware((to) => {
  const authStore = useAuthStore()

  // Les routes qui ne nécessitent pas d'être connecté
  const publicRoutes = ['/login']

  if (publicRoutes.includes(to.path)) {
    // Si déjà connecté et qu'on essaie d'aller sur /login -> rediriger vers l'accueil
    if (authStore.isAuthenticated) {
      return navigateTo('/')
    }
    return
  }

  // Bloquer l'accès aux autres routes non publiques si pas de token
  if (!authStore.isAuthenticated) {
    return navigateTo('/login')
  }
})
