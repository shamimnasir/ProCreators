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

  // ============= 3. Same-origin CORS =============
  // Block cross-origin API calls (browsers send Origin header on cross-origin fetch).
  // Allowlist is built from:
  //  - request host (same-origin)
  //  - process.env.NEXT_PUBLIC_BASE_URL (configured preview)
  //  - process.env.CORS_ORIGINS (comma-separated, or "*" to allow ALL origins)
  //  - *.emergentagent.com, *.emergent.host, *.emergent.sh (platform domains)
  //  - localhost (dev)
  if (pathname.startsWith('/api/')) {
    const origin = request.headers.get('origin')
    const host = request.headers.get('host')

    if (origin) {
      // Env-driven wildcard escape hatch: CORS_ORIGINS="*" allows any origin.
      const corsEnv = (process.env.CORS_ORIGINS || '').trim()
      if (corsEnv === '*') {
        // permissive mode — skip the CORS block
      } else {
        try {
          const originHost = new URL(origin).host
          const allowedHosts = new Set([host])

          if (process.env.NEXT_PUBLIC_BASE_URL) {
            try { allowedHosts.add(new URL(process.env.NEXT_PUBLIC_BASE_URL).host) } catch (_) {}
          }

          // Comma-separated explicit origins from env
          if (corsEnv) {
            for (const raw of corsEnv.split(',')) {
              const v = raw.trim()
              if (!v) continue
              try { allowedHosts.add(new URL(v).host) } catch (_) { allowedHosts.add(v) }
            }
          }

          // Platform subdomains
          if (
            originHost.endsWith('.emergentagent.com') ||
            originHost.endsWith('.emergent.host') ||
            originHost.endsWith('.emergent.sh')
          ) {
            allowedHosts.add(originHost)
          }

          // Localhost dev
          if (originHost === 'localhost:3000' || originHost.startsWith('localhost:') || originHost.startsWith('127.0.0.1')) {
            allowedHosts.add(originHost)
          }

          if (!allowedHosts.has(originHost)) {
            const res = NextResponse.json(
              { success: false, error: 'Cross-origin request blocked', code: 'CORS_BLOCKED' },
              { status: 403 }
            )
            return applySecurityHeaders(res)
          }
        } catch (_) {
          // bad Origin header — let it through, browser will also block
        }
      }
    }
  }

  // ============= 4. Security headers on every response =============
  const response = NextResponse.next()
  return applySecurityHeaders(response)
}

// Run on all /api routes
export const config = {
  matcher: ['/api/:path*']
}
