import { NextResponse } from 'next/server'
import Replicate from 'replicate'
import { enforceRateLimit } from '@/lib/rate-limiter'
import { z } from 'zod'
import { validateRequest } from '@/lib/validation'

export const maxDuration = 300 // 5 minutes timeout for video generation

// Video generation input schema
const videoGenerationSchema = z.object({
  script: z.string().min(1, 'Script is required').max(5000, 'Script too long'),
  mode: z.enum(['budget', 'fast', 'pro']).default('budget'),
  duration: z.number().int().min(5).max(300).optional(),
  language: z.string().max(50).optional(),
  platform: z.enum(['instagram', 'tiktok', 'youtube', 'facebook']).default('instagram'),
  image: z.string().url().max(5000).optional().or(z.string().max(100000).optional()) // URL or base64
})

// Smart model selection based on mode
const VIDEO_MODELS = {
  budget: [
    // Best budget options - fast and cost-effective
    { id: 'stability-ai/stable-video-diffusion:3f0457e4619daac51203dedb472816fd4af51f3149fa7a9e0b5ffcf1b8172438', type: 'image', priority: 1, cost: 'lowest', description: 'SVD - Best for image-to-video' },
    { id: 'anotherjesse/zeroscope-v2-xl:9f747673945c62801b13b84701c783929c0ee784e4748ec062204894dda1a351', type: 'text', priority: 2, cost: 'lowest', description: 'ZeroScope - Fast text-to-video' },
  ],
  fast: [
    // Fast quality options - good balance
    { id: 'stability-ai/stable-video-diffusion:3f0457e4619daac51203dedb472816fd4af51f3149fa7a9e0b5ffcf1b8172438', type: 'image', priority: 1, cost: 'medium', description: 'SVD - Quality image-to-video' },
    { id: 'anotherjesse/zeroscope-v2-xl:9f747673945c62801b13b84701c783929c0ee784e4748ec062204894dda1a351', type: 'text', priority: 2, cost: 'medium', description: 'ZeroScope XL - High quality' },
  ],
  pro: [
    // Premium quality options - best results
    { id: 'stability-ai/stable-video-diffusion:3f0457e4619daac51203dedb472816fd4af51f3149fa7a9e0b5ffcf1b8172438', type: 'image', priority: 1, cost: 'high', description: 'SVD XT - Premium image animation' },
    { id: 'anotherjesse/zeroscope-v2-xl:9f747673945c62801b13b84701c783929c0ee784e4748ec062204894dda1a351', type: 'text', priority: 2, cost: 'high', description: 'ZeroScope - Pro text-to-video' },
  ]
}

