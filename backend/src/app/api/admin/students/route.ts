import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser, errorResponse, successResponse } from '@/lib/auth-middleware'
import { translateClassroomName } from '@/lib/class-translator'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const user = getAuthUser(req)
    if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN')) {
      return errorResponse('Unauthorized. Admin or Super-Admin access required.', 401)
    }

    const { searchParams } = new URL(req.url)
    const schoolIdParam = searchParams.get('schoolId')
    const classroomIdParam = searchParams.get('classroomId')
    const exportAll = searchParams.get('all') === 'true'
    const targetLang = searchParams.get('language') || 'en'

    let allowedSchoolIds: string[] | null = null

    // If regular Admin, restrict to schools owned / managed by this admin
    if (user.role === 'ADMIN') {
      const adminSchools = await prisma.school.findMany({
        where: { adminId: user.userId },
        select: { id: true, udise: true }
      })
      const adminUdises = Array.from(new Set(adminSchools.map(s => s.udise).filter(Boolean))) as string[]

      if (adminUdises.length === 0 && adminSchools.length === 0) {
        return successResponse({ students: [], total: 0 })
      }

      // Include all localized versions sharing the same UDISE
      const allMatchingSchools = await prisma.school.findMany({
        where: {
          OR: [
            { adminId: user.userId },
            { udise: { in: adminUdises } }
          ]
        },
        select: { id: true }
      })
      allowedSchoolIds = allMatchingSchools.map(s => s.id)
    }

    // Build the query filter
    const where: any = {}

    if (allowedSchoolIds) {
      where.schoolId = { in: allowedSchoolIds }
    }

    // Apply specific school filter if requested and not "all"
    if (!exportAll && schoolIdParam && schoolIdParam !== 'all') {
      const selectedSchool = await prisma.school.findUnique({
        where: { id: schoolIdParam },
        select: { udise: true }
      })
      if (selectedSchool) {
        const relatedSchools = await prisma.school.findMany({
          where: { udise: selectedSchool.udise },
          select: { id: true }
        })
        const relatedIds = relatedSchools.map(s => s.id)
        if (allowedSchoolIds) {
          where.schoolId = { in: relatedIds.filter(id => allowedSchoolIds!.includes(id)) }
        } else {
          where.schoolId = { in: relatedIds }
        }
      }
    }

    // Apply specific classroom filter if requested
    if (!exportAll && classroomIdParam && classroomIdParam !== 'all') {
      where.classroomId = classroomIdParam
    }

    // Fetch all matching students with school, classroom, admin, and exam attempts
    const students = await prisma.student.findMany({
      where,
      orderBy: [
        { createdAt: 'desc' }
      ],
      include: {
        school: {
          include: {
            admin: {
              select: {
                email: true,
                mobile: true,
                branch: true,
                branchHindi: true
              }
            }
          }
        },
        classroom: true,
        attempts: {
          orderBy: { startedAt: 'desc' },
          include: {
            exam: {
              select: {
                id: true,
                name: true,
                nameHindi: true,
                questionCount: true,
                marksPerQuestion: true
              }
            }
          }
        }
      }
    })

    // Pre-fetch localized school names for the target language
    const udises = Array.from(new Set(students.map(s => s.school?.udise).filter(Boolean))) as string[]
    const localizedSchools = await prisma.school.findMany({
      where: {
        udise: { in: udises },
        language: targetLang
      },
      select: { udise: true, name: true }
    })
    const localizedSchoolMap = new Map<string, string>()
    localizedSchools.forEach(s => {
      localizedSchoolMap.set(s.udise, s.name)
    })

    const formatted = students.map((std, index) => {
      // Find completed attempt, or latest in-progress attempt
      const completedAttempt = std.attempts.find(a => a.completed)
      const primaryAttempt = completedAttempt || std.attempts[0] || null

      const udise = std.school?.udise || ''
      const schoolName = localizedSchoolMap.get(udise) || std.school?.name || ''
      const classroomName = std.classroom?.name ? translateClassroomName(std.classroom.name, targetLang) : ''

      const branchName = targetLang === 'hi'
        ? (std.school?.admin?.branchHindi || std.school?.admin?.branch || '')
        : (std.school?.admin?.branch || '')

      let examStatus = 'Not Attempted'
      let examName = ''
      let scoreText = 'N/A'
      let correctAnswersText = 'N/A'
      let totalQuestionsText = 'N/A'
      let totalMarksText = 'N/A'
      let attemptDateTime = 'N/A'

      if (primaryAttempt) {
        examName = (targetLang === 'hi' && primaryAttempt.exam?.nameHindi)
          ? primaryAttempt.exam.nameHindi
          : (primaryAttempt.exam?.name || '')
        
        if (primaryAttempt.completed) {
          examStatus = 'Completed'
          scoreText = String(primaryAttempt.score ?? 0)
          correctAnswersText = String(primaryAttempt.correctAnswers ?? 0)
        } else {
          examStatus = 'In Progress'
          scoreText = 'In Progress'
          correctAnswersText = 'In Progress'
        }

        const totalQ = primaryAttempt.totalQuestions || primaryAttempt.exam?.questionCount || 0
        const marksPerQ = primaryAttempt.exam?.marksPerQuestion || 0
        totalQuestionsText = totalQ > 0 ? String(totalQ) : 'N/A'
        totalMarksText = (totalQ > 0 && marksPerQ > 0) ? String(totalQ * marksPerQ) : 'N/A'

        const dateToFormat = primaryAttempt.submittedAt || primaryAttempt.startedAt
        attemptDateTime = dateToFormat ? new Date(dateToFormat).toLocaleString() : 'N/A'
      }

      return {
        srNo: index + 1,
        id: std.id,
        name: std.name,
        mobile: std.mobile,
        schoolName,
        udise,
        classroomName,
        district: std.district || std.school?.district || '',
        tehsil: std.tehsil || std.school?.tehsil || '',
        language: std.language === 'hi' ? 'Hindi' : 'English',
        approved: std.approved ? 'Approved' : 'Pending Approval',
        accountStatus: std.deletedAt ? 'Deleted' : 'Active',
        registeredAt: std.createdAt ? new Date(std.createdAt).toLocaleString() : '',
        acceptedTerms: std.acceptedTerms ? 'Yes' : 'No',
        branch: branchName,
        totalAttempts: std.attempts.length,
        examName,
        examStatus,
        score: scoreText,
        correctAnswers: correctAnswersText,
        totalQuestions: totalQuestionsText,
        totalMarks: totalMarksText,
        attemptDateTime,
      }
    })

    return successResponse({
      students: formatted,
      total: formatted.length
    })
  } catch (error: any) {
    console.error('Fetch all students for admin error:', error)
    return errorResponse('Internal server error', 500)
  }
}
