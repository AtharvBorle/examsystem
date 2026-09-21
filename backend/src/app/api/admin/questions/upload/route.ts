import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser, errorResponse, successResponse } from '@/lib/auth-middleware'
import { parseCSV } from '@/lib/csv'

export async function POST(req: NextRequest) {
  try {
    const user = getAuthUser(req)
    if (!user || user.role !== 'ADMIN') {
      return errorResponse('Unauthorized. Admin access required.', 401)
    }

    const { csvData, categoryId, subcategoryId, questionSetName, language } = await req.json()
    const targetLang = language?.trim() || 'en'
    
    const dateStr = new Date().toLocaleDateString()
    const timeStr = new Date().toLocaleTimeString('en-US', { hour12: false })
    const qSetName = questionSetName?.trim() || `Set - ${dateStr} (${timeStr})`

    if (!csvData) {
      return errorResponse('csvData is required', 400)
    }
    if (!categoryId) {
      return errorResponse('Category ID is required', 400)
    }

    const rows = parseCSV(csvData)
    if (rows.length === 0) {
      return errorResponse('No data found in CSV', 400)
    }

    let importedCount = 0
    let skippedCount = 0
    const errors: string[] = []
    const questionsCreated: any[] = []

    // 1. Detect columns from first row (headers)
    let codeColIdx = -1
    let textColIdx = 0
    let optAColIdx = 1
    let optBColIdx = 2
    let optCColIdx = 3
    let optDColIdx = 4
    let correctColIdx = 5
    let imageColIdx = -1

    const firstRow = rows[0]
    let hasHeader = false

    if (firstRow) {
      const lowerCells = firstRow.map(c => c.toLowerCase())
      if (
        lowerCells.some(c => c.includes('question') || c.includes('text') || c.includes('option') || c.includes('correct') || c.includes('code'))
      ) {
        hasHeader = true
        for (let colIdx = 0; colIdx < firstRow.length; colIdx++) {
          const val = lowerCells[colIdx]
          if (val.includes('code')) {
            codeColIdx = colIdx
          } else if (val.includes('question') || val === 'text') {
            textColIdx = colIdx
          } else if (val.includes('option a') || val === 'optiona' || val === 'a') {
            optAColIdx = colIdx
          } else if (val.includes('option b') || val === 'optionb' || val === 'b') {
            optBColIdx = colIdx
          } else if (val.includes('option c') || val === 'optionc' || val === 'c') {
            optCColIdx = colIdx
          } else if (val.includes('option d') || val === 'optiond' || val === 'd') {
            optDColIdx = colIdx
          } else if (val.includes('correct') || val.includes('answer') || val.includes('ans')) {
            correctColIdx = colIdx
          } else if (val.includes('image') || val.includes('ref')) {
            imageColIdx = colIdx
          }
        }
      }
    }

    if (!hasHeader && firstRow && firstRow.length >= 7) {
      const looksLikeCode = /^[a-zA-Z0-9_\-]+$/.test(firstRow[0]?.trim())
      if (looksLikeCode) {
        codeColIdx = 0
        textColIdx = 1
        optAColIdx = 2
        optBColIdx = 3
        optCColIdx = 4
        optDColIdx = 5
        correctColIdx = 6
        if (firstRow.length >= 8) {
          imageColIdx = 7
        }
      }
    }

    const startIndex = hasHeader ? 1 : 0
    const validItems: Array<{
      rowIndex: number
      code: string | null
      text: string
      optionA: string
      optionB: string
      optionC: string
      optionD: string
      correctOption: string
      referenceImage: string | null
    }> = []

    // 2. Parse and validate all rows in memory
    for (let i = startIndex; i < rows.length; i++) {
      const row = rows[i]
      const rawText = row[textColIdx]?.trim() || ''
      const text = rawText.replace(/\s*\(\s*Q\s*[-_]?\s*\d+\s*\)\s*$/i, '').trim()
      const optionA = row[optAColIdx]?.trim()
      const optionB = row[optBColIdx]?.trim()
      const optionC = row[optCColIdx]?.trim()
      const optionD = row[optDColIdx]?.trim()
      const rawAns = row[correctColIdx]?.trim()
      const referenceImage = imageColIdx !== -1 ? row[imageColIdx]?.trim() || null : null
      const code = codeColIdx !== -1 ? row[codeColIdx]?.trim() || null : null

      if (!text || !optionA || !optionB || !optionC || !optionD || !rawAns) {
        errors.push(`Row ${i + 1}: One or more fields are empty.`)
        skippedCount++
        continue
      }

      let correctOption = ''
      const upperAns = rawAns.toUpperCase()
      if (['A', 'B', 'C', 'D'].includes(upperAns)) {
        correctOption = upperAns
      } else {
        const lAns = rawAns.toLowerCase()
        if (lAns === optionA.toLowerCase()) correctOption = 'A'
        else if (lAns === optionB.toLowerCase()) correctOption = 'B'
        else if (lAns === optionC.toLowerCase()) correctOption = 'C'
        else if (lAns === optionD.toLowerCase()) correctOption = 'D'
      }

      if (!correctOption) {
        errors.push(`Row ${i + 1}: Correct answer '${rawAns}' did not match options A, B, C, or D.`)
        skippedCount++
        continue
      }

      validItems.push({
        rowIndex: i + 1,
        code,
        text,
        optionA,
        optionB,
        optionC,
        optionD,
        correctOption,
        referenceImage,
      })
    }

    // 3. Batch Pre-fetch all existing question codes in 1 single database call
    const explicitCodes = Array.from(new Set(validItems.map(item => item.code).filter(Boolean))) as string[]
    const existingMasters = explicitCodes.length > 0
      ? await prisma.questionMaster.findMany({
          where: { code: { in: explicitCodes } },
          select: { id: true, code: true, subcategoryId: true, questionSetName: true, referenceImage: true }
        })
      : []

    const masterMap = new Map(existingMasters.map(m => [m.code, m]))

    // 4. Process in concurrent chunks of 50
    const CHUNK_SIZE = 50
    for (let i = 0; i < validItems.length; i += CHUNK_SIZE) {
      const chunk = validItems.slice(i, i + CHUNK_SIZE)

      await Promise.all(
        chunk.map(async (item) => {
          try {
            let masterId = ''

            if (item.code && masterMap.has(item.code)) {
              const existing = masterMap.get(item.code)!
              masterId = existing.id
              // Update master details if modified
              await prisma.questionMaster.update({
                where: { id: masterId },
                data: {
                  subcategoryId: subcategoryId || existing.subcategoryId,
                  questionSetName: qSetName || existing.questionSetName,
                  referenceImage: item.referenceImage || existing.referenceImage,
                }
              })
            } else {
              const assignedCode = item.code || `QM_${Date.now()}_${Math.floor(Math.random() * 100000)}_${item.rowIndex}`
              const createdMaster = await prisma.questionMaster.create({
                data: {
                  code: assignedCode,
                  categoryId,
                  subcategoryId: subcategoryId || null,
                  adminId: user.userId,
                  questionSetName: qSetName,
                  referenceImage: item.referenceImage,
                }
              })
              masterId = createdMaster.id
              masterMap.set(assignedCode, createdMaster)
            }

            // Upsert the translation for the selected language
            await prisma.questionTranslation.upsert({
              where: {
                questionMasterId_language: {
                  questionMasterId: masterId,
                  language: targetLang,
                }
              },
              update: {
                text: item.text,
                optionA: item.optionA,
                optionB: item.optionB,
                optionC: item.optionC,
                optionD: item.optionD,
                correctOption: item.correctOption,
              },
              create: {
                questionMasterId: masterId,
                language: targetLang,
                text: item.text,
                optionA: item.optionA,
                optionB: item.optionB,
                optionC: item.optionC,
                optionD: item.optionD,
                correctOption: item.correctOption,
              }
            })

            questionsCreated.push({
              masterId,
              code: item.code || 'Generated',
              language: targetLang,
              text: item.text,
            })
            importedCount++
          } catch (err: any) {
            errors.push(`Row ${item.rowIndex}: DB write failed. ${err.message}`)
            skippedCount++
          }
        })
      )
    }

    return successResponse({
      message: `Successfully imported ${importedCount} questions.`,
      importedCount,
      skippedCount,
      errors: errors.slice(0, 10),
      questions: questionsCreated.slice(0, 5),
    })
  } catch (error: any) {
    console.error('Upload questions error:', error)
    return errorResponse('Internal server error', 500)
  }
}
