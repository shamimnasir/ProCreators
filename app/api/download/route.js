import { NextResponse } from 'next/server'
import { stat, access } from 'fs/promises'
import { createReadStream, constants } from 'fs'
import { join, basename, extname } from 'path'

// MIME type mapping
const MIME_TYPES = {
  '.mp4': 'video/mp4',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.pdf': 'application/pdf',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.srt': 'text/plain',
}

export async function GET(request) {
  try {
    const url = new URL(request.url)
    const filePath = url.searchParams.get('file')

    if (!filePath) {
      return NextResponse.json({ error: 'Missing file parameter' }, { status: 400 })
    }

    // Security: prevent path traversal attacks
    const sanitized = filePath.replace(/\.\./g, '').replace(/^\/+/, '')
    
    // Only allow files from known safe directories
    const allowedPrefixes = ['story-reels/', 'output/', 'uploads/']
    const isAllowed = allowedPrefixes.some(prefix => sanitized.startsWith(prefix))
    if (!isAllowed) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const absolutePath = join('/app/public', sanitized)

    // Check file exists and is readable
    try {
      await access(absolutePath, constants.R_OK)
    } catch {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }

    // Get file info
    const fileStats = await stat(absolutePath)
    const fileName = basename(absolutePath)
    const ext = extname(absolutePath).toLowerCase()
    const mimeType = MIME_TYPES[ext] || 'application/octet-stream'

    // Stream the file using ReadableStream
    const stream = createReadStream(absolutePath)
    const readableStream = new ReadableStream({
      start(controller) {
        stream.on('data', (chunk) => {
          controller.enqueue(new Uint8Array(chunk))
        })
        stream.on('end', () => {
          controller.close()
        })
        stream.on('error', (err) => {
          controller.error(err)
        })
      },
      cancel() {
        stream.destroy()
      }
    })

    return new NextResponse(readableStream, {
      status: 200,
      headers: {
        'Content-Type': mimeType,
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Content-Length': fileStats.size.toString(),
        'Cache-Control': 'no-cache',
      }
    })
  } catch (error) {
    console.error('Download error:', error)
    return NextResponse.json({ error: 'Download failed' }, { status: 500 })
  }
}
