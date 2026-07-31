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

    const student = await prisma.student.findUnique({
      where: { id: user.userId },
      select: { id: true, deletedAt: true, name: true }
    })

    if (!student || student.name === 'Anonymized User') {
      return errorResponse('Student account not found or has already been deleted.', 404)
    }

    const displayTime = getAccountDeletionGraceDisplayString()
    const graceMinutes = getAccountDeletionGraceMinutes()

    if (student.deletedAt) {
      return successResponse({
        success: true,
        alreadyRequested: true,
        graceMinutes,
        displayTime,
        message: `Account deletion has already been requested. Your account will be permanently deleted after ${displayTime}.`
      })
    }

    await prisma.student.update({
      where: { id: user.userId },
      data: {
        deletedAt: new Date()
      }
    })

    return successResponse({ 
      success: true, 
      graceMinutes,
      displayTime,
      message: `Account deletion requested successfully. Your account will be permanently deleted after ${displayTime}.` 
    })
  } catch (error: any) {
    if (error.code === 'P2025') {
      return errorResponse('Student account not found or has already been deleted.', 404)
    }
    console.error('Delete account error:', error)
    return errorResponse('Internal server error', 500)
  }
}
