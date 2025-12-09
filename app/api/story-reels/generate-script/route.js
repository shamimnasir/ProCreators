import { NextResponse } from 'next/server'
import { generateText } from '@/lib/gemini-text'
import { getNicheBySlug } from '@/config/quick-reels-niches'

export async function POST(request) {
  try {
    const { duration, language, niche, customTopic } = await request.json()
    
    console.log('=== SCRIPT GENERATION DEBUG ===')
    console.log('Received niche:', niche)
    console.log('Received language:', language)
    console.log('Received duration:', duration)
    console.log('Received customTopic:', customTopic)

    if (!duration || duration < 10 || duration > 60) {
      return NextResponse.json(
        { success: false, error: 'Duration must be between 10 and 60 seconds' },
        { status: 400 }
      )
    }

    const languageText = language === 'bn' ? 'in Bengali language' : 'in English language'
    const languageName = language === 'bn' ? 'Bengali' : 'English'

    // Get niche-specific prompt template or use default
    let nichePrompt = ''
    if (niche && niche !== 'story-reels') {
      const nicheConfig = getNicheBySlug(niche)
      if (nicheConfig) {
        nichePrompt = nicheConfig.promptTemplate
      }
    }

    // Default system message for original story-reels (backward compatibility)
    const defaultSystemMessage = `You are a professional viral story writer for TikTok, Instagram Reels, and YouTube Shorts.

CRITICAL INSTRUCTIONS:
1. Write ${languageText}
2. Create a compelling ${duration}-second story
3. Story types: moral stories, twist endings, emotional moments, life lessons, folklore
4. Structure: HOOK (first 3 seconds) → MAIN STORY (${duration - 8} seconds) → TWIST/ENDING (last 5 seconds)
5. Use simple, conversational language perfect for narration
6. Include vivid visual descriptions to help with video selection
7. Make it emotionally engaging and shareable

OUTPUT FORMAT:
Return ONLY the story script text, nothing else. No titles, no labels, just the narration text.

The script should be exactly ${duration} seconds when read at normal speaking pace (approximately ${Math.floor(duration * 2.5)} words).`

    // Use niche-specific prompt or default
    const systemMessage = nichePrompt || defaultSystemMessage

    let userPrompt = ''
    
    // For generic niche, use custom topic from user
    if (niche === 'generic' && customTopic) {
      userPrompt = `Create a ${duration}-second video script ${languageText} about: ${customTopic}

Requirements:
- Language: ${languageName}
- Duration: ${duration} seconds
- Topic: ${customTopic}
- Engaging hook in first 3 seconds
- Clear narrative arc
- Perfect for vertical video (9:16)
- Suitable for voiceover narration

Generate the complete script now.`
    } else {
      userPrompt = `Create a viral ${duration}-second script ${languageText}.

Requirements:
- Language: ${languageName}
- Duration: ${duration} seconds
- Engaging hook in first 3 seconds
- Clear narrative arc
- Perfect for vertical video (9:16)
- Suitable for voiceover narration

Generate the complete script now.`
    }

    const result = await generateText(userPrompt, systemMessage)

    if (result.success) {
      return NextResponse.json({
        success: true,
        script: result.content,
        language,
        duration,
        niche: niche || 'story-reels'
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
