<template>
  <v-container fluid class="pa-6">
    <!-- Header -->
    <div class="d-flex justify-space-between align-center mb-6">
      <div class="d-flex align-center">
        <v-icon size="32" color="grey-darken-2" class="mr-3">mdi-account-outline</v-icon>
        <h1 class="text-h4 font-weight-bold">Liste des Participants (Coureurs)</h1>
      </div>
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
    </div>

    <!-- Participants List -->
    <v-card rounded="lg" elevation="0" class="border">
      <v-list lines="two" class="pa-0">
        <template v-for="(participant, index) in filteredParticipants" :key="participant.id">
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

                <v-btn variant="outlined" size="small" rounded="lg">
                  Voir l'historique
                </v-btn>
              </div>
            </template>
          </v-list-item>
          <v-divider v-if="index < filteredParticipants.length - 1" />
        </template>
      </v-list>
    </v-card>
  </v-container>
</template>

<script setup>
import { ref, computed } from 'vue'

const search = ref('')

const participants = ref([
  { id: 1, nom: 'Dupont', prenom: 'Marie', equipeLabel: 'Équipe 12 - Les Flèches', transpondeurActif: 'TR-002' },
  { id: 2, nom: 'Bernard', prenom: 'Thomas', equipeLabel: 'Équipe 12 - Les Flèches', transpondeurActif: null },
  { id: 3, nom: 'Martin', prenom: 'Sophie', equipeLabel: 'Team INSA (Eq. 04)', transpondeurActif: null },
  { id: 4, nom: 'Petit', prenom: 'Lucas', equipeLabel: 'Équipe 7 - Les Rapides', transpondeurActif: 'TR-045' },
  { id: 5, nom: 'Rousseau', prenom: 'Emma', equipeLabel: 'Équipe 15 - Sprint Masters', transpondeurActif: null },
])

const filteredParticipants = computed(() => {
  if (!search.value) return participants.value
  const s = search.value.toLowerCase()
  return participants.value.filter(p =>
    `${p.nom} ${p.prenom}`.toLowerCase().includes(s) ||
    p.equipeLabel.toLowerCase().includes(s)
  )
})
</script>

<style scoped>
.border {
  border: 1px solid #e8e8e8 !important;
}

.gap-4 {
  gap: 16px;
}
</style>
