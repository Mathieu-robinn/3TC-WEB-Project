import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useEquipesStore = defineStore('equipes', () => {
  const search = ref('')
  const filterTranspondeur = ref('tous')
  const filterNbMembres = ref(null)

  const removeAccents = (str) => {
    return str ? str.normalize("NFD").replace(/[\u0300-\u036f]/g, "") : ""
  }

  const equipes = ref([
    { 
      id: 1, 
      numero: 12, 
      nom: 'Les Flèches', 
      statut: 'en_piste', 
      capitaine: 'Thomas Bernard', 
      transpondeur: 'TR-002',
      membres: ['Thomas Bernard', 'Marie Dupont', 'Jean Bon', 'Anne So'],
      historiqueTranspondeurs: [
        { date: '2023-10-24 10:00', transpondeur: 'TR-002', event: 'Assigné à Thomas Bernard' },
        { date: '2023-10-24 14:00', transpondeur: 'TR-002', event: 'Tour complété par Marie Dupont (12:04)' }
      ]
    },
    { id: 2, numero: 4, nom: 'Team INSA', statut: 'sans_transpondeur', capitaine: 'Sophie Martin', transpondeur: null, membres: ['Sophie Martin', 'Lucie Fer'], historiqueTranspondeurs: [{ date: '2023-10-24 09:30', transpondeur: 'TR-015', event: 'Rendu' }] },
    { id: 3, numero: 7, nom: 'Les Rapides', statut: 'en_attente', capitaine: 'Lucas Petit', transpondeur: 'TR-045', membres: ['Lucas Petit', 'Hugo Boss', 'Marc Polo'], historiqueTranspondeurs: [] },
    { id: 4, numero: 15, nom: 'Sprint Masters', statut: 'en_piste', capitaine: 'Emma Rousseau', transpondeur: 'TR-023', membres: ['Emma Rousseau', 'Chloe Fraise'], historiqueTranspondeurs: [] },
    { id: 5, numero: 9, nom: 'Les Coureurs', statut: 'en_attente', capitaine: 'Hugo Dubois', transpondeur: null, membres: ['Hugo Dubois', 'Pierre Caillou', 'Paul Hice'], historiqueTranspondeurs: [] },
    { id: 6, numero: 21, nom: 'Team Endurance', statut: 'en_piste', capitaine: 'Claire Moreau', transpondeur: 'TR-067', membres: ['Claire Moreau', 'Julie Ette', 'Romain Romain', 'Fred Test'], historiqueTranspondeurs: [] },
  ])

  const filteredEquipes = computed(() => {
    return equipes.value.filter(e => {
      // Filtre texte
      const s = removeAccents(search.value.toLowerCase())
      const matchSearch = !search.value || 
        removeAccents(e.nom.toLowerCase()).includes(s) ||
        removeAccents(e.capitaine.toLowerCase()).includes(s) ||
        String(e.numero).includes(s)

      // Filtre transpondeur
      let matchTranspondeur = true
      if (filterTranspondeur.value === 'avec') matchTranspondeur = !!e.transpondeur
      if (filterTranspondeur.value === 'sans') matchTranspondeur = !e.transpondeur

      // Filtre nb membres
      let matchNbMembres = true
      if (filterNbMembres.value) {
        matchNbMembres = e.membres.length === parseInt(filterNbMembres.value)
      }

      return matchSearch && matchTranspondeur && matchNbMembres
    })
  })

  // Permet à la page de récupérer la taille des équipes uniques pour le filtre des membres
  const availableNbMembres = computed(() => {
    const counts = equipes.value.map(e => e.membres.length)
    return [...new Set(counts)].sort((a, b) => a - b)
  })

  return {
    search,
    filterTranspondeur,
    filterNbMembres,
    equipes,
    filteredEquipes,
    availableNbMembres
  }
})
