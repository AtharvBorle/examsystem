import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser, errorResponse, successResponse } from '@/lib/auth-middleware'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const user = getAuthUser(req)
    if (!user || user.role !== 'SUPER_ADMIN') {
      return errorResponse('Unauthorized. Super-Admin access required.', 401)
    }

    const totalAdmins = await prisma.admin.count()
    const distinctSchools = await prisma.school.groupBy({ by: ['udise'] })
    const totalSchools = distinctSchools.length
    const totalStudents = await prisma.student.count()
    const totalAttempts = await prisma.examAttempt.count()

    const { searchParams } = new URL(req.url)
    const language = searchParams.get('language') || 'en'

    // Check if there are any schools seeded in the target language
    const hasTargetLangSchools = await prisma.school.count({
      where: { language }
    })

    const targetQueryLang = hasTargetLangSchools > 0 ? language : 'en'

    // Fetch student UDISE counts
    const studentsWithUdise = await prisma.student.findMany({
      select: {
        school: {
          select: { udise: true }
        }
      }
    })
    const udiseCountMap: Record<string, number> = {}
    studentsWithUdise.forEach(std => {
      const udise = std.school?.udise
      if (udise) {
        udiseCountMap[udise] = (udiseCountMap[udise] || 0) + 1
      }
    })

    // Fetch school exam UDISE mappings (to resolve language-independent exam counts)
    const schoolExams = await prisma.schoolExam.findMany({
      select: {
        school: {
          select: { udise: true }
        },
        examId: true
      }
    })
    const udiseExamsMap: Record<string, Set<string>> = {}
    schoolExams.forEach(se => {
      const udise = se.school?.udise
      if (udise) {
        if (!udiseExamsMap[udise]) {
          udiseExamsMap[udise] = new Set()
        }
        udiseExamsMap[udise].add(se.examId)
      }
    })

    // Fetch schools with details (admin name)
    const schools = await prisma.school.findMany({
      where: { language: targetQueryLang },
      include: {
        admin: {
          select: { email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    const formattedSchools = schools.map((school) => {
      return {
        id: school.id,
        name: school.name,
        udise: school.udise,
        tehsil: school.tehsil,
        district: school.district,
        adminEmail: school.admin.email,
        studentsCount: udiseCountMap[school.udise] || 0,
        examsCount: udiseExamsMap[school.udise]?.size || 0,
      }
    })

    // Sort schools alphabetically by name
    formattedSchools.sort((a, b) => a.name.localeCompare(b.name))

    // Fetch recent attempts across the system
    const recentAttempts = await prisma.examAttempt.findMany({
      take: 10,
      orderBy: { startedAt: 'desc' },
      include: {
        student: {
          select: {
            name: true,
            school: {
              select: {
                id: true,
                name: true,
              }
            },
          },
        },
        exam: {
          select: { name: true },
        },
      },
    })

    const formattedAttempts = recentAttempts.map((attempt) => ({
      id: attempt.id,
      studentName: attempt.student.name,
      schoolName: attempt.student.school.name,
      examName: attempt.exam.name,
      score: attempt.score,
      completed: attempt.completed,
      startedAt: attempt.startedAt,
      submittedAt: attempt.submittedAt,
    }))

    return successResponse({
      stats: {
        totalAdmins,
        totalSchools,
        totalStudents,
        totalAttempts,
      },
      schools: formattedSchools,
      recentAttempts: formattedAttempts,
    })
  } catch (error: any) {
    console.error('Super-Admin dashboard error:', error)
    return errorResponse('Internal server error', 500)
  }
}
