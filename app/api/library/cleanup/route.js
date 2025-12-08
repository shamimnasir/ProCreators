import { NextResponse } from 'next/server'
import { getCollection } from '@/lib/mongodb'
import { unlink } from 'fs/promises'
import { existsSync } from 'fs'
import { join } from 'path'

export async function POST(request) {
  try {
    const libraryCollection = await getCollection('library')
    const now = new Date()
    
    // Find all expired items
    const expiredItems = await libraryCollection.find({
      expiresAt: { $lt: now, $exists: true }
    }).toArray()

    console.log(`Found ${expiredItems.length} expired library items to cleanup`)

    // Delete associated files
    for (const item of expiredItems) {
      if (item.filePath) {
        const fullPath = join('/app/public', item.filePath)
        if (existsSync(fullPath)) {
          try {
            await unlink(fullPath)
            console.log(`Deleted expired file: ${fullPath}`)
          } catch (fileError) {
            console.error(`Failed to delete file ${fullPath}:`, fileError)
          }
        }
      }
    }
    
    // Delete all expired items from database
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
