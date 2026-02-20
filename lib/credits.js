// Credit System Library
// Handles credit deduction, refund, and balance management
// PRICING MODEL: Based on actual API costs + profit margins
// - Text tools (Gemini): 55% margin - very cheap API (~$0.0005/call)
// - Image tools (Nano Banana): 55% margin - $0.134/image
// - Video tools (Kling via Fal.ai): 20% margin - ~$2.80/10s clip
// - Stock video (Pexels): FREE API, charge for TTS/processing

import { connectToDatabase } from './mongodb'
import { v4 as uuidv4 } from 'uuid'

// ============= PRICING CONSTANTS =============
// 1 credit = $0.001 (1000 credits = $1)
const CREDIT_VALUE = 0.001

// Profit margins by category
const MARGINS = {
  TEXT: 0.55,      // 55% profit margin
  IMAGE: 0.55,     // 55% profit margin
  VIDEO_AI: 0.20,  // 20% profit margin (competitive pricing)
  VIDEO_STOCK: 0.55, // 55% margin (Pexels is free)
  AUDIO: 0.55,     // 55% profit margin
  PDF_TEXT: 0.55,  // 55% margin
  PDF_IMAGE: 0.55  // 55% margin
}

// API Costs (in USD)
const API_COSTS = {
  // Gemini 2.0 Flash text generation (~500 input + 1000 output tokens)
  GEMINI_TEXT_SHORT: 0.0005,   // ~$0.0005 per short text call
  GEMINI_TEXT_MEDIUM: 0.001,   // ~$0.001 per medium text call
  GEMINI_TEXT_LONG: 0.002,     // ~$0.002 per long text call
  
  // Nano Banana Pro image generation
  IMAGE_SINGLE: 0.134,         // $0.134 per image
  
  // Kling video via Fal.ai
  VIDEO_10S_CLIP: 2.80,        // $2.80 per 10-second clip
  VIDEO_5S_CLIP: 1.40,         // $1.40 for first 5 seconds
  
  // Google Cloud TTS (WaveNet)
  TTS_PER_1000_CHARS: 0.016,   // $16 per 1M chars = $0.016 per 1000
  
  // ElevenLabs (for premium voice)
  ELEVENLABS_PER_1000_CHARS: 0.30,
  
  // Pexels stock videos - FREE
  PEXELS_VIDEO: 0,
}

// Calculate credits from API cost with margin
function calculateCredits(apiCost, margin) {
  // Formula: credits = (apiCost / creditValue) / (1 - margin)
  const totalCost = apiCost / (1 - margin)
  return Math.ceil(totalCost / CREDIT_VALUE)
}

