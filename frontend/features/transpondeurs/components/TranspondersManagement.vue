<template>
  <v-container fluid class="pa-6 transponders-page">
    <div class="d-flex justify-space-between align-center mb-6 flex-wrap gap-3">
      <div class="d-flex align-center">
        <v-icon size="32" color="grey-darken-2" class="mr-3">mdi-timer-outline</v-icon>
        <div>
          <h1 class="text-h4 font-weight-bold">Gestion des Transpondeurs</h1>
          <p class="text-body-2 text-medium-emphasis mb-0">{{ store.totalStats.total }} puces · API</p>
        </div>
      </div>
      <div class="d-flex align-center gap-3 flex-wrap">
        <v-text-field
          v-model="store.search"
          prepend-inner-icon="mdi-magnify"
          placeholder="Référence ou ID..."
          variant="outlined"
          density="compact"
          hide-details
          rounded="lg"
          clearable
          style="max-width: 260px"
        />
        <v-select
          v-model="store.filterStatus"
          :items="statusFilterItems"
          item-title="title"
          item-value="value"
          variant="outlined"
          density="compact"
          hide-details
          rounded="lg"
          clearable
          style="max-width: 200px"
          label="Statut"
          @update:model-value="(v) => { if (v == null) store.filterStatus = 'tous' }"
        />
        <v-btn variant="tonal" rounded="lg" prepend-icon="mdi-refresh" :loading="store.loading" @click="store.fetchAll()">
          Actualiser
        </v-btn>
        <v-btn color="primary" variant="flat" rounded="lg" prepend-icon="mdi-plus" :loading="store.saving" @click="onAdd">
          Ajouter
        </v-btn>
      </div>
    </div>

    <v-alert v-if="store.error" type="warning" variant="tonal" rounded="lg" class="mb-4" density="compact">
      {{ store.error }}
    </v-alert>

    <div v-if="store.loading" class="d-flex justify-center py-16">
      <v-progress-circular indeterminate color="primary" size="48" />
    </div>

    <v-card v-else rounded="lg" elevation="0" class="data-border">
      <v-table>
        <thead>
          <tr>
            <th class="text-caption text-uppercase text-medium-emphasis">ID</th>
            <th class="text-caption text-uppercase text-medium-emphasis">Libellé</th>
            <th class="text-caption text-uppercase text-medium-emphasis">Statut</th>
            <th class="text-caption text-uppercase text-medium-emphasis text-center">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="t in store.filteredTransponders" :key="t.id">
            <td class="font-weight-medium text-body-2">{{ t.id }}</td>
            <td class="text-body-2">{{ labelFor(t) }}</td>
            <td>
              <v-chip
                :color="store.statusColor(t.status)"
                variant="tonal"
                size="small"
                class="font-weight-medium"
              >
                {{ store.statusLabel(t.status) }}
              </v-chip>
            </td>
            <td class="text-center">
              <v-btn icon variant="text" size="small" disabled title="Bientôt">
                <v-icon size="18">mdi-history</v-icon>
              </v-btn>
            </td>
          </tr>
        </tbody>
      </v-table>
      <div v-if="!store.filteredTransponders.length" class="text-center text-medium-emphasis py-12">
        Aucun transpondeur ne correspond aux filtres.
      </div>
    </v-card>
  </v-container>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useTranspondersStore } from '~/features/transpondeurs/stores/transpondeurs'
import { transponderDisplay } from '~/utils/transponder'

const store = useTranspondersStore()

const statusFilterItems = computed(() => [
  { title: 'Tous les statuts', value: 'tous' },
  ...store.statuses.map((s) => ({ title: store.statusLabel(s), value: s })),
])

function labelFor(t) {
  return transponderDisplay(t) || '—'
}

async function onAdd() {
  try {
    await store.createTransponder({ status: 'NEW' })
  } catch {
    /* erreurs réseau gérées côté store / UI plus tard */
  }
}

onMounted(() => store.fetchAll())
</script>

<style scoped>
.data-border {
  border: 1px solid rgba(var(--v-theme-on-surface), 0.12);
}
</style>
