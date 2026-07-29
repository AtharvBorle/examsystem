import { NextRequest, NextResponse } from 'next/server'
import { join } from 'path'
import { readFile } from 'fs/promises'
import { existsSync } from 'fs'

export const dynamic = 'force-dynamic'

// GET /api/uploads/[filename] - Serve uploaded files dynamically from public/uploads at runtime
export async function GET(
  req: NextRequest,
  { params }: { params: { filename: string } }
) {
  try {
    const filename = params.filename
    if (!filename) {
      return new NextResponse('Filename is required', { status: 400 })
    }

    // Sanitize filename to prevent directory traversal attacks
    const safeFilename = filename.replace(/[^a-zA-Z0-9_.-]/g, '')
    
    // Multi-directory search strategy to survive git pulls, redeployments, and process root variations
    const potentialDirs = [
      join(process.cwd(), 'public', 'uploads'),
      join(process.cwd(), '..', 'public', 'uploads'),
      '/home/bvpindia-api/htdocs/api.bvpindia.org/public/uploads',
      join(process.cwd(), '.next', 'standalone', 'public', 'uploads'),
      '/tmp/uploads',
    ]

    let filePath = ''
    for (const dir of potentialDirs) {
      const testPath = join(dir, safeFilename)
      if (existsSync(testPath)) {
        filePath = testPath
        break
      }
    }

    if (!filePath) {
      return new NextResponse('File not found', { status: 404 })
    }

    const fileBuffer = await readFile(filePath)
    
    // Determine content type based on extension
    let contentType = 'application/octet-stream'
    const lowerName = safeFilename.toLowerCase()
    if (lowerName.endsWith('.png')) {
      contentType = 'image/png'
    } else if (lowerName.endsWith('.jpg') || lowerName.endsWith('.jpeg')) {
      contentType = 'image/jpeg'
    }

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    })
  } catch (error) {
    console.error('Error serving file:', error)
    return new NextResponse('Internal server error', { status: 500 })
  }
}
