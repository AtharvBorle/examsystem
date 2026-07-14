import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser, errorResponse, successResponse } from '@/lib/auth-middleware'

export async function GET(req: NextRequest) {
  try {
    const user = getAuthUser(req)
    if (!user || user.role !== 'STUDENT') {
      return errorResponse('Unauthorized. Student access required.', 401)
    }

    const student = await prisma.student.findUnique({
      where: { id: user.userId },
      select: { approved: true }
    })

    if (!student) {
      return errorResponse('Student not found', 404)
    }

    return successResponse({ approved: student.approved })
  } catch (error: any) {
    console.error('Check student status error:', error)
    return errorResponse('Internal server error', 500)
  }
}
