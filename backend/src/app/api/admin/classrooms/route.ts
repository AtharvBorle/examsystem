import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser, errorResponse, successResponse } from '@/lib/auth-middleware'

// GET /api/admin/classrooms - List all classrooms
export async function GET(req: NextRequest) {
  try {
    const user = getAuthUser(req)
    if (!user || user.role !== 'ADMIN') {
      return errorResponse('Unauthorized. Admin access required.', 401)
    }

    const classrooms = await prisma.classroom.findMany({
      orderBy: { name: 'asc' },
      include: {
        schools: {
          include: { school: true },
        },
      },
    })

    const formatted = classrooms.map((cls) => ({
      id: cls.id,
      name: cls.name,
      schools: cls.schools.map((s) => ({
        id: s.school.id,
        name: s.school.name,
        udise: s.school.udise,
      })),
    }))

    return successResponse({ classrooms: formatted })
  } catch (error: any) {
    console.error('List classrooms error:', error)
    return errorResponse('Internal server error', 500)
  }
}

// POST /api/admin/classrooms - Create classroom and link to schools
export async function POST(req: NextRequest) {
  try {
    const user = getAuthUser(req)
    if (!user || user.role !== 'ADMIN') {
      return errorResponse('Unauthorized. Admin access required.', 401)
    }

    const { name, classroomIds, schoolIds } = await req.json()

    if (!name && (!Array.isArray(classroomIds) || classroomIds.length === 0)) {
      return errorResponse('Classroom name or classroomIds array is required', 400)
    }

    // 1. Bulk push existing classrooms to selected schools
    if (Array.isArray(classroomIds) && classroomIds.length > 0) {
      if (!Array.isArray(schoolIds)) {
        return errorResponse('schoolIds array is required', 400)
      }

      await prisma.$transaction(async (tx) => {
        for (const cId of classroomIds) {
          // Remove links not in selected schools
          await tx.schoolClassroom.deleteMany({
            where: {
              classroomId: cId,
              schoolId: { notIn: schoolIds },
            },
          })

          // Get existing links for this classroom
          const existing = await tx.schoolClassroom.findMany({
            where: { classroomId: cId },
            select: { schoolId: true },
          })
          const existingSet = new Set(existing.map(e => e.schoolId))

          // Create only missing links
          const toCreate = schoolIds.filter((sId: string) => !existingSet.has(sId))
          if (toCreate.length > 0) {
            await tx.schoolClassroom.createMany({
              data: toCreate.map((sId: string) => ({
                schoolId: sId,
                classroomId: cId,
              })),
              skipDuplicates: true,
            })
          }
        }
      }, { timeout: 15000 })

      return successResponse({ message: `Successfully pushed ${classroomIds.length} classrooms to schools.` })
    }

    // 2. Single classroom creation / update
    if (!name) {
      return errorResponse('Classroom name is required', 400)
    }

    const classroom = await prisma.$transaction(async (tx) => {
      // Find or create classroom
      let cls = await tx.classroom.findFirst({
        where: { name },
      })
      if (!cls) {
        cls = await tx.classroom.create({
          data: { name },
        })
      }

      // Link to selected schools (synchronize)
      if (Array.isArray(schoolIds)) {
        await tx.schoolClassroom.deleteMany({
          where: {
            classroomId: cls.id,
            schoolId: { notIn: schoolIds },
          },
        })

        // Get existing links
        const existing = await tx.schoolClassroom.findMany({
          where: { classroomId: cls.id },
          select: { schoolId: true },
        })
        const existingSet = new Set(existing.map(e => e.schoolId))

        const toCreate = schoolIds.filter((sId: string) => !existingSet.has(sId))
        if (toCreate.length > 0) {
          await tx.schoolClassroom.createMany({
            data: toCreate.map((sId: string) => ({
              schoolId: sId,
              classroomId: cls.id,
            })),
            skipDuplicates: true,
          })
        }
      }

      return cls
    }, { timeout: 15000 })

    return successResponse({ classroom })
  } catch (error: any) {
    console.error('Create/Update classrooms error:', error)
    return errorResponse('Internal server error', 500)
  }
}

// PUT /api/admin/classrooms - Edit classroom name
export async function PUT(req: NextRequest) {
  try {
    const user = getAuthUser(req)
    if (!user || user.role !== 'ADMIN') {
      return errorResponse('Unauthorized. Admin access required.', 401)
    }

    const { id, name } = await req.json()
    if (!id || !name) {
      return errorResponse('id and name are required', 400)
    }

    const updated = await prisma.classroom.update({
      where: { id },
      data: { name },
    })

    return successResponse({ classroom: updated })
  } catch (error: any) {
    console.error('Update classroom error:', error)
    return errorResponse('Internal server error', 500)
  }
}

// DELETE /api/admin/classrooms - Delete classroom(s)
export async function DELETE(req: NextRequest) {
  try {
    const user = getAuthUser(req)
    if (!user || user.role !== 'ADMIN') {
      return errorResponse('Unauthorized. Admin access required.', 401)
    }

    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    const idsStr = searchParams.get('ids')

    if (!id && !idsStr) {
      return errorResponse('Missing parameter: id or ids is required', 400)
    }

    if (id) {
      // Check if students exist under this classroom
      const studentCount = await prisma.student.count({ where: { classroomId: id } })
      if (studentCount > 0) {
        return errorResponse(`Cannot delete classroom. There are ${studentCount} students registered under this classroom.`, 400)
      }

      await prisma.classroom.delete({
        where: { id },
      })
      return successResponse({ success: true, message: 'Classroom deleted successfully' })
    }

    if (idsStr) {
      const targetIds = idsStr.split(',').filter(Boolean)

      // Check if any of these classrooms have students
      const studentCount = await prisma.student.count({
        where: { classroomId: { in: targetIds } }
      })
      if (studentCount > 0) {
        return errorResponse(`Cannot delete classrooms. There are registered students under some of the selected classrooms.`, 400)
      }

      const deleteResult = await prisma.classroom.deleteMany({
        where: {
          id: { in: targetIds },
        },
      })
      return successResponse({ success: true, message: `${deleteResult.count} classrooms deleted successfully` })
    }

    return errorResponse('Bad request', 400)
  } catch (error: any) {
    console.error('Delete classrooms error:', error)
    return errorResponse('Internal server error', 500)
  }
}
