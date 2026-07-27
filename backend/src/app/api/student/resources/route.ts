import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser, errorResponse, successResponse } from '@/lib/auth-middleware'

export const dynamic = 'force-dynamic'

// GET /api/student/resources - Fetch study resources pushed by this student's school admin
export async function GET(req: NextRequest) {
  try {
    const user = getAuthUser(req)
    if (!user || user.role !== 'STUDENT') {
      return errorResponse('Unauthorized. Student access required.', 401)
    }

    // Get student details to identify their school's admin
    const student = await prisma.student.findUnique({
      where: { id: user.userId },
      select: {
        school: {
          select: { adminId: true },
        },
      },
    })

    if (!student || !student.school) {
      return errorResponse('Student or school not found', 404)
    }

    const adminId = student.school.adminId

    const resources = await prisma.resource.findMany({
      where: { adminId },
      orderBy: { createdAt: 'desc' },
    })

    return successResponse({ resources })
  } catch (error: any) {
    console.error('Fetch student resources error:', error)
    return errorResponse('Internal server error', 500)
  }
}
