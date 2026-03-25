/** Prisma n’a pas de `reference` sur Transponder : affichage par id de secours. */
export function transponderDisplay(t: { id?: number; reference?: string } | null | undefined): string | null {
  if (!t) return null
  if (t.reference) return t.reference
  if (t.id != null) return `#${t.id}`
  return null
}
