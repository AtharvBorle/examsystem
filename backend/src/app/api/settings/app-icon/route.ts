import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { errorResponse } from '@/lib/auth-middleware'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(req: NextRequest) {
  try {
    const setting = await prisma.systemSetting.findUnique({
      where: { key: 'active_app_icon' },
    })

    const iconKey = setting?.value === 'BVP_BKJ' ? 'BVP_BKJ' : 'DEFAULT'
    const fileName = iconKey === 'BVP_BKJ' ? 'BVP-BKJ_icon.jpeg' : 'app_icon.jpeg'
    const iconUrl = `/${fileName}`

    return NextResponse.json(
      {
        success: true,
        iconKey,
        fileName,
        iconUrl,
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      }
    )
  } catch (error: any) {
    console.error('Fetch active app icon error:', error)
    return errorResponse('Internal server error', 500)
  }
}
