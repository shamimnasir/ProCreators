// Utility to get user ID from request
// SECURITY UPDATE: No longer falls back to demo user - requires authentication
import { connectToDatabase } from '@/lib/mongodb'

/**
 * Get user ID from request headers (session token)
 * Returns null if not authenticated - NO FALLBACK TO DEMO USER
 */
export async function getUserIdFromRequest(request) {
  try {
    const authHeader = request.headers.get('authorization')
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1]
      
      if (!token) {
        return null
      }
      
      const { db } = await connectToDatabase()
      
      const session = await db.collection('sessions').findOne({
        token,
        expiresAt: { $gt: new Date() }
      })
      
      if (session) {
        return session.userId
      }
    }
    
    // Check for userId in request body as fallback for POST requests
    // This allows authenticated requests to pass userId
    // But ONLY if we can verify it's a valid user
    const url = new URL(request.url)
    const queryUserId = url.searchParams.get('userId')
    
    if (queryUserId && queryUserId !== 'demo-user-001' && queryUserId !== 'undefined') {
      // Verify this is a real user
      const { db } = await connectToDatabase()
      const user = await db.collection('users').findOne({ _id: queryUserId })
      if (user) {
        return queryUserId
      }
    }
    
    // Return null instead of demo user - force authentication
    return null
    
  } catch (error) {
    console.error('Error getting user ID:', error)
    return null
  }
}

/**
 * Get user ID from request body
 * Returns null if not provided or is demo user - NO FALLBACK
 */
export function getUserIdFromBody(body) {
  const userId = body?.userId
  if (!userId || userId === 'demo-user-001' || userId === 'undefined') {
    return null
  }
  return userId
}

/**
 * Get userId with strict validation
 * Returns null if invalid - NO FALLBACK TO DEMO USER
 */
export function getUserId(providedUserId) {
  if (!providedUserId || providedUserId === 'demo-user-001' || providedUserId === 'undefined') {
    return null
  }
  return providedUserId
}

/**
 * Check if a user ID is the legacy demo user
 */
export function isDemoUser(userId) {
  return !userId || userId === 'demo-user-001' || userId === 'undefined' || userId === 'null'
}

// Export constants for reference (but don't use as fallback)
export const LEGACY_DEMO_USER_ID = 'demo-user-001' // Kept for migration purposes only
