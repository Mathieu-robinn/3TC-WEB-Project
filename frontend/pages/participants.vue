<template>
  <v-container fluid class="pa-6">
    <!-- Header -->
    <div class="d-flex flex-column mb-6">
      <div class="d-flex align-center mb-4">
        <v-icon size="32" color="grey-darken-2" class="mr-3">mdi-account-outline</v-icon>
        <h1 class="text-h4 font-weight-bold">Liste des Participants (Coureurs)</h1>
      </div>
      
      <!-- Barre de recherche (Full width) -->
      <v-text-field
        v-model="store.search"
        prepend-inner-icon="mdi-magnify"
        placeholder="Rechercher un participant par nom, prénom ou équipe..."
        variant="outlined"
        density="compact"
        hide-details
        rounded="lg"
        class="w-100"
      />
    </div>

    <!-- Participants List -->
    <v-card rounded="lg" elevation="0" class="border">
      <v-list lines="two" class="pa-0">
        <template v-for="(participant, index) in store.filteredParticipants" :key="participant.id">
          <v-list-item class="py-4 px-4">
            <template #prepend>
              <v-avatar color="grey-lighten-3" size="48">
                <v-icon color="grey" size="28">mdi-account-outline</v-icon>
              </v-avatar>
            </template>

            <v-list-item-title class="font-weight-bold text-body-1">
              {{ participant.nom }}, {{ participant.prenom }}
            </v-list-item-title>
            <v-list-item-subtitle class="text-primary text-caption">
              {{ participant.equipeLabel }}
            </v-list-item-subtitle>

            <template #append>
              <div class="d-flex align-center gap-4">
                <v-chip
                  v-if="participant.transpondeurActif"
                  color="blue"
                  variant="outlined"
                  size="small"
                >
                  Court actuellement avec {{ participant.transpondeurActif }}
                </v-chip>
                <span v-else class="text-body-2 text-medium-emphasis">Au repos</span>

                <v-btn variant="outlined" size="small" rounded="lg" @click="openHistory(participant)">
                  Voir l'historique
                </v-btn>
              </div>
            </template>
          </v-list-item>
          <v-divider v-if="index < store.filteredParticipants.length - 1" />
        </template>
      </v-list>
    </v-card>

    <ParticipantHistoryModal v-model="isModalOpen" :participant="selectedParticipant" />
  </v-container>
</template>

<script setup>
import { ref } from 'vue'
import { useParticipantsStore } from '~/stores/participants'
import ParticipantHistoryModal from '~/components/participants/ParticipantHistoryModal.vue'

const store = useParticipantsStore()

const isModalOpen = ref(false)
const selectedParticipant = ref(null)

const openHistory = (participant) => {
  selectedParticipant.value = participant
  isModalOpen.value = true
}
</script>

<style scoped>
.border {
  border: 1px solid #e8e8e8 !important;
}

.gap-4 {
  gap: 16px;
}
</style>
