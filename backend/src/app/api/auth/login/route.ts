import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { signToken } from '@/lib/jwt'
import { errorResponse, successResponse } from '@/lib/auth-middleware'
import bcrypt from 'bcryptjs'
import { translateClassroomName } from '@/lib/class-translator'
import { upsertSchoolTranslation } from '@/lib/school-translator'

async function checkAndRestoreStudent(student: any) {
  if (student.deletedAt) {
    const daysDiff = (new Date().getTime() - new Date(student.deletedAt).getTime()) / (1000 * 60 * 60 * 24)
    if (daysDiff >= 30) {
      return { deleted: true }
    } else {
      await prisma.student.update({
        where: { id: student.id },
        data: { deletedAt: null }
      })
      student.deletedAt = null
    }
  }
  return { deleted: false }
}

export async function POST(req: NextRequest) {
  try {
    const { identifier, password, language } = await req.json()

    // Determine if identifier is email or mobile (simple regex)
    const isEmail = identifier?.includes('@')

    // 1. If identifier is a 10-digit mobile number and no password is provided,
    // this is a student trying to log in passwordlessly.
    if (identifier && !isEmail && !password) {
      const student = await prisma.student.findUnique({
        where: { mobile: identifier },
        include: {
          school: {
            include: {
              admin: true
            }
          },
          classroom: true
        },
      })
      if (student) {
        const check = await checkAndRestoreStudent(student)
        if (check.deleted) {
          return errorResponse(
            language === 'hi' 
              ? 'यह खाता स्थायी रूप से हटा दिया गया है।' 
              : 'This account has been permanently deleted.',
            400
          )
        }

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
            approved: student.approved,
            branch: resolvedBranch || null,
          },
        })
      } else {
        // Not registered as student. Check if they are Admin/SuperAdmin
        const adminExists = await prisma.admin.findUnique({ where: { mobile: identifier } })
        const superAdminExists = await prisma.superAdmin.findUnique({ where: { mobile: identifier } })
        if (adminExists || superAdminExists) {
          return errorResponse(
            language === 'hi' 
              ? 'एडमिन लॉगिन के लिए पासवर्ड आवश्यक है।' 
              : 'Password is required for administrator login', 
            400
          )
        }
        
        return errorResponse(
          language === 'hi'
            ? 'मोबाइल नंबर पंजीकृत नहीं है। कृपया पहले पंजीकरण करें।'
            : 'Mobile number is not registered. Please register first.',
          400
        )
      }
    }

    if (!identifier || !password) {
      return errorResponse('Identifier (email/mobile) and password are required', 400)
    }

    if (isEmail) {
      const normalizedIdentifier = identifier.toLowerCase().trim()
      // 1. Check SuperAdmin
      const superAdmin = await prisma.superAdmin.findUnique({
        where: { email: normalizedIdentifier },
      })
      if (superAdmin && (await bcrypt.compare(password, superAdmin.password))) {
        const token = signToken({
          userId: superAdmin.id,
          role: 'SUPER_ADMIN',
          email: superAdmin.email,
        })
        return successResponse({
          token,
          user: { id: superAdmin.id, email: superAdmin.email, role: 'SUPER_ADMIN' },
        })
      }

      // 2. Check Admin by Email
      const admin = await prisma.admin.findUnique({
        where: { email: normalizedIdentifier },
      })
      if (admin && (await bcrypt.compare(password, admin.password))) {
        const token = signToken({
          userId: admin.id,
          role: 'ADMIN',
          email: admin.email,
          mobile: admin.mobile,
        })
        return successResponse({
          token,
          user: { id: admin.id, email: admin.email, mobile: admin.mobile, role: 'ADMIN' },
        })
      }
    } else {
      // 2.5 Check SuperAdmin by Mobile
      const superAdmin = await prisma.superAdmin.findUnique({
        where: { mobile: identifier },
      })
      if (superAdmin && (await bcrypt.compare(password, superAdmin.password))) {
        const token = signToken({
          userId: superAdmin.id,
          role: 'SUPER_ADMIN',
          email: superAdmin.email,
        })
        return successResponse({
          token,
          user: { id: superAdmin.id, email: superAdmin.email, role: 'SUPER_ADMIN' },
        })
      }

      // 3. Check Admin by Mobile
      const admin = await prisma.admin.findUnique({
        where: { mobile: identifier },
      })
      if (admin && (await bcrypt.compare(password, admin.password))) {
        const token = signToken({
          userId: admin.id,
          role: 'ADMIN',
          email: admin.email,
          mobile: admin.mobile,
        })
        return successResponse({
          token,
          user: { id: admin.id, email: admin.email, mobile: admin.mobile, role: 'ADMIN' },
        })
      }

      // 4. Check Student by Mobile
      const student = await prisma.student.findUnique({
        where: { mobile: identifier },
        include: {
          school: {
            include: {
              admin: true
            }
          },
          classroom: true
        },
      })
      if (student && (await bcrypt.compare(password, student.password))) {
        const check = await checkAndRestoreStudent(student)
        if (check.deleted) {
          return errorResponse(
            language === 'hi' 
              ? 'यह खाता स्थायी रूप से हटा दिया गया है।' 
              : 'This account has been permanently deleted.',
            400
          )
        }

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
            approved: student.approved,
            branch: resolvedBranch || null,
          },
        })
      }
    }

    if (!isEmail) {
      const studentExists = await prisma.student.findUnique({ where: { mobile: identifier } })
      const adminExists = await prisma.admin.findUnique({ where: { mobile: identifier } })
      const superAdminExists = await prisma.superAdmin.findUnique({ where: { mobile: identifier } })
      if (!studentExists && !adminExists && !superAdminExists) {
        return errorResponse(
          language === 'hi'
            ? 'मोबाइल नंबर पंजीकृत नहीं है। कृपया पहले पंजीकरण करें।'
            : 'Mobile number is not registered. Please register first.',
          400
        )
      }
    }

    return errorResponse('Invalid credentials', 401)
  } catch (error: any) {
    console.error('Login error:', error)
    return errorResponse('Internal server error', 500)
  }
}
