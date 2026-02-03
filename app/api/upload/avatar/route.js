// Avatar Upload API
import { NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'

export async function POST(request) {
  try {
    const formData = await request.formData()
    const file = formData.get('file')
    const userId = formData.get('userId') || 'demo-user-001'
    
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
    
    // Generate unique filename
    const ext = file.name.split('.').pop()
    const filename = `${userId}-${uuidv4()}.${ext}`
    const filepath = path.join(uploadsDir, filename)
    
    // Save file
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
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

export const config = {
  api: {
    bodyParser: false,
  },
}
