export default defineNuxtRouteMiddleware((to) => {
  /** Lecture directe du cookie : le getter Pinia peut rester « figé » juste après login. */
  const token = useCookie('auth_token')

  const publicRoutes = ['/login']

  if (publicRoutes.includes(to.path)) {
    if (token.value) {
      return navigateTo('/')
    }
    return
  }

  if (!token.value) {
    return navigateTo('/login')
  }
})
