import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser, errorResponse, successResponse } from '@/lib/auth-middleware'
import { getAccountDeletionGraceDisplayString, getAccountDeletionGraceMinutes } from '@/lib/account-deletion-config'

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

    const displayTime = getAccountDeletionGraceDisplayString()
    const graceMinutes = getAccountDeletionGraceMinutes()

    return successResponse({ 
      success: true, 
      graceMinutes,
      displayTime,
      message: `Account deletion requested successfully. Your account will be permanently deleted after ${displayTime}.` 
    })
  } catch (error: any) {
    console.error('Delete account error:', error)
    return errorResponse('Internal server error', 500)
  }
}
