import { ref, watch, computed, type ComputedRef } from 'vue'
import { useDisplay } from 'vuetify/framework'

export type PhoneFilterExpand = {
  /** Breakpoint `xs` : téléphone */
  isPhoneFilters: ComputedRef<boolean>
  phoneFiltersExpanded: ReturnType<typeof ref<boolean>>
  togglePhoneFilters: () => void
}

/** Sur `xs`, replie les filtres : barre principale + bouton triangle pour déplier. */
export function usePhoneFilterExpand(): PhoneFilterExpand {
  const display = useDisplay()
  const isPhoneFilters = computed(() => display.xs.value)
  const phoneFiltersExpanded = ref(false)

  watch(isPhoneFilters, (phone) => {
    if (!phone) phoneFiltersExpanded.value = false
  })

  function togglePhoneFilters() {
    phoneFiltersExpanded.value = !phoneFiltersExpanded.value
  }

  return {
    isPhoneFilters,
    phoneFiltersExpanded,
    togglePhoneFilters,
  }
}
