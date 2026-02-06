// User Profile API - Secured with Zod validation and rate limiting
import { NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import { requireAuth, optionalAuth } from '@/lib/auth-middleware'
import { validateRequest, profileUpdateSchema } from '@/lib/validation'
import { enforceRateLimit } from '@/lib/rate-limiter'
import { sanitizeText, sanitizeUrl } from '@/lib/sanitize'
import { logSecurityEvent, SECURITY_EVENTS } from '@/lib/security-logger'

export async function GET(request) {
  try {
    // Try to get user from auth header first (preferred), fallback to query param
    const auth = await optionalAuth(request)
    
    let userId = auth?.userId
    
    // Fallback to query param if not authenticated via header
    if (!userId) {
      const { searchParams } = new URL(request.url)
      userId = searchParams.get('userId')
    }
    
    if (!userId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Authentication required or userId param needed',
        code: 'AUTH_REQUIRED'
      }, { status: 401 })
    }
    
    const { db } = await connectToDatabase()
    const user = await db.collection('users').findOne(
      { _id: userId },
      { projection: { passwordHash: 0, verificationToken: 0, resetToken: 0 } } // Never expose sensitive fields
    )
    
    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 })
    }
    
    return NextResponse.json({ 
      success: true, 
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatarUrl: user.avatarUrl,
        plan: user.plan,
        credits: user.credits,
        emailVerified: user.emailVerified,
        createdAt: user.createdAt
      }
    })
    
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to fetch profile' }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    // SECURITY: Rate limiting for profile updates
    const rateLimitCheck = await enforceRateLimit(request, 'profile_update')
    if (rateLimitCheck.limited) {
      return rateLimitCheck.response
    }
    
    // SECURITY: Require authentication
    const auth = await requireAuth(request)
    if (!auth.authenticated) {
      return auth.response
    }
    
    const body = await request.json()
    
    // SECURITY: Zod validation
    const validation = validateRequest(profileUpdateSchema, {
      userId: auth.userId, // Use authenticated user ID, not from body
      name: body.name,
      avatarUrl: body.avatarUrl
    })
    
    if (!validation.success) {
      return NextResponse.json({
        success: false,
        error: 'Validation failed',
        errors: validation.errors
      }, { status: 400 })
    }
    
    const { name, avatarUrl } = validation.data
    
    const { db } = await connectToDatabase()
    
    // Build update object with sanitized values
    const updateData = {
      updatedAt: new Date()
    }
    
    if (name !== undefined) {
      updateData.name = sanitizeText(name).substring(0, 100)
    }
    
    if (avatarUrl !== undefined) {
      // Validate and sanitize URL
      const cleanUrl = sanitizeUrl(avatarUrl)
      updateData.avatarUrl = cleanUrl || null
    }
    
    const result = await db.collection('users').updateOne(
      { _id: auth.userId },
      { $set: updateData }
    )
    
    if (result.matchedCount === 0) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 })
    }
    
    // Log successful profile update
    await logSecurityEvent(SECURITY_EVENTS.SENSITIVE_DATA_ACCESS, {
      action: 'profile_update',
      userId: auth.userId,
      fieldsUpdated: Object.keys(updateData).filter(k => k !== 'updatedAt'),
      ip: request.headers.get('x-forwarded-for') || 'unknown'
    })
    
    return NextResponse.json({ 
      success: true, 
      message: 'Profile updated successfully'
    })
    
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to update profile' }, { status: 500 })
  }
}
