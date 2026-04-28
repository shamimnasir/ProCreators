// Authentication API - Email verification, signup, login
import { NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import { v4 as uuidv4 } from 'uuid'
import { sendVerificationEmail, sendPasswordResetEmail, sendWelcomeEmail } from '@/lib/email'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import { sanitizeEmail } from '@/lib/sanitize'
import { logAuthSuccess, logAuthFailure, checkBruteForce, SECURITY_EVENTS, logSecurityEvent } from '@/lib/security-logger'
import { validateRequest, authSchema } from '@/lib/validation'
import { enforceRateLimit } from '@/lib/rate-limiter'

// Secure password hashing with bcrypt
const SALT_ROUNDS = 12

const hashPassword = async (password) => {
  return await bcrypt.hash(password, SALT_ROUNDS)
}

const verifyPassword = async (password, hash) => {
  // Support both old SHA256 hashes (for migration) and new bcrypt hashes
  if (hash && hash.length === 64 && !hash.startsWith('$2')) {
    // Old SHA256 hash - verify and flag for update
    const sha256Hash = crypto.createHash('sha256').update(password + (process.env.SALT || 'procreators')).digest('hex')
    return { valid: sha256Hash === hash, needsUpgrade: true }
  }
  // New bcrypt hash
  const valid = await bcrypt.compare(password, hash)
  return { valid, needsUpgrade: false }
}

const generateToken = () => crypto.randomBytes(32).toString('hex')

// Password strength validation
const validatePassword = (password) => {
  if (!password || password.length < 8) {
    return { valid: false, error: 'Password must be at least 8 characters' }
  }
  if (password.length > 128) {
    return { valid: false, error: 'Password too long' }
  }
  // Check for at least one number and one letter
  if (!/[0-9]/.test(password) || !/[a-zA-Z]/.test(password)) {
    return { valid: false, error: 'Password must contain at least one letter and one number' }
  }
  return { valid: true }
}

export async function POST(request) {
  try {
    const body = await request.json()
    const { action } = body
    
    // SECURITY: Apply rate limiting based on action type
    let rateLimitAction = 'api_general'
    if (action === 'login') rateLimitAction = 'auth_login'
    else if (action === 'signup') rateLimitAction = 'auth_signup'
    else if (action === 'forgot_password' || action === 'reset_password') rateLimitAction = 'auth_password_reset'
    
    const rateLimitCheck = await enforceRateLimit(request, rateLimitAction)
    if (rateLimitCheck.limited) {
      return rateLimitCheck.response
    }
    
    const { db } = await connectToDatabase()
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
    
    switch (action) {
      // ===== SIGNUP =====
      case 'signup': {
        const { email, password, name } = body
        
        if (!email || !password) {
          return NextResponse.json({ success: false, error: 'Email and password required' }, { status: 400 })
        }
        
        // Validate password strength
        const passwordCheck = validatePassword(password)
        if (!passwordCheck.valid) {
          return NextResponse.json({ success: false, error: passwordCheck.error }, { status: 400 })
        }
        
        // Sanitize email
        const sanitizedEmail = sanitizeEmail(email)
        if (!sanitizedEmail || !sanitizedEmail.includes('@')) {
          return NextResponse.json({ success: false, error: 'Invalid email address' }, { status: 400 })
        }
        
        // Check if user exists
        const existingUser = await db.collection('users').findOne(
          { email: sanitizedEmail },
          { projection: { _id: 1 } }
        )
        if (existingUser) {
          return NextResponse.json({ success: false, error: 'Email already registered' }, { status: 400 })
        }
        
        // Create verification token
        const verificationToken = generateToken()
        const tokenExpiry = new Date()
        tokenExpiry.setHours(tokenExpiry.getHours() + 24) // 24 hour expiry
        
        // Create user with bcrypt hashed password
        const userId = uuidv4()
        const hashedPassword = await hashPassword(password)
        const initialCredits = 25 // Free starter credits (simplified v2: 1 credit ≈ $0.02)
        const newUser = {
          _id: userId,
          email: sanitizedEmail,
          name: (name || '').substring(0, 100).trim(),
          passwordHash: hashedPassword,
          credits: initialCredits, // Legacy field for backward compatibility
          membershipCredits: 0, // Monthly subscription credits (reset monthly)
          purchasedCredits: initialCredits, // Free credits go here (they never expire)
          plan: 'free',
          emailVerified: false,
          verificationToken,
          verificationTokenExpiry: tokenExpiry,
          accountStatus: 'pending_verification',
          totalCreditsUsed: 0,
          generationsToday: 0,
          createdAt: new Date(),
          lastActiveAt: new Date()
        }
        
        await db.collection('users').insertOne(newUser)
        
        // Send verification email
        const emailResult = await sendVerificationEmail(email, verificationToken, baseUrl)
        
        return NextResponse.json({
          success: true,
          message: 'Account created! Please check your email to verify your account.',
          userId,
          emailSent: emailResult.success
        })
      }
      
      // ===== VERIFY EMAIL =====
      case 'verify': {
        const { token } = body
        
        if (!token) {
          return NextResponse.json({ success: false, error: 'Verification token required' }, { status: 400 })
        }
        
        const user = await db.collection('users').findOne({
          verificationToken: token,
          verificationTokenExpiry: { $gt: new Date() }
        })
        
        if (!user) {
          return NextResponse.json({ success: false, error: 'Invalid or expired token' }, { status: 400 })
        }
        
        // Mark as verified
        await db.collection('users').updateOne(
          { _id: user._id },
          {
            $set: {
              emailVerified: true,
              accountStatus: 'active',
              verifiedAt: new Date()
            },
            $unset: {
              verificationToken: '',
              verificationTokenExpiry: ''
            }
          }
        )
        
        // Send welcome email
        await sendWelcomeEmail(user.email, user.name, baseUrl)
        
        return NextResponse.json({
          success: true,
          message: 'Email verified! Your account is now active.',
          userId: user._id
        })
      }
      
      // ===== LOGIN =====
      case 'login': {
        const { email, password } = body
        const clientIp = request.headers.get('x-forwarded-for') || 'unknown'
        
        if (!email || !password) {
          return NextResponse.json({ success: false, error: 'Email and password required' }, { status: 400 })
        }
        
        const sanitizedEmail = sanitizeEmail(email)
        
        // Check for brute force attempts
        const bruteForceCheck = await checkBruteForce(sanitizedEmail)
        if (bruteForceCheck.blocked) {
          await logSecurityEvent(SECURITY_EVENTS.LOGIN_BLOCKED, {
            email: sanitizedEmail.substring(0, 3) + '***',
            ip: clientIp,
            reason: 'Too many failed attempts'
          })
          return NextResponse.json({ 
            success: false, 
            error: 'Too many failed attempts. Please try again later.' 
          }, { status: 429 })
        }
        
        const user = await db.collection('users').findOne({ email: sanitizedEmail })
        
        if (!user) {
          // Use constant time comparison to prevent timing attacks
          await bcrypt.compare(password, '$2a$12$dummy.hash.for.timing.attack.prevention')
          await logAuthFailure(sanitizedEmail, clientIp, 'User not found')
          return NextResponse.json({ success: false, error: 'Invalid email or password' }, { status: 401 })
        }
        
        // Verify password (supports both old SHA256 and new bcrypt)
        const passwordResult = await verifyPassword(password, user.passwordHash)
        
        if (!passwordResult.valid) {
          await logAuthFailure(sanitizedEmail, clientIp, 'Invalid password')
          return NextResponse.json({ success: false, error: 'Invalid email or password' }, { status: 401 })
        }
        
        // If using old hash, upgrade to bcrypt
        if (passwordResult.needsUpgrade) {
          const newHash = await hashPassword(password)
          await db.collection('users').updateOne(
            { _id: user._id },
            { $set: { passwordHash: newHash, passwordUpgradedAt: new Date() } }
          )
        }
        
        if (!user.emailVerified) {
          return NextResponse.json({ 
            success: false, 
            error: 'Please verify your email first',
            needsVerification: true 
          }, { status: 401 })
        }
        
        if (user.accountStatus === 'banned' || user.accountStatus === 'suspended') {
          await logSecurityEvent(SECURITY_EVENTS.LOGIN_BLOCKED, {
            userId: user._id,
            ip: clientIp,
            reason: user.accountStatus
          })
          return NextResponse.json({ 
            success: false, 
            error: `Account ${user.accountStatus}. Contact support.` 
          }, { status: 403 })
        }
        
        // Create session token
        const sessionToken = generateToken()
        const sessionExpiry = new Date()
        sessionExpiry.setDays ? sessionExpiry.setDate(sessionExpiry.getDate() + 7) : sessionExpiry.setDate(sessionExpiry.getDate() + 7)
        
        await db.collection('sessions').insertOne({
          _id: uuidv4(),
          userId: user._id,
          token: sessionToken,
          expiresAt: sessionExpiry,
          createdAt: new Date()
        })
        
        // Log successful login
        await logAuthSuccess(user._id, clientIp)
        
        // Update last active
        await db.collection('users').updateOne(
          { _id: user._id },
          { $set: { lastActiveAt: new Date() } }
        )
        
        return NextResponse.json({
          success: true,
          user: {
            id: user._id,
            email: user.email,
            name: user.name,
            credits: user.credits,
            plan: user.plan
          },
          sessionToken
        }, {
          headers: {
            // SECURITY: also set session as httpOnly cookie so admin/non-localStorage
            // pages get auth automatically. Bearer token in body still supported.
            'Set-Cookie': `session_token=${sessionToken}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${7 * 24 * 60 * 60}${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`
          }
        })
      }
      
      // ===== FORGOT PASSWORD =====
      case 'forgot_password': {
        const { email } = body
        
        if (!email) {
          return NextResponse.json({ success: false, error: 'Email required' }, { status: 400 })
        }
        
        const user = await db.collection('users').findOne({ email: email.toLowerCase() })
        
        // Always return success to prevent email enumeration
        if (!user) {
          return NextResponse.json({ success: true, message: 'If an account exists, a reset email has been sent.' })
        }
        
        const resetToken = generateToken()
        const tokenExpiry = new Date()
        tokenExpiry.setHours(tokenExpiry.getHours() + 1) // 1 hour expiry
        
        await db.collection('users').updateOne(
          { _id: user._id },
          {
            $set: {
              resetToken,
              resetTokenExpiry: tokenExpiry
            }
          }
        )
        
        await sendPasswordResetEmail(email, resetToken, baseUrl)
        
        return NextResponse.json({ success: true, message: 'If an account exists, a reset email has been sent.' })
      }
      
      // ===== RESET PASSWORD =====
      case 'reset_password': {
        const { token, newPassword } = body
        
        if (!token || !newPassword) {
          return NextResponse.json({ success: false, error: 'Token and new password required' }, { status: 400 })
        }
        
        // Validate new password strength
        const passwordCheck = validatePassword(newPassword)
        if (!passwordCheck.valid) {
          return NextResponse.json({ success: false, error: passwordCheck.error }, { status: 400 })
        }
        
        const user = await db.collection('users').findOne({
          resetToken: token,
          resetTokenExpiry: { $gt: new Date() }
        })
        
        if (!user) {
          return NextResponse.json({ success: false, error: 'Invalid or expired reset token' }, { status: 400 })
        }
        
        // Hash new password with bcrypt
        const newHash = await hashPassword(newPassword)
        
        await db.collection('users').updateOne(
          { _id: user._id },
          {
            $set: { passwordHash: newHash, passwordChangedAt: new Date() },
            $unset: { resetToken: '', resetTokenExpiry: '' }
          }
        )
        
        // Invalidate all sessions
        await db.collection('sessions').deleteMany({ userId: user._id })
        
        return NextResponse.json({ success: true, message: 'Password reset successfully. Please login.' })
      }
      
      // ===== RESEND VERIFICATION =====
      case 'resend_verification': {
        const { email } = body
        
        if (!email) {
          return NextResponse.json({ success: false, error: 'Email required' }, { status: 400 })
        }
        
        const user = await db.collection('users').findOne({ email: email.toLowerCase() })
        
        if (!user) {
          return NextResponse.json({ success: true, message: 'If an account exists, a verification email has been sent.' })
        }
        
        if (user.emailVerified) {
          return NextResponse.json({ success: false, error: 'Email already verified' }, { status: 400 })
        }
        
        const verificationToken = generateToken()
        const tokenExpiry = new Date()
        tokenExpiry.setHours(tokenExpiry.getHours() + 24)
        
        await db.collection('users').updateOne(
          { _id: user._id },
          {
            $set: {
              verificationToken,
              verificationTokenExpiry: tokenExpiry
            }
          }
        )
        
        await sendVerificationEmail(email, verificationToken, baseUrl)
        
        return NextResponse.json({ success: true, message: 'Verification email sent!' })
      }
      
      default:
        return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 })
    }
    
  } catch (error) {
    console.error('Auth error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
