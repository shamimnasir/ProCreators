// Utility to get user ID from request
// This checks the Authorization header for a session token and returns the user ID
import { connectToDatabase } from '@/lib/mongodb'

const DEMO_USER_ID = 'demo-user-001'

/**
 * Get user ID from request headers (session token)
 * Falls back to demo user ID if not authenticated
 */
export async function getUserIdFromRequest(request) {
  try {
    const authHeader = request.headers.get('authorization')
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1]
      const { db } = await connectToDatabase()
      
      const session = await db.collection('sessions').findOne({
        token,
        expiresAt: { $gt: new Date() }
      })
      
      if (session) {
        return session.userId
      }
    }
    
    // Check for userId in query params as fallback
    const url = new URL(request.url)
    const queryUserId = url.searchParams.get('userId')
    if (queryUserId) {
      return queryUserId
    }
    
    // Return demo user as fallback
    return DEMO_USER_ID
    
  } catch (error) {
    console.error('Error getting user ID:', error)
    return DEMO_USER_ID
  }
}

/**
 * Get user ID from request body
 */
export function getUserIdFromBody(body) {
  return body?.userId || DEMO_USER_ID
}

/**
 * Simple function to get userId with fallback
 */
export function getUserId(providedUserId) {
  return providedUserId || DEMO_USER_ID
}

export { DEMO_USER_ID }
