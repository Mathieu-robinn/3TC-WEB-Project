<template>
  <v-alert
    :type="result.errors.length ? 'warning' : 'success'"
    variant="tonal"
    density="compact"
    rounded="lg"
    class="mb-3"
  >
    <template v-if="result.dryRun">Analyse (simulation) — </template>
    <template v-else>Import terminé — </template>
    {{ result.created.courses }} course(s),
    {{ result.created.teams }} équipe(s),
    {{ result.created.runners }} participant(s) créé(s) ;
    {{ result.skipped }} ignoré(s) ;
    {{ result.errors.length }} erreur(s).
  </v-alert>

  <v-expansion-panels v-if="result.errors.length || result.warnings.length" variant="accordion" class="mb-2">
    <v-expansion-panel v-if="result.errors.length" title="Erreurs par ligne">
      <v-expansion-panel-text>
        <ul class="text-body-2 pl-4">
          <li v-for="e in result.errors" :key="`e-${e.line}`">Ligne {{ e.line }} : {{ e.message }}</li>
        </ul>
      </v-expansion-panel-text>
    </v-expansion-panel>
    <v-expansion-panel v-if="result.warnings.length" title="Avertissements">
      <v-expansion-panel-text>
        <ul class="text-body-2 pl-4">
          <li v-for="w in result.warnings" :key="`w-${w.line}`">Ligne {{ w.line }} : {{ w.message }}</li>
        </ul>
      </v-expansion-panel-text>
    </v-expansion-panel>
  </v-expansion-panels>
</template>

<script setup lang="ts">
import type { ImportParticipantsResult } from '~/types/api'

defineProps<{
  result: ImportParticipantsResult
}>()
</script>
