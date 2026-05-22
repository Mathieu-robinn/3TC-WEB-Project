/** Normalise un libellé pour comparaison (trim, minuscules, sans accents). */
export function normalizeLabel(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "");
}
