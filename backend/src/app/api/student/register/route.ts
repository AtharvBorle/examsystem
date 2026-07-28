import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { signToken } from '@/lib/jwt'
import { errorResponse, successResponse } from '@/lib/auth-middleware'
import bcrypt from 'bcryptjs'
import { getOtp, deleteOtp } from '@/lib/otp-store'
import { translateClassroomName } from '@/lib/class-translator'
import { upsertSchoolTranslation } from '@/lib/school-translator'


export async function POST(req: NextRequest) {
  try {
    const { firstName, motherName, fatherName, lastName, schoolId, classroomId, district, tehsil, mobile, password, language } = await req.json()

    const registrationPassword = password || 'student_default_pass_2026'

    if (!firstName || !motherName || !fatherName || !lastName || !schoolId || !classroomId || !district || !tehsil || !mobile) {
      return errorResponse('All fields are required', 400)
    }

    const trimmedFirstName = firstName.trim()
    const trimmedMotherName = motherName.trim()
    const trimmedFatherName = fatherName.trim()
    const trimmedLastName = lastName.trim()
    const nameRegex = /^[A-Za-z\s\u0900-\u097F]+$/

    if (trimmedFirstName.length < 1 || trimmedFirstName.length > 25 || !nameRegex.test(trimmedFirstName)) {
      return errorResponse('First name must be between 1 and 25 characters and contain only letters and spaces', 400)
    }
    if (trimmedLastName.length < 1 || trimmedLastName.length > 25 || !nameRegex.test(trimmedLastName)) {
      return errorResponse('Last name must be between 1 and 25 characters and contain only letters and spaces', 400)
    }
    if (trimmedMotherName.length < 1 || trimmedMotherName.length > 25 || !nameRegex.test(trimmedMotherName)) {
      return errorResponse('Mother\'s name must be between 1 and 25 characters and contain only letters and spaces', 400)
    }
    if (trimmedFatherName.length < 1 || trimmedFatherName.length > 25 || !nameRegex.test(trimmedFatherName)) {
      return errorResponse('Father\'s name must be between 1 and 25 characters and contain only letters and spaces', 400)
    }

    const name = `${trimmedFirstName} ${trimmedMotherName} ${trimmedFatherName} ${trimmedLastName}`.replace(/\s+/g, ' ').trim()
    if (name.length < 4 || name.length > 100) {
      return errorResponse('Combined name must be between 4 and 100 characters', 400)
    }

    // Mobile field restrictions (10-digit Indian phone number starting with 6-9)
    const mobileRegex = /^[6-9]\d{9}$/
    if (!mobileRegex.test(mobile)) {
      return errorResponse('Mobile number must be a valid 10-digit number starting with 6, 7, 8, or 9', 400)
    }

    // Password field restrictions (min length 6)
    if (registrationPassword.length < 6) {
      return errorResponse('Password must be at least 6 characters long', 400)
    }

    // Verify school exists
    const school = await prisma.school.findUnique({
      where: { id: schoolId },
    })
    if (!school) {
      return errorResponse('Selected school does not exist', 400)
    }

    // Verify classroom exists
    const classroom = await prisma.classroom.findUnique({
      where: { id: classroomId },
    })
    if (!classroom) {
      return errorResponse('Selected classroom does not exist', 400)
    }

    // Verify school-classroom linkage across all language rows sharing the same UDISE
    const relatedSchools = await prisma.school.findMany({
      where: { udise: school.udise },
      select: { id: true }
    })
    const relatedSchoolIds = relatedSchools.map(s => s.id)

    const linked = await prisma.schoolClassroom.findFirst({
      where: {
        schoolId: { in: relatedSchoolIds },
        classroomId,
      },
    })
    if (!linked) {
      return errorResponse('Selected classroom is not pushed to the selected school', 400)
    }

    // Verify mobile is unique (across Students and Admins)
    const existingStudent = await prisma.student.findUnique({ where: { mobile } })
    const existingAdmin = await prisma.admin.findUnique({ where: { mobile } })
    if (existingStudent || existingAdmin) {
      return errorResponse('Mobile number is already registered', 400)
    }

    // Verify OTP has been successfully validated
    const otpEntry = await getOtp(mobile)
    if (!otpEntry || !otpEntry.verified) {
      return errorResponse('Mobile number must be verified via OTP first', 400)
    }

    // Check expiry
    if (new Date() > otpEntry.expiresAt) {
      await deleteOtp(mobile)
      return errorResponse('OTP session has expired. Please request and verify a new OTP.', 400)
    }

    // Delete OTP entry so it cannot be reused
    await deleteOtp(mobile)

    // Normalize and clean spaces from name for comparison and database storage
    const cleanName = name.replace(/\s+/g, ' ').trim()
    const normalizedIncomingName = cleanName.toLowerCase()

    const classroomStudents = await prisma.student.findMany({
      where: { classroomId, schoolId },
      select: { name: true }
    })

    const requiresApproval = classroomStudents.some(s => {
      const dbNameNormalized = s.name.replace(/\s+/g, ' ').trim().toLowerCase()
      return dbNameNormalized === normalizedIncomingName
    })

    const hashedPassword = await bcrypt.hash(registrationPassword, 6)

    const student = await prisma.student.create({
      data: {
        name: cleanName,
        schoolId,
        classroomId,
        district,
        tehsil,
        mobile,
        password: hashedPassword,
        language: language || 'en',
        approved: !requiresApproval,
      },
      include: {
        school: {
          include: {
            admin: true
          }
        },
        classroom: true,
      },
    })

    const token = signToken({
      userId: student.id,
      role: 'STUDENT',
      mobile: student.mobile,
    })

    let schoolName = student.school.name
    if (student.language === 'hi') {
      const hiSchool = await prisma.school.findFirst({
        where: {
          udise: student.school.udise,
          language: 'hi',
        }
      })
      if (hiSchool) {
        schoolName = hiSchool.name
      }
    }
    const classroomName = translateClassroomName(student.classroom.name, student.language)
    const resolvedBranch = student.language === 'hi'
      ? (student.school.admin.branchHindi || student.school.admin.branch)
      : student.school.admin.branch

    if (requiresApproval) {
      return successResponse({
        success: true,
        pendingApproval: true,
        token,
        user: {
          id: student.id,
          name: student.name,
          mobile: student.mobile,
          role: 'STUDENT',
          language: student.language,
          school: { id: student.school.id, name: schoolName },
          classroom: { id: student.classroom.id, name: classroomName },
          approved: false,
          branch: resolvedBranch || null,
        },
        message: 'A student with this name is already registered in this classroom. Your registration is pending admin approval.'
      }, 201)
    }

    return successResponse({
      token,
      user: {
        id: student.id,
        name: student.name,
        mobile: student.mobile,
        role: 'STUDENT',
        language: student.language,
        school: { id: student.school.id, name: schoolName },
        classroom: { id: student.classroom.id, name: classroomName },
        approved: true,
        branch: resolvedBranch || null,
      },
    }, 201)
  } catch (error: any) {
    console.error('Student registration error:', error)
    return errorResponse('Internal server error', 500)
  }
}
