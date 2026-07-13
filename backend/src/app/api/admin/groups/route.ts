import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser, errorResponse, successResponse } from '@/lib/auth-middleware'

// GET /api/admin/groups - List all groups
export async function GET(req: NextRequest) {
  try {
    const user = getAuthUser(req)
    if (!user || user.role !== 'ADMIN') {
      return errorResponse('Unauthorized. Admin access required.', 401)
    }

    const groups = await prisma.group.findMany({
      where: { adminId: user.userId },
      orderBy: { name: 'asc' },
      include: {
        classrooms: {
          include: { classroom: true },
        },
      },
    })

    const formatted = groups.map((g) => ({
      id: g.id,
      name: g.name,
      classrooms: g.classrooms.map((c) => ({
        id: c.classroom.id,
        name: c.classroom.name,
      })),
    }))

    return successResponse({ groups: formatted })
  } catch (error: any) {
    console.error('List groups error:', error)
    return errorResponse('Internal server error', 500)
  }
}

// POST /api/admin/groups - Create a classroom group
export async function POST(req: NextRequest) {
  try {
    const user = getAuthUser(req)
    if (!user || user.role !== 'ADMIN') {
      return errorResponse('Unauthorized. Admin access required.', 401)
    }

    const { name, classroomIds } = await req.json()

    if (!name) {
      return errorResponse('Group name is required', 400)
    }
    if (!Array.isArray(classroomIds) || classroomIds.length === 0) {
      return errorResponse('At least one classroom must be selected', 400)
    }

    const group = await prisma.$transaction(async (tx) => {
      const g = await tx.group.create({
        data: {
          name,
          adminId: user.userId,
        },
      })

      // Link classrooms
      for (const cId of classroomIds) {
        await tx.groupClassroom.create({
          data: {
            groupId: g.id,
            classroomId: cId,
          },
        })
      }

      return g
    })

    const fullGroup = await prisma.group.findUnique({
      where: { id: group.id },
      include: {
        classrooms: {
          include: { classroom: true },
        },
      },
    })

        return successResponse({ group: fullGroup })
  } catch (error: any) {
    console.error('Create group error:', error)
    return errorResponse('Internal server error', 500)
  }
}

// PUT /api/admin/groups - Edit group name and classrooms links
export async function PUT(req: NextRequest) {
  try {
    const user = getAuthUser(req)
    if (!user || user.role !== 'ADMIN') {
      return errorResponse('Unauthorized. Admin access required.', 401)
    }

    const { id, name, classroomIds } = await req.json()
    if (!id || !name) {
      return errorResponse('id and name are required', 400)
    }
    if (!Array.isArray(classroomIds) || classroomIds.length === 0) {
      return errorResponse('At least one classroom must be selected', 400)
    }

    // Verify ownership
    const group = await prisma.group.findUnique({ where: { id } })
    if (!group || group.adminId !== user.userId) {
      return errorResponse('Group not found or unauthorized', 404)
    }

    await prisma.$transaction(async (tx) => {
      // Update name
      await tx.group.update({
        where: { id },
        data: { name },
      })

      // Sync classrooms: delete links not in selection
      await tx.groupClassroom.deleteMany({
        where: {
          groupId: id,
          classroomId: { notIn: classroomIds },
        },
      })

      // Add missing links
      for (const cId of classroomIds) {
        const exists = await tx.groupClassroom.findUnique({
          where: {
            groupId_classroomId: {
              groupId: id,
              classroomId: cId,
            },
          },
        })
        if (!exists) {
          await tx.groupClassroom.create({
            data: {
              groupId: id,
              classroomId: cId,
            },
          })
        }
      }
    })

    const fullGroup = await prisma.group.findUnique({
      where: { id },
      include: {
        classrooms: {
          include: { classroom: true },
        },
      },
    })

    return successResponse({ group: fullGroup })
  } catch (error: any) {
    console.error('Update group error:', error)
    return errorResponse('Internal server error', 500)
  }
}

// DELETE /api/admin/groups - Delete group(s)
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
      // Verify ownership
      const group = await prisma.group.findUnique({ where: { id } })
      if (!group || group.adminId !== user.userId) {
        return errorResponse('Group not found or unauthorized', 404)
      }

      await prisma.group.delete({
        where: { id },
      })
      return successResponse({ success: true, message: 'Group deleted successfully' })
    }

    if (idsStr) {
      const targetIds = idsStr.split(',').filter(Boolean)

      // Filter targetIds to only those owned by this admin
      const ownedGroups = await prisma.group.findMany({
        where: { id: { in: targetIds }, adminId: user.userId },
        select: { id: true }
      })
      const ownedIds = ownedGroups.map(g => g.id)

      if (ownedIds.length === 0) {
        return errorResponse('No authorized groups found for deletion', 400)
      }

      const deleteResult = await prisma.group.deleteMany({
        where: {
          id: { in: ownedIds },
        },
      })
      return successResponse({ success: true, message: `${deleteResult.count} groups deleted successfully` })
    }

    return errorResponse('Bad request', 400)
  } catch (error: any) {
    console.error('Delete groups error:', error)
    return errorResponse('Internal server error', 500)
  }
}
