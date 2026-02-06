// Rate Limiting Utility
// In-memory rate limiter for API protection against abuse
// For production at scale, consider Redis-based implementation

import { logSecurityEvent, SECURITY_EVENTS } from './security-logger'

// In-memory store for rate limiting
// Key: identifier, Value: { count, resetTime }
const rateLimitStore = new Map()

// Clean up expired entries periodically (every 5 minutes)
const CLEANUP_INTERVAL = 5 * 60 * 1000
let cleanupTimer = null

function startCleanup() {
  if (cleanupTimer) return
  cleanupTimer = setInterval(() => {
    const now = Date.now()
    for (const [key, value] of rateLimitStore.entries()) {
      if (now > value.resetTime) {
        rateLimitStore.delete(key)
      }
    }
  }, CLEANUP_INTERVAL)
}

// Start cleanup on module load
if (typeof window === 'undefined') {
  startCleanup()
}

/**
 * Rate limit configurations for different actions
 */
export const RATE_LIMITS = {
  // Authentication - strict limits
  auth_login: { maxRequests: 5, windowMs: 15 * 60 * 1000 }, // 5 attempts per 15 min
  auth_signup: { maxRequests: 3, windowMs: 60 * 60 * 1000 }, // 3 signups per hour
  auth_password_reset: { maxRequests: 3, windowMs: 60 * 60 * 1000 }, // 3 resets per hour
  
  // Payments - moderate limits
  stripe_checkout: { maxRequests: 10, windowMs: 60 * 60 * 1000 }, // 10 checkouts per hour
  subscription: { maxRequests: 5, windowMs: 60 * 60 * 1000 }, // 5 subscription changes per hour
  
  // User actions - relaxed limits
  profile_update: { maxRequests: 20, windowMs: 60 * 60 * 1000 }, // 20 updates per hour
  library_save: { maxRequests: 100, windowMs: 60 * 60 * 1000 }, // 100 saves per hour
  
  // Content generation - based on credits but also rate limited
  content_generate: { maxRequests: 60, windowMs: 60 * 60 * 1000 }, // 60 generations per hour
  
  // API general - catch-all
  api_general: { maxRequests: 100, windowMs: 60 * 1000 }, // 100 requests per minute
  
  // Strict limits for sensitive operations
  admin_action: { maxRequests: 10, windowMs: 60 * 60 * 1000 }, // 10 admin actions per hour
}

/**
 * Get rate limit identifier from request
 * Combines IP + user ID for more accurate limiting
 */
export function getRateLimitIdentifier(request, userId = null) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() 
    || request.headers.get('x-real-ip') 
    || 'unknown'
  
  // Combine IP and userId for better accuracy
  return userId ? `${ip}:${userId}` : ip
}

/**
 * Check and apply rate limit
 * Returns { allowed: boolean, remaining: number, resetIn: number }
 */
export function checkRateLimit(identifier, action) {
  const config = RATE_LIMITS[action] || RATE_LIMITS.api_general
  const { maxRequests, windowMs } = config
  
  const key = `${action}:${identifier}`
  const now = Date.now()
  
  let record = rateLimitStore.get(key)
  
  // Create new record if doesn't exist or expired
  if (!record || now > record.resetTime) {
    record = {
      count: 0,
      resetTime: now + windowMs
    }
  }
  
  // Increment count
  record.count++
  rateLimitStore.set(key, record)
  
  const remaining = Math.max(0, maxRequests - record.count)
  const resetIn = Math.max(0, record.resetTime - now)
  
  return {
    allowed: record.count <= maxRequests,
    remaining,
    resetIn,
    limit: maxRequests
  }
}

/**
 * Rate limit middleware wrapper for API routes
 * Returns NextResponse with 429 status if rate limited
 */
export async function withRateLimit(request, action, handler) {
  const { NextResponse } = await import('next/server')
  
  // Get identifier
  const authHeader = request.headers.get('authorization')
  const userId = authHeader?.split(' ')[1] || null
  const identifier = getRateLimitIdentifier(request, userId)
  
  // Check rate limit
  const result = checkRateLimit(identifier, action)
  
  if (!result.allowed) {
    // Log the rate limit violation
    await logSecurityEvent(SECURITY_EVENTS.RATE_LIMIT_EXCEEDED, {
      action,
      identifier: identifier.substring(0, 20) + '***', // Partial for privacy
      ip: request.headers.get('x-forwarded-for') || 'unknown',
      limit: result.limit,
      resetIn: result.resetIn
    })
    
    return NextResponse.json({
      success: false,
      error: 'Too many requests. Please try again later.',
      code: 'RATE_LIMIT_EXCEEDED',
      retryAfter: Math.ceil(result.resetIn / 1000)
    }, { 
      status: 429,
      headers: {
        'Retry-After': Math.ceil(result.resetIn / 1000).toString(),
        'X-RateLimit-Limit': result.limit.toString(),
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': Math.ceil(result.resetIn / 1000).toString()
      }
    })
  }
  
  // Execute handler and add rate limit headers to response
  const response = await handler(request)
  
  // Add rate limit headers if response is NextResponse
  if (response && response.headers) {
    response.headers.set('X-RateLimit-Limit', result.limit.toString())
    response.headers.set('X-RateLimit-Remaining', result.remaining.toString())
    response.headers.set('X-RateLimit-Reset', Math.ceil(result.resetIn / 1000).toString())
  }
  
  return response
}

/**
 * Simple rate limit check (non-middleware version)
 * Use this for inline checks in existing handlers
 */
export async function enforceRateLimit(request, action) {
  const { NextResponse } = await import('next/server')
  
  const authHeader = request.headers.get('authorization')
  const userId = authHeader?.split(' ')[1] || null
  const identifier = getRateLimitIdentifier(request, userId)
  
  const result = checkRateLimit(identifier, action)
  
  if (!result.allowed) {
    await logSecurityEvent(SECURITY_EVENTS.RATE_LIMIT_EXCEEDED, {
      action,
      identifier: identifier.substring(0, 20) + '***',
      ip: request.headers.get('x-forwarded-for') || 'unknown'
    })
    
    return {
      limited: true,
      response: NextResponse.json({
        success: false,
        error: 'Too many requests. Please try again later.',
        code: 'RATE_LIMIT_EXCEEDED',
        retryAfter: Math.ceil(result.resetIn / 1000)
      }, { status: 429 })
    }
  }
  
  return { limited: false, remaining: result.remaining }
}

/**
 * Reset rate limit for an identifier (useful for testing or admin override)
 */
export function resetRateLimit(identifier, action) {
  const key = `${action}:${identifier}`
  rateLimitStore.delete(key)
}

/**
 * Get current rate limit status without incrementing
 */
export function getRateLimitStatus(identifier, action) {
  const config = RATE_LIMITS[action] || RATE_LIMITS.api_general
  const key = `${action}:${identifier}`
  const now = Date.now()
  
  const record = rateLimitStore.get(key)
  
  if (!record || now > record.resetTime) {
    return {
      count: 0,
      remaining: config.maxRequests,
      resetIn: config.windowMs,
      limit: config.maxRequests
    }
  }
  
  return {
    count: record.count,
    remaining: Math.max(0, config.maxRequests - record.count),
    resetIn: Math.max(0, record.resetTime - now),
    limit: config.maxRequests
  }
}

export default {
  checkRateLimit,
  withRateLimit,
  enforceRateLimit,
  getRateLimitIdentifier,
  getRateLimitStatus,
  resetRateLimit,
  RATE_LIMITS
}
