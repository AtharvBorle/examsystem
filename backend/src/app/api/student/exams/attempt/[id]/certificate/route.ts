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
            district: true,
            tehsil: true,
            school: {
              select: {
                id: true,
                name: true,
                udise: true,
                language: true,
                admin: {
                  select: {
                    branch: true,
                    branchHindi: true,
                    presidentName: true,
                    presidentNameHindi: true,
                    presidentSignature: true,
                    secretaryName: true,
                    secretaryNameHindi: true,
                    secretarySignature: true,
                  }
                }
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

    const { searchParams } = new URL(req.url)
    const queryLang = searchParams.get('lang')
    const targetLang = queryLang || attempt.language || 'en'

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

    const classroomName = translateClassroomName(attempt.student.classroom.name, targetLang)

    return successResponse({
      certificate: {
        attemptId: attempt.id,
        studentName: attempt.student.name,
        schoolName,
        classroomName,
        examName: (targetLang === 'hi' && attempt.exam.nameHindi) ? attempt.exam.nameHindi : attempt.exam.name,
        completedAt: attempt.submittedAt,
        language: targetLang,
        district: attempt.student.district,
        tehsil: attempt.student.tehsil,
        branch: (targetLang === 'hi' && attempt.student.school.admin.branchHindi)
          ? attempt.student.school.admin.branchHindi
          : (attempt.student.school.admin.branch || ''),
        presidentName: (targetLang === 'hi' && attempt.student.school.admin.presidentNameHindi)
          ? attempt.student.school.admin.presidentNameHindi
          : (attempt.student.school.admin.presidentName || ''),
        presidentSignature: attempt.student.school.admin.presidentSignature || '',
        secretaryName: (targetLang === 'hi' && attempt.student.school.admin.secretaryNameHindi)
          ? attempt.student.school.admin.secretaryNameHindi
          : (attempt.student.school.admin.secretaryName || ''),
        secretarySignature: attempt.student.school.admin.secretarySignature || '',
      },
    })
  } catch (error: any) {
    console.error('Fetch certificate info error:', error)
    return errorResponse('Internal server error', 500)
  }
}
