<template>
  <v-container fluid class="pa-6">
    <!-- Header -->
    <div class="d-flex align-center mb-6">
      <v-icon size="32" color="grey-darken-2" class="mr-3">mdi-message-outline</v-icon>
      <h1 class="text-h4 font-weight-bold">Canal de Communication</h1>
    </div>

    <v-row>
      <!-- Left Panel: Ticket List -->
      <v-col cols="12" md="4">
        <v-card rounded="lg" elevation="0" class="border" height="calc(100vh - 200px)">
          <div class="pa-4">
            <!-- Filters -->
            <div class="mb-3">
              <v-icon size="16" class="mr-1">mdi-filter-outline</v-icon>
              <span class="text-body-2 font-weight-bold">Filtres</span>
            </div>
            <div class="d-flex flex-wrap gap-2 mb-4">
              <v-chip
                v-for="filter in filters"
                :key="filter.label"
                :color="activeFilter === filter.label ? 'blue' : undefined"
                :variant="activeFilter === filter.label ? 'flat' : 'outlined'"
                size="small"
                @click="activeFilter = filter.label"
              >
                {{ filter.label }} ({{ filter.count }})
              </v-chip>
            </div>

            <!-- Tickets -->
            <div class="text-subtitle-2 font-weight-bold mb-3">Tickets Actifs</div>
            <div class="tickets-list">
              <v-card
                v-for="ticket in filteredTickets"
                :key="ticket.id"
                :class="['ticket-card mb-2 pa-3', { 'ticket-active': selectedTicket?.id === ticket.id }]"
                flat
                rounded="lg"
                @click="selectedTicket = ticket"
              >
                <div class="d-flex align-center mb-1">
                  <v-icon
                    :color="ticket.priorite === 'urgent' ? 'red' : ticket.type === 'logistique' ? 'orange' : 'blue'"
                    size="10"
                    class="mr-2"
                  >mdi-circle</v-icon>
                  <span class="text-body-2 font-weight-bold">{{ ticket.titre }}</span>
                </div>
                <div class="ml-5">
                  <v-chip
                    :color="ticket.type === 'technique' ? 'red' : ticket.type === 'logistique' ? 'orange' : 'blue'"
                    variant="text"
                    size="x-small"
                    class="pa-0 font-weight-bold"
                  >
                    {{ capitalize(ticket.type) }}
                  </v-chip>
                </div>
                <div class="ml-5 d-flex align-center mt-1">
                  <v-avatar size="16" color="red-lighten-4" class="mr-1">
                    <v-icon size="10" color="red">mdi-account</v-icon>
                  </v-avatar>
                  <span class="text-caption text-medium-emphasis">{{ ticket.auteur }}</span>
                </div>
              </v-card>
            </div>
          </div>
        </v-card>
      </v-col>

      <!-- Right Panel: Chat -->
      <v-col cols="12" md="8">
        <v-card v-if="selectedTicket" rounded="lg" elevation="0" class="border d-flex flex-column" height="calc(100vh - 200px)">
          <!-- Chat Header -->
          <div class="pa-4 border-bottom">
            <h3 class="text-h6 font-weight-bold">{{ selectedTicket.titre }}</h3>
            <span class="text-caption text-medium-emphasis">{{ selectedTicket.auteur }} · {{ capitalize(selectedTicket.type) }}</span>
          </div>

          <!-- Messages -->
          <div class="flex-grow-1 pa-4 messages-container">
            <div
              v-for="msg in selectedTicket.messages"
              :key="msg.id"
              :class="['mb-4', { 'd-flex justify-end': msg.role === 'admin' }]"
            >
              <div :class="['message-bubble', msg.role === 'admin' ? 'admin-bubble' : 'user-bubble']">
                <div class="d-flex align-center mb-1" v-if="msg.role !== 'admin'">
                  <v-avatar size="28" color="grey-lighten-3" class="mr-2">
                    <v-icon size="16" color="grey">mdi-account</v-icon>
                  </v-avatar>
                  <span class="text-body-2 font-weight-bold">{{ msg.auteur }}</span>
                </div>
                <div class="d-flex align-center mb-1" v-else>
                  <span class="text-body-2 font-weight-bold">{{ msg.auteur }}</span>
                  <v-avatar size="28" color="blue-lighten-4" class="ml-2">
                    <v-icon size="16" color="blue">mdi-account</v-icon>
                  </v-avatar>
                </div>
                <p class="text-body-2 mb-1">{{ msg.contenu }}</p>
                <div :class="['text-caption text-medium-emphasis', msg.role === 'admin' ? 'text-right' : '']">
                  {{ msg.heure }}
                </div>
              </div>
            </div>
          </div>

          <!-- Quick Actions -->
          <div class="pa-3 border-top">
            <div class="text-caption font-weight-bold mb-2">Actions Rapides Admin</div>
            <div class="d-flex gap-2 mb-3">
              <v-btn color="green" variant="flat" size="small" rounded="lg" prepend-icon="mdi-check-circle-outline">
                Transpondeur Secours Envoyé
              </v-btn>
              <v-btn color="blue" variant="flat" size="small" rounded="lg" prepend-icon="mdi-check-circle-outline">
                Ticket Résolu
              </v-btn>
            </div>

            <!-- Message Input -->
            <div class="d-flex align-center gap-2">
              <v-text-field
                v-model="newMessage"
                placeholder="Tapez votre réponse..."
                variant="outlined"
                density="compact"
                hide-details
                rounded="lg"
                class="flex-grow-1"
              />
              <v-btn icon color="blue" variant="flat" size="small">
                <v-icon>mdi-send</v-icon>
              </v-btn>
            </div>
          </div>
        </v-card>

        <!-- No ticket selected -->
        <v-card v-else rounded="lg" elevation="0" class="border d-flex align-center justify-center" height="calc(100vh - 200px)">
          <div class="text-center text-medium-emphasis">
            <v-icon size="48" class="mb-2">mdi-message-text-outline</v-icon>
            <div class="text-body-1">Sélectionnez un ticket pour voir la conversation</div>
          </div>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { ref, computed } from 'vue'

