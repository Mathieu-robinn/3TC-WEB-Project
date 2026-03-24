<template>
  <v-container fluid class="pa-6">
    <!-- Header -->
    <div class="d-flex justify-space-between align-center mb-6">
      <div class="d-flex align-center">
        <v-icon size="32" color="grey-darken-2" class="mr-3">mdi-timer-outline</v-icon>
        <h1 class="text-h4 font-weight-bold">Gestion des Transpondeurs</h1>
      </div>
      <div class="d-flex align-center gap-3">
        <v-text-field
          v-model="search"
          prepend-inner-icon="mdi-magnify"
          placeholder="Rechercher un ID..."
          variant="outlined"
          density="compact"
          hide-details
          rounded="lg"
          style="max-width: 250px"
        />
        <v-btn color="blue" variant="flat" rounded="lg" prepend-icon="mdi-plus">
          AJOUTER
        </v-btn>
      </div>
    </div>

    <!-- Transponders Table -->
    <v-card rounded="lg" elevation="0" class="border">
      <v-table>
        <thead>
          <tr>
            <th class="text-caption text-uppercase text-medium-emphasis">ID</th>
            <th class="text-caption text-uppercase text-medium-emphasis">Statut</th>
            <th class="text-caption text-uppercase text-medium-emphasis">ID Équipe</th>
            <th class="text-caption text-uppercase text-medium-emphasis">Équipe Actuelle</th>
            <th class="text-caption text-uppercase text-medium-emphasis">Coureur / Responsable</th>
            <th class="text-caption text-uppercase text-medium-emphasis">Dernière Action</th>
            <th class="text-caption text-uppercase text-medium-emphasis text-center">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="t in filteredTransponders" :key="t.id">
            <td class="font-weight-bold text-body-2">{{ t.code }}</td>
            <td>
              <v-chip
                :color="getStatusColor(t.statut)"
                :variant="t.statut === 'perdu' ? 'flat' : 'tonal'"
                size="small"
                :prepend-icon="getStatusIcon(t.statut)"
              >
                {{ getStatusLabel(t.statut) }}
              </v-chip>
            </td>
            <td class="text-body-2">{{ t.equipeId ? `Eq. ${String(t.equipeNum).padStart(2, '0')}` : '-' }}</td>
            <td class="text-body-2">{{ t.equipeName || '-' }}</td>
            <td class="text-body-2" :class="{'font-weight-bold': t.coureurName}">{{ t.coureurName || '-' }}</td>
            <td class="text-body-2" :class="{'text-red': t.statut === 'perdu'}">{{ t.derniereAction }}</td>
            <td class="text-center">
              <div class="d-flex align-center justify-center gap-2">
                <v-btn
                  v-if="t.statut === 'disponible'"
                  variant="outlined"
                  size="small"
                  rounded="lg"
                >
                  Assigner
                </v-btn>
                <v-btn
                  v-else-if="t.statut === 'en_course'"
                  variant="outlined"
                  color="red"
                  size="small"
                  rounded="lg"
                >
                  Déclarer<br>Perdu
                </v-btn>
                <v-btn
                  v-else-if="t.statut === 'perdu'"
                  variant="outlined"
                  size="small"
                  rounded="lg"
                  disabled
                >
                  Désactivé
                </v-btn>
                <v-btn icon variant="text" size="small">
                  <v-icon size="18">mdi-history</v-icon>
                </v-btn>
              </div>
            </td>
          </tr>
        </tbody>
      </v-table>
    </v-card>
  </v-container>
</template>

<script setup>
import { ref, computed } from 'vue'

const search = ref('')

const transponders = ref([
  { id: 1, code: 'TR-001', statut: 'disponible', equipeId: null, equipeNum: null, equipeName: null, coureurName: null, derniereAction: 'Récupéré à 14:00' },
  { id: 2, code: 'TR-002', statut: 'en_course', equipeId: 12, equipeNum: 12, equipeName: 'Les Flèches', coureurName: 'Marie Dupont', derniereAction: 'Donné à 14:15' },
  { id: 3, code: 'TR-003', statut: 'perdu', equipeId: 4, equipeNum: 4, equipeName: 'Team INSA', coureurName: 'Paul L.', derniereAction: 'Perdu à 15:30' },
  { id: 4, code: 'TR-007', statut: 'disponible', equipeId: null, equipeNum: null, equipeName: null, coureurName: null, derniereAction: 'En stock' },
  { id: 5, code: 'TR-045', statut: 'en_course', equipeId: 7, equipeNum: 7, equipeName: 'Les Rapides', coureurName: 'Lucas Petit', derniereAction: 'Donné à 13:45' },
])

const filteredTransponders = computed(() => {
  if (!search.value) return transponders.value
  return transponders.value.filter(t =>
    t.code.toLowerCase().includes(search.value.toLowerCase())
  )
})

function getStatusColor(statut) {
  const colors = { disponible: 'green', en_course: 'blue', perdu: 'red', recupere: 'grey' }
  return colors[statut] || 'grey'
}

function getStatusIcon(statut) {
  const icons = { disponible: 'mdi-circle-small', en_course: 'mdi-lightning-bolt', perdu: 'mdi-alert-circle-outline', recupere: 'mdi-check' }
  return icons[statut] || ''
}

function getStatusLabel(statut) {
  const labels = { disponible: 'Disponible', en_course: 'En Course', perdu: 'Perdu', recupere: 'Récupéré' }
  return labels[statut] || statut
}
</script>

<style scoped>
.border {
  border: 1px solid #e8e8e8 !important;
}

.gap-3 {
  gap: 12px;
}

.gap-2 {
  gap: 8px;
}
</style>
