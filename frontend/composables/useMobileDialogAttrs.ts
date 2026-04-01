import { computed, type ComputedRef } from 'vue'
import { useDisplay } from 'vuetify/framework'

/** Classe globale (admin-pages.css) : marges sur dialogs plein écran. */
export const DIALOG_MOBILE_INSET_CLASS = 'dialog-mobile-inset'

/** Attributs pour `v-dialog` : plein écran en `sm` et moins, sinon `maxWidth` fixe. */
export function useMobileDialogAttrs(
  desktopMaxWidth: string | number = 520,
): ComputedRef<Record<string, string | number | boolean>> {
  const display = useDisplay()
  return computed(() => {
    if (display.smAndDown.value) {
      return { fullscreen: true, contentClass: DIALOG_MOBILE_INSET_CLASS }
    }
    return { maxWidth: desktopMaxWidth }
  })
}