export async function POST(request) {
  try {
    // SECURITY: Rate limiting for content generation
    const rateLimitCheck = await enforceRateLimit(request, 'content_generate')
    if (rateLimitCheck.limited) {
      return rateLimitCheck.response
    }

    const body = await request.json()
    
    // SECURITY: Validate input with Zod schema
    const validation = validateRequest(videoGenerationSchema, body)
    if (!validation.success) {
      return NextResponse.json({
        success: false,
        error: 'Validation failed',
        errors: validation.errors
      }, { status: 400 })
    }
    
    const { script, mode, duration, language, platform, image } = validation.data

    // Platform-specific configurations
    const platformConfig = {
      instagram: { aspectRatio: '9:16', orientation: 'portrait', maxDuration: 90, name: 'Instagram Reels' },
      tiktok: { aspectRatio: '9:16', orientation: 'portrait', maxDuration: 60, name: 'TikTok' },
      youtube: { aspectRatio: '9:16', orientation: 'portrait', maxDuration: 60, name: 'YouTube Shorts' },
      facebook: { aspectRatio: '9:16', orientation: 'portrait', maxDuration: 90, name: 'Facebook Reels' }
    }
    
    const targetPlatform = platformConfig[platform] || platformConfig.instagram
    // Check if API keys are available
    const replicateKey = process.env.REPLICATE_API_TOKEN
    
    if (!replicateKey) {
      return NextResponse.json({
        success: true,
        status: 'pending',
        message: 'Video generation requires Replicate API key',
        note: 'Please add REPLICATE_API_TOKEN to your environment variables to enable video generation. Get your free API key from replicate.com',
        mode,
        jobId: `placeholder_${Date.now()}`
      })
    }

    // Initialize Replicate client
    const replicate = new Replicate({
      auth: replicateKey,
    })

    // Determine which image to use
    const imageToUse = image
    const hasImage = !!imageToUse
    
    const models = VIDEO_MODELS[mode] || VIDEO_MODELS.budget
    
    // Try models in priority order
    for (const model of models) {
      // Skip if model doesn't support required input type
      if (hasImage && model.type === 'text') {
        continue
      }
      if (!hasImage && model.type === 'image') {
        continue
      }
      
      try {
        const result = await generateWithModel(replicate, model.id, script, duration, imageToUse, targetPlatform)
        
        return NextResponse.json({
          success: true,
          status: 'completed',
          message: `${getModeInfo(mode).name} - Video generated successfully`,
          estimatedTime: getModeInfo(mode).time,
          videoUrl: result,
          jobId: `${mode}_${Date.now()}`,
          provider: getModeInfo(mode).provider,
          mode,
          language
        })
      } catch (error) {
        console.error(`[Video Generation] ${model.id} failed:`, error.message)
        
        // If it's an insufficient credit error and we're on the last model, return demo
        if (error.message.includes('Insufficient credit') && model === models[models.length - 1]) {
          return NextResponse.json({
            success: true,
            status: 'demo_mode',
            message: `${getModeInfo(mode).name} - Demo Mode (Requires Replicate Credits)`,
            estimatedTime: getModeInfo(mode).time,
            videoUrl: 'https://replicate.delivery/pbxt/KswiwJ0g0C93PvMNcWlIQlAzDViCvLl7bCyHIoSQIHjHuEir/video.mp4',
            jobId: `${mode}_${Date.now()}`,
            provider: getModeInfo(mode).provider,
            note: 'This is a demo video. To generate custom videos, please add credits to your Replicate account at replicate.com/account/billing',
            mode,
            language
          })
        }
        
        // Try next model in the list
        continue
      }
    }
    
    // If all models failed
    throw new Error('All video generation models failed. Please try again later.')

  } catch (error) {
    console.error('Video generation error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to generate video' },
      { status: 500 }
    )
  }
}

