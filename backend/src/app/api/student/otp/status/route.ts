import { NextRequest } from 'next/server'
import { queryRateLimitStatus } from '@/lib/otp-store'
import { errorResponse, successResponse } from '@/lib/auth-middleware'

export async function GET(req: NextRequest) {
  try {
    const mobile = req.nextUrl.searchParams.get('mobile')

    let remainingAttempts = 3
    let minutesRemaining = 0

    if (mobile && /^[6-9]\d{9}$/.test(mobile)) {
      const mobileStatus = queryRateLimitStatus(`mobile:${mobile}`)
      remainingAttempts = mobileStatus.remaining
      minutesRemaining = mobileStatus.minutesRemaining
    }

    return successResponse({
      success: true,
      remainingAttempts,
      minutesRemaining,
    }, 200)
  } catch (error: any) {
    console.error('Check OTP status error:', error)
    return errorResponse('Internal server error', 500)
  }
}
