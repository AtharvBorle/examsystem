import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser, errorResponse, successResponse } from '@/lib/auth-middleware'

export async function POST(req: NextRequest) {
  try {
    const user = getAuthUser(req)
    if (!user || user.role !== 'STUDENT') {
      return errorResponse('Unauthorized. Student access required.', 401)
    }

    const { firstName, motherName, fatherName, lastName } = await req.json()

    if (!firstName || !motherName || !fatherName || !lastName) {
      return errorResponse('All fields (first, mother, father, last name) are required', 400)
    }

    const trimmedFirstName = firstName.trim()
    const trimmedMotherName = motherName.trim()
    const trimmedFatherName = fatherName.trim()
    const trimmedLastName = lastName.trim()
    
    const nameRegex = /^[A-Za-z\s\u0900-\u097F]+$/

    if (trimmedFirstName.length < 1 || trimmedFirstName.length > 25 || !nameRegex.test(trimmedFirstName)) {
      return errorResponse('First name must be between 1 and 25 characters and contain only letters and spaces', 400)
    }
    if (trimmedLastName.length < 1 || trimmedLastName.length > 25 || !nameRegex.test(trimmedLastName)) {
      return errorResponse('Last name must be between 1 and 25 characters and contain only letters and spaces', 400)
    }
    if (trimmedMotherName.length < 1 || trimmedMotherName.length > 25 || !nameRegex.test(trimmedMotherName)) {
      return errorResponse('Mother\'s name must be between 1 and 25 characters and contain only letters and spaces', 400)
    }
    if (trimmedFatherName.length < 1 || trimmedFatherName.length > 25 || !nameRegex.test(trimmedFatherName)) {
      return errorResponse('Father\'s name must be between 1 and 25 characters and contain only letters and spaces', 400)
    }

    const name = `${trimmedFirstName} ${trimmedMotherName} ${trimmedFatherName} ${trimmedLastName}`.replace(/\s+/g, ' ').trim()
    if (name.length < 4 || name.length > 100) {
      return errorResponse('Combined name must be between 4 and 100 characters', 400)
    }

    const updated = await prisma.student.update({
      where: { id: user.userId },
      data: { name }
    })

    return successResponse({ 
      success: true, 
      name: updated.name,
      message: 'Profile name updated successfully' 
    })
  } catch (error: any) {
    console.error('Update student profile error:', error)
    return errorResponse('Internal server error', 500)
  }
}
