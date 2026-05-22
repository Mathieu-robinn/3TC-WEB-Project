import type { CourseCategoryApi } from '~/types/api'

const CSV_SEP_PRIMARY = ';'

export type ImportCanonicalField =
  | 'course'
  | 'category'
  | 'team'
  | 'lastName'
  | 'firstName'
  | 'email'
  | 'phone'
  | 'captain'

export type ImportColumnMap = Partial<Record<ImportCanonicalField, number>>

export type ImportRow = {
  lineNumber: number
  courseName: string
  category: CourseCategoryApi
  teamName: string
  lastName: string
  firstName: string
  email?: string
  phone?: string
  isCaptain?: boolean
}

export const IMPORT_HEADER_ALIASES: Record<ImportCanonicalField, readonly string[]> = {
  course: ['course', 'parcours', 'epreuve', 'épreuve', 'discipline'],
  category: ['catégorie', 'categorie', 'category', 'type'],
  team: ['équipe', 'equipe', 'team'],
  lastName: ['nom', 'lastname', 'nom de famille'],
  firstName: ['prénom', 'prenom', 'firstname'],
  email: ['mail', 'email', 'e-mail', 'courriel'],
  phone: ['tel', 'téléphone', 'telephone', 'phone', 'mobile'],
  captain: ['capitaine', 'captain', "chef d'équipe", 'chef d equipe'],
}

const REQUIRED_FIELDS: ImportCanonicalField[] = ['course', 'category', 'lastName', 'firstName']

const CANONICAL_LABELS: Record<ImportCanonicalField, string> = {
  course: 'Course',
  category: 'Catégorie',
  team: 'Équipe',
  lastName: 'Nom',
  firstName: 'Prénom',
  email: 'Email',
  phone: 'Téléphone',
  captain: 'Capitaine',
}

export const IMPORT_CSV_TEMPLATE_HEADERS = [
  'Course',
  'Catégorie',
  'Équipe',
  'Nom',
  'Prénom',
  'Mail',
  'Tel',
  'Capitaine',
] as const

const CATEGORY_MAP: Record<string, CourseCategoryApi> = {
  solo: 'SOLO',
  loisir: 'LOISIR',
  competition: 'COMPETITION',
}

export function normalizeHeader(label: string): string {
  return label
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
}

export function parseCourseCategoryInput(input: string): CourseCategoryApi | null {
  const key = normalizeHeader(input)
  return CATEGORY_MAP[key] ?? null
}

function parseCsvLine(line: string, sep: string): string[] {
  const cells: string[] = []
  let current = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          current += '"'
          i++
        } else {
          inQuotes = false
        }
      } else {
        current += ch
      }
    } else if (ch === '"') {
      inQuotes = true
    } else if (ch === sep) {
      cells.push(current)
      current = ''
    } else {
      current += ch
    }
  }
  cells.push(current)
  return cells
}

function detectSeparator(headerLine: string): string {
  const semi = (headerLine.match(/;/g) ?? []).length
  const comma = (headerLine.match(/,/g) ?? []).length
  if (semi === 0 && comma > 0) return ','
  return CSV_SEP_PRIMARY
}

export function parseCsv(text: string): string[][] {
  const normalized = text.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n').replace(/\r/g, '\n')
  const lines = normalized.split('\n').filter((l) => l.length > 0)
  if (lines.length === 0) return []
  const sep = detectSeparator(lines[0])
  return lines.map((line) => parseCsvLine(line, sep))
}

export function mapImportHeaders(
  headerRow: string[],
): { columnMap: ImportColumnMap; missingRequired: ImportCanonicalField[] } {
  const columnMap: ImportColumnMap = {}
  const normalizedHeaders = headerRow.map((h) => normalizeHeader(h))

  for (const field of Object.keys(IMPORT_HEADER_ALIASES) as ImportCanonicalField[]) {
    const aliases = IMPORT_HEADER_ALIASES[field]
    for (let i = 0; i < normalizedHeaders.length; i++) {
      const h = normalizedHeaders[i]
      if (aliases.some((a) => h === normalizeHeader(a))) {
        columnMap[field] = i
        break
      }
    }
  }

  const missingRequired = REQUIRED_FIELDS.filter((f) => columnMap[f] === undefined)
  return { columnMap, missingRequired }
}

export function parseCapitaine(value: string | undefined): boolean {
  if (!value?.trim()) return false
  const v = value.trim().toLowerCase()
  return v === 'oui' || v === '1' || v === 'true' || v === 'yes' || v === 'o'
}

function cellAt(row: string[], index: number | undefined): string {
  if (index === undefined) return ''
  return (row[index] ?? '').trim()
}

export function csvRowsToImportPayload(matrix: string[][]): {
  rows: ImportRow[]
  columnMap: ImportColumnMap
  missingRequired: ImportCanonicalField[]
  mappingLabels: { header: string; field: ImportCanonicalField }[]
  categoryErrors: { line: number; message: string }[]
} {
  if (matrix.length < 2) {
    return {
      rows: [],
      columnMap: {},
      missingRequired: [...REQUIRED_FIELDS],
      mappingLabels: [],
      categoryErrors: [],
    }
  }

  const headerRow = matrix[0]
  const { columnMap, missingRequired } = mapImportHeaders(headerRow)

  const mappingLabels: { header: string; field: ImportCanonicalField }[] = []
  for (const field of Object.keys(columnMap) as ImportCanonicalField[]) {
    const idx = columnMap[field]
    if (idx !== undefined) {
      mappingLabels.push({ header: headerRow[idx] ?? CANONICAL_LABELS[field], field })
    }
  }

  const rows: ImportRow[] = []
  const categoryErrors: { line: number; message: string }[] = []

  for (let i = 1; i < matrix.length; i++) {
    const line = matrix[i]
    const allEmpty = line.every((c) => !c?.trim())
    if (allEmpty) continue

    const lineNumber = i + 1
    const categoryRaw = cellAt(line, columnMap.category)
    const category = parseCourseCategoryInput(categoryRaw)
    if (!category) {
      categoryErrors.push({
        line: lineNumber,
        message: `Catégorie invalide « ${categoryRaw} » (Solo, Loisir, Compétition).`,
      })
      continue
    }

    rows.push({
      lineNumber,
      courseName: cellAt(line, columnMap.course),
      category,
      teamName: cellAt(line, columnMap.team),
      lastName: cellAt(line, columnMap.lastName),
      firstName: cellAt(line, columnMap.firstName),
      email: cellAt(line, columnMap.email) || undefined,
      phone: cellAt(line, columnMap.phone) || undefined,
      isCaptain: parseCapitaine(cellAt(line, columnMap.captain)),
    })
  }

  return { rows, columnMap, missingRequired, mappingLabels, categoryErrors }
}

export function missingRequiredLabels(missing: ImportCanonicalField[]): string {
  return missing.map((f) => CANONICAL_LABELS[f]).join(', ')
}
