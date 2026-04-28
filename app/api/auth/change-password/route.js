// Password Change API - Authenticated password change with session management
import { NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import { requireAuth } from '@/lib/auth-middleware'
import { verifyCsrf } from '@/lib/csrf-verify'
import { enforceRateLimit } from '@/lib/rate-limiter'
import { logSecurityEvent, SECURITY_EVENTS } from '@/lib/security-logger'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'

const SALT_ROUNDS = 12

// Password strength validation
function validatePassword(password) {
  if (!password || password.length < 8) {
    return { valid: false, error: 'Password must be at least 8 characters' }
  }
  if (password.length > 128) {
    return { valid: false, error: 'Password too long' }
  }
  if (!/[0-9]/.test(password) || !/[a-zA-Z]/.test(password)) {
    return { valid: false, error: 'Password must contain at least one letter and one number' }
  }
  return { valid: true }
}

export async function POST(request) {
  try {
    // SECURITY: Rate limiting
    const rateLimitCheck = await enforceRateLimit(request, 'auth_password_reset')
    if (rateLimitCheck.limited) {
      return rateLimitCheck.response
    }
    
    // SECURITY: CSRF verification
    const csrfCheck = verifyCsrf(request)
    if (!csrfCheck.valid) {
      return NextResponse.json(
        { success: false, error: csrfCheck.error, code: 'CSRF_INVALID' },
        { status: 403 }
      )
    }
    
    // SECURITY: Authentication required
    const auth = await requireAuth(request)
    if (!auth.authenticated) {
      return auth.response
    }
    
    const body = await request.json()
    const { currentPassword, newPassword, invalidateAllSessions = true } = body
    
    // Validate inputs
    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { success: false, error: 'Current password and new password are required' },
        { status: 400 }
      )
    }
    
    // Validate new password strength
    const passwordCheck = validatePassword(newPassword)
    if (!passwordCheck.valid) {
      return NextResponse.json(
        { success: false, error: passwordCheck.error },
        { status: 400 }
      )
    }
    
    const { db } = await connectToDatabase()
    const clientIp = request.headers.get('x-forwarded-for') || 'unknown'
    
    // Get user with password hash
    const user = await db.collection('users').findOne({ _id: auth.userId })
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }
    
    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash)
    
    if (!isCurrentPasswordValid) {
      // Log failed attempt
      await logSecurityEvent(SECURITY_EVENTS.AUTH_FAILURE, {
        userId: auth.userId,
        action: 'password_change',
        reason: 'Invalid current password',
        ip: clientIp
      })
      
      return NextResponse.json(
        { success: false, error: 'Current password is incorrect' },
        { status: 401 }
      )
    }
    
    // Hash new password
    const newPasswordHash = await bcrypt.hash(newPassword, SALT_ROUNDS)
    
    // Update password
    await db.collection('users').updateOne(
      { _id: auth.userId },
      {
        $set: {
          passwordHash: newPasswordHash,
          passwordChangedAt: new Date(),
          passwordVersion: (user.passwordVersion || 0) + 1 // Track password changes
        }
      }
    )
    
    // SECURITY: Invalidate sessions
    let sessionsInvalidated = 0
    if (invalidateAllSessions) {
      // Invalidate ALL sessions (including current one)
      const result = await db.collection('sessions').deleteMany({ userId: auth.userId })
      sessionsInvalidated = result.deletedCount
    } else {
      // Invalidate all sessions EXCEPT current one
      const currentToken = request.headers.get('authorization')?.split(' ')[1]
      const result = await db.collection('sessions').deleteMany({
        userId: auth.userId,
        token: { $ne: currentToken }
      })
      sessionsInvalidated = result.deletedCount
    }
    
    // Log successful password change
    await logSecurityEvent(SECURITY_EVENTS.SENSITIVE_DATA_ACCESS, {
      userId: auth.userId,
      action: 'password_changed',
      sessionsInvalidated,
      ip: clientIp
    })
    
    return NextResponse.json({
      success: true,
      message: invalidateAllSessions 
        ? 'Password changed successfully. Please log in again.'
        : 'Password changed successfully. Other sessions have been logged out.',
      sessionsInvalidated,
      requireRelogin: invalidateAllSessions
    })
    
  } catch (error) {
    console.error('Password change error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to change password' },
      { status: 500 }
    )
  }
}
