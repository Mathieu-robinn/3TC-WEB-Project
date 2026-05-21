<template>
  <div class="d-flex fill-height flex-column align-center justify-center text-medium-emphasis px-4">
    <v-icon icon="mdi-forum-outline" size="80" class="mb-6 opacity-20 color-primary" />
    <h2 class="text-h5 font-weight-light mb-2 text-center">Messagerie</h2>
    <p class="text-body-2 text-center">Sélectionnez une conversation pour commencer à discuter.</p>
    <v-btn
      v-if="showBack"
      class="mt-6"
      variant="tonal"
      prepend-icon="mdi-arrow-left"
      @click="emit('back')"
    >
      Retour aux conversations
    </v-btn>
  </div>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    showBack?: boolean
  }>(),
  { showBack: false },
)

const emit = defineEmits<{
  (e: 'back'): void
}>()
</script>
