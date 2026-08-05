import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser, errorResponse, successResponse } from '@/lib/auth-middleware'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const user = getAuthUser(req)
    if (!user || user.role !== 'SUPER_ADMIN') {
      return errorResponse('Unauthorized. Super-Admin access required.', 401)
    }

    const { searchParams } = new URL(req.url)
    const schoolId = searchParams.get('schoolId')
    const search = searchParams.get('search')
    const language = searchParams.get('language') || 'en'

    const where: any = {}

    if (schoolId && schoolId !== 'all') {
      const selectedSchool = await prisma.school.findUnique({
        where: { id: schoolId },
        select: { udise: true }
      })
      if (selectedSchool) {
        const matchingSchools = await prisma.school.findMany({
          where: { udise: selectedSchool.udise },
          select: { id: true }
        })
        where.schoolId = { in: matchingSchools.map(s => s.id) }
      }
    }

    if (search && search.trim() !== '') {
      const q = search.trim()
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { mobile: { contains: q, mode: 'insensitive' } },
        { district: { contains: q, mode: 'insensitive' } },
        { tehsil: { contains: q, mode: 'insensitive' } },
        { school: { name: { contains: q, mode: 'insensitive' } } },
        { school: { udise: { contains: q, mode: 'insensitive' } } },
        { classroom: { name: { contains: q, mode: 'insensitive' } } },
      ]
    }

    const students = await prisma.student.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        school: { select: { id: true, name: true, udise: true } },
        classroom: { select: { id: true, name: true } },
      },
    })

    // Fetch the target-language school details for mapping
    const studentSchoolUdises = Array.from(new Set(students.map(std => std.school?.udise).filter(Boolean))) as string[]
    const schoolsInTargetLang = await prisma.school.findMany({
      where: {
        udise: { in: studentSchoolUdises },
        language
      },
      select: { id: true, udise: true, name: true }
    })
    
    // Create mapping of UDISE to translated school ID and name
    const schoolMap: Record<string, { id: string; name: string }> = {}
    schoolsInTargetLang.forEach(s => {
      schoolMap[s.udise] = { id: s.id, name: s.name }
    })

    const formatted = students.map((std) => {
      const udise = std.school?.udise || ''
      const targetSchool = schoolMap[udise]
      const schoolIdMapped = targetSchool?.id || std.schoolId
      const schoolNameMapped = targetSchool?.name || std.school?.name || ''

      return {
        id: std.id,
        name: std.name,
        mobile: std.mobile,
        schoolId: schoolIdMapped,
        schoolName: schoolNameMapped,
        udise,
        classroomId: std.classroomId,
        classroomName: std.classroom?.name || '',
        district: std.district || '',
        tehsil: std.tehsil || '',
        registeredAt: std.createdAt,
        acceptedTerms: std.acceptedTerms ?? true,
        acceptedTermsAt: std.acceptedTermsAt || std.createdAt,
      }
    })

    return successResponse({ students: formatted })
  } catch (error: any) {
    console.error('Super-Admin fetch students error:', error)
    return errorResponse('Internal server error', 500)
  }
}
