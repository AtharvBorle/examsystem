import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { errorResponse, successResponse } from '@/lib/auth-middleware'
import { translateClassroomName } from '@/lib/class-translator'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const schoolId = searchParams.get('schoolId')
    const language = searchParams.get('language') || 'en'

    if (!schoolId) {
      return errorResponse('schoolId query parameter is required', 400)
    }

    // Find UDISE of the requested school
    const requestedSchool = await prisma.school.findUnique({
      where: { id: schoolId }
    })
    if (!requestedSchool) {
      return errorResponse('School not found', 404)
    }

    // Find all school IDs sharing the same UDISE number
    const relatedSchools = await prisma.school.findMany({
      where: { udise: requestedSchool.udise },
      select: { id: true }
    })
    const relatedSchoolIds = relatedSchools.map(s => s.id)

    const schoolClassrooms = await prisma.schoolClassroom.findMany({
      where: { schoolId: { in: relatedSchoolIds } },
      include: {
        classroom: {
          select: { id: true, name: true },
        },
      },
      orderBy: {
        classroom: { name: 'asc' },
      },
    })

    // Remove duplicate classroom mappings (in case mapped to both English and Hindi school rows)
    const uniqueClassroomsMap = new Map<string, any>()
    for (const sc of schoolClassrooms) {
      if (!uniqueClassroomsMap.has(sc.classroom.id)) {
        uniqueClassroomsMap.set(sc.classroom.id, sc.classroom)
      }
    }

    const classrooms = Array.from(uniqueClassroomsMap.values()).map((cls) => {
      return {
        id: cls.id,
        name: translateClassroomName(cls.name, language),
      }
    })

    return successResponse({ classrooms })
  } catch (error: any) {
    console.error('Fetch school classrooms error:', error)
    return errorResponse('Internal server error', 500)
  }
}
