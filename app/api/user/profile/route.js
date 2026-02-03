// User Profile API
import { NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    
    if (!userId) {
      return NextResponse.json({ success: false, error: 'userId required' }, { status: 400 })
    }
    
    const { db } = await connectToDatabase()
    const user = await db.collection('users').findOne({ _id: userId })
    
    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 })
    }
    
    return NextResponse.json({ 
      success: true, 
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatarUrl: user.avatarUrl,
        plan: user.plan,
        credits: user.credits
      }
    })
    
  } catch (error) {
    console.error('Error fetching profile:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

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
    
    const result = await db.collection('users').updateOne(
      { _id: userId },
      { $set: updateData }
    )
    
    if (result.matchedCount === 0) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 })
    }
    
    return NextResponse.json({ success: true, message: 'Profile updated' })
    
  } catch (error) {
    console.error('Error updating profile:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
