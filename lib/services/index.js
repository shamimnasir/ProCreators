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

/**
 * Character Consistency Prompt Engineering
 * Adds consistency instructions to prompts for better character preservation
 */
export function enhancePromptForConsistency(basePrompt, characterDescription = null, sceneIndex = 0, totalScenes = 1) {
  let enhanced = basePrompt
  
  // Add character anchoring if description provided
  if (characterDescription) {
    enhanced = `[CHARACTER: ${characterDescription}] ${enhanced}`
  }
  
  // Add consistency instructions
  const consistencyInstructions = [
    'maintain exact same character appearance throughout',
    'consistent facial features and body proportions',
    'same clothing and accessories',
    'coherent lighting and color grading',
    'smooth natural motion'
  ]
  
  // Add scene continuity hints
  if (totalScenes > 1) {
    if (sceneIndex === 0) {
      enhanced += ', establishing shot, introduce character clearly'
    } else if (sceneIndex === totalScenes - 1) {
      enhanced += ', concluding scene, maintain character from previous scenes'
    } else {
      enhanced += ', continuous scene, same character as before'
    }
  }
  
  enhanced += `, ${consistencyInstructions.join(', ')}`
  
  return enhanced
}

/**
 * Extract character description from script/prompt using AI
 */
export async function extractCharacterDescription(script) {
  try {
    const gemini = getGeminiModel('gemini-2.0-flash')
    
    const prompt = `Analyze this script and extract a detailed character description for AI video generation. Focus on visual attributes only.

Script: "${script}"

Return a concise character description (max 100 words) including:
- Gender, approximate age
- Hair color, style, length
- Clothing/outfit
- Notable features
- Body type if mentioned

If no specific character, return "generic person" with neutral description.
Return ONLY the description, no explanation.`
    
    const result = await gemini.generateContent(prompt)
    return result.response.text().trim()
  } catch (error) {
    console.error('Character extraction failed:', error)
    return null
  }
}

/**
 * Generate scene prompts from script with character consistency
 */
export async function generateScenePromptsWithConsistency(script, numScenes, characterDescription = null) {
  try {
    const gemini = getGeminiModel('gemini-2.0-flash')
    
    // Extract character if not provided
    const character = characterDescription || await extractCharacterDescription(script)
    
    const prompt = `Break this script into ${numScenes} video scene prompts for AI video generation.
Each scene should be 5 seconds of action.

IMPORTANT RULES:
1. Every scene MUST include the SAME character description: "${character || 'the main character'}"
2. Describe the character's actions, not dialogue
3. Include camera angle suggestions (close-up, medium shot, wide shot)
4. Describe lighting and mood
5. Keep descriptions visual and cinematic

Script: "${script}"

Return exactly ${numScenes} scene prompts, one per line, numbered 1-${numScenes}.
Each prompt should be 20-40 words, starting with the character description.`
    
    const result = await gemini.generateContent(prompt)
    const text = result.response.text()
    
    // Parse scenes
    const lines = text.split('\n').filter(l => l.trim())
    const scenes = lines
      .map(l => l.replace(/^\d+[\.\)]\s*/, '').trim())
      .filter(l => l.length > 10)
      .slice(0, numScenes)
    
    // Ensure we have enough scenes
    while (scenes.length < numScenes) {
      const lastScene = scenes[scenes.length - 1] || script
      scenes.push(`${character || 'The character'} continues the scene, ${lastScene.substring(0, 50)}...`)
    }
    
    return {
      scenes,
      characterDescription: character
    }
  } catch (error) {
    console.error('Scene generation failed:', error)
    // Fallback: split script into parts
    const parts = script.split(/[.!?।]+/).filter(s => s.trim().length > 10)
    return {
      scenes: parts.slice(0, numScenes),
      characterDescription: null
    }
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
  
  console.log(`[${jobId}] Generating clip with ${isImageToVideo ? 'I2V' : 'T2V'}: ${prompt.substring(0, 50)}...`)
  
  try {
    const result = await fal.subscribe(endpoint, {
      input,
      pollInterval: 3000,
      timeout: 300000, // 5 minutes
      onQueueUpdate: (update) => {
        if (update.status === 'IN_PROGRESS') {
          console.log(`[${jobId}] Clip processing...`)
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
 */
export async function generateConsistentVideoClips({
  script,
  duration, // Total video duration in seconds
  aspectRatio = '9:16',
  consistencyMode = 'none', // 'none', 'seed', 'frame-chain'
  characterDescription = null,
  jobId = 'unknown',
  onProgress = null // Callback for progress updates
}) {
  configureFal()
  
  const clipDuration = 5 // Each clip is 5 seconds
  const numClips = Math.ceil(duration / clipDuration)
  
  console.log(`[${jobId}] Generating ${numClips} clips (${duration}s total) with ${consistencyMode} consistency`)
  
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
        message: `Generating clip ${i + 1}/${numClips}...`
      })
    }
    
    try {
      let clip
      
      if (consistencyMode === 'frame-chain' && i > 0 && lastFrameUrl) {
        // Use image-to-video with last frame
        console.log(`[${jobId}] Clip ${i + 1}: Using frame-chain (I2V)`)
        clip = await generateKlingClip({
          prompt: enhancedPrompt,
          aspectRatio,
          duration: '5',
          seed,
          imageUrl: lastFrameUrl,
          jobId
        })
      } else {
        // Use text-to-video
        console.log(`[${jobId}] Clip ${i + 1}: Using text-to-video`)
        clip = await generateKlingClip({
          prompt: enhancedPrompt,
          aspectRatio,
          duration: '5',
          seed: consistencyMode === 'seed' ? seed : null,
          jobId
        })
      }
      
      clips.push({
        ...clip,
        index: i,
        scenePrompt,
        enhancedPrompt,
        frameChained: consistencyMode === 'frame-chain' && i > 0
      })
      
      console.log(`[${jobId}] ✅ Clip ${i + 1}/${numClips} generated`)
      
      // Extract last frame for next clip (if frame-chain mode)
      if (consistencyMode === 'frame-chain' && i < numClips - 1) {
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
