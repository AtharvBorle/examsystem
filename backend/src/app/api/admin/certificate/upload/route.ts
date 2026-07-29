import { NextRequest } from 'next/server'
import { getAuthUser, errorResponse, successResponse } from '@/lib/auth-middleware'
import { join } from 'path'
import { writeFile, mkdir } from 'fs/promises'

export const dynamic = 'force-dynamic'

// POST /api/admin/certificate/upload - Upload a signature image file (png, jpg, jpeg) to the server
export async function POST(req: NextRequest) {
  try {
    const user = getAuthUser(req)
    if (!user || user.role !== 'ADMIN') {
      return errorResponse('Unauthorized. Admin access required.', 401)
    }

    const data = await req.formData()
    const file = data.get('file') as File | null

    if (!file) {
      return errorResponse('No file uploaded', 400)
    }

    const filenameLower = file.name.toLowerCase()
    const allowedExtensions = ['.png', '.jpg', '.jpeg']
    const hasAllowedExtension = allowedExtensions.some(ext => filenameLower.endsWith(ext))

    if (!hasAllowedExtension) {
      return errorResponse('Only PNG, JPG, or JPEG image files are allowed', 400)
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Generate unique sanitized filename
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
    const filename = `sig_${Date.now()}_${sanitizedName}`

    // Multi-directory write strategy to survive git pulls, redeployments, and process root variations
    const potentialDirs = [
      join(process.cwd(), 'public', 'uploads'),
      join(process.cwd(), '..', 'public', 'uploads'),
      '/home/bvpindia-api/htdocs/api.bvpindia.org/public/uploads',
      join(process.cwd(), '.next', 'standalone', 'public', 'uploads'),
      '/tmp/uploads',
    ]

    let written = false
    for (const dir of potentialDirs) {
      try {
        await mkdir(dir, { recursive: true })
        const filePath = join(dir, filename)
        await writeFile(filePath, buffer)
        written = true
      } catch (err) {
        // Silently skip if directory is not writable
      }
    }

    if (!written) {
      return errorResponse('Failed to write file to any storage directory', 500)
    }

    // Return dynamic API URL path instead of direct public folder URL
    const fileUrl = `/api/uploads/${filename}`
    return successResponse({ fileUrl })
  } catch (error: any) {
    console.error('Signature upload error:', error)
    return errorResponse('Internal server error', 500)
  }
}
