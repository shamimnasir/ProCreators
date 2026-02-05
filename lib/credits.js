// Credit System Library
// Handles credit deduction, refund, and balance management

import { connectToDatabase } from './mongodb'
import { v4 as uuidv4 } from 'uuid'

// Credit costs per tool (can be adjusted from admin)
const DEFAULT_CREDIT_COSTS = {
  // Text Generation (Low cost)
  'joke-generator': 8,
  'fortune-teller': 8,
  'love-letter': 10,
  'story-writer': 15,
  'avatar-creator': 12,
  'meme-generator': 10,
  'ad-copy': 15,
  'professional-email': 10,
  'blog-creator': 20,
  'linkedin-posts': 10,
  
  // PDF Generation (Medium cost)
  'planner-maker': 25,
  'worksheet-maker': 25,
  'coloring-book': 30,
  'journal-maker': 25,
  'checklist-maker': 20,
  'ebook-maker': 40,
  'recipe-book': 30,
  'guide-maker': 35,
  'storybook-maker': 35,
  'activity-book': 30,
  'quiz-maker': 20,
  'learning-cards': 20,
  'slides-maker': 30,
  'notion-templates': 25,
  'business-plan': 35,
  'pitch-deck': 40,
  'swot-analysis': 25,
  
  // Image Generation (Medium-High cost)
  'image-editor': 35,
  'cover-image-creator': 30,
  'podcast-cover-maker': 30,
  'thumbnail-maker': 25,
  'photo-cards': 25,
  'carousels': 30,
  
  // Video Processing (High cost)
  'video-editor': 60,
  'ai-video-studio': 80,
  'quick-reels': 70,
  'auto-subtitles': 40,
  'auto-reels': 80,
  'auto-longform': 100,
  'talking-head': 90,
  'transformation-video': 75,
  'script-to-ad': 85,
  
  // Audio Processing (Medium cost)
  'audio-editor': 30,
  'noise-remover': 25,
  'voice-enhancer': 30,
  'voice-clone': 50,
  
  // Default for unknown tools
  'default': 20
}

// Get credit cost for a tool
export async function getToolCreditCost(toolId, params = {}) {
  try {
    const { db } = await connectToDatabase()
    
    // Check for custom pricing in database
    const customPricing = await db.collection('credit_pricing').findOne({ _id: 'tool-pricing' })
    
    if (customPricing?.tools?.[toolId]?.credits) {
      let cost = customPricing.tools[toolId].credits
      
      // Apply multipliers for video duration/resolution if applicable
      if (params.duration && params.duration > 60) {
        cost = Math.ceil(cost * (params.duration / 60))
      }
      if (params.resolution === '4k') {
        cost = Math.ceil(cost * 1.5)
      }
      
      return cost
    }
    
    return DEFAULT_CREDIT_COSTS[toolId] || DEFAULT_CREDIT_COSTS['default']
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
      const initialCredits = 50 // Free starter credits
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
  if (!user || (user.credits || 0) < cost) {
    return {
      success: false,
      error: 'Insufficient credits',
      required: cost,
      available: user?.credits || 0
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
  
  // Deduct credits
  await db.collection('users').updateOne(
    { _id: userId },
    { 
      $inc: { 
        credits: -cost,
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
    newBalance: (user.credits || 0) - cost
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
export async function initializeFreeCredits(userId, amount = 50) {
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
