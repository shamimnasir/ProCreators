// Authentication API - Email verification, signup, login
import { NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import { v4 as uuidv4 } from 'uuid'
import { sendVerificationEmail, sendPasswordResetEmail, sendWelcomeEmail } from '@/lib/email'
import crypto from 'crypto'

// Simple password hashing (in production use bcrypt)
const hashPassword = (password) => {
  return crypto.createHash('sha256').update(password + process.env.SALT || 'procreators').digest('hex')
}

const generateToken = () => crypto.randomBytes(32).toString('hex')

export async function POST(request) {
  try {
    const body = await request.json()
    const { action } = body
    const { db } = await connectToDatabase()
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
    
    switch (action) {
      // ===== SIGNUP =====
      case 'signup': {
        const { email, password, name } = body
        
        if (!email || !password) {
          return NextResponse.json({ success: false, error: 'Email and password required' }, { status: 400 })
        }
        
        // Check if user exists
        const existingUser = await db.collection('users').findOne({ email: email.toLowerCase() })
        if (existingUser) {
          return NextResponse.json({ success: false, error: 'Email already registered' }, { status: 400 })
        }
        
        // Create verification token
        const verificationToken = generateToken()
        const tokenExpiry = new Date()
        tokenExpiry.setHours(tokenExpiry.getHours() + 24) // 24 hour expiry
        
        // Create user
        const userId = uuidv4()
        const newUser = {
          _id: userId,
          email: email.toLowerCase(),
          name: name || '',
          passwordHash: hashPassword(password),
          credits: 50, // Free starter credits
          plan: 'free',
          emailVerified: false,
          verificationToken,
          verificationTokenExpiry: tokenExpiry,
          accountStatus: 'pending_verification',
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
        
        if (!email || !password) {
          return NextResponse.json({ success: false, error: 'Email and password required' }, { status: 400 })
        }
        
        const user = await db.collection('users').findOne({ email: email.toLowerCase() })
        
        if (!user || user.passwordHash !== hashPassword(password)) {
          return NextResponse.json({ success: false, error: 'Invalid email or password' }, { status: 401 })
        }
        
        if (!user.emailVerified) {
          return NextResponse.json({ 
            success: false, 
            error: 'Please verify your email first',
            needsVerification: true 
          }, { status: 401 })
        }
        
        if (user.accountStatus === 'banned' || user.accountStatus === 'suspended') {
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
        
        const user = await db.collection('users').findOne({
          resetToken: token,
          resetTokenExpiry: { $gt: new Date() }
        })
        
        if (!user) {
          return NextResponse.json({ success: false, error: 'Invalid or expired reset token' }, { status: 400 })
        }
        
        await db.collection('users').updateOne(
          { _id: user._id },
          {
            $set: { passwordHash: hashPassword(newPassword) },
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
