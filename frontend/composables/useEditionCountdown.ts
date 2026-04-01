import { computed, onMounted, onUnmounted, ref } from 'vue'
import type { ApiEdition } from '~/types/api'

type CountdownState = 'before' | 'running' | 'ended' | 'unknown'

export function useEditionCountdown(edition: () => ApiEdition | null | undefined) {
  const now = ref(Date.now())
  let interval: ReturnType<typeof setInterval> | null = null

  const currentEdition = computed(() => edition() ?? null)
  const startMs = computed(() => {
    const value = currentEdition.value?.startDate
    return value ? new Date(value).getTime() : null
  })
  const endMs = computed(() => {
    const value = currentEdition.value?.endDate
    return value ? new Date(value).getTime() : null
  })

  const state = computed<CountdownState>(() => {
    if (!startMs.value || !endMs.value) return 'unknown'
    if (now.value < startMs.value) return 'before'
    if (now.value >= endMs.value) return 'ended'
    return 'running'
  })

  const remainingMs = computed(() => {
    if (!startMs.value || !endMs.value) return 0
    if (state.value === 'before') return Math.max(0, startMs.value - now.value)
    if (state.value === 'running') return Math.max(0, endMs.value - now.value)
    return 0
  })

  const countdown = computed(() => {
    const totalSeconds = Math.floor(remainingMs.value / 1000)
    const days = Math.floor(totalSeconds / 86400)
    const hours = Math.floor((totalSeconds % 86400) / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    const seconds = totalSeconds % 60
    return {
      days: String(days).padStart(2, '0'),
      hours: String(hours).padStart(2, '0'),
      minutes: String(minutes).padStart(2, '0'),
      seconds: String(seconds).padStart(2, '0'),
    }
  })

  const statusLabel = computed(() => {
    if (!currentEdition.value) return 'Edition indisponible'
    if (state.value === 'before') return 'Avant le départ'
    if (state.value === 'running') return 'Edition en cours'
    if (state.value === 'ended') return 'Edition terminée'
    return 'Dates indisponibles'
  })

  const targetLabel = computed(() => {
    if (!currentEdition.value) return ''
    if (state.value === 'before') return 'Départ'
    if (state.value === 'running') return 'Fin'
    return 'Clôture'
  })

  const referenceDateLabel = computed(() => {
    const value = state.value === 'before' ? currentEdition.value?.startDate : currentEdition.value?.endDate
    if (!value) return 'Date indisponible'
    return new Date(value).toLocaleString('fr-FR', {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    })
  })

  onMounted(() => {
    interval = setInterval(() => {
      now.value = Date.now()
    }, 1000)
  })

  onUnmounted(() => {
    if (interval) clearInterval(interval)
  })

  return {
    countdown,
    statusLabel,
    targetLabel,
    referenceDateLabel,
    state,
  }
}
