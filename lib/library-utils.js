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

// Helper to get CSRF token with caching
async function getCsrfToken() {
  if (typeof window === 'undefined') return null
  
  // Check cache first
  const cached = sessionStorage.getItem('csrf_token')
  const expiry = sessionStorage.getItem('csrf_expires')
  
  if (cached && expiry && parseInt(expiry) > Date.now() + 60000) {
    return cached
  }
  
  // Fetch new token
  try {
    const res = await fetch('/api/csrf')
    const data = await res.json()
    if (data.success && data.csrfToken) {
      sessionStorage.setItem('csrf_token', data.csrfToken)
      sessionStorage.setItem('csrf_expires', data.expiresAt.toString())
      return data.csrfToken
    }
  } catch (e) {
    console.error('Failed to get CSRF token:', e)
  }
  return null
}

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
    // Get session token for authentication
    const sessionToken = typeof window !== 'undefined' ? localStorage.getItem('sessionToken') : null
    // Get CSRF token for security
    const csrfToken = await getCsrfToken()
    
    const response = await fetch('/api/library/save', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        ...(sessionToken && { 'Authorization': `Bearer ${sessionToken}` }),
        ...(csrfToken && { 'x-csrf-token': csrfToken })
      },
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
    const sessionToken = typeof window !== 'undefined' ? localStorage.getItem('sessionToken') : null
    const csrfToken = await getCsrfToken()
    
    const response = await fetch('/api/library/delete', {
      method: 'DELETE',
      headers: { 
        'Content-Type': 'application/json',
        ...(sessionToken && { 'Authorization': `Bearer ${sessionToken}` }),
        ...(csrfToken && { 'x-csrf-token': csrfToken })
      },
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
    const sessionToken = typeof window !== 'undefined' ? localStorage.getItem('sessionToken') : null
    
    const response = await fetch('/api/library/list', {
      headers: sessionToken ? { 'Authorization': `Bearer ${sessionToken}` } : {}
    })
    const data = await response.json()
    return data
  } catch (error) {
    console.error('❌ Library fetch error:', error)
    return { success: false, error: error.message, items: [] }
  }
}
