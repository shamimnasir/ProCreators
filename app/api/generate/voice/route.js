import { NextResponse } from 'next/server'
import { generatePlaceholderVoice, clonePlaceholderVoice } from '@/lib/voice/placeholder'
import { enforceRateLimit } from '@/lib/rate-limiter'

export async function POST(request) {
  try {
    // SECURITY: Rate limiting for content generation
    const rateLimitCheck = await enforceRateLimit(request, 'content_generate')
    if (rateLimitCheck.limited) {
      return rateLimitCheck.response
    }

    const { text, type, voiceSample } = await request.json()
    
    if (!text) {
      return NextResponse.json(
        { success: false, error: 'Text is required' },
        { status: 400 }
      )
    }

    const result = type === 'clone' 
      ? await clonePlaceholderVoice(text, voiceSample)
      : await generatePlaceholderVoice(text)
    
    return NextResponse.json({
      success: true,
      audioUrl: result.audioUrl,
      message: result.message
    })
  } catch (error) {
    console.error('Voice generation error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to generate voice' },
      { status: 500 }
    )
  }
}
