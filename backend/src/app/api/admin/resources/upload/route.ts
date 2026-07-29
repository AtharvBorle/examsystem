import { NextRequest } from 'next/server'
import { getAuthUser, errorResponse, successResponse } from '@/lib/auth-middleware'
import { join } from 'path'
import { writeFile, mkdir } from 'fs/promises'

export const dynamic = 'force-dynamic'

// POST /api/admin/resources/upload - Upload a PDF file to the VPS
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

    // Basic file validation
    const filenameLower = file.name.toLowerCase()
    if (!filenameLower.endsWith('.pdf')) {
      return errorResponse('Only PDF files are allowed', 400)
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Generate unique sanitized filename
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
    const filename = `${Date.now()}_${sanitizedName}`

    // Multi-directory write strategy (static paths) to survive deployments and process root variations
    const potentialDirs = [
      join(process.cwd(), 'public', 'uploads'),
      '/home/bvpindia-api/persistent_uploads',                             // VPS Persistent directory (survives deploy.sh reset)
      '/home/bvpindia-api/htdocs/api.bvpindia.org/backend/public/uploads', // Backend public directory
      '/home/bvpindia-api/htdocs/api.bvpindia.org/public/uploads',         // Top-level public directory (Nginx alias target)
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

    // Return static URL path
    const fileUrl = `/uploads/${filename}`
    return successResponse({ fileUrl })
  } catch (error: any) {
    console.error('File upload error:', error)
    return errorResponse('Internal server error', 500)
  }
}
