import { NextResponse } from 'next/server'
import { getUseCaseById } from '@/config/ai-video-usecases'

export async function POST(request) {
  try {
    const { prompt, useCaseId, platform, duration, format } = await request.json()

    if (!prompt) {
      return NextResponse.json(
        { success: false, error: 'Prompt is required' },
        { status: 400 }
      )
    }

    const useCase = getUseCaseById(useCaseId)
    
    // For 'make-anything', enhance minimally to preserve user intent
    // For specific use cases, apply the full system prompt
    
    let enhancedPrompt = prompt
    
    // Check if we have Emergent LLM key for prompt enhancement
    const emergentKey = process.env.EMERGENT_LLM_KEY
    
    if (emergentKey && useCaseId !== 'make-anything') {
      try {
        // Use Gemini for prompt enhancement
        const { GoogleGenerativeAI } = require('@google/generative-ai')
        const genAI = new GoogleGenerativeAI(emergentKey)
        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })
        
        // Build the enhancement prompt
        const systemPrompt = useCase.promptTemplate
          .replace('{userPrompt}', prompt)
          .replace('{platform}', platform || 'instagram')
          .replace('{duration}', duration || 5)
          .replace('{format}', format || 'portrait')
        
        const result = await model.generateContent(systemPrompt)
        const response = await result.response
        enhancedPrompt = response.text().trim()
        
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
      useCase: useCase.name
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
  
  const prefix = useCasePrefixes[useCase.id] || ''
  
  return `${prefix}${prompt}${formatSuffix}, smooth motion, high quality`
}
