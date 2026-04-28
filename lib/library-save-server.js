/**
 * Server-Side Library Save Utility
 * 
 * Use this in API routes to save directly to the library collection
 * This bypasses the /api/library/save endpoint and its auth requirements
 * 
 * Usage in API routes:
 * import { saveToLibraryDirect } from '@/lib/library-save-server'
 * 
 * await saveToLibraryDirect(userId, {
 *   type: 'lesson-planner',
 *   category: 'document',
 *   title: 'My Lesson Plan',
 *   content: pdfUrl,
 *   metadata: { ... }
 * })
 */

import { getCollection } from '@/lib/mongodb'
import { randomUUID } from 'crypto'

export async function saveToLibraryDirect(userId, {
  type,
  category = 'text',
  title,
  description = '',
  content = '',
  videoUrl = null,
  filePath = null,
  fileSize = null,
  script = null,
  metadata = {}
}) {
  if (!userId) {
    console.error('[Library Save] No userId provided')
    return { success: false, error: 'User ID required' }
  }

  try {
    const libraryCollection = await getCollection('library')
    
    // Calculate expiration: 30 days from now
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 30)
    
    const id = randomUUID()
    
    const libraryItem = {
      id,
      userId,
      type,
      category,
      title: title || `${type} - ${new Date().toLocaleDateString()}`,
      description: description || '',
      content: content || '',
      videoUrl,
      filePath,
      fileSize,
      script,
      metadata: metadata || {},
      createdAt: new Date(),
      expiresAt
    }
    
    await libraryCollection.insertOne(libraryItem)
    
    console.log(`[Library] Saved ${type} for user ${userId.substring(0, 8)}...`)
    
    return { 
      success: true, 
      itemId: id,
      expiresAt 
    }
  } catch (error) {
    console.error('[Library Save Error]', error)
    return { 
      success: false, 
      error: error.message 
    }
  }
}

/**
 * Delete from library directly (server-side)
 */
export async function deleteFromLibraryDirect(userId, itemId) {
  if (!userId || !itemId) {
    return { success: false, error: 'User ID and Item ID required' }
  }

  try {
    const libraryCollection = await getCollection('library')
    
    // Only delete if item belongs to user (tenant isolation)
    const result = await libraryCollection.deleteOne({
      id: itemId,
      userId
    })
    
    return { 
      success: result.deletedCount > 0,
      deleted: result.deletedCount > 0
    }
  } catch (error) {
    console.error('[Library Delete Error]', error)
    return { success: false, error: error.message }
  }
}
