<template>
  <v-container fluid class="pa-6">
    <div class="d-flex align-center mb-6">
      <v-icon size="32" color="grey-darken-2" class="mr-3">mdi-cog-outline</v-icon>
      <h1 class="text-h4 font-weight-bold">Paramètres</h1>
    </div>

    <v-row>
      <v-col cols="12" md="6">
        <v-card rounded="lg" elevation="0" class="border pa-4">
          <div class="text-subtitle-1 font-weight-bold mb-3">Configuration Générale</div>
          <v-text-field label="Nom de l'événement" variant="outlined" model-value="24h INSA" density="compact" class="mb-2" />
          <v-text-field label="Durée de la course (heures)" variant="outlined" model-value="24" density="compact" class="mb-2" />
          <v-text-field label="Stock initial transpondeurs" variant="outlined" model-value="150" density="compact" class="mb-2" />
          <v-btn color="blue" variant="flat" rounded="lg">Sauvegarder</v-btn>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<style scoped>
.border {
  border: 1px solid #e8e8e8 !important;
}
</style>
