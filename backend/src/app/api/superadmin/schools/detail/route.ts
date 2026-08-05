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

    // Resolve all school IDs matching this school's UDISE number
    const relatedSchools = await prisma.school.findMany({
      where: { udise: school.udise },
      select: { id: true }
    })
    const relatedSchoolIds = relatedSchools.map(s => s.id)

    // Fetch students registered under this school (any language row sharing UDISE)
    const students = await prisma.student.findMany({
      where: { schoolId: { in: relatedSchoolIds } },
      orderBy: { name: 'asc' },
      include: {
        classroom: {
          select: { name: true },
        },
      },
    })

    // Fetch all exams pushed to this school (across any language row matching the UDISE)
    const schoolExams = await prisma.schoolExam.findMany({
      where: { schoolId: { in: relatedSchoolIds } },
      include: {
        exam: {
          select: { id: true, name: true }
        }
      }
    })
    const uniqueExamsMap: Record<string, { id: string; name: string }> = {}
    schoolExams.forEach((se) => {
      if (se.exam) {
        uniqueExamsMap[se.exam.id] = {
          id: se.exam.id,
          name: se.exam.name,
        }
      }
    })
    const formattedExams = Object.values(uniqueExamsMap)

    // Fetch exam attempts under this school (any language row sharing UDISE)
    const attempts = await prisma.examAttempt.findMany({
      where: {
        student: { schoolId: { in: relatedSchoolIds } },
      },
      orderBy: { startedAt: 'desc' },
      include: {
        student: {
          select: {
            name: true,
            classroomId: true,
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
      acceptedTerms: std.acceptedTerms ?? true,
      acceptedTermsAt: std.acceptedTermsAt || std.createdAt,
    }))

    const formattedAttempts = attempts.map((att) => ({
      id: att.id,
      studentName: att.student.name,
      classroomId: att.student.classroomId,
      classroomName: att.student.classroom.name,
      examId: att.examId,
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
      exams: formattedExams,
    })
  } catch (error: any) {
    console.error('Fetch school details error:', error)
    return errorResponse('Internal server error', 500)
  }
}
