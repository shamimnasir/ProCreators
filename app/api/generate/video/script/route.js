import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

export async function POST(request) {
  try {
    const { topic, imageDescription, language } = await request.json()

    if (!topic && !imageDescription) {
      return NextResponse.json(
        { success: false, error: 'Please provide a topic or image description' },
        { status: 400 }
      )
    }

    // Use Emergent Universal Key for Claude
    const isEmergentKey = process.env.EMERGENT_LLM_KEY && process.env.EMERGENT_LLM_KEY.startsWith('sk-emergent')
    
    const client = new Anthropic({
      apiKey: process.env.EMERGENT_LLM_KEY || process.env.ANTHROPIC_API_KEY,
      baseURL: isEmergentKey ? 'https://api.emergentmethods.ai/anthropic/v1' : undefined,
    })

    const languageText = language === 'bengali' ? 'in Bengali language' : 'in English language'
    const input = imageDescription 
      ? `Image/Object Description: ${imageDescription}. Create a viral reel/short video script based on this.`
      : `Topic: ${topic}. Create a viral reel/short video script.`

    const prompt = `You are a viral video script writer specializing in TikTok, Instagram Reels, and YouTube Shorts.

CREATE A VIRAL REEL/SHORT SCRIPT ${languageText} following this structure:

**VIRAL HOOK FORMAT (First 3 seconds - CRITICAL):**
- Line 1: Shocking statement, question, or pattern interrupt (e.g., "Stop scrolling! This changed my life...")
- Line 2: Promise or intrigue (e.g., "Watch until the end for the secret")

**MAIN CONTENT (Next 12-22 seconds):**
- Quick value delivery
- 3-5 key points maximum
- Fast-paced, no fluff
- Use numbers and specific details
- Visual cues for each point

**CALL-TO-ACTION (Last 3-5 seconds):**
- Clear next step (Follow, Like, Share, Comment)
- Create FOMO or urgency

**VISUAL SUGGESTIONS:**
- Describe key visual elements for each scene
- Suggest transitions and effects
- Recommend text overlays

**DURATION:** 15-30 seconds total
**FORMAT:** Vertical 9:16 (1080x1920)

Input: ${input}

Generate a complete viral reel script with scene-by-scene breakdown including dialogue, visual descriptions, and text overlay suggestions.`

    const message = await client.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 2000,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    })

    const scriptContent = message.content[0].text

    return NextResponse.json({
      success: true,
      script: scriptContent,
      language
    })

  } catch (error) {
    console.error('Script generation error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to generate script' },
      { status: 500 }
    )
  }
}
