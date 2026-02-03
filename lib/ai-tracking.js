// AI Generation Wrapper with Cost Tracking
// Wraps AI API calls and automatically tracks costs

import { trackApiCost, API_COSTS } from './cost-tracking'
import { connectToDatabase } from './mongodb'

// Token estimation (rough estimate for cost tracking)
export function estimateTokens(text) {
  if (!text) return 0
  // Rough estimate: 1 token ≈ 4 characters for English
  return Math.ceil(text.length / 4)
}

// Calculate cost based on provider and usage
export function calculateCost(provider, model, usage) {
  const modelCosts = API_COSTS[model] || API_COSTS['gpt-4o-mini']
  
  let cost = 0
  
  if (usage.inputTokens && usage.outputTokens) {
    // Text generation
    const inputCost = (usage.inputTokens / 1000) * (modelCosts.input || 0.00015)
    const outputCost = (usage.outputTokens / 1000) * (modelCosts.output || 0.0006)
    cost = inputCost + outputCost
  } else if (usage.imageCount) {
    // Image generation
    cost = usage.imageCount * (modelCosts.perImage || modelCosts.standard || 0.04)
  } else if (usage.videoSeconds) {
    // Video generation
    cost = usage.videoSeconds * (modelCosts.perSecond || 0.05)
  } else if (usage.audioMinutes) {
    // Audio processing
    cost = usage.audioMinutes * (modelCosts.perMinute || 0.006)
  } else if (usage.characters) {
    // TTS
    cost = usage.characters * (modelCosts.perChar || 0.000015)
  }
  
  return cost
}

// Wrapper for text generation with cost tracking
export async function generateWithTracking({
  toolId,
  userId,
  transactionId,
  provider = 'google',
  model = 'gemini-flash',
  inputText,
  outputText,
  creditsCharged = 0,
  metadata = {}
}) {
  const inputTokens = estimateTokens(inputText)
  const outputTokens = estimateTokens(outputText)
  
  const actualCostUSD = calculateCost(provider, model, {
    inputTokens,
    outputTokens
  })
  
  // Track the cost
  await trackApiCost({
    toolId,
    userId,
    transactionId,
    provider,
    model,
    inputTokens,
    outputTokens,
    actualCostUSD,
    creditsCharged
  })
  
  return {
    inputTokens,
    outputTokens,
    actualCostUSD,
    creditsCharged,
    margin: creditsCharged > 0 ? ((creditsCharged * 0.01) - actualCostUSD) / (creditsCharged * 0.01) * 100 : 0
  }
}

// Wrapper for image generation with cost tracking
export async function trackImageGeneration({
  toolId,
  userId,
  transactionId,
  provider = 'openai',
  model = 'dall-e-3',
  imageCount = 1,
  quality = 'standard',
  creditsCharged = 0
}) {
  const modelCosts = API_COSTS[model] || { standard: 0.04, hd: 0.08 }
  const costPerImage = quality === 'hd' ? (modelCosts.hd || 0.08) : (modelCosts.standard || modelCosts.perImage || 0.04)
  const actualCostUSD = imageCount * costPerImage
  
  await trackApiCost({
    toolId,
    userId,
    transactionId,
    provider,
    model,
    imageCount,
    actualCostUSD,
    creditsCharged
  })
  
  return { imageCount, actualCostUSD, creditsCharged }
}

// Wrapper for video generation with cost tracking
export async function trackVideoGeneration({
  toolId,
  userId,
  transactionId,
  provider = 'runway',
  model = 'runway-gen2',
  videoSeconds = 15,
  creditsCharged = 0
}) {
  const modelCosts = API_COSTS[model] || { perSecond: 0.05 }
  const actualCostUSD = videoSeconds * (modelCosts.perSecond || 0.05)
  
  await trackApiCost({
    toolId,
    userId,
    transactionId,
    provider,
    model,
    videoSeconds,
    actualCostUSD,
    creditsCharged
  })
  
  return { videoSeconds, actualCostUSD, creditsCharged }
}

// Wrapper for audio/TTS with cost tracking
export async function trackAudioGeneration({
  toolId,
  userId,
  transactionId,
  provider = 'elevenlabs',
  model = 'elevenlabs',
  characters = 0,
  audioMinutes = 0,
  creditsCharged = 0
}) {
  const modelCosts = API_COSTS[model] || { perChar: 0.00003, perMinute: 0.006 }
  let actualCostUSD = 0
  
  if (characters > 0) {
    actualCostUSD = characters * (modelCosts.perChar || 0.00003)
  } else if (audioMinutes > 0) {
    actualCostUSD = audioMinutes * (modelCosts.perMinute || 0.006)
  }
  
  await trackApiCost({
    toolId,
    userId,
    transactionId,
    provider,
    model,
    characters,
    audioMinutes,
    actualCostUSD,
    creditsCharged
  })
  
  return { characters, audioMinutes, actualCostUSD, creditsCharged }
}

// Quick helper to track any generation
export async function quickTrack(toolId, userId, transactionId, creditsCharged, costEstimate) {
  await trackApiCost({
    toolId,
    userId,
    transactionId,
    provider: 'mixed',
    model: 'estimated',
    actualCostUSD: costEstimate,
    creditsCharged
  })
}

// Get tool's current credit cost from database or defaults
export async function getToolCost(toolId) {
  try {
    const { db } = await connectToDatabase()
    const pricing = await db.collection('credit_pricing').findOne({ _id: 'tool-pricing' })
    
    if (pricing?.tools?.[toolId]?.credits) {
      return pricing.tools[toolId].credits
    }
  } catch (e) {
    // Fall through to defaults
  }
  
  // Default costs
  const defaults = {
    // Text (low cost)
    'joke-generator': 8,
    'fortune-teller': 8,
    'ad-copy': 15,
    'professional-email': 10,
    'linkedin-posts': 10,
    
    // PDF/Document (medium)
    'ebook-maker': 40,
    'business-plan': 35,
    'slides-maker': 30,
    
    // Image (medium-high)
    'cover-image-creator': 30,
    'thumbnail-maker': 25,
    
    // Video (high)
    'ai-video-studio': 80,
    'quick-reels': 70,
    'story-reels': 75,
    
    // Default
    'default': 20
  }
  
  return defaults[toolId] || defaults.default
}
