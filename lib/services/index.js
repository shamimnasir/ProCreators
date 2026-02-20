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

export const isFalConfigured = () => !!process.env.FAL_KEY

export const configureFal = () => {
  if (!process.env.FAL_KEY) {
    throw new Error('FAL_KEY not configured')
  }
  fal.config({ credentials: process.env.FAL_KEY })
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
  TEXT_TO_VIDEO: 'fal-ai/kling-video/v2.5-turbo/pro/text-to-video',
  TEXT_TO_VIDEO_STANDARD: 'fal-ai/kling-video/v2.5/pro/text-to-video',
  IMAGE_TO_VIDEO: 'fal-ai/kling-video/v1.5/pro/image-to-video',
  IMAGE_TO_VIDEO_STANDARD: 'fal-ai/kling-video/v1/pro/image-to-video'
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
  
  console.log(`[${jobId}] Generating Kling clip with ${isImageToVideo ? 'I2V' : 'T2V'}: ${prompt.substring(0, 50)}...`)
  
  try {
    const result = await fal.subscribe(endpoint, {
      input,
      pollInterval: 3000,
      timeout: 300000, // 5 minutes
      onQueueUpdate: (update) => {
        if (update.status === 'IN_PROGRESS') {
          console.log(`[${jobId}] Kling clip processing...`)
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
  
  console.log(`[${jobId}] Generating Minimax clip: ${prompt.substring(0, 50)}...`)
  
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
          console.log(`[${jobId}] Minimax clip processing...`)
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
 * Extract last frame from video URL using FFmpeg
 * Returns base64 data URL for use as first frame in next clip
 */
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
    console.log(`[${jobId}] Downloading video for frame extraction...`)
    const response = await fetch(videoUrl)
    if (!response.ok) throw new Error(`Download failed: ${response.status}`)
    
    const fileStream = createWriteStream(videoPath)
    await pipeline(Readable.fromWeb(response.body), fileStream)
    
    // Extract last frame
    console.log(`[${jobId}] Extracting last frame...`)
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
    
    console.log(`[${jobId}] Frame extracted successfully`)
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
 * - 'kling' (default): High quality, longer generation time, silent output
 * - 'minimax': Faster, cheaper, good quality, silent output
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
  videoModel = 'kling', // 'kling' or 'minimax'
  seedImageUrl = null, // Optional seed image URL for first clip (image-to-video)
  seedImageType = 'character' // 'character' or 'scene'
}) {
  configureFal()
  
  // Adjust clip duration based on model
  // Minimax generates ~6 second clips, Kling can do 5 or 10
  const isMinimaxModel = videoModel === 'minimax'
  const clipDuration = isMinimaxModel ? 6 : clipDurationSeconds
  const numClips = Math.min(Math.ceil(duration / clipDuration), maxClips)
  const totalGeneratedDuration = numClips * clipDuration
  
  console.log(`[${jobId}] 🎥 Video model: ${videoModel.toUpperCase()}`)
  console.log(`[${jobId}] 💰 Cost-optimized: Generating ${numClips} clips × ${clipDuration}s = ${totalGeneratedDuration}s (target: ${duration}s)`)
  console.log(`[${jobId}] 🎬 Consistency mode: ${consistencyMode}${isMinimaxModel ? ' (seed/frame-chain not supported for Minimax)' : ''}`)
  if (seedImageUrl) {
    console.log(`[${jobId}] 🖼️ Using seed image (${seedImageType}): ${seedImageUrl.substring(0, 60)}...`)
  }
  
  // Generate scene prompts with character consistency
  const { scenes, characterDescription: extractedCharacter } = await generateScenePromptsWithConsistency(
    script, 
    numClips, 
    characterDescription
  )
  
  const character = characterDescription || extractedCharacter
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
      console.log(`[${jobId}] Waiting 3s before next clip...`)
      await new Promise(r => setTimeout(r, 3000))
    }
    
    // Progress callback
    if (onProgress) {
      onProgress({
        stage: 'generating',
        clipIndex: i,
        totalClips: numClips,
        message: `Generating clip ${i + 1}/${numClips} with ${videoModel}...`
      })
    }
    
    try {
      let clip
      
      // Determine if this clip should use seed image (first clip only with seed image)
      const useSeedImage = seedImageUrl && i === 0 && !isMinimaxModel
      
      if (isMinimaxModel) {
        // Use Minimax for video generation (doesn't support image-to-video)
        console.log(`[${jobId}] Clip ${i + 1}: Using Minimax text-to-video`)
        clip = await generateMinimaxClip({
          prompt: enhancedPrompt,
          aspectRatio,
          jobId
        })
      } else if (useSeedImage) {
        // First clip with seed image - use image-to-video
        console.log(`[${jobId}] Clip ${i + 1}: Using Kling image-to-video with SEED IMAGE (${seedImageType})`)
        clip = await generateKlingClip({
          prompt: enhancedPrompt,
          aspectRatio,
          duration: '5', // I2V typically limited to 5s
          seed,
          imageUrl: seedImageUrl,
          jobId
        })
        // For frame-chain, use this clip's last frame for subsequent clips
        if (consistencyMode === 'frame-chain') {
          try {
            lastFrameUrl = await extractLastFrame(clip.url, tempDir, jobId)
          } catch (e) {
            console.log(`[${jobId}] Could not extract frame from seed image clip`)
          }
        }
      } else if (consistencyMode === 'frame-chain' && i > 0 && lastFrameUrl) {
        // Use Kling image-to-video with last frame
        console.log(`[${jobId}] Clip ${i + 1}: Using Kling frame-chain (I2V, 5s)`)
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
        console.log(`[${jobId}] Clip ${i + 1}: Using Kling text-to-video (${clipDuration}s)`)
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
        frameChained: !isMinimaxModel && (useSeedImage || (consistencyMode === 'frame-chain' && i > 0)),
        clipDuration,
        model: videoModel,
        usedSeedImage: useSeedImage
      })
      
      console.log(`[${jobId}] ✅ Clip ${i + 1}/${numClips} generated with ${videoModel} (${clip.duration || clipDuration}s)${useSeedImage ? ' [SEED IMAGE]' : ''}`)
      
      // Extract last frame for next clip (if frame-chain mode with Kling)
      if (!isMinimaxModel && consistencyMode === 'frame-chain' && i < numClips - 1 && !useSeedImage) {
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
