<template>
  <v-dialog :model-value="modelValue" @update:model-value="$emit('update:modelValue', $event)" max-width="700">
    <v-card rounded="lg">
      <v-card-title class="d-flex justify-space-between align-center px-4 pt-4">
        <span class="text-h6 font-weight-bold">Détails de l'équipe {{ equipe?.numero }} - {{ equipe?.nom }}</span>
        <v-btn icon="mdi-close" variant="text" @click="$emit('update:modelValue', false)" />
      </v-card-title>
      <v-divider />
      
      <v-card-text class="pa-4">
        <v-row>
          <!-- Membres -->
          <v-col cols="12" md="6">
            <h3 class="text-subtitle-1 font-weight-bold mb-3 d-flex align-center">
              <v-icon size="small" class="mr-2">mdi-account-multiple</v-icon>
              Membres de l'équipe ({{ equipe?.membres?.length || 0 }})
            </h3>
            <v-list density="compact" class="bg-grey-lighten-4 rounded">
              <v-list-item v-for="(membre, index) in equipe?.membres || []" :key="index">
                <template #prepend>
                  <v-icon size="small" color="grey-darken-1">mdi-account</v-icon>
                </template>
                <v-list-item-title>{{ membre }} <v-chip size="x-small" color="primary" v-if="membre === equipe?.capitaine" class="ml-2">Capitaine</v-chip></v-list-item-title>
              </v-list-item>
              <div v-if="!equipe?.membres?.length" class="text-body-2 text-medium-emphasis py-2 px-4">
                Aucun membre
              </div>
            </v-list>
          </v-col>

          <!-- Historique -->
          <v-col cols="12" md="6">
            <h3 class="text-subtitle-1 font-weight-bold mb-3 d-flex align-center">
              <v-icon size="small" class="mr-2">mdi-history</v-icon>
              Historique Transpondeur
            </h3>
            
            <div class="mb-4">
              <strong class="text-body-2">Statut Actuel :</strong>
              <v-chip size="small" :color="equipe?.transpondeur ? 'blue' : 'grey'" class="ml-2" variant="flat">
                {{ equipe?.transpondeur || 'Aucun actif' }}
              </v-chip>
            </div>

            <v-timeline density="compact" align="start">
              <v-timeline-item
                v-for="(event, i) in equipe?.historiqueTranspondeurs || []"
                :key="i"
                dot-color="primary"
                size="small"
              >
                <div class="mb-1 d-flex justify-space-between align-center">
                  <strong>{{ event.date }}</strong>
                  <v-chip size="x-small" variant="outlined">{{ event.transpondeur }}</v-chip>
                </div>
                <div class="text-body-2 mt-1">{{ event.event }}</div>
              </v-timeline-item>
            </v-timeline>
            
            <div v-if="!equipe?.historiqueTranspondeurs?.length" class="text-center text-medium-emphasis py-4 bg-grey-lighten-4 rounded text-body-2 mt-4">
              Aucun historique disponible.
            </div>
          </v-col>
        </v-row>
      </v-card-text>
      
      <v-card-actions class="px-4 pb-4 bg-grey-lighten-5">
        <v-spacer />
        <v-btn color="primary" variant="flat" rounded="lg" @click="$emit('update:modelValue', false)">Fermer</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
const props = defineProps({
  modelValue: Boolean,
  equipe: Object
})

const emit = defineEmits(['update:modelValue'])
</script>
