import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser, errorResponse, successResponse } from '@/lib/auth-middleware'

export async function GET(req: NextRequest) {
  try {
    const user = getAuthUser(req)
    if (!user || user.role !== 'ADMIN') {
      return errorResponse('Unauthorized. Admin access required.', 401)
    }

    // Fetch all students who are NOT approved in schools managed by this admin
    const students = await prisma.student.findMany({
      where: {
        approved: false,
        school: { adminId: user.userId }
      },
      include: {
        school: true,
        classroom: true
      },
      orderBy: { createdAt: 'desc' }
    })

    const formatted = students.map((s) => ({
      id: s.id,
      name: s.name,
      mobile: s.mobile,
      district: s.district,
      tehsil: s.tehsil,
      createdAt: s.createdAt,
      schoolName: s.school.name,
      classroomName: s.classroom.name
    }))

    return successResponse({ students: formatted })
  } catch (error: any) {
    console.error('List pending approvals error:', error)
    return errorResponse('Internal server error', 500)
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = getAuthUser(req)
    if (!user || user.role !== 'ADMIN') {
      return errorResponse('Unauthorized. Admin access required.', 401)
    }

    const { studentId } = await req.json()
    if (!studentId) {
      return errorResponse('Student ID is required', 400)
    }

    // Verify the student belongs to a school managed by this admin
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: { school: true }
    })

    if (!student || student.school.adminId !== user.userId) {
      return errorResponse('Student registration not found or unauthorized', 404)
    }

    // Approve student
    await prisma.student.update({
      where: { id: studentId },
      data: { approved: true }
    })

    return successResponse({ success: true, message: 'Student registration approved successfully' })
  } catch (error: any) {
    console.error('Approve student error:', error)
    return errorResponse('Internal server error', 500)
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = getAuthUser(req)
    if (!user || user.role !== 'ADMIN') {
      return errorResponse('Unauthorized. Admin access required.', 401)
    }

    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (!id) {
      return errorResponse('Missing parameter: id is required', 400)
    }

    // Verify existence and ownership
    const student = await prisma.student.findUnique({
      where: { id },
      include: { school: true }
    })

    if (!student || student.school.adminId !== user.userId) {
      return errorResponse('Student registration not found or unauthorized', 404)
    }

    // Delete attempt history if any, then delete student record (rejection)
    await prisma.$transaction([
      prisma.examAttempt.deleteMany({ where: { studentId: id } }),
      prisma.student.delete({ where: { id } })
    ])

    return successResponse({ success: true, message: 'Student registration rejected and deleted successfully' })
  } catch (error: any) {
    console.error('Reject student error:', error)
    return errorResponse('Internal server error', 500)
  }
}
