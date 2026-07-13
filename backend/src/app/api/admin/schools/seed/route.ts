import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser, errorResponse, successResponse } from '@/lib/auth-middleware'
import { parseCSV } from '@/lib/csv'

export async function POST(req: NextRequest) {
  try {
    const user = getAuthUser(req)
    if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN')) {
      return errorResponse('Unauthorized. Admin access required.', 401)
    }

    const body = await req.json()
    const { csvData } = body
    if (!csvData) {
      return errorResponse('csvData payload is required', 400)
    }

    // Auto-detect language: if the CSV contains Devanagari/Hindi characters, seed as Hindi ('hi'), otherwise English ('en')
    const containsHindi = /[\u0900-\u097F]/.test(csvData)
    const targetLang = containsHindi ? 'hi' : 'en'

    const rows = parseCSV(csvData)
    if (rows.length === 0) {
      return errorResponse('No data found in CSV', 400)
    }

    let seededCount = 0
    let skippedCount = 0
    const errors: string[] = []

    let nameColIndex = 0
    let udiseColIndex = 1
    let tehsilColIndex = -1
    let districtColIndex = -1

    const firstRow = rows[0]
    if (firstRow) {
      for (let colIdx = 0; colIdx < firstRow.length; colIdx++) {
        const val = firstRow[colIdx]?.toLowerCase() || ''
        if (val.includes('school') || val.includes('name') || val.includes('स्कूल') || val.includes('नाम') || val.includes('विद्यालय')) {
          nameColIndex = colIdx
        } else if (val.includes('udise') || val.includes('udis') || val.includes('यूडीआईएसई') || val.includes('कोड')) {
          udiseColIndex = colIdx
        } else if (val.includes('tehsil') || val.includes('tahsil') || val.includes('तहसील') || val.includes('तहशिल')) {
          tehsilColIndex = colIdx
        } else if (val.includes('district') || val.includes('dist') || val.includes('जिला') || val.includes('जिल्हा') || val.includes('jila') || val.includes('zila')) {
          districtColIndex = colIdx
        }
      }
    }

    // Detect if row 0 is a header by checking if it looks like labels.
    // A true header has keyword-like cells (e.g. "School Name", "UDISE") but NO numeric UDISE value.
    // A data row will have a numeric UDISE code (5+ digits), so it should NOT be skipped.
    const isHeaderRow = (row: string[]): boolean => {
      const hasKeyword = row.some(cell => {
        const val = cell.toLowerCase()
        return val.includes('school') || val.includes('udise') || val.includes('udis') || 
               val.includes('name') || val.includes('tehsil') || val.includes('district') ||
               val.includes('स्कूल') || val.includes('नाम') || val.includes('विद्यालय') ||
               val.includes('यूडीआईएसई') || val.includes('तहसील') || val.includes('जिला') ||
               val.includes('jila') || val.includes('zila')
      })
      const hasNumericUdise = row.some(cell => /^\d{5,}$/.test(cell.trim()))
      return hasKeyword && !hasNumericUdise
    }

    const startIndex = isHeaderRow(rows[0]) ? 1 : 0

    for (let i = startIndex; i < rows.length; i++) {
      const row = rows[i]

      const schoolName = row[nameColIndex]?.trim()
      const udise = row[udiseColIndex]?.trim()
      const tehsil = tehsilColIndex !== -1 ? row[tehsilColIndex]?.trim() || null : null
      const district = districtColIndex !== -1 ? row[districtColIndex]?.trim() || null : null

      if (!schoolName || !udise) {
        errors.push(`Row ${i + 1}: Name or UDISE is empty.`)
        skippedCount++
        continue
      }

      try {
        // Upsert by UDISE number to avoid duplication
        const sch = await prisma.school.upsert({
          where: {
            udise_language: {
              udise,
              language: targetLang,
            }
          },
          update: { 
            name: schoolName, 
            tehsil,
            district,
            adminId: user.userId 
          },
          create: { 
            name: schoolName, 
            udise, 
            tehsil,
            district,
            language: targetLang,
            adminId: user.userId 
          },
        })
        
        seededCount++
      } catch (err: any) {
        errors.push(`Row ${i + 1}: Failed to insert. ${err.message}`)
        skippedCount++
      }
    }

    return successResponse({
      message: `Successfully seeded ${seededCount} schools.`,
      seededCount,
      skippedCount,
      errors: errors.slice(0, 10), // Limit error response size
    })
  } catch (error: any) {
    console.error('Seed schools error:', error)
    return errorResponse('Internal server error', 500)
  }
}
