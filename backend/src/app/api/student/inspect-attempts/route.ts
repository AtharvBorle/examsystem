import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser, successResponse, errorResponse } from '@/lib/auth-middleware'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const user = getAuthUser(req)
    if (!user) return errorResponse('Unauthenticated', 401)

    const attempts = await prisma.examAttempt.findMany({
      where: { studentId: user.userId },
      include: {
        exam: {
          select: { name: true }
        }
      }
    })

    return successResponse({
      userId: user.userId,
      attemptsCount: attempts.length,
      attempts
    })
  } catch (error: any) {
    return errorResponse(error.message, 500)
  }
}
