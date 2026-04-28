import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-middleware'
import { generateText } from '@/lib/gemini-text'
import { withCredits } from '@/lib/credits'
import { v4 as uuidv4 } from 'uuid'
import { jsonrepair } from 'jsonrepair'

// =====================================================
// UGC STUDIO — AD SCRIPT GENERATOR
// =====================================================
// POST: Generate a UGC-style ad script with hooks, emotion tags, and B-roll cues

const AD_FORMATS = {
  'hook-story-cta': {
    name: 'Hook → Story → CTA',
    structure: 'Start with attention-grabbing hook, tell a relatable story about the problem/solution, end with clear CTA',
    duration: '30-60s'
  },
  'problem-solution': {
    name: 'Problem → Solution',
    structure: 'Present the pain point vividly, introduce product as the solution, show transformation',
    duration: '30-45s'
  },
  'testimonial': {
    name: 'Testimonial Style',
    structure: 'First-person account: "I used to... then I found... now I..." authenticity-focused',
    duration: '30-45s'
  },
  'unboxing': {
    name: 'Unboxing / First Impression',
    structure: 'Excitement reveal, first reaction, feature walkthrough, verdict',
    duration: '45-60s'
  },
  'comparison': {
    name: 'Before vs After',
    structure: 'Show the "before" struggle, dramatic transition, show the "after" with product',
    duration: '30-45s'
  },
  'listicle': {
    name: '3 Reasons Why',
    structure: 'Hook with bold claim, three punchy reasons with visual proof each, CTA',
    duration: '30-60s'
  }
}

const TONE_OPTIONS = ['excited', 'casual', 'professional', 'funny', 'urgent', 'emotional', 'informative', 'luxury']

// Platform + format combos. Each entry pins an aspect ratio + recommended duration that
// flows through to talking-head, b-roll, and final-render so the output is properly sized
// for its destination platform.
const PLATFORM_OPTIONS = {
  'tiktok':              { platform: 'tiktok',    format: 'standard',  label: 'TikTok',                     aspectRatio: '9:16', minDuration: 15,  maxDuration: 60 },
  'instagram-reels':     { platform: 'instagram', format: 'reels',     label: 'Instagram Reels',            aspectRatio: '9:16', minDuration: 15,  maxDuration: 90 },
  'instagram-feed':      { platform: 'instagram', format: 'feed',      label: 'Instagram Feed (Square)',    aspectRatio: '1:1',  minDuration: 15,  maxDuration: 60 },
  'instagram-story':     { platform: 'instagram', format: 'story',     label: 'Instagram Story',            aspectRatio: '9:16', minDuration: 5,   maxDuration: 60 },
  'youtube-shorts':      { platform: 'youtube',   format: 'shorts',    label: 'YouTube Shorts',             aspectRatio: '9:16', minDuration: 15,  maxDuration: 60 },
  'youtube-long':        { platform: 'youtube',   format: 'long-form', label: 'YouTube Long-form',          aspectRatio: '16:9', minDuration: 30,  maxDuration: 180 },
  'facebook-reels':      { platform: 'facebook',  format: 'reels',     label: 'Facebook Reels',             aspectRatio: '9:16', minDuration: 15,  maxDuration: 60 },
  'facebook-feed':       { platform: 'facebook',  format: 'feed',      label: 'Facebook Feed (Square)',     aspectRatio: '1:1',  minDuration: 15,  maxDuration: 60 },
  'general':             { platform: 'general',   format: 'general',   label: 'General (Vertical)',         aspectRatio: '9:16', minDuration: 15,  maxDuration: 120 }
}

