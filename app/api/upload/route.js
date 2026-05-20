// Image Upload API for blog posts and admin pages
// Primary storage: Cloudflare R2 (durable, multi-pod-safe, CDN-backed).
// Fallback: local /app/public/uploads (only used if R2 env vars are missing — dev convenience).
import { NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'
import { verifyCsrf } from '@/lib/csrf-verify'
import { requireAuth } from '@/lib/auth-middleware'
import { isR2Configured, uploadToR2 } from '@/lib/r2-storage'

// Allowed file types
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
const MAX_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_FOLDERS = new Set(['blog', 'pages', 'avatars', 'uploads'])
const ALLOWED_EXT = new Set(['jpg', 'jpeg', 'png', 'gif', 'webp'])

export async function POST(request) {
  try {
    // SECURITY: Require authentication
    const auth = await requireAuth(request)
    if (!auth.authenticated) return auth.response

    // Verify CSRF token for uploads
    const csrfResult = verifyCsrf(request)
    if (!csrfResult.valid) {
      return NextResponse.json({
        success: false,
        error: csrfResult.error || 'CSRF validation failed',
        code: 'CSRF_INVALID',
      }, { status: 403 })
    }

    const formData = await request.formData()
    const file = formData.get('file')
    let folder = formData.get('folder') || 'blog'

    // SECURITY: Whitelist folder to prevent path traversal / arbitrary key injection
    if (!ALLOWED_FOLDERS.has(folder)) folder = 'blog'

    if (!file) {
      return NextResponse.json({ success: false, error: 'No file provided' }, { status: 400 })
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid file type. Allowed: JPEG, PNG, GIF, WEBP',
      }, { status: 400 })
    }

    // Validate file size
    if (file.size > MAX_SIZE) {
      return NextResponse.json({
        success: false,
        error: 'File too large. Max size: 5MB',
      }, { status: 400 })
    }

    // Build a safe filename
    const ext = (file.name?.split('.').pop() || '').toLowerCase()
    if (!ALLOWED_EXT.has(ext)) {
      return NextResponse.json({ success: false, error: 'Invalid file extension' }, { status: 400 })
    }
    const filename = `${uuidv4()}.${ext}`
    const key = `${folder}/${filename}`

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // -------- Primary: Cloudflare R2 --------
    if (isR2Configured()) {
      try {
        const { url } = await uploadToR2({
          key,
          body: buffer,
          contentType: file.type,
        })
        return NextResponse.json({
          success: true,
          url,
          filename,
          key,
          size: file.size,
          type: file.type,
          storage: 'r2',
        })
      } catch (r2Err) {
        console.error('[upload] R2 upload failed, falling back to local FS:', r2Err?.message)
        // fall through to local-disk path below
      }
    }

    // -------- Fallback: local public/uploads (dev only) --------
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', folder)
    await mkdir(uploadDir, { recursive: true })
    const filepath = path.join(uploadDir, filename)
    await writeFile(filepath, buffer)
    const url = `/uploads/${folder}/${filename}`

    return NextResponse.json({
      success: true,
      url,
      filename,
      size: file.size,
      type: file.type,
      storage: 'local',
    })
  } catch (error) {
    console.error('Upload error:', error?.message)
    return NextResponse.json({ success: false, error: 'Upload failed' }, { status: 500 })
  }
}
