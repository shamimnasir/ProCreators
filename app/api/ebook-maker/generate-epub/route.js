// Sprint 3 — Ebook Maker: EPUB export
// POST /api/ebook-maker/generate-epub
// Body: same shape as generate-pdf (cover, introduction, chapters, conclusion, settings)
// Returns: application/epub+zip stream
import { NextResponse } from 'next/server'
import { buildEpub } from '@/lib/epub-builder'
import { enforceRateLimit } from '@/lib/rate-limiter'
import { getUserIdFromRequest, checkCredits, deductCredits, completeTransaction, refundCredits } from '@/lib/credits'
import { verifyCsrf } from '@/lib/csrf-verify'

const TOOL_ID = 'ebook-maker-epub'

export async function POST(request) {
  // Rate limit
  const rl = await enforceRateLimit(request, 'content_generate')
  if (rl.limited) return rl.response

  // CSRF
  const csrf = verifyCsrf(request)
  if (!csrf.valid) {
    return NextResponse.json({ success: false, error: csrf.error || 'CSRF failed', code: 'CSRF_INVALID' }, { status: 403 })
  }

  // Auth
  const userId = await getUserIdFromRequest(request)
  if (!userId) {
    return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 })
  }

  let body
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON body' }, { status: 400 })
  }

  const { cover, introduction, chapters, conclusion, settings = {} } = body || {}
  if (!cover?.title || !Array.isArray(chapters) || chapters.length === 0) {
    return NextResponse.json({ success: false, error: 'cover.title and at least one chapter are required' }, { status: 400 })
  }

  // Credits (EPUB export is a lightweight repackaging — reuse ebook-maker cost tier)
  const bal = await checkCredits(userId, 'ebook-maker-epub')
  if (!bal.hasEnough) {
    return NextResponse.json({
      success: false,
      error: 'Insufficient credits',
      code: 'INSUFFICIENT_CREDITS',
      required: bal.cost,
      balance: bal.currentBalance,
    }, { status: 402 })
  }

  const ded = await deductCredits(userId, 'ebook-maker-epub', {})
  if (!ded.success) {
    if (ded.error === 'Insufficient credits') {
      return NextResponse.json({
        success: false,
        error: 'Insufficient credits',
        code: 'INSUFFICIENT_CREDITS',
        required: ded.required,
        balance: ded.available,
      }, { status: 402 })
    }
    return NextResponse.json({ success: false, error: ded.error || 'Could not deduct credits' }, { status: 500 })
  }

  try {
    const buffer = await buildEpub({
      cover,
      introduction,
      chapters,
      conclusion,
      language: settings.language || 'en',
    })

    await completeTransaction(ded.transactionId)

    const filename = safeFilename(cover.title) + '.epub'
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/epub+zip',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': String(buffer.length),
      },
    })
  } catch (e) {
    console.error('[ebook-maker/generate-epub] EPUB build failed:', e)
    await refundCredits(ded.transactionId, e?.message || 'EPUB build failed').catch(() => {})
    return NextResponse.json({ success: false, error: e?.message || 'EPUB generation failed' }, { status: 500 })
  }
}

function safeFilename(t = 'ebook') {
  return String(t)
    .replace(/[^\p{L}\p{N}\-_ ]+/gu, '')
    .replace(/\s+/g, '_')
    .slice(0, 80) || 'ebook'
}
