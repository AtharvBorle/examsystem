import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

export const dynamic = 'force-dynamic'

const CAPTCHA_SECRET = process.env.JWT_SECRET || 'fallback-super-secret-exam-system-key-2026'

export async function GET(req: NextRequest) {
  try {
    const num1 = Math.floor(Math.random() * 40) + 10 // 10 to 49
    const num2 = Math.floor(Math.random() * 30) + 5  // 5 to 34
    const answer = num1 + num2
    const question = `${num1} + ${num2} = ?`
    const timestamp = Date.now()

    const hash = crypto
      .createHmac('sha256', CAPTCHA_SECRET)
      .update(`${answer}:${timestamp}`)
      .digest('hex')

    const captchaToken = `${timestamp}.${hash}`

    return NextResponse.json({
      success: true,
      question,
      captchaToken,
    })
  } catch (error: any) {
    console.error('Generate captcha error:', error)
    return NextResponse.json({ success: false, error: 'Failed to generate captcha' }, { status: 500 })
  }
}
