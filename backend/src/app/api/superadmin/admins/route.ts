import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser, errorResponse, successResponse } from '@/lib/auth-middleware'
import bcrypt from 'bcryptjs'

export const dynamic = 'force-dynamic'

// GET /api/superadmin/admins - List all Admins
export async function GET(req: NextRequest) {
  try {
    const user = getAuthUser(req)
    if (!user || user.role !== 'SUPER_ADMIN') {
      return errorResponse('Unauthorized. Super-Admin access required.', 401)
    }

    const admins = await prisma.admin.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        mobile: true,
        userCountLimit: true,
        userCountUsed: true,
        createdAt: true,
      },
    })

    return successResponse({ admins })
  } catch (error: any) {
    console.error('List admins error:', error)
    return errorResponse('Internal server error', 500)
  }
}

// POST /api/superadmin/admins - Create Admin
export async function POST(req: NextRequest) {
  try {
    const user = getAuthUser(req)
    if (!user || user.role !== 'SUPER_ADMIN') {
      return errorResponse('Unauthorized. Super-Admin access required.', 401)
    }

    const { email, mobile, password, userCountLimit } = await req.json()

    if (!email || !mobile || !password) {
      return errorResponse('Email, mobile, and password are required', 400)
    }

    const normalizedEmail = email.toLowerCase().trim()

    // Check if admin already exists
    const existingAdminEmail = await prisma.admin.findUnique({ where: { email: normalizedEmail } })
    const existingAdminMobile = await prisma.admin.findUnique({ where: { mobile } })
    const existingStudentMobile = await prisma.student.findUnique({ where: { mobile } })

    if (existingAdminEmail || existingAdminMobile || existingStudentMobile) {
      return errorResponse('Email or mobile number is already registered', 400)
    }

    const hashedPassword = await bcrypt.hash(password, 6)
    const limit = userCountLimit !== undefined && userCountLimit !== null ? parseInt(userCountLimit) : null

    const newAdmin = await prisma.admin.create({
      data: {
        email: normalizedEmail,
        mobile,
        password: hashedPassword,
        userCountLimit: limit,
        createdById: user.userId,
      },
      select: {
        id: true,
        email: true,
        mobile: true,
        userCountLimit: true,
        userCountUsed: true,
        createdAt: true,
      },
    })

    return successResponse({ admin: newAdmin }, 201)
  } catch (error: any) {
    console.error('Create admin error:', error)
    return errorResponse('Internal server error', 500)
  }
}

// DELETE /api/superadmin/admins - Delete Admin and all associated data cascadingly
export async function DELETE(req: NextRequest) {
  try {
    const user = getAuthUser(req)
    if (!user || user.role !== 'SUPER_ADMIN') {
      return errorResponse('Unauthorized. Super-Admin access required.', 401)
    }

    const { searchParams } = new URL(req.url)
    const adminId = searchParams.get('id')

    if (!adminId) {
      return errorResponse('Missing parameter: id is required', 400)
    }

    const admin = await prisma.admin.findUnique({ where: { id: adminId } })
    if (!admin) {
      return errorResponse('Admin not found', 404)
    }

    // Fetch all student IDs in schools managed by this admin
    const students = await prisma.student.findMany({
      where: { school: { adminId } },
      select: { id: true }
    })
    const studentIds = students.map(s => s.id)

    // Fetch all exam IDs created by this admin
    const exams = await prisma.exam.findMany({
      where: { adminId },
      select: { id: true }
    })
    const examIds = exams.map(e => e.id)

    // Cascade delete in an atomic transaction
    await prisma.$transaction([
      prisma.examAttempt.deleteMany({
        where: {
          OR: [
            { studentId: { in: studentIds } },
            { examId: { in: examIds } }
          ]
        }
      }),
      prisma.student.deleteMany({
        where: { school: { adminId } }
      }),
      prisma.schoolClassroom.deleteMany({
        where: { school: { adminId } }
      }),
      prisma.schoolExam.deleteMany({
        where: { school: { adminId } }
      }),
      prisma.school.deleteMany({
        where: { adminId }
      }),
      prisma.examQuestion.deleteMany({
        where: { examId: { in: examIds } }
      }),
      prisma.examGroup.deleteMany({
        where: { examId: { in: examIds } }
      }),
      prisma.schoolExam.deleteMany({
        where: { examId: { in: examIds } }
      }),
      prisma.exam.deleteMany({
        where: { adminId }
      }),
      prisma.questionMaster.deleteMany({
        where: { adminId }
      }),
      prisma.subcategory.deleteMany({
        where: { category: { adminId } }
      }),
      prisma.category.deleteMany({
        where: { adminId }
      }),
      prisma.groupClassroom.deleteMany({
        where: { group: { adminId } }
      }),
      prisma.examGroup.deleteMany({
        where: { group: { adminId } }
      }),
      prisma.group.deleteMany({
        where: { adminId }
      }),
      prisma.admin.delete({
        where: { id: adminId }
      })
    ])

    return successResponse({ success: true, message: 'Admin and all related data deleted successfully' })
  } catch (error: any) {
    console.error('Delete admin error:', error)
    return errorResponse('Internal server error', 500)
  }
}

// PUT /api/superadmin/admins - Edit Admin
export async function PUT(req: NextRequest) {
  try {
    const user = getAuthUser(req)
    if (!user || user.role !== 'SUPER_ADMIN') {
      return errorResponse('Unauthorized. Super-Admin access required.', 401)
    }

    const { id, email, mobile, password, userCountLimit } = await req.json()

    if (!id) {
      return errorResponse('Admin ID is required', 400)
    }

    const admin = await prisma.admin.findUnique({ where: { id } })
    if (!admin) {
      return errorResponse('Admin not found', 404)
    }

    const updateData: any = {}

    if (email) {
      const normalizedEmail = email.toLowerCase().trim()
      if (normalizedEmail !== admin.email) {
        // Check duplicate email
        const dup = await prisma.admin.findUnique({ where: { email: normalizedEmail } })
        if (dup) return errorResponse('Email is already registered', 400)
        updateData.email = normalizedEmail
      }
    }

    if (mobile) {
      if (mobile !== admin.mobile) {
        // Check duplicate mobile
        const dupAdmin = await prisma.admin.findUnique({ where: { mobile } })
        const dupStudent = await prisma.student.findUnique({ where: { mobile } })
        if (dupAdmin || dupStudent) return errorResponse('Mobile number is already registered', 400)
        updateData.mobile = mobile
      }
    }

    if (password) {
      updateData.password = await bcrypt.hash(password, 6)
    }

    if (userCountLimit !== undefined && userCountLimit !== null) {
      updateData.userCountLimit = userCountLimit === '' ? null : parseInt(userCountLimit)
    }

    const updatedAdmin = await prisma.admin.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        mobile: true,
        userCountLimit: true,
        userCountUsed: true,
        createdAt: true,
      }
    })

    return successResponse({ admin: updatedAdmin })
  } catch (error: any) {
    console.error('Update admin error:', error)
    return errorResponse('Internal server error', 500)
  }
}
