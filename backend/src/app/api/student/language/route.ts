import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser, errorResponse, successResponse } from '@/lib/auth-middleware'
import { translateClassroomName } from '@/lib/class-translator'

export async function POST(req: NextRequest) {
  try {
    const user = getAuthUser(req)
    if (!user || user.role !== 'STUDENT') {
      return errorResponse('Unauthorized. Student access required.', 401)
    }

    const { language } = await req.json()
    if (!language || !['en', 'hi'].includes(language)) {
      return errorResponse('Valid language (en or hi) is required', 400)
    }

    // Find current student and school details
    const student = await prisma.student.findUnique({
      where: { id: user.userId },
      include: { school: true }
    })
    if (!student) {
      return errorResponse('Student not found', 404)
    }

    // Determine target school matching the new language and same UDISE number
    let targetSchoolId = student.schoolId
    let schoolName = student.school.name

    const targetSchool = await prisma.school.findFirst({
      where: {
        udise: student.school.udise,
        language,
      }
    })

    if (targetSchool) {
      targetSchoolId = targetSchool.id
      schoolName = targetSchool.name
    } else {
      // Fallback to English record if target language record is missing
      const enSchool = await prisma.school.findFirst({
        where: {
          udise: student.school.udise,
          language: 'en',
        }
      })
      if (enSchool) {
        targetSchoolId = enSchool.id
        schoolName = enSchool.name
      }
    }

    // Now update student record
    const updated = await prisma.student.update({
      where: { id: user.userId },
      data: {
        language,
        schoolId: targetSchoolId,
      },
      include: {
        school: true,
        classroom: true,
      }
    })

    const classroomName = translateClassroomName(updated.classroom.name, updated.language)

    return successResponse({ 
      message: 'Language updated successfully',
      language: updated.language,
      school: { id: updated.school.id, name: schoolName },
      classroom: { id: updated.classroom.id, name: classroomName },
    })
  } catch (error: any) {
    console.error('Update student language error:', error)
    return errorResponse('Internal server error', 500)
  }
}