// ============= CREDIT COSTS PER TOOL =============
// Calculated based on actual API costs + profit margins
const DEFAULT_CREDIT_COSTS = {
  // ============= TEXT GENERATION (Gemini 2.0 Flash - Very Cheap) =============
  // API cost ~$0.0005-0.002, minimum 5 credits for value perception
  'joke-generator': 5,           // Short text
  'fortune-teller': 5,           // Short text
  'love-letter': 8,              // Medium text
  'story-writer': 15,            // Long text
  'avatar-creator': 8,           // Medium text + simple processing
  'meme-generator': 8,           // Medium text
  'ad-copy': 10,                 // Medium text
  'professional-email': 8,       // Medium text
  'blog-creator': 20,            // Long text
  'linkedin-posts': 8,           // Medium text
  'landing-page-copy': 15,       // Long text
  'email-campaigns': 12,         // Medium-long text
  'marketing-strategy': 20,      // Long text
  'cover-letter': 10,            // Medium text
  'resume-builder': 15,          // Long text
  'interview-prep': 12,          // Medium text
  'salary-negotiator': 10,       // Medium text
  'networking-message': 8,       // Medium text
  'job-matcher': 10,             // Medium text
  'essay-helper': 15,            // Long text
  'study-notes': 12,             // Medium-long text
  'exam-prep': 15,               // Long text
  'lesson-planner': 15,          // Long text
  'grammar-checker': 5,          // Short analysis
  'citation-generator': 5,       // Short text
  'ai-humanizer': 10,            // Medium text processing
  'content-humanizer': 10,       // Medium text processing
  'youtube-creator': 15,         // Script generation
  
  // ============= PDF GENERATION (Text-only - Gemini + PDF processing) =============
  // Mostly text generation, minimal compute for PDF
  'planner-maker': 20,           // ~$0.002 API + PDF processing
  'worksheet-maker': 20,
  'checklist-maker': 15,
  'journal-maker': 20,
  'quiz-maker': 18,
  'learning-cards': 18,
  'slides-maker': 25,            // More complex layout
  'notion-templates': 20,
  'business-plan': 30,           // Long text + PDF
  'pitch-deck': 35,              // Long text + complex layout
  'swot-analysis': 20,
  'guide-maker': 25,
  
  // ============= PDF WITH IMAGES (Nano Banana @ $0.134/image) =============
  // These generate multiple AI images - EXPENSIVE
  // Formula: (numImages * $0.134) / 0.45 / $0.001 = numImages * 298 credits
  'coloring-book': 7500,         // ~25 images × 300 credits = 7,500
  'storybook-maker': 3000,       // ~10 images × 300 credits = 3,000  
  'activity-book': 4500,         // ~15 images × 300 credits = 4,500
  'recipe-book': 2000,           // ~6-7 images × 300 = 2,000
  'ebook-maker': 1500,           // ~5 images for chapters = 1,500
  
  // ============= SINGLE IMAGE GENERATION (Nano Banana @ $0.134) =============
  // $0.134 / 0.45 / $0.001 = 298 credits, rounded to 300
  'image-editor': 300,           // Single image generation
  'cover-image-creator': 300,
  'podcast-cover-maker': 300,
  'thumbnail-maker': 300,
  'photo-cards': 300,
  'carousels': 600,              // 2 images average

  // ============= VIDEO - STOCK (Pexels FREE + TTS + Processing) =============
  // Pexels is free, only charge for TTS (~$0.008) + compute overhead
  'video-editor': 50,            // Processing only
  'quick-reels': 40,             // Stock videos + TTS
  'quick-reels-stock': 40,       // Explicit stock tier
  'auto-subtitles': 30,          // Transcription + processing
  
  // ============= VIDEO - AI GENERATION (Kling via Fal.ai @ $2.80/10s) =============
  // 20% margin: $2.80 / 0.80 / $0.001 = 3,500 credits per 10s clip
  // 30s video = 3 clips = 10,500 credits (user requested 10,000)
  'ai-video-studio': 10000,      // Base for 30s AI video
  'story-reels': 10000,          // Base for 30s AI video
  'auto-reels': 10000,           // Base for 30s AI video
  'auto-longform': 15000,        // Longer videos, more clips
  'talking-head': 10000,         // AI video
  'transformation-video': 10000, // AI video
  'script-to-ad': 10000,         // AI video
  
  // AI Video Tiers (for story-reels niches)
  'quick-reels-ai-essential': 8000,     // Basic AI, no consistency
  'quick-reels-ai-minimax': 7000,       // Minimax - faster, cheaper
  'quick-reels-ai-standard': 10000,     // Good quality, seed consistency (Kling)
  'quick-reels-ai-professional': 12000, // Frame-chain consistency (Kling)
  'quick-reels-ai-cinema': 15000,       // Best quality (Kling)
  
  // ============= AUDIO PROCESSING =============
  'audio-editor': 25,            // Basic processing
  'noise-remover': 20,           // Processing only
  'voice-enhancer': 25,          // Processing only
  'voice-clone': 500,            // ElevenLabs API - expensive
  
  // Default for unknown tools
  'default': 20
}

// Video tools that should scale by duration
const VIDEO_TOOLS_WITH_DURATION_SCALING = [
  'ai-video-studio',
  'auto-reels', 
  'auto-longform',
  'story-reels',
  'quick-reels-ai-essential',
  'quick-reels-ai-minimax',
  'quick-reels-ai-standard', 
  'quick-reels-ai-professional',
  'quick-reels-ai-cinema',
  'transformation-video',
  'script-to-ad',
  'talking-head'
]

