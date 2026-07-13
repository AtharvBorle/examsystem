import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { otpStore } from '@/lib/otp-store'
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

    // Check if already registered
    const existingStudent = await prisma.student.findUnique({ where: { mobile } })
    const existingAdmin = await prisma.admin.findUnique({ where: { mobile } })
    if (existingStudent || existingAdmin) {
      return errorResponse('Mobile number is already registered', 400)
    }

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
      const message = `Dear Customer, your OTP is ${otp}, Your Code is valid for ${expiryMinutes} Minutes. -NEOPACE INFOTECH LLP`

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

    return successResponse({
      success: true,
    }, 200)
  } catch (error: any) {
    console.error('Send OTP error:', error)
    return errorResponse('Internal server error', 500)
  }
}
