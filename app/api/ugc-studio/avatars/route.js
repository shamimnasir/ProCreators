import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-middleware'
import { connectToDatabase } from '@/lib/mongodb'
import { v4 as uuidv4 } from 'uuid'

// =====================================================
// UGC STUDIO — AVATAR MANAGER API
// =====================================================
// GET: List user's saved avatars
// POST: Create/save a new avatar
// DELETE: Remove an avatar

export async function GET(request) {
  const auth = await requireAuth(request)
  if (!auth.authenticated) {
    return auth.response
  }

  try {
    const { db } = await connectToDatabase()
    const avatars = await db.collection('ugc_avatars').find({
      userId: auth.userId
    }).sort({ createdAt: -1 }).toArray()

    return NextResponse.json({ success: true, avatars })
  } catch (error) {
    console.error('Avatar fetch error:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch avatars' }, { status: 500 })
  }
}

export async function POST(request) {
  const auth = await requireAuth(request)
  if (!auth.authenticated) {
    return auth.response
  }

  try {
    const body = await request.json()
    const { name, imageUrl, type = 'uploaded', description = '' } = body

    if (!name || !imageUrl) {
      return NextResponse.json({ success: false, error: 'Name and image URL are required' }, { status: 400 })
    }

    const { db } = await connectToDatabase()

    // Check avatar limit (max 20 per user)
    const count = await db.collection('ugc_avatars').countDocuments({ userId: auth.userId })
    if (count >= 20) {
      return NextResponse.json({ success: false, error: 'Maximum 20 avatars allowed. Please delete some first.' }, { status: 400 })
    }

    const avatar = {
      _id: uuidv4(),
      userId: auth.userId,
      name: name.trim().slice(0, 50),
      imageUrl,
      type,
      description: description.slice(0, 200),
      usageCount: 0,
      createdAt: new Date()
    }

    await db.collection('ugc_avatars').insertOne(avatar)

    return NextResponse.json({ success: true, avatar })
  } catch (error) {
    console.error('Avatar create error:', error)
    return NextResponse.json({ success: false, error: 'Failed to save avatar' }, { status: 500 })
  }
}

export async function DELETE(request) {
  const auth = await requireAuth(request)
  if (!auth.authenticated) {
    return auth.response
  }

  try {
    const { searchParams } = new URL(request.url)
    const avatarId = searchParams.get('avatarId')

    if (!avatarId) {
      return NextResponse.json({ success: false, error: 'Avatar ID required' }, { status: 400 })
    }

    const { db } = await connectToDatabase()
    const result = await db.collection('ugc_avatars').deleteOne({
      _id: avatarId,
      userId: auth.userId
    })

    if (result.deletedCount === 0) {
      return NextResponse.json({ success: false, error: 'Avatar not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, message: 'Avatar deleted' })
  } catch (error) {
    console.error('Avatar delete error:', error)
    return NextResponse.json({ success: false, error: 'Failed to delete avatar' }, { status: 500 })
  }
}
