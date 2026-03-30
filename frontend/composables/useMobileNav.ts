import { computed } from 'vue'
import { useDisplay } from 'vuetify/framework'

/** Aligné sur le layout : barre mobile + safe area (md et moins). */
export const MOBILE_TOP_BAR_PX = 56

export function useMobileNav() {
  const display = useDisplay()
  const isMobileNav = computed(() => display.mdAndDown.value)
  return { display, isMobileNav }
}
