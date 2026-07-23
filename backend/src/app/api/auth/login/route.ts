import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { signToken } from '@/lib/jwt'
import { errorResponse, successResponse } from '@/lib/auth-middleware'
import bcrypt from 'bcryptjs'
import { translateClassroomName } from '@/lib/class-translator'
import { upsertSchoolTranslation } from '@/lib/school-translator'

export async function POST(req: NextRequest) {
  try {
    const { identifier, password } = await req.json()

    if (!identifier || !password) {
      return errorResponse('Identifier (email/mobile) and password are required', 400)
    }

        // Determine if identifier is email or mobile (simple regex)
    const isEmail = identifier.includes('@')

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
      // 2.5 Check SuperAdmin by Mobile (mapped to superadmin@exam.com)
      if (identifier === '9999999999') {
        const superAdmin = await prisma.superAdmin.findUnique({
          where: { email: 'superadmin@exam.com' },
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
        include: { school: true, classroom: true },
      })
      if (student && (await bcrypt.compare(password, student.password))) {
        const token = signToken({
          userId: student.id,
          role: 'STUDENT',
          mobile: student.mobile,
        })

        const schoolName = student.school.name
        const classroomName = translateClassroomName(student.classroom.name, student.language)

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
          },
        })
      }
    }

    return errorResponse('Invalid credentials', 401)
  } catch (error: any) {
    console.error('Login error:', error)
    return errorResponse('Internal server error', 500)
  }
}
