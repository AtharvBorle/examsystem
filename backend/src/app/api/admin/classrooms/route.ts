import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser, errorResponse, successResponse } from '@/lib/auth-middleware'

// GET /api/admin/classrooms - List classrooms managed by this admin
export async function GET(req: NextRequest) {
  try {
    const user = getAuthUser(req)
    if (!user || user.role !== 'ADMIN') {
      return errorResponse('Unauthorized. Admin access required.', 401)
    }

    const classrooms = await prisma.classroom.findMany({
      where: {
        OR: [
          { adminId: user.userId },
          {
            schools: {
              some: {
                school: {
                  adminId: user.userId,
                },
              },
            },
          },
        ],
      },
      orderBy: { name: 'asc' },
      include: {
        schools: {
          where: {
            school: {
              adminId: user.userId,
            },
          },
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

    // Fetch schools owned by this admin
    const adminSchools = await prisma.school.findMany({
      where: { adminId: user.userId },
      select: { id: true }
    })
    const adminSchoolIds = adminSchools.map(s => s.id)

    // 1. Bulk push existing classrooms to selected schools
    if (Array.isArray(classroomIds) && classroomIds.length > 0) {
      if (!Array.isArray(schoolIds)) {
        return errorResponse('schoolIds array is required', 400)
      }

      // Only allow linking to schools owned by this admin
      const ownedSchoolIds = schoolIds.filter((sId: string) => adminSchoolIds.includes(sId))

      await prisma.$transaction(async (tx) => {
        for (const cId of classroomIds) {
          // Remove links to schools owned by this admin that are not in the selected schoolIds
          await tx.schoolClassroom.deleteMany({
            where: {
              classroomId: cId,
              schoolId: {
                in: adminSchoolIds,
                notIn: ownedSchoolIds,
              },
            },
          })

          // Get existing links for this classroom
          const existing = await tx.schoolClassroom.findMany({
            where: { classroomId: cId },
            select: { schoolId: true },
          })
          const existingSet = new Set(existing.map(e => e.schoolId))

          // Create only missing links to owned schools
          const toCreate = ownedSchoolIds.filter((sId: string) => !existingSet.has(sId))
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

    // Only allow linking to schools owned by this admin
    const ownedSchoolIds = Array.isArray(schoolIds)
      ? schoolIds.filter((sId: string) => adminSchoolIds.includes(sId))
      : []

    const classroom = await prisma.$transaction(async (tx) => {
      // Find or create classroom
      let cls = await tx.classroom.findFirst({
        where: { name },
      })
      if (!cls) {
        cls = await tx.classroom.create({
          data: { name, adminId: user.userId },
        })
      } else if (!cls.adminId) {
        // Adopt orphan classroom
        cls = await tx.classroom.update({
          where: { id: cls.id },
          data: { adminId: user.userId }
        })
      }

      // Link/unlink for this admin's schools
      await tx.schoolClassroom.deleteMany({
        where: {
          classroomId: cls.id,
          schoolId: {
            in: adminSchoolIds,
            notIn: ownedSchoolIds,
          },
        },
      })

      // Get existing links
      const existing = await tx.schoolClassroom.findMany({
        where: { classroomId: cls.id },
        select: { schoolId: true },
      })
      const existingSet = new Set(existing.map(e => e.schoolId))

      const toCreate = ownedSchoolIds.filter((sId: string) => !existingSet.has(sId))
      if (toCreate.length > 0) {
        await tx.schoolClassroom.createMany({
          data: toCreate.map((sId: string) => ({
            schoolId: sId,
            classroomId: cls.id,
          })),
          skipDuplicates: true,
        })
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

    // Verify ownership or management link
    const classroom = await prisma.classroom.findFirst({
      where: {
        id,
        OR: [
          { adminId: user.userId },
          {
            schools: {
              some: {
                school: { adminId: user.userId }
              }
            }
          }
        ]
      }
    })

    if (!classroom) {
      return errorResponse('Classroom not found or unauthorized', 404)
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

// DELETE /api/admin/classrooms - Delete/unlink classroom(s)
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

    // Get admin schools
    const adminSchools = await prisma.school.findMany({
      where: { adminId: user.userId },
      select: { id: true }
    })
    const adminSchoolIds = adminSchools.map(s => s.id)

    const processDelete = async (cId: string) => {
      // Check if classroom exists and belongs to admin
      const classroom = await prisma.classroom.findFirst({
        where: {
          id: cId,
          OR: [
            { adminId: user.userId },
            {
              schools: {
                some: {
                  school: { adminId: user.userId }
                }
              }
            }
          ]
        },
        include: {
          schools: {
            include: { school: true }
          }
        }
      })

      if (!classroom) return

      // Check if other admins use this classroom
      const isShared = classroom.schools.some(s => s.school.adminId !== user.userId)

      if (isShared) {
        // Just unlink from this admin's schools
        await prisma.schoolClassroom.deleteMany({
          where: {
            classroomId: cId,
            schoolId: { in: adminSchoolIds }
          }
        })
      } else {
        // Delete completely if no students
        const studentCount = await prisma.student.count({ where: { classroomId: cId } })
        if (studentCount > 0) {
          // If students exist, unlink schools instead of full delete
          await prisma.schoolClassroom.deleteMany({
            where: {
              classroomId: cId,
              schoolId: { in: adminSchoolIds }
            }
          })
        } else {
          await prisma.classroom.delete({
            where: { id: cId }
          })
        }
      }
    }

    if (id) {
      await processDelete(id)
      return successResponse({ success: true, message: 'Classroom deleted/unlinked successfully' })
    }

    if (idsStr) {
      const targetIds = idsStr.split(',').filter(Boolean)
      for (const targetId of targetIds) {
        await processDelete(targetId)
      }
      return successResponse({ success: true, message: 'Classrooms deleted/unlinked successfully' })
    }

    return errorResponse('Bad request', 400)
  } catch (error: any) {
    console.error('Delete classrooms error:', error)
    return errorResponse('Internal server error', 500)
  }
}
