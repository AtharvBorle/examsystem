import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser, errorResponse, successResponse } from '@/lib/auth-middleware'

export async function POST(req: NextRequest) {
  try {
    const user = getAuthUser(req)
    if (!user || user.role !== 'STUDENT') {
      return errorResponse('Unauthorized. Student access required.', 401)
    }

    const { attemptId, responses } = await req.json()

    if (!attemptId || !responses) {
      return errorResponse('attemptId and responses are required', 400)
    }

    // Fetch attempt details to verify ownership and completion status
    const attempt = await prisma.examAttempt.findUnique({
      where: { id: attemptId },
    })

    if (!attempt) {
      return errorResponse('Exam attempt not found', 404)
    }

    if (attempt.studentId !== user.userId) {
      return errorResponse('Unauthorized. This attempt belongs to another student.', 403)
    }

    if (attempt.completed) {
      return errorResponse('Cannot save progress. Exam has already been completed.', 400)
    }

    // Save student responses
    const updatedAttempt = await prisma.examAttempt.update({
      where: { id: attemptId },
      data: {
        responses,
      },
    })

    return successResponse({
      message: 'Progress saved successfully.',
      responses: updatedAttempt.responses,
    })
  } catch (error: any) {
    console.error('Save exam progress error:', error)
    return errorResponse('Internal server error', 500)
  }
}
