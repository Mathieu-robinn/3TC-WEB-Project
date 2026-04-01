/** Parse une saisie du type « 1-10, 15, 17-20 » en liste de numéros uniques triés. */

export type ParseTransponderRangesResult =
  | { ok: true; numeros: number[] }
  | { ok: false; error: string }

export function parseTransponderNumberRanges(input: string): ParseTransponderRangesResult {
  const trimmed = input.trim()
  if (!trimmed) {
    return { ok: false, error: 'Saisissez au moins un numéro ou une plage.' }
  }

  const parts = trimmed.split(/[,;\n]+/).map((p) => p.trim()).filter(Boolean)
  const seen = new Set<number>()
  const out: number[] = []

  for (const part of parts) {
    const rangeMatch = part.match(/^(\d+)\s*-\s*(\d+)$/)
    if (rangeMatch) {
      const start = Number(rangeMatch[1])
      const end = Number(rangeMatch[2])
      if (!Number.isInteger(start) || !Number.isInteger(end) || start < 1 || end < 1) {
        return { ok: false, error: `Plage invalide : « ${part} ».` }
      }
      if (start > end) {
        return { ok: false, error: `Plage invalide (début > fin) : « ${part} ».` }
      }
      for (let n = start; n <= end; n++) {
        if (seen.has(n)) {
          return { ok: false, error: `Le numéro ${n} apparaît plusieurs fois.` }
        }
        seen.add(n)
        out.push(n)
      }
      continue
    }

    const single = part.match(/^\d+$/)
    if (!single) {
      return { ok: false, error: `Segment non reconnu : « ${part} ».` }
    }
    const n = Number(part)
    if (n < 1) {
      return { ok: false, error: `Numéro invalide : ${n}.` }
    }
    if (seen.has(n)) {
      return { ok: false, error: `Le numéro ${n} apparaît plusieurs fois.` }
    }
    seen.add(n)
    out.push(n)
  }

  out.sort((a, b) => a - b)
  return { ok: true, numeros: out }
}
