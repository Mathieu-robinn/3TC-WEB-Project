<template>
  <v-container fluid class="pa-6">
    <!-- Page Title -->
    <div class="d-flex align-center mb-6">
      <v-icon size="32" color="grey-darken-2" class="mr-3">mdi-cog-outline</v-icon>
      <h1 class="text-h4 font-weight-bold">Dashboard Admin</h1>
    </div>

    <!-- Top Stats Row -->
    <v-row class="mb-4">
      <!-- Total Transpondeurs -->
      <v-col cols="12" md="3">
        <v-card rounded="lg" elevation="0" class="stat-card pa-4" height="100%">
          <div class="text-subtitle-1 font-weight-bold mb-4">Total Transpondeurs</div>
          <div class="d-flex justify-space-between align-center mb-2">
            <span class="text-body-2 text-medium-emphasis">Stock Total</span>
            <span class="text-h5 font-weight-bold">150</span>
          </div>
          <div class="d-flex justify-space-between align-center mb-2">
            <span class="text-body-2 text-medium-emphasis">Assignés (Course)</span>
            <span class="text-h5 font-weight-bold">122</span>
          </div>
          <div class="d-flex justify-space-between align-center mb-4">
            <span class="text-body-2 text-medium-emphasis">En Stock (Dispo)</span>
            <span class="text-h5 font-weight-bold">28</span>
          </div>
          <div class="text-caption text-success d-flex align-center">
            <v-icon size="14" color="success" class="mr-1">mdi-trending-up</v-icon>
            +12 dernière heure
          </div>
        </v-card>
      </v-col>

      <!-- Mouvements en Temps Réel -->
      <v-col cols="12" md="3">
        <v-card rounded="lg" elevation="0" class="stat-card pa-4" height="100%">
          <div class="text-subtitle-1 font-weight-bold mb-4">Mouvements en Temps Réel</div>
          <div class="d-flex justify-space-between align-center mb-2">
            <span class="text-body-2 text-medium-emphasis">Donnés</span>
            <span class="text-h5 font-weight-bold text-primary">125</span>
          </div>
          <div class="d-flex justify-space-between align-center mb-2">
            <span class="text-body-2 text-medium-emphasis">Récupérés</span>
            <span class="text-h5 font-weight-bold text-primary">119</span>
          </div>
          <div class="d-flex justify-space-between align-center">
            <span class="text-body-2 text-medium-emphasis">
              Perdus
              <v-icon size="14" color="red" class="ml-1">mdi-alert-circle-outline</v-icon>
            </span>
            <span class="text-h5 font-weight-bold text-red">2</span>
          </div>
        </v-card>
      </v-col>

      <!-- Fin de la course -->
      <v-col cols="12" md="3">
        <v-card rounded="lg" elevation="0" class="stat-card pa-4" height="100%">
          <div class="d-flex justify-space-between align-center mb-4">
            <span class="text-subtitle-1 font-weight-bold">Fin de la course</span>
            <v-icon size="20" color="grey">mdi-flag-outline</v-icon>
          </div>
          <div class="d-flex justify-center align-center countdown-container">
            <div class="countdown-box">
              <div class="countdown-number">{{ countdown.hours }}</div>
              <div class="countdown-label">Heures</div>
            </div>
            <div class="countdown-separator">:</div>
            <div class="countdown-box">
              <div class="countdown-number">{{ countdown.minutes }}</div>
              <div class="countdown-label">Min</div>
            </div>
            <div class="countdown-separator">:</div>
            <div class="countdown-box">
              <div class="countdown-number">{{ countdown.seconds }}</div>
              <div class="countdown-label">Sec</div>
            </div>
          </div>
        </v-card>
      </v-col>

      <!-- Derniers Tickets Critiques -->
      <v-col cols="12" md="3">
        <v-card rounded="lg" elevation="0" class="stat-card pa-4" height="100%">
          <div class="text-subtitle-1 font-weight-bold mb-3">Derniers Tickets Critiques</div>
          <div class="ticket-item mb-3">
            <div class="d-flex align-center">
              <v-avatar size="32" color="red-lighten-4" class="mr-2">
                <v-icon size="16" color="red">mdi-account</v-icon>
              </v-avatar>
              <div>
                <div class="text-caption">
                  <v-chip size="x-small" color="red" variant="text" class="pa-0 font-weight-bold">[Urgent]</v-chip>
                  <v-chip size="x-small" color="blue" variant="text" class="pa-0 font-weight-bold">[Technique]</v-chip>
                </div>
                <div class="text-caption">TR-003 perdu relais</div>
                <div class="text-caption text-medium-emphasis">Bénévole Stand B</div>
              </div>
            </div>
          </div>
          <div class="ticket-item">
            <div class="d-flex align-center">
              <v-avatar size="32" color="orange-lighten-4" class="mr-2">
                <v-icon size="16" color="orange">mdi-account</v-icon>
              </v-avatar>
              <div>
                <div class="text-caption font-weight-bold text-orange">[À traiter]</div>
                <div class="text-caption">Aide attribution</div>
                <div class="text-caption text-medium-emphasis">Bénévole Accueil</div>
              </div>
            </div>
          </div>
        </v-card>
      </v-col>
    </v-row>

    <!-- Bottom Action Row -->
    <v-row>
      <!-- Transpondeurs à récupérer -->
      <v-col cols="12" md="4">
        <v-card rounded="lg" elevation="0" class="action-card pa-5">
          <div class="d-flex justify-space-between align-center mb-4">
            <span class="text-subtitle-1 font-weight-bold">Transpondeurs à récupérer</span>
            <v-chip color="blue" size="small" variant="flat">6</v-chip>
          </div>
          <v-btn color="blue" variant="flat" block rounded="lg" size="large">
            Gérer Récupérations
          </v-btn>
        </v-card>
      </v-col>

      <!-- Alertes Bénévoles récentes -->
      <v-col cols="12" md="4">
        <v-card rounded="lg" elevation="0" class="action-card pa-5">
          <div class="d-flex justify-space-between align-center mb-4">
            <span class="text-subtitle-1 font-weight-bold">Alertes Bénévoles récentes</span>
            <v-chip color="blue" size="small" variant="flat">3</v-chip>
          </div>
          <v-btn color="blue" variant="flat" block rounded="lg" size="large">
            Accéder au Canal Com
          </v-btn>
        </v-card>
      </v-col>

      <!-- Équipes sans transpondeur -->
      <v-col cols="12" md="4">
        <v-card rounded="lg" elevation="0" class="action-card pa-5">
          <div class="d-flex justify-space-between align-center mb-4">
            <span class="text-subtitle-1 font-weight-bold">Équipes sans transpondeur</span>
            <v-chip color="red" size="small" variant="flat">3</v-chip>
          </div>
          <v-btn color="red" variant="flat" block rounded="lg" size="large" class="text-uppercase font-weight-bold">
            Attribuer d'urgence
          </v-btn>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const countdown = ref({
  hours: '24',
  minutes: '35',
  seconds: '41'
})

