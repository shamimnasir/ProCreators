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
  mailgun: isMailgunConfigured(),
  fal: isFalConfigured()
})

// ============= FAL.AI (KLING VIDEO) =============
import { fal } from '@fal-ai/client'

// Track the last configured credentials to detect changes
let lastConfiguredFalKey = null

export const isFalConfigured = () => !!process.env.FAL_KEY

/**
 * Validate FAL API key format.
 * FAL keys should be in format: KEY_ID:KEY_SECRET
 * where KEY_ID is a UUID (36 chars with dashes) and KEY_SECRET is a hex string (32 chars)
 */
const validateFalKeyFormat = (key) => {
  if (!key) return { valid: false, error: 'API key not configured' }
  
  const parts = key.split(':')
  if (parts.length !== 2) {
    return { valid: false, error: 'Invalid key format' }
  }
  
  const [keyId, keySecret] = parts
  
  if (!keyId || keyId.trim().length === 0) {
    return { valid: false, error: 'Invalid key format' }
  }
  
  if (!keySecret || keySecret.trim().length < 16) {
    return { valid: false, error: 'Invalid key format' }
  }
  
  return { valid: true }
}

/**
 * Configure FAL client with fresh credentials from environment.
 * CRITICAL: This must be called before EVERY FAL API call to ensure
 * credentials are always fresh. The FAL client is a singleton that
 * caches credentials, so we need to re-configure it if the env changes.
 * 
 * This fixes the intermittent "Unauthorized" errors that occur when:
 * 1. The server has been running for a while
 * 2. The env variable was updated but the singleton cached old value
 * 3. Next.js hot reload didn't refresh the singleton
 */
export const configureFal = () => {
  const currentKey = process.env.FAL_KEY
  
  if (!currentKey) {
    throw new Error('FAL_KEY not configured')
  }
  
  // Validate key format to catch corruption early
  const validation = validateFalKeyFormat(currentKey)
  if (!validation.valid) {
    console.error('[FAL] Invalid key format:', validation.error)
    if (validation.hint) console.error('[FAL] Hint:', validation.hint)
    throw new Error('Video generation service configuration error. Please contact support.')
  }
  
  // Always reconfigure to ensure fresh credentials
  // This prevents stale singleton issues
  fal.config({ credentials: currentKey })
  
  // Log only when credentials change (for debugging)
  if (lastConfiguredFalKey !== currentKey) {
    lastConfiguredFalKey = currentKey
  }
  
  return true
}

// ============= KLING VIDEO GENERATION SERVICE =============
// Comprehensive video generation with character consistency

// ============= KLING PROMPT ENGINEERING SYSTEM =============
// Based on official Kling AI prompt guides
// Formula: Subject (Description) + Subject Movement + Scene (Description) + Camera + Lighting + Atmosphere

/**
 * KLING PROMPT FORMULA COMPONENTS
 * Reference: https://app.klingai.com/global/quickstart/text-to-video-prompt-guide
 */
const KLING_PROMPT_COMPONENTS = {
  // Camera angles and shots
  cameraShots: {
    establishing: ['wide shot', 'aerial view', 'panoramic view', 'establishing shot'],
    closeUp: ['close-up', 'extreme close-up', 'macro shot', 'detail shot'],
    medium: ['medium shot', 'waist shot', 'mid-shot', 'cowboy shot'],
    wide: ['wide angle', 'full shot', 'long shot', 'ultra-wide'],
    special: ['low-angle shot', 'high-angle shot', 'bird\'s eye view', 'worm\'s eye view', 'over-the-shoulder', 'POV shot', 'tracking shot']
  },
  
  // Lighting techniques
  lighting: {
    natural: ['golden hour lighting', 'sunrise light', 'sunset glow', 'soft daylight', 'harsh midday sun', 'overcast soft light', 'moonlight'],
    dramatic: ['rim lighting', 'backlight silhouette', 'Tyndall effect', 'chiaroscuro', 'dramatic shadows', 'spotlight'],
    ambient: ['ambient lighting', 'atmospheric lighting', 'warm ambient glow', 'cool blue ambient'],
    studio: ['studio lighting', 'three-point lighting', 'soft box lighting', 'beauty lighting', 'product lighting']
  },
  
  // Atmosphere/mood descriptors
  atmosphere: {
    cinematic: ['cinematic', 'film-like', 'movie quality', 'Hollywood style', 'blockbuster look'],
    emotional: ['emotional', 'heartwarming', 'melancholic', 'joyful', 'tense', 'mysterious', 'romantic'],
    style: ['noir style', 'cyberpunk aesthetic', 'vintage look', 'modern minimal', 'epic fantasy', 'documentary style']
  },
  
  // Motion descriptors
  motion: {
    camera: ['camera slowly pans', 'smooth tracking shot', 'dolly zoom', 'steady cam movement', 'gentle camera drift', 'pull back reveal', 'push in close'],
    subject: ['walks slowly', 'runs dynamically', 'stands still', 'turns around', 'gestures expressively', 'subtle movement']
  },
  
  // Technical quality terms
  quality: ['4K quality', '8K cinematic', 'high definition', 'professional quality', 'crisp detail', 'sharp focus', 'shallow depth of field', 'bokeh background']
}

/**
 * Industry/Niche-specific prompt enhancers
 */
const NICHE_PROMPT_ENHANCERS = {
  // Business & Marketing
  business: {
    settings: ['modern office', 'corporate boardroom', 'startup workspace', 'professional studio', 'business district'],
    subjects: ['professional businessperson', 'confident entrepreneur', 'team collaboration', 'executive leader'],
    mood: ['professional', 'innovative', 'trustworthy', 'dynamic', 'successful'],
    camera: ['medium shot', 'professional framing', 'corporate video style']
  },
  
  // Educational / Tutorial
  educational: {
    settings: ['clean studio background', 'modern classroom', 'library setting', 'laboratory', 'whiteboard background'],
    subjects: ['expert presenter', 'teacher figure', 'demonstration hand', 'educational graphics'],
    mood: ['clear', 'informative', 'engaging', 'accessible', 'authoritative'],
    camera: ['clear framing', 'well-lit subject', 'steady shot']
  },
  
  // Storytelling / Entertainment
  storytelling: {
    settings: ['atmospheric environment', 'story-appropriate location', 'immersive backdrop', 'cinematic scene'],
    subjects: ['compelling character', 'emotional expression', 'dramatic pose', 'story protagonist'],
    mood: ['dramatic', 'immersive', 'captivating', 'emotional', 'cinematic'],
    camera: ['cinematic framing', 'dramatic angles', 'movie-like composition']
  },
  
  // Product / E-commerce
  product: {
    settings: ['clean white background', 'product studio', 'minimal backdrop', 'lifestyle setting'],
    subjects: ['product hero shot', 'detailed product view', '360-degree rotation', 'product in use'],
    mood: ['premium', 'elegant', 'desirable', 'professional', 'aspirational'],
    camera: ['product photography style', 'detail close-up', 'smooth rotation', 'beauty lighting']
  },
  
  // Lifestyle / Social Media
  lifestyle: {
    settings: ['trendy location', 'aesthetic background', 'Instagram-worthy spot', 'modern interior'],
    subjects: ['relatable person', 'lifestyle moment', 'authentic scene', 'aspirational figure'],
    mood: ['trendy', 'authentic', 'aspirational', 'relatable', 'vibrant'],
    camera: ['social media framing', 'vertical video style', 'dynamic angles', 'selfie perspective']
  },
  
  // Motivational / Inspiration
  motivational: {
    settings: ['inspiring backdrop', 'achievement scene', 'journey metaphor', 'sunrise/sunset'],
    subjects: ['determined individual', 'success moment', 'overcoming challenge', 'reaching goal'],
    mood: ['inspiring', 'powerful', 'motivating', 'uplifting', 'triumphant'],
    camera: ['heroic angles', 'low-angle power shot', 'epic wide shot', 'dramatic lighting']
  },
  
  // Kids / Family
  kids: {
    settings: ['colorful playground', 'bright nursery', 'nature park', 'family home', 'cartoon-like environment'],
    subjects: ['happy child', 'playful character', 'friendly animal', 'family together'],
    mood: ['joyful', 'playful', 'safe', 'colorful', 'warm'],
    camera: ['child-friendly framing', 'bright colorful shots', 'gentle movement']
  },
  
  // Horror / Thriller
  horror: {
    settings: ['dark corridor', 'abandoned building', 'foggy forest', 'eerie room', 'shadowy location'],
    subjects: ['mysterious figure', 'subtle movement', 'creepy detail', 'ominous presence'],
    mood: ['eerie', 'suspenseful', 'atmospheric', 'mysterious', 'unsettling'],
    camera: ['slow push-in', 'dutch angle', 'shadows play', 'limited visibility']
  },
  
  // Documentary / News
  documentary: {
    settings: ['real-world location', 'authentic environment', 'on-location scene', 'historical site'],
    subjects: ['real person', 'authentic moment', 'documentary subject', 'interview setup'],
    mood: ['authentic', 'factual', 'engaging', 'informative', 'credible'],
    camera: ['documentary style', 'handheld feel', 'interview framing', 'B-roll style']
  }
}

