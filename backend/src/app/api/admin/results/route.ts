import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser, errorResponse, successResponse } from '@/lib/auth-middleware'

export const dynamic = 'force-dynamic'

function sortAttemptsByRankCriteria(attempts: any[]) {
  return [...attempts].sort((a, b) => {
    // 1. First Submission – Earlier submittedAt timestamp receives higher rank
    const subA = a.submittedAt ? new Date(a.submittedAt).getTime() : Infinity
    const subB = b.submittedAt ? new Date(b.submittedAt).getTime() : Infinity
    if (subA !== subB) {
      return subA - subB
    }

    // 2. Exam Completion Time – Shortest duration (submittedAt - startedAt) receives higher rank
    const startA = a.startedAt ? new Date(a.startedAt).getTime() : subA
    const startB = b.startedAt ? new Date(b.startedAt).getTime() : subB
    const durA = Math.max(0, subA - startA)
    const durB = Math.max(0, subB - startB)
    if (durA !== durB) {
      return durA - durB
    }

    // 3. Marks Obtained – Higher marks (score) receives higher rank
    const scoreA = a.score !== undefined && a.score !== null ? Number(a.score) : 0
    const scoreB = b.score !== undefined && b.score !== null ? Number(b.score) : 0
    return scoreB - scoreA
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

    // Multi-school handling
    let isMultiSchoolMode = false
    if (schoolIds) {
      isMultiSchoolMode = true
      if (schoolIds !== 'all' && schoolIds.trim() !== '') {
        const ids = schoolIds.split(',').map(s => s.trim()).filter(Boolean)
        if (ids.length > 0) {
          studentWhere.schoolId = { in: ids }
        }
      }
    } else if (schoolId === 'all') {
      isMultiSchoolMode = true
    } else if (schoolId) {
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

    if (isMultiSchoolMode) {
      // Fetch completed attempts across all selected schools
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

      // Group attempts by schoolId
      const schoolGroupsMap = new Map<string, any[]>()
      for (const attempt of attempts) {
        const sId = attempt.student.schoolId || 'unknown'
        if (!schoolGroupsMap.has(sId)) {
          schoolGroupsMap.set(sId, [])
        }
        schoolGroupsMap.get(sId)!.push(attempt)
      }

      // Sort each school's attempts by criteria and take top 3
      for (const [sId, sAttempts] of schoolGroupsMap.entries()) {
        const sorted = sortAttemptsByRankCriteria(sAttempts)
        schoolGroupsMap.set(sId, sorted.slice(0, 3))
      }

      // Sort schools by school name alphabetically
      const sortedSchoolEntries = Array.from(schoolGroupsMap.entries()).sort((a, b) => {
        const nameA = a[1][0]?.student?.school?.name || ''
        const nameB = b[1][0]?.student?.school?.name || ''
        return nameA.localeCompare(nameB)
      })

      const formatted: any[] = []
      for (const [_, schoolAttempts] of sortedSchoolEntries) {
        schoolAttempts.forEach((attempt: any, index: number) => {
          const durationMs = attempt.submittedAt
            ? new Date(attempt.submittedAt).getTime() - new Date(attempt.startedAt).getTime()
            : 0
          const durationMin = Math.round(durationMs / 60000)

          formatted.push({
            rank: index + 1,
            attemptId: attempt.id,
            studentName: attempt.student.name,
            studentMobile: attempt.student.mobile,
            schoolName: attempt.student.school?.name || '',
            udise: attempt.student.school?.udise || '',
            classroomName: attempt.student.classroom?.name || '',
            district: attempt.student.district || '',
            tehsil: attempt.student.tehsil || '',
            score: attempt.score,
            correctAnswers: attempt.correctAnswers,
            totalQuestions: attempt.totalQuestions,
            durationMinutes: durationMin,
            submittedAt: attempt.submittedAt,
            language: attempt.language,
          })
        })
      }

      return successResponse({ results: formatted })
    } else {
      // Single school or standard top 3 query
      const attempts = await prisma.examAttempt.findMany({
        where,
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

      const sortedAttempts = sortAttemptsByRankCriteria(attempts)
      const top3 = sortedAttempts.slice(0, 3)

      const formatted = top3.map((attempt: any, index) => {
        const durationMs = attempt.submittedAt
          ? new Date(attempt.submittedAt).getTime() - new Date(attempt.startedAt).getTime()
          : 0
        const durationMin = Math.round(durationMs / 60000)

        return {
          rank: index + 1,
          attemptId: attempt.id,
          studentName: attempt.student.name,
          studentMobile: attempt.student.mobile,
          schoolName: attempt.student.school?.name || '',
          udise: attempt.student.school?.udise || '',
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
    }
  } catch (error: any) {
    console.error('Fetch leaderboard results error:', error)
    return errorResponse('Internal server error', 500)
  }
}
