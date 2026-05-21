const CSV_SEP = ';'
const UTF8_BOM = '\uFEFF'

function escapeCsvCell(value: unknown): string {
  const s = value == null ? '' : String(value)
  if (/[;"\r\n]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`
  }
  return s
}

function buildCsvLine(cells: unknown[]): string {
  return cells.map(escapeCsvCell).join(CSV_SEP)
}

export function buildCsvContent(headers: string[], rows: unknown[][]): string {
  const lines = [buildCsvLine(headers), ...rows.map((row) => buildCsvLine(row))]
  return UTF8_BOM + lines.join('\r\n')
}

export function csvFilename(prefix: string): string {
  const date = new Date().toISOString().slice(0, 10)
  return `${prefix}_${date}.csv`
}

export function downloadCsv(filename: string, headers: string[], rows: unknown[][]): void {
  const content = buildCsvContent(headers, rows)
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.style.display = 'none'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
