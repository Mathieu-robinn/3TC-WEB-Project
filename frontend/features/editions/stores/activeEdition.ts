import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { ApiEdition } from '~/types/api'

/** Libellé de l’édition active (synchronisé via GET /editions). */
export const useActiveEditionStore = defineStore('activeEdition', () => {
  const name = ref<string | null>(null)
  const editions = ref<ApiEdition[]>([])

  const displayEdition = (list: ApiEdition[]) => {
    const active = list.find((e) => e.active)
    if (active) return active
    if (!list.length) return undefined
    return [...list].sort(
      (a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime(),
    )[0]
  }

  const currentEdition = computed<ApiEdition | null>(() => displayEdition(editions.value) ?? null)

  const load = async () => {
    const api = useApi()
    try {
      const list = await api.get<ApiEdition[]>('/editions')
      editions.value = Array.isArray(list) ? list : []
      name.value = currentEdition.value?.name ?? null
    } catch {
      editions.value = []
      name.value = null
    }
  }

  return { name, editions, currentEdition, load }
})
