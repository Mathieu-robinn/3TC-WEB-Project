<template>
  <v-container fluid class="pa-6">
    <!-- Header -->
    <div class="d-flex justify-space-between align-center mb-6">
      <div class="d-flex align-center">
        <v-icon size="32" color="grey-darken-2" class="mr-3">mdi-account-group-outline</v-icon>
        <h1 class="text-h4 font-weight-bold">Gestion des Équipes</h1>
      </div>
      <div class="d-flex align-center gap-3">
        <v-text-field
          v-model="search"
          prepend-inner-icon="mdi-magnify"
          placeholder="Rechercher..."
          variant="outlined"
          density="compact"
          hide-details
          rounded="lg"
          style="max-width: 250px"
        />
        <v-btn variant="outlined" rounded="lg" prepend-icon="mdi-filter-outline">
          FILTRER
        </v-btn>
      </div>
    </div>

    <!-- Teams Grid -->
    <v-row>
      <v-col v-for="equipe in filteredEquipes" :key="equipe.id" cols="12" md="4">
        <v-card rounded="lg" elevation="0" class="border pa-4" height="100%">
          <!-- Header -->
          <div class="d-flex justify-space-between align-start mb-2">
            <h3 class="text-subtitle-1 font-weight-bold">
              Équipe {{ equipe.numero }} - {{ equipe.nom }}
            </h3>
            <v-chip
              :color="getStatutColor(equipe.statut)"
              :variant="equipe.statut === 'sans_transpondeur' ? 'outlined' : 'flat'"
              size="small"
            >
              {{ getStatutLabel(equipe.statut) }}
            </v-chip>
          </div>

          <!-- Details -->
          <div class="text-body-2 mb-1">
            <span class="text-medium-emphasis">Capitaine : </span>{{ equipe.capitaine }}
          </div>
          <div class="text-body-2 text-primary mb-3">
            Coureurs : {{ equipe.nbCoureurs }} inscrits
          </div>

          <!-- Transponder Info -->
          <div class="transponder-info pa-2 rounded mb-3">
            <span class="text-body-2" v-if="equipe.transpondeur">
              <strong>Transpondeur actif :</strong> {{ equipe.transpondeur }}
            </span>
            <span class="text-body-2 text-medium-emphasis" v-else>
              Aucun transpondeur assigné
            </span>
          </div>

          <!-- Action -->
          <div class="text-center">
            <a href="#" class="text-primary text-body-2 font-weight-medium text-decoration-none">
              Voir les détails
            </a>
          </div>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { ref, computed } from 'vue'

const search = ref('')

const equipes = ref([
  { id: 1, numero: 12, nom: 'Les Flèches', statut: 'en_piste', capitaine: 'Thomas Bernard', nbCoureurs: 6, transpondeur: 'TR-002' },
  { id: 2, numero: 4, nom: 'Team INSA', statut: 'sans_transpondeur', capitaine: 'Sophie Martin', nbCoureurs: 5, transpondeur: null },
  { id: 3, numero: 7, nom: 'Les Rapides', statut: 'en_attente', capitaine: 'Lucas Petit', nbCoureurs: 6, transpondeur: 'TR-045' },
  { id: 4, numero: 15, nom: 'Sprint Masters', statut: 'en_piste', capitaine: 'Emma Rousseau', nbCoureurs: 6, transpondeur: 'TR-023' },
  { id: 5, numero: 9, nom: 'Les Coureurs', statut: 'en_attente', capitaine: 'Hugo Dubois', nbCoureurs: 4, transpondeur: null },
  { id: 6, numero: 21, nom: 'Team Endurance', statut: 'en_piste', capitaine: 'Claire Moreau', nbCoureurs: 6, transpondeur: 'TR-067' },
])

const filteredEquipes = computed(() => {
  if (!search.value) return equipes.value
  const s = search.value.toLowerCase()
  return equipes.value.filter(e =>
    e.nom.toLowerCase().includes(s) ||
    e.capitaine.toLowerCase().includes(s) ||
    String(e.numero).includes(s)
  )
})

function getStatutColor(statut) {
  const colors = { en_piste: 'green', en_attente: 'orange', sans_transpondeur: 'red' }
  return colors[statut] || 'grey'
}

function getStatutLabel(statut) {
  const labels = { en_piste: 'En piste', en_attente: 'En attente', sans_transpondeur: 'Sans transpondeur' }
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

.transponder-info {
  background-color: #f8f9fc;
  border: 1px solid #eee;
}
</style>
