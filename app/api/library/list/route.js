import { NextResponse } from 'next/server'
import { getCollection } from '@/lib/mongodb'
import { getAuthenticatedUserId } from '@/lib/auth-middleware'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const toolFilter = searchParams.get('tool') // Optional tool filter
    const category = searchParams.get('category') // Optional category filter
    const limit = Math.min(parseInt(searchParams.get('limit')) || 100, 500) // Max 500
    
    // SECURITY: Get userId from authenticated session only - NOT from query params
    // This prevents IDOR attacks where users could access others' libraries
    const userId = await getAuthenticatedUserId(request)
    
    if (!userId) {
      return NextResponse.json({
        success: false,
        error: 'Authentication required',
        code: 'AUTH_REQUIRED'
      }, { status: 401 })
    }
    
    const libraryCollection = await getCollection('library')
    const now = new Date()
    
    // Build query - userId is now guaranteed to be from authenticated session
    const query = { 
      userId,
      $or: [
        { expiresAt: { $gte: now } },
        { expiresAt: { $exists: false } } // For backwards compatibility with old items
      ]
    }
    
    // Add tool filter if specified (validate input)
    if (toolFilter && typeof toolFilter === 'string' && toolFilter.length < 100) {
      query.type = toolFilter.replace(/[<>'"${}]/g, '') // Sanitize
    }
    
    // Add category filter if specified (whitelist valid values)
    if (category && ['video', 'image', 'text', 'document'].includes(category)) {
      query.category = category
    }
    
    const items = await libraryCollection
      .find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .toArray()

    return NextResponse.json({
      success: true,
      items: items,
      count: items.length,
      filters: { tool: toolFilter, category }
    })
  } catch (error) {
    console.error('List error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch library' },
      { status: 500 }
    )
  }
}
