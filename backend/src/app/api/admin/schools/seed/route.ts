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
    const validItems: Array<{
      rowIndex: number
      schoolName: string
      udise: string
      tehsil: string | null
      district: string | null
    }> = []

    // 1. Parse and validate all rows in memory
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

      validItems.push({
        rowIndex: i + 1,
        schoolName,
        udise,
        tehsil,
        district,
      })
    }

    // 2. Batch Pre-fetch all matching schools for all UDISEs in 1 single query
    const allUdises = Array.from(new Set(validItems.map(item => item.udise)))
    const existingSchools = allUdises.length > 0
      ? await prisma.school.findMany({
          where: { udise: { in: allUdises } },
          select: { id: true, udise: true, language: true, adminId: true, tehsil: true, district: true }
        })
      : []

    // Group existing schools by UDISE
    const existingByUdise = new Map<string, typeof existingSchools>()
    for (const s of existingSchools) {
      if (!existingByUdise.has(s.udise)) {
        existingByUdise.set(s.udise, [])
      }
      existingByUdise.get(s.udise)!.push(s)
    }

    // Filter items to process and flag conflicts
    const itemsToProcess: Array<typeof validItems[0] & { existingMatchingLang?: typeof existingSchools[0]; defaultTehsil: string | null; defaultDistrict: string | null }> = []

    for (const item of validItems) {
      const existingList = existingByUdise.get(item.udise) || []
      const anyExisting = existingList[0]

      // RULE C: If this UDISE is already owned by ANOTHER Admin in any language, REJECT / SKIP!
      if (anyExisting && anyExisting.adminId !== user.userId) {
        otherAdminCount++
        skippedCount++
        conflictingSchools.push({
          udise: item.udise,
          name: item.schoolName,
          tehsil: item.tehsil || anyExisting.tehsil || '',
          district: item.district || anyExisting.district || '',
          status: 'Managed by another organization'
        })
        errors.push(`Row ${item.rowIndex}: UDISE "${item.udise}" (${item.schoolName}) is already managed by another organization.`)
        continue
      }

      const existingMatchingLang = existingList.find(s => s.language === targetLang)
      itemsToProcess.push({
        ...item,
        existingMatchingLang,
        defaultTehsil: item.tehsil || (anyExisting ? anyExisting.tehsil : null),
        defaultDistrict: item.district || (anyExisting ? anyExisting.district : null),
      })
    }

    // 3. Process in concurrent chunks of 50
    const CHUNK_SIZE = 50
    for (let i = 0; i < itemsToProcess.length; i += CHUNK_SIZE) {
      const chunk = itemsToProcess.slice(i, i + CHUNK_SIZE)

      await Promise.all(
        chunk.map(async (item) => {
          try {
            if (item.existingMatchingLang) {
              // Record for this language already exists for this same Admin -> Update details
              await prisma.school.update({
                where: { id: item.existingMatchingLang.id },
                data: {
                  name: item.schoolName,
                  tehsil: item.tehsil || item.existingMatchingLang.tehsil,
                  district: item.district || item.existingMatchingLang.district,
                }
              })
              seededCount++
            } else {
              // Record for this language does not exist yet under this same Admin -> Create it!
              const created = await prisma.school.create({
                data: {
                  name: item.schoolName,
                  udise: item.udise,
                  tehsil: item.defaultTehsil,
                  district: item.defaultDistrict,
                  language: targetLang,
                  adminId: user.userId
                }
              })
              // Register created in lookup map to prevent intra-batch duplicates
              if (!existingByUdise.has(item.udise)) {
                existingByUdise.set(item.udise, [])
              }
              existingByUdise.get(item.udise)!.push(created)
              seededCount++
            }
          } catch (err: any) {
            errors.push(`Row ${item.rowIndex}: Failed to write. ${err.message}`)
            skippedCount++
          }
        })
      )
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
