import { NextResponse } from 'next/server'
import { generatePlaceholderVideo } from '@/lib/video/placeholder'

export async function POST(request) {
  try {
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
