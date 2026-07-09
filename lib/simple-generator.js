// Shared LLM helper for Sprint 2 tools. Wraps Google GenAI (Gemini) with
// credit deduction, refund on failure, and consistent JSON handling.
import { GoogleGenerativeAI } from '@google/generative-ai'
import { getUserIdFromRequest, checkCredits, deductCredits, completeTransaction, refundCredits } from '@/lib/credits'
import { NextResponse } from 'next/server'
import { verifyCsrf } from '@/lib/csrf-verify'

const genAI = new GoogleGenerativeAI(process.env.EMERGENT_LLM_KEY || process.env.GEMINI_API_KEY)

/**
 * Run a text generation for a Sprint-2 tool.
 * @param {Request} request
 * @param {Object} opts
 * @param {string} opts.toolId
 * @param {string} opts.systemPrompt
 * @param {string} opts.userPrompt
 * @param {number} opts.creditCost
 * @param {(text:string, body:object)=>Object} [opts.postProcess]  Return `{ content, ...extra }`
 */
export async function runSimpleGeneration(request, opts) {
  const { toolId, systemPrompt, userPrompt, creditCost, postProcess } = opts

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

  // Credits check — uses toolId (not raw cost) so credits.js can apply per-tool pricing
  const bal = await checkCredits(userId, toolId)
  if (!bal.hasEnough) {
    return NextResponse.json({
      success: false,
      error: 'Insufficient credits',
      code: 'INSUFFICIENT_CREDITS',
      required: bal.cost ?? creditCost,
      balance: bal.currentBalance ?? 0,
    }, { status: 402 })
  }

  let body
  try { body = await request.json() } catch { body = {} }

  // Deduct upfront
  const ded = await deductCredits(userId, toolId, {})
  if (!ded.success) {
    // If backend reports insufficient credits at deduct time (race), still return 402
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
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash-exp',
      systemInstruction: systemPrompt,
    })
    const gen = await model.generateContent(userPrompt)
    const text = gen.response.text()
    const extra = postProcess ? postProcess(text, body) : { content: text }
    await completeTransaction(ded.transactionId)
    return NextResponse.json({ success: true, toolId, ...extra })
  } catch (e) {
    await refundCredits(ded.transactionId, e?.message || 'Generation failed').catch(() => {})
    return NextResponse.json({ success: false, error: e?.message || 'Generation failed' }, { status: 500 })
  }
}