async function generateWithModel(replicate, modelId, script, duration = 5, inputImage = null, platformConfig = null) {
  const isTextModel = modelId.includes('t2v') || modelId.includes('text')
  const isImageModel = modelId.includes('i2v') || modelId.includes('image')
  
  // Build input based on model type
  let input = {}
  
  // Use platform-specific aspect ratio or default to 9:16
  const aspectRatio = platformConfig?.aspectRatio || '9:16'
  
  // Create a concise visual prompt from the script
  const visualPrompt = inputImage 
    ? `Animate this image: ${script.substring(0, 300)}. Keep the visual style consistent with the reference image. ${aspectRatio} aspect ratio.`
    : script.substring(0, 500)
  
  // Model-specific configurations
  if (modelId.includes('wan-video')) {
    // Wan models - support both text and image input
    input = {
      prompt: visualPrompt,
      num_frames: Math.min(duration * 8, 80),
    }
    if (inputImage) {
      input.image = inputImage
      input.motion_bucket_id = 127
      input.cond_aug = 0.02
    }
  } else if (modelId.includes('pixverse')) {
    // PixVerse models - excellent for image-to-video
    input = {
      prompt: visualPrompt,
      duration: duration,
      aspect_ratio: aspectRatio,
    }
    if (inputImage) {
      input.image = inputImage
      input.motion_strength = 0.8
      input.seed = Math.floor(Math.random() * 1000000)
    }
  } else if (modelId.includes('veo')) {
    // Google Veo models
    input = {
      prompt: visualPrompt,
      duration: duration,
      aspect_ratio: aspectRatio,
    }
    if (inputImage) {
      input.image = inputImage
    }
  } else if (modelId.includes('kling')) {
    // Kling models
    input = {
      prompt: visualPrompt,
      duration: `${duration}`,
      aspect_ratio: aspectRatio,
    }
    if (inputImage) {
      input.image = inputImage
      input.creativity = 0.7
    }
  } else if (modelId.includes('hailuo') || modelId.includes('minimax')) {
    // Minimax/Hailuo models
    input = {
      prompt: visualPrompt,
    }
    if (inputImage) {
      input.first_frame_image = inputImage
    }
  } else if (modelId.includes('luma')) {
    // Luma Ray models
    input = {
      prompt: visualPrompt,
    }
    if (inputImage) {
      input.keyframes = {
        frame0: {
          type: 'image',
          url: inputImage
        }
      }
    }
  } else if (modelId.includes('sora')) {
    // OpenAI Sora
    input = {
      prompt: visualPrompt,
      duration: duration,
      aspect_ratio: aspectRatio,
    }
    if (inputImage) {
      input.image = inputImage
    }
  } else if (modelId.includes('seedance')) {
    // ByteDance Seedance
    input = {
      prompt: visualPrompt,
      duration: `${duration}s`,
      resolution: '1080p',
    }
    if (inputImage) {
      input.image = inputImage
    }
  } else if (modelId.includes('stable-video')) {
    // Stable Video Diffusion - image-to-video
    if (!inputImage) {
      throw new Error('This model requires an input image')
    }
    input = {
      input_image: inputImage,
      video_length: '25_frames_with_svd_xt',
      sizing_strategy: 'maintain_aspect_ratio',
      frames_per_second: 6,
      motion_bucket_id: 127,
      cond_aug: 0.02
    }
  } else {
    // Generic fallback
    input = {
      prompt: visualPrompt,
    }
    if (inputImage) {
      `)
      input.image = inputImage
    }
  }
  
  .substring(0, 200))
  
  // Use predictions.create and wait for completion
  let prediction = await replicate.predictions.create({
    version: modelId.split(':')[1], // Extract version ID from model string  
    input: input
  })
  
  // Poll until prediction completes
  while (prediction.status !== 'succeeded' && prediction.status !== 'failed' && prediction.status !== 'canceled') {
    await new Promise(resolve => setTimeout(resolve, 1000)) // Wait 1 second
    prediction = await replicate.predictions.get(prediction.id)
    }
  
  if (prediction.status !== 'succeeded') {
    throw new Error(`Prediction failed with status: ${prediction.status}`)
  }
  
  const output = prediction.output
  
  // Replicate returns a FileOutput object with url() method
  // Handle different output formats
  if (!output) {
    throw new Error('No output received from model')
  }
  
  // If output is a string URL
  if (typeof output === 'string') {
    return output
  }
  
  // If output is an array
  if (Array.isArray(output)) {
    const firstOutput = output[0]
    
    // Check if it's a FileOutput object with url() method
    if (firstOutput && typeof firstOutput.url === 'function') {
      const videoUrl = firstOutput.url()
      method:`, videoUrl)
      return typeof videoUrl === 'string' ? videoUrl : videoUrl.toString()
    }
    
    // Check if it's a FileOutput with toString()
    if (firstOutput && typeof firstOutput.toString === 'function') {
      const videoUrl = firstOutput.toString()
      :`, videoUrl)
      return videoUrl
    }
    
    // If it's already a string
    if (typeof firstOutput === 'string') {
      return firstOutput
    }
    
    // Fallback: return as-is
    return firstOutput
  }
  
  // If output has url() method (Replicate FileOutput)
  if (output && typeof output.url === 'function') {
    const videoUrl = output.url()
    method:`, videoUrl)
    // URL might be a URL object, convert to string
    return typeof videoUrl === 'string' ? videoUrl : videoUrl.href
  }
  
  // If output has url property
  if (output && typeof output.url === 'string') {
    return output.url
  }
  
  // If output has video property
  if (output && output.video) {
    return output.video
  }
  
  return output
}

function getModeInfo(mode) {
  const modes = {
    pro: {
      name: 'Pro Edit / Quality Mode',
      provider: 'Premium Models',
      time: '2-3 minutes'
    },
    fast: {
      name: 'Fast Social Mode',
      provider: 'Optimized Models',
      time: '1-2 minutes'
    },
    budget: {
      name: 'Budget Mode',
      provider: 'Cost-Effective Models',
      time: '40-100 seconds'
    }
  }
  return modes[mode] || modes.budget
}
