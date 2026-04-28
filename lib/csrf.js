// CSRF Protection Utilities
// Token-based CSRF protection for forms and API mutations

import crypto from 'crypto'

// Secret for CSRF token generation (should be in env)
// IMPORTANT: Must match csrf-verify.js for consistent validation
const CSRF_SECRET = process.env.CSRF_SECRET || process.env.SALT || 'procreators-csrf-secret-2026'

/**
 * Generate a CSRF token
 * Creates a signed token tied to a session
 */
export function generateCsrfToken(sessionId) {
  const timestamp = Date.now()
  const data = `${sessionId}:${timestamp}`
  const signature = crypto
    .createHmac('sha256', CSRF_SECRET)
    .update(data)
    .digest('hex')
  
  // Token format: base64(timestamp:signature)
  const token = Buffer.from(`${timestamp}:${signature}`).toString('base64')
  return token
}

/**
 * Verify a CSRF token
 * Checks signature and expiration (1 hour default)
 */
export function verifyCsrfToken(token, sessionId, maxAge = 3600000) {
  if (!token || !sessionId) {
    return { valid: false, error: 'Missing token or session' }
  }
  
  try {
    // Decode token
    const decoded = Buffer.from(token, 'base64').toString()
    const [timestamp, signature] = decoded.split(':')
    
    if (!timestamp || !signature) {
      return { valid: false, error: 'Invalid token format' }
    }
    
    // Check expiration
    const tokenAge = Date.now() - parseInt(timestamp)
    if (tokenAge > maxAge) {
      return { valid: false, error: 'Token expired' }
    }
    
    // Verify signature
    const expectedSignature = crypto
      .createHmac('sha256', CSRF_SECRET)
      .update(`${sessionId}:${timestamp}`)
      .digest('hex')
    
    // Constant-time comparison to prevent timing attacks
    const signaturesMatch = crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    )
    
    if (!signaturesMatch) {
      return { valid: false, error: 'Invalid signature' }
    }
    
    return { valid: true }
  } catch (error) {
    return { valid: false, error: 'Token verification failed' }
  }
}

/**
 * Middleware to require CSRF token for mutations
 */
export function requireCsrf(handler) {
  return async (request) => {
    // Only check for mutation methods
    if (!['POST', 'PUT', 'DELETE', 'PATCH'].includes(request.method)) {
      return handler(request)
    }
    
    // Get CSRF token from header or body
    const csrfToken = request.headers.get('x-csrf-token')
    
    // Get session ID for verification
    const authHeader = request.headers.get('authorization')
    const sessionId = authHeader?.split(' ')[1] || request.headers.get('x-session-id')
    
    if (!csrfToken) {
      return NextResponse.json({
        success: false,
        error: 'CSRF token required',
        code: 'CSRF_MISSING'
      }, { status: 403 })
    }
    
    const verification = verifyCsrfToken(csrfToken, sessionId)
    
    if (!verification.valid) {
      // Log the CSRF violation
      const { logSecurityEvent, SECURITY_EVENTS } = await import('./security-logger')
      await logSecurityEvent(SECURITY_EVENTS.CSRF_VIOLATION, {
        error: verification.error,
        ip: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent')
      })
      
      return NextResponse.json({
        success: false,
        error: 'Invalid CSRF token',
        code: 'CSRF_INVALID'
      }, { status: 403 })
    }
    
    return handler(request)
  }
}

/**
 * Get CSRF token for client-side use
 */
export function getCsrfTokenHeader(sessionToken) {
  const token = generateCsrfToken(sessionToken || 'anonymous')
  return {
    'x-csrf-token': token
  }
}

// API route handler to get new CSRF token
export async function handleGetCsrfToken(request) {
  const authHeader = request.headers.get('authorization')
  const sessionId = authHeader?.split(' ')[1] || `anon_${Date.now()}`
  
  const token = generateCsrfToken(sessionId)
  
  return {
    success: true,
    csrfToken: token
  }
}

export default {
  generateCsrfToken,
  verifyCsrfToken,
  requireCsrf,
  getCsrfTokenHeader,
  handleGetCsrfToken
}
