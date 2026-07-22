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
    const totalSchools = await prisma.school.count()
    const totalStudents = await prisma.student.count()
    const totalAttempts = await prisma.examAttempt.count()

    // Fetch schools with details (admin name, students count, exams count, attempts count)
    const schools = await prisma.school.findMany({
      where: { language: 'en' },
      include: {
        admin: {
          select: { email: true },
        },
        students: {
          select: { id: true },
        },
        exams: {
          select: { examId: true },
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
        studentsCount: school.students.length,
        examsCount: school.exams.length,
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
