import { NextResponse } from 'next/server'
import { generateText } from '@/lib/gemini-text'

export async function POST(request) {
  try {
    const { topic, imageDescription, language } = await request.json()

    if (!topic && !imageDescription) {
      return NextResponse.json(
        { success: false, error: 'Please provide a topic or image description' },
        { status: 400 }
      )
    }

    const languageText = language === 'bengali' ? 'in Bengali language' : 'in English language'
    
    const systemMessage = `You are a viral video script writer specializing in TikTok, Instagram Reels, and YouTube Shorts.

CRITICAL INSTRUCTION: You MUST create a script about the EXACT topic provided by the user. DO NOT create content about any other topic.

Language: ${languageText}

CREATE A VIRAL REEL/SHORT SCRIPT following this structure:

**VIRAL HOOK FORMAT (First 3 seconds - CRITICAL):**
- Line 1: Shocking statement, question, or pattern interrupt (e.g., "Stop scrolling! This changed my life...")
- Line 2: Promise or intrigue (e.g., "Watch until the end for the secret")

**MAIN CONTENT (Next 12-22 seconds):**
- Quick value delivery about the EXACT topic provided
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

Generate a complete viral reel script with scene-by-scene breakdown including dialogue, visual descriptions, and text overlay suggestions.`

    const userPrompt = imageDescription 
      ? `Create a viral reel/short video script about this image/object: ${imageDescription}. Stay strictly on this topic. Do not deviate to other topics.`
      : `Create a viral reel/short video script about this EXACT topic: "${topic}". 

IMPORTANT: The script MUST be about "${topic}" and NOTHING ELSE. Do not create content about any other subject. Stay 100% focused on: ${topic}`

    const result = await generateText(userPrompt, systemMessage)

    if (result.success) {
      return NextResponse.json({
        success: true,
        script: result.content,
        language
      })
    } else {
      throw new Error(result.error || 'Failed to generate script')
    }

  } catch (error) {
    console.error('Script generation error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to generate script' },
      { status: 500 }
    )
  }
}
