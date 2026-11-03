import { NextResponse } from 'next/server'
import { getAuthenticatedUserId } from '@/lib/auth-middleware'
import { getCollection } from '@/lib/mongodb'
import { randomUUID } from 'crypto'

/**
 * Universal Drafts API for all ProCreators Tools
 * 
 * GET /api/tools/drafts?toolType=coloring-book
 * POST /api/tools/drafts { toolType, title, data, id? }
 * DELETE /api/tools/drafts?id=xxx
 */

export async function GET(request) {
  try {
    // SECURITY: drafts are private to their owner (this route used to need no login at all)
    const userId = await getAuthenticatedUserId(request)
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Authentication required', code: 'AUTH_REQUIRED' }, { status: 401 })
    }
    const { searchParams } = new URL(request.url)
    const toolType = searchParams.get('toolType')
    
    if (!toolType) {
      return NextResponse.json(
        { success: false, error: 'toolType is required' },
        { status: 400 }
      )
    }
    
    const draftsCollection = await getCollection('drafts')
    const drafts = await draftsCollection
      .find({ toolType, userId })
      .sort({ updatedAt: -1 })
      .limit(50)
      .toArray()
    
    return NextResponse.json({ success: true, drafts })
  } catch (error) {
    console.error('Failed to fetch drafts:', error)
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
    const { id, toolType, title, data } = body
    
    if (!toolType) {
      return NextResponse.json(
        { success: false, error: 'toolType is required' },
        { status: 400 }
      )
    }
    
    const draftsCollection = await getCollection('drafts')
    
    if (id) {
      // Update existing draft
      await draftsCollection.updateOne(
        { id: String(id), userId },
        {
          $set: {
            title: title || 'Untitled',
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
        title: title || 'Untitled',
        data,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      return NextResponse.json({ success: true, id: newId })
    }
  } catch (error) {
    console.error('Failed to save draft:', error)
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
    console.error('Failed to delete draft:', error)
    return NextResponse.json(
      { success: false, error: 'Request failed' },
      { status: 500 }
    )
  }
}
