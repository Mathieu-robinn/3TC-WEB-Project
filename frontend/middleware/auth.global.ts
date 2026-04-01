export default defineNuxtRouteMiddleware((to) => {
  /** Lecture directe du cookie : le getter Pinia peut rester « figé » juste après login. */
  const token = useCookie('auth_token')

  /** Routes entièrement publiques (pas de redirection même si connecté). */
  const publicRoutes = ['/']

  /** Redirige /login → /dashboard si déjà connecté, mais ne touche pas les routes publiques. */
  if (to.path === '/login') {
    if (token.value) {
      return navigateTo('/dashboard')
    }
    return
  }

  if (publicRoutes.includes(to.path)) {
    return
  }

  if (!token.value) {
    return navigateTo('/login')
  }
})

