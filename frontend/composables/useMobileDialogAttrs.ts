import { computed, type ComputedRef } from 'vue'
import { useDisplay } from 'vuetify/framework'

/** Attributs pour `v-dialog` : plein écran en `sm` et moins, sinon `maxWidth` fixe. */
export function useMobileDialogAttrs(
  desktopMaxWidth: string | number = 520,
): ComputedRef<Record<string, string | number | boolean>> {
  const display = useDisplay()
  return computed(() => {
    if (display.smAndDown.value) {
      return { fullscreen: true }
    }
    return { maxWidth: desktopMaxWidth }
  })
}
