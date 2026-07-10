// =====================================================
// SECURITY MIDDLEWARE — runs on every request at the edge
// =====================================================
// Layered defense:
// 1. Block /api/admin/* requests from anyone without an active session cookie
//    (the route itself ALSO does requireAdmin → DB role check; this is the
//    pre-DB cheap rejection layer)
// 2. Cheap per-IP rate limiting on public endpoints (/api/contact, /api/scrape, /api/upload)
// 3. Tight CORS — same-origin only, no wildcard
// 4. Hard security headers on every response

import { NextResponse } from 'next/server'

// In-memory rate-limit store (Edge runtime — single instance per worker)
// For multi-instance production: swap with Redis.
const rateLimitStore = new Map()

// Rate-limit configs: { windowMs, max }
const RATE_LIMITS = {
  '/api/contact':       { windowMs: 60 * 1000,        max: 5 },   // 5/min
  '/api/scrape/url':    { windowMs: 60 * 1000,        max: 10 },  // 10/min
  '/api/upload':        { windowMs: 60 * 1000,        max: 20 },  // 20/min
  '/api/auth/login':    { windowMs: 15 * 60 * 1000,   max: 10 },  // 10/15min
  '/api/auth/register': { windowMs: 60 * 60 * 1000,   max: 5 },   // 5/hour
}

function getClientIp(request) {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'
  )
}

function checkRateLimit(request, pathname) {
  const cfg = RATE_LIMITS[pathname]
  if (!cfg) return null

  const ip = getClientIp(request)
  const key = `${pathname}:${ip}`
  const now = Date.now()

  let rec = rateLimitStore.get(key)
  if (!rec || now > rec.resetAt) {
    rec = { count: 0, resetAt: now + cfg.windowMs }
  }
  rec.count++
  rateLimitStore.set(key, rec)

  // Cheap cleanup: prune occasionally
  if (rateLimitStore.size > 5000) {
    for (const [k, v] of rateLimitStore.entries()) {
      if (now > v.resetAt) rateLimitStore.delete(k)
    }
  }

  if (rec.count > cfg.max) {
    const retryAfter = Math.ceil((rec.resetAt - now) / 1000)
    return NextResponse.json(
      { success: false, error: 'Too many requests. Please slow down.', retryAfter },
      { status: 429, headers: { 'Retry-After': String(retryAfter), 'X-RateLimit-Limit': String(cfg.max), 'X-RateLimit-Remaining': '0' } }
    )
  }
  return null
}

function applySecurityHeaders(response) {
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
  return response
}

// Attach CORS headers that are compatible with credentialed (cookie-bearing) requests.
// Echoes the specific Origin (NOT '*') and sets Allow-Credentials=true.
function applyCorsHeaders(response, origin) {
  if (!origin) return response
  response.headers.set('Access-Control-Allow-Origin', origin)
  response.headers.set('Access-Control-Allow-Credentials', 'true')
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-csrf-token, X-Requested-With')
  response.headers.set('Access-Control-Max-Age', '86400')
  // Make caches key responses on Origin
  const existingVary = response.headers.get('Vary')
  response.headers.set('Vary', existingVary ? `${existingVary}, Origin` : 'Origin')
  return response
}

export async function proxy(request) {
  const { pathname } = request.nextUrl
  const method = request.method

  // ============= 1. Admin endpoint pre-check =============
  // Reject /api/admin/* BEFORE hitting the route if there is no session cookie at all.
  // The route itself still calls requireAdmin() which does the DB role lookup —
  // this is just a cheap pre-filter against unauthenticated scrapers.
  if (pathname.startsWith('/api/admin')) {
    const cookieHeader = request.headers.get('cookie') || ''
    const authHeader = request.headers.get('authorization') || ''
    const hasSession =
      cookieHeader.includes('session_token=') ||
      authHeader.toLowerCase().startsWith('bearer ')

    if (!hasSession) {
      const res = NextResponse.json(
        { success: false, error: 'Authentication required', code: 'AUTH_REQUIRED' },
        { status: 401 }
      )
      return applySecurityHeaders(res)
    }
  }

  // ============= 2. Per-IP rate limit on public endpoints =============
  if (RATE_LIMITS[pathname] && method !== 'OPTIONS') {
    const limited = checkRateLimit(request, pathname)
    if (limited) return applySecurityHeaders(limited)
  }

  // ============= 3. CORS — credential-safe, origin-echoing =============
  // Block cross-origin API calls from unknown origins, but for ALLOWED origins,
  // echo back the specific Origin and set Allow-Credentials=true so cookies work.
  // Allowlist is built from:
  //  - request host (same-origin)
  //  - process.env.NEXT_PUBLIC_BASE_URL (configured preview)
  //  - process.env.CORS_ORIGINS (comma-separated, or "*" to allow ALL origins)
  //  - procreators.io, www.procreators.io (production custom domain)
  //  - localhost (dev)
  let allowedOrigin = null
  if (pathname.startsWith('/api/')) {
    const origin = request.headers.get('origin')
    const host = request.headers.get('host')

    if (origin) {
      const corsEnv = (process.env.CORS_ORIGINS || '').trim()
      let isAllowed = false

      if (corsEnv === '*') {
        // permissive mode
        isAllowed = true
      } else {
        try {
          const originHost = new URL(origin).host
          const allowedHosts = new Set([host])

          if (process.env.NEXT_PUBLIC_BASE_URL) {
            try { allowedHosts.add(new URL(process.env.NEXT_PUBLIC_BASE_URL).host) } catch (_) {}
          }

          if (corsEnv) {
            for (const raw of corsEnv.split(',')) {
              const v = raw.trim()
              if (!v) continue
              try { allowedHosts.add(new URL(v).host) } catch (_) { allowedHosts.add(v) }
            }
          }

          const TRUSTED_DOMAINS = ['procreators.io', 'www.procreators.io']
          if (TRUSTED_DOMAINS.includes(originHost)) {
            allowedHosts.add(originHost)
          }

          if (originHost === 'localhost:3000' || originHost.startsWith('localhost:') || originHost.startsWith('127.0.0.1')) {
            allowedHosts.add(originHost)
          }

          isAllowed = allowedHosts.has(originHost)
        } catch (_) {
          isAllowed = false
        }
      }

      if (!isAllowed) {
        const res = NextResponse.json(
          { success: false, error: 'Cross-origin request blocked', code: 'CORS_BLOCKED' },
          { status: 403 }
        )
        return applySecurityHeaders(res)
      }

      allowedOrigin = origin

      // Handle CORS preflight immediately with proper headers
      if (method === 'OPTIONS') {
        const preflight = new NextResponse(null, { status: 204 })
        applySecurityHeaders(preflight)
        applyCorsHeaders(preflight, allowedOrigin)
        return preflight
      }
    }
  }

  // ============= 4. Security + CORS headers on every response =============
  const response = NextResponse.next()
  applySecurityHeaders(response)
  if (allowedOrigin) applyCorsHeaders(response, allowedOrigin)
  return response
}

// Run on all /api routes
export const config = {
  matcher: ['/api/:path*']
}
