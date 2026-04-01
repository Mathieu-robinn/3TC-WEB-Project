/** Normalise une chaîne pour recherche insensible aux accents. */
export function removeAccents(str: string | null | undefined): string {
  if (!str) return ''
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}
