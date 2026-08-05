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
    const schoolIdsParam = searchParams.get('schoolIds')
    const schoolIdParam = searchParams.getAll('schoolId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    let targetSchoolIds: string[] = []
    if (schoolIdsParam && schoolIdsParam !== 'all') {
      targetSchoolIds = schoolIdsParam.split(',').filter(Boolean)
    } else if (schoolIdParam.length > 0 && !schoolIdParam.includes('all')) {
      targetSchoolIds = schoolIdParam
    }

    // Resolve all matching language row IDs for the target school IDs
    if (targetSchoolIds.length > 0) {
      const schoolsForUdise = await prisma.school.findMany({
        where: { id: { in: targetSchoolIds } },
        select: { udise: true }
      })
      const udises = schoolsForUdise.map(s => s.udise)
      const allMatchingSchools = await prisma.school.findMany({
        where: { udise: { in: udises } },
        select: { id: true }
      })
      targetSchoolIds = allMatchingSchools.map(s => s.id)
    }

    // Build School filter
    const schoolWhere: any = {}
    if (adminId && adminId !== 'all') {
      schoolWhere.adminId = adminId
    }
    if (targetSchoolIds.length > 0) {
      schoolWhere.id = { in: targetSchoolIds }
    }

    // Fetch Schools with students
    const schools = await prisma.school.findMany({
      where: schoolWhere,
      include: {
        admin: { select: { id: true, email: true, mobile: true, branch: true } },
        students: {
          include: {
            classroom: { select: { name: true } },
          },
        },
      },
      orderBy: { name: 'asc' },
    })

    // Build Exam filter
    const examWhere: any = {}
    if (adminId && adminId !== 'all') {
      examWhere.adminId = adminId
    }

    const exams = await prisma.exam.findMany({
      where: examWhere,
      include: {
        admin: { select: { email: true } },
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
      orderBy: { createdAt: 'desc' },
    })

    // Fetch Classrooms & Categories & Groups
    const classrooms = await prisma.classroom.findMany({
      where: adminId && adminId !== 'all' ? { adminId } : {},
      orderBy: { name: 'asc' },
    })

    const categories = await prisma.category.findMany({
      where: adminId && adminId !== 'all' ? { adminId } : {},
      orderBy: { name: 'asc' },
    })

    const groups = await prisma.group.findMany({
      where: adminId && adminId !== 'all' ? { adminId } : {},
      include: {
        classrooms: {
          include: { classroom: { select: { name: true } } },
        },
      },
      orderBy: { name: 'asc' },
    })

    // Build Attempt filter
    const attemptWhere: any = {}
    if (adminId && adminId !== 'all') {
      attemptWhere.OR = [
        { student: { school: { adminId } } },
        { exam: { adminId } },
      ]
    }
    if (targetSchoolIds.length > 0) {
      attemptWhere.student = { schoolId: { in: targetSchoolIds } }
    }
    if (startDate || endDate) {
      attemptWhere.startedAt = {}
      if (startDate) attemptWhere.startedAt.gte = new Date(startDate)
      if (endDate) {
        const eDate = new Date(endDate)
        eDate.setHours(23, 59, 59, 999)
        attemptWhere.startedAt.lte = eDate
      }
    }

    const rawAttempts = await prisma.examAttempt.findMany({
      where: attemptWhere,
      include: {
        student: {
          select: {
            name: true,
            mobile: true,
            district: true,
            tehsil: true,
            school: { select: { id: true, name: true, udise: true } },
            classroom: { select: { name: true } },
          },
        },
        exam: {
          select: { name: true },
        },
      },
    })

    // Multi-tier sorting for global rankings:
    // 1. Marks Obtained (score descending) - Primary Criteria
    // 2. Exam Completion Time (duration = submittedAt - startedAt ascending)
    // 3. First Submission (submittedAt timestamp ascending)
    rawAttempts.sort((a, b) => {
      if (a.completed !== b.completed) {
        return a.completed ? -1 : 1
      }
      if (!a.submittedAt && !b.submittedAt) return 0
      if (!a.submittedAt) return 1
      if (!b.submittedAt) return -1

      // 1. Marks Obtained (score descending)
      const scoreA = a.score !== undefined && a.score !== null ? Number(a.score) : 0
      const scoreB = b.score !== undefined && b.score !== null ? Number(b.score) : 0
      if (scoreA !== scoreB) {
        return scoreB - scoreA
      }

      // 2. Completion Duration
      const subA = new Date(a.submittedAt).getTime()
      const subB = new Date(b.submittedAt).getTime()
      const durA = subA - new Date(a.startedAt).getTime()
      const durB = subB - new Date(b.startedAt).getTime()
      if (durA !== durB) return durA - durB

      // 3. Submission Time
      return subA - subB
    })

    // Format Admin profile if specific adminId is passed
    let formattedAdmin = null
    if (adminId && adminId !== 'all') {
      const adm = await prisma.admin.findUnique({ where: { id: adminId } })
      if (adm) {
        formattedAdmin = {
          id: adm.id,
          email: adm.email,
          mobile: adm.mobile,
          branch: adm.branch || '',
          branchHindi: adm.branchHindi || '',
          userCountLimit: adm.userCountLimit ?? 'Unlimited',
          userCountUsed: adm.userCountUsed,
          presidentName: adm.presidentName || '',
          secretaryName: adm.secretaryName || '',
          createdAt: adm.createdAt,
        }
      }
    }

    // Format Schools
    const formattedSchools = schools.map((s) => ({
      id: s.id,
      name: s.name,
      udise: s.udise,
      tehsil: s.tehsil || '',
      district: s.district || '',
      language: s.language,
      adminEmail: s.admin?.email || '',
      studentsCount: s.students.length,
      createdAt: s.createdAt,
    }))

    // Format Classrooms
    const formattedClassrooms = classrooms.map((c) => ({
      id: c.id,
      name: c.name,
      createdAt: c.createdAt,
    }))

    // Format Categories
    const formattedCategories = categories.map((cat) => ({
      id: cat.id,
      name: cat.name,
      createdAt: cat.createdAt,
    }))

    // Format Groups
    const formattedGroups = groups.map((g) => ({
      id: g.id,
      name: g.name,
      classrooms: g.classrooms.map((gc) => gc.classroom.name).join(', '),
      createdAt: g.createdAt,
    }))

    // Format Exams
    const formattedExams = exams.map((ex) => ({
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
    exams.forEach((ex) => {
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
    schools.forEach((s) => {
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

    // Format Exam Attempts & Scores with Global Ranking
    const formattedAttempts = rawAttempts.map((att, idx) => {
      const durationMs = att.submittedAt
        ? new Date(att.submittedAt).getTime() - new Date(att.startedAt).getTime()
        : 0
      const durationMin = Math.round(durationMs / 60000)

      return {
        rank: att.completed ? idx + 1 : '-',
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
    console.error('Super-Admin export data error:', error)
    return errorResponse('Internal server error', 500)
  }
}
