import { ref, watch, onUnmounted, type Ref } from 'vue'

export const VV_CSS_VARS = {
  height: '--vv-height',
  offsetTop: '--vv-offset-top',
  keyboardInset: '--keyboard-inset',
} as const

function readInsets() {
  const vv = window.visualViewport
  if (!vv) {
    return { height: window.innerHeight, offsetTop: 0, keyboardInset: 0 }
  }
  const keyboardInset = Math.max(0, window.innerHeight - vv.height - vv.offsetTop)
  return {
    height: vv.height,
    offsetTop: vv.offsetTop,
    keyboardInset,
  }
}

function applyVars(target: HTMLElement, values: ReturnType<typeof readInsets>) {
  target.style.setProperty(VV_CSS_VARS.height, `${values.height}px`)
  target.style.setProperty(VV_CSS_VARS.offsetTop, `${values.offsetTop}px`)
  target.style.setProperty(VV_CSS_VARS.keyboardInset, `${values.keyboardInset}px`)
}

function clearVars(target: HTMLElement) {
  target.style.removeProperty(VV_CSS_VARS.height)
  target.style.removeProperty(VV_CSS_VARS.offsetTop)
  target.style.removeProperty(VV_CSS_VARS.keyboardInset)
}

/**
 * Suit le visual viewport (clavier mobile) et expose des variables CSS sur un élément cible.
 */
export function useVisualViewportInsets(enabled: Ref<boolean>) {
  const viewportHeight = ref(0)
  const offsetTop = ref(0)
  const keyboardInset = ref(0)

  let boundEl: HTMLElement | null = null
  let listening = false

  const sync = () => {
    const v = readInsets()
    viewportHeight.value = v.height
    offsetTop.value = v.offsetTop
    keyboardInset.value = v.keyboardInset
    if (boundEl) applyVars(boundEl, v)
  }

  const onVvChange = () => sync()

  const startListening = () => {
    if (listening || typeof window === 'undefined') return
    listening = true
    sync()
    window.visualViewport?.addEventListener('resize', onVvChange)
    window.visualViewport?.addEventListener('scroll', onVvChange)
    window.addEventListener('resize', onVvChange)
  }

  const stopListening = () => {
    if (!listening || typeof window === 'undefined') return
    listening = false
    window.visualViewport?.removeEventListener('resize', onVvChange)
    window.visualViewport?.removeEventListener('scroll', onVvChange)
    window.removeEventListener('resize', onVvChange)
  }

  const bindRoot = (el: HTMLElement | null) => {
    if (boundEl) clearVars(boundEl)
    boundEl = el
    if (boundEl && enabled.value) {
      applyVars(boundEl, readInsets())
    }
  }

  const unbindRoot = () => {
    if (boundEl) clearVars(boundEl)
    boundEl = null
  }

  watch(
    enabled,
    (on) => {
      if (on) {
        startListening()
        sync()
      } else {
        stopListening()
        unbindRoot()
        viewportHeight.value = 0
        offsetTop.value = 0
        keyboardInset.value = 0
      }
    },
    { immediate: true },
  )

  onUnmounted(() => {
    stopListening()
    unbindRoot()
  })

  return {
    viewportHeight,
    offsetTop,
    keyboardInset,
    bindRoot,
    unbindRoot,
    sync,
  }
}
