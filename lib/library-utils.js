/**
 * Library Auto-Save Utility
 * 
 * This utility makes it easy for any tool to save content to the user's library.
 * Content is automatically deleted after 30 days using MongoDB TTL indexes.
 * 
 * Usage:
 * import { saveToLibrary } from '@/lib/library-utils'
 * 
 * await saveToLibrary({
 *   type: 'story-reel',
 *   category: 'video',  // 'video', 'image', or 'text'
 *   title: 'My Video',
 *   description: 'Description here',
 *   content: 'text content',  // optional
 *   videoUrl: '/story-reels/abc123.mp4',  // optional
 *   filePath: '/story-reels/abc123.mp4',  // optional
 *   fileSize: 1234567,  // optional
 *   metadata: { duration: 30, resolution: '1080p' }  // optional
 * })
 */

export async function saveToLibrary({
  type,
  category = 'text',  // 'video', 'image', or 'text'
  title,
  description = '',
  content = '',
  videoUrl = null,
  filePath = null,
  fileSize = null,
  script = null,
  metadata = {}
}) {
  try {
    const response = await fetch('/api/library/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type,
        category,
        title,
        description,
        content,
        videoUrl,
        filePath,
        fileSize,
        script,
        metadata
      })
    })

    const data = await response.json()
    
    if (data.success) {
      console.log(`✅ Saved to library: ${title} (expires in 30 days)`)
      return { success: true, itemId: data.itemId }
    } else {
      console.error('❌ Failed to save to library:', data.error)
      return { success: false, error: data.error }
    }
  } catch (error) {
    console.error('❌ Library save error:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Delete an item from library
 */
export async function deleteFromLibrary(itemId) {
  try {
    const response = await fetch('/api/library/delete', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: itemId })
    })

    const data = await response.json()
    return data
  } catch (error) {
    console.error('❌ Library delete error:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Fetch all library items
 */
export async function fetchLibrary() {
  try {
    const response = await fetch('/api/library/list')
    const data = await response.json()
    return data
  } catch (error) {
    console.error('❌ Library fetch error:', error)
    return { success: false, error: error.message, items: [] }
  }
}
