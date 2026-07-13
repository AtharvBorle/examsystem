import { NextRequest } from 'next/server'
import { otpStore } from '@/lib/otp-store'
import { errorResponse, successResponse } from '@/lib/auth-middleware'

export async function POST(req: NextRequest) {
  try {
    const { mobile, otp } = await req.json()

    if (!mobile || !otp) {
      return errorResponse('Mobile number and OTP are required', 400)
    }

    const entry = otpStore.get(mobile)
    if (!entry) {
      return errorResponse('OTP not requested or expired', 400)
    }

    // Check expiry
    if (new Date() > entry.expiresAt) {
      otpStore.delete(mobile) // clean up expired
      return errorResponse('OTP has expired. Please request a new one.', 400)
    }

    // Check code match
    if (entry.code !== otp) {
      return errorResponse('Invalid OTP. Please try again.', 400)
    }

    // Mark as verified
    otpStore.set(mobile, {
      ...entry,
      verified: true
    })

    return successResponse({
      success: true,
      message: 'Mobile number verified successfully'
    }, 200)
  } catch (error: any) {
    console.error('Verify OTP error:', error)
    return errorResponse('Internal server error', 500)
  }
}
