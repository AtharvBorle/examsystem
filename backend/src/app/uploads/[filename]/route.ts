import { NextRequest, NextResponse } from 'next/server'
import { join } from 'path'
import { promises as fs } from 'fs'

export async function GET(
  req: NextRequest,
  { params }: { params: { filename: string } }
) {
  try {
    const filename = params.filename
    if (!filename) {
      return new NextResponse('Filename is required', { status: 400 })
    }

    // Decode filename to handle spaces/special characters
    const decodedFilename = decodeURIComponent(filename)
    const filePath = join(process.cwd(), 'public', 'uploads', decodedFilename)

    try {
      // Check if file exists
      await fs.access(filePath)
    } catch {
      return new NextResponse('File not found', { status: 404 })
    }

    // Read file content
    const fileBuffer = await fs.readFile(filePath)

    // Determine content type
    let contentType = 'application/octet-stream'
    const lowerFilename = decodedFilename.toLowerCase()
    if (lowerFilename.endsWith('.pdf')) {
      contentType = 'application/pdf'
    } else if (lowerFilename.endsWith('.jpg') || lowerFilename.endsWith('.jpeg')) {
      contentType = 'image/jpeg'
    } else if (lowerFilename.endsWith('.png')) {
      contentType = 'image/png'
    }

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `inline; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error('Error serving file:', error)
    return new NextResponse('Internal server error', { status: 500 })
  }
}