const newMessage = ref('')
const activeFilter = ref('Tous')

const filters = [
  { label: 'Tous', count: 4 },
  { label: 'Urgents', count: 2 },
  { label: 'Techniques', count: 1 },
  { label: 'Logistiques', count: 2 },
  { label: 'Résolus', count: 0 },
]

const tickets = ref([
  {
    id: 1,
    titre: 'Urgence : TR-003 Perdu',
    type: 'technique',
    priorite: 'urgent',
    statut: 'ouvert',
    auteur: 'Bénévole Stand B',
    messages: [
      { id: 1, contenu: 'On a perdu le TR-003 pendant le relais, on fait quoi ?', auteur: 'Bénévole Stand B', role: 'benevole', heure: '15:30' },
      { id: 2, contenu: 'Je désactive le TR-003 dans le système. Donnez-leur le TR-090 de secours.', auteur: 'Admin', role: 'admin', heure: '15:32' },
    ],
  },
  {
    id: 2,
    titre: "Besoin d'aide attribution",
    type: 'logistique',
    priorite: 'normal',
    statut: 'ouvert',
    auteur: 'Bénévole Accueil',
    messages: [
      { id: 3, contenu: "J'ai besoin d'aide pour attribuer un transpondeur à l'équipe 15.", auteur: 'Bénévole Accueil', role: 'benevole', heure: '14:45' },
    ],
  },
  {
    id: 3,
    titre: 'Question sur le planning',
    type: 'logistique',
    priorite: 'normal',
    statut: 'ouvert',
    auteur: 'Bénévole Stand C',
    messages: [
      { id: 4, contenu: 'Quand est-ce que je dois récupérer les transpondeurs de la zone C ?', auteur: 'Bénévole Stand C', role: 'benevole', heure: '13:20' },
    ],
  },
])

const selectedTicket = ref(tickets.value[0])

const filteredTickets = computed(() => {
  if (activeFilter.value === 'Tous') return tickets.value
  if (activeFilter.value === 'Urgents') return tickets.value.filter(t => t.priorite === 'urgent')
  if (activeFilter.value === 'Techniques') return tickets.value.filter(t => t.type === 'technique')
  if (activeFilter.value === 'Logistiques') return tickets.value.filter(t => t.type === 'logistique')
  if (activeFilter.value === 'Résolus') return tickets.value.filter(t => t.statut === 'resolu')
  return tickets.value
})

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1)
}
</script>

<style scoped>
.border {
  border: 1px solid #e8e8e8 !important;
}

.border-bottom {
  border-bottom: 1px solid #e8e8e8 !important;
}

.border-top {
  border-top: 1px solid #e8e8e8 !important;
}

.gap-2 {
  gap: 8px;
}

.tickets-list {
  max-height: calc(100vh - 380px);
  overflow-y: auto;
}

.ticket-card {
  cursor: pointer;
  border: 1px solid #eee;
  transition: all 0.2s;
}

.ticket-card:hover {
  background-color: #f8f9fc;
}

.ticket-active {
  border-color: #1976d2 !important;
  background-color: #e8f0fe !important;
}

.messages-container {
  overflow-y: auto;
}

.message-bubble {
  max-width: 70%;
  padding: 12px 16px;
  border-radius: 12px;
}

.user-bubble {
  background-color: #f0f0f0;
}

.admin-bubble {
  background-color: #1a1f36;
  color: white;
}

.admin-bubble .text-medium-emphasis {
  color: rgba(255, 255, 255, 0.6) !important;
}
</style>
