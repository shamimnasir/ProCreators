// Image Upload API for blog posts and pages
import { NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'
import { verifyCsrfToken } from '@/lib/csrf'

// Allowed file types
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
const MAX_SIZE = 5 * 1024 * 1024 // 5MB

// Helper to verify CSRF for mutations
function verifyCsrf(request) {
  const csrfToken = request.headers.get('x-csrf-token')
  const authHeader = request.headers.get('authorization')
  const sessionId = authHeader?.split(' ')[1] || `anon_${Date.now()}`
  
  // In development, allow requests without CSRF for easier testing
  if (process.env.NODE_ENV === 'development' && !csrfToken) {
    return { valid: true }
  }
  
  return verifyCsrfToken(csrfToken, sessionId)
}

export async function POST(request) {
  try {
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
    const folder = formData.get('folder') || 'blog' // blog, pages, etc.
    
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
    
    // Get file extension
    const ext = file.name.split('.').pop().toLowerCase()
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
    console.error('Upload error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
