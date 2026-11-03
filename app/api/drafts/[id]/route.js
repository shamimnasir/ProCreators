import { NextResponse } from 'next/server'
import { getCollection } from '@/lib/mongodb'
import { getAuthenticatedUserId } from '@/lib/auth-middleware'

// SECURITY: the owner always comes from the session. This route used to accept ?userId= or a
// body userId, which let anyone read, overwrite or delete another user's drafts.
async function resolve(request, params) {
  const userId = await getAuthenticatedUserId(request)
  if (!userId) {
    return { error: NextResponse.json({ success: false, error: 'Authentication required', code: 'AUTH_REQUIRED' }, { status: 401 }) }
  }
  const { id } = await params
  if (typeof id !== 'string' || !id) {
    return { error: NextResponse.json({ success: false, error: 'Draft not found' }, { status: 404 }) }
  }
  return { userId, id }
}

// GET - Fetch a specific draft
export async function GET(request, { params }) {
  try {
    const { userId, id, error } = await resolve(request, params)
    if (error) return error
    
    const drafts = await getCollection('drafts')
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
    const { userId, id, error } = await resolve(request, params)
    if (error) return error
    const data = await request.json()
    
    const drafts = await getCollection('drafts')
    const now = new Date().toISOString()
    
    const result = await drafts.updateOne(
      { id, userId },
      {
        $set: {
          title: typeof data.title === 'string' ? data.title : 'Untitled',
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
    const { userId, id, error } = await resolve(request, params)
    if (error) return error
    
    const drafts = await getCollection('drafts')
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
