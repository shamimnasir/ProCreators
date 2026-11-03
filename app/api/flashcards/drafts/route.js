import { NextResponse } from 'next/server'
import { getAuthenticatedUserId } from '@/lib/auth-middleware'
import { v4 as uuidv4 } from 'uuid'
import { getCollection } from '@/lib/mongodb'

// GET - Fetch all drafts
export async function GET(request) {
  try {
    // SECURITY: drafts are private to their owner (this route used to need no login at all)
    const userId = await getAuthenticatedUserId(request)
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Authentication required', code: 'AUTH_REQUIRED' }, { status: 401 })
    }
    const draftsCollection = await getCollection('drafts')
    
    const drafts = await draftsCollection
      .find({ tool: 'flashcard-maker', userId })
      .sort({ updatedAt: -1 })
      .toArray()
    
    return NextResponse.json({ 
      success: true, 
      drafts: drafts.map(d => ({
        id: d.id,
        title: d.title,
        subtitle: d.subtitle,
        step: d.step,
        updatedAt: d.updatedAt,
        data: d.data
      }))
    })
  } catch (error) {
    console.error('Failed to fetch drafts:', error)
    return NextResponse.json({ success: false, error: 'Request failed' }, { status: 500 })
  }
}

// POST - Save draft
export async function POST(request) {
  try {
    // SECURITY: drafts are private to their owner (this route used to need no login at all)
    const userId = await getAuthenticatedUserId(request)
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Authentication required', code: 'AUTH_REQUIRED' }, { status: 401 })
    }
    const body = await request.json()
    const { id, title, subtitle, step, data } = body
    
    const draftsCollection = await getCollection('drafts')
    const draftId = typeof id === 'string' && id ? id : uuidv4()
    
    await draftsCollection.updateOne(
      { id: draftId, tool: 'flashcard-maker', userId },
      {
        $set: {
          id: draftId,
          userId,
          tool: 'flashcard-maker',
          title,
          subtitle,
          step,
          data,
          updatedAt: new Date()
        },
        $setOnInsert: {
          createdAt: new Date()
        }
      },
      { upsert: true }
    )
    
    return NextResponse.json({ success: true, id: draftId })
  } catch (error) {
    console.error('Failed to save draft:', error)
    return NextResponse.json({ success: false, error: 'Request failed' }, { status: 500 })
  }
}

// DELETE - Delete draft
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
      return NextResponse.json({ success: false, error: 'Draft ID required' }, { status: 400 })
    }
    
    const draftsCollection = await getCollection('drafts')
    await draftsCollection.deleteOne({ id, tool: 'flashcard-maker', userId })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete draft:', error)
    return NextResponse.json({ success: false, error: 'Request failed' }, { status: 500 })
  }
}
