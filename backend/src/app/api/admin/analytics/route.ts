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
    const schoolIdParam = searchParams.get('schoolId')
    const classroomIdParam = searchParams.get('classroomId')

    // Fetch schools managed by this Admin to verify ownership and for filter options
    // Fetch schools managed by this Admin to verify ownership and for filter options
    const allSchoolsEn = await prisma.school.findMany({
      where: { adminId: user.userId, language: 'en' },
      select: { id: true, name: true, udise: true }
    })
    const allSchoolIdsEn = allSchoolsEn.map((s) => s.id)

    if (allSchoolIdsEn.length === 0) {
      return successResponse({
        stats: { schools: 0, classrooms: 0, exams: 0, students: 0, attempts: 0, avgScore: 0 },
        registrationTrend: [],
        examPerformance: [],
        scoreDistribution: { excellent: 0, good: 0, average: 0, poor: 0 },
        classroomPerformance: [],
        filterOptions: { schools: [], classrooms: [] }
      })
    }

    // Determine active UDISE numbers
    let activeUdises = allSchoolsEn.map(s => s.udise)
    if (schoolIdParam) {
      const selectedSchool = allSchoolsEn.find(s => s.id === schoolIdParam)
      if (!selectedSchool) {
        return errorResponse('Unauthorized access to this school', 403)
      }
      activeUdises = [selectedSchool.udise]
    }

    // Resolve all school IDs (both English and Hindi rows) matching active UDISE numbers
    const activeSchoolsObj = await prisma.school.findMany({
      where: { udise: { in: activeUdises } },
      select: { id: true }
    })
    const activeSchoolIds = activeSchoolsObj.map(s => s.id)

    // Fetch classrooms under these active schools for filter options and queries
    const allClassrooms = await prisma.classroom.findMany({
      where: {
        schools: {
          some: {
            schoolId: { in: activeSchoolIds }
          }
        }
      },
      select: { id: true, name: true }
    })

    // Basic Stats
    const classroomsCount = await prisma.classroom.count({
      where: {
        ...(classroomIdParam ? { id: classroomIdParam } : {}),
        schools: {
          some: {
            schoolId: { in: activeSchoolIds }
          }
        }
      }
    })

    const examsCount = await prisma.exam.count({
      where: {
        schools: {
          some: {
            schoolId: { in: activeSchoolIds }
          }
        }
      }
    })

    const studentsCount = await prisma.student.count({
      where: {
        schoolId: { in: activeSchoolIds },
        ...(classroomIdParam ? { classroomId: classroomIdParam } : {})
      }
    })

    // Fetch exam attempts
    const attempts = await prisma.examAttempt.findMany({
      where: {
        completed: true,
        student: {
          schoolId: { in: activeSchoolIds },
          ...(classroomIdParam ? { classroomId: classroomIdParam } : {})
        }
      },
      include: {
        exam: {
          select: { name: true, marksPerQuestion: true, questionCount: true }
        }
      }
    })

    // Calculate score ranges and averages
    let totalScoreSum = 0
    let totalScoreCount = 0
    let excellent = 0
    let good = 0
    let average = 0
    let poor = 0

    const examStatsMap: Record<string, { name: string; sum: number; count: number }> = {}

    attempts.forEach((att) => {
      const totalMarks = (att.exam.marksPerQuestion || 2) * (att.exam.questionCount || 50)
      const percentage = totalMarks > 0 ? (att.score / totalMarks) * 100 : 0

      totalScoreSum += att.score
      totalScoreCount++

      if (percentage >= 80) excellent++
      else if (percentage >= 60) good++
      else if (percentage >= 40) average++
      else poor++

      const examKey = att.examId
      if (!examStatsMap[examKey]) {
        examStatsMap[examKey] = { name: att.exam.name, sum: 0, count: 0 }
      }
      examStatsMap[examKey].sum += att.score
      examStatsMap[examKey].count++
    })

    const avgScore = totalScoreCount > 0 ? Math.round((totalScoreSum / totalScoreCount) * 10) / 10 : 0

    const examPerformance = Object.values(examStatsMap).map((item) => ({
      name: item.name,
      avgScore: Math.round((item.sum / item.count) * 10) / 10,
      attempts: item.count,
    }))

    // Registration Trend (Last 7 Days)
    const trendDays = 7
    const registrationTrend = []
    for (let i = trendDays - 1; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const dateStr = d.toISOString().split('T')[0] // YYYY-MM-DD
      const dateStart = new Date(dateStr + 'T00:00:00.000Z')
      const dateEnd = new Date(dateStr + 'T23:59:59.999Z')

      const count = await prisma.student.count({
        where: {
          schoolId: { in: activeSchoolIds },
          ...(classroomIdParam ? { classroomId: classroomIdParam } : {}),
          createdAt: {
            gte: dateStart,
            lte: dateEnd
          }
        }
      })

      const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      registrationTrend.push({ date: label, count })
    }

    // Classroom performance breakdown
    const classrooms = await prisma.classroom.findMany({
      where: {
        ...(classroomIdParam ? { id: classroomIdParam } : {}),
        schools: {
          some: {
            schoolId: { in: activeSchoolIds }
          }
        }
      },
      include: {
        students: {
          where: {
            schoolId: { in: activeSchoolIds }
          },
          include: {
            attempts: {
              where: { completed: true }
            }
          }
        }
      }
    })

    const classroomPerformance = classrooms.map((cls: any) => {
      let sum = 0
      let count = 0
      cls.students.forEach((std: any) => {
        std.attempts.forEach((att: any) => {
          sum += att.score
          count++
        })
      })

      return {
        name: cls.name,
        studentsCount: cls.students.length,
        attemptsCount: count,
        avgScore: count > 0 ? Math.round((sum / count) * 10) / 10 : 0
      }
    })

    return successResponse({
      stats: {
        schools: activeSchoolIds.length,
        classrooms: classroomsCount,
        exams: examsCount,
        students: studentsCount,
        attempts: totalScoreCount,
        avgScore,
      },
      registrationTrend,
      examPerformance,
      scoreDistribution: { excellent, good, average, poor },
      classroomPerformance,
      filterOptions: {
        schools: allSchoolsEn.map(s => ({ id: s.id, name: s.name })),
        classrooms: allClassrooms
      }
    })
  } catch (error: any) {
    console.error('Fetch admin analytics error:', error)
    return errorResponse('Internal server error', 500)
  }
}
