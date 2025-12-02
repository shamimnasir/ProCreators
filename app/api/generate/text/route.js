import { NextResponse } from 'next/server'
import { generateText } from '@/lib/gemini-text'

export async function POST(request) {
  try {
    const { prompt, type, systemMessage } = await request.json()
    
    if (!prompt) {
      return NextResponse.json(
        { success: false, error: 'Prompt is required' },
        { status: 400 }
      )
    }

    const result = await generateText(
      prompt,
      systemMessage || "You are a helpful AI assistant specialized in creating engaging content."
    )
    
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      )
    }
    
    return NextResponse.json({
      success: true,
      content: result.content,
      sessionId: result.sessionId
    })
  } catch (error) {
    console.error('Text generation error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to generate text' },
      { status: 500 }
    )
  }
}
