<template>
  <v-container fluid class="pa-6">
    <!-- Header -->
    <div class="d-flex flex-column mb-6">
      <div class="d-flex align-center mb-4">
        <v-icon size="32" color="grey-darken-2" class="mr-3">mdi-account-group-outline</v-icon>
        <h1 class="text-h4 font-weight-bold">Gestion des Équipes</h1>
      </div>
      
      <!-- Barre de recherche et Filtres (Full width) -->
      <v-row class="mt-2" dense>
        <v-col cols="12" md="6">
          <v-text-field
            v-model="store.search"
            prepend-inner-icon="mdi-magnify"
            placeholder="Rechercher une équipe ou un capitaine..."
            variant="outlined"
            density="compact"
            hide-details
            rounded="lg"
            class="w-100"
          />
        </v-col>
        <v-col cols="12" sm="6" md="3">
          <v-select
            v-model="store.filterTranspondeur"
            :items="[
              { title: 'Tous les états', value: 'tous' },
              { title: 'Avec transpondeur', value: 'avec' },
              { title: 'Sans transpondeur', value: 'sans' }
            ]"
            item-title="title"
            item-value="value"
            label="Transpondeur"
            variant="outlined"
            density="compact"
            hide-details
            rounded="lg"
          ></v-select>
        </v-col>
        <v-col cols="12" sm="6" md="3">
          <v-select
            v-model="store.filterNbMembres"
            :items="[{ title: 'Tous', value: null }, ...store.availableNbMembres.map(n => ({ title: `${n} membres`, value: n }))]"
            item-title="title"
            item-value="value"
            label="Nombre de coureurs"
            variant="outlined"
            density="compact"
            hide-details
            rounded="lg"
          ></v-select>
        </v-col>
      </v-row>
    </div>

    <!-- Teams Grid -->
    <v-row>
      <v-col v-for="equipe in store.filteredEquipes" :key="equipe.id" cols="12" md="4" sm="6">
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
            Coureurs : {{ equipe.membres.length }} inscrits
          </div>

          <!-- Transponder Info -->
          <div class="transponder-info pa-2 rounded mb-3">
            <span class="text-body-2" v-if="equipe.transpondeur">
              <strong>Transpondeur actif :</strong> <v-chip size="x-small" color="blue" class="ml-1">{{ equipe.transpondeur }}</v-chip>
            </span>
            <span class="text-body-2 text-medium-emphasis" v-else>
              Aucun transpondeur assigné
            </span>
          </div>

          <!-- Action -->
          <div class="text-center">
            <v-btn 
              variant="text" 
              color="primary" 
              class="font-weight-medium text-none px-4"
              rounded="lg"
              @click="openDetails(equipe)"
            >
              Voir les détails
            </v-btn>
          </div>
        </v-card>
      </v-col>
      <v-col cols="12" v-if="!store.filteredEquipes.length">
        <div class="text-center py-10 text-medium-emphasis">
          <v-icon size="48" class="mb-4">mdi-clipboard-text-search-outline</v-icon>
          <p>Aucune équipe ne correspond à vos filtres.</p>
        </div>
      </v-col>
    </v-row>

    <!-- Modal Détails -->
    <EquipeDetailsModal v-model="isModalOpen" :equipe="selectedEquipe" />
  </v-container>
</template>

<script setup>
import { ref } from 'vue'
import { useEquipesStore } from '~/stores/equipes'
import EquipeDetailsModal from '~/components/equipes/EquipeDetailsModal.vue'

const store = useEquipesStore()

const isModalOpen = ref(false)
const selectedEquipe = ref(null)

const openDetails = (equipe) => {
  selectedEquipe.value = equipe
  isModalOpen.value = true
}

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

.transponder-info {
  background-color: #f8f9fc;
  border: 1px solid #eee;
}
</style>