// Base duration for video pricing (30 seconds = base cost)
const BASE_VIDEO_DURATION = 30

// Get credit cost for a tool
export async function getToolCreditCost(toolId, params = {}) {
  try {
    const { db } = await connectToDatabase()
    
    // Check for custom pricing in database
    const customPricing = await db.collection('credit_pricing').findOne({ _id: 'tool-pricing' })
    
    let baseCost = DEFAULT_CREDIT_COSTS[toolId] || DEFAULT_CREDIT_COSTS['default']
    
    if (customPricing?.tools?.[toolId]?.credits) {
      baseCost = customPricing.tools[toolId].credits
    }
    
    let cost = baseCost
    
    // Apply duration-based scaling for video tools (ALL durations)
    // Base: 30s = base cost, scales linearly
    // Examples: 15s = 50%, 30s = 100%, 45s = 150%, 60s = 200%
    if (VIDEO_TOOLS_WITH_DURATION_SCALING.includes(toolId) && params.duration) {
      const durationMultiplier = params.duration / BASE_VIDEO_DURATION
      cost = Math.ceil(baseCost * durationMultiplier)
      
      // Minimum cost is 25% of base (for very short videos)
      cost = Math.max(cost, Math.ceil(baseCost * 0.25))
    }
    
    // Apply resolution multiplier for 4K content
    if (params.resolution === '4k') {
      cost = Math.ceil(cost * 1.5)
    }
    
    // Apply consistency mode premium for frame-chain (extra processing)
    if (params.consistencyMode === 'frame-chain') {
      cost = Math.ceil(cost * 1.15) // 15% premium for frame-chaining
    }
    
    return cost
  } catch (error) {
    console.error('Error getting credit cost:', error)
    return DEFAULT_CREDIT_COSTS[toolId] || DEFAULT_CREDIT_COSTS['default']
  }
}

// Get user's credit balance (auto-initializes if user doesn't exist)
export async function getUserCredits(userId) {
  try {
    const { db } = await connectToDatabase()
    let user = await db.collection('users').findOne({ _id: userId })
    
    // Auto-initialize user with free credits if they don't exist
    if (!user) {
      const initialCredits = 500 // Free starter credits (enough for a few text tools)
      const expiryDate = new Date()
      expiryDate.setDate(expiryDate.getDate() + 7) // Expires in 7 days
      
      const newUser = {
        _id: userId,
        credits: initialCredits,
        membershipCredits: 0,
        purchasedCredits: initialCredits, // Free credits go to purchased (they roll over)
        freeCreditsExpiry: expiryDate,
        plan: 'free',
        totalCreditsUsed: 0,
        generationsToday: 0,
        accountStatus: 'active',
        createdAt: new Date(),
        lastActiveAt: new Date()
      }
      
      await db.collection('users').insertOne(newUser)
      
      // Log the transaction
      await db.collection('credit_transactions').insertOne({
        _id: uuidv4(),
        userId,
        amount: initialCredits,
        status: 'completed',
        type: 'free_credits',
        reason: 'Welcome bonus - auto-initialized',
        createdAt: new Date(),
        completedAt: new Date()
      })
      
      user = newUser
    }
    
    // Admin users - show actual balance for tracking purposes
    if (user?.role === 'admin') {
      const membershipCredits = user?.membershipCredits || 0
      const purchasedCredits = user?.purchasedCredits || 0
      const totalCredits = membershipCredits + purchasedCredits
      // Fallback to old credits field if new fields don't exist
      const credits = totalCredits > 0 ? totalCredits : (user?.credits || 0)
      
      return {
        credits,
        membershipCredits,
        purchasedCredits,
        plan: user?.plan || 'admin',
        freeCreditsExpiry: null,
        isAdmin: true,
        unlimited: false // No longer unlimited, tracking actual usage
      }
    }
    
    // Calculate total credits from both membership and purchased
    const membershipCredits = user?.membershipCredits || 0
    const purchasedCredits = user?.purchasedCredits || 0
    const totalCredits = membershipCredits + purchasedCredits
    
    // Fallback to old credits field if new fields don't exist
    const credits = totalCredits > 0 ? totalCredits : (user?.credits || 0)
    
    return {
      credits,
      membershipCredits,
      purchasedCredits,
      plan: user?.plan || 'free',
      freeCreditsExpiry: user?.freeCreditsExpiry || null
    }
  } catch (error) {
    console.error('Error getting user credits:', error)
    return { credits: 0, membershipCredits: 0, purchasedCredits: 0, plan: 'free' }
  }
}

