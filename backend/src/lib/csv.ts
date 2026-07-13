/**
 * Lightweight, dependency-free RFC 4180 compliant CSV parser.
 * Handles commas in quotes, escaped double quotes (""), and multiple newline types.
 * Also handles the edge case where entire rows are wrapped in quotes
 * (e.g. from Excel), causing each row to be parsed as a single cell.
 */
export function parseCSV(csvContent: string): string[][] {
  const lines: string[][] = []
  let row: string[] = []
  let cell = ''
  let inQuotes = false

  const content = csvContent.replace(/\r\n/g, '\n').replace(/\r/g, '\n')

  for (let i = 0; i < content.length; i++) {
    const char = content[i]
    const nextChar = content[i + 1]

    if (inQuotes) {
      if (char === '"') {
        if (nextChar === '"') {
          cell += '"'
          i++ // skip escaped quote
        } else {
          inQuotes = false
        }
      } else {
        cell += char
      }
    } else {
      if (char === '"') {
        inQuotes = true
      } else if (char === ',') {
        row.push(cell.trim())
        cell = ''
      } else if (char === '\n') {
        row.push(cell.trim())
        lines.push(row)
        row = []
        cell = ''
      } else {
        cell += char
      }
    }
  }

  if (cell !== '' || row.length > 0) {
    row.push(cell.trim())
    lines.push(row)
  }

  let result = lines.filter((r) => r.length > 0 && r.some((c) => c !== ''))

  // Fix: If every row has exactly 1 column and that column contains commas,
  // the file likely has each row wrapped in quotes (e.g. from Excel copy-paste).
  // Re-split each single-cell row by commas to extract the actual fields.
  if (result.length > 0 && result.every(r => r.length === 1 && r[0].includes(','))) {
    result = result.map(r => r[0].split(',').map(c => c.trim()))
  }

  return result
}
