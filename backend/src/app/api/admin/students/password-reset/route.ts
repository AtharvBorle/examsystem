import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser, errorResponse, successResponse } from '@/lib/auth-middleware'
import bcrypt from 'bcryptjs'

// GET: Search students managed by this admin (or all if Super-Admin)
export async function GET(req: NextRequest) {
  try {
    const user = getAuthUser(req)
    if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN')) {
      return errorResponse('Unauthorized', 401)
    }

    const { searchParams } = new URL(req.url)
    const query = searchParams.get('query') || ''

    // Fetch students
    const students = await prisma.student.findMany({
      where: {
        school: user.role === 'ADMIN' ? { adminId: user.userId } : undefined,
        OR: query
          ? [
              { name: { contains: query, mode: 'insensitive' } },
              { mobile: { contains: query } },
            ]
          : undefined,
      },
      select: {
        id: true,
        name: true,
        mobile: true,
        school: {
          select: {
            name: true,
          },
        },
        classroom: {
          select: {
            name: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    })

    return successResponse({ students })
  } catch (error: any) {
    console.error('Search students error:', error)
    return errorResponse('Internal server error', 500)
  }
}

// POST: Reset passwords in bulk or for single student
export async function POST(req: NextRequest) {
  try {
    const user = getAuthUser(req)
    if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN')) {
      return errorResponse('Unauthorized', 401)
    }

    const { studentIds, newPassword } = await req.json()

    if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
      return errorResponse('No student IDs provided', 400)
    }

    if (!newPassword || newPassword.length < 4) {
      return errorResponse('Password must be at least 4 characters long', 400)
    }

    const hashedPassword = await bcrypt.hash(newPassword, 6)

    // Verify ownership & update passwords
    const updatePromises = studentIds.map(async (id) => {
      const student = await prisma.student.findFirst({
        where: {
          id,
          school: user.role === 'ADMIN' ? { adminId: user.userId } : undefined,
        },
      })

      if (student) {
        return prisma.student.update({
          where: { id },
          data: { password: hashedPassword },
        })
      }
    })

    await Promise.all(updatePromises)

    return successResponse({
      success: true,
      message: `Successfully changed password for ${studentIds.length} student(s).`,
    })
  } catch (error: any) {
    console.error('Reset passwords error:', error)
    return errorResponse('Internal server error', 500)
  }
}