// Check if user has enough credits
export async function checkCredits(userId, toolId, params = {}) {
  const cost = await getToolCreditCost(toolId, params)
  const { credits, plan } = await getUserCredits(userId)
  
  // Check if user is admin - admins always have "enough" credits but we track actual cost
  const { db } = await connectToDatabase()
  const user = await db.collection('users').findOne({ _id: userId })
  const isAdmin = user?.role === 'admin'
  
  if (isAdmin) {
    // Get actual admin credit balance for tracking
    const membershipCredits = user?.membershipCredits || 0
    const purchasedCredits = user?.purchasedCredits || 0
    const totalCredits = membershipCredits + purchasedCredits
    
    return {
      hasEnough: true, // Admins can always generate
      cost, // Show actual cost for tracking
      currentBalance: totalCredits, // Show actual balance
      shortfall: 0,
      plan,
      isAdmin: true
    }
  }
  
  return {
    hasEnough: credits >= cost,
    cost,
    currentBalance: credits,
    shortfall: Math.max(0, cost - credits),
    plan
  }
}

// Deduct credits (creates pending transaction)
export async function deductCredits(userId, toolId, params = {}) {
  const cost = await getToolCreditCost(toolId, params)
  const { db } = await connectToDatabase()
  
  // Check balance first
  const user = await db.collection('users').findOne({ _id: userId })
  
  // Admin users - still deduct credits for tracking purposes
  // NOTE: Keep transaction as 'pending' so refunds work on job failure
  if (user?.role === 'admin') {
    const transactionId = uuidv4()
    
    const membershipCredits = user?.membershipCredits || 0
    const purchasedCredits = user?.purchasedCredits || 0
    const totalCredits = membershipCredits + purchasedCredits
    
    // Calculate deduction from membership vs purchased (same logic as regular users)
    let deductFromMembership = Math.min(membershipCredits, cost)
    let deductFromPurchased = cost - deductFromMembership
    
    // Create a PENDING transaction (same as regular users) - this allows refund on job failure
    await db.collection('credit_transactions').insertOne({
      _id: transactionId,
      userId,
      toolId,
      amount: -cost, // Track actual cost for admins too
      status: 'pending', // Keep pending until job completes or fails
      params,
      isAdmin: true,
      note: 'Admin - credits deducted for tracking',
      createdAt: new Date(),
      completedAt: null // Will be set when transaction completes or refunds
    })
    
    // Deduct credits from admin for tracking purposes
    await db.collection('users').updateOne(
      { _id: userId },
      { 
        $inc: { 
          credits: -cost,
          membershipCredits: -deductFromMembership,
          purchasedCredits: -deductFromPurchased,
          totalCreditsUsed: cost,
          generationsToday: 1
        },
        $set: { lastGenerationAt: new Date() }
      }
    )
    
    return {
      success: true,
      transactionId,
      cost,
      newBalance: totalCredits - cost,
      isAdmin: true
    }
  }
  
  const membershipCredits = user?.membershipCredits || 0
  const purchasedCredits = user?.purchasedCredits || 0
  const totalCredits = membershipCredits + purchasedCredits
  
  if (!user || totalCredits < cost) {
    return {
      success: false,
      error: 'Insufficient credits',
      required: cost,
      available: totalCredits
    }
  }
  
  const transactionId = uuidv4()
  
  // Create pending transaction
  await db.collection('credit_transactions').insertOne({
    _id: transactionId,
    userId,
    toolId,
    amount: -cost,
    status: 'pending', // pending, completed, refunded
    params,
    createdAt: new Date(),
    completedAt: null
  })
  
  // Calculate deduction from membership vs purchased
  // Priority: membership credits first, then purchased
  let deductFromMembership = Math.min(membershipCredits, cost)
  let deductFromPurchased = cost - deductFromMembership
  
  // Deduct credits from both pools
  await db.collection('users').updateOne(
    { _id: userId },
    { 
      $inc: { 
        credits: -cost,  // Legacy field for backward compatibility
        membershipCredits: -deductFromMembership,
        purchasedCredits: -deductFromPurchased,
        totalCreditsUsed: cost,
        generationsToday: 1
      },
      $set: { lastGenerationAt: new Date() }
    }
  )
  
  return {
    success: true,
    transactionId,
    cost,
    newBalance: totalCredits - cost
  }
}

