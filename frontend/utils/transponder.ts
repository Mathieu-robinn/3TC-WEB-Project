/** Affichage principal : numéro métier ; sinon référence legacy ; sinon id. */
export function transponderDisplay(
  t: { id?: number; numero?: number; reference?: string } | null | undefined,
): string | null {
  if (!t) return null
  if (t.numero != null) return String(t.numero)
  if (t.reference) return t.reference
  if (t.id != null) return `#${t.id}`
  return null
}

/** Libellé utilisateur (listes, puces) : jamais l’id technique. */
export function transponderNumeroLabel(
  t: { id?: number; numero?: number | null; reference?: string | null } | null | undefined,
): string {
  if (!t) return '—'
  if (t.numero != null) return `Numéro ${t.numero}`
  if (t.reference) return `Numéro ${t.reference}`
  return '—'
}
