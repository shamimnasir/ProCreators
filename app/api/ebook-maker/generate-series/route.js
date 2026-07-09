// Sprint 3 — Ebook Maker: Series Generator
// POST /api/ebook-maker/generate-series
// Body: { seedTopic, audience, tone, seriesSize?, genre? }
// Returns: { success, series: [{ position, title, subtitle, hook, outline: string[] }] }
// Purpose: given ONE seed book idea, spits out a 3-7 book series plan with a
// unified brand promise so the seller can build a KDP / Etsy franchise.
import { NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { enforceRateLimit } from '@/lib/rate-limiter'
import { getUserIdFromRequest, checkCredits, deductCredits, completeTransaction, refundCredits } from '@/lib/credits'
import { verifyCsrf } from '@/lib/csrf-verify'

const TOOL_ID = 'ebook-series'
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY || process.env.EMERGENT_LLM_KEY)

export async function POST(request) {
  const rl = await enforceRateLimit(request, 'content_generate')
  if (rl.limited) return rl.response

  const csrf = verifyCsrf(request)
  if (!csrf.valid) {
    return NextResponse.json({ success: false, error: csrf.error || 'CSRF failed', code: 'CSRF_INVALID' }, { status: 403 })
  }

  const userId = await getUserIdFromRequest(request)
  if (!userId) {
    return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 })
  }

  let body
  try { body = await request.json() } catch { body = {} }
  const seedTopic = (body.seedTopic || body.topic || '').toString().trim()
  const audience = body.audience || 'general readers'
  const tone = body.tone || 'informative'
  const genre = body.genre || 'non-fiction'
  const rawSize = Number(body.seriesSize)
  const seriesSize = Number.isFinite(rawSize) ? Math.min(7, Math.max(3, Math.round(rawSize))) : 5

  if (!seedTopic || seedTopic.length < 3) {
    return NextResponse.json({ success: false, error: 'seedTopic is required' }, { status: 400 })
  }

  // Credits
  const bal = await checkCredits(userId, TOOL_ID)
  if (!bal.hasEnough) {
    return NextResponse.json({
      success: false, error: 'Insufficient credits', code: 'INSUFFICIENT_CREDITS',
      required: bal.cost, balance: bal.currentBalance,
    }, { status: 402 })
  }

  const ded = await deductCredits(userId, TOOL_ID, {})
  if (!ded.success) {
    if (ded.error === 'Insufficient credits') {
      return NextResponse.json({
        success: false, error: 'Insufficient credits', code: 'INSUFFICIENT_CREDITS',
        required: ded.required, balance: ded.available,
      }, { status: 402 })
    }
    return NextResponse.json({ success: false, error: ded.error || 'Could not deduct credits' }, { status: 500 })
  }

  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-flash-latest',
      systemInstruction: `You are a bestselling KDP series strategist. Given a seed book idea, you design a coherent ${seriesSize}-book series that reuses cover branding, hooks the same buyer avatar, and progresses in difficulty / life stage / topic depth so buyers naturally want the whole set. Titles must feel like siblings, not clones. Return valid JSON only.`,
    })

    const prompt = `Design a ${seriesSize}-book series based on this seed:
Seed book idea: ${seedTopic}
Audience: ${audience}
Tone: ${tone}
Genre: ${genre}

Design principles:
- The series should share ONE clear brand promise (buyer transformation).
- Each book stands on its own AND progresses the promise (e.g. beginner → intermediate → mastery, or morning → afternoon → evening, or foundations → skill → advanced tactics).
- Titles should share a naming pattern (subtitle can vary) so bundle-marketing works.
- Each book gets a 6-8 chapter outline.

Output ONLY valid JSON with this exact shape:
{
  "seriesBrand": {
    "seriesName": "Family / imprint name shoppers will see across covers",
    "buyerAvatar": "One-sentence description of who buys the whole set",
    "brandPromise": "One-sentence transformation this series delivers",
    "coverConcept": "Short cover-design consistency note (color, typography, motif)"
  },
  "books": [
    {
      "position": 1,
      "title": "Book title following the series pattern",
      "subtitle": "Short benefit subtitle",
      "hook": "One-line back-cover hook (Amazon A9 friendly)",
      "chapters": ["Chapter 1 — ...", "Chapter 2 — ...", "Chapter 3 — ...", "Chapter 4 — ...", "Chapter 5 — ...", "Chapter 6 — ..."]
    }
  ]
}

Return EXACTLY ${seriesSize} books in the "books" array.`

    const gen = await model.generateContent(prompt)
    let text = gen.response.text().trim()
    text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()

    let parsed
    try {
      parsed = JSON.parse(text)
    } catch {
      // Attempt to extract the JSON object substring
      const match = text.match(/\{[\s\S]*\}/)
      parsed = match ? JSON.parse(match[0]) : null
    }
    if (!parsed || !Array.isArray(parsed.books)) {
      throw new Error('Series generator returned an invalid JSON payload')
    }

    await completeTransaction(ded.transactionId)

    return NextResponse.json({
      success: true,
      toolId: TOOL_ID,
      seedTopic,
      seriesBrand: parsed.seriesBrand || null,
      books: parsed.books,
    })
  } catch (e) {
    console.error('[ebook-maker/generate-series] failed:', e)
    await refundCredits(ded.transactionId, e?.message || 'Series generation failed').catch(() => {})
    return NextResponse.json({ success: false, error: e?.message || 'Series generation failed' }, { status: 500 })
  }
}
