import { NextResponse } from 'next/server'
import { getCollection } from '@/lib/mongodb'
import { unlink } from 'fs/promises'
import { existsSync } from 'fs'
import { isAuthorizedCron } from '@/lib/cron-auth'
import { resolvePublicPath } from '@/lib/public-path'
import { GENERATED_DIRS } from '@/lib/generated-dirs'

export async function POST(request) {
  // SECURITY: scheduled job only (was callable by anyone)
  if (!isAuthorizedCron(request)) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const libraryCollection = await getCollection('library')
    const now = new Date()
    
    // Find all expired items
    const expiredItems = await libraryCollection.find({
      expiresAt: { $lt: now, $exists: true }
    }).toArray()

    // Delete associated files
    for (const item of expiredItems) {
      if (item.filePath) {
        // SECURITY: only delete files inside the generated-content directories
        const fullPath = resolvePublicPath(item.filePath, { allowedDirs: GENERATED_DIRS })
        if (fullPath && existsSync(fullPath)) {
          try {
            await unlink(fullPath)
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
