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
