// User Profile Update API
import { NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'

export async function POST(request) {
  try {
    const body = await request.json()
    const { userId, name, avatarUrl } = body
    
    if (!userId) {
      return NextResponse.json({ success: false, error: 'userId required' }, { status: 400 })
    }
    
    const { db } = await connectToDatabase()
    
    // Update user profile
    const updateData = {
      updatedAt: new Date()
    }
    
    if (name !== undefined) updateData.name = name
    if (avatarUrl !== undefined) updateData.avatarUrl = avatarUrl
    
    await db.collection('users').updateOne(
      { _id: userId },
      { $set: updateData }
    )
    
    return NextResponse.json({ success: true, message: 'Profile updated' })
    
  } catch (error) {
    console.error('Error updating profile:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
