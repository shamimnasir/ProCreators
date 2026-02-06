import { NextResponse } from 'next/server'
import { generateImage } from '@/lib/gemini-image'
import { trackImageGeneration } from '@/lib/ai-tracking'
import { enforceRateLimit } from '@/lib/rate-limiter'
import { z } from 'zod'
import { validateRequest } from '@/lib/validation'

// Image generation input schema
const imageGenerationSchema = z.object({
  prompt: z.string().min(1, 'Prompt is required').max(2000, 'Prompt too long'),
  userId: z.string().max(100).optional(),
  transactionId: z.string().max(100).optional(),
  creditsCharged: z.number().positive().max(10000).optional(),
  toolId: z.string().max(100).optional(),
  style: z.string().max(100).optional(),
  aspectRatio: z.enum(['1:1', '16:9', '9:16', '4:3', '3:4']).optional()
})

export async function POST(request) {
  try {
    // SECURITY: Rate limiting for image generation
    const rateLimitCheck = await enforceRateLimit(request, 'content_generate')
    if (rateLimitCheck.limited) {
      return rateLimitCheck.response
    }
    
    const body = await request.json()
    
    // SECURITY: Validate input with Zod schema
    const validation = validateRequest(imageGenerationSchema, body)
    if (!validation.success) {
      return NextResponse.json({
        success: false,
        error: 'Validation failed',
        errors: validation.errors
      }, { status: 400 })
    }
    
    const { prompt, userId, transactionId, creditsCharged, toolId } = validation.data

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
