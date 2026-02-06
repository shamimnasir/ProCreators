import { NextResponse } from 'next/server'
import { generatePlaceholderVideo } from '@/lib/video/placeholder'
import { enforceRateLimit } from '@/lib/rate-limiter'

export async function POST(request) {
  try {
    // SECURITY: Rate limiting for video generation
    const rateLimitCheck = await enforceRateLimit(request, 'content_generate')
    if (rateLimitCheck.limited) {
      return rateLimitCheck.response
    }
    
    const { prompt } = await request.json()
    
    if (!prompt) {
      return NextResponse.json(
        { success: false, error: 'Prompt is required' },
        { status: 400 }
      )
    }

    const result = await generatePlaceholderVideo(prompt)
    
    return NextResponse.json({
      success: true,
      videoUrl: result.videoUrl,
      message: result.message
    })
  } catch (error) {
    console.error('Video generation error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to generate video' },
      { status: 500 }
    )
  }
}
