import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser, errorResponse, successResponse } from '@/lib/auth-middleware'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const user = getAuthUser(req)
    if (!user || user.role !== 'ADMIN') {
      return errorResponse('Unauthorized. Admin access required.', 401)
    }

    const { searchParams } = new URL(req.url)
    const language = searchParams.get('language') || 'en'

    // Check if there are any schools seeded in the target language managed by this admin
    const hasTargetLangSchools = await prisma.school.count({
      where: { adminId: user.userId, language }
    })

    const targetQueryLang = hasTargetLangSchools > 0 ? language : 'en'

    // Fetch schools in the target query language
    const schools = await prisma.school.findMany({
      where: { adminId: user.userId, language: targetQueryLang },
      orderBy: { createdAt: 'desc' },
      include: {
        classrooms: {
          include: { classroom: true },
        },
      },
    })

    const formattedSchools = schools.map((school) => {
      return {
        id: school.id,
        name: school.name,
        udise: school.udise,
        tehsil: school.tehsil,
        district: school.district,
        language: language, // Return the requested language to match the frontend filter!
        classrooms: school.classrooms.map((sc: any) => ({
          id: sc.classroom.id,
          name: sc.classroom.name,
        })),
      }
    })

    // Sort by name alphabetically
    formattedSchools.sort((a, b) => a.name.localeCompare(b.name))

    return successResponse({ schools: formattedSchools })
  } catch (error: any) {
    console.error('List schools error:', error)
    return errorResponse('Internal server error', 500)
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = getAuthUser(req)
    if (!user || user.role !== 'ADMIN') {
      return errorResponse('Unauthorized. Admin access required.', 401)
    }

    const body = await req.json()
    const { id, name, udise, tehsil, district, classroomIds } = body

    if (!id || !name || !udise) {
      return errorResponse('id, name, and udise are required', 400)
    }

    // Verify ownership
    const school = await prisma.school.findUnique({ where: { id } })
    if (!school || school.adminId !== user.userId) {
      return errorResponse('School not found or unauthorized', 404)
    }

    const updated = await prisma.$transaction(async (tx) => {
      // Find all schools sharing this UDISE managed by this admin before the update
      const relatedSchools = await tx.school.findMany({
        where: { udise: school.udise, adminId: user.userId }
      })
      const relatedSchoolIds = relatedSchools.map(s => s.id)

      // 1. Update the target record being edited
      const u = await tx.school.update({
        where: { id },
        data: { name, udise, tehsil, district },
      })

      // 2. Update shared details (udise, tehsil, district) on other language rows of this school
      if (relatedSchoolIds.length > 1) {
        await tx.school.updateMany({
          where: {
            id: { in: relatedSchoolIds.filter(x => x !== id) }
          },
          data: { udise, tehsil, district }
        })
      }

      // Find all school IDs now sharing the new/updated UDISE number for this admin
      const finalSchools = await tx.school.findMany({
        where: { udise, adminId: user.userId }
      })
      const finalSchoolIds = finalSchools.map(s => s.id)

      // 3. Sync classroom mappings for all localized rows of this school
      if (Array.isArray(classroomIds)) {
        await tx.schoolClassroom.deleteMany({
          where: {
            schoolId: { in: finalSchoolIds },
            classroomId: { notIn: classroomIds }
          }
        })

        for (const sId of finalSchoolIds) {
          const existing = await tx.schoolClassroom.findMany({
            where: { schoolId: sId },
            select: { classroomId: true },
          })
          const existingSet = new Set(existing.map(e => e.classroomId))
          const toCreate = classroomIds.filter((cId: string) => !existingSet.has(cId))
          if (toCreate.length > 0) {
            await tx.schoolClassroom.createMany({
              data: toCreate.map((cId: string) => ({
                schoolId: sId,
                classroomId: cId,
              })),
              skipDuplicates: true,
            })
          }
        }
      }

      return u
    }, { timeout: 15000 })

    return successResponse({ school: updated })
  } catch (error: any) {
    console.error('Update school error:', error)
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
    let id = searchParams.get('id')
    let idsStr = searchParams.get('ids')
    let bodyIds: string[] = []

    // Also parse JSON body if provided (recommended for bulk deletes to avoid URL length limit)
    try {
      const body = await req.json()
      if (body) {
        if (typeof body.id === 'string' && body.id) {
          id = body.id
        }
        if (Array.isArray(body.ids)) {
          bodyIds = body.ids.filter((x: any) => typeof x === 'string' && x.trim().length > 0)
        }
      }
    } catch (e) {
      // Body might be empty when using query params
    }

    const targetIds: string[] = []
    if (id) targetIds.push(id)
    if (idsStr) targetIds.push(...idsStr.split(',').map(s => s.trim()).filter(Boolean))
    if (bodyIds.length > 0) targetIds.push(...bodyIds)

    if (targetIds.length === 0) {
      return errorResponse('Missing parameter: id or ids is required', 400)
    }

    // Find all schools in targetIds owned by this admin
    const ownedSchools = await prisma.school.findMany({
      where: {
        id: { in: targetIds },
        adminId: user.userId,
      },
      select: { id: true, udise: true },
    })

    if (ownedSchools.length === 0) {
      return errorResponse('No matching schools found or unauthorized', 404)
    }

    // Get all unique UDISEs
    const targetUdises = Array.from(new Set(ownedSchools.map((s) => s.udise)))

    // Find ALL school record IDs sharing these UDISEs for this admin (both 'en' and 'hi' entries)
    const allMatchingSchools = await prisma.school.findMany({
      where: {
        udise: { in: targetUdises },
        adminId: user.userId,
      },
      select: { id: true },
    })
    const allSchoolIds = allMatchingSchools.map((s) => s.id)

    // Perform cascade delete inside transaction with extended timeout
    const deleteResult = await prisma.$transaction(async (tx) => {
      // 1. Delete all exam attempts for students belonging to these schools
      await tx.examAttempt.deleteMany({
        where: {
          student: {
            schoolId: { in: allSchoolIds },
          },
        },
      })

      // 2. Delete all students belonging to these schools
      await tx.student.deleteMany({
        where: {
          schoolId: { in: allSchoolIds },
        },
      })

      // 3. Delete school-classroom join records
      await tx.schoolClassroom.deleteMany({
        where: {
          schoolId: { in: allSchoolIds },
        },
      })

      // 4. Delete school-exam join records
      await tx.schoolExam.deleteMany({
        where: {
          schoolId: { in: allSchoolIds },
        },
      })

      // 5. Delete the schools
      return await tx.school.deleteMany({
        where: {
          id: { in: allSchoolIds },
        },
      })
    }, {
      timeout: 60000,
      maxWait: 15000,
    })

    return successResponse({
      success: true,
      message: `${targetUdises.length} school(s) and all associated student records deleted successfully`,
      count: deleteResult.count,
    })
  } catch (error: any) {
    console.error('Delete school error:', error)
    return errorResponse('Internal server error', 500)
  }
}
