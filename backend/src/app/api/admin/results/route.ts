import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser, errorResponse, successResponse } from '@/lib/auth-middleware'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const user = getAuthUser(req)
    if (!user || user.role !== 'ADMIN') {
      return errorResponse('Unauthorized. Admin access required.', 401)
    }

    const { searchParams } = new URL(req.url)
    const examId = searchParams.get('examId')
    const schoolId = searchParams.get('schoolId')
    const classroomId = searchParams.get('classroomId')
    const groupId = searchParams.get('groupId')
    const startDate = searchParams.get('startDate') // Date range start
    const endDate = searchParams.get('endDate') // Date range end

    if (!examId) {
      return errorResponse('examId query parameter is required', 400)
    }

    // Build the query where clause
    const where: any = {
      examId,
      completed: true,
    }

    // Filter by date range if provided
    if (startDate || endDate) {
      where.submittedAt = {}
      if (startDate) {
        where.submittedAt.gte = new Date(startDate)
      }
      if (endDate) {
        where.submittedAt.lte = new Date(endDate)
      }
    }

    // Filter by student properties (school, classroom, group)
    const studentWhere: any = {}
    if (schoolId) {
      studentWhere.schoolId = schoolId
    }
    if (classroomId) {
      studentWhere.classroomId = classroomId
    }
    if (groupId) {
      // Find classrooms belonging to this group
      const groupClassrooms = await prisma.groupClassroom.findMany({
        where: { groupId },
        select: { classroomId: true },
      })
      const classroomIds = groupClassrooms.map((gc) => gc.classroomId)
      studentWhere.classroomId = { in: classroomIds }
    }

    if (Object.keys(studentWhere).length > 0) {
      where.student = studentWhere
    }

    // Fetch attempts, sort by score desc, and limit to top 3
    const attempts = await prisma.examAttempt.findMany({
      where,
      orderBy: [
        { score: 'desc' },
        { startedAt: 'asc' }, // Tie breaker: whoever started earlier (or finished faster)
      ],
      take: 3, // CRITICAL: Strict requirement - ONLY top 3 results
      include: {
        student: {
          select: {
            name: true,
            mobile: true,
            district: true,
            tehsil: true,
            school: { select: { name: true, udise: true } },
            classroom: { select: { name: true } },
          },
        },
      },
    })

    const formatted = attempts.map((attempt: any, index) => {
      const durationMs = attempt.submittedAt
        ? new Date(attempt.submittedAt).getTime() - new Date(attempt.startedAt).getTime()
        : 0
      const durationMin = Math.round(durationMs / 60000)

      return {
        rank: index + 1,
        attemptId: attempt.id,
        studentName: attempt.student.name,
        studentMobile: attempt.student.mobile,
        schoolName: attempt.student.school.name,
        udise: attempt.student.school.udise,
        classroomName: attempt.student.classroom.name,
        district: attempt.student.district,
        tehsil: attempt.student.tehsil,
        score: attempt.score,
        correctAnswers: attempt.correctAnswers,
        totalQuestions: attempt.totalQuestions,
        durationMinutes: durationMin,
        submittedAt: attempt.submittedAt,
        language: attempt.language,
      }
    })

    return successResponse({ results: formatted })
  } catch (error: any) {
    console.error('Fetch leaderboard results error:', error)
    return errorResponse('Internal server error', 500)
  }
}
