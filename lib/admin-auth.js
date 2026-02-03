// Admin authentication middleware
import { connectToDatabase } from '@/lib/mongodb'

// Admin emails that can access the admin panel
export const ADMIN_EMAILS = [
  'admin@procreators.io',
  'its4shamim@gmail.com',
  // Add more admin emails here
]

export async function verifyAdmin(request) {
  try {
    const authHeader = request.headers.get('authorization')
    
    // If no auth header, check for session token in cookies or allow demo mode for now
    if (!authHeader) {
      // For now, we'll check if there's a userId in the request
      // In production, you should require authentication
      return { isAdmin: false, error: 'No authorization header' }
    }
    
    const token = authHeader.replace('Bearer ', '')
    const { db } = await connectToDatabase()
    
    // Find session
    const session = await db.collection('sessions').findOne({
      token,
      expiresAt: { $gt: new Date() }
    })
    
    if (!session) {
      return { isAdmin: false, error: 'Invalid session' }
    }
    
    // Get user
    const user = await db.collection('users').findOne({ _id: session.userId })
    
    if (!user) {
      return { isAdmin: false, error: 'User not found' }
    }
    
    // Check if user is admin
    const isAdmin = ADMIN_EMAILS.includes(user.email?.toLowerCase()) || 
                    user.role === 'admin' || 
                    user.isAdmin === true
    
    return { 
      isAdmin, 
      user,
      error: isAdmin ? null : 'Not authorized as admin'
    }
    
  } catch (error) {
    console.error('Admin verification error:', error)
    return { isAdmin: false, error: error.message }
  }
}

// Helper to check admin status from API routes
export async function requireAdmin(request) {
  const result = await verifyAdmin(request)
  
  if (!result.isAdmin) {
    return {
      authorized: false,
      response: {
        success: false,
        error: result.error || 'Admin access required'
      },
      status: 403
    }
  }
  
  return {
    authorized: true,
    user: result.user
  }
}
