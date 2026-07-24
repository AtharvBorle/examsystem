import { prisma } from './prisma'

export interface OtpEntry {
  code: string
  expiresAt: Date
  verified: boolean
}

export interface RateLimitEntry {
  count: number
  firstAttemptAt: Date
}

const globalForOtp = global as unknown as {
  rateLimitStore?: Map<string, RateLimitEntry>
}

export const rateLimitStore =
  globalForOtp.rateLimitStore || new Map<string, RateLimitEntry>()

if (process.env.NODE_ENV !== 'production') {
  globalForOtp.rateLimitStore = rateLimitStore
}

// Database-backed OTP helper functions
export async function setOtp(mobile: string, code: string, expiresAt: Date, verified = false) {
  return await prisma.otp.upsert({
    where: { mobile },
    update: { code, expiresAt, verified },
    create: { mobile, code, expiresAt, verified }
  })
}

export async function getOtp(mobile: string): Promise<OtpEntry | null> {
  const otp = await prisma.otp.findUnique({
    where: { mobile }
  })
  if (!otp) return null
  return {
    code: otp.code,
    expiresAt: otp.expiresAt,
    verified: otp.verified
  }
}

export async function deleteOtp(mobile: string) {
  try {
    return await prisma.otp.delete({
      where: { mobile }
    })
  } catch (error) {
    // Ignore error if already deleted
    return null
  }
}

export function getRateLimitStatus(key: string, maxAttempts = 3, windowMs = 60 * 60 * 1000) {
  const now = new Date()
  const entry = rateLimitStore.get(key)

  if (!entry) {
    return { allowed: true, entry: { count: 1, firstAttemptAt: now } }
  }

  const timePassed = now.getTime() - entry.firstAttemptAt.getTime()

  if (timePassed > windowMs) {
    return { allowed: true, entry: { count: 1, firstAttemptAt: now } }
  }

  if (entry.count >= maxAttempts) {
    const msRemaining = windowMs - timePassed
    const minutesRemaining = Math.ceil(msRemaining / (60 * 1000))
    return { allowed: false, minutesRemaining }
  }

  return { allowed: true, entry: { count: entry.count + 1, firstAttemptAt: entry.firstAttemptAt } }
}

export function queryRateLimitStatus(key: string, maxAttempts = 3, windowMs = 60 * 60 * 1000) {
  const now = new Date()
  const entry = rateLimitStore.get(key)

  if (!entry) {
    return { remaining: maxAttempts, minutesRemaining: 0 }
  }

  const timePassed = now.getTime() - entry.firstAttemptAt.getTime()

  if (timePassed > windowMs) {
    return { remaining: maxAttempts, minutesRemaining: 0 }
  }

  const remaining = Math.max(0, maxAttempts - entry.count)
  const msRemaining = windowMs - timePassed
  const minutesRemaining = remaining === 0 ? Math.ceil(msRemaining / (60 * 1000)) : 0

  return { remaining, minutesRemaining }
}
