import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { otpStore, rateLimitStore, getRateLimitStatus, queryRateLimitStatus } from '@/lib/otp-store'
import { errorResponse, successResponse } from '@/lib/auth-middleware'

export async function POST(req: NextRequest) {
  try {
    const { mobile } = await req.json()

    if (!mobile) {
      return errorResponse('Mobile number is required', 400)
    }

    // Validate 10-digit Indian phone number starting with 6-9
    const mobileRegex = /^[6-9]\d{9}$/
    if (!mobileRegex.test(mobile)) {
      return errorResponse('Mobile number must be a valid 10-digit number starting with 6, 7, 8, or 9', 400)
    }

    // Rate Limiting Check
    const mobileLimit = getRateLimitStatus(`mobile:${mobile}`)
    if (!mobileLimit.allowed) {
      return NextResponse.json({
        success: false,
        error: `Too many attempts for this mobile number. Please try again after ${mobileLimit.minutesRemaining} minutes.`,
        minutesRemaining: mobileLimit.minutesRemaining,
        remainingAttempts: 0
      }, { status: 429 })
    }

    // Check if already registered
    const existingStudent = await prisma.student.findUnique({ where: { mobile } })
    const existingAdmin = await prisma.admin.findUnique({ where: { mobile } })
    if (existingStudent || existingAdmin) {
      return errorResponse('Mobile number is already registered', 400)
    }

    // Apply the rate limit increments
    if (mobileLimit.entry) rateLimitStore.set(`mobile:${mobile}`, mobileLimit.entry)

    // Generate random 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString()
    const expiryMinutes = 10
    const expiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000)

    // Store in global memory map
    otpStore.set(mobile, {
      code: otp,
      expiresAt,
      verified: false
    })

    // Send OTP via Way2Smart SMS API
    const smsApiUrl = process.env.SMS_API_URL
    const smsSender = process.env.SMS_SENDER
    const smsApiKey = process.env.SMS_API_KEY
    const smsDltEntityId = process.env.SMS_DLT_ENTITY_ID
    const smsDltTemplateId = process.env.SMS_DLT_TEMPLATE_ID

    if (smsApiUrl && smsApiKey) {
      const message = `Dear User , your verification code is ${otp} . This code will expire in ${expiryMinutes} Min - Neopace Team`

      const params = new URLSearchParams({
        sender: smsSender || 'NEOPCE',
        numbers: mobile,
        message: message,
        messagetype: 'TXT',
        reponse: 'Y',
        apikey: smsApiKey,
        dltentityid: smsDltEntityId || '',
        dlttempid: smsDltTemplateId || '',
      })

      const fullUrl = `${smsApiUrl}?${params.toString()}`

      try {
        const smsRes = await fetch(fullUrl)
        const smsText = await smsRes.text()
        console.log(`\n==================================================`)
        console.log(`[SMS API] OTP: ${otp} sent to mobile: ${mobile}`)
        console.log(`[SMS API] Response: ${smsText}`)
        console.log(`Valid until: ${expiresAt.toLocaleTimeString()}`)
        console.log(`==================================================\n`)
      } catch (smsErr) {
        console.error(`[SMS API] Failed to send SMS to ${mobile}:`, smsErr)
        console.log(`[SMS FALLBACK] OTP: ${otp} for mobile: ${mobile}`)
      }
    } else {
      // Fallback: log to console if API credentials are missing
      console.log(`\n==================================================`)
      console.log(`[SMS MOCK] Sent OTP: ${otp} to mobile: ${mobile}`)
      console.log(`Valid until: ${expiresAt.toLocaleTimeString()}`)
      console.log(`==================================================\n`)
    }

    // Calculate remaining attempts for the client mobile number
    const mobileStatus = queryRateLimitStatus(`mobile:${mobile}`)
    const remainingAttempts = mobileStatus.remaining

    return successResponse({
      success: true,
      remainingAttempts,
    }, 200)
  } catch (error: any) {
    console.error('Send OTP error:', error)
    return errorResponse('Internal server error', 500)
  }
}
