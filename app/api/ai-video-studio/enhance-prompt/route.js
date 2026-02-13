import { NextResponse } from 'next/server'
import { getUseCaseById } from '@/config/ai-video-usecases'

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
    
    let enhancedPrompt = prompt
    
    // Check if we have Emergent LLM key for prompt enhancement
    const emergentKey = process.env.EMERGENT_LLM_KEY
    
    // Detect if this is a command-style prompt that needs script generation
    const commandPatterns = /^(create|make|generate|write|produce|build|craft|design)\s+(a|an|the)?\s*(video|content|script|story|reel)?\s*(about|on|for|regarding|of)/i
    const isCommandPrompt = commandPatterns.test(prompt.trim())
    
    if (emergentKey && (isCommandPrompt || useCaseId === 'custom' || useCaseId !== 'make-anything')) {
      try {
        // Use Gemini for prompt enhancement / script generation
        const { GoogleGenerativeAI } = require('@google/generative-ai')
        const genAI = new GoogleGenerativeAI(emergentKey)
        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })
        
        let systemPrompt
        
        if (isCommandPrompt) {
          // Generate an actual script from the command prompt
          systemPrompt = `You are a professional video scriptwriter. The user gave you a command: "${prompt}"

Create a ${duration || 30}-second video script based on this topic. The script should:
1. Be engaging and suitable for voiceover narration
2. Have a clear beginning, middle, and end
3. Use vivid, descriptive language
4. Be approximately ${Math.round((duration || 30) * 2.5)} words (for natural speech pacing)
5. NOT include any instructions, meta-commentary, or "Create a video about..." - just the actual script content

Output ONLY the script text, nothing else. No titles, no formatting marks, just the spoken content.`
        } else if (useCase?.promptTemplate) {
          // Use existing use case template
          systemPrompt = useCase.promptTemplate
            .replace('{userPrompt}', prompt)
            .replace('{platform}', platform || 'instagram')
            .replace('{duration}', duration || 5)
            .replace('{format}', format || 'portrait')
        } else {
          // Generic enhancement
          systemPrompt = `Enhance this video prompt for better AI generation. Make it more descriptive and visual while keeping the core meaning: "${prompt}". Output only the enhanced prompt.`
        }
        
        const result = await model.generateContent(systemPrompt)
        const response = await result.response
        enhancedPrompt = response.text().trim()
        
        // Clean up any unwanted prefixes
        enhancedPrompt = enhancedPrompt.replace(/^(script:|here's the script:|video script:)/i, '').trim()
        
      } catch (aiError) {
        console.error('[Enhance Prompt] AI enhancement failed:', aiError.message)
        // Fall back to original prompt with basic enhancements
        enhancedPrompt = enhancePromptBasic(prompt, useCase, format)
      }
    } else {
      // Basic enhancement without AI
      enhancedPrompt = enhancePromptBasic(prompt, useCase, format)
    }

    return NextResponse.json({
      success: true,
      originalPrompt: prompt,
      enhancedPrompt,
      useCase: useCase.name,
      wasScriptGenerated: isCommandPrompt
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
