import type { TransponderStatusApi, TransponderTransaction } from '~/types/api'
import { transponderDisplay } from '~/utils/transponder'

/** Libellé et couleur de pastille Vuetify pour un statut de transaction. */
export function transactionTypeMeta(type: TransponderStatusApi) {
  const map: Record<TransponderStatusApi, { label: string; color: string }> = {
    EN_ATTENTE: { label: 'En attente', color: 'grey' },
    ATTRIBUE: { label: 'Attribué', color: 'primary' },
    PERDU: { label: 'Perdu', color: 'error' },
    RECUPERE: { label: 'Récupéré', color: 'success' },
    DEFAILLANT: { label: 'Défaillant', color: 'deep-orange' },
  }
  return map[type] ?? { label: String(type), color: 'grey' }
}

export function formatTransactionDate(iso: string | undefined) {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })
}

export function transponderLabelFromTransaction(evt: TransponderTransaction) {
  return transponderDisplay(evt.transponder) ?? `#${evt.transponderId}`
}

export function actorLabelFromTransaction(evt: TransponderTransaction): string | null {
  const user = evt.user
  if (!user) return null
  const name = `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim()
  if (name) return name
  if (user.email) return user.email
  return `Utilisateur #${user.id ?? evt.userId}`
}
