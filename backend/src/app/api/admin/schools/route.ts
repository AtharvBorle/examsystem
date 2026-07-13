import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser, errorResponse, successResponse } from '@/lib/auth-middleware'

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
      // Find all schools sharing this UDISE before the update
      const relatedSchools = await tx.school.findMany({
        where: { udise: school.udise }
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

      // Find all school IDs now sharing the new/updated UDISE number
      const finalSchools = await tx.school.findMany({
        where: { udise }
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
    const id = searchParams.get('id')
    const idsStr = searchParams.get('ids')

    if (!id && !idsStr) {
      return errorResponse('Missing parameter: id or ids is required', 400)
    }

            if (id) {
      // Verify existence
      const school = await prisma.school.findUnique({ where: { id } })
      if (!school) {
        return errorResponse('School not found', 404)
      }

      // Fetch student IDs under this school
      const students = await prisma.student.findMany({
        where: { schoolId: id },
        select: { id: true }
      })
      const studentIds = students.map(s => s.id)

      await prisma.$transaction([
        prisma.examAttempt.deleteMany({
          where: { studentId: { in: studentIds } }
        }),
        prisma.student.deleteMany({
          where: { schoolId: id }
        }),
        prisma.schoolClassroom.deleteMany({
          where: { schoolId: id }
        }),
        prisma.schoolExam.deleteMany({
          where: { schoolId: id }
        }),
        prisma.school.delete({ where: { id } })
      ])
      return successResponse({ success: true, message: 'School and all associated student records deleted successfully' })
    }

    if (idsStr) {
      const targetIds = idsStr.split(',').filter(Boolean)

      // Filter targetIds to check existence
      const ownedSchools = await prisma.school.findMany({
        where: { id: { in: targetIds } },
        select: { id: true }
      })
      const ownedIds = ownedSchools.map(s => s.id)

      if (ownedIds.length === 0) {
        return errorResponse('No matching schools found for deletion', 400)
      }

      // Fetch student IDs under these schools
      const students = await prisma.student.findMany({
        where: { schoolId: { in: ownedIds } },
        select: { id: true }
      })
      const studentIds = students.map(s => s.id)

      await prisma.$transaction([
        prisma.examAttempt.deleteMany({
          where: { studentId: { in: studentIds } }
        }),
        prisma.student.deleteMany({
          where: { schoolId: { in: ownedIds } }
        }),
        prisma.schoolClassroom.deleteMany({
          where: { schoolId: { in: ownedIds } }
        }),
        prisma.schoolExam.deleteMany({
          where: { schoolId: { in: ownedIds } }
        }),
        prisma.school.deleteMany({
          where: { id: { in: ownedIds } }
        })
      ])
      return successResponse({ success: true, message: `${ownedIds.length} schools and all associated student records deleted successfully` })
    }

    return errorResponse('Bad request', 400)
  } catch (error: any) {
    console.error('Delete school error:', error)
    return errorResponse('Internal server error', 500)
  }
}
