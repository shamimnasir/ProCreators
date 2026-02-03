import { NextResponse } from 'next/server'
import { getCollection } from '@/lib/mongodb'
import { randomUUID } from 'crypto'
import { getUserIdFromRequest } from '@/lib/get-user-id'

// GET - Fetch all drafts for the user (filtered by tool type)
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const toolType = searchParams.get('toolType')
    const queryUserId = searchParams.get('userId')
    
    const drafts = await getCollection('drafts')
    
    // Get user ID from query params or request headers
    const userId = queryUserId || await getUserIdFromRequest(request)
    
    const query = { userId }
    if (toolType) {
      query.toolType = toolType
    }
    
    const userDrafts = await drafts
      .find(query)
      .sort({ updatedAt: -1 })
      .toArray()
    
    return NextResponse.json({
      success: true,
      drafts: userDrafts
    })
  } catch (error) {
    console.error('Error fetching drafts:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch drafts' },
      { status: 500 }
    )
  }
}

// POST - Save a new draft or update existing
export async function POST(request) {
  try {
    const data = await request.json()
    const drafts = await getCollection('drafts')
    
    // Get user ID from body or request headers
    const userId = data.userId || await getUserIdFromRequest(request)
    const now = new Date().toISOString()
    
    // Check if updating existing draft
    if (data.id) {
      const result = await drafts.updateOne(
        { id: data.id, userId },
        {
          $set: {
            ...data,
            userId,
            updatedAt: now
          }
        }
      )
      
      if (result.matchedCount === 0) {
        // Draft doesn't exist, create new one
        const newDraft = {
          ...data,
          id: data.id,
          userId,
          createdAt: now,
          updatedAt: now
        }
        await drafts.insertOne(newDraft)
      }
      
      return NextResponse.json({
        success: true,
        message: 'Draft updated',
        id: data.id
      })
    }
    
    // Create new draft
    const newId = randomUUID()
    const newDraft = {
      ...data,
      id: newId,
      userId,
      createdAt: now,
      updatedAt: now
    }
    
    await drafts.insertOne(newDraft)
    
    return NextResponse.json({
      success: true,
      message: 'Draft saved',
      id: newId
    })
  } catch (error) {
    console.error('Error saving draft:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to save draft' },
      { status: 500 }
    )
  }
}

// DELETE - Remove a draft
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url)
    const draftId = searchParams.get('id')
    const queryUserId = searchParams.get('userId')
    
    if (!draftId) {
      return NextResponse.json(
        { success: false, error: 'Draft ID required' },
        { status: 400 }
      )
    }
    
    const drafts = await getCollection('drafts')
    const userId = queryUserId || await getUserIdFromRequest(request)
    
    await drafts.deleteOne({ id: draftId, userId })
    
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
