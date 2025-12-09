import { NextResponse } from 'next/server'
import { generateText } from '@/lib/gemini-text'
import { getNicheBySlug } from '@/config/quick-reels-niches'
import { connectDB } from '@/lib/db'

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
      // First, check for custom admin-defined prompt
      try {
        const { connectDB } = await import('@/lib/db')
        const db = await connectDB()
        const promptsCollection = db.collection('custom_prompts')
        const customPrompt = await promptsCollection.findOne({ nicheSlug: niche })
        
        if (customPrompt && customPrompt.prompt) {
          nichePrompt = customPrompt.prompt
          console.log('✅ Using CUSTOM admin prompt for niche:', niche)
          console.log('Prompt template length:', nichePrompt.length)
        } else {
          // Fall back to default prompt from config
          const nicheConfig = getNicheBySlug(niche)
          console.log('Niche config found:', nicheConfig ? 'YES' : 'NO')
          if (nicheConfig) {
            console.log('Using DEFAULT prompt template for niche:', nicheConfig.name)
            nichePrompt = nicheConfig.promptTemplate
            console.log('Prompt template length:', nichePrompt.length)
          } else {
            console.log('⚠️ WARNING: No niche config found for slug:', niche)
          }
        }
      } catch (dbError) {
        console.log('Could not check custom prompts, using default:', dbError.message)
        // Fall back to default prompt from config
        const nicheConfig = getNicheBySlug(niche)
        if (nicheConfig) {
          nichePrompt = nicheConfig.promptTemplate
        }
      }
    } else {
      console.log('Using default Story Reels prompt (niche:', niche, ')')
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
    
    console.log('=== FINAL PROMPT BEING USED ===')
    console.log('System message (first 200 chars):', systemMessage.substring(0, 200))
    console.log('Using niche prompt:', nichePrompt ? 'YES' : 'NO (using default)')

    let userPrompt = ''
    
    // Build niche-specific user prompt
    const nicheInstructions = {
      'mini-stories': 'a compelling story with moral, emotional twist, or folklore element',
      'motivational': 'motivational content focused on discipline, growth, success, or resilience',
      'facts-explainer': 'educational facts or science explainer content',
      'comedy': 'comedy or relatable humor content',
      'kids-stories': 'a playful moral story for children',
      'kids-learning': 'educational learning content (ABC, 123, colors, shapes)',
      'business-promo': customTopic ? `a promotional script for the business/product/service named: ${customTopic}. You MUST use this exact name in the script` : 'a promotional script for a business or service',
      'horror': 'an atmospheric horror micro-story',
      'relationship': 'relationship advice or emotional guidance',
      'documentary': 'a historical or factual documentary-style script',
      'festival': 'festive celebration content',
      'generic': customTopic ? `content about: ${customTopic}` : 'a script'
    }
    
    const nicheInstruction = nicheInstructions[niche] || 'a compelling script'
    
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
      userPrompt = `Create ${nicheInstruction} for a ${duration}-second video ${languageText}.

Requirements:
- Language: ${languageName}
- Duration: ${duration} seconds
- Content Type: ${nicheInstruction}
- Engaging hook in first 3 seconds
- Clear and focused messaging
- Perfect for vertical video (9:16)
- Suitable for voiceover narration

Generate the complete script now. Write ONLY the script content, no meta-commentary.`
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
