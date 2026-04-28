import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-middleware'

// Internal allow-list — block fetches to private/internal addresses (SSRF guard)
const BLOCKED_HOST_PATTERNS = [
  /^localhost$/i,
  /^127\./,
  /^10\./,
  /^192\.168\./,
  /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
  /^169\.254\./,           // link-local
  /^::1$/,
  /^fc00:/i,               // IPv6 ULA
  /^fe80:/i,               // IPv6 link-local
  /\.internal$/i,
  /\.local$/i,
  /\.localhost$/i
]

function isBlockedHost(hostname) {
  return BLOCKED_HOST_PATTERNS.some(re => re.test(hostname))
}

export async function POST(request) {
  // SECURITY: Require authentication
  const auth = await requireAuth(request)
  if (!auth.authenticated) return auth.response

  try {
    const { url } = await request.json()

    if (!url) {
      return NextResponse.json(
        { success: false, error: 'URL is required' },
        { status: 400 }
      )
    }

    // Validate URL format + protocol allowlist + SSRF guard
    let parsed
    try {
      parsed = new URL(url)
    } catch (e) {
      return NextResponse.json(
        { success: false, error: 'Invalid URL format' },
        { status: 400 }
      )
    }

    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return NextResponse.json(
        { success: false, error: 'Only http(s) URLs are allowed' },
        { status: 400 }
      )
    }

    if (isBlockedHost(parsed.hostname)) {
      return NextResponse.json(
        { success: false, error: 'Access to internal addresses is not permitted' },
        { status: 400 }
      )
    }

    // Fetch the webpage content (with timeout to prevent hangs)
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000) // 10s
    let response
    try {
      response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        signal: controller.signal,
        redirect: 'follow'
      })
    } finally {
      clearTimeout(timeoutId)
    }

    if (!response.ok) {
      return NextResponse.json(
        { success: false, error: `Failed to fetch URL: ${response.status}` },
        { status: 400 }
      )
    }

    const html = await response.text()

    // Extract text content from HTML (basic extraction)
    let text = html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()

    // Limit to first 3000 characters
    text = text.substring(0, 3000)

    return NextResponse.json({
      success: true,
      content: text,
      url: url
    })

  } catch (error) {
    console.error('URL scraping error:', error?.message)
    return NextResponse.json(
      { success: false, error: 'Failed to scrape URL' },
      { status: 500 }
    )
  }
}
