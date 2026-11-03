import { NextResponse } from 'next/server'
import { getAuthenticatedUserId } from '@/lib/auth-middleware'
import { getCollection } from '@/lib/mongodb'
import { randomUUID } from 'crypto'

export async function GET(request) {
  try {
    // SECURITY: drafts are private to their owner (this route used to need no login at all)
    const userId = await getAuthenticatedUserId(request)
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Authentication required', code: 'AUTH_REQUIRED' }, { status: 401 })
    }
    const { searchParams } = new URL(request.url)
    const toolType = searchParams.get('toolType') || 'storybook'
    
    const draftsCollection = await getCollection('drafts')
    const drafts = await draftsCollection
      .find({ toolType, userId })
      .sort({ updatedAt: -1 })
      .limit(20)
      .toArray()
    
    return NextResponse.json({ success: true, drafts })
  } catch (error) {
    console.error('Failed to fetch storybook drafts:', error)
    return NextResponse.json(
      { success: false, error: 'Request failed' },
      { status: 500 }
    )
  }
}

export async function POST(request) {
  try {
    // SECURITY: drafts are private to their owner (this route used to need no login at all)
    const userId = await getAuthenticatedUserId(request)
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Authentication required', code: 'AUTH_REQUIRED' }, { status: 401 })
    }
    const body = await request.json()
    const { id, toolType = 'storybook', title, data } = body
    
    const draftsCollection = await getCollection('drafts')
    
    if (id) {
      // Update existing draft
      await draftsCollection.updateOne(
        { id: String(id), userId },
        {
          $set: {
            title,
            data,
            updatedAt: new Date()
          }
        }
      )
      return NextResponse.json({ success: true, id })
    } else {
      // Create new draft
      const newId = randomUUID()
      await draftsCollection.insertOne({
        id: newId,
        userId,
        toolType,
        title,
        data,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      return NextResponse.json({ success: true, id: newId })
    }
  } catch (error) {
    console.error('Failed to save storybook draft:', error)
    return NextResponse.json(
      { success: false, error: 'Request failed' },
      { status: 500 }
    )
  }
}

export async function DELETE(request) {
  try {
    // SECURITY: drafts are private to their owner (this route used to need no login at all)
    const userId = await getAuthenticatedUserId(request)
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Authentication required', code: 'AUTH_REQUIRED' }, { status: 401 })
    }
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Draft ID required' },
        { status: 400 }
      )
    }
    
    const draftsCollection = await getCollection('drafts')
    await draftsCollection.deleteOne({ id, userId })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete storybook draft:', error)
    return NextResponse.json(
      { success: false, error: 'Request failed' },
      { status: 500 }
    )
  }
}
