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

function isClient(): boolean {
  return import.meta.client && typeof document !== 'undefined'
}

function getHtmlElement(): HTMLElement | null {
  if (!isClient()) return null
  return document.documentElement
}

/** Hauteur utile sous la barre mobile (56px + encoche). */
export function getLayoutTopPx(): number {
  if (!isClient()) return MOBILE_TOP_BAR_PX
  const probe = document.createElement('div')
  probe.style.cssText =
    'position:fixed;top:0;left:0;visibility:hidden;pointer-events:none;padding-top:env(safe-area-inset-top,0px)'
  document.body.appendChild(probe)
  const safeTop = parseFloat(getComputedStyle(probe).paddingTop) || 0
  document.body.removeChild(probe)
  return MOBILE_TOP_BAR_PX + safeTop
}

function readInsets(layoutTopPx: number): VisualViewportInsets {
  if (!isClient() || typeof window === 'undefined') {
    return {
      height: 0,
      offsetTop: 0,
      keyboardInset: 0,
      shellTop: layoutTopPx,
      shellHeight: 0,
    }
  }
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
  /** Barre app toujours en haut du layout ; hauteur jusqu’au bas du visual viewport */
  const shellTop = layoutTopPx
  const shellHeight = Math.max(0, vv.offsetTop + vv.height - layoutTopPx)
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

function applyVarsToHtml(values: VisualViewportInsets) {
  const html = getHtmlElement()
  if (html) applyVars(html, values)
}

function clearVarsFromHtml() {
  const html = getHtmlElement()
  if (html) clearVars(html)
}

/**
 * Suit le visual viewport (clavier mobile) et expose des variables CSS sur le shell chat.
 * Ne touche au DOM que côté client (évite erreur SSR au refresh).
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
    if (!isClient()) return
    const topPx = unref(layoutTopPx)
    const v = readInsets(topPx)
    viewportHeight.value = v.height
    offsetTop.value = v.offsetTop
    keyboardInset.value = v.keyboardInset
    shellTop.value = v.shellTop
    shellHeight.value = v.shellHeight
    if (boundEl) {
      applyVars(boundEl, v)
      applyVarsToHtml(v)
    }
  }

  const onVvScroll = () => {
    if (!enabled.value) return
    sync()
  }

  const onVvResize = () => sync()

  const startListening = () => {
    if (listening || !isClient()) return
    listening = true
    sync()
    window.visualViewport?.addEventListener('resize', onVvResize)
    window.visualViewport?.addEventListener('scroll', onVvScroll)
    window.addEventListener('resize', onVvResize)
  }

  const stopListening = () => {
    if (!listening || !isClient()) return
    listening = false
    window.visualViewport?.removeEventListener('resize', onVvResize)
    window.visualViewport?.removeEventListener('scroll', onVvScroll)
    window.removeEventListener('resize', onVvResize)
  }

  const bindRoot = (el: HTMLElement | null) => {
    if (boundEl) clearVars(boundEl)
    boundEl = el
    if (boundEl && enabled.value && isClient()) {
      const v = readInsets(unref(layoutTopPx))
      applyVars(boundEl, v)
      applyVarsToHtml(v)
    }
  }

  const unbindRoot = () => {
    if (boundEl) clearVars(boundEl)
    clearVarsFromHtml()
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
      if (!isClient()) return
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
