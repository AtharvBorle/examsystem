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

    const setting = await prisma.systemSetting.findUnique({
      where: { key: 'active_app_icon' },
    })

    const iconKey = setting?.value === 'BVP_BKJ' ? 'BVP_BKJ' : 'DEFAULT'
    return successResponse({ iconKey })
  } catch (error: any) {
    console.error('Super-Admin get app icon error:', error)
    return errorResponse('Internal server error', 500)
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = getAuthUser(req)
    if (!user || user.role !== 'SUPER_ADMIN') {
      return errorResponse('Unauthorized. Super-Admin access required.', 401)
    }

    const body = await req.json()
    const { iconKey } = body

    if (iconKey !== 'DEFAULT' && iconKey !== 'BVP_BKJ') {
      return errorResponse('Invalid iconKey. Allowed values: DEFAULT, BVP_BKJ', 400)
    }

    const setting = await prisma.systemSetting.upsert({
      where: { key: 'active_app_icon' },
      update: { value: iconKey },
      create: { key: 'active_app_icon', value: iconKey },
    })

    return successResponse({
      iconKey: setting.value,
      message: `Active app icon updated to ${setting.value === 'BVP_BKJ' ? 'BVP-BKJ Icon' : 'Default Icon'} successfully.`,
    })
  } catch (error: any) {
    console.error('Super-Admin trigger app icon error:', error)
    return errorResponse('Internal server error', 500)
  }
}
