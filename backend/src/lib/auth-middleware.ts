import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, TokenPayload } from './jwt'

export interface AuthenticatedRequest extends NextRequest {
  user?: TokenPayload
}

export function getAuthUser(req: NextRequest): TokenPayload | null {
  try {
    const authHeader = req.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null
    }
    const token = authHeader.substring(7)
    return verifyToken(token)
  } catch (error) {
    return null
  }
}

export function errorResponse(message: string, status = 400) {
  return NextResponse.json({ success: false, error: message }, { status })
}

export function successResponse(data: any, status = 200) {
  return NextResponse.json({ success: true, ...data }, { status })
}
