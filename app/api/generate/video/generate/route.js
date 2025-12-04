import { NextResponse } from 'next/server'
import Replicate from 'replicate'

export const maxDuration = 300 // 5 minutes timeout for video generation

// Smart model selection based on mode
const VIDEO_MODELS = {
  budget: [
    // Best budget options - fast and cost-effective
    { id: 'wan-video/wan-2.5-t2v-fast', type: 'text', priority: 1, cost: 'lowest' },
    { id: 'wan-video/wan-2.5-i2v-fast', type: 'image', priority: 1, cost: 'lowest' },
    { id: 'wavespeedai/wan-2.1-t2v-480p', type: 'text', priority: 2, cost: 'lowest' },
    { id: 'pixverse/pixverse-v4', type: 'both', priority: 3, cost: 'low' },
  ],
  fast: [
    // Fast quality options - good balance
    { id: 'pixverse/pixverse-v5', type: 'both', priority: 1, cost: 'medium' },
    { id: 'bytedance/seedance-1-pro-fast', type: 'both', priority: 2, cost: 'medium' },
    { id: 'luma/ray-flash-2-720p', type: 'both', priority: 3, cost: 'medium' },
    { id: 'wan-video/wan-2.5-t2v', type: 'text', priority: 4, cost: 'medium' },
  ],
  pro: [
    // Premium quality options - best results
    { id: 'google/veo-3.1-fast', type: 'both', priority: 1, cost: 'high' },
    { id: 'google/veo-3.1', type: 'both', priority: 2, cost: 'high' },
    { id: 'kwaivgi/kling-v2.5-turbo-pro', type: 'both', priority: 3, cost: 'high' },
    { id: 'minimax/hailuo-2.3', type: 'both', priority: 4, cost: 'high' },
    { id: 'openai/sora-2', type: 'both', priority: 5, cost: 'highest' },
  ]
}

export async function POST(request) {
  try {
    const { script, mode, duration, language, image } = await request.json()

    if (!script) {
      return NextResponse.json(
        { success: false, error: 'Script is required' },
        { status: 400 }
      )
    }

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

    // Determine which image to use (prefer objectImage, fallback to talkingHead)
    const imageToUse = objectImage || talkingHeadImage
    const hasImage = !!imageToUse
    
    console.log('[Video Generation] Has image input:', hasImage)
    console.log('[Video Generation] Image type:', objectImage ? 'object' : talkingHeadImage ? 'talking head' : 'none')
    
    const models = VIDEO_MODELS[mode] || VIDEO_MODELS.budget
    
    // Try models in priority order
    for (const model of models) {
      // Skip if model doesn't support required input type
      if (hasImage && model.type === 'text') {
        console.log(`[Video Generation] Skipping ${model.id} - requires image but model is text-only`)
        continue
      }
      if (!hasImage && model.type === 'image') {
        console.log(`[Video Generation] Skipping ${model.id} - no image but model requires one`)
        continue
      }
      
      try {
        console.log(`[Video Generation] Attempting ${model.id} for ${mode} mode with${hasImage ? '' : 'out'} image...`)
        const result = await generateWithModel(replicate, model.id, script, duration, imageToUse)
        
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

async function generateWithModel(replicate, modelId, script, duration = 5, inputImage = null) {
  const isTextModel = modelId.includes('t2v') || modelId.includes('text')
  const isImageModel = modelId.includes('i2v') || modelId.includes('image')
  
  // Build input based on model type
  let input = {}
  
  // Model-specific configurations
  if (modelId.includes('wan-video')) {
    // Wan models
    input = {
      prompt: script.substring(0, 500),
      num_frames: Math.min(duration * 8, 80),
    }
    if (inputImage && isImageModel) {
      input.image = inputImage
    }
  } else if (modelId.includes('pixverse')) {
    // PixVerse models
    input = {
      prompt: script.substring(0, 500),
      duration: duration,
      aspect_ratio: '9:16',
    }
    if (inputImage) {
      input.image = inputImage
      input.motion_strength = 0.8
    }
  } else if (modelId.includes('veo')) {
    // Google Veo models
    input = {
      prompt: script.substring(0, 500),
      duration: duration,
      aspect_ratio: '9:16',
    }
    if (inputImage) {
      input.image = inputImage
    }
  } else if (modelId.includes('kling')) {
    // Kling models
    input = {
      prompt: script.substring(0, 500),
      duration: `${duration}`,
      aspect_ratio: '9:16',
    }
    if (inputImage) {
      input.image = inputImage
    }
  } else if (modelId.includes('hailuo') || modelId.includes('minimax')) {
    // Minimax/Hailuo models
    input = {
      prompt: script.substring(0, 500),
    }
    if (inputImage) {
      input.first_frame_image = inputImage
    }
  } else if (modelId.includes('luma')) {
    // Luma Ray models
    input = {
      prompt: script.substring(0, 500),
    }
    if (inputImage) {
      input.image = inputImage
    }
  } else if (modelId.includes('sora')) {
    // OpenAI Sora
    input = {
      prompt: script.substring(0, 500),
      duration: duration,
      aspect_ratio: '9:16',
    }
  } else if (modelId.includes('seedance')) {
    // ByteDance Seedance
    input = {
      prompt: script.substring(0, 500),
      duration: `${duration}s`,
      resolution: '1080p',
    }
    if (inputImage) {
      input.image = inputImage
    }
  } else {
    // Generic fallback
    input = {
      prompt: script.substring(0, 500),
    }
    if (inputImage) {
      input.image = inputImage
    }
  }
  
  console.log(`[${modelId}] Running with input:`, JSON.stringify(input).substring(0, 200))
  
  const output = await replicate.run(modelId, { input })
  
  console.log(`[${modelId}] Raw output:`, output)
  console.log(`[${modelId}] Output keys:`, output ? Object.keys(output) : 'null')
  
  // Replicate returns a FileOutput object with url() method
  // Handle different output formats
  if (!output) {
    throw new Error('No output received from model')
  }
  
  // If output is a string URL
  if (typeof output === 'string') {
    console.log(`[${modelId}] Direct URL:`, output)
    return output
  }
  
  // If output is an array
  if (Array.isArray(output)) {
    console.log(`[${modelId}] Array output, taking first element`)
    return output[0]
  }
  
  // If output has url() method (Replicate FileOutput)
  if (output && typeof output.url === 'function') {
    const videoUrl = output.url()
    console.log(`[${modelId}] Got URL from url() method:`, videoUrl)
    // URL might be a URL object, convert to string
    return typeof videoUrl === 'string' ? videoUrl : videoUrl.href
  }
  
  // If output has url property
  if (output && typeof output.url === 'string') {
    console.log(`[${modelId}] URL from property:`, output.url)
    return output.url
  }
  
  // If output has video property
  if (output && output.video) {
    console.log(`[${modelId}] URL from video property:`, output.video)
    return output.video
  }
  
  console.warn(`[${modelId}] Unexpected output format, returning as-is`)
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
