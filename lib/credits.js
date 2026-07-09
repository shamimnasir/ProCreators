// Credit System Library
// Handles credit deduction, refund, and balance management
//
// CREDIT SYSTEM v3 (Feb 2026 — Seedance 2 + Kling Pro repricing)
// ───────────────────────────────────────────────────────────────
// 1 credit = $0.02 revenue | Target margin = 30% across video tools
// Formula: credits = ceil(api_cost_usd / 0.014)  (cost / 0.7 / 0.02)
//
// Verified fal.ai prices (Feb 2026):
//   • Seedance 2.0 Fast (T2V/I2V) 720p:  $0.2419/sec  ⇒ ~18 cr/sec
//   • Seedance 2.0 Fast Reference 720p:  $0.1452/sec  ⇒ ~11 cr/sec
//   • Kling Avatar v2 Pro:               $0.115/sec   ⇒ ~9  cr/sec
//   • Kling Avatar v2 Standard:          $0.0562/sec  ⇒ ~5  cr/sec
//   • Kling 3.0 Pro (fallback only):     $0.168/sec   ⇒ ~12 cr/sec
//   • Veo 3.1:                           $0.20/sec    ⇒ ~15 cr/sec
//   • Wan 2.2:                           $0.05/sec    ⇒ ~4  cr/sec
//   • Pixverse v5.5:                     $0.008/sec   ⇒ ~1  cr/sec
//
// Margins by category:
// - Text tools (Gemini):           ~96% margin (API ~$0.001/call)
// - Image tools (Nano Banana Pro): ~50% margin ($0.15/image)
// - AI Video (Seedance 2/Kling):   30% margin  (per-second fal.ai billing)
// - Stock video (Pexels):          ~80% margin (free API + TTS cost)
// - Digital products (text):       ~99% margin (pure text generation)

import { connectToDatabase } from './mongodb'
import { v4 as uuidv4 } from 'uuid'

// ============= PRICING CONSTANTS =============
// 1 credit ≈ $0.02 (simplified from old system where 1 credit = $0.001)
const CREDIT_VALUE = 0.02

// Reference API Costs (in USD) — for margin calculations only
// Verified from fal.ai pricing pages (Feb 2026)
const API_COSTS = {
  GEMINI_TEXT_SHORT: 0.0005,            // Gemini 2.0 Flash ~500+1000 tokens
  GEMINI_TEXT_MEDIUM: 0.001,
  GEMINI_TEXT_LONG: 0.002,
  IMAGE_SINGLE: 0.15,                   // Nano Banana Pro via Google API
  VIDEO_SEEDANCE2_FAST_PER_SEC: 0.2419, // Seedance 2.0 Fast 720p T2V/I2V (PRIMARY)
  VIDEO_SEEDANCE2_REF_PER_SEC: 0.1452,  // Seedance 2.0 Fast Reference 720p
  VIDEO_KLING_AVATAR_PRO_PER_SEC: 0.115,    // Kling Avatar v2 Pro
  VIDEO_KLING_AVATAR_STD_PER_SEC: 0.0562,   // Kling Avatar v2 Standard
  VIDEO_KLING3_PRO_PER_SEC: 0.168,      // Kling 3.0 Pro (fallback only)
  VIDEO_KLING25_PER_SEC: 0.07,          // Kling 2.5 Turbo Pro (legacy)
  VIDEO_WAN_PER_SEC: 0.05,              // Wan 2.2 via fal.ai
  VIDEO_PIXVERSE_PER_SEC: 0.008,        // Pixverse v5.5 via fal.ai
  VIDEO_VEO_PER_SEC: 0.20,              // Veo 3.1 via fal.ai
  VIDEO_LTX_PER_SEC: 0.01,              // LTX 2.3 via fal.ai
  TTS_PER_1000_CHARS: 0.016,            // Google WaveNet TTS
  ELEVENLABS_PER_1000_CHARS: 0.30,
  PEXELS_VIDEO: 0,                      // Free
}

