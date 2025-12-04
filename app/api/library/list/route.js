import { NextResponse } from 'next/server'
import { getCollection } from '@/lib/mongodb'

export async function GET(request) {
  try {
    const libraryCollection = await getCollection('library')
    const now = new Date().toISOString()
    
    // TODO: Replace 'default-user' with actual user ID when auth is implemented
    // Only fetch items that haven't expired
    const items = await libraryCollection
      .find({ 
        userId: 'default-user',
        $or: [
          { expiresAt: { $gte: now } },
          { expiresAt: { $exists: false } } // For backwards compatibility with old items
        ]
      })
      .sort({ createdAt: -1 })
      .toArray()

    return NextResponse.json({
      success: true,
      items: items
    })
  } catch (error) {
    console.error('List error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch library' },
      { status: 500 }
    )
  }
}
