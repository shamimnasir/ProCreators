import { NextResponse } from 'next/server'
import { generateText } from '@/lib/gemini-text'
import { SYSTEM_PROMPTS } from '@/lib/system-prompts'
import { getCollection } from '@/lib/mongodb'
import { generateWithTracking, estimateTokens } from '@/lib/ai-tracking'
import { enforceRateLimit } from '@/lib/rate-limiter'

export async function POST(request) {
  try {
    // SECURITY: Rate limiting for content generation
    const rateLimitCheck = await enforceRateLimit(request, 'content_generate')
    if (rateLimitCheck.limited) {
      return rateLimitCheck.response
    }

    const { prompt, type, systemMessage, userId, transactionId, creditsCharged } = await request.json()
    
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
    
    // Track API cost if we have tracking info
    if (userId && transactionId && creditsCharged) {
      try {
        await generateWithTracking({
          toolId: type || 'text-generation',
          userId,
          transactionId,
          provider: 'google',
          model: 'gemini-flash',
          inputText: prompt + (finalSystemMessage || ''),
          outputText: result.content,
          creditsCharged
        })
      } catch (trackError) {
        console.error('Cost tracking error (non-fatal):', trackError)
      }
    }
    
    // Clean up formatting: Replace asterisks with dashes, remove emojis
    let cleanedContent = result.content
    
    // Replace ** bold markers ** with nothing (just keep the text)
    cleanedContent = cleanedContent.replace(/\*\*([^*]+)\*\*/g, '$1')
    
    // Replace single asterisks used as bullets with dashes
    cleanedContent = cleanedContent.replace(/^[\s]*\*[\s]+/gm, '- ')
    cleanedContent = cleanedContent.replace(/\n[\s]*\*[\s]+/g, '\n- ')
    
    // Remove any remaining asterisks
    cleanedContent = cleanedContent.replace(/\*/g, '')
    
    // Remove common emojis (basic cleanup)
    cleanedContent = cleanedContent.replace(/[\u{1F600}-\u{1F64F}]/gu, '') // Emoticons
    cleanedContent = cleanedContent.replace(/[\u{1F300}-\u{1F5FF}]/gu, '') // Misc Symbols and Pictographs
    cleanedContent = cleanedContent.replace(/[\u{1F680}-\u{1F6FF}]/gu, '') // Transport and Map
    cleanedContent = cleanedContent.replace(/[\u{1F1E0}-\u{1F1FF}]/gu, '') // Flags
    cleanedContent = cleanedContent.replace(/[\u{2600}-\u{26FF}]/gu, '')   // Misc symbols
    cleanedContent = cleanedContent.replace(/[\u{2700}-\u{27BF}]/gu, '')   // Dingbats
    
    return NextResponse.json({
      success: true,
      content: cleanedContent,
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
