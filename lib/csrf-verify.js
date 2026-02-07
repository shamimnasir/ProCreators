// Simplified CSRF verification utility
import crypto from 'crypto'

const CSRF_SECRET = process.env.CSRF_SECRET || process.env.SALT || 'procreators-csrf-secret'

/**
 * Verify CSRF token from request
 * Returns { valid: boolean, error?: string }
 */
export function verifyCsrf(request) {
  const csrfToken = request.headers.get('x-csrf-token')
  
  // In development, allow requests without CSRF for easier testing
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
    if (tokenAge > 3600000) {
      return { valid: false, error: 'Token expired' }
    }
    
    // Verify signature
    const expectedSignature = crypto
      .createHmac('sha256', CSRF_SECRET)
      .update(`csrf:${timestamp}`)
      .digest('hex')
    
    if (signature !== expectedSignature) {
      return { valid: false, error: 'Invalid signature' }
    }
    
    return { valid: true }
  } catch (error) {
    return { valid: false, error: 'Token verification failed' }
  }
}
