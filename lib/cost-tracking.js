// Cost Tracking & Dynamic Pricing System
// Tracks actual API costs and can auto-adjust credit pricing to maintain margins

import { connectToDatabase } from './mongodb'
import { v4 as uuidv4 } from 'uuid'

// Base API costs per provider (in USD) - UPDATE THESE AS PRICES CHANGE
export const API_COSTS = {
  // OpenAI
  'gpt-4o': { input: 0.005, output: 0.015 },           // per 1K tokens
  'gpt-4o-mini': { input: 0.00015, output: 0.0006 },   // per 1K tokens
  'gpt-3.5-turbo': { input: 0.0005, output: 0.0015 },  // per 1K tokens
  'dall-e-3': { standard: 0.04, hd: 0.08 },            // per image
  'dall-e-2': { perImage: 0.02 },                       // per image
  'whisper': { perMinute: 0.006 },                      // per minute
  'tts-1': { perChar: 0.000015 },                       // per character
  'tts-1-hd': { perChar: 0.00003 },                     // per character
  
  // Anthropic Claude
  'claude-3-opus': { input: 0.015, output: 0.075 },    // per 1K tokens
  'claude-3-sonnet': { input: 0.003, output: 0.015 },  // per 1K tokens
  'claude-3-haiku': { input: 0.00025, output: 0.00125 }, // per 1K tokens
  
  // Google
  'gemini-pro': { input: 0.00025, output: 0.0005 },    // per 1K tokens
  'gemini-flash': { input: 0.000075, output: 0.0003 }, // per 1K tokens
  
  // Image Generation
  'fal-flux': { perImage: 0.025 },                      // per image
  'replicate-sdxl': { perImage: 0.0023 },              // per image
  'midjourney': { perImage: 0.01 },                     // estimated
  
  // Video Generation
  'runway-gen2': { perSecond: 0.05 },                  // per second
  'pika': { perSecond: 0.04 },                          // per second
  'heygen': { perMinute: 1.00 },                        // per minute
  
  // Audio/Voice
  'elevenlabs': { perChar: 0.00003 },                  // per character
  'murf': { perChar: 0.000025 },                        // per character
}

// Estimated average usage per tool category
const TOOL_COST_ESTIMATES = {
  // Text tools - typically 500-2000 tokens
  'text-simple': {
    models: ['gpt-4o-mini'],
    avgTokens: 800,
    estimatedCost: 0.0005 // ~$0.0005 per generation
  },
  'text-complex': {
    models: ['gpt-4o'],
    avgTokens: 2000,
    estimatedCost: 0.04 // ~$0.04 per generation
  },
  
  // Image tools
  'image-generation': {
    models: ['dall-e-3', 'fal-flux'],
    estimatedCost: 0.04 // ~$0.04 per image
  },
  
  // Video tools
  'video-short': {
    models: ['runway-gen2'],
    avgSeconds: 15,
    estimatedCost: 0.75 // ~$0.75 per 15-sec video
  },
  'video-long': {
    models: ['runway-gen2'],
    avgSeconds: 60,
    estimatedCost: 3.00 // ~$3.00 per 60-sec video
  },
  
  // Audio tools
  'voice-synthesis': {
    models: ['elevenlabs', 'tts-1'],
    avgChars: 1000,
    estimatedCost: 0.03 // ~$0.03 per 1000 chars
  }
}

// Tool to category mapping
const TOOL_CATEGORIES = {
  // Text Simple
  'joke-generator': 'text-simple',
  'fortune-teller': 'text-simple',
  'love-letter': 'text-simple',
  'professional-email': 'text-simple',
  'linkedin-posts': 'text-simple',
  'ad-copy': 'text-simple',
  'grammar-checker': 'text-simple',
  
  // Text Complex
  'story-writer': 'text-complex',
  'blog-creator': 'text-complex',
  'business-plan': 'text-complex',
  'ebook-maker': 'text-complex',
  'lesson-planner': 'text-complex',
  
  // Image Generation
  'cover-image-creator': 'image-generation',
  'podcast-cover-maker': 'image-generation',
  'thumbnail-maker': 'image-generation',
  'photo-cards': 'image-generation',
  'meme-generator': 'image-generation',
  
  // Video
  'quick-reels': 'video-short',
  'ai-video-studio': 'video-long',
  'auto-reels': 'video-short',
  'transformation-video': 'video-short',
  'talking-head': 'video-long',
  
  // Audio
  'voice-enhancer': 'voice-synthesis',
  'noise-remover': 'voice-synthesis',
  'voice-clone': 'voice-synthesis'
}

// Target profit margin (adjustable)
const TARGET_MARGIN = 0.70 // 70% margin target
const MIN_MARGIN = 0.50    // Alert if margin drops below 50%
const CREDIT_VALUE = 0.01  // $0.01 per credit (what user pays)