// Refund credits (on generation failure)
export async function refundCredits(transactionId, reason = 'Generation failed') {
  const { db } = await connectToDatabase()
  
  const transaction = await db.collection('credit_transactions').findOne({ _id: transactionId })
  
  if (!transaction) {
    return { success: false, error: 'Transaction not found' }
  }
  
  if (transaction.status !== 'pending') {
    return { success: false, error: 'Transaction already processed' }
  }
  
  const refundAmount = Math.abs(transaction.amount)
  
  // Update transaction status
  await db.collection('credit_transactions').updateOne(
    { _id: transactionId },
    { 
      $set: { 
        status: 'refunded',
        refundReason: reason,
        completedAt: new Date()
      }
    }
  )
  
  // Refund credits to user
  await db.collection('users').updateOne(
    { _id: transaction.userId },
    { 
      $inc: { 
        credits: refundAmount,
        totalCreditsUsed: -refundAmount,
        generationsToday: -1
      }
    }
  )
  
  return {
    success: true,
    refundedAmount: refundAmount,
    reason
  }
}

// Complete transaction (on successful generation)
export async function completeTransaction(transactionId) {
  const { db } = await connectToDatabase()
  
  await db.collection('credit_transactions').updateOne(
    { _id: transactionId },
    { 
      $set: { 
        status: 'completed',
        completedAt: new Date()
      }
    }
  )
  
  return { success: true }
}

// Add credits to user (for purchases, admin, etc.)
export async function addCredits(userId, amount, reason, adminId = null) {
  const { db } = await connectToDatabase()
  
  const transactionId = uuidv4()
  
  // Create transaction record
  await db.collection('credit_transactions').insertOne({
    _id: transactionId,
    userId,
    amount: amount,
    status: 'completed',
    type: 'credit_add',
    reason,
    adminId,
    createdAt: new Date(),
    completedAt: new Date()
  })
  
  // Add credits
  const result = await db.collection('users').updateOne(
    { _id: userId },
    { $inc: { credits: amount } }
  )
  
  return {
    success: result.modifiedCount > 0,
    transactionId,
    amount
  }
}

