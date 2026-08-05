import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser, errorResponse, successResponse } from '@/lib/auth-middleware'

export const dynamic = 'force-dynamic'

function sortAttemptsByRankCriteria(attempts: any[]) {
  return [...attempts].sort((a, b) => {
    // 1. Marks Obtained – Higher marks (score) receives higher rank (Primary Criteria)
    const scoreA = a.score !== undefined && a.score !== null ? Number(a.score) : 0
    const scoreB = b.score !== undefined && b.score !== null ? Number(b.score) : 0
    if (scoreA !== scoreB) {
      return scoreB - scoreA
    }

    // 2. Exam Completion Time – Shortest duration (submittedAt - startedAt) receives higher rank
    const subA = a.submittedAt ? new Date(a.submittedAt).getTime() : Infinity
    const subB = b.submittedAt ? new Date(b.submittedAt).getTime() : Infinity
    const startA = a.startedAt ? new Date(a.startedAt).getTime() : subA
    const startB = b.startedAt ? new Date(b.startedAt).getTime() : subB
    const durA = Math.max(0, subA - startA)
    const durB = Math.max(0, subB - startB)
    if (durA !== durB) {
      return durA - durB
    }

    // 3. First Submission – Earlier submittedAt timestamp receives higher rank
    return subA - subB
  })
}

export async function GET(req: NextRequest) {
  try {
    const user = getAuthUser(req)
    if (!user || user.role !== 'ADMIN') {
      return errorResponse('Unauthorized. Admin access required.', 401)
    }

    const { searchParams } = new URL(req.url)
    const examId = searchParams.get('examId')
    const schoolId = searchParams.get('schoolId')
    const schoolIds = searchParams.get('schoolIds')
    const classroomId = searchParams.get('classroomId')
    const groupId = searchParams.get('groupId')
    const startDate = searchParams.get('startDate') // Date range start
    const endDate = searchParams.get('endDate') // Date range end

    if (!examId) {
      return errorResponse('examId query parameter is required', 400)
    }

    const language = searchParams.get('language') || 'en'

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

    if (schoolIds) {
      if (schoolIds !== 'all' && schoolIds.trim() !== '') {
        const ids = schoolIds.split(',').map(s => s.trim()).filter(Boolean)
        if (ids.length > 0) {
          // Resolve all school IDs matching the UDISEs of the selected school IDs
          const schools = await prisma.school.findMany({
            where: { id: { in: ids } },
            select: { udise: true }
          })
          const udises = schools.map(s => s.udise)
          const allMatchingSchools = await prisma.school.findMany({
            where: { udise: { in: udises } },
            select: { id: true }
          })
          studentWhere.schoolId = { in: allMatchingSchools.map(s => s.id) }
        }
      }
    } else if (schoolId && schoolId !== 'all') {
      const schoolObj = await prisma.school.findUnique({
        where: { id: schoolId },
        select: { udise: true }
      })
      if (schoolObj) {
        const matchingSchools = await prisma.school.findMany({
          where: { udise: schoolObj.udise },
          select: { id: true }
        })
        studentWhere.schoolId = { in: matchingSchools.map(s => s.id) }
      }
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

    // Fetch all completed attempts matching the applied filters
    const attempts = await prisma.examAttempt.findMany({
      where,
      include: {
        student: {
          select: {
            name: true,
            mobile: true,
            district: true,
            tehsil: true,
            schoolId: true,
            school: { select: { id: true, name: true, udise: true } },
            classroom: { select: { name: true } },
          },
        },
      },
    })

    // Fetch the school names in the requested language
    const attemptSchoolUdises = Array.from(new Set(attempts.map(att => att.student.school?.udise).filter(Boolean))) as string[]
    const schoolsInTargetLang = await prisma.school.findMany({
      where: {
        udise: { in: attemptSchoolUdises },
        language
      },
      select: { udise: true, name: true }
    })
    const schoolNameMap: Record<string, string> = {}
    schoolsInTargetLang.forEach(s => {
      schoolNameMap[s.udise] = s.name
    })

    // Sort ALL matching attempts globally by ranking criteria
    const sortedAttempts = sortAttemptsByRankCriteria(attempts)

    // Assign global sequential ranking (1st, 2nd, 3rd, 4th, 5th...) across all queried rows
    const formatted = sortedAttempts.map((attempt: any, index: number) => {
      const durationMs = attempt.submittedAt
        ? new Date(attempt.submittedAt).getTime() - new Date(attempt.startedAt).getTime()
        : 0
      const durationMin = Math.round(durationMs / 60000)

      const udise = attempt.student.school?.udise || ''
      const targetSchoolName = schoolNameMap[udise] || attempt.student.school?.name || ''

      return {
        rank: index + 1,
        attemptId: attempt.id,
        studentName: attempt.student.name,
        studentMobile: attempt.student.mobile,
        schoolName: targetSchoolName,
        udise,
        classroomName: attempt.student.classroom?.name || '',
        district: attempt.student.district || '',
        tehsil: attempt.student.tehsil || '',
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
