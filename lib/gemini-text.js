import { v4 as uuidv4 } from 'uuid'
import { GoogleGenerativeAI } from '@google/generative-ai'

// Cached client (created once per process)
let genAI = null

function getClient() {
  if (genAI) return genAI
  const key = process.env.GOOGLE_API_KEY || process.env.EMERGENT_LLM_KEY
  if (!key) {
    throw new Error('GOOGLE_API_KEY or EMERGENT_LLM_KEY not configured')
  }
  genAI = new GoogleGenerativeAI(key)
  return genAI
}

/**
 * Generate text via Gemini directly through the Google GenAI SDK.
 *
 * Returns the same shape as the previous Python-subprocess version:
 *   { success, content, sessionId, error }
 *
 * Includes automatic model fallback if the primary model is rate-limited.
 *
 * This is a drop-in replacement for the prior implementation but eliminates:
 *   - Python subprocess spawn overhead
 *   - LiteLLM ANSI color/info output that polluted stdout JSON
 *   - Emergent LLM Key shared rate limits (uses dedicated GOOGLE_API_KEY when present)
 */
export async function generateText(
  prompt,
  systemMessage = 'You are a helpful AI assistant specialized in creating engaging content.',
  sessionId = null,
  options = {}
) {
  const chatSessionId = sessionId || uuidv4()

  // Model fallback chain — first one is primary, rest are tried if rate-limited
  const requestedModel = options.model
  const modelChain = requestedModel
    ? [requestedModel, 'gemini-2.5-flash', 'gemini-flash-latest']
    : ['gemini-2.5-flash', 'gemini-flash-latest']
  // Deduplicate while preserving order
  const tries = [...new Set(modelChain)]

  let lastError = null

  for (const modelName of tries) {
    try {
      const client = getClient()
      const generationConfig = {
        temperature: options.temperature ?? 0.9,
        maxOutputTokens: options.maxOutputTokens ?? 8192
      }
      // If caller wants JSON output, switch Gemini to JSON mode (no code-fence wrapping)
      if (options.responseMimeType) {
        generationConfig.responseMimeType = options.responseMimeType
      }

      const model = client.getGenerativeModel({
        model: modelName,
        systemInstruction: systemMessage,
        generationConfig
      })

      const result = await model.generateContent(prompt)
      const text = result?.response?.text?.() || ''

      if (!text) {
        lastError = `Empty response from ${modelName}`
        continue
      }

      return {
        success: true,
        content: text,
        sessionId: chatSessionId,
        model: modelName,
        error: null
      }
    } catch (error) {
      const msg = error?.message || String(error)
      lastError = msg
      console.error(`[generateText] ${modelName} error:`, msg.slice(0, 200))

      // Retry next model only on rate-limit / quota / overload errors
      const isRetryable =
        msg.includes('429') ||
        msg.toLowerCase().includes('rate') ||
        msg.toLowerCase().includes('quota') ||
        msg.toLowerCase().includes('exhausted') ||
        msg.toLowerCase().includes('overload')

      if (!isRetryable) {
        // Non-retryable (404, auth, etc.) — try next anyway in case model name was bad
        if (msg.includes('404') || msg.includes('not found')) continue
        break
      }
    }
  }

  return {
    success: false,
    content: null,
    sessionId: chatSessionId,
    error: lastError || 'Failed to generate text'
  }
}