// Get user's credit history
export async function getCreditHistory(userId, limit = 50) {
  const { db } = await connectToDatabase()
  
  const transactions = await db.collection('credit_transactions')
    .find({ userId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .toArray()
  
  return transactions
}

// Initialize free credits for new user
export async function initializeFreeCredits(userId, amount = 500) {
  const { db } = await connectToDatabase()
  
  const expiryDate = new Date()
  expiryDate.setDate(expiryDate.getDate() + 7) // Expires in 7 days
  
  await db.collection('users').updateOne(
    { _id: userId },
    { 
      $set: { 
        credits: amount,
        freeCreditsExpiry: expiryDate,
        plan: 'free',
        totalCreditsUsed: 0,
        generationsToday: 0
      }
    },
    { upsert: true }
  )
  
  // Log the transaction
  await db.collection('credit_transactions').insertOne({
    _id: uuidv4(),
    userId,
    amount,
    status: 'completed',
    type: 'free_credits',
    reason: 'Welcome bonus',
    createdAt: new Date(),
    completedAt: new Date()
  })
  
  return { success: true, credits: amount, expiresAt: expiryDate }
}

// Helper function to get user ID from request (session or auth header)
export async function getUserIdFromRequest(request) {
  try {
    let sessionToken = null
    
    // Method 1: Try reading from request cookies first (most reliable in API routes)
    const cookieHeader = request.headers.get('cookie')
    if (cookieHeader) {
      const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
        const [key, value] = cookie.trim().split('=')
        acc[key] = value
        return acc
      }, {})
      sessionToken = cookies['session_token']
      console.log('[getUserIdFromRequest] Session token from request cookie header:', sessionToken ? 'present' : 'missing')
    }
    
    // Method 2: Fallback to next/headers if cookie header parsing didn't work
    if (!sessionToken) {
      try {
        const { cookies } = await import('next/headers')
        const cookieStore = await cookies()
        sessionToken = cookieStore.get('session_token')?.value
        console.log('[getUserIdFromRequest] Session token from next/headers:', sessionToken ? 'present' : 'missing')
      } catch (e) {
        console.log('[getUserIdFromRequest] Could not read from next/headers:', e.message)
      }
    }
    
    const { db } = await connectToDatabase()
    
    if (sessionToken) {
      const session = await db.collection('sessions').findOne({ 
        token: sessionToken,
        expiresAt: { $gt: new Date() }
      })
      console.log('[getUserIdFromRequest] Session found:', session ? session.userId : 'not found')
      if (session?.userId) return session.userId
    }
    
    // Check Authorization header
    const authHeader = request.headers.get('Authorization')
    console.log('[getUserIdFromRequest] Auth header:', authHeader ? 'present' : 'missing')
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7)
      const session = await db.collection('sessions').findOne({ 
        token,
        expiresAt: { $gt: new Date() }
      })
      console.log('[getUserIdFromRequest] Session from Bearer:', session ? session.userId : 'not found')
      return session?.userId || null
    }
    
    return null
  } catch (error) {
    console.error('Error getting user from request:', error)
    return null
  }
}

// Wrapper function to handle credit check, deduction, and completion
export async function withCredits(request, toolId, generateFn, params = {}) {
  const { NextResponse } = await import('next/server')
  
  // Get user ID
  const userId = await getUserIdFromRequest(request)
  if (!userId) {
    return {
      success: false,
      response: NextResponse.json({
        success: false,
        error: 'Authentication required. Please log in to use this tool.'
      }, { status: 401 })
    }
  }
  
  // Check credits
  const creditCheck = await checkCredits(userId, toolId, params)
  if (!creditCheck.hasEnough) {
    return {
      success: false,
      response: NextResponse.json({
        success: false,
        error: `Insufficient credits. This tool costs ${creditCheck.cost} credits, but you have ${creditCheck.currentBalance}.`,
        creditInfo: creditCheck
      }, { status: 402 })
    }
  }
  
  // Deduct credits before generation
  const deductResult = await deductCredits(userId, toolId, params)
  if (!deductResult.success) {
    return {
      success: false,
      response: NextResponse.json({
        success: false,
        error: deductResult.error || 'Failed to process credits'
      }, { status: 402 })
    }
  }
  
  try {
    // Run the generation function
    const result = await generateFn()
    
    // Complete transaction on success
    await completeTransaction(deductResult.transactionId)
    
    return {
      success: true,
      result,
      creditsUsed: creditCheck.cost,
      remainingCredits: deductResult.newBalance,
      transactionId: deductResult.transactionId
    }
  } catch (error) {
    // Refund on failure
    await refundCredits(deductResult.transactionId, error.message || 'Generation failed')
    throw error
  }
}

// Export default costs for reference
export { DEFAULT_CREDIT_COSTS, VIDEO_TOOLS_WITH_DURATION_SCALING, BASE_VIDEO_DURATION }