export async function POST(request) {
  const auth = await requireAuth(request)
  if (!auth.authenticated) {
    return auth.response
  }

  try {
    const body = await request.json()
    const {
      productName,
      productDescription,
      targetAudience = '',
      format = 'hook-story-cta',
      tone = 'casual',
      platform = 'tiktok',
      additionalNotes = '',
      duration = 30
    } = body

    if (!productName || !productDescription) {
      return NextResponse.json({ success: false, error: 'Product name and description are required' }, { status: 400 })
    }

    const adFormat = AD_FORMATS[format] || AD_FORMATS['hook-story-cta']
    const platformConfig = PLATFORM_OPTIONS[platform] || PLATFORM_OPTIONS['tiktok']
    const targetDuration = Math.max(15, Math.min(120, parseInt(duration)))

    // Use withCredits wrapper for automatic credit management
    const creditResult = await withCredits(request, 'ugc-script', async () => {
      const scriptPrompt = `You write raw, authentic UGC scripts that sound like a real person casually talking to their phone camera. NOT an ad. NOT polished. NOT influencer-style.

Create a ${targetDuration}-second raw UGC script for:

PRODUCT: ${productName}
DESCRIPTION: ${productDescription}
TARGET AUDIENCE: ${targetAudience || 'general consumers'}
AD FORMAT: ${adFormat.name} — ${adFormat.structure}
TONE: ${tone}
PLATFORM: ${platform}
${additionalNotes ? `ADDITIONAL NOTES: ${additionalNotes}` : ''}

CRITICAL RULES — THIS MUST FEEL LIKE A REAL PERSON, NOT AN AD:
1. Write in first person. Sound like someone talking to a friend, not a camera.
2. Start MID-THOUGHT. No polished intro. Examples: "Okay so I wasn't expecting this but…", "I randomly tried this and…", "Wait I need to tell you about this…"
3. Use filler words naturally: "um", "like", "you know", "honestly", "literally", "actually"
4. Include natural pauses — mark them as [pause] or [thinking]
5. Include emotion tags: [surprised], [genuine], [skeptical], [excited], [laughing], [whispering]
6. Include B-ROLL cues in curly braces for product shots: {showing product}, {hands holding product}, {product on table}
7. NEVER use marketing words: NO "best product", "buy now", "amazing deal", "game-changer", "must-have"
8. Instead use real-person language: "this actually surprised me", "I didn't think it would work", "okay wait look at this"
9. Slightly imperfect phrasing — don't over-polish the sentences
10. End with something soft, not a hard CTA: "just thought I'd share", "link in bio if you're curious", "anyway yeah"
11. DURATION RULE (VERY IMPORTANT): Casual speech = ~2.5 words per second. Calculate each segment's duration from its word count. 
    🚨 MINIMUM SEGMENT DURATION = 4 SECONDS (technical limit of video models). A segment with 6 words = 4 seconds (padded). A 12-word line = ~5 sec. A 20-word line = ~8 sec. A 30-word line = ~12 sec.
    NEVER produce a segment shorter than 4 seconds. If a thought is too short, merge it with adjacent text or pad with natural filler ("um", "you know", short pauses) to reach at least 4 seconds.
    The "duration" field MUST be ≥ 4 AND match the word count of "text".
12. For segments where the person mentions/shows the product, mark type as "broll" so we show the actual product
13. Total word count across ALL segments should add up to roughly ${targetDuration * 2.5} words (for a ${targetDuration}-second ad)

14. 🎬 OPENING VISUAL HOOK (SEGMENT 1) — VERY IMPORTANT FOR SCROLL-STOPPING:
    Segment 1's "brollCue" MUST describe a strong physical/camera transition that creates visual movement and stops the scroll. Pick ONE of these patterns (or invent a similar one) — NEVER a static head-on shot:
    - "Camera shake / quick whip-pan onto the speaker, who suddenly leans into frame"
    - "Speaker walks into frame holding the camera in their hand, then sits down on a chair / couch"
    - "POV: speaker drops onto a chair from standing, camera tilts down with them"
    - "Speaker is mid-action (sipping coffee / closing laptop / putting phone down), then suddenly turns to camera"
    - "Camera moves from a wide shot zooming in fast onto the speaker's face"
    - "Speaker picks the phone up off a table, raises it to their face, starts talking immediately"
    - "Quick handheld walking shot, then speaker stops, leans against a wall, starts talking"
    Also fill segment 1's "cameraNote" with the matching technical cue (e.g. "whip-pan handheld", "POV sit-down", "fast-zoom selfie"). This intro hook is the SINGLE most important moment of the ad — make it kinetic and surprising.

Return ONLY a JSON object with this structure:
{
  "title": "Short ad title",
  "hook": "The opening mid-thought line",
  "totalDuration": ${targetDuration},
  "segments": [
    {
      "id": 1,
      "type": "talking" | "broll",
      "duration": 6,
      "wordCount": 15,
      "emotion": "genuine",
      "text": "The spoken line with natural filler words",
      "brollCue": "What should be shown visually — for talking segments describe gesture/action like 'leaning in close to camera' or 'looking down at product then back up'. For broll segments describe the product shot.",
      "cameraNote": "selfie-angle / looking-at-phone / product-focus / POV"
    }
  ],
  "cta": "Soft, non-salesy closing line",
  "hashtags": ["#tag1", "#tag2"]
}`

      const result = await generateText(
        scriptPrompt,
        'You write raw authentic UGC scripts. You sound like a real person, not a copywriter. Imperfect, honest, relatable. Always respond with a single valid JSON object — no markdown, no commentary.',
        null,
        { responseMimeType: 'application/json', maxOutputTokens: 8192, temperature: 0.85 }
      )

      // Surface Gemini failures properly instead of silently parsing nothing
      if (result && result.success === false) {
        console.error('[ugc-script] Gemini call failed:', result.error)
        throw new Error(result.error || 'AI service unavailable. Please try again in a moment.')
      }

      let script = null
      const rawContent = typeof result === 'string' ? result : (result.content || result.text || '')

      // Helper: try to extract & parse a JSON object from arbitrary AI output.
      // Strategy: 1) raw parse → 2) strip markdown fences → 3) extract {...} → 4) jsonrepair fallback
      const tryParseScript = (raw) => {
        if (!raw) return null
        // Step 1: cleaned (strip markdown code fences)
        let cleaned = raw
          .replace(/```json\s*/gi, '')
          .replace(/```\s*$/g, '')
          .replace(/^```/g, '')
          .trim()

        // Step 2: extract first {...} object (greedy to closing brace)
        const jsonMatch = cleaned.match(/\{[\s\S]*\}/)
        const candidate = jsonMatch ? jsonMatch[0] : cleaned

        // Step 3: try strict parse
        try {
          return JSON.parse(candidate)
        } catch (_) { /* fall through */ }

        // Step 4: try jsonrepair (fixes unescaped quotes, trailing commas, missing commas, etc.)
        try {
          const repaired = jsonrepair(candidate)
          return JSON.parse(repaired)
        } catch (repairErr) {
          console.error('[ugc-script] jsonrepair also failed:', repairErr?.message)
          return null
        }
      }

      script = tryParseScript(rawContent)

      if (!script) {
        console.error('[ugc-script] Could not parse any valid JSON from AI response. Raw content (first 800 chars):', rawContent.slice(0, 800))
        throw new Error('AI returned malformed script. Please try again.')
      }

      if (!script.segments || !Array.isArray(script.segments) || script.segments.length === 0) {
        console.error('[ugc-script] Parsed script has no segments. Parsed keys:', Object.keys(script))
        console.error('[ugc-script] Raw content (first 500 chars):', rawContent.slice(0, 500))
        throw new Error('AI service did not return a valid script structure. Please try again.')
      }

      // Calculate accurate durations from word count (~2.5 words/sec for casual speech)
      // ENFORCE MINIMUM 4 SECONDS per segment (technical limit of Seedance/Kling video models)
      let runningTotal = 0
      script.segments = script.segments.map((seg, idx) => {
        const words = (seg.text || '').replace(/\[.*?\]/g, '').replace(/\{.*?\}/g, '').trim().split(/\s+/).length
        const calculatedDuration = Math.max(4, Math.round(words / 2.5))
        runningTotal += calculatedDuration
        return {
          ...seg,
          id: idx + 1,
          uuid: uuidv4(),
          wordCount: words,
          duration: calculatedDuration
        }
      })
      script.totalDuration = runningTotal

      return {
        ...script,
        id: uuidv4(),
        format: adFormat.name,
        tone,
        platform,
        platformConfig: platformConfig,
        aspectRatio: platformConfig.aspectRatio,
        productName,
        generatedAt: new Date().toISOString()
      }
    })

    if (!creditResult.success) {
      return creditResult.response
    }

    return NextResponse.json({
      success: true,
      script: creditResult.result,
      creditsUsed: creditResult.creditsUsed,
      remainingCredits: creditResult.remainingCredits,
      formats: AD_FORMATS,
      tones: TONE_OPTIONS,
      platforms: PLATFORM_OPTIONS
    })

  } catch (error) {
    console.error('Script generation error:', error)
    return NextResponse.json({ success: false, error: error.message || 'Failed to generate script' }, { status: 500 })
  }
}

// GET: Return available formats, tones, platforms
export async function GET() {
  return NextResponse.json({
    success: true,
    formats: AD_FORMATS,
    tones: TONE_OPTIONS,
    platforms: PLATFORM_OPTIONS
  })
}
