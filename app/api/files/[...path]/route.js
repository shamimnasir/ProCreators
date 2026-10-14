import { NextResponse } from 'next/server'
import { stat } from 'fs/promises'
import { createReadStream } from 'fs'
import path from 'path'
import { Readable } from 'stream'
import { GENERATED_DIRS } from '@/lib/generated-dirs'

// Serves files that the app writes under public/<dir>/ at runtime. Next.js only serves
// public/ files that existed when the server started, so newly generated files are routed
// here by the fallback rewrites in next.config.js.

const PUBLIC_ROOT = path.resolve(process.env.PUBLIC_DIR || '/app/public')

const MIME_TYPES = {
  '.pdf': 'application/pdf',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.srt': 'text/plain; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.md': 'text/plain; charset=utf-8',
  '.csv': 'text/csv; charset=utf-8',
  '.json': 'application/json',
  '.html': 'text/plain; charset=utf-8', // never serve generated HTML as active content
}

export async function GET(request, { params }) {
  const { path: segments } = await params
  const [dir] = segments
  if (!GENERATED_DIRS.includes(dir)) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  // Resolve and confine to public/<dir>
  const base = path.join(PUBLIC_ROOT, dir)
  const absolute = path.resolve(PUBLIC_ROOT, ...segments.map((s) => decodeURIComponent(s)))
  if (!absolute.startsWith(base + path.sep)) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const mimeType = MIME_TYPES[path.extname(absolute).toLowerCase()]
  if (!mimeType) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  let info
  try {
    info = await stat(absolute)
  } catch {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
  if (!info.isFile()) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const headers = {
    'Content-Type': mimeType,
    'Accept-Ranges': 'bytes',
    'X-Content-Type-Options': 'nosniff',
    'Cache-Control': 'public, max-age=3600',
  }

  // Single-range support so audio/video can seek
  const range = request.headers.get('range')
  if (range) {
    const match = /^bytes=(\d*)-(\d*)$/.exec(range)
    if (match && (match[1] || match[2])) {
      let start = match[1] ? parseInt(match[1], 10) : info.size - parseInt(match[2], 10)
      let end = match[1] && match[2] ? parseInt(match[2], 10) : info.size - 1
      start = Math.max(0, start)
      end = Math.min(end, info.size - 1)
      if (start > end || start >= info.size) {
        return new NextResponse(null, { status: 416, headers: { 'Content-Range': `bytes */${info.size}` } })
      }
      const body = Readable.toWeb(createReadStream(absolute, { start, end }))
      return new NextResponse(body, {
        status: 206,
        headers: { ...headers, 'Content-Range': `bytes ${start}-${end}/${info.size}`, 'Content-Length': String(end - start + 1) },
      })
    }
  }

  const body = Readable.toWeb(createReadStream(absolute))
  return new NextResponse(body, { status: 200, headers: { ...headers, 'Content-Length': String(info.size) } })
}
