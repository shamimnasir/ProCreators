// Credit Balance & Operations API
import { NextResponse } from 'next/server'
import { 
  getUserCredits, 
  checkCredits, 
  deductCredits, 
  refundCredits,
  completeTransaction,
  addCredits,
  getCreditHistory,
  getToolCreditCost
} from '@/lib/credits'
import { checkRateLimit, startGeneration, endGeneration } from '@/lib/rateLimit'
import { isFeatureEnabled } from '@/lib/featureControls'

// GET - Get user's credit balance and info
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const toolId = searchParams.get('toolId')
    
    // SECURITY: Get userId from Authorization header (preferred) or fallback to query param
    let userId = null
    const authHeader = request.headers.get('authorization')
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1]
      if (token) {
        // Dynamically import to avoid circular dependencies
        const { connectToDatabase } = await import('@/lib/mongodb')
        const { db } = await connectToDatabase()
        const session = await db.collection('sessions').findOne({
          token,
          expiresAt: { $gt: new Date() }
        })
        if (session) {
          userId = session.userId
        }
      }
    }
    
    // Fallback to query param for backward compatibility (will be deprecated)
    if (!userId) {
      userId = searchParams.get('userId')
    }
    
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 })
    }
    
    const creditInfo = await getUserCredits(userId)
    
    // If toolId provided, also get cost estimate
    let costEstimate = null
    if (toolId) {
      costEstimate = await getToolCreditCost(toolId)
    }
    
    return NextResponse.json({
      success: true,
      ...creditInfo,
      costEstimate
    })
    
  } catch (error) {
    console.error('Error getting credits:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

// POST - Operations: check, deduct, refund, complete
export async function POST(request) {
  try {
    const body = await request.json()
    const { action, userId, toolId, transactionId, amount, reason, params } = body
    
    switch (action) {
      case 'check': {
        // Check if user has enough credits
        if (!userId || !toolId) {
          return NextResponse.json({ success: false, error: 'userId and toolId required' }, { status: 400 })
        }
        
        const result = await checkCredits(userId, toolId, params)
        return NextResponse.json({ success: true, ...result })
      }
      
      case 'deduct': {
        // Deduct credits before generation
        if (!userId || !toolId) {
          return NextResponse.json({ success: false, error: 'userId and toolId required' }, { status: 400 })
        }
        
        // Check rate limits first
        const { credits, plan } = await getUserCredits(userId)
        const rateLimitCheck = await checkRateLimit(userId, plan)
        
        if (!rateLimitCheck.allowed) {
          return NextResponse.json({ 
            success: false, 
            error: rateLimitCheck.reason,
            retryAfter: rateLimitCheck.retryAfter
          }, { status: 429 })
        }
        
        // Check feature controls
        const featureType = getFeatureType(toolId)
        const featureCheck = await isFeatureEnabled(featureType, toolId)
        
        if (!featureCheck.enabled) {
          return NextResponse.json({ 
            success: false, 
            error: featureCheck.reason
          }, { status: 503 })
        }
        
        // Start generation tracking
        await startGeneration(userId)
        
        // Deduct credits
        const result = await deductCredits(userId, toolId, params)
        
        if (!result.success) {
          await endGeneration(userId)
          return NextResponse.json(result, { status: 402 }) // Payment required
        }
        
        return NextResponse.json(result)
      }
      
      case 'refund': {
        // Refund credits on failure
        if (!transactionId) {
          return NextResponse.json({ success: false, error: 'transactionId required' }, { status: 400 })
        }
        
        // End generation tracking
        if (userId) {
          await endGeneration(userId)
        }
        
        const result = await refundCredits(transactionId, reason || 'Generation failed')
        return NextResponse.json(result)
      }
      
      case 'complete': {
        // Mark transaction as complete
        if (!transactionId) {
          return NextResponse.json({ success: false, error: 'transactionId required' }, { status: 400 })
        }
        
        // End generation tracking
        if (userId) {
          await endGeneration(userId)
        }
        
        const result = await completeTransaction(transactionId)
        return NextResponse.json(result)
      }
      
      case 'history': {
        // Get credit history
        if (!userId) {
          return NextResponse.json({ success: false, error: 'userId required' }, { status: 400 })
        }
        
        const history = await getCreditHistory(userId)
        return NextResponse.json({ success: true, history })
      }
      
      default:
        return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 })
    }
    
  } catch (error) {
    console.error('Credit operation error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

// Helper to determine feature type from tool ID
function getFeatureType(toolId) {
  const videoTools = ['video-editor', 'ai-video-studio', 'quick-reels', 'auto-subtitles', 'auto-reels', 'auto-longform', 'talking-head', 'transformation-video', 'script-to-ad']
  const imageTools = ['image-editor', 'cover-image-creator', 'podcast-cover-maker', 'thumbnail-maker', 'photo-cards', 'carousels', 'avatar-creator']
  const audioTools = ['audio-editor', 'noise-remover', 'voice-enhancer', 'voice-clone']
  const pdfTools = ['planner-maker', 'worksheet-maker', 'coloring-book', 'journal-maker', 'ebook-maker', 'recipe-book', 'guide-maker', 'storybook-maker', 'activity-book', 'quiz-maker', 'learning-cards', 'slides-maker', 'notion-templates', 'business-plan', 'pitch-deck']
  
  if (videoTools.includes(toolId)) return 'video'
  if (imageTools.includes(toolId)) return 'image'
  if (audioTools.includes(toolId)) return 'audio'
  if (pdfTools.includes(toolId)) return 'pdf'
  return 'text'
}
