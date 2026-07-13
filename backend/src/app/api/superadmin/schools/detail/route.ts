import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser, errorResponse, successResponse } from '@/lib/auth-middleware'

export async function GET(req: NextRequest) {
  try {
    const user = getAuthUser(req)
    if (!user || user.role !== 'SUPER_ADMIN') {
      return errorResponse('Unauthorized. Super-Admin access required.', 401)
    }

    const { searchParams } = new URL(req.url)
    const schoolId = searchParams.get('schoolId')
    const udise = searchParams.get('udise')

    if (!schoolId && !udise) {
      return errorResponse('schoolId or udise query parameter is required', 400)
    }

    // Fetch school metadata
    const school = await prisma.school.findFirst({
      where: {
        OR: [
          schoolId ? { id: schoolId } : {},
          udise ? { udise: udise } : {},
          schoolId ? { udise: schoolId } : {},
        ].filter(cond => Object.keys(cond).length > 0)
      },
      include: {
        admin: {
          select: { email: true, mobile: true },
        },
      },
    })

    if (!school) {
      return errorResponse('School not found', 404)
    }

    // Fetch students registered under this school
    const students = await prisma.student.findMany({
      where: { schoolId: school.id },
      orderBy: { name: 'asc' },
      include: {
        classroom: {
          select: { name: true },
        },
      },
    })

    // Fetch exam attempts under this school
    const attempts = await prisma.examAttempt.findMany({
      where: {
        student: { schoolId: school.id },
      },
      orderBy: { startedAt: 'desc' },
      include: {
        student: {
          select: {
            name: true,
            classroom: { select: { name: true } },
          },
        },
        exam: {
          select: { name: true },
        },
      },
    })

    const formattedStudents = students.map((std) => ({
      id: std.id,
      name: std.name,
      mobile: std.mobile,
      classroomName: std.classroom.name,
      district: std.district,
      tehsil: std.tehsil,
      registeredAt: std.createdAt,
    }))

    const formattedAttempts = attempts.map((att) => ({
      id: att.id,
      studentName: att.student.name,
      classroomName: att.student.classroom.name,
      examName: att.exam.name,
      score: att.score,
      completed: att.completed,
      startedAt: att.startedAt,
      submittedAt: att.submittedAt,
    }))

    return successResponse({
      school: {
        id: school.id,
        name: school.name,
        udise: school.udise,
        adminEmail: school.admin.email,
        adminMobile: school.admin.mobile,
      },
      students: formattedStudents,
      attempts: formattedAttempts,
    })
  } catch (error: any) {
    console.error('Fetch school details error:', error)
    return errorResponse('Internal server error', 500)
  }
}
