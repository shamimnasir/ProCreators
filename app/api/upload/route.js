// Image Upload API for blog posts and pages
import { NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'
import { verifyCsrf } from '@/lib/csrf-verify'
import { requireAuth } from '@/lib/auth-middleware'

// Allowed file types
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
const MAX_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_FOLDERS = new Set(['blog', 'pages', 'avatars', 'uploads'])

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
        code: 'CSRF_INVALID'
      }, { status: 403 })
    }

    const formData = await request.formData()
    const file = formData.get('file')
    let folder = formData.get('folder') || 'blog'

    // SECURITY: Whitelist folder to prevent path traversal
    if (!ALLOWED_FOLDERS.has(folder)) folder = 'blog'

    if (!file) {
      return NextResponse.json({ success: false, error: 'No file provided' }, { status: 400 })
    }
    
    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid file type. Allowed: JPEG, PNG, GIF, WEBP' 
      }, { status: 400 })
    }
    
    // Validate file size
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ 
        success: false, 
        error: 'File too large. Max size: 5MB' 
      }, { status: 400 })
    }
    
    // Get file extension (whitelist)
    const ext = (file.name.split('.').pop() || '').toLowerCase()
    const ALLOWED_EXT = new Set(['jpg', 'jpeg', 'png', 'gif', 'webp'])
    if (!ALLOWED_EXT.has(ext)) {
      return NextResponse.json({ success: false, error: 'Invalid file extension' }, { status: 400 })
    }
    const filename = `${uuidv4()}.${ext}`
    
    // Create upload directory if it doesn't exist
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', folder)
    await mkdir(uploadDir, { recursive: true })
    
    // Write file
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const filepath = path.join(uploadDir, filename)
    await writeFile(filepath, buffer)
    
    // Return public URL
    const url = `/uploads/${folder}/${filename}`
    
    return NextResponse.json({ 
      success: true, 
      url,
      filename,
      size: file.size,
      type: file.type
    })
    
  } catch (error) {
    console.error('Upload error:', error?.message)
    return NextResponse.json({ success: false, error: 'Upload failed' }, { status: 500 })
  }
}
