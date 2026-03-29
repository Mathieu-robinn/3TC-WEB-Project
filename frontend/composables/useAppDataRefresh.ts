import { useEquipesStore } from '~/features/equipes/stores/equipes'
import { useParticipantsStore } from '~/features/participants/stores/participants'
import { useTranspondersStore } from '~/features/transpondeurs/stores/transpondeurs'

/** Recharge les données métier après changement d’édition active. */
export async function refreshAppData() {
  const equipes = useEquipesStore()
  const participants = useParticipantsStore()
  const transponders = useTranspondersStore()

  equipes.resetFilters()
  participants.resetFilters()

  await Promise.all([
    equipes.fetchEquipes(),
    participants.fetchAll(),
    transponders.fetchAll(),
    transponders.fetchTransactions(),
    transponders.fetchUnassignedTeams(),
  ])
}
