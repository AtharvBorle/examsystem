import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-super-secret-exam-system-key-2026'

export interface TokenPayload {
  userId: string
  role: 'SUPER_ADMIN' | 'ADMIN' | 'STUDENT'
  email?: string
  mobile?: string
}

export function signToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' })
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload
  } catch (error) {
    return null
  }
}
