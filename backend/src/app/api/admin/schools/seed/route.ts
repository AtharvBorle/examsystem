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
    const { csvData, language: reqLang } = body
    if (!csvData) {
      return errorResponse('csvData payload is required', 400)
    }

    // Explicit language selection from admin dropdown (or fallback auto-detect if omitted)
    let targetLang = reqLang === 'hi' ? 'hi' : reqLang === 'en' ? 'en' : null
    if (!targetLang) {
      const containsHindi = /[\u0900-\u097F]/.test(csvData)
      targetLang = containsHindi ? 'hi' : 'en'
    }

    const rows = parseCSV(csvData)
    if (rows.length === 0) {
      return errorResponse('No data found in CSV', 400)
    }

    let seededCount = 0
    let skippedCount = 0
    let otherAdminCount = 0
    const errors: string[] = []
    const conflictingSchools: any[] = []

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
        // 1. Check if ANY school record with this UDISE exists in ANY language across the entire DB
        const anyExistingSchool = await prisma.school.findFirst({
          where: { udise },
          select: { id: true, adminId: true, tehsil: true, district: true }
        })

        // RULE C: If this UDISE is already owned by ANOTHER Admin in any language, REJECT / SKIP!
        if (anyExistingSchool && anyExistingSchool.adminId !== user.userId) {
          otherAdminCount++
          skippedCount++
          conflictingSchools.push({
            udise,
            name: schoolName,
            tehsil: tehsil || anyExistingSchool.tehsil || '',
            district: district || anyExistingSchool.district || '',
            status: 'Managed by another organization'
          })
          errors.push(`Row ${i + 1}: UDISE "${udise}" (${schoolName}) is already managed by another organization.`)
          continue
        }

        // RULE B: Same Admin can add multiple language records under their UDISE
        const targetLangSchool = await prisma.school.findUnique({
          where: {
            udise_language: {
              udise,
              language: targetLang,
            }
          }
        })

        if (targetLangSchool) {
          // Record for this language already exists for this same Admin -> Update details
          await prisma.school.update({
            where: { id: targetLangSchool.id },
            data: {
              name: schoolName,
              tehsil: tehsil || targetLangSchool.tehsil,
              district: district || targetLangSchool.district,
            }
          })
          seededCount++
        } else {
          // Record for this language does not exist yet under this same Admin -> Create it!
          await prisma.school.create({
            data: {
              name: schoolName,
              udise,
              tehsil: tehsil || (anyExistingSchool ? anyExistingSchool.tehsil : null),
              district: district || (anyExistingSchool ? anyExistingSchool.district : null),
              language: targetLang,
              adminId: user.userId
            }
          })
          seededCount++
        }
      } catch (err: any) {
        errors.push(`Row ${i + 1}: Failed to insert. ${err.message}`)
        skippedCount++
      }
    }

    let finalMessage = `Successfully processed CSV. Seeded ${seededCount} school(s).`
    if (otherAdminCount > 0) {
      finalMessage = `Successfully processed CSV, you are adding schools that are already managed by another organization, for existing schools you can download the CSV here:`
    }

    return successResponse({
      message: finalMessage,
      seededCount,
      otherAdminCount,
      skippedCount,
      conflictingSchools,
      errors: errors.slice(0, 25),
    })
  } catch (error: any) {
    console.error('Seed schools error:', error)
    return errorResponse('Internal server error', 500)
  }
}
