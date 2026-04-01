import { computed } from 'vue'
import { useJwtAuth } from '~/composables/useJwtAuth'

/**
 * Capacités UI alignées sur les décorateurs @Roles du backend (Nest).
 * Pour des droits plus fins qu’ADMIN / BENEVOLE, il faudrait d’abord étendre le modèle côté API.
 */
export function usePermissions() {
  const { isAdmin, isSuperAdmin, roleFromToken } = useJwtAuth()

  /** POST/PUT/DELETE /team — réservé aux admins. */
  const canManageTeams = computed(() => isAdmin.value)

  /** POST/PUT/DELETE /runner — réservé aux admins. */
  const canManageRunners = computed(() => isAdmin.value)

  /**
   * Assignation, récupération (transpondeur attribué), déclarer perdu / défaillant — admin et bénévole.
   * Ne couvre pas la création de puce ni la remise en stock (EN_ATTENTE).
   */
  const canOperateTransponders = computed(() => {
    const r = roleFromToken.value
    return r === 'ADMIN' || r === 'BENEVOLE'
  })

  /** POST /transponder — admin uniquement. */
  const canCreateTransponder = computed(() => isAdmin.value)

  /** Remise en stock (statut EN_ATTENTE, ex. depuis PERDU ou DEFAILLANT) — admin uniquement. */
  const canRestockTransponder = computed(() => isAdmin.value)

  return {
    isAdmin,
    isSuperAdmin,
    canManageTeams,
    canManageRunners,
    canOperateTransponders,
    canCreateTransponder,
    canRestockTransponder,
  }
}
