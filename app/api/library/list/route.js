import { NextResponse } from 'next/server'
import { getCollection } from '@/lib/mongodb'

export async function GET(request) {
  try {
    const libraryCollection = await getCollection('library')
    
    // TODO: Replace 'default-user' with actual user ID when auth is implemented
    const items = await libraryCollection
      .find({ userId: 'default-user' })
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
