import { NextResponse } from 'next/server'
import { generateImage } from '@/lib/gemini-image'
import { trackImageGeneration } from '@/lib/ai-tracking'
import { enforceRateLimit } from '@/lib/rate-limiter'

export async function POST(request) {
  try {
    // SECURITY: Rate limiting for image generation
    const rateLimitCheck = await enforceRateLimit(request, 'content_generate')
    if (rateLimitCheck.limited) {
      return rateLimitCheck.response
    }
    
    const { prompt, userId, transactionId, creditsCharged, toolId } = await request.json()
    
    if (!prompt) {
      return NextResponse.json(
        { success: false, error: 'Prompt is required' },
        { status: 400 }
      )
    }

    const result = await generateImage(prompt)
    
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      )
    }
    
    // Track API cost if we have tracking info
    if (userId && transactionId && creditsCharged) {
      try {
        await trackImageGeneration({
          toolId: toolId || 'image-generation',
          userId,
          transactionId,
          provider: 'fal',
          model: 'fal-flux',
          imageCount: 1,
          creditsCharged
        })
      } catch (trackError) {
        console.error('Cost tracking error (non-fatal):', trackError)
      }
    }
    
    return NextResponse.json({
      success: true,
      imageUrl: result.imageUrl
    })
  } catch (error) {
    console.error('Image generation error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to generate image' },
      { status: 500 }
    )
  }
}
