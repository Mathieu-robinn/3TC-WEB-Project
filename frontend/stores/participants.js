import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useParticipantsStore = defineStore('participants', () => {
  const search = ref('')
  
  const participants = ref([
    { 
      id: 1, 
      nom: 'Dupont', 
      prenom: 'Marie', 
      equipeLabel: 'Équipe 12 - Les Flèches', 
      transpondeurActif: 'TR-002',
      historique: [
        { date: '2023-10-24 10:00', event: 'Transpondeur TR-002 assigné' },
        { date: '2023-10-24 14:00', event: 'Tour complété (12:04)' }
      ]
    },
    { id: 2, nom: 'Bernard', prenom: 'Thomas', equipeLabel: 'Équipe 12 - Les Flèches', transpondeurActif: null, historique: [] },
    { id: 3, nom: 'Martin', prenom: 'Sophie', equipeLabel: 'Team INSA (Eq. 04)', transpondeurActif: null, historique: [{ date: '2023-10-24 09:30', event: 'Transpondeur TR-015 rendu' }] },
    { id: 4, nom: 'Petit', prenom: 'Lucas', equipeLabel: 'Équipe 7 - Les Rapides', transpondeurActif: 'TR-045', historique: [] },
    { id: 5, nom: 'Rousseau', prenom: 'Emma', equipeLabel: 'Équipe 15 - Sprint Masters', transpondeurActif: null, historique: [] },
  ])

  const removeAccents = (str) => {
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
  }

  const filteredParticipants = computed(() => {
    if (!search.value) return participants.value
    const s = removeAccents(search.value.toLowerCase())
    return participants.value.filter(p =>
      removeAccents(`${p.nom} ${p.prenom}`.toLowerCase()).includes(s) ||
      removeAccents(p.equipeLabel.toLowerCase()).includes(s)
    )
  })

  return {
    search,
    participants,
    filteredParticipants
  }
})
