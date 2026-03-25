import { defineStore } from 'pinia'

export const useThemeStore = defineStore('theme', () => {
  // Persist dark mode preference in a cookie
  const isDark = useCookie<boolean>('theme_dark', {
    default: () => false,
    maxAge: 60 * 60 * 24 * 365,
    path: '/',
  })

  const toggle = () => {
    isDark.value = !isDark.value
  }

  return { isDark, toggle }
})