// ============= CREDIT COSTS PER TOOL (v3 — Feb 2026, 30% margin) =============
// Video-tool prices were rebuilt from fal.ai pricing for Seedance 2.0 Fast +
// Kling Avatar v2 Pro/Standard. Targets a 30% profit margin
// (revenue = api_cost / 0.7, credits = revenue / 0.02).
const DEFAULT_CREDIT_COSTS = {
  // ============= TEXT GENERATION (1-3 credits) =============
  // API cost ~$0.001, margin ~96%. Simple/Medium/Long tiers.
  'joke-generator': 1,
  'fortune-teller': 1,
  'grammar-checker': 1,
  'citation-generator': 1,
  'love-letter': 2,
  'story-writer': 3,
  'avatar-creator': 2,
  'meme-generator': 2,
  'ad-copy': 2,
  'professional-email': 2,
  'blog-creator': 3,
  'linkedin-posts': 2,
  'landing-page-copy': 3,
  'email-campaigns': 2,
  'marketing-strategy': 3,
  'cover-letter': 2,
  'resume-builder': 3,
  'interview-prep': 2,
  'salary-negotiator': 2,
  'networking-message': 2,
  'job-matcher': 2,
  'essay-helper': 3,
  'study-notes': 2,
  'exam-prep': 3,
  'lesson-planner': 3,
  'ai-humanizer': 2,
  'content-humanizer': 2,
  'youtube-creator': 3,
  
  // ============= DIGITAL PRODUCTS — TEXT-ONLY (5-15 credits) =============
  // Sellable products ($5-$150), priced by value delivered
  'checklist-maker': 5,            // Sells $3-$10
  'worksheet-maker': 5,            // Sells $5-$20
  'quiz-maker': 5,                 // Sells $5-$20
  'learning-cards': 5,             // Sells $5-$15
  'flashcards': 5,                 // Alias
  'swot-analysis': 5,              // Sells $10-$30
  'planner-maker': 8,              // Sells $10-$30
  'journal-maker': 8,              // Sells $10-$25
  'notion-templates': 8,           // Sells $10-$40
  'guide-maker': 10,               // Sells $5-$30
  // Sprint 2: new high-revenue publisher tools
  'ai-prompt-pack': 8,             // Sells $9-$99 (biggest new category)
  'recipe-book': 10,               // Sells $9-$49 (evergreen KDP)
  'spreadsheet-template': 8,       // Sells $15-$50 (top Gumroad category)
  'wedding-suite': 12,             // Sells $25-$65 (Etsy premium, 95% margins)
  'puzzle-book': 8,                // Sells $6-$19 (themed puzzles outsell 4:1)
  'slides-maker': 12,              // Sells $15-$40
  'business-plan': 15,             // Sells $20-$100
  'pitch-deck': 15,                // Sells $25-$150
  
  // ============= DIGITAL PRODUCTS — WITH IMAGES (100-400 credits) =============
  // Multiple AI images generated. Cost = ~$0.15/image via Nano Banana Pro
  'ebook-maker': 100,              // ~5 images → API ~$0.75, revenue $2.00, margin 62%
  'recipe-book': 120,              // ~7 images → API ~$1.05, revenue $2.40, margin 56%
  'storybook-maker': 200,          // ~10 images → API ~$1.50, revenue $4.00, margin 62%
  'activity-book': 250,            // ~15 images → API ~$2.25, revenue $5.00, margin 55%
  'coloring-book': 400,            // ~25 images → API ~$3.75, revenue $8.00, margin 53%
  
  // ============= SINGLE IMAGE GENERATION (15 credits) =============
  // Nano Banana Pro @ $0.15/image. Revenue $0.30, margin ~50%
  'image-editor': 15,
  'cover-image-creator': 15,
  'podcast-cover-maker': 15,
  'thumbnail-maker': 15,
  'photo-cards': 15,
  'carousels': 50,                 // 10 credits/slide × 5 slides

  // ============= VIDEO — STOCK (2-3 credits) =============
  // Pexels = free. Only TTS + processing cost (~$0.008)
  'quick-reels': 3,
  'quick-reels-stock': 3,
  'auto-subtitles': 2,
  
  // ============= VIDEO — AI GENERATION (per 30s base, 30% margin) =============
  // Default engine = Seedance 2.0 Fast (720p) at $0.2419/sec → ~18 cr/sec
  // 30s × $0.2419 = $7.257 cost → revenue $10.367 → 519 credits → 520
  'ai-video-studio': 520,         // Seedance 2 default 30s, 30% margin
  'story-reels': 520,
  'auto-reels': 520,
  'auto-longform': 800,           // Longer/multi-clip — extra processing buffer
  'talking-head': 520,            // Default talking head (ai-video-studio engine)
  'transformation-video': 520,
  'script-to-ad': 520,
  
  // AI Video Model-Specific Tiers (per 30s, 30% margin)
  'quick-reels-ai-essential': 20,    // Pixverse $0.008/s × 30s = $0.24 → 18 cr (rounded up)
  'quick-reels-ai-standard': 110,    // Wan 2.2 $0.05/s × 30s = $1.50 → 108 cr
  'quick-reels-ai-seedance': 520,    // Seedance 2.0 Fast (DEFAULT) — $0.2419/s
  'quick-reels-ai-professional': 150,// Kling 2.5 Pro $0.07/s × 30s = $2.10 → 150 cr
  'quick-reels-ai-cinema': 430,      // Veo 3.1 $0.20/s × 30s = $6.00 → 429 cr
  'quick-reels-ai-wan': 110,         // Wan 2.2 alias
  'quick-reels-ai-ltx': 25,          // LTX 2.3 $0.01/s × 30s = $0.30 → 22 cr
  
  // ============= AUDIO (2-25 credits) =============
  'audio-editor': 2,
  'noise-remover': 2,
  'voice-enhancer': 2,
  'voice-clone': 25,               // ElevenLabs API
  
  // ============= UGC AD STUDIO (per generation, 30% margin) =============
  // Base = 30s for consistency with BASE_VIDEO_DURATION. Tools are in
  // VIDEO_TOOLS_WITH_DURATION_SCALING so they scale linearly with audio length.
  // Min UGC ad = 15s → 50% of base. So Pro 15s = 125 cr, Standard 15s = 63 cr.
  // B-roll defaults to 8s clip via Seedance 2.0 Fast (flat).
  'ugc-talking-head-standard': 125, // Kling Avatar v2 Std $0.0562/s × 30s = $1.686 → 121 cr (15s = 63)
  'ugc-talking-head-pro': 250,      // Kling Avatar v2 Pro $0.115/s × 30s = $3.45  → 247 cr (15s = 125)
  'ugc-broll': 140,                 // Seedance 2 Fast 8s → $1.94 → 139 cr
  'ugc-script': 3,                  // Script generation (Gemini text)
  'ugc-avatar-generate': 15,        // AI avatar generation (image)
  
  // Default
  'default': 2
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
  'quick-reels-ai-seedance',
  'quick-reels-ai-wan',
  'quick-reels-ai-ltx',
  'transformation-video',
  'script-to-ad',
  'talking-head',
  // UGC tools — audio length drives the actual fal.ai cost
  'ugc-talking-head-pro',
  'ugc-talking-head-standard'
]

