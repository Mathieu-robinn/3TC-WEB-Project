<template>
  <v-dialog :model-value="modelValue" @update:model-value="$emit('update:modelValue', $event)" max-width="600">
    <v-card rounded="lg">
      <v-card-title class="d-flex justify-space-between align-center px-4 pt-4">
        <span class="text-h6 font-weight-bold">Historique de {{ participant?.prenom }} {{ participant?.nom }}</span>
        <v-btn icon="mdi-close" variant="text" @click="$emit('update:modelValue', false)" />
      </v-card-title>
      <v-divider />
      <v-card-text class="pa-4">
        <v-timeline density="compact" align="start">
          <v-timeline-item
            v-for="(event, i) in participant?.historique || []"
            :key="i"
            dot-color="primary"
            size="small"
          >
            <div class="mb-1">
              <strong>{{ event.date }}</strong>
            </div>
            <div>{{ event.event }}</div>
          </v-timeline-item>
        </v-timeline>
        <div v-if="!participant?.historique?.length" class="text-center text-medium-emphasis py-4">
          Aucun historique disponible pour ce participant.
        </div>
      </v-card-text>
      <v-card-actions class="px-4 pb-4">
        <v-spacer />
        <v-btn color="primary" variant="flat" rounded="lg" @click="$emit('update:modelValue', false)">Fermer</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
const props = defineProps({
  modelValue: Boolean,
  participant: Object
})

const emit = defineEmits(['update:modelValue'])
</script>
