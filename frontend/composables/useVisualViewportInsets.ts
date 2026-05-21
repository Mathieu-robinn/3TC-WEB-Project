import { ref, watch, onUnmounted, unref, type Ref } from 'vue'
import { MOBILE_TOP_BAR_PX } from '~/composables/useMobileNav'

export const VV_CSS_VARS = {
  height: '--vv-height',
  offsetTop: '--vv-offset-top',
  keyboardInset: '--keyboard-inset',
  shellTop: '--comm-shell-top',
  shellHeight: '--comm-shell-height',
} as const

export type VisualViewportInsets = {
  height: number
  offsetTop: number
  keyboardInset: number
  shellTop: number
  shellHeight: number
}

/** Hauteur utile sous la barre mobile (56px + encoche). */
export function getLayoutTopPx(): number {
  if (typeof document === 'undefined') return MOBILE_TOP_BAR_PX
  const probe = document.createElement('div')
  probe.style.cssText =
    'position:fixed;top:0;left:0;visibility:hidden;pointer-events:none;padding-top:env(safe-area-inset-top,0px)'
  document.body.appendChild(probe)
  const safeTop = parseFloat(getComputedStyle(probe).paddingTop) || 0
  document.body.removeChild(probe)
  return MOBILE_TOP_BAR_PX + safeTop
}

function readInsets(layoutTopPx: number): VisualViewportInsets {
  const vv = window.visualViewport
  if (!vv) {
    const shellTop = layoutTopPx
    const shellHeight = Math.max(0, window.innerHeight - layoutTopPx)
    return {
      height: window.innerHeight,
      offsetTop: 0,
      keyboardInset: 0,
      shellTop,
      shellHeight,
    }
  }
  const keyboardInset = Math.max(0, window.innerHeight - vv.height - vv.offsetTop)
  const shellTop = vv.offsetTop + layoutTopPx
  const shellHeight = Math.max(0, vv.height - layoutTopPx)
  return {
    height: vv.height,
    offsetTop: vv.offsetTop,
    keyboardInset,
    shellTop,
    shellHeight,
  }
}

function applyVars(target: HTMLElement, values: VisualViewportInsets) {
  target.style.setProperty(VV_CSS_VARS.height, `${values.height}px`)
  target.style.setProperty(VV_CSS_VARS.offsetTop, `${values.offsetTop}px`)
  target.style.setProperty(VV_CSS_VARS.keyboardInset, `${values.keyboardInset}px`)
  target.style.setProperty(VV_CSS_VARS.shellTop, `${values.shellTop}px`)
  target.style.setProperty(VV_CSS_VARS.shellHeight, `${values.shellHeight}px`)
}

function clearVars(target: HTMLElement) {
  for (const key of Object.values(VV_CSS_VARS)) {
    target.style.removeProperty(key)
  }
}

/**
 * Suit le visual viewport (clavier mobile) et expose des variables CSS sur le shell chat.
 */
export function useVisualViewportInsets(
  enabled: Ref<boolean>,
  layoutTopPx: Ref<number> | number = MOBILE_TOP_BAR_PX,
) {
  const viewportHeight = ref(0)
  const offsetTop = ref(0)
  const keyboardInset = ref(0)
  const shellTop = ref(0)
  const shellHeight = ref(0)

  let boundEl: HTMLElement | null = null
  let listening = false

  const sync = () => {
    const topPx = unref(layoutTopPx)
    const v = readInsets(topPx)
    viewportHeight.value = v.height
    offsetTop.value = v.offsetTop
    keyboardInset.value = v.keyboardInset
    shellTop.value = v.shellTop
    shellHeight.value = v.shellHeight
    if (boundEl) {
      applyVars(boundEl, v)
      applyVars(document.documentElement, v)
    }
  }

  const onVvScroll = () => {
    if (!enabled.value) return
    window.scrollTo(0, 0)
    sync()
  }

  const onVvResize = () => sync()

  const startListening = () => {
    if (listening || typeof window === 'undefined') return
    listening = true
    sync()
    window.visualViewport?.addEventListener('resize', onVvResize)
    window.visualViewport?.addEventListener('scroll', onVvScroll)
    window.addEventListener('resize', onVvResize)
  }

  const stopListening = () => {
    if (!listening || typeof window === 'undefined') return
    listening = false
    window.visualViewport?.removeEventListener('resize', onVvResize)
    window.visualViewport?.removeEventListener('scroll', onVvScroll)
    window.removeEventListener('resize', onVvResize)
  }

  const bindRoot = (el: HTMLElement | null) => {
    if (boundEl) clearVars(boundEl)
    boundEl = el
    if (boundEl && enabled.value) {
      const v = readInsets(unref(layoutTopPx))
      applyVars(boundEl, v)
      applyVars(document.documentElement, v)
    }
  }

  const unbindRoot = () => {
    if (boundEl) clearVars(boundEl)
    clearVars(document.documentElement)
    boundEl = null
  }

  watch(
    () => unref(layoutTopPx),
    () => {
      if (enabled.value) sync()
    },
  )

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
        shellTop.value = 0
        shellHeight.value = 0
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
    shellTop,
    shellHeight,
    bindRoot,
    unbindRoot,
    sync,
  }
}
