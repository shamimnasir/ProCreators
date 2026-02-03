import { NextResponse } from 'next/server'
import { getCollection } from '@/lib/mongodb'
import { getUserIdFromRequest } from '@/lib/get-user-id'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const toolFilter = searchParams.get('tool') // Optional tool filter
    const category = searchParams.get('category') // Optional category filter
    const limit = parseInt(searchParams.get('limit')) || 100
    const queryUserId = searchParams.get('userId') // Optional userId from query
    
    // Get user ID from query params or request headers
    const userId = queryUserId || await getUserIdFromRequest(request)
    
    const libraryCollection = await getCollection('library')
    const now = new Date()
    
    // Build query
    const query = { 
      userId,
      $or: [
        { expiresAt: { $gte: now } },
        { expiresAt: { $exists: false } } // For backwards compatibility with old items
      ]
    }
    
    // Add tool filter if specified
    if (toolFilter) {
      query.type = toolFilter
    }
    
    // Add category filter if specified
    if (category) {
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