// Base duration for video pricing (30 seconds = base cost)
const BASE_VIDEO_DURATION = 30

// Get credit cost for a tool
export async function getToolCreditCost(toolId, params = {}) {
  try {
    const { db } = await connectToDatabase()
    
    // Check for custom pricing in database
    const customPricing = await db.collection('credit_pricing').findOne(
      { _id: 'tool-pricing' },
      { projection: { tools: 1 } }
    )
    
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
    let user = await db.collection('users').findOne(
      { _id: userId },
      { projection: { credits: 1, membershipCredits: 1, purchasedCredits: 1, plan: 1, role: 1, freeCreditsExpiry: 1 } }
    )
    
    // Auto-initialize user with free credits if they don't exist
    if (!user) {
      const initialCredits = 25 // Free starter credits (enough to try several tools)
      const expiryDate = new Date()
      expiryDate.setDate(expiryDate.getDate() + 30) // Expires in 30 days (was 7)
      
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
  const user = await db.collection('users').findOne(
    { _id: userId },
    { projection: { membershipCredits: 1, purchasedCredits: 1, role: 1 } }
  )
  
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

// Partial refund credits (on cancellation with some work done)
export async function partialRefundCredits(transactionId, refundAmount, reason = 'Partial cancellation') {
  const { db } = await connectToDatabase()
  
  const transaction = await db.collection('credit_transactions').findOne({ _id: transactionId })
  
  if (!transaction) {
    return { success: false, error: 'Transaction not found' }
  }
  
  if (transaction.status !== 'pending') {
    return { success: false, error: 'Transaction already processed' }
  }
  
  const originalCost = Math.abs(transaction.amount)
  const actualCharge = originalCost - refundAmount
  
  // Update transaction with partial refund
  await db.collection('credit_transactions').updateOne(
    { _id: transactionId },
    { 
      $set: { 
        status: 'partial_refund',
        originalAmount: transaction.amount,
        actualCharge: actualCharge,
        refundAmount: refundAmount,
        refundReason: reason,
        completedAt: new Date()
      }
    }
  )
  
  // Refund partial credits to user
  if (refundAmount > 0) {
    await db.collection('users').updateOne(
      { _id: transaction.userId },
      { 
        $inc: { 
          credits: refundAmount,
          totalCreditsUsed: -refundAmount
        }
      }
    )
  }
  
  return {
    success: true,
    refundedAmount: refundAmount,
    chargedAmount: actualCharge,
    reason
  }
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
    .find(
      { userId },
      { projection: { _id: 1, amount: 1, toolId: 1, status: 1, type: 1, reason: 1, createdAt: 1, completedAt: 1 } }
    )
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
// SECURITY: Returns null if not authenticated - no demo user fallback
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
    }
    
    // Method 2: Fallback to next/headers if cookie header parsing didn't work
    if (!sessionToken) {
      try {
        const { cookies } = await import('next/headers')
        const cookieStore = await cookies()
        sessionToken = cookieStore.get('session_token')?.value
      } catch (e) {
        // Silently fail - not all contexts support next/headers
      }
    }
    
    const { db } = await connectToDatabase()
    
    if (sessionToken) {
      const session = await db.collection('sessions').findOne({ 
        token: sessionToken,
        expiresAt: { $gt: new Date() }
      })
      if (session?.userId) return session.userId
    }
    
    // Check Authorization header
    const authHeader = request.headers.get('Authorization')
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7)
      if (token && token !== 'null' && token !== 'undefined') {
        const session = await db.collection('sessions').findOne({ 
          token,
          expiresAt: { $gt: new Date() }
        })
        if (session?.userId) return session.userId
      }
    }
    
    // SECURITY: Return null instead of demo user - require authentication
    return null
  } catch (error) {
    console.error('Error getting user from request:', error)
    return null  // Return null on error - no demo user fallback
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
