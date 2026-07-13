import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser, errorResponse, successResponse } from '@/lib/auth-middleware'
import { parseCSV } from '@/lib/csv'
import crypto from 'crypto'

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
      // Check if this looks like a header row
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

    // Default configuration if header was not found but we have a code column (7+ columns)
    if (!hasHeader && firstRow && firstRow.length >= 7) {
      // If first cell looks like a code (e.g. Q_1001 or no spaces and short), assume code is Col 0
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

    for (let i = startIndex; i < rows.length; i++) {
      const row = rows[i]

      // Determine text and options
      const rawText = row[textColIdx]?.trim() || ''
      const text = rawText.replace(/\s*\(\s*Q\s*[-_]?\s*\d+\s*\)\s*$/i, '').trim()
      const optionA = row[optAColIdx]?.trim()
      const optionB = row[optBColIdx]?.trim()
      const optionC = row[optCColIdx]?.trim()
      const optionD = row[optDColIdx]?.trim()
      const rawAns = row[correctColIdx]?.trim()
      const referenceImage = imageColIdx !== -1 ? row[imageColIdx]?.trim() || null : null
      const code = codeColIdx !== -1 ? row[codeColIdx]?.trim() : null

      if (!text || !optionA || !optionB || !optionC || !optionD || !rawAns) {
        errors.push(`Row ${i + 1}: One or more fields are empty.`)
        skippedCount++
        continue
      }

      // Determine correct option
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

      try {
        let masterId = ''

        if (code) {
          // Check if QuestionMaster already exists with this code
          const existingMaster = await prisma.questionMaster.findUnique({
            where: { code },
          })

          if (existingMaster) {
            masterId = existingMaster.id
            // If subcategory or set name was updated, update master
            await prisma.questionMaster.update({
              where: { id: masterId },
              data: {
                subcategoryId: subcategoryId || existingMaster.subcategoryId,
                questionSetName: qSetName || existingMaster.questionSetName,
                referenceImage: referenceImage || existingMaster.referenceImage,
              }
            })
          } else {
            // Create new master with this code
            const newMaster = await prisma.questionMaster.create({
              data: {
                code,
                categoryId,
                subcategoryId: subcategoryId || null,
                adminId: user.userId,
                questionSetName: qSetName,
                referenceImage: referenceImage,
              }
            })
            masterId = newMaster.id
          }
        } else {
          // Generate a new code and create master
          const autoCode = `QM_${Date.now()}_${Math.floor(Math.random() * 1000)}`
          const newMaster = await prisma.questionMaster.create({
            data: {
              code: autoCode,
              categoryId,
              subcategoryId: subcategoryId || null,
              adminId: user.userId,
              questionSetName: qSetName,
              referenceImage: referenceImage,
            }
          })
          masterId = newMaster.id
        }

        // Upsert the translation for the selected language
        const translation = await prisma.questionTranslation.upsert({
          where: {
            questionMasterId_language: {
              questionMasterId: masterId,
              language: targetLang,
            }
          },
          update: {
            text,
            optionA,
            optionB,
            optionC,
            optionD,
            correctOption,
          },
          create: {
            questionMasterId: masterId,
            language: targetLang,
            text,
            optionA,
            optionB,
            optionC,
            optionD,
            correctOption,
          }
        })

        questionsCreated.push({
          masterId,
          code: code || 'Generated',
          language: targetLang,
          text,
        })
        importedCount++
      } catch (err: any) {
        errors.push(`Row ${i + 1}: DB write failed. ${err.message}`)
        skippedCount++
      }
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