/**
 * Transform simple user input into Kling-optimized prompt
 * Uses Gemini AI to expand and structure the prompt properly
 */
export async function transformToKlingPrompt(userInput, options = {}) {
  const {
    niche = 'general',
    sceneIndex = 0,
    totalScenes = 1,
    characterDescription = null,
    aspectRatio = '9:16',
    duration = 5
  } = options
  
  try {
    const gemini = getGeminiModel('gemini-2.0-flash')
    
    // Get niche-specific enhancers
    const nicheConfig = NICHE_PROMPT_ENHANCERS[niche] || NICHE_PROMPT_ENHANCERS.storytelling
    
    const systemPrompt = `You are an expert AI video prompt engineer specializing in Kling AI video generation.

Your task is to transform a simple user idea into a perfectly structured Kling prompt.

KLING PROMPT FORMULA:
Subject (detailed description) + Subject Movement + Scene (environment) + Camera Language + Lighting + Atmosphere

RULES:
1. Keep prompts under 150 words - Kling works best with concise, specific prompts
2. Use simple, clear language - avoid complex sentences
3. Describe what CAN be seen in 5 seconds of video
4. Include specific visual details (colors, textures, materials)
5. Specify camera angle and movement
6. Include lighting description
7. Add atmosphere/mood keywords
8. For characters: describe appearance in detail (age, clothing, features)
9. For motion: describe simple, achievable movements

NICHE-SPECIFIC GUIDANCE FOR "${niche.toUpperCase()}":
- Settings: ${nicheConfig.settings.join(', ')}
- Subject style: ${nicheConfig.subjects.join(', ')}
- Mood: ${nicheConfig.mood.join(', ')}
- Camera: ${nicheConfig.camera.join(', ')}

${characterDescription ? `CHARACTER TO MAINTAIN: ${characterDescription}` : ''}

${totalScenes > 1 ? `SCENE CONTEXT: This is scene ${sceneIndex + 1} of ${totalScenes}. ${
  sceneIndex === 0 ? 'This is the OPENING scene - establish the character/setting clearly.' :
  sceneIndex === totalScenes - 1 ? 'This is the FINAL scene - conclude the story.' :
  'This is a MIDDLE scene - maintain continuity from previous scenes.'
}` : ''}

ASPECT RATIO: ${aspectRatio} (${aspectRatio === '9:16' ? 'vertical/portrait - frame for mobile' : aspectRatio === '16:9' ? 'horizontal/landscape - frame for cinema' : 'square - balanced framing'})

USER INPUT: "${userInput}"

Transform this into a single, powerful Kling-optimized prompt. Return ONLY the prompt, no explanations.`

    const result = await gemini.generateContent(systemPrompt)
    let optimizedPrompt = result.response.text().trim()
    
    // Clean up any quotes or extra formatting
    optimizedPrompt = optimizedPrompt.replace(/^["']|["']$/g, '').trim()
    
    // Add quality enhancers if not present
    if (!optimizedPrompt.toLowerCase().includes('quality') && !optimizedPrompt.toLowerCase().includes('cinematic')) {
      optimizedPrompt += ', cinematic quality, professional production'
    }
    
    return optimizedPrompt
  } catch (error) {
    console.error('Prompt transformation failed:', error)
    // Fallback: basic enhancement
    return enhancePromptBasic(userInput, niche)
  }
}

/**
 * Basic prompt enhancement fallback (no AI)
 */
function enhancePromptBasic(userInput, niche = 'general') {
  const nicheConfig = NICHE_PROMPT_ENHANCERS[niche] || NICHE_PROMPT_ENHANCERS.storytelling
  
  // Select random elements from each category
  const setting = nicheConfig.settings[Math.floor(Math.random() * nicheConfig.settings.length)]
  const mood = nicheConfig.mood[Math.floor(Math.random() * nicheConfig.mood.length)]
  const camera = nicheConfig.camera[Math.floor(Math.random() * nicheConfig.camera.length)]
  const lighting = KLING_PROMPT_COMPONENTS.lighting.natural[Math.floor(Math.random() * KLING_PROMPT_COMPONENTS.lighting.natural.length)]
  const quality = KLING_PROMPT_COMPONENTS.quality[Math.floor(Math.random() * KLING_PROMPT_COMPONENTS.quality.length)]
  
  return `${userInput}, ${setting}, ${mood} atmosphere, ${camera}, ${lighting}, ${quality}, smooth natural motion`
}

/**
 * Character Consistency Prompt Engineering
 * Adds character anchoring to prompts for better consistency
 */
export function enhancePromptForConsistency(basePrompt, characterDescription = null, sceneIndex = 0, totalScenes = 1) {
  let enhanced = basePrompt
  
  // Add character anchoring if description provided (Kling-optimized)
  if (characterDescription) {
    // Place character description at the START of the prompt (Kling best practice)
    enhanced = `${characterDescription}, ${enhanced}`
  }
  
  // Add Kling-specific consistency instructions
  const consistencyInstructions = [
    'maintains exact same appearance throughout',
    'consistent character identity',
    'stable visual features'
  ]
  
  // Add scene continuity hints (important for multi-clip consistency)
  if (totalScenes > 1) {
    if (sceneIndex === 0) {
      enhanced += ', establishing shot, clearly introduce the character, full figure visible'
    } else if (sceneIndex === totalScenes - 1) {
      enhanced += ', concluding scene, same character as before, continuous story'
    } else {
      enhanced += ', continuous scene, identical character from previous shot'
    }
  }
  
  // Add consistency instruction (keep brief for Kling)
  enhanced += `, ${consistencyInstructions[0]}`
  
  return enhanced
}

/**
 * Extract character description from script/prompt using AI
 * Optimized for Kling's visual requirements
 */
export async function extractCharacterDescription(script) {
  try {
    const gemini = getGeminiModel('gemini-2.0-flash')
    
    const prompt = `Analyze this script and extract a VISUAL character description optimized for AI video generation (Kling AI).

Script: "${script}"

Create a concise character description (50-80 words MAX) that includes ONLY visual attributes:
- Gender and approximate age range
- Ethnicity/appearance style (if specified or implied)
- Hair: color, length, style
- Face: key features only
- Clothing: specific items, colors, style
- Body type/posture (if relevant)

FORMAT: Write as a single descriptive sentence, not a list.
Example: "A young Asian woman in her mid-20s with long black hair, wearing a white blouse and blue jeans, gentle smile"

If no specific character is mentioned, describe a generic but specific person appropriate for the content.
Return ONLY the description, no explanations or labels.`
    
    const result = await gemini.generateContent(prompt)
    return result.response.text().trim()
  } catch (error) {
    console.error('Character extraction failed:', error)
    return null
  }
}

/**
 * Generate scene prompts from script with Kling-optimized format
 * Each scene follows the Kling formula for best results
 */
export async function generateScenePromptsWithConsistency(script, numScenes, characterDescription = null) {
  try {
    const gemini = getGeminiModel('gemini-2.0-flash')
    
    // Extract character if not provided
    const character = characterDescription || await extractCharacterDescription(script)
    
    const prompt = `You are an expert Kling AI prompt engineer. Break this script into ${numScenes} video scene prompts.

SCRIPT: "${script}"

CHARACTER TO MAINTAIN IN EVERY SCENE: "${character || 'appropriate character for the content'}"

KLING PROMPT FORMULA (use for each scene):
[Character Description] + [Character Action/Movement] + [Scene/Environment] + [Camera Shot] + [Lighting] + [Atmosphere]

RULES FOR EACH SCENE:
1. Start with the exact character description
2. Describe ONE simple action (5 seconds of motion)
3. Include specific environment details
4. Specify camera angle (close-up, medium shot, wide shot, etc.)
5. Include lighting (natural light, dramatic shadows, etc.)
6. Keep each prompt under 80 words
7. Use simple, clear language
8. Avoid dialogue - only visual descriptions

SCENE TYPES TO USE:
- Scene 1: Establishing shot (introduce character clearly)
- Middle scenes: Action/story progression
- Final scene: Conclusion/resolution

Generate exactly ${numScenes} prompts, one per line, numbered 1-${numScenes}.
Each prompt must be a complete, standalone Kling-optimized description.`
    
    const result = await gemini.generateContent(prompt)
    const text = result.response.text()
    
    // Parse scenes
    const lines = text.split('\n').filter(l => l.trim())
    const scenes = lines
      .map(l => l.replace(/^\d+[\.\):\-]\s*/, '').trim())
      .filter(l => l.length > 20)
      .slice(0, numScenes)
    
    // Ensure we have enough scenes with proper Kling formatting
    while (scenes.length < numScenes) {
      const baseScene = scenes[scenes.length - 1] || script
      const sceneIndex = scenes.length
      scenes.push(
        `${character || 'The main character'}, continues the action, ${
          sceneIndex === numScenes - 1 ? 'concluding moment' : 'story progression'
        }, medium shot, ambient lighting, cinematic atmosphere`
      )
    }
    
    return {
      scenes,
      characterDescription: character
    }
  } catch (error) {
    console.error('Scene generation failed:', error)
    // Fallback: create basic Kling-formatted scenes
    return createFallbackScenes(script, numScenes, characterDescription)
  }
}

/**
 * Fallback scene generation without AI
 */
function createFallbackScenes(script, numScenes, character = null) {
  const sentences = script.split(/[.!?।]+/).filter(s => s.trim().length > 5)
  const scenes = []
  const scenesPerPart = Math.ceil(sentences.length / numScenes)
  
  const cameraShots = ['establishing wide shot', 'medium shot', 'close-up', 'tracking shot', 'pull back reveal']
  const lighting = ['soft natural light', 'dramatic lighting', 'golden hour glow', 'ambient lighting', 'atmospheric light']
  
  for (let i = 0; i < numScenes; i++) {
    const start = i * scenesPerPart
    const end = Math.min(start + scenesPerPart, sentences.length)
    const sceneText = sentences.slice(start, end).join('. ').substring(0, 200)
    
    const shot = cameraShots[i % cameraShots.length]
    const light = lighting[i % lighting.length]
    
    scenes.push(
      `${character || 'The main character'}, ${sceneText}, ${shot}, ${light}, cinematic quality`
    )
  }
  
  return {
    scenes,
    characterDescription: character
  }
}

/**
 * Kling Video Generation Options
 */
export const KLING_MODELS = {
  // Kling 3.0 (Latest - Native 4K, multi-shot, audio)
  V3_TEXT_TO_VIDEO_PRO: 'fal-ai/kling-video/v3/pro/text-to-video',
  V3_IMAGE_TO_VIDEO_PRO: 'fal-ai/kling-video/v3/pro/image-to-video',
  V3_IMAGE_TO_VIDEO_STANDARD: 'fal-ai/kling-video/v3/standard/image-to-video',
  // Kling 2.5 (Legacy)
  TEXT_TO_VIDEO: 'fal-ai/kling-video/v2.5-turbo/pro/text-to-video',
  TEXT_TO_VIDEO_STANDARD: 'fal-ai/kling-video/v2.5/pro/text-to-video',
  IMAGE_TO_VIDEO: 'fal-ai/kling-video/v1.5/pro/image-to-video',
  IMAGE_TO_VIDEO_STANDARD: 'fal-ai/kling-video/v1/pro/image-to-video',
  // Kling Avatar v2 (talking head with lip-sync)
  AVATAR_V2_PRO: 'fal-ai/kling-video/ai-avatar/v2/pro',
  AVATAR_V2_STANDARD: 'fal-ai/kling-video/ai-avatar/v2/standard'
}

/**
 * Seedance 2.0 Fast Models (ByteDance, launched April 2026)
 * Native audio, real-world physics, camera control, cinematic quality.
 * Per user requirement: PRIMARY video engine across all tools.
 */
export const SEEDANCE2_MODELS = {
  TEXT_TO_VIDEO_FAST: 'bytedance/seedance-2.0/fast/text-to-video',
  IMAGE_TO_VIDEO_FAST: 'bytedance/seedance-2.0/fast/image-to-video',
  REFERENCE_TO_VIDEO_FAST: 'bytedance/seedance-2.0/fast/reference-to-video'
}

/**
 * Shared FAL queue polling helper.
 * Uses short HTTP requests instead of long-lived fal.subscribe connections to avoid
 * "fetch failed" errors from container proxy timeouts.
 */
async function falQueueRun(endpoint, input, label = '', jobId = 'unknown', maxMinutes = 12) {
  configureFal()
  const submission = await fal.queue.submit(endpoint, { input })
  const requestId = submission.request_id
  console.log(`[${jobId}] Queued ${label || endpoint} (request: ${requestId})`)

  const maxPolls = Math.ceil((maxMinutes * 60) / 5)
  for (let i = 0; i < maxPolls; i++) {
    await new Promise(r => setTimeout(r, 5000))
    try {
      const status = await fal.queue.status(endpoint, { requestId, logs: false })
      if (status.status === 'COMPLETED') {
        console.log(`[${jobId}] ${label} completed`)
        return await fal.queue.result(endpoint, { requestId })
      }
      if (status.status === 'FAILED') {
        throw new Error(`${label} failed in queue: ${status.error || 'Unknown error'}`)
      }
      if (i % 6 === 0) {
        console.log(`[${jobId}] ${label} processing... (${Math.round(i * 5 / 60)}min)`)
      }
    } catch (pollErr) {
      if (pollErr.message?.includes('fetch failed') || pollErr.message?.includes('network')) {
        console.warn(`[${jobId}] Poll hiccup for ${label}, retrying...`)
        continue
      }
      throw pollErr
    }
  }
  throw new Error(`${label} timed out after ${maxMinutes} minutes`)
}

/**
 * Extract video URL from various fal response shapes.
 */
function extractVideoUrl(data) {
  if (!data) return null
  return data?.video?.url ||
         data?.output?.url ||
         data?.url ||
         data?.videos?.[0]?.url ||
         (Array.isArray(data?.output) ? data.output[0] : null)
}

/**
 * Generate a video clip with Seedance 2.0 Fast (PRIMARY engine).
 * Auto-routes between text-to-video and image-to-video based on imageUrl input.
 *
 * @param {Object} options
 * @param {string} options.prompt - Scene description
 * @param {string} options.aspectRatio - '16:9', '9:16', '1:1', '4:3', '3:4'
 * @param {string|number} options.duration - Duration in seconds (4-15) or 'auto'
 * @param {number|null} options.seed - Seed for reproducibility
 * @param {string|null} options.imageUrl - Start image (triggers image-to-video mode)
 * @param {string|null} options.endImageUrl - End image for I2V smooth transitions
 * @param {string} options.resolution - '480p' or '720p'
 * @param {string} options.jobId - Job ID for logging
 */
export async function generateSeedance2Clip({
  prompt,
  aspectRatio = '9:16',
  duration = '8',
  seed = null,
  imageUrl = null,
  endImageUrl = null,
  resolution = '720p',
  jobId = 'unknown'
}) {
  configureFal()

  const isImageToVideo = !!imageUrl
  const endpoint = isImageToVideo
    ? SEEDANCE2_MODELS.IMAGE_TO_VIDEO_FAST
    : SEEDANCE2_MODELS.TEXT_TO_VIDEO_FAST

  // Seedance 2 fast supports 4-15 sec or "auto"
  let clampedDuration = duration === 'auto' ? 'auto' : String(Math.max(4, Math.min(15, parseInt(duration) || 8)))

  const input = {
    prompt: `${prompt}, cinematic camera movement, natural depth of field, soft natural lighting, organic motion, shallow focus with subtle bokeh, real-world physics, 4K quality, professional cinematography`,
    duration: clampedDuration,
    resolution: ['480p', '720p'].includes(resolution) ? resolution : '720p',
    aspect_ratio: aspectRatio
  }

  if (seed !== null && seed !== undefined) {
    input.seed = seed
  }

  if (isImageToVideo) {
    input.image_url = imageUrl
    if (endImageUrl) {
      input.end_image_url = endImageUrl
    }
  }

  const label = isImageToVideo ? 'Seedance 2 Fast I2V' : 'Seedance 2 Fast T2V'
  const result = await falQueueRun(endpoint, input, label, jobId, 12)

  const videoUrl = extractVideoUrl(result.data)
  if (!videoUrl) {
    console.error(`[${jobId}] Seedance 2 response:`, JSON.stringify(result.data).slice(0, 500))
    throw new Error('No video URL in Seedance 2 response')
  }

  return {
    url: videoUrl,
    prompt,
    model: endpoint,
    engine: 'seedance-2.0-fast',
    seed: result.data?.seed || seed,
    duration: typeof clampedDuration === 'number' ? clampedDuration : (parseInt(clampedDuration) || null)
  }
}

/**
 * Generate video with Seedance 2.0 Fast Reference-to-Video.
 * Uses up to 9 reference images + up to 3 audio refs to maintain identity/motion consistency.
 * Used primarily for UGC talking-head clips to preserve avatar appearance.
 *
 * @param {Object} options
 * @param {string} options.prompt - Description with @Image1 / @Audio1 refs
 * @param {string[]} options.imageUrls - Reference images (1-9)
 * @param {string[]} options.audioUrls - Reference audio files (0-3)
 * @param {string} options.aspectRatio - '16:9', '9:16', etc.
 * @param {string|number} options.duration - 4-15 sec or 'auto'
 * @param {string} options.resolution - '480p' or '720p'
 * @param {string} options.jobId - Job ID for logging
 */
export async function generateSeedance2ReferenceClip({
  prompt,
  imageUrls = [],
  audioUrls = [],
  aspectRatio = '9:16',
  duration = '8',
  resolution = '720p',
  jobId = 'unknown'
}) {
  configureFal()

  if (!Array.isArray(imageUrls) || imageUrls.length === 0) {
    throw new Error('Seedance 2 reference-to-video requires at least one image_url')
  }

  const trimmedImageUrls = imageUrls.slice(0, 9).filter(Boolean)
  const trimmedAudioUrls = (Array.isArray(audioUrls) ? audioUrls : []).slice(0, 3).filter(Boolean)

  let clampedDuration = duration === 'auto' ? 'auto' : String(Math.max(4, Math.min(15, parseInt(duration) || 8)))

  const input = {
    prompt,
    image_urls: trimmedImageUrls,
    duration: clampedDuration,
    resolution: ['480p', '720p'].includes(resolution) ? resolution : '720p',
    aspect_ratio: aspectRatio
  }

  if (trimmedAudioUrls.length > 0) {
    input.audio_urls = trimmedAudioUrls
  }

  const result = await falQueueRun(
    SEEDANCE2_MODELS.REFERENCE_TO_VIDEO_FAST,
    input,
    'Seedance 2 Fast Reference',
    jobId,
    15
  )

  const videoUrl = extractVideoUrl(result.data)
  if (!videoUrl) {
    console.error(`[${jobId}] Seedance 2 Reference response:`, JSON.stringify(result.data).slice(0, 500))
    throw new Error('No video URL in Seedance 2 Reference response')
  }

  return {
    url: videoUrl,
    model: SEEDANCE2_MODELS.REFERENCE_TO_VIDEO_FAST,
    engine: 'seedance-2.0-fast-reference',
    duration: typeof clampedDuration === 'number' ? clampedDuration : (parseInt(clampedDuration) || null)
  }
}

/**
 * Generate a single video clip with Kling
 */
export async function generateKlingClip({
  prompt,
  aspectRatio = '9:16',
  duration = '5',
  seed = null,
  imageUrl = null, // For image-to-video (frame chaining)
  model = null,
  jobId = 'unknown'
}) {
  configureFal()
  
  const isImageToVideo = !!imageUrl
  const endpoint = model || (isImageToVideo ? KLING_MODELS.IMAGE_TO_VIDEO : KLING_MODELS.TEXT_TO_VIDEO)
  
  const input = {
    prompt,
    aspect_ratio: aspectRatio,
    duration
  }
  
  if (seed !== null) {
    input.seed = seed
  }
  
  if (isImageToVideo && imageUrl) {
    input.image_url = imageUrl
  }
  
  
  try {
    const result = await fal.subscribe(endpoint, {
      input,
      pollInterval: 3000,
      timeout: 300000, // 5 minutes
      onQueueUpdate: (update) => {
        if (update.status === 'IN_PROGRESS') {
        }
      }
    })
    
    // Extract video URL from result
    const videoUrl = result.data?.video?.url || 
                     result.data?.output?.url || 
                     result.data?.url ||
                     (Array.isArray(result.data?.output) ? result.data.output[0] : null)
    
    if (!videoUrl) {
      throw new Error('No video URL in response')
    }
    
    return {
      url: videoUrl,
      prompt,
      model: endpoint,
      seed,
      duration: parseInt(duration)
    }
  } catch (error) {
    console.error(`[${jobId}] Kling clip failed:`, error.message)
    throw error
  }
}

/**
 * Generate a single video clip with Minimax Hailuo
 * Minimax is often faster and cheaper than Kling, with good quality
 */
export async function generateMinimaxClip({
  prompt,
  aspectRatio = '9:16',
  jobId = 'unknown'
}) {
  configureFal()
  
  // Minimax video-01 endpoint
  const endpoint = 'fal-ai/minimax/video-01'
  
  // Minimax uses different aspect ratio format or prompt embedding
  // It typically generates ~5-6 second clips
  const enhancedPrompt = `${prompt}, high quality, cinematic, smooth motion`
  
  
  try {
    const result = await fal.subscribe(endpoint, {
      input: {
        prompt: enhancedPrompt,
        prompt_optimizer: true // Enable prompt optimization for better results
      },
      pollInterval: 5000,
      timeout: 300000, // 5 minutes
      onQueueUpdate: (update) => {
        if (update.status === 'IN_PROGRESS') {
        }
      }
    })
    
    // Extract video URL from result
    const videoUrl = result.data?.video?.url || 
                     result.data?.output?.url || 
                     result.data?.url
    
    if (!videoUrl) {
      throw new Error('No video URL in response')
    }
    
    return {
      url: videoUrl,
      prompt,
      model: endpoint,
      duration: 6 // Minimax typically generates ~6 second clips
    }
  } catch (error) {
    console.error(`[${jobId}] Minimax clip failed:`, error.message)
    throw error
  }
}

/**
 * Generate a single video clip with Seedance 2.0 Fast (PRIMARY) — wraps generateSeedance2Clip
 * with a Kling 3.0 fallback. Kept for backwards compatibility with callers using the
 * legacy "seedance" videoModel name. Per user requirement: Seedance 2 primary, Kling only fallback.
 *
 * @param {Object} options
 * @param {string} options.prompt - Scene description
 * @param {string} options.aspectRatio - '16:9', '9:16', '1:1', '4:3', '3:4'
 * @param {string} options.duration - Duration in seconds (4-15)
 * @param {number|null} options.seed - Seed for reproducibility
 * @param {string|null} options.imageUrl - Start image for image-to-video
 * @param {string|null} options.endImageUrl - End image for smooth transitions
 * @param {string} options.resolution - '480p' or '720p'
 * @param {string} options.jobId - Job ID for logging
 */
export async function generateSeedanceClip({
  prompt,
  aspectRatio = '9:16',
  duration = '8',
  seed = null,
  imageUrl = null,
  endImageUrl = null,
  resolution = '720p',
  generateAudio = false, // unused with Seedance 2 fast (kept for API compat)
  cameraFixed = false,   // unused (kept for API compat)
  jobId = 'unknown'
}) {
  configureFal()

  // Try Seedance 2.0 Fast first (primary)
  try {
    return await generateSeedance2Clip({
      prompt,
      aspectRatio,
      duration: String(duration),
      seed,
      imageUrl,
      endImageUrl,
      resolution,
      jobId
    })
  } catch (seedance2Error) {
    console.warn(`[${jobId}] Seedance 2.0 Fast failed, falling back to Kling 3.0:`, seedance2Error.message)

    // Fallback: Kling 3.0 Pro (the ONLY fallback)
    const isImageToVideo = !!imageUrl
    const klingEndpoint = isImageToVideo
      ? KLING_MODELS.V3_IMAGE_TO_VIDEO_PRO
      : KLING_MODELS.V3_TEXT_TO_VIDEO_PRO

    const klingDuration = parseInt(duration) <= 7 ? '5' : '10'
    const klingInput = {
      prompt,
      duration: klingDuration,
      aspect_ratio: aspectRatio
    }
    if (seed !== null && seed !== undefined) klingInput.seed = seed
    if (isImageToVideo && imageUrl) klingInput.image_url = imageUrl

    const result = await falQueueRun(klingEndpoint, klingInput, 'Kling 3.0 Pro fallback', jobId, 12)
    const videoUrl = extractVideoUrl(result.data)
    if (!videoUrl) throw new Error('No video URL in Kling 3.0 fallback response')

    return {
      url: videoUrl,
      prompt,
      model: klingEndpoint,
      engine: 'kling-3.0-fallback',
      seed,
      duration: parseInt(klingDuration)
    }
  }
}

/**
 * Generate a single video clip with Wan 2.2 (Alibaba)
 * Good quality, competitive pricing, open source model
 */
export async function generateWanClip({
  prompt,
  aspectRatio = '9:16',
  duration = '5',
  seed = null,
  jobId = 'unknown'
}) {
  configureFal()
  
  const endpoint = 'fal-ai/wan/v2.2-a14b/text-to-video'
  
  // Convert aspect ratio format
  const wanAspectRatio = aspectRatio === '16:9' ? '16:9' : aspectRatio === '1:1' ? '1:1' : '9:16'
  
  // Calculate num_frames based on desired duration
  // At 16fps: 5s = 81 frames, 10s = 161 frames
  const durationSec = parseInt(duration) || 5
  const numFrames = durationSec <= 5 ? 81 : 161
  const actualDuration = durationSec <= 5 ? 5 : 10
  
  const enhancedPrompt = `${prompt}, high quality, cinematic, smooth motion, professional cinematography`
  
  const input = {
    prompt: enhancedPrompt,
    aspect_ratio: wanAspectRatio,
    resolution: '720p',
    num_frames: numFrames,
    frames_per_second: 16,
    num_inference_steps: 27,
    enable_prompt_expansion: true,
    acceleration: 'regular',
    guidance_scale: 3.5,
    interpolator_model: 'film',
    num_interpolated_frames: 1,
    adjust_fps_for_interpolation: true,
    video_quality: 'high',
    video_write_mode: 'balanced'
  }
  
  if (seed) input.seed = seed
  
  try {
    const result = await fal.subscribe(endpoint, {
      input,
      pollInterval: 5000,
      timeout: 600000,
      onQueueUpdate: (update) => {
        if (update.status === 'IN_PROGRESS') {
        }
      }
    })
    
    const videoUrl = result.data?.video?.url
    if (!videoUrl) throw new Error('No video URL in Wan response')
    
    return {
      url: videoUrl,
      prompt,
      model: endpoint,
      duration: actualDuration
    }
  } catch (error) {
    console.error(`[${jobId}] Wan 2.2 clip failed:`, error.message)
    throw error
  }
}

/**
 * Generate a single video clip with LTX Video (open source, fast & budget)
 */
export async function generateLTXClip({
  prompt,
  aspectRatio = '9:16',
  duration = '5',
  seed = null,
  jobId = 'unknown'
}) {
  configureFal()
  
  const endpoint = 'fal-ai/ltx-2.3/text-to-video'
  
  // LTX 2.3 uses width/height — output upscaled to 1080p by model
  const isPortrait = aspectRatio === '9:16'
  const isSquare = aspectRatio === '1:1'
  const width = isPortrait ? 512 : isSquare ? 512 : 768
  const height = isPortrait ? 768 : isSquare ? 512 : 512
  
  const durationSec = parseInt(duration) || 5
  const numFrames = Math.min(durationSec * 25 + 1, 257)
  const actualDuration = Math.min(durationSec, 10)
  
  const enhancedPrompt = `${prompt}, cinematic quality, smooth motion, high detail`
  
  const input = {
    prompt: enhancedPrompt,
    num_frames: numFrames,
    width,
    height,
    seed: seed || undefined
  }
  
  try {
    const result = await fal.subscribe(endpoint, {
      input,
      pollInterval: 5000,
      timeout: 300000,
      onQueueUpdate: (update) => {
        if (update.status === 'IN_PROGRESS') {
        }
      }
    })
    
    const videoUrl = result.data?.video?.url || result.data?.output?.url
    if (!videoUrl) throw new Error('No video URL in LTX response')
    
    return {
      url: videoUrl,
      prompt,
      model: endpoint,
      duration: actualDuration
    }
  } catch (error) {
    console.error(`[${jobId}] LTX clip failed:`, error.message)
    throw error
  }
}

/**
 * Extract last frame from video URL using FFmpeg
 * Returns base64 data URL for use as first frame in next clip
 */
// ============= TALKING HEAD GENERATION =============
/**
 * Generate a talking head video for UGC ads.
 *
 * PRIMARY: Kling Avatar v2 — strict lip-sync to provided audio file. The output video
 * length exactly matches the audio length and the spoken words exactly match the script
 * (because Kling syncs the avatar's mouth to the audio waveform — it does NOT generate
 * its own dialogue).
 *
 * FALLBACK: Seedance 2.0 Fast Reference-to-Video — used only if Kling fails. Note that
 * Seedance Reference does not do strict lip-sync; it generates its own narration based on
 * the prompt + audio reference. So the fallback is best-effort.
 *
 * @param {Object} options
 * @param {string} options.imageUrl - URL of the avatar/character image
 * @param {string} options.audioUrl - URL of the audio file (TTS speech) — drives length & lips
 * @param {string} options.prompt - Optional motion guidance (gestures, head tilts, etc.)
 * @param {string} options.tier - 'standard' or 'pro' (1080p + 48fps)
 * @param {string} options.jobId - Job ID for logging
 * @returns {Object} { url, duration, model, engine, tier }
 */
export async function generateTalkingHead({
  imageUrl,
  audioUrl,
  prompt = '',
  tier = 'pro',
  motionStyle = 'strict',  // 'strict' = Kling Avatar v2 primary | 'natural' = Seedance 2 Reference primary
  aspectRatio = '9:16',    // '9:16' | '16:9' | '1:1' | '4:5'
  jobId = 'unknown'
}) {
  configureFal()

  const klingEndpoint = tier === 'pro'
    ? KLING_MODELS.AVATAR_V2_PRO
    : KLING_MODELS.AVATAR_V2_STANDARD

  // Build a Seedance 2 reference scene prompt — used either as primary (natural mode) or fallback
  const seedanceScenePrompt = prompt
    ? `${prompt}. The person in @Image1 is talking naturally to the camera, lips moving in sync with @Audio1, casual selfie-style recording, slight head tilts, natural blinks, professional UGC ad quality.`
    : `The person in @Image1 is talking directly to the camera, mouth moves in sync with @Audio1, natural facial expressions, subtle head movements, blinks, casual phone selfie-style recording, looking at the lens, professional UGC ad quality.`

  // Build a Kling Avatar v2 motion-guidance prompt — used either as primary (strict) or fallback
  const klingMotionPrompt = (prompt && prompt.trim().length > 0)
    ? prompt.trim()
    : 'Casual phone selfie recording, natural slight head tilts, expressive eyebrows, small hand gestures near the face, occasional natural blinks, subtle weight shifts, looking directly at the camera lens, relaxed shoulders, breathing naturally, authentic UGC creator vibe — NOT static, NOT robotic'

  // ============= NATURAL MODE: Seedance 2 Reference primary =============
  if (motionStyle === 'natural') {
    try {
      console.log(`[${jobId}] [motionStyle=natural] Generating talking head via Seedance 2 Reference (PRIMARY)...`)
      const result = await generateSeedance2ReferenceClip({
        prompt: seedanceScenePrompt,
        imageUrls: [imageUrl],
        audioUrls: [audioUrl],
        aspectRatio,
        duration: '8',
        resolution: tier === 'pro' ? '720p' : '480p',
        jobId
      })
      console.log(`[${jobId}] Talking head generated successfully via Seedance 2 Reference (natural mode)`)
      return {
        url: result.url,
        model: result.model,
        engine: 'seedance-2.0-fast-reference',
        tier,
        motionStyle: 'natural',
        aspectRatio,
        duration: result.duration || null
      }
    } catch (seedance2Error) {
      console.warn(`[${jobId}] Seedance 2 Reference failed in natural mode, falling back to Kling Avatar v2:`, seedance2Error.message)
      // fall through to Kling fallback below
      try {
        const input = { image_url: imageUrl, audio_url: audioUrl, prompt: klingMotionPrompt, aspect_ratio: aspectRatio }
        const result = await falQueueRun(klingEndpoint, input, `Kling Avatar v2 ${tier} (natural fallback)`, jobId, 12)
        const videoUrl = extractVideoUrl(result.data)
        if (!videoUrl) throw new Error('No video URL in Kling fallback response')
        return {
          url: videoUrl,
          model: klingEndpoint,
          engine: 'kling-avatar-v2-fallback',
          tier,
          motionStyle: 'natural',
          aspectRatio,
          duration: result.data?.duration || null
        }
      } catch (klingErr) {
        throw new Error(`Talking head failed (natural mode). Seedance: ${seedance2Error.message}. Kling fallback: ${klingErr.message}`)
      }
    }
  }

  // ============= STRICT MODE (DEFAULT): Kling Avatar v2 primary =============
  // PRIMARY: Kling Avatar v2 — strict lip-sync, video length == audio length
  try {
    console.log(`[${jobId}] [motionStyle=strict] Generating talking head (${tier}) via Kling Avatar v2 (PRIMARY, strict lip-sync)...`)
    const input = {
      image_url: imageUrl,
      audio_url: audioUrl,
      prompt: klingMotionPrompt,
      aspect_ratio: aspectRatio
    }
    const result = await falQueueRun(klingEndpoint, input, `Kling Avatar v2 ${tier}`, jobId, 12)

    const videoUrl = extractVideoUrl(result.data)
    if (!videoUrl) {
      throw new Error('No video URL in Kling Avatar v2 response')
    }
    console.log(`[${jobId}] Talking head generated successfully via Kling Avatar v2`)
    return {
      url: videoUrl,
      model: klingEndpoint,
      engine: 'kling-avatar-v2',
      tier,
      motionStyle: 'strict',
      aspectRatio,
      duration: result.data?.duration || null
    }
  } catch (klingError) {
    console.warn(`[${jobId}] Kling Avatar v2 failed, falling back to Seedance 2.0 Fast Reference:`, klingError.message)

    // FALLBACK: Seedance 2.0 Fast Reference-to-Video (best-effort, not strict lip-sync)
    try {
      const result = await generateSeedance2ReferenceClip({
        prompt: seedanceScenePrompt,
        imageUrls: [imageUrl],
        audioUrls: [audioUrl],
        aspectRatio,
        duration: '8',
        resolution: tier === 'pro' ? '720p' : '480p',
        jobId
      })
      console.log(`[${jobId}] Talking head generated via Seedance 2 Reference (fallback)`)
      return {
        url: result.url,
        model: result.model,
        engine: 'seedance-2.0-fast-reference-fallback',
        tier,
        motionStyle: 'strict',
        aspectRatio,
        duration: result.duration || null
      }
    } catch (seedance2Error) {
      console.error(`[${jobId}] Both Kling Avatar v2 and Seedance 2 Reference failed`)
      throw new Error(
        `Talking head generation failed. Kling Avatar v2: ${klingError.message}. Seedance 2 Reference fallback: ${seedance2Error.message}`
      )
    }
  }
}

/**
 * Generate a B-roll clip using Seedance 2.0 Fast (PRIMARY for UGC)
 * Falls back to Kling 3.0 Pro if Seedance 2 fails.
 * Per user requirement: Seedance 2 primary, Kling 3.0 is the ONLY fallback.
 */
export async function generateUGCBrollClip({
  prompt,
  aspectRatio = '9:16',
  duration = '8',
  imageUrl = null,
  resolution = '720p',
  jobId = 'unknown'
}) {
  configureFal()

  // Try Seedance 2.0 Fast first (primary engine)
  try {
    console.log(`[${jobId}] Generating UGC B-roll via Seedance 2.0 Fast (${imageUrl ? 'I2V' : 'T2V'})...`)
    const clip = await generateSeedance2Clip({
      prompt,
      aspectRatio,
      duration: String(duration),
      imageUrl,
      resolution,
      jobId
    })
    console.log(`[${jobId}] Seedance 2.0 Fast B-roll generated successfully`)
    return {
      url: clip.url,
      model: clip.model,
      duration: clip.duration,
      engine: 'seedance-2.0-fast'
    }
  } catch (seedance2Error) {
    console.warn(`[${jobId}] Seedance 2.0 Fast failed, falling back to Kling 3.0 Pro:`, seedance2Error.message)

    // Fallback: Kling 3.0 Pro (the ONLY fallback per user requirement)
    try {
      const isImageToVideo = !!imageUrl
      const endpoint = isImageToVideo
        ? KLING_MODELS.V3_IMAGE_TO_VIDEO_PRO
        : KLING_MODELS.V3_TEXT_TO_VIDEO_PRO

      // Kling 3.0 only supports 5 or 10 sec
      const klingDuration = parseInt(duration) <= 7 ? '5' : '10'

      const input = {
        prompt,
        duration: klingDuration,
        aspect_ratio: aspectRatio,
        negative_prompt: 'blur, distort, low quality, watermark, text overlay, subtitles, captions'
      }
      if (isImageToVideo && imageUrl) {
        input.image_url = imageUrl
      }

      const result = await falQueueRun(endpoint, input, 'Kling 3.0 B-roll fallback', jobId, 12)
      const videoUrl = extractVideoUrl(result.data)
      if (!videoUrl) throw new Error('No video URL in Kling 3.0 response')

      console.log(`[${jobId}] Kling 3.0 B-roll fallback generated successfully`)
      return {
        url: videoUrl,
        model: endpoint,
        duration: parseInt(klingDuration),
        engine: 'kling-3.0-fallback'
      }
    } catch (klingError) {
      console.error(`[${jobId}] Both Seedance 2.0 and Kling 3.0 failed`)
      throw new Error(`Video generation failed. Seedance 2: ${seedance2Error.message}. Kling 3.0 fallback: ${klingError.message}`)
    }
  }
}


export async function extractLastFrame(videoUrl, tempDir, jobId = 'unknown') {
  const { writeFile, readFile, mkdir } = await import('fs/promises')
  const { createWriteStream, existsSync } = await import('fs')
  const { join } = await import('path')
  const { Readable } = await import('stream')
  const { pipeline } = await import('stream/promises')
  const ffmpeg = (await import('fluent-ffmpeg')).default
  
  // Ensure temp directory exists
  if (!existsSync(tempDir)) {
    await mkdir(tempDir, { recursive: true })
  }
  
  const videoPath = join(tempDir, `video-${Date.now()}.mp4`)
  const framePath = join(tempDir, `frame-${Date.now()}.jpg`)
  
  try {
    // Download video
    const response = await fetch(videoUrl)
    if (!response.ok) throw new Error(`Download failed: ${response.status}`)
    
    const fileStream = createWriteStream(videoPath)
    await pipeline(Readable.fromWeb(response.body), fileStream)
    
    // Extract last frame
    await new Promise((resolve, reject) => {
      ffmpeg(videoPath)
        .outputOptions([
          '-sseof', '-0.1', // 0.1s before end
          '-vframes', '1',
          '-q:v', '2' // High quality
        ])
        .output(framePath)
        .on('end', resolve)
        .on('error', reject)
        .run()
    })
    
    // Read and convert to base64
    const frameBuffer = await readFile(framePath)
    const base64 = frameBuffer.toString('base64')
    const dataUrl = `data:image/jpeg;base64,${base64}`
    
    // Cleanup
    const fs = await import('fs/promises')
    await fs.unlink(videoPath).catch(() => {})
    await fs.unlink(framePath).catch(() => {})
    
    return dataUrl
  } catch (error) {
    console.error(`[${jobId}] Frame extraction failed:`, error.message)
    throw error
  }
}

/**
 * Generate multiple video clips with character consistency
 * Supports: none, seed, frame-chain modes
 * Allows videos of any duration (no artificial limits)
 * 
 * COST OPTIMIZATION: Uses 10-second clips when possible (halves API costs vs 5s clips)
 * 
 * VIDEO MODELS:
 * - 'seedance' (default): Cinematic quality, native audio, character consistency
 * - 'kling': High quality, longer generation time, silent output
 * - 'wan': Good quality, budget option
 * - 'ltx': Fast, cheapest option
 */
export async function generateConsistentVideoClips({
  script,
  duration, // Total video duration in seconds
  aspectRatio = '9:16',
  consistencyMode = 'none', // 'none', 'seed', 'frame-chain'
  characterDescription = null,
  jobId = 'unknown',
  onProgress = null, // Callback for progress updates
  maxClips = 100, // Safety limit for extremely long videos
  clipDurationSeconds = 10, // Use 10s clips for cost efficiency (Kling supports 5 or 10)
  videoModel = 'seedance', // 'seedance' (Seedance 2 Fast — primary), 'kling', 'wan', 'ltx'
  seedImageUrl = null, // Optional seed image URL for first clip (image-to-video)
  seedImageType = 'character', // 'character' or 'scene'
  sceneReferenceUrls = {}, // Multi-scene reference URLs: { sceneNumber: url }
  useScenePrompts = true // Whether to use AI scene prompts or raw prompt for all clips
}) {
  configureFal()
  
  // Adjust clip duration based on model
  // Wan generates ~5-10s clips, Kling can do 5 or 10, LTX can do 5-10, Seedance 4-12
  const isWanModel = videoModel === 'wan'
  const isLTXModel = videoModel === 'ltx'
  const isSeedanceModel = videoModel === 'seedance'
  const clipDuration = isWanModel ? 5 : isLTXModel ? 5 : isSeedanceModel ? 8 : clipDurationSeconds
  const numClips = Math.min(Math.ceil(duration / clipDuration), maxClips)
  const totalGeneratedDuration = numClips * clipDuration
  
  if (seedImageUrl) {
  }
  if (Object.keys(sceneReferenceUrls).length > 0) {
  }
  
  let scenes, character
  
  if (useScenePrompts) {
    // Generate scene prompts with character consistency
    const result = await generateScenePromptsWithConsistency(
      script, 
      numClips, 
      characterDescription
    )
    scenes = result.scenes
    character = characterDescription || result.characterDescription
  } else {
    // Use raw prompt for all clips (more consistency but less variety)
    scenes = Array(numClips).fill(script)
    character = characterDescription
  }
  
  const seed = consistencyMode !== 'none' ? Math.floor(Math.random() * 2147483647) : null
  
  const clips = []
  let lastFrameUrl = null
  const tempDir = `/tmp/kling-${jobId}`
  
  for (let i = 0; i < numClips; i++) {
    const scenePrompt = scenes[i] || scenes[scenes.length - 1]
    
    // Enhance prompt for consistency
    const enhancedPrompt = enhancePromptForConsistency(
      scenePrompt,
      character,
      i,
      numClips
    )
    
    // Add delay between requests (except first)
    if (i > 0) {
      await new Promise(r => setTimeout(r, 3000))
    }
    
    // Progress callback
    if (onProgress) {
      onProgress({
        stage: 'generating',
        clipIndex: i,
        totalClips: numClips,
        message: `Generating scene ${i + 1} of ${numClips}...`
      })
    }
    
    try {
      let clip
      
      // Check for scene-specific reference image (scene numbers are 1-indexed)
      const sceneNumber = i + 1
      const sceneRefUrl = sceneReferenceUrls[sceneNumber] || sceneReferenceUrls[String(sceneNumber)]
      
      // Determine if this clip should use an image reference
      // Priority: 1) Scene-specific ref, 2) Seed image (only for first clip)
      const supportsImageRef = videoModel === 'kling' || videoModel === 'seedance' // Kling and Seedance support image-to-video
      const useSceneRef = sceneRefUrl && supportsImageRef
      const useSeedImage = !useSceneRef && seedImageUrl && i === 0 && supportsImageRef
      const imageToUse = useSceneRef ? sceneRefUrl : (useSeedImage ? seedImageUrl : null)
      
      if (isSeedanceModel) {
        // Use Seedance 1.5 Pro — supports both T2V and I2V with end-frame
        clip = await generateSeedanceClip({
          prompt: enhancedPrompt,
          aspectRatio,
          duration: String(clipDuration),
          seed,
          imageUrl: imageToUse || (consistencyMode === 'frame-chain' && i > 0 && lastFrameUrl ? lastFrameUrl : null),
          jobId,
          resolution: '720p'
        })
        // Extract last frame for frame-chain
        if (consistencyMode === 'frame-chain' && i < numClips - 1) {
          try {
            lastFrameUrl = await extractLastFrame(clip.url, tempDir, jobId)
          } catch (e) {
            lastFrameUrl = null
          }
        }
      } else if (isWanModel) {
        // Use Wan 2.2 for video generation
        clip = await generateWanClip({
          prompt: enhancedPrompt,
          aspectRatio,
          duration: String(clipDuration),
          seed,
          jobId
        })
      } else if (isLTXModel) {
        // Use LTX for fast budget video generation
        clip = await generateLTXClip({
          prompt: enhancedPrompt,
          aspectRatio,
          duration: String(clipDuration),
          seed,
          jobId
        })
      } else if (imageToUse) {
        // Use image-to-video with reference image
        const refType = useSceneRef ? `SCENE ${sceneNumber} REFERENCE` : `SEED IMAGE (${seedImageType})`
        clip = await generateKlingClip({
          prompt: enhancedPrompt,
          aspectRatio,
          duration: '5', // I2V typically limited to 5s
          seed,
          imageUrl: imageToUse,
          jobId
        })
        // For frame-chain, use this clip's last frame for subsequent clips
        if (consistencyMode === 'frame-chain') {
          try {
            lastFrameUrl = await extractLastFrame(clip.url, tempDir, jobId)
          } catch (e) {
          }
        }
      } else if (consistencyMode === 'frame-chain' && i > 0 && lastFrameUrl) {
        // Use Kling image-to-video with last frame
        clip = await generateKlingClip({
          prompt: enhancedPrompt,
          aspectRatio,
          duration: '5', // I2V typically limited to 5s
          seed,
          imageUrl: lastFrameUrl,
          jobId
        })
      } else {
        // Use Kling text-to-video with optimal duration
        clip = await generateKlingClip({
          prompt: enhancedPrompt,
          aspectRatio,
          duration: String(clipDuration),
          seed: consistencyMode === 'seed' ? seed : null,
          jobId
        })
      }
      
      clips.push({
        ...clip,
        index: i,
        scenePrompt,
        enhancedPrompt,
        frameChained: !isWanModel && !isLTXModel && !isSeedanceModel && (imageToUse || (consistencyMode === 'frame-chain' && i > 0)) || (isSeedanceModel && (imageToUse || (consistencyMode === 'frame-chain' && i > 0))),
        clipDuration,
        model: videoModel,
        usedSeedImage: useSeedImage,
        usedSceneRef: useSceneRef
      })
      
      const refInfo = useSceneRef ? ' [SCENE REF]' : (useSeedImage ? ' [SEED IMAGE]' : '')
      
      // Extract last frame for next clip (if frame-chain mode with Kling)
      if (!isWanModel && !isLTXModel && consistencyMode === 'frame-chain' && i < numClips - 1 && !imageToUse) {
        try {
          lastFrameUrl = await extractLastFrame(clip.url, tempDir, jobId)
        } catch (frameError) {
          console.error(`[${jobId}] Frame extraction failed, continuing without chain`)
          lastFrameUrl = null
        }
      }
    } catch (clipError) {
      console.error(`[${jobId}] ❌ Clip ${i + 1} failed:`, clipError.message)
      // Continue with other clips
    }
  }
  
  // Cleanup temp directory
  try {
    const fs = await import('fs/promises')
    await fs.rm(tempDir, { recursive: true, force: true })
  } catch (e) { /* ignore */ }
  
  if (clips.length === 0) {
    throw new Error('All clip generations failed')
  }
  
  return {
    clips,
    characterDescription: character,
    seed,
    consistencyMode,
    totalDuration: clips.length * clipDuration
  }
}

/**
 * Fallback to stock videos if AI generation fails
 */
export async function getFallbackStockVideos(keywords, count = 3, orientation = 'portrait') {
  try {
    const results = []
    for (const keyword of keywords.slice(0, count)) {
      const data = await searchPexelsVideos(keyword, { perPage: 1, orientation })
      if (data.videos?.[0]) {
        const video = data.videos[0]
        const file = video.video_files.find(f => f.quality === 'hd') || video.video_files[0]
        if (file) {
          results.push({
            url: file.link,
            keyword,
            type: 'stock',
            source: 'pexels'
          })
        }
      }
    }
    return results
  } catch (error) {
    console.error('Stock video fallback failed:', error)
    return []
  }
}
