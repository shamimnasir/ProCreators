import { NextResponse } from 'next/server'
import { getCollection } from '@/lib/mongodb'
import { getUserIdFromRequest } from '@/lib/get-user-id'

// GET - Fetch a specific draft
export async function GET(request, { params }) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const queryUserId = searchParams.get('userId')
    
    const drafts = await getCollection('drafts')
    const userId = queryUserId || await getUserIdFromRequest(request)
    
    const draft = await drafts.findOne({ id, userId })
    
    if (!draft) {
      return NextResponse.json(
        { success: false, error: 'Draft not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({
      success: true,
      draft
    })
  } catch (error) {
    console.error('Error fetching draft:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch draft' },
      { status: 500 }
    )
  }
}

// PUT - Update a specific draft
export async function PUT(request, { params }) {
  try {
    const { id } = await params
    const data = await request.json()
    
    const drafts = await getCollection('drafts')
    const userId = data.userId || await getUserIdFromRequest(request)
    const now = new Date().toISOString()
    
    const result = await drafts.updateOne(
      { id, userId },
      {
        $set: {
          title: data.title,
          data: data.data,
          updatedAt: now
        }
      }
    )
    
    if (result.matchedCount === 0) {
      return NextResponse.json(
        { success: false, error: 'Draft not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({
      success: true,
      message: 'Draft updated',
      id
    })
  } catch (error) {
    console.error('Error updating draft:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update draft' },
      { status: 500 }
    )
  }
}

// DELETE - Remove a specific draft
export async function DELETE(request, { params }) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const queryUserId = searchParams.get('userId')
    
    const drafts = await getCollection('drafts')
    const userId = queryUserId || await getUserIdFromRequest(request)
    
    const result = await drafts.deleteOne({ id, userId })
    
    if (result.deletedCount === 0) {
      return NextResponse.json(
        { success: false, error: 'Draft not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({
      success: true,
      message: 'Draft deleted'
    })
  } catch (error) {
    console.error('Error deleting draft:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete draft' },
      { status: 500 }
    )
  }
}
