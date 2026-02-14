import { NextResponse } from 'next/server'
import { getUseCaseById } from '@/config/ai-video-usecases'
import { generateText } from '@/lib/gemini-text'

export async function POST(request) {
  try {
    const { prompt, useCaseId, platform, duration, format, language } = await request.json()

    if (!prompt) {
      return NextResponse.json(
        { success: false, error: 'Prompt is required' },
        { status: 400 }
      )
    }

    const useCase = getUseCaseById(useCaseId) || { id: useCaseId, name: 'Custom' }
    const targetDuration = duration || 30
    const wordCount = Math.floor(targetDuration * 2.5) // ~2.5 words per second for natural speech
    const languageName = language === 'bn' ? 'Bengali' : 'English'
    
    let enhancedPrompt = prompt
    
    // Detect specific content types from the prompt
    const isTopList = /top\s*\d+|list\s*of\s*\d+|\d+\s*tips|\d+\s*ways|\d+\s*reasons|\d+\s*facts|\d+\s*secrets/i.test(prompt)
    const isCommandPrompt = /^(create|make|generate|write|produce|build|craft|design)\s+(a|an|the)?\s*(video|content|script|story|reel)?\s*(about|on|for|regarding|of)/i.test(prompt.trim())
    const isTutorial = /how\s*to|tutorial|guide|learn|step\s*by\s*step/i.test(prompt)
    const isExplainer = /explain|what\s*is|why|how\s*does|understand/i.test(prompt)
    const isMotivational = /motivat|inspir|success|discipline|growth|mindset|achieve/i.test(prompt)
    
    console.log('[enhance-prompt] Content type detection:', { isTopList, isCommandPrompt, isTutorial, isExplainer, isMotivational })
    
    // Build the appropriate system prompt based on content type
    let systemPrompt = ''
    
    if (isTopList) {
      // Extract the number from the prompt
      const numMatch = prompt.match(/\d+/)
      const listCount = numMatch ? parseInt(numMatch[0]) : 5
      
      systemPrompt = `You are a professional scriptwriter for viral short videos. The user wants: "${prompt}"

CREATE A ${listCount}-ITEM LIST VIDEO SCRIPT.

REQUIREMENTS:
1. Write EXACTLY ${listCount} tips/items/points
2. Each point should be concise but impactful (1-2 sentences each)
3. Number each point clearly (1., 2., 3., etc.)
4. Total length: approximately ${wordCount} words
5. Language: ${languageName} ONLY
6. Include a brief intro hook (1 sentence)
7. Include a brief conclusion/call-to-action (1 sentence)

STRUCTURE:
- Hook: Grab attention immediately
- Points 1-${listCount}: Each numbered clearly with the tip and brief explanation
- Conclusion: Quick summary or call-to-action

CRITICAL OUTPUT RULES:
- Output ONLY the narration script
- NO stage directions like (CAMERA), (SOUND), (MUSIC)
- NO timestamps or timing information
- NO meta-text like "Here's the script" or "Script:"
- Just pure spoken content that will be read aloud

Write the script now:`
    } else if (isTutorial) {
      systemPrompt = `You are a professional scriptwriter for tutorial videos. The user wants: "${prompt}"

CREATE A STEP-BY-STEP TUTORIAL SCRIPT.

REQUIREMENTS:
1. Clear, easy-to-follow instructions
2. Break down into logical steps
3. Total length: approximately ${wordCount} words
4. Language: ${languageName} ONLY
5. Include intro explaining what viewers will learn
6. Include conclusion with key takeaways

CRITICAL OUTPUT RULES:
- Output ONLY the narration script
- NO stage directions like (CAMERA), (SOUND), (MUSIC)
- NO timestamps or timing information
- Just pure spoken content

Write the script now:`
    } else if (isExplainer) {
      systemPrompt = `You are a professional scriptwriter for explainer videos. The user wants: "${prompt}"

CREATE AN EDUCATIONAL EXPLAINER SCRIPT.

REQUIREMENTS:
1. Clear, simple explanations
2. Use analogies when helpful
3. Total length: approximately ${wordCount} words
4. Language: ${languageName} ONLY
5. Hook viewers with an interesting question or fact
6. Build understanding progressively
7. End with a memorable takeaway

CRITICAL OUTPUT RULES:
- Output ONLY the narration script
- NO stage directions
- NO timestamps
- Just pure spoken content

Write the script now:`
    } else if (isMotivational) {
      systemPrompt = `You are a professional scriptwriter for motivational videos. The user wants: "${prompt}"

CREATE AN INSPIRING MOTIVATIONAL SCRIPT.

REQUIREMENTS:
1. Powerful, emotionally engaging content
2. Include a personal story or example
3. Total length: approximately ${wordCount} words
4. Language: ${languageName} ONLY
5. Strong opening hook
6. Build emotional momentum
7. End with inspiring call-to-action

CRITICAL OUTPUT RULES:
- Output ONLY the narration script
- NO stage directions
- NO timestamps
- Just pure spoken content

Write the script now:`
    } else if (isCommandPrompt) {
      // Generic command - extract the topic
      const topicMatch = prompt.match(/(?:about|on|for|regarding|of)\s+(.+)/i)
      const topic = topicMatch ? topicMatch[1] : prompt
      
      systemPrompt = `You are a professional scriptwriter for short videos. The user wants: "${prompt}"

CREATE AN ENGAGING VIDEO SCRIPT about: ${topic}

REQUIREMENTS:
1. Compelling narrative structure
2. Total length: approximately ${wordCount} words
3. Language: ${languageName} ONLY
4. Strong hook in first 3 seconds
5. Clear message throughout
6. Memorable ending

CRITICAL OUTPUT RULES:
- Output ONLY the narration script
- NO stage directions like (CAMERA), (SOUND), (MUSIC)
- NO timestamps or timing information
- NO meta-text
- Just pure spoken content that will be read aloud

Write the script now:`
    } else {
      // Not a command, treat as direct content/script
      systemPrompt = `You are a professional script editor. The user provided this content: "${prompt}"

ENHANCE this content into a polished video script.

REQUIREMENTS:
1. Keep the core message intact
2. Improve flow and engagement
3. Total length: approximately ${wordCount} words
4. Language: ${languageName} ONLY
5. Make it suitable for voiceover narration

CRITICAL OUTPUT RULES:
- Output ONLY the enhanced narration script
- NO stage directions
- NO timestamps
- Just pure spoken content

Write the enhanced script now:`
    }
    
    // Generate script using Gemini
    try {
      console.log('[enhance-prompt] Generating script with AI...')
      const result = await generateText(prompt, systemPrompt)
      
      if (result.success && result.content) {
        enhancedPrompt = result.content
        
        // Clean up the script
        enhancedPrompt = enhancedPrompt
          // Remove common unwanted prefixes
          .replace(/^(script:|here's the script:|video script:|here is|okay|sure|certainly)[\s:,]*/i, '')
          // Remove stage directions
          .replace(/\([^)]*(?:SOUND|CAMERA|CUT|FADE|MUSIC|SFX|SHOT)[^)]*\)/gi, '')
          // Remove asterisk-wrapped directions
          .replace(/\*[^*]+\*/g, '')
          // Clean up extra whitespace
          .replace(/\n{3,}/g, '\n\n')
          .replace(/  +/g, ' ')
          .trim()
        
        console.log('[enhance-prompt] Script generated successfully, length:', enhancedPrompt.length)
      } else {
        console.error('[enhance-prompt] AI generation failed:', result.error)
        enhancedPrompt = enhancePromptBasic(prompt, useCase, format)
      }
    } catch (aiError) {
      console.error('[enhance-prompt] AI error:', aiError.message)
      enhancedPrompt = enhancePromptBasic(prompt, useCase, format)
    }

    return NextResponse.json({
      success: true,
      originalPrompt: prompt,
      enhancedPrompt,
      useCase: useCase.name,
      wasScriptGenerated: isCommandPrompt || isTopList || isTutorial || isExplainer || isMotivational,
      contentType: isTopList ? 'top-list' : isTutorial ? 'tutorial' : isExplainer ? 'explainer' : isMotivational ? 'motivational' : 'general'
    })

  } catch (error) {
    console.error('Prompt enhancement error:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

// Basic prompt enhancement without AI
function enhancePromptBasic(prompt, useCase, format) {
  const formatSuffix = format === 'landscape' 
    ? ', cinematic 16:9 aspect ratio, professional lighting'
    : ', vertical 9:16 format, social media optimized'
  
  const useCasePrefixes = {
    'make-anything': '',
    'social-media-ads': 'Eye-catching viral ad video: ',
    'product-showcase': 'Professional product showcase: ',
    'cinematic-broll': 'Cinematic b-roll footage: '
  }
  
  const prefix = useCasePrefixes[useCase?.id] || ''
  
  return `${prefix}${prompt}${formatSuffix}, smooth motion, high quality`
}
