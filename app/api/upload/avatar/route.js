// Avatar Upload API
import { NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'
import { requireAuth } from '@/lib/auth-middleware'

// Identify JPEG/PNG/GIF/WebP by magic bytes; anything else is rejected
function detectImageExt(buf) {
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'jpg'
  if (buf.length >= 8 && buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'png'
  if (buf.length >= 6 && /^GIF8[79]a$/.test(buf.subarray(0, 6).toString('latin1'))) return 'gif'
  if (buf.length >= 12 && buf.subarray(0, 4).toString('latin1') === 'RIFF' && buf.subarray(8, 12).toString('latin1') === 'WEBP') return 'webp'
  return null
}

export async function POST(request) {
  try {
    // SECURITY: Require authentication
    const auth = await requireAuth(request)
    if (!auth.authenticated) {
      return auth.response
    }
    
    const userId = auth.userId
    
    const formData = await request.formData()
    const file = formData.get('file')
    
    if (!file) {
      return NextResponse.json({ success: false, error: 'No file uploaded' }, { status: 400 })
    }
    
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ success: false, error: 'Invalid file type' }, { status: 400 })
    }
    
    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ success: false, error: 'File too large (max 5MB)' }, { status: 400 })
    }
    
    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'avatars')
    try {
      await mkdir(uploadsDir, { recursive: true })
    } catch (e) {
      // Directory might already exist
    }
    
    // SECURITY: the client controls file.type and file.name (an SVG sent as image/png would be
    // served same-origin as image/svg+xml = stored XSS). Take the type from the file's bytes.
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const ext = detectImageExt(buffer)
    if (!ext) {
      return NextResponse.json({ success: false, error: 'Invalid file type' }, { status: 400 })
    }
    const filename = `${String(userId).replace(/[^a-zA-Z0-9_-]/g, '').substring(0, 36)}-${uuidv4()}.${ext}`
    const filepath = path.join(uploadsDir, filename)
    
    // Save file
    await writeFile(filepath, buffer)
    
    // URL to access the file
    const url = `/uploads/avatars/${filename}`
    
    // Update user record with avatar URL
    const { db } = await connectToDatabase()
    await db.collection('users').updateOne(
      { _id: userId },
      { $set: { avatarUrl: url, updatedAt: new Date() } }
    )
    
    return NextResponse.json({ 
      success: true, 
      url,
      message: 'Avatar uploaded successfully'
    })
    
  } catch (error) {
    console.error('Avatar upload error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
