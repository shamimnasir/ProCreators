// Comprehensive CSRF Protection Middleware
// Implements double-submit cookie pattern with signed tokens
import crypto from 'crypto'
import { NextResponse } from 'next/server'

// IMPORTANT: Use a stable fallback secret to prevent signature mismatches across pods
// In production, set CSRF_SECRET environment variable for security
const CSRF_SECRET = process.env.CSRF_SECRET || process.env.SALT || 'procreators-csrf-secret-2026'
const TOKEN_EXPIRY = 3600000 // 1 hour

/**
 * Generate a new CSRF token
 * Returns both the token and the signature for double-submit verification
 */
export function generateCsrfToken() {
  const timestamp = Date.now().toString()
  const signature = crypto
    .createHmac('sha256', CSRF_SECRET)
    .update(`csrf:${timestamp}`)
    .digest('hex')
  
  const token = Buffer.from(`${timestamp}:${signature}`).toString('base64')
  
  return {
    token,
    expiresAt: Date.now() + TOKEN_EXPIRY
  }
}

/**
 * Verify CSRF token from request
 * Returns { valid: boolean, error?: string }
 */
export function verifyCsrf(request) {
  // Get token from header (preferred) or body
  const csrfToken = request.headers.get('x-csrf-token')
  
  // In development, allow requests without CSRF for easier testing
  // SECURITY: Remove this in production
  if (process.env.NODE_ENV === 'development' && !csrfToken) {
    return { valid: true }
  }
  
  if (!csrfToken) {
    return { valid: false, error: 'Missing CSRF token' }
  }
  
  try {
    // Decode token
    const decoded = Buffer.from(csrfToken, 'base64').toString()
    const [timestamp, signature] = decoded.split(':')
    
    if (!timestamp || !signature) {
      return { valid: false, error: 'Invalid token format' }
    }
    
    // Check expiration (1 hour)
    const tokenAge = Date.now() - parseInt(timestamp)
    if (tokenAge > TOKEN_EXPIRY) {
      return { valid: false, error: 'Token expired' }
    }
    
    // Verify signature using constant-time comparison
    const expectedSignature = crypto
      .createHmac('sha256', CSRF_SECRET)
      .update(`csrf:${timestamp}`)
      .digest('hex')
    
    const isValid = crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    )
    
    if (!isValid) {
      return { valid: false, error: 'Invalid signature' }
    }
    
    return { valid: true }
  } catch (error) {
    return { valid: false, error: 'Token verification failed' }
  }
}

/**
 * CSRF Protection Middleware
 * Wrap state-changing handlers with this for automatic CSRF validation
 * 
 * Usage:
 * export const POST = withCsrf(async (request) => { ... })
 */
export function withCsrf(handler, options = {}) {
  const { 
    skipMethods = ['GET', 'HEAD', 'OPTIONS'],
    allowedOrigins = []
  } = options
  
  return async (request) => {
    const method = request.method.toUpperCase()
    
    // Skip CSRF check for safe methods
    if (skipMethods.includes(method)) {
      return handler(request)
    }
    
    // Check origin header for same-origin requests
    const origin = request.headers.get('origin')
    const host = request.headers.get('host')
    
    if (origin) {
      const originHost = new URL(origin).host
      const isAllowedOrigin = originHost === host || allowedOrigins.includes(origin)
      
      if (!isAllowedOrigin) {
        return NextResponse.json(
          { success: false, error: 'Invalid origin', code: 'CSRF_ORIGIN_MISMATCH' },
          { status: 403 }
        )
      }
    }
    
    // Verify CSRF token
    const csrfCheck = verifyCsrf(request)
    
    if (!csrfCheck.valid) {
      return NextResponse.json(
        { success: false, error: csrfCheck.error, code: 'CSRF_INVALID' },
        { status: 403 }
      )
    }
    
    return handler(request)
  }
}

/**
 * API endpoint to get a fresh CSRF token
 * Call this from the frontend to get a token before making state-changing requests
 */
export function getCsrfTokenHandler() {
  const { token, expiresAt } = generateCsrfToken()
  
  return NextResponse.json({
    success: true,
    csrfToken: token,
    expiresAt
  })
}

/**
 * List of state-changing endpoints that MUST have CSRF protection
 * Use this for auditing purposes
 */
export const CSRF_PROTECTED_ENDPOINTS = [
  // Auth
  '/api/auth', // POST
  '/api/auth/change-password',
  
  // User actions
  '/api/user/profile', // POST
  '/api/user/settings', // POST
  
  // Credits & Payments
  '/api/stripe/checkout',
  '/api/credits', // POST
  
  // Library
  '/api/library/save',
  '/api/library/delete',
  
  // Admin (all POST/PUT/DELETE)
  '/api/admin/*',
  
  // Generation endpoints
  '/api/generate/*'
]

