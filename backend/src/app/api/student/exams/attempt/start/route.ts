import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser, errorResponse, successResponse } from '@/lib/auth-middleware'

function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

export async function POST(req: NextRequest) {
  try {
    const user = getAuthUser(req)
    if (!user || user.role !== 'STUDENT') {
      return errorResponse('Unauthorized. Student access required.', 401)
    }

    const { examId } = await req.json()
    if (!examId) {
      return errorResponse('examId is required', 400)
    }

    // Fetch student details with school and language
    const student = await prisma.student.findUnique({
      where: { id: user.userId },
      include: { school: true },
    })
    if (!student) {
      return errorResponse('Student not found', 404)
    }

    if (!student.approved) {
      return errorResponse('Registration pending approval.', 403)
    }

    const studentLang = student.language || 'en'

    // Fetch exam details (ExamQuestion points to questionMasterId now)
    const exam = await prisma.exam.findUnique({
      where: { id: examId },
      include: {
        admin: true,
        questions: {
          select: { questionMasterId: true },
        },
      },
    })
    if (!exam) {
      return errorResponse('Exam not found', 404)
    }

    // Check if attempt already exists
    const existingAttempt = await prisma.examAttempt.findFirst({
      where: { studentId: user.userId, examId },
    })

    if (existingAttempt) {
      if (existingAttempt.completed) {
        return errorResponse('You have already completed this exam.', 400)
      }

      // If attempt is in progress, resume it and fetch the questions
      const questionsOrder = existingAttempt.questionsOrder as string[]
      const questions = await prisma.questionMaster.findMany({
        where: { id: { in: questionsOrder } },
        include: {
          translations: true,
        }
      })

      // Sort questions based on the stored order and map to student's language translation
      const orderedQuestions = questionsOrder
        .map((id) => {
          const q = questions.find((qm) => qm.id === id)
          if (!q) return null

          // Find preferred language translation or fallback to English or first available
          const trans = q.translations.find(t => t.language === studentLang) ||
                        q.translations.find(t => t.language === 'en') ||
                        q.translations[0]

          return {
            id: q.id,
            text: trans?.text || '',
            optionA: trans?.optionA || '',
            optionB: trans?.optionB || '',
            optionC: trans?.optionC || '',
            optionD: trans?.optionD || '',
            referenceImage: q.referenceImage,
            translations: q.translations.map(t => ({
              language: t.language,
              text: t.text,
              optionA: t.optionA,
              optionB: t.optionB,
              optionC: t.optionC,
              optionD: t.optionD,
            })),
          }
        })
        .filter(Boolean)

      return successResponse({
        attemptId: existingAttempt.id,
        questions: orderedQuestions,
        responses: existingAttempt.responses,
        startedAt: existingAttempt.startedAt,
        duration: exam.duration,
      })
    }

    // Check Admin's attempt/user count limit
    const adminId = exam.adminId
    const admin = await prisma.admin.findUnique({
      where: { id: adminId },
    })

    if (!admin) {
      return errorResponse('Admin for this exam not found', 404)
    }

    // Check limit and increment inside transaction
    if (admin.userCountLimit !== null) {
      if (admin.userCountUsed >= admin.userCountLimit) {
        return errorResponse(
          'This exam registration limit has been reached. Please contact your administrator.',
          403
        )
      }
    }

    // Shuffle and pick QuestionMaster IDs
    const questionPoolIds = exam.questions.map((eq) => eq.questionMasterId)
    if (questionPoolIds.length < exam.questionCount) {
      return errorResponse('Exam does not have enough questions in its pool.', 400)
    }

    const shuffledIds = shuffleArray(questionPoolIds).slice(0, exam.questionCount)

    // Execute attempt creation and user count limit increment in a transaction
    const attempt = await prisma.$transaction(async (tx) => {
      // Re-fetch and check limit inside transaction to prevent race conditions
      const txAdmin = await tx.admin.findUnique({
        where: { id: adminId },
      })
      if (txAdmin && txAdmin.userCountLimit !== null) {
        if (txAdmin.userCountUsed >= txAdmin.userCountLimit) {
          throw new Error('LIMIT_EXCEEDED')
        }
        await tx.admin.update({
          where: { id: adminId },
          data: { userCountUsed: { increment: 1 } },
        })
      }

      return tx.examAttempt.create({
        data: {
          studentId: user.userId,
          examId,
          questionsOrder: shuffledIds,
          totalQuestions: exam.questionCount,
          language: studentLang,
        },
      })
    })

    // Fetch the shuffled QuestionMaster records with translations
    const questions = await prisma.questionMaster.findMany({
      where: { id: { in: shuffledIds } },
      include: {
        translations: true,
      }
    })

    // Sort questions in the randomized order and apply translation
    const orderedQuestions = shuffledIds
      .map((id) => {
        const q = questions.find((qm) => qm.id === id)
        if (!q) return null

        // Find preferred language translation or fallback
        const trans = q.translations.find(t => t.language === studentLang) ||
                      q.translations.find(t => t.language === 'en') ||
                      q.translations[0]

        return {
          id: q.id,
          text: trans?.text || '',
          optionA: trans?.optionA || '',
          optionB: trans?.optionB || '',
          optionC: trans?.optionC || '',
          optionD: trans?.optionD || '',
          referenceImage: q.referenceImage,
          translations: q.translations.map(t => ({
            language: t.language,
            text: t.text,
            optionA: t.optionA,
            optionB: t.optionB,
            optionC: t.optionC,
            optionD: t.optionD,
          })),
        }
      })
      .filter(Boolean)

    return successResponse({
      attemptId: attempt.id,
      questions: orderedQuestions,
      responses: {},
      startedAt: attempt.startedAt,
      duration: exam.duration,
    })
  } catch (error: any) {
    if (error.message === 'LIMIT_EXCEEDED') {
      return errorResponse(
        'This exam registration limit has been reached. Please contact your administrator.',
        403
      )
    }
    console.error('Start exam attempt error:', error)
    return errorResponse('Internal server error', 500)
  }
}
