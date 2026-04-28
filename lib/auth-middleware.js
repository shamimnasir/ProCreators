// Secure Authentication Middleware
// This module provides authentication utilities that DO NOT fallback to demo users
// All protected routes should use these functions

import { connectToDatabase } from './mongodb'
import { NextResponse } from 'next/server'

/**
 * Verify session token and return user data
 * Reads from BOTH the `session_token` cookie AND the `Authorization: Bearer` header.
 * Returns null if not authenticated - DOES NOT fallback to demo user.
 */
export async function verifySession(request) {
  try {
    let token = null

    // Method 1: Authorization: Bearer <token> header
    const authHeader = request.headers.get('authorization')
    if (authHeader?.toLowerCase().startsWith('bearer ')) {
      const t = authHeader.substring(7).trim()
      if (t && t !== 'null' && t !== 'undefined') {
        token = t
      }
    }

    // Method 2: session_token cookie (set by /api/auth login response)
    if (!token) {
      const cookieHeader = request.headers.get('cookie')
      if (cookieHeader) {
        const m = cookieHeader.match(/(?:^|;\s*)session_token=([^;]+)/)
        if (m) token = decodeURIComponent(m[1])
      }
    }

    if (!token) return null

    const { db } = await connectToDatabase()

    const session = await db.collection('sessions').findOne({
      token,
      expiresAt: { $gt: new Date() }
    })

    if (!session) {
      return null
    }

    // Get user data
    const user = await db.collection('users').findOne(
      { _id: session.userId },
      { projection: { passwordHash: 0 } } // Never return password hash
    )

    if (!user) {
      return null
    }

    return {
      userId: session.userId,
      user,
      session
    }
  } catch (error) {
    console.error('Session verification error:', error)
    return null
  }
}

/**
 * Get authenticated user ID from request
 * Returns null if not authenticated - DOES NOT fallback to demo user
 */
export async function getAuthenticatedUserId(request) {
  const sessionData = await verifySession(request)
  return sessionData?.userId || null
}

/**
 * Require authentication middleware wrapper
 * Use this to protect API routes that require login
 */
export async function requireAuth(request) {
  const sessionData = await verifySession(request)
  
  if (!sessionData) {
    return {
      authenticated: false,
      response: NextResponse.json(
        { 
          success: false, 
          error: 'Authentication required',
          code: 'AUTH_REQUIRED'
        },
        { status: 401 }
      )
    }
  }
  
  return {
    authenticated: true,
    userId: sessionData.userId,
    user: sessionData.user,
    session: sessionData.session
  }
}

/**
 * Optional authentication - returns user if logged in, null otherwise
 * Use this for routes that work both authenticated and unauthenticated
 */
export async function optionalAuth(request) {
  return await verifySession(request)
}

/**
 * Check if user is admin
 * Checks both 'isAdmin' and 'role' fields for flexibility
 */
export async function requireAdmin(request) {
  const auth = await requireAuth(request)
  
  if (!auth.authenticated) {
    return auth
  }
  
  // SECURITY: Check multiple admin indicators
  const isAdmin = auth.user?.isAdmin === true || auth.user?.role === 'admin'
  
  if (!isAdmin) {
    return {
      authenticated: false,
      response: NextResponse.json(
        { 
          success: false, 
          error: 'Admin access required',
          code: 'ADMIN_REQUIRED'
        },
        { status: 403 }
      )
    }
  }
  
  return auth
}

/**
 * Get user ID with explicit fallback handling
 * For routes that need to work without auth, generate anonymous session ID
 */
export function getAnonymousSessionId(request) {
  // Try to get from cookie or generate new
  const cookies = request.headers.get('cookie') || ''
  const match = cookies.match(/anonymous_session=([^;]+)/)
  
  if (match) {
    return match[1]
  }
  
  // Generate a new anonymous session ID
  return `anon_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`
}

/**
 * Security headers to add to responses
 */
export const securityHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https: blob:; font-src 'self' data:; connect-src 'self' https:;"
}

/**
 * Add security headers to response
 */
export function withSecurityHeaders(response) {
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value)
  })
  return response
}
