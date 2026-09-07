import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { errorResponse, successResponse } from '@/lib/auth-middleware'
import crypto from 'crypto'
import jwt from 'jsonwebtoken'

export const dynamic = 'force-dynamic'

const CAPTCHA_SECRET = process.env.JWT_SECRET || 'fallback-super-secret-exam-system-key-2026'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { udise, captchaToken, captchaAnswer, language = 'en', sessionToken } = body

    if (!udise || typeof udise !== 'string' || !udise.trim()) {
      return errorResponse('School UDISE number is required', 400)
    }

    const cleanUdise = udise.trim()

    // If sessionToken is provided and valid for this UDISE, bypass captcha
    let isSessionValid = false
    if (sessionToken) {
      try {
        const decoded = jwt.verify(sessionToken, CAPTCHA_SECRET) as any
        if (decoded && decoded.role === 'SCHOOL' && decoded.udise === cleanUdise) {
          isSessionValid = true
        }
      } catch (err) {
        isSessionValid = false
      }
    }

    // If session is not valid, verify Captcha
    if (!isSessionValid) {
      if (!captchaToken || typeof captchaToken !== 'string') {
        return errorResponse('Captcha token is required. Please refresh captcha.', 400)
      }
      if (!captchaAnswer || typeof captchaAnswer !== 'string') {
        return errorResponse('Please enter the captcha answer.', 400)
      }

      const parts = captchaToken.split('.')
      if (parts.length !== 2) {
        return errorResponse('Invalid captcha token format.', 400)
      }

      const [timestampStr, tokenHash] = parts
      const timestamp = Number(timestampStr)
      if (isNaN(timestamp) || Date.now() - timestamp > 10 * 60 * 1000) {
        return errorResponse('Captcha has expired. Please refresh and try again.', 400)
      }

      const expectedHash = crypto
        .createHmac('sha256', CAPTCHA_SECRET)
        .update(`${captchaAnswer.trim()}:${timestampStr}`)
        .digest('hex')

      if (expectedHash !== tokenHash) {
        return errorResponse('Incorrect captcha answer. Please try again.', 400)
      }
    }

    // Query school metadata by UDISE
    let school = await prisma.school.findFirst({
      where: {
        udise: cleanUdise,
        language: language === 'hi' ? 'hi' : 'en'
      },
      include: {
        admin: {
          select: { email: true, mobile: true, id: true },
        },
        classrooms: {
          include: { classroom: true }
        },
      },
    })

    if (!school) {
      // Fallback to any language row matching this UDISE
      school = await prisma.school.findFirst({
        where: { udise: cleanUdise },
        include: {
          admin: {
            select: { email: true, mobile: true, id: true },
          },
          classrooms: {
            include: { classroom: true }
          },
        },
      })
    }

    if (!school) {
      return errorResponse('No school found with the provided UDISE number. Please check and try again.', 404)
    }

    // Resolve all school IDs matching this school's UDISE number
    const relatedSchools = await prisma.school.findMany({
      where: { udise: school.udise },
      select: { id: true, classrooms: { include: { classroom: true } } }
    })
    const relatedSchoolIds = relatedSchools.map(s => s.id)

    // Gather all linked classrooms across all language rows of this school
    const classroomMap: Record<string, { id: string; name: string }> = {}
    relatedSchools.forEach(rs => {
      rs.classrooms.forEach(sc => {
        if (sc.classroom) {
          classroomMap[sc.classroom.id] = {
            id: sc.classroom.id,
            name: sc.classroom.name
          }
        }
      })
    })

    // Fetch students registered under this school
    const students = await prisma.student.findMany({
      where: { schoolId: { in: relatedSchoolIds } },
      orderBy: { name: 'asc' },
      include: {
        classroom: {
          select: { id: true, name: true },
        },
      },
    })

    // Fetch all exams pushed to this school
    const schoolExams = await prisma.schoolExam.findMany({
      where: { schoolId: { in: relatedSchoolIds } },
      include: {
        exam: {
          select: { id: true, name: true, nameHindi: true, duration: true }
        }
      }
    })
    const uniqueExamsMap: Record<string, { id: string; name: string; nameHindi?: string | null; duration?: number }> = {}
    schoolExams.forEach((se) => {
      if (se.exam) {
        uniqueExamsMap[se.exam.id] = {
          id: se.exam.id,
          name: se.exam.name,
          nameHindi: se.exam.nameHindi,
          duration: se.exam.duration,
        }
      }
    })
    const formattedExams = Object.values(uniqueExamsMap)

    // Fetch classroom groups managed by this school's admin
    const groups = await prisma.group.findMany({
      where: { adminId: school.adminId },
      include: {
        classrooms: {
          include: { classroom: true }
        }
      }
    })
    const formattedGroups = groups.map(g => ({
      id: g.id,
      name: g.name,
      classrooms: g.classrooms.map(gc => ({
        id: gc.classroom.id,
        name: gc.classroom.name
      }))
    }))

    // Fetch exam attempts under this school
    const attempts = await prisma.examAttempt.findMany({
      where: {
        student: { schoolId: { in: relatedSchoolIds } },
      },
      orderBy: { startedAt: 'desc' },
      include: {
        student: {
          select: {
            name: true,
            mobile: true,
            classroomId: true,
            classroom: { select: { id: true, name: true } },
            district: true,
            tehsil: true,
          },
        },
        exam: {
          select: { id: true, name: true, nameHindi: true, duration: true },
        },
      },
    })

    const formattedStudents = students.map((std) => ({
      id: std.id,
      name: std.name,
      mobile: std.mobile,
      classroomId: std.classroom?.id || '',
      classroomName: std.classroom?.name || '-',
      district: std.district,
      tehsil: std.tehsil,
      registeredAt: std.createdAt,
      acceptedTerms: std.acceptedTerms ?? true,
    }))

    const formattedAttempts = attempts.map((att) => {
      const subTime = att.submittedAt ? new Date(att.submittedAt).getTime() : 0
      const startTime = att.startedAt ? new Date(att.startedAt).getTime() : 0
      const durationMinutes = subTime && startTime ? Math.max(1, Math.round((subTime - startTime) / 60000)) : 0

      return {
        id: att.id,
        studentName: att.student.name,
        studentMobile: att.student.mobile,
        classroomId: att.student.classroomId,
        classroomName: att.student.classroom?.name || '-',
        district: att.student.district,
        tehsil: att.student.tehsil,
        examId: att.examId,
        examName: att.exam.name,
        examNameHindi: att.exam.nameHindi,
        score: att.score,
        correctAnswers: att.correctAnswers,
        totalQuestions: att.totalQuestions,
        completed: att.completed,
        startedAt: att.startedAt,
        submittedAt: att.submittedAt,
        durationMinutes,
      }
    })

    // Issue a 2-hour session token
    const newSessionToken = jwt.sign(
      { role: 'SCHOOL', udise: school.udise },
      CAPTCHA_SECRET,
      { expiresIn: '2h' }
    )

    return successResponse({
      school: {
        id: school.id,
        name: school.name,
        udise: school.udise,
        tehsil: school.tehsil,
        district: school.district,
        adminEmail: school.admin.email,
        adminMobile: school.admin.mobile,
        classrooms: Object.values(classroomMap)
      },
      students: formattedStudents,
      attempts: formattedAttempts,
      exams: formattedExams,
      groups: formattedGroups,
      sessionToken: newSessionToken,
    })
  } catch (error: any) {
    console.error('Fetch school portal error:', error)
    return errorResponse('Internal server error', 500)
  }
}