// Calculate recommended credits based on cost and target margin
export function calculateRecommendedCredits(actualCostUSD, targetMargin = TARGET_MARGIN) {
  // Formula: credits = cost / (creditValue * (1 - targetMargin))
  // If cost is $0.04 and we want 70% margin at $0.01/credit:
  // credits = 0.04 / (0.01 * 0.30) = 13.3 → round to 15
  const minCreditsNeeded = actualCostUSD / (CREDIT_VALUE * (1 - targetMargin))
  return Math.ceil(minCreditsNeeded / 5) * 5 // Round to nearest 5
}

// Track actual API cost for a generation
export async function trackApiCost(data) {
  const { db } = await connectToDatabase()
  
  const record = {
    _id: uuidv4(),
    toolId: data.toolId,
    userId: data.userId,
    transactionId: data.transactionId,
    
    // API details
    provider: data.provider,        // 'openai', 'anthropic', etc.
    model: data.model,              // 'gpt-4o', 'dall-e-3', etc.
    
    // Usage metrics
    inputTokens: data.inputTokens || 0,
    outputTokens: data.outputTokens || 0,
    imageCount: data.imageCount || 0,
    videoSeconds: data.videoSeconds || 0,
    audioMinutes: data.audioMinutes || 0,
    characters: data.characters || 0,
    
    // Costs
    actualCostUSD: data.actualCostUSD,
    creditsCharged: data.creditsCharged,
    revenueUSD: data.creditsCharged * CREDIT_VALUE,
    marginUSD: (data.creditsCharged * CREDIT_VALUE) - data.actualCostUSD,
    marginPercent: ((data.creditsCharged * CREDIT_VALUE) - data.actualCostUSD) / (data.creditsCharged * CREDIT_VALUE) * 100,
    
    createdAt: new Date()
  }
  
  await db.collection('api_cost_tracking').insertOne(record)
  
  // Check if margin is below threshold and create alert
  if (record.marginPercent < MIN_MARGIN * 100) {
    await createMarginAlert(data.toolId, record.marginPercent, data.actualCostUSD, data.creditsCharged)
  }
  
  return record
}

// Create margin alert for admin
async function createMarginAlert(toolId, marginPercent, cost, credits) {
  const { db } = await connectToDatabase()
  
  await db.collection('admin_alerts').insertOne({
    _id: uuidv4(),
    type: 'low_margin',
    severity: marginPercent < 30 ? 'critical' : 'warning',
    toolId,
    message: `Low margin alert: ${toolId} has ${marginPercent.toFixed(1)}% margin (cost: $${cost.toFixed(4)}, charged: ${credits} credits)`,
    recommendedCredits: calculateRecommendedCredits(cost),
    currentCredits: credits,
    resolved: false,
    createdAt: new Date()
  })
}

// Get cost analytics for admin dashboard
export async function getCostAnalytics(period = '30d') {
  const { db } = await connectToDatabase()
  
  const startDate = new Date()
  if (period === '7d') startDate.setDate(startDate.getDate() - 7)
  else if (period === '30d') startDate.setDate(startDate.getDate() - 30)
  else if (period === '90d') startDate.setDate(startDate.getDate() - 90)
  
  // Aggregate by tool
  const toolStats = await db.collection('api_cost_tracking').aggregate([
    { $match: { createdAt: { $gte: startDate } } },
    {
      $group: {
        _id: '$toolId',
        totalGenerations: { $sum: 1 },
        totalCostUSD: { $sum: '$actualCostUSD' },
        totalRevenueUSD: { $sum: '$revenueUSD' },
        avgMarginPercent: { $avg: '$marginPercent' },
        avgCostPerGeneration: { $avg: '$actualCostUSD' }
      }
    },
    { $sort: { totalCostUSD: -1 } }
  ]).toArray()
  
  // Overall stats
  const overallStats = await db.collection('api_cost_tracking').aggregate([
    { $match: { createdAt: { $gte: startDate } } },
    {
      $group: {
        _id: null,
        totalGenerations: { $sum: 1 },
        totalCostUSD: { $sum: '$actualCostUSD' },
        totalRevenueUSD: { $sum: '$revenueUSD' },
        avgMarginPercent: { $avg: '$marginPercent' }
      }
    }
  ]).toArray()
  
  // Get alerts
  const alerts = await db.collection('admin_alerts')
    .find({ resolved: false, type: 'low_margin' })
    .sort({ createdAt: -1 })
    .limit(10)
    .toArray()
  
  return {
    period,
    overall: overallStats[0] || { totalGenerations: 0, totalCostUSD: 0, totalRevenueUSD: 0, avgMarginPercent: 0 },
    byTool: toolStats,
    alerts,
    profitUSD: (overallStats[0]?.totalRevenueUSD || 0) - (overallStats[0]?.totalCostUSD || 0)
  }
}

