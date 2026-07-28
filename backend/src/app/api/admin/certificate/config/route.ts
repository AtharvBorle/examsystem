import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser, errorResponse, successResponse } from '@/lib/auth-middleware'

export const dynamic = 'force-dynamic'

// GET /api/admin/certificate/config - Retrieve current admin's certificate configurations
export async function GET(req: NextRequest) {
  try {
    const user = getAuthUser(req)
    if (!user || user.role !== 'ADMIN') {
      return errorResponse('Unauthorized. Admin access required.', 401)
    }

    const admin = await prisma.admin.findUnique({
      where: { id: user.userId },
      select: {
        presidentName: true,
        presidentNameHindi: true,
        presidentSignature: true,
        secretaryName: true,
        secretaryNameHindi: true,
        secretarySignature: true,
      }
    })

    if (!admin) {
      return errorResponse('Admin not found', 404)
    }

    return successResponse({ config: admin })
  } catch (error: any) {
    console.error('Fetch certificate config error:', error)
    return errorResponse('Internal server error', 500)
  }
}

// POST /api/admin/certificate/config - Update current admin's certificate configurations
export async function POST(req: NextRequest) {
  try {
    const user = getAuthUser(req)
    if (!user || user.role !== 'ADMIN') {
      return errorResponse('Unauthorized. Admin access required.', 401)
    }

    const {
      presidentName,
      presidentNameHindi,
      presidentSignature,
      secretaryName,
      secretaryNameHindi,
      secretarySignature
    } = await req.json()

    const updated = await prisma.admin.update({
      where: { id: user.userId },
      data: {
        presidentName: presidentName !== undefined ? presidentName : null,
        presidentNameHindi: presidentNameHindi !== undefined ? presidentNameHindi : null,
        presidentSignature: presidentSignature !== undefined ? presidentSignature : null,
        secretaryName: secretaryName !== undefined ? secretaryName : null,
        secretaryNameHindi: secretaryNameHindi !== undefined ? secretaryNameHindi : null,
        secretarySignature: secretarySignature !== undefined ? secretarySignature : null,
      },
      select: {
        presidentName: true,
        presidentNameHindi: true,
        presidentSignature: true,
        secretaryName: true,
        secretaryNameHindi: true,
        secretarySignature: true,
      }
    })

    return successResponse({ 
      success: true, 
      config: updated, 
      message: 'Certificate configurations updated successfully' 
    })
  } catch (error: any) {
    console.error('Save certificate config error:', error)
    return errorResponse('Internal server error', 500)
  }
}
