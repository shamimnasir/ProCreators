import { NextResponse } from 'next/server'
import { enforceRateLimit } from '@/lib/rate-limiter'
import { getUserIdFromRequest, checkCredits, deductCredits, completeTransaction, refundCredits } from '@/lib/credits'

const TOOL_ID = 'quick-reels'

export async function POST(request) {
  let transactionId = null
  let userId = null
  
  try {
    // SECURITY: Rate limiting for video generation
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
    
    const creditCheck = await checkCredits(userId, TOOL_ID)
    if (!creditCheck.hasEnough) {
      return NextResponse.json({
        success: false,
        error: `Insufficient credits. This tool costs ${creditCheck.cost} credits, but you have ${creditCheck.currentBalance}.`,
        creditInfo: creditCheck
      }, { status: 402 })
    }
    
    // Deduct credits before generation
    const deductResult = await deductCredits(userId, TOOL_ID)
    if (!deductResult.success) {
      return NextResponse.json({
        success: false,
        error: 'Failed to process credits. Please try again.'
      }, { status: 500 })
    }
    transactionId = deductResult.transactionId
    
    const { prompt } = await request.json()
    
    if (!prompt) {
      if (transactionId) await refundCredits(userId, transactionId, 'Prompt required')
      return NextResponse.json(
        { success: false, error: 'Prompt is required' },
        { status: 400 }
      )
    }

    // Note: For actual video generation, use /api/story-reels or /api/ai-video-studio
    // This endpoint returns a placeholder response
    // Complete transaction
    if (transactionId) await completeTransaction(transactionId)
    
    return NextResponse.json({
      success: true,
      videoUrl: '/videos/placeholder.mp4',
      message: 'For full video generation, please use the Story Reels or AI Video Studio tools.'
    })
  } catch (error) {
    console.error('Video generation error:', error)
    // Refund credits on error
    if (transactionId && userId) {
      await refundCredits(userId, transactionId, error.message)
    }
    return NextResponse.json(
      { success: false, error: 'Failed to generate video' },
      { status: 500 }
    )
  }
}
