import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { errorResponse, successResponse } from '@/lib/auth-middleware'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const query = searchParams.get('search') || ''
    const language = searchParams.get('language') || 'en'

    // Check if there are any schools seeded in the database matching the requested language
    const hasTargetLangSchools = await prisma.school.count({
      where: { language }
    })

    const targetQueryLang = hasTargetLangSchools > 0 ? language : 'en'

    const schools = await prisma.school.findMany({
      where: {
        language: targetQueryLang,
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { udise: { contains: query, mode: 'insensitive' } },
          { tehsil: { contains: query, mode: 'insensitive' } },
          { district: { contains: query, mode: 'insensitive' } },
        ]
      },
      take: 20,
    })

    const formatted = schools.map((school) => ({
      id: school.id,
      name: school.name,
      udise: school.udise,
      tehsil: school.tehsil,
      district: school.district,
    }))

    // Sort matching results alphabetically by name
    formatted.sort((a, b) => a.name.localeCompare(b.name))

    return successResponse({ schools: formatted })
  } catch (error: any) {
    console.error('Fetch student schools error:', error)
    return errorResponse('Internal server error', 500)
  }
}
