// Session verification API
import { NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'

export async function GET(request) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, error: 'No token provided' }, { status: 401 })
    }
    
    const token = authHeader.split(' ')[1]
    const { db } = await connectToDatabase()
    
    // Find session
    const session = await db.collection('sessions').findOne({
      token,
      expiresAt: { $gt: new Date() }
    })
    
    if (!session) {
      return NextResponse.json({ success: false, error: 'Invalid or expired session' }, { status: 401 })
    }
    
    // Get user
    const user = await db.collection('users').findOne({ _id: session.userId })
    
    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 401 })
    }
    
    if (user.accountStatus === 'banned' || user.accountStatus === 'suspended') {
      return NextResponse.json({ success: false, error: `Account ${user.accountStatus}` }, { status: 403 })
    }
    
    // Update last active
    await db.collection('users').updateOne(
      { _id: user._id },
      { $set: { lastActiveAt: new Date() } }
    )
    
    return NextResponse.json({
      success: true,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        credits: user.credits,
        plan: user.plan,
        emailVerified: user.emailVerified
      }
    })
    
  } catch (error) {
    console.error('Session error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

// Logout - invalidate session
export async function DELETE(request) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ success: true }) // Already logged out
    }
    
    const token = authHeader.split(' ')[1]
    const { db } = await connectToDatabase()
    
    await db.collection('sessions').deleteOne({ token })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