// Auto-adjust credit pricing based on actual costs (run daily via cron)
export async function autoAdjustPricing(dryRun = true) {
  const { db } = await connectToDatabase()
  
  // Get average costs per tool from last 7 days
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - 7)
  
  const toolCosts = await db.collection('api_cost_tracking').aggregate([
    { $match: { createdAt: { $gte: startDate } } },
    {
      $group: {
        _id: '$toolId',
        avgCost: { $avg: '$actualCostUSD' },
        avgCredits: { $avg: '$creditsCharged' },
        avgMargin: { $avg: '$marginPercent' },
        sampleSize: { $sum: 1 }
      }
    },
    { $match: { sampleSize: { $gte: 10 } } } // Only adjust if we have enough data
  ]).toArray()
  
  const adjustments = []
  
  for (const tool of toolCosts) {
    const recommendedCredits = calculateRecommendedCredits(tool.avgCost)
    const currentCredits = Math.round(tool.avgCredits)
    
    // Only adjust if difference is > 20%
    const difference = Math.abs(recommendedCredits - currentCredits) / currentCredits
    
    if (difference > 0.20) {
      adjustments.push({
        toolId: tool._id,
        currentCredits,
        recommendedCredits,
        avgCost: tool.avgCost,
        currentMargin: tool.avgMargin,
        newMargin: ((recommendedCredits * CREDIT_VALUE) - tool.avgCost) / (recommendedCredits * CREDIT_VALUE) * 100,
        action: recommendedCredits > currentCredits ? 'increase' : 'decrease'
      })
      
      if (!dryRun) {
        // Update pricing in database
        await db.collection('credit_pricing').updateOne(
          { _id: 'tool-pricing' },
          { 
            $set: { 
              [`tools.${tool._id}.credits`]: recommendedCredits,
              [`tools.${tool._id}.lastAutoAdjust`]: new Date(),
              [`tools.${tool._id}.previousCredits`]: currentCredits
            }
          },
          { upsert: true }
        )
      }
    }
  }
  
  // Log the adjustment run
  await db.collection('pricing_adjustment_logs').insertOne({
    _id: uuidv4(),
    runAt: new Date(),
    dryRun,
    adjustmentsCount: adjustments.length,
    adjustments,
    toolsAnalyzed: toolCosts.length
  })
  
  return {
    dryRun,
    adjustments,
    message: dryRun 
      ? `Dry run: ${adjustments.length} tools would be adjusted`
      : `Applied: ${adjustments.length} tools adjusted`
  }
}

// Get pricing recommendations for admin
export async function getPricingRecommendations() {
  const { db } = await connectToDatabase()
  
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - 30)
  
  const toolCosts = await db.collection('api_cost_tracking').aggregate([
    { $match: { createdAt: { $gte: startDate } } },
    {
      $group: {
        _id: '$toolId',
        avgCost: { $avg: '$actualCostUSD' },
        avgCredits: { $avg: '$creditsCharged' },
        avgMargin: { $avg: '$marginPercent' },
        totalGenerations: { $sum: 1 },
        totalRevenue: { $sum: '$revenueUSD' },
        totalCost: { $sum: '$actualCostUSD' }
      }
    },
    { $sort: { totalGenerations: -1 } }
  ]).toArray()
  
  return toolCosts.map(tool => ({
    toolId: tool._id,
    currentCredits: Math.round(tool.avgCredits),
    recommendedCredits: calculateRecommendedCredits(tool.avgCost),
    avgCostUSD: tool.avgCost.toFixed(4),
    currentMargin: tool.avgMargin.toFixed(1) + '%',
    targetMargin: (TARGET_MARGIN * 100).toFixed(0) + '%',
    totalGenerations: tool.totalGenerations,
    totalProfit: (tool.totalRevenue - tool.totalCost).toFixed(2),
    needsAdjustment: Math.abs(calculateRecommendedCredits(tool.avgCost) - Math.round(tool.avgCredits)) / Math.round(tool.avgCredits) > 0.20
  }))
}

// Estimate cost before generation (for preview)
export function estimateCost(toolId, params = {}) {
  const category = TOOL_CATEGORIES[toolId] || 'text-simple'
  const estimate = TOOL_COST_ESTIMATES[category]
  
  let costUSD = estimate?.estimatedCost || 0.01
  
  // Adjust for params
  if (params.videoSeconds && category.includes('video')) {
    costUSD = (params.videoSeconds / 15) * (TOOL_COST_ESTIMATES['video-short'].estimatedCost)
  }
  if (params.imageCount && category === 'image-generation') {
    costUSD = params.imageCount * 0.04
  }
  if (params.wordCount && category.includes('text')) {
    costUSD = (params.wordCount / 500) * estimate.estimatedCost
  }
  
  return {
    estimatedCostUSD: costUSD,
    recommendedCredits: calculateRecommendedCredits(costUSD),
    category
  }
}
