import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser, errorResponse, successResponse } from '@/lib/auth-middleware'
import { translateClassroomName } from '@/lib/class-translator'
import { upsertSchoolTranslation } from '@/lib/school-translator'

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = getAuthUser(req)
    if (!user) {
      return errorResponse('Unauthorized', 401)
    }

    const attemptId = params.id
    if (!attemptId) {
      return errorResponse('Attempt ID is required', 400)
    }

    const attempt = await prisma.examAttempt.findUnique({
      where: { id: attemptId },
      include: {
        exam: {
          select: { name: true, nameHindi: true },
        },
        student: {
          select: {
            id: true,
            name: true,
            school: {
              select: {
                id: true,
                name: true,
                udise: true,
                language: true,
              },
            },
            classroom: { select: { name: true } },
          },
        },
      },
    })

    if (!attempt) {
      return errorResponse('Exam attempt not found', 404)
    }

    // Security check: Student can only view their own certificate
    if (user.role === 'STUDENT' && attempt.studentId !== user.userId) {
      return errorResponse('Unauthorized. Access denied.', 403)
    }

    if (!attempt.completed) {
      return errorResponse('Certificate is not available yet. The exam is not completed.', 400)
    }

    const currentSchool = attempt.student.school
    let schoolName = currentSchool.name

    const targetLang = attempt.language || 'en'
    if (targetLang !== currentSchool.language) {
      const targetSchool = await prisma.school.findFirst({
        where: {
          udise: currentSchool.udise,
          language: targetLang,
        },
      })
      if (targetSchool) {
        schoolName = targetSchool.name
      }
    }

    const classroomName = translateClassroomName(attempt.student.classroom.name, attempt.language || 'en')

    return successResponse({
      certificate: {
        attemptId: attempt.id,
        studentName: attempt.student.name,
        schoolName,
        classroomName,
        examName: (attempt.language === 'hi' && attempt.exam.nameHindi) ? attempt.exam.nameHindi : attempt.exam.name,
        completedAt: attempt.submittedAt,
        language: attempt.language,
      },
    })
  } catch (error: any) {
    console.error('Fetch certificate info error:', error)
    return errorResponse('Internal server error', 500)
  }
}
