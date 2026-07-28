import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser, errorResponse, successResponse } from '@/lib/auth-middleware'

export async function POST(req: NextRequest) {
  try {
    const user = getAuthUser(req)
    if (!user || user.role !== 'STUDENT') {
      return errorResponse('Unauthorized. Student access required.', 401)
    }

    await prisma.student.update({
      where: { id: user.userId },
      data: {
        deletedAt: new Date()
      }
    })

    return successResponse({ success: true, message: 'Account deletion requested successfully. Your account will be permanently deleted after 30 days.' })
  } catch (error: any) {
    console.error('Delete account error:', error)
    return errorResponse('Internal server error', 500)
  }
}
