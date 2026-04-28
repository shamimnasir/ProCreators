import { NextResponse } from 'next/server'
import { getCollection } from '@/lib/mongodb'
import { randomUUID } from 'crypto'
import { requireAuth } from '@/lib/auth-middleware'
import { verifyCsrf } from '@/lib/csrf-verify'
import { buildUserQuery } from '@/lib/tenant-isolation'

// GET - Fetch all drafts for the authenticated user (filtered by tool type)
export async function GET(request) {
  try {
    // SECURITY: Require authentication
    const auth = await requireAuth(request)
    if (!auth.authenticated) {
      return auth.response
    }
    
    const { searchParams } = new URL(request.url)
    const toolType = searchParams.get('toolType')
    
    const drafts = await getCollection('drafts')
    
    // SECURITY: Use tenant isolation - only fetch user's own drafts
    const query = buildUserQuery(auth.userId)
    if (toolType && typeof toolType === 'string' && toolType.length < 100) {
      query.toolType = toolType.replace(/[<>'"${}]/g, '') // Sanitize
    }
    
    const userDrafts = await drafts
      .find(query)
      .sort({ updatedAt: -1 })
      .limit(100) // Prevent excessive data retrieval
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
    // SECURITY: CSRF verification
    const csrfCheck = verifyCsrf(request)
    if (!csrfCheck.valid) {
      return NextResponse.json(
        { success: false, error: 'CSRF verification failed', code: 'CSRF_INVALID' },
        { status: 403 }
      )
    }
    
    // SECURITY: Require authentication
    const auth = await requireAuth(request)
    if (!auth.authenticated) {
      return auth.response
    }
    
    const data = await request.json()
    const drafts = await getCollection('drafts')
    
    // SECURITY: Use authenticated userId only
    const userId = auth.userId
    const now = new Date().toISOString()
    
    // Sanitize data - remove any userId override attempts
    const safeData = { ...data }
    delete safeData.userId // Prevent userId override
    
    // Check if updating existing draft
    if (data.id) {
      // SECURITY: Only update if draft belongs to user
      const result = await drafts.updateOne(
        { id: data.id, userId }, // Tenant isolation in query
        {
          $set: {
            ...safeData,
            userId, // Set to authenticated user
            updatedAt: now
          }
        }
      )
      
      if (result.matchedCount === 0) {
        // Draft doesn't exist for this user, create new one
        const newDraft = {
          ...safeData,
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
      ...safeData,
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
    // SECURITY: CSRF verification
    const csrfCheck = verifyCsrf(request)
    if (!csrfCheck.valid) {
      return NextResponse.json(
        { success: false, error: 'CSRF verification failed', code: 'CSRF_INVALID' },
        { status: 403 }
      )
    }
    
    // SECURITY: Require authentication
    const auth = await requireAuth(request)
    if (!auth.authenticated) {
      return auth.response
    }
    
    const { searchParams } = new URL(request.url)
    const draftId = searchParams.get('id')
    
    if (!draftId) {
      return NextResponse.json(
        { success: false, error: 'Draft ID required' },
        { status: 400 }
      )
    }
    
    const drafts = await getCollection('drafts')
    
    // SECURITY: Tenant isolation - only delete user's own drafts
    await drafts.deleteOne({ id: draftId, userId: auth.userId })
    
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
