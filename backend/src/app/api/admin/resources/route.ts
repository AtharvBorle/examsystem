import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser, errorResponse, successResponse } from '@/lib/auth-middleware'

export const dynamic = 'force-dynamic'

// GET /api/admin/resources - Get all resources created by this admin
export async function GET(req: NextRequest) {
  try {
    const user = getAuthUser(req)
    if (!user || user.role !== 'ADMIN') {
      return errorResponse('Unauthorized. Admin access required.', 401)
    }

    const resources = await prisma.resource.findMany({
      where: { adminId: user.userId },
      orderBy: { createdAt: 'desc' },
    })

    return successResponse({ resources })
  } catch (error: any) {
    console.error('List resources error:', error)
    return errorResponse('Internal server error', 500)
  }
}

// POST /api/admin/resources - Create a new resource
export async function POST(req: NextRequest) {
  try {
    const user = getAuthUser(req)
    if (!user || user.role !== 'ADMIN') {
      return errorResponse('Unauthorized. Admin access required.', 401)
    }

    const { title, titleHindi, description, descriptionHindi, link, linkHindi } = await req.json()

    if (!title || !title.trim()) {
      return errorResponse('Title is required', 400)
    }

    const resource = await prisma.resource.create({
      data: {
        title: title.trim(),
        titleHindi: titleHindi?.trim() || null,
        description: description?.trim() || null,
        descriptionHindi: descriptionHindi?.trim() || null,
        link: link?.trim() || null,
        linkHindi: linkHindi?.trim() || null,
        adminId: user.userId,
      },
    })

    return successResponse({ resource })
  } catch (error: any) {
    console.error('Create resource error:', error)
    return errorResponse('Internal server error', 500)
  }
}

// PUT /api/admin/resources - Update an existing resource
export async function PUT(req: NextRequest) {
  try {
    const user = getAuthUser(req)
    if (!user || user.role !== 'ADMIN') {
      return errorResponse('Unauthorized. Admin access required.', 401)
    }

    const { id, title, titleHindi, description, descriptionHindi, link, linkHindi } = await req.json()

    if (!id) {
      return errorResponse('Resource ID is required', 400)
    }
    if (!title || !title.trim()) {
      return errorResponse('Title is required', 400)
    }

    const existing = await prisma.resource.findUnique({
      where: { id },
    })

    if (!existing || existing.adminId !== user.userId) {
      return errorResponse('Resource not found or unauthorized', 404)
    }

    const updated = await prisma.resource.update({
      where: { id },
      data: {
        title: title.trim(),
        titleHindi: titleHindi?.trim() || null,
        description: description?.trim() || null,
        descriptionHindi: descriptionHindi?.trim() || null,
        link: link?.trim() || null,
        linkHindi: linkHindi?.trim() || null,
      },
    })

    return successResponse({ resource: updated })
  } catch (error: any) {
    console.error('Update resource error:', error)
    return errorResponse('Internal server error', 500)
  }
}

// DELETE /api/admin/resources - Delete a resource
export async function DELETE(req: NextRequest) {
  try {
    const user = getAuthUser(req)
    if (!user || user.role !== 'ADMIN') {
      return errorResponse('Unauthorized. Admin access required.', 401)
    }

    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (!id) {
      return errorResponse('Missing parameter: id is required', 400)
    }

    const existing = await prisma.resource.findUnique({
      where: { id },
    })

    if (!existing || existing.adminId !== user.userId) {
      return errorResponse('Resource not found or unauthorized', 404)
    }

    await prisma.resource.delete({
      where: { id },
    })

    return successResponse({ message: 'Resource deleted successfully' })
  } catch (error: any) {
    console.error('Delete resource error:', error)
    return errorResponse('Internal server error', 500)
  }
}
