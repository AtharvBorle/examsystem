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

    const { searchParams } = new URL(req.url)
    const adminId = searchParams.get('adminId')

    if (!adminId) {
      return errorResponse('adminId query parameter is required', 400)
    }

    // Fetch complete Admin profile
    const admin = await prisma.admin.findUnique({
      where: { id: adminId },
      include: {
        schools: {
          include: {
            students: {
              include: {
                classroom: { select: { name: true } },
              },
            },
          },
        },
        classrooms: true,
        categories: true,
        groups: {
          include: {
            classrooms: {
              include: { classroom: { select: { name: true } } },
            },
          },
        },
        exams: {
          include: {
            questions: {
              include: {
                questionMaster: {
                  include: {
                    translations: true,
                  },
                },
              },
            },
            groups: {
              include: {
                group: { select: { name: true } },
              },
            },
            schools: {
              include: {
                school: { select: { name: true } },
              },
            },
          },
        },
        resources: true,
        questionMasters: true,
      },
    })

    if (!admin) {
      return errorResponse('Admin not found', 404)
    }

    // Fetch all exam attempts associated with this admin's schools or exams
    const attempts = await prisma.examAttempt.findMany({
      where: {
        OR: [
          { student: { school: { adminId: admin.id } } },
          { exam: { adminId: admin.id } },
        ],
      },
      orderBy: { startedAt: 'desc' },
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
        exam: {
          select: { name: true },
        },
      },
    })

    // Format Admin Details
    const formattedAdmin = {
      id: admin.id,
      email: admin.email,
      mobile: admin.mobile,
      branch: admin.branch || '',
      branchHindi: admin.branchHindi || '',
      userCountLimit: admin.userCountLimit ?? 'Unlimited',
      userCountUsed: admin.userCountUsed,
      presidentName: admin.presidentName || '',
      secretaryName: admin.secretaryName || '',
      createdAt: admin.createdAt,
    }

    // Format Schools
    const formattedSchools = admin.schools.map((s) => ({
      id: s.id,
      name: s.name,
      udise: s.udise,
      tehsil: s.tehsil || '',
      district: s.district || '',
      language: s.language,
      studentsCount: s.students.length,
      createdAt: s.createdAt,
    }))

    // Format Classrooms
    const formattedClassrooms = admin.classrooms.map((c) => ({
      id: c.id,
      name: c.name,
      createdAt: c.createdAt,
    }))

    // Format Categories
    const formattedCategories = admin.categories.map((cat) => ({
      id: cat.id,
      name: cat.name,
      createdAt: cat.createdAt,
    }))

    // Format Groups
    const formattedGroups = admin.groups.map((g) => ({
      id: g.id,
      name: g.name,
      classrooms: g.classrooms.map((gc) => gc.classroom.name).join(', '),
      createdAt: g.createdAt,
    }))

    // Format Exams
    const formattedExams = admin.exams.map((ex) => ({
      id: ex.id,
      name: ex.name,
      nameHindi: ex.nameHindi || '',
      totalQuestions: ex.questionCount,
      durationMinutes: ex.duration,
      marksPerQuestion: ex.marksPerQuestion,
      totalMarks: ex.questionCount * ex.marksPerQuestion,
      assignedGroups: ex.groups.map((eg) => eg.group.name).join(', '),
      assignedSchools: ex.schools.map((es) => es.school.name).join(', '),
      createdAt: ex.createdAt,
    }))

    // Format Questions
    const formattedQuestions: any[] = []
    admin.exams.forEach((ex) => {
      ex.questions.forEach((eq, idx) => {
        const transEn = eq.questionMaster.translations.find((t) => t.language === 'en') || eq.questionMaster.translations[0]
        if (transEn) {
          formattedQuestions.push({
            examName: ex.name,
            questionNo: idx + 1,
            code: eq.questionMaster.code,
            questionText: transEn.text,
            optionA: transEn.optionA,
            optionB: transEn.optionB,
            optionC: transEn.optionC,
            optionD: transEn.optionD,
            correctOption: transEn.correctOption,
          })
        }
      })
    })

    // Format Students
    const formattedStudents: any[] = []
    admin.schools.forEach((s) => {
      s.students.forEach((st) => {
        formattedStudents.push({
          id: st.id,
          name: st.name,
          mobile: st.mobile,
          schoolName: s.name,
          udise: s.udise,
          classroomName: st.classroom?.name || '',
          district: st.district || '',
          tehsil: st.tehsil || '',
          registeredAt: st.createdAt,
        })
      })
    })

    // Format Exam Attempts & Scores
    const formattedAttempts = attempts.map((att) => {
      const durationMs = att.submittedAt
        ? new Date(att.submittedAt).getTime() - new Date(att.startedAt).getTime()
        : 0
      const durationMin = Math.round(durationMs / 60000)

      return {
        attemptId: att.id,
        studentName: att.student.name,
        studentMobile: att.student.mobile,
        schoolName: att.student.school?.name || '',
        udise: att.student.school?.udise || '',
        classroomName: att.student.classroom?.name || '',
        examName: att.exam?.name || '',
        score: att.score,
        correctAnswers: att.correctAnswers,
        totalQuestions: att.totalQuestions,
        durationMinutes: durationMin,
        completed: att.completed ? 'Yes' : 'No',
        startedAt: att.startedAt,
        submittedAt: att.submittedAt || '',
      }
    })

    return successResponse({
      admin: formattedAdmin,
      schools: formattedSchools,
      classrooms: formattedClassrooms,
      categories: formattedCategories,
      groups: formattedGroups,
      exams: formattedExams,
      questions: formattedQuestions,
      students: formattedStudents,
      attempts: formattedAttempts,
    })
  } catch (error: any) {
    console.error('Super-Admin export admin data error:', error)
    return errorResponse('Internal server error', 500)
  }
}
