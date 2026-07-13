import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser, errorResponse, successResponse } from '@/lib/auth-middleware'

export async function POST(req: NextRequest) {
  try {
    const user = getAuthUser(req)
    if (!user || user.role !== 'STUDENT') {
      return errorResponse('Unauthorized. Student access required.', 401)
    }

    const { attemptId, responses, language } = await req.json()

    if (!attemptId || !responses) {
      return errorResponse('attemptId and responses are required', 400)
    }

    // Fetch attempt details to verify ownership and completion status
    const attempt = await prisma.examAttempt.findUnique({
      where: { id: attemptId },
      include: {
        exam: true,
        student: { select: { language: true } },
      },
    })

    if (!attempt) {
      return errorResponse('Exam attempt not found', 404)
    }

    if (attempt.studentId !== user.userId) {
      return errorResponse('Unauthorized. This attempt belongs to another student.', 403)
    }

    if (attempt.completed) {
      return errorResponse('Exam has already been submitted and graded.', 400)
    }

    const studentLang = language || attempt.student.language || 'en'
    const questionsOrder = attempt.questionsOrder as string[]

    // Fetch the correct answers from translations for the questions served in this attempt
    const questions = await prisma.questionMaster.findMany({
      where: { id: { in: questionsOrder } },
      include: {
        translations: true,
      },
    })

    // Calculate score
    let correctAnswersCount = 0
    questions.forEach((q) => {
      const studentAns = responses[q.id]
      if (studentAns) {
        // Find translation for the correct option matching student's language or English fallback
        const trans = q.translations.find(t => t.language === studentLang) ||
                      q.translations.find(t => t.language === 'en') ||
                      q.translations[0]

        if (trans && studentAns.toUpperCase() === trans.correctOption.toUpperCase()) {
          correctAnswersCount++
        }
      }
    })

    const score = correctAnswersCount * attempt.exam.marksPerQuestion
    const submittedAt = new Date()

    // Save and submit attempt
    const updatedAttempt = await prisma.examAttempt.update({
      where: { id: attemptId },
      data: {
        completed: true,
        responses,
        correctAnswers: correctAnswersCount,
        score,
        submittedAt,
        language: studentLang,
      },
    })

    return successResponse({
      message: 'Exam submitted successfully.',
      score: updatedAttempt.score,
      correctAnswers: updatedAttempt.correctAnswers,
      totalQuestions: updatedAttempt.totalQuestions,
      submittedAt: updatedAttempt.submittedAt,
    })
  } catch (error: any) {
    console.error('Submit exam attempt error:', error)
    return errorResponse('Internal server error', 500)
  }
}
