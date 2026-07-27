import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser, errorResponse, successResponse } from '@/lib/auth-middleware'

export const dynamic = 'force-dynamic'

// GET /api/student/exams/attempt/[id]/answersheet - Fetch detailed answersheet for a student's attempt
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = getAuthUser(req)
    if (!user) {
      return errorResponse('Unauthorized', 401)
    }

    const attemptId = params.id
    if (!attemptId) {
      return errorResponse('Attempt ID is required', 400)
    }

    const attempt = await prisma.examAttempt.findUnique({
      where: { id: attemptId },
      include: {
        exam: {
          select: { name: true, nameHindi: true },
        },
        student: {
          select: { id: true, name: true },
        },
      },
    })

    if (!attempt) {
      return errorResponse('Exam attempt not found', 404)
    }

    // Security check: Student can only view their own answersheet
    if (user.role === 'STUDENT' && attempt.studentId !== user.userId) {
      return errorResponse('Unauthorized. Access denied.', 403)
    }

    if (!attempt.completed) {
      return errorResponse('Answersheet is not available yet. The exam is not completed.', 400)
    }

    const studentLang = attempt.language || 'en'
    const questionsOrder = attempt.questionsOrder as string[]
    const responses = (attempt.responses || {}) as Record<string, string>

    // Fetch the questions matching the order
    const questions = await prisma.questionMaster.findMany({
      where: { id: { in: questionsOrder } },
      include: {
        translations: true,
      },
    })

    // Sort and map the questions based on the served order
    const mappedQuestions = questionsOrder
      .map((id) => {
        const q = questions.find((qm) => qm.id === id)
        if (!q) return null

        // Find translation for attempt's language, fallback to English or first available
        const trans = q.translations.find((t) => t.language === studentLang) ||
                      q.translations.find((t) => t.language === 'en') ||
                      q.translations[0]

        return {
          id: q.id,
          text: trans?.text || '',
          optionA: trans?.optionA || '',
          optionB: trans?.optionB || '',
          optionC: trans?.optionC || '',
          optionD: trans?.optionD || '',
          correctOption: trans?.correctOption || 'A',
          referenceImage: q.referenceImage,
          studentResponse: responses[q.id] || null,
        }
      })
      .filter(Boolean)

    return successResponse({
      answersheet: {
        attemptId: attempt.id,
        studentName: attempt.student.name,
        examName: (studentLang === 'hi' && attempt.exam.nameHindi) ? attempt.exam.nameHindi : attempt.exam.name,
        completedAt: attempt.submittedAt,
        score: attempt.score,
        correctAnswers: attempt.correctAnswers,
        totalQuestions: attempt.totalQuestions,
        language: studentLang,
        questions: mappedQuestions,
      },
    })
  } catch (error: any) {
    console.error('Fetch answersheet error:', error)
    return errorResponse('Internal server error', 500)
  }
}
