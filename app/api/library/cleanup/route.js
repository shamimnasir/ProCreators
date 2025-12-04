import { NextResponse } from 'next/server'
import { getCollection } from '@/lib/mongodb'

export async function POST(request) {
  try {
    const libraryCollection = await getCollection('library')
    const now = new Date().toISOString()
    
    // Delete all expired items
    const result = await libraryCollection.deleteMany({
      expiresAt: { $lt: now, $exists: true }
    })

    console.log(`Cleaned up ${result.deletedCount} expired library items`)

    return NextResponse.json({
      success: true,
      deletedCount: result.deletedCount,
      message: `Cleaned up ${result.deletedCount} expired items`
    })
  } catch (error) {
    console.error('Cleanup error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to cleanup expired items' },
      { status: 500 }
    )
  }
}