let interval = null

onMounted(() => {
  // Set end time to 24h35m41s from now
  const endTime = new Date()
  endTime.setHours(endTime.getHours() + 24)
  endTime.setMinutes(endTime.getMinutes() + 35)
  endTime.setSeconds(endTime.getSeconds() + 41)

  interval = setInterval(() => {
    const now = new Date()
    const diff = endTime - now
    if (diff <= 0) {
      countdown.value = { hours: '00', minutes: '00', seconds: '00' }
      clearInterval(interval)
      return
    }
    const h = Math.floor(diff / 3600000)
    const m = Math.floor((diff % 3600000) / 60000)
    const s = Math.floor((diff % 60000) / 1000)
    countdown.value = {
      hours: String(h).padStart(2, '0'),
      minutes: String(m).padStart(2, '0'),
      seconds: String(s).padStart(2, '0')
    }
  }, 1000)
})

onUnmounted(() => {
  if (interval) clearInterval(interval)
})
</script>

<style scoped>
.stat-card {
  border: 1px solid #e8e8e8;
  background: white;
}

.action-card {
  border: 1px solid #e8e8e8;
  background: white;
}

.countdown-container {
  gap: 8px;
  padding: 12px 0;
}

.countdown-box {
  text-align: center;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  padding: 8px 12px;
  min-width: 60px;
}

.countdown-number {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1a1f36;
}

.countdown-label {
  font-size: 0.7rem;
  color: #999;
  text-transform: uppercase;
}

.countdown-separator {
  font-size: 1.5rem;
  font-weight: 700;
  color: #ccc;
  align-self: flex-start;
  padding-top: 8px;
}

.ticket-item {
  padding: 4px 0;
}
</style>
