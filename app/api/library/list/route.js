import { NextResponse } from 'next/server'
import { getCollection } from '@/lib/mongodb'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const toolFilter = searchParams.get('tool') // Optional tool filter
    const category = searchParams.get('category') // Optional category filter
    const limit = parseInt(searchParams.get('limit')) || 100
    
    const libraryCollection = await getCollection('library')
    const now = new Date()  // Keep as Date object, not string
    
    // Build query
    const query = { 
      userId: 'default-user',
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
    
    // TODO: Replace 'default-user' with actual user ID when auth is implemented
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
