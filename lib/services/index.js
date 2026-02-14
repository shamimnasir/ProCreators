// Centralized API Services - Single source of truth for all external API integrations
// All API keys are loaded from environment variables only

import Stripe from 'stripe'
import { GoogleGenerativeAI } from '@google/generative-ai'

// ============= SINGLETON INSTANCES =============
let stripeInstance = null
let geminiInstance = null

// ============= STRIPE =============
export const getStripe = () => {
  if (!stripeInstance) {
    const key = process.env.STRIPE_API_KEY
    if (!key) throw new Error('STRIPE_API_KEY not configured')
    stripeInstance = new Stripe(key)
  }
  return stripeInstance
}

export const isStripeConfigured = () => !!process.env.STRIPE_API_KEY

// ============= GOOGLE GEMINI =============
export const getGemini = () => {
  if (!geminiInstance) {
    // Prefer GOOGLE_API_KEY over EMERGENT_LLM_KEY for direct Google API calls
    const key = process.env.GOOGLE_API_KEY || process.env.EMERGENT_LLM_KEY
    if (!key) throw new Error('GOOGLE_API_KEY or EMERGENT_LLM_KEY not configured')
    geminiInstance = new GoogleGenerativeAI(key)
  }
  return geminiInstance
}

export const getGeminiModel = (modelName = 'gemini-2.0-flash') => {
  return getGemini().getGenerativeModel({ model: modelName })
}

export const isGeminiConfigured = () => !!(process.env.GOOGLE_API_KEY || process.env.EMERGENT_LLM_KEY)

// ============= REPLICATE =============
const REPLICATE_BASE_URL = 'https://api.replicate.com/v1'

export const getReplicateKey = () => {
  const key = process.env.REPLICATE_API_TOKEN
  if (!key) throw new Error('REPLICATE_API_TOKEN not configured')
  return key
}

export const isReplicateConfigured = () => !!process.env.REPLICATE_API_TOKEN

export const replicatePredict = async (model, input) => {
  const key = getReplicateKey()
  const response = await fetch(`${REPLICATE_BASE_URL}/predictions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${key}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ version: model, input })
  })
  
  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Replicate API error: ${error}`)
  }
  
  return response.json()
}

export const replicateGetStatus = async (predictionId) => {
  const key = getReplicateKey()
  const response = await fetch(`${REPLICATE_BASE_URL}/predictions/${predictionId}`, {
    headers: { 'Authorization': `Bearer ${key}` }
  })
  
  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Replicate status error: ${error}`)
  }
  
  return response.json()
}

export const replicateWaitForResult = async (predictionId, maxAttempts = 60, delayMs = 2000) => {
  for (let i = 0; i < maxAttempts; i++) {
    const status = await replicateGetStatus(predictionId)
    if (status.status === 'succeeded') return status
    if (status.status === 'failed') throw new Error(status.error || 'Prediction failed')
    await new Promise(r => setTimeout(r, delayMs))
  }
  throw new Error('Prediction timeout')
}

// ============= PEXELS =============
const PEXELS_BASE_URL = 'https://api.pexels.com'

export const getPexelsKey = () => {
  const key = process.env.PEXELS_API_KEY
  if (!key) throw new Error('PEXELS_API_KEY not configured')
  return key
}

export const isPexelsConfigured = () => !!process.env.PEXELS_API_KEY

export const searchPexelsVideos = async (query, options = {}) => {
  const { perPage = 3, orientation = 'portrait' } = options
  const key = getPexelsKey()
  
  const url = `${PEXELS_BASE_URL}/videos/search?query=${encodeURIComponent(query)}&per_page=${perPage}&orientation=${orientation}`
  const response = await fetch(url, {
    headers: { 'Authorization': key }
  })
  
  if (!response.ok) throw new Error('Pexels API error')
  return response.json()
}

export const searchPexelsPhotos = async (query, options = {}) => {
  const { perPage = 10 } = options
  const key = getPexelsKey()
  
  const url = `${PEXELS_BASE_URL}/v1/search?query=${encodeURIComponent(query)}&per_page=${perPage}`
  const response = await fetch(url, {
    headers: { 'Authorization': key }
  })
  
  if (!response.ok) throw new Error('Pexels API error')
  return response.json()
}

// ============= SHOTSTACK =============
export const getShotstackConfig = () => {
  const apiKey = process.env.SHOTSTACK_API_KEY
  if (!apiKey) throw new Error('SHOTSTACK_API_KEY not configured')
  
  const isProduction = process.env.SHOTSTACK_ENV === 'production'
  const baseUrl = isProduction 
    ? 'https://api.shotstack.io/create/v1'
    : 'https://api.shotstack.io/create/stage'
  
  return { apiKey, baseUrl, isProduction }
}

export const isShotstackConfigured = () => !!process.env.SHOTSTACK_API_KEY

// ============= MAILGUN =============
export const getMailgunConfig = () => {
  const apiKey = process.env.MAILGUN_API_KEY
  if (!apiKey) throw new Error('MAILGUN_API_KEY not configured')
  
  return {
    apiKey,
    domain: process.env.MAILGUN_DOMAIN || 'sandbox.mailgun.org',
    fromEmail: process.env.FROM_EMAIL || `ProCreators <noreply@${process.env.MAILGUN_DOMAIN || 'sandbox.mailgun.org'}>`
  }
}

export const isMailgunConfigured = () => !!process.env.MAILGUN_API_KEY

// ============= CONFIG STATUS =============
export const getServicesStatus = () => ({
  stripe: isStripeConfigured(),
  gemini: isGeminiConfigured(),
  replicate: isReplicateConfigured(),
  pexels: isPexelsConfigured(),
  shotstack: isShotstackConfigured(),
  mailgun: isMailgunConfigured()
})
