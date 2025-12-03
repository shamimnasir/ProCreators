import { NextResponse } from 'next/server'
import { generateText } from '@/lib/gemini-text'
import { SYSTEM_PROMPTS } from '@/lib/system-prompts'
import { getCollection } from '@/lib/mongodb'

export async function POST(request) {
  try {
    const { prompt, type, systemMessage } = await request.json()
    
    if (!prompt) {
      return NextResponse.json(
        { success: false, error: 'Prompt is required' },
        { status: 400 }
      )
    }

    // Get system prompt for the tool type
    let finalSystemMessage = systemMessage
    
    if (!finalSystemMessage && type) {
      // Try to get custom prompt from database
      try {
        const settingsCollection = await getCollection('settings')
        const customPrompt = await settingsCollection.findOne({ 
          type: 'system-prompt',
          tool: type 
        })
        
        if (customPrompt?.prompt) {
          finalSystemMessage = customPrompt.prompt
        } else {
          // Use default from config
          finalSystemMessage = SYSTEM_PROMPTS[type]?.prompt || "You are a helpful AI assistant specialized in creating engaging content."
        }
      } catch (dbError) {
        console.log('Database not available, using default prompts')
        finalSystemMessage = SYSTEM_PROMPTS[type]?.prompt || "You are a helpful AI assistant specialized in creating engaging content."
      }
    }
    
    if (!finalSystemMessage) {
      finalSystemMessage = "You are a helpful AI assistant specialized in creating engaging content."
    }

    const result = await generateText(
      prompt,
      finalSystemMessage
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
