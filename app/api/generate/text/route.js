import { NextResponse } from 'next/server'
import { generateText } from '@/lib/gemini-text'
import { SYSTEM_PROMPTS } from '@/lib/system-prompts'
import { getCollection } from '@/lib/mongodb'
import { generateWithTracking, estimateTokens } from '@/lib/ai-tracking'
import { enforceRateLimit } from '@/lib/rate-limiter'
import { z } from 'zod'
import { validateRequest } from '@/lib/validation'
import { humanizeText, cleanMarkdown } from '@/lib/hooks/useHumanize'
import { getUserIdFromRequest, checkCredits, deductCredits, completeTransaction, refundCredits } from '@/lib/credits'

const DEFAULT_TOOL_ID = 'story-writer'

// Text generation input schema
const textGenerationSchema = z.object({
  prompt: z.string().min(1, 'Prompt is required').max(10000, 'Prompt too long'),
  type: z.string().max(100).optional(),
  systemMessage: z.string().max(5000).optional(),
  userId: z.string().max(100).optional(),
  transactionId: z.string().max(100).optional(),
  creditsCharged: z.number().positive().max(10000).optional()
})

export async function POST(request) {
  let transactionId = null
  let userId = null
  
  try {
    // SECURITY: Rate limiting for content generation
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
    const toolId = body.type || DEFAULT_TOOL_ID
    
    const creditCheck = await checkCredits(userId, toolId)
    if (!creditCheck.hasEnough) {
      return NextResponse.json({
        success: false,
        error: `Insufficient credits. This tool costs ${creditCheck.cost} credits, but you have ${creditCheck.currentBalance}.`,
        creditInfo: creditCheck
      }, { status: 402 })
    }
    
    // Deduct credits before generation
    const deductResult = await deductCredits(userId, toolId)
    if (!deductResult.success) {
      return NextResponse.json({
        success: false,
        error: 'Failed to process credits. Please try again.'
      }, { status: 500 })
    }
    transactionId = deductResult.transactionId
    
    // SECURITY: Validate input with Zod schema
    const validation = validateRequest(textGenerationSchema, body)
    if (!validation.success) {
      // Refund for validation failure
      if (transactionId) await refundCredits(userId, transactionId, 'Validation failed')
      return NextResponse.json({
        success: false,
        error: 'Validation failed',
        errors: validation.errors
      }, { status: 400 })
    }
    
    const { prompt, type, systemMessage, creditsCharged } = validation.data

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
    
    // Clean up formatting: Remove markdown and clean asterisks
    let cleanedContent = result.content
    
    // Use shared cleanMarkdown function
    cleanedContent = cleanMarkdown(cleanedContent)
    
    // Remove common emojis (basic cleanup)
    cleanedContent = cleanedContent.replace(/[\u{1F600}-\u{1F64F}]/gu, '') // Emoticons
    cleanedContent = cleanedContent.replace(/[\u{1F300}-\u{1F5FF}]/gu, '') // Misc Symbols and Pictographs
    cleanedContent = cleanedContent.replace(/[\u{1F680}-\u{1F6FF}]/gu, '') // Transport and Map
    cleanedContent = cleanedContent.replace(/[\u{1F1E0}-\u{1F1FF}]/gu, '') // Flags
    cleanedContent = cleanedContent.replace(/[\u{2600}-\u{26FF}]/gu, '')   // Misc symbols
    cleanedContent = cleanedContent.replace(/[\u{2700}-\u{27BF}]/gu, '')   // Dingbats
    
    // HUMANIZE: Remove AI-sounding words and replace with natural alternatives
    // This makes the generated content sound more human-written
    cleanedContent = humanizeText(cleanedContent, { removeFiller: true })
    
    return NextResponse.json({
      success: true,
      content: cleanedContent,
      sessionId: result.sessionId
    })
  } catch (error) {
    console.error('Text generation error:', error)
    // Refund credits on error
    if (transactionId && userId) {
      await refundCredits(userId, transactionId, error.message)
    }
    return NextResponse.json(
      { success: false, error: 'Failed to generate text' },
      { status: 500 }
    )
  }
}
