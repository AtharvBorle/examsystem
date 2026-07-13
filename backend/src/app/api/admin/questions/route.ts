import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser, errorResponse, successResponse } from '@/lib/auth-middleware'
import crypto from 'crypto'

export async function GET(req: NextRequest) {
  try {
    const user = getAuthUser(req)
    if (!user || user.role !== 'ADMIN') {
      return errorResponse('Unauthorized. Admin access required.', 401)
    }

    const { searchParams } = new URL(req.url)
    const categoryId = searchParams.get('categoryId')
    const subcategoryId = searchParams.get('subcategoryId')
    const questionSetName = searchParams.get('questionSetName')
    const targetLang = searchParams.get('language') || 'en'

    const whereClause: any = { adminId: user.userId }
    if (categoryId) {
      whereClause.categoryId = categoryId
    }
    if (subcategoryId) {
      whereClause.subcategoryId = subcategoryId
    }
    if (questionSetName) {
      whereClause.questionSetName = questionSetName
    }

    const setsOnly = searchParams.get('setsOnly') === 'true'
    if (setsOnly) {
      const qSets = await prisma.questionMaster.findMany({
        where: whereClause,
        select: { questionSetName: true },
        distinct: ['questionSetName']
      })
      const setNames = qSets
        .map(q => q.questionSetName)
        .filter((name): name is string => Boolean(name))
      return successResponse({ sets: setNames })
    }

    const questions = await prisma.questionMaster.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      include: {
        category: { select: { name: true } },
        subcategory: { select: { name: true } },
        translations: true,
      },
    })

    const formatted = questions.map((q) => {
      // Find matching translation or fallback
      const trans = q.translations.find(t => t.language === targetLang) || 
                    q.translations.find(t => t.language === 'en') || 
                    q.translations[0]

      return {
        id: q.id,
        code: q.code,
        text: trans?.text || '',
        optionA: trans?.optionA || '',
        optionB: trans?.optionB || '',
        optionC: trans?.optionC || '',
        optionD: trans?.optionD || '',
        correctOption: trans?.correctOption || '',
        categoryId: q.categoryId,
        categoryName: q.category.name,
        subcategoryId: q.subcategoryId,
        subcategoryName: q.subcategory?.name || null,
        questionSetName: q.questionSetName,
        referenceImage: q.referenceImage,
        createdAt: q.createdAt,
        translations: q.translations.map(t => ({ language: t.language, text: t.text })),
      }
    })

    return successResponse({ questions: formatted })
  } catch (error: any) {
    console.error('List questions error:', error)
    return errorResponse('Internal server error', 500)
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = getAuthUser(req)
    if (!user || user.role !== 'ADMIN') {
      return errorResponse('Unauthorized. Admin access required.', 401)
    }

    const body = await req.json()
    const { id, text, optionA, optionB, optionC, optionD, correctOption, referenceImage, language } = body
    const targetLang = language?.trim() || 'en'

    if (!id || !text || !optionA || !optionB || !optionC || !optionD || !correctOption) {
      return errorResponse('Missing required fields', 400)
    }

    // Verify ownership on QuestionMaster
    const existingMaster = await prisma.questionMaster.findFirst({
      where: { id, adminId: user.userId },
    })

    if (!existingMaster) {
      return errorResponse('Question not found or unauthorized', 404)
    }

    // Update master reference image if provided
    await prisma.questionMaster.update({
      where: { id },
      data: {
        referenceImage: referenceImage !== undefined ? referenceImage : undefined,
      }
    })

    // Clean text title number format
    const cleanedText = text.replace(/\s*\(\s*Q\s*[-_]?\s*\d+\s*\)\s*$/i, '').trim()

    // Update or insert translation
    const updatedTranslation = await prisma.questionTranslation.upsert({
      where: {
        questionMasterId_language: {
          questionMasterId: id,
          language: targetLang,
        }
      },
      update: {
        text: cleanedText,
        optionA,
        optionB,
        optionC,
        optionD,
        correctOption,
      },
      create: {
        questionMasterId: id,
        language: targetLang,
        text: cleanedText,
        optionA,
        optionB,
        optionC,
        optionD,
        correctOption,
      }
    })

    return successResponse({ 
      question: {
        id,
        code: existingMaster.code,
        text: updatedTranslation.text,
        optionA: updatedTranslation.optionA,
        optionB: updatedTranslation.optionB,
        optionC: updatedTranslation.optionC,
        optionD: updatedTranslation.optionD,
        correctOption: updatedTranslation.correctOption,
        referenceImage,
      }
    })
  } catch (error: any) {
    console.error('Update question error:', error)
    return errorResponse('Internal server error', 500)
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = getAuthUser(req)
    if (!user || user.role !== 'ADMIN') {
      return errorResponse('Unauthorized. Admin access required.', 401)
    }

    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    const idsStr = searchParams.get('ids')
    const categoryId = searchParams.get('categoryId')
    const subcategoryId = searchParams.get('subcategoryId')

    if (!id && !idsStr && !categoryId) {
      return errorResponse('Missing parameter: id, ids, or categoryId is required', 400)
    }

    if (id) {
      const existing = await prisma.questionMaster.findFirst({
        where: { id, adminId: user.userId },
      })
      if (!existing) return errorResponse('Question not found', 404)

      await prisma.questionMaster.delete({ where: { id } })
      return successResponse({ success: true, message: 'Question deleted successfully' })
    }

    if (idsStr) {
      const targetIds = idsStr.split(',').filter(Boolean)
      const deleteResult = await prisma.questionMaster.deleteMany({
        where: {
          id: { in: targetIds },
          adminId: user.userId,
        },
      })
      return successResponse({ success: true, message: `${deleteResult.count} questions deleted successfully` })
    }

    if (categoryId) {
      const qSetName = searchParams.get('questionSetName')
      const whereClause: any = {
        categoryId,
        adminId: user.userId,
      }
      if (subcategoryId) {
        whereClause.subcategoryId = subcategoryId
      }
      if (qSetName) {
        whereClause.questionSetName = qSetName
      }

      const deleteResult = await prisma.questionMaster.deleteMany({
        where: whereClause,
      })
      const msg = qSetName
        ? `Question set "${qSetName}" cleared. ${deleteResult.count} questions deleted.`
        : `Entire bank cleared. ${deleteResult.count} questions deleted.`
      return successResponse({ success: true, message: msg })
    }

    return errorResponse('Bad request', 400)
  } catch (error: any) {
    console.error('Delete questions error:', error)
    return errorResponse('Internal server error', 500)
  }
}
