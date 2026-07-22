import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser, errorResponse, successResponse } from '@/lib/auth-middleware'
import { translateCategoryName } from '@/lib/category-translator'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const user = getAuthUser(req)
    if (!user || user.role !== 'STUDENT') {
      return errorResponse('Unauthorized. Student access required.', 401)
    }

    // Fetch student's school, classroom, and language preference
    const student = await prisma.student.findUnique({
      where: { id: user.userId },
      select: { schoolId: true, classroomId: true, language: true, approved: true },
    })

    if (!student) {
      return errorResponse('Student not found', 404)
    }

    if (!student.approved) {
      return errorResponse('Registration pending approval.', 403)
    }

    const studentLang = student.language || 'en'

    // Find all groups that contain this student's classroom
    const studentGroups = await prisma.groupClassroom.findMany({
      where: { classroomId: student.classroomId },
      select: { groupId: true },
    })
    const groupIds = studentGroups.map((g) => g.groupId)

    // Find all school IDs sharing the same UDISE number as the student's school
    const studentSchool = await prisma.school.findUnique({
      where: { id: student.schoolId },
      select: { udise: true }
    })
    
    let relatedSchoolIds: string[] = [student.schoolId]
    if (studentSchool) {
      const relatedSchools = await prisma.school.findMany({
        where: { udise: studentSchool.udise },
        select: { id: true }
      })
      relatedSchoolIds = relatedSchools.map(s => s.id)
    }

    // Find exams pushed to student's school (any language row sharing UDISE) AND targeted at one of student's groups
    const exams = await prisma.exam.findMany({
      where: {
        schools: {
          some: { schoolId: { in: relatedSchoolIds } },
        },
        groups: {
          some: { groupId: { in: groupIds } },
        },
      },
      orderBy: { createdAt: 'desc' },
      include: {
        category: { select: { name: true } },
        subcategory: { select: { name: true } },
        schools: {
          where: { schoolId: { in: relatedSchoolIds } },
          select: { pushedAt: true },
        },
        // Include only this student's attempts
        attempts: {
          where: { studentId: user.userId },
          select: { id: true, completed: true, score: true, startedAt: true },
        },
      },
    })

    const formatted = exams.map((exam) => {
      const studentAttempt = exam.attempts[0] || null
      const examName = (studentLang === 'hi' && exam.nameHindi) ? exam.nameHindi : exam.name
      const schoolExam = exam.schools[0]
      const pushedAt = schoolExam?.pushedAt || exam.createdAt
      return {
        id: exam.id,
        name: examName,
        categoryName: translateCategoryName(exam.category.name, studentLang),
        subcategoryName: exam.subcategory?.name ? translateCategoryName(exam.subcategory.name, studentLang) : null,
        duration: exam.duration,
        questionCount: exam.questionCount,
        marksPerQuestion: exam.marksPerQuestion,
        totalMarks: exam.questionCount * exam.marksPerQuestion,
        attemptStatus: studentAttempt
          ? studentAttempt.completed
            ? 'COMPLETED'
            : 'IN_PROGRESS'
          : 'NOT_STARTED',
        attemptId: studentAttempt?.id || null,
        startedAt: studentAttempt?.startedAt || null,
        pushedAt: pushedAt,
        createdAt: exam.createdAt,
      }
    })

    return successResponse({ exams: formatted })
  } catch (error: any) {
    console.error('List student exams error:', error)
    return errorResponse('Internal server error', 500)
  }
}
