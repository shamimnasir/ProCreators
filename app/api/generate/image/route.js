import { NextResponse } from 'next/server'
import { generateImage } from '@/lib/gemini-image'
import { trackImageGeneration } from '@/lib/ai-tracking'
import { enforceRateLimit } from '@/lib/rate-limiter'
import { z } from 'zod'
import { validateRequest } from '@/lib/validation'
import { getUserIdFromRequest, checkCredits, deductCredits, completeTransaction, refundCredits } from '@/lib/credits'

const TOOL_ID = 'image-editor'

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
  let transactionId = null
  let userId = null
  
  try {
    // SECURITY: Rate limiting for image generation
    const rateLimitCheck = await enforceRateLimit(request, 'content_generate')
    if (rateLimitCheck.limited) {
      return rateLimitCheck.response
    }
    
    // SECURITY: Get user ID and check credits
    userId = await getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json({
        success: false,
        error: 'Authentication required. Please log in to use this tool.'
      }, { status: 401 })
    }
    
    const body = await request.json()
    const effectiveToolId = body.toolId || TOOL_ID
    
    const creditCheck = await checkCredits(userId, effectiveToolId)
    if (!creditCheck.hasEnough) {
      return NextResponse.json({
        success: false,
        error: `Insufficient credits. This tool costs ${creditCheck.cost} credits, but you have ${creditCheck.currentBalance}.`,
        creditInfo: creditCheck
      }, { status: 402 })
    }
    
    // Deduct credits before generation
    const deductResult = await deductCredits(userId, effectiveToolId)
    if (!deductResult.success) {
      return NextResponse.json({
        success: false,
        error: 'Failed to process credits. Please try again.'
      }, { status: 500 })
    }
    transactionId = deductResult.transactionId
    
    // SECURITY: Validate input with Zod schema
    const validation = validateRequest(imageGenerationSchema, body)
    if (!validation.success) {
      // Refund for validation failure
      if (transactionId) await refundCredits(userId, transactionId, 'Validation failed')
      return NextResponse.json({
        success: false,
        error: 'Validation failed',
        errors: validation.errors
      }, { status: 400 })
    }
    
    const { prompt } = validation.data

    const result = await generateImage(prompt)
    
    if (!result.success) {
      // Refund on generation failure
      if (transactionId) await refundCredits(userId, transactionId, result.error)
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      )
    }
    
    // Complete transaction on success
    if (transactionId) await completeTransaction(transactionId)
    
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
    // Refund credits on error
    if (transactionId && userId) {
      await refundCredits(userId, transactionId, error.message)
    }
    return NextResponse.json(
      { success: false, error: 'Failed to generate image' },
      { status: 500 }
    )
  }
}
