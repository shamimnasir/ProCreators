import { NextResponse } from 'next/server'
import { writeFile, mkdir, readFile } from 'fs/promises'
import { existsSync } from 'fs'
import { join } from 'path'
import { randomUUID } from 'crypto'

export const maxDuration = 300 // 5 minutes timeout
export const dynamic = 'force-dynamic'

// Provider configurations
const PROVIDERS = {
  shotstack: {
    name: 'Shotstack',
    description: 'Professional video editing API - best for slideshows, text animations, and composed videos',
    baseUrl: process.env.SHOTSTACK_ENV === 'production' 
      ? 'https://api.shotstack.io/v1'
      : 'https://api.shotstack.io/stage'
  },
  replicate: {
    name: 'Replicate',
    description: 'AI video generation - best for image-to-video and text-to-video AI generation'
  }
}

export async function POST(request) {
  const jobId = randomUUID()
  
  try {
    console.log(`[${jobId}] Starting video generation...`)
    
    // Parse request
    const formData = await request.formData()
    const provider = formData.get('provider') || 'shotstack' // Default to Shotstack
    const mode = formData.get('mode') // 'image-to-video', 'text-to-video', 'slideshow'
    const prompt = formData.get('prompt') || ''
    const duration = parseInt(formData.get('duration') || '5')
    const format = formData.get('format') || 'portrait'
    const templateId = formData.get('templateId') || 'custom'
    const imageFile = formData.get('image')
    
    // Check if imageFile is actually a file or just a string
    const hasValidImage = imageFile && typeof imageFile !== 'string' && imageFile.size > 0
    console.log(`[${jobId}] Provider: ${provider}, Mode: ${mode}, Duration: ${duration}s`)
    console.log(`[${jobId}] ImageFile type: ${typeof imageFile}, HasValidImage: ${hasValidImage}, Size: ${imageFile?.size || 0}`)
    
    let result
    
    if (provider === 'shotstack') {
      result = await generateWithShotstack({
        jobId,
        mode,
        prompt,
        duration,
        format,
        templateId,
        imageFile
      })
    } else if (provider === 'replicate') {
      result = await generateWithReplicate({
        jobId,
        mode,
        prompt,
        duration,
        format,
        templateId,
        imageFile
      })
    } else {
      throw new Error(`Unknown provider: ${provider}`)
    }
    
    return NextResponse.json({
      success: true,
      provider,
      ...result
    })
    
  } catch (error) {
    console.error(`[${jobId}] Video generation error:`, error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to generate video' },
      { status: 500 }
    )
  }
}

// ==================== SHOTSTACK GENERATION ====================
async function generateWithShotstack({ jobId, mode, prompt, duration, format, templateId, imageFile }) {
  console.log(`[${jobId}] Using Shotstack for video generation...`)
  
  const apiKey = process.env.SHOTSTACK_API_KEY
  if (!apiKey) {
    throw new Error('Shotstack API key not configured')
  }
  
  const baseUrl = PROVIDERS.shotstack.baseUrl
  
  // Get format dimensions
  const dimensions = format === 'portrait' 
    ? { width: 1080, height: 1920 }
    : { width: 1920, height: 1080 }
  
  // Build the edit JSON based on mode
  let editJson
  
  if (mode === 'image-to-video' && imageFile && typeof imageFile !== 'string' && imageFile.size > 0) {
    // For image-to-video, first upload the image to Shotstack Serve API
    console.log(`[${jobId}] Uploading image to Shotstack Serve...`)
    const imageUrl = await uploadImageToShotstack(imageFile, apiKey, baseUrl, jobId)
    console.log(`[${jobId}] Image uploaded: ${imageUrl}`)
    editJson = buildImageVideoEdit(imageUrl, prompt, duration, dimensions)
  } else if (mode === 'image-to-video' && (!imageFile || imageFile.size === 0)) {
    // Image mode but no image - fall back to text with a message
    console.log(`[${jobId}] No image provided for image-to-video, using text mode`)
    editJson = buildTextVideoEdit(prompt || 'Upload an image to animate', duration, dimensions, templateId)
  } else if (mode === 'text-to-video' || mode === 'slideshow' || !imageFile) {
    // Create a text animation video with background and text overlays
    editJson = buildTextVideoEdit(prompt, duration, dimensions, templateId)
  } else {
    // Default: create a simple animated video
    editJson = buildDefaultVideoEdit(prompt, duration, dimensions)
  }
  
  console.log(`[${jobId}] Submitting to Shotstack:`, JSON.stringify(editJson).substring(0, 500))
  
  // Submit render request
  const renderResponse = await fetch(`${baseUrl}/render`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey
    },
    body: JSON.stringify(editJson)
  })
  
  if (!renderResponse.ok) {
    const errorText = await renderResponse.text()
    console.error(`[${jobId}] Shotstack render error:`, errorText)
    throw new Error(`Shotstack render failed: ${renderResponse.status} - ${errorText}`)
  }
  
  const renderData = await renderResponse.json()
  const renderId = renderData.response?.id
  
  if (!renderId) {
    throw new Error('No render ID returned from Shotstack')
  }
  
  console.log(`[${jobId}] Render submitted. ID: ${renderId}`)
  
  // Poll for completion
  let videoUrl = null
  let attempts = 0
  const maxAttempts = 60 // 2 minutes max
  
  while (!videoUrl && attempts < maxAttempts) {
    await new Promise(r => setTimeout(r, 2000))
    attempts++
    
    const statusResponse = await fetch(`${baseUrl}/render/${renderId}`, {
      headers: { 'x-api-key': apiKey }
    })
    
    if (!statusResponse.ok) {
      console.error(`[${jobId}] Status check failed:`, statusResponse.status)
      continue
    }
    
    const statusData = await statusResponse.json()
    const status = statusData.response?.status
    
    console.log(`[${jobId}] Render status: ${status} (attempt ${attempts})`)
    
    if (status === 'done') {
      videoUrl = statusData.response?.url
      console.log(`[${jobId}] ✅ Render complete! URL: ${videoUrl}`)
    } else if (status === 'failed') {
      throw new Error(`Shotstack render failed: ${statusData.response?.error || 'Unknown error'}`)
    }
  }
  
  if (!videoUrl) {
    throw new Error('Render timed out')
  }
  
  return {
    videoUrl,
    renderId,
    duration,
    format,
    provider: 'shotstack'
  }
}

// Upload image to Shotstack Serve API
async function uploadImageToShotstack(imageFile, apiKey, baseUrl, jobId) {
  try {
    // Read the image as buffer
    const imageBuffer = Buffer.from(await imageFile.arrayBuffer())
    const mimeType = imageFile.type || 'image/jpeg'
    const extension = mimeType.split('/')[1] || 'jpg'
    
    // For Shotstack, we need to use a publicly accessible URL
    // Option 1: Upload to Shotstack's serve endpoint
    // Option 2: Save locally and serve via public folder
    
    // Using Option 2: Save to public folder and return URL
    const publicDir = join(process.cwd(), 'public', 'ai-video-uploads')
    await mkdir(publicDir, { recursive: true })
    
    const fileName = `${jobId}.${extension}`
    const filePath = join(publicDir, fileName)
    await writeFile(filePath, imageBuffer)
    
    // Return the public URL
    const publicUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/ai-video-uploads/${fileName}`
    console.log(`[${jobId}] Image saved to: ${publicUrl}`)
    
    return publicUrl
  } catch (error) {
    console.error(`[${jobId}] Image upload error:`, error)
    // Return a sample image as fallback
    return 'https://shotstack-assets.s3.amazonaws.com/images/earth.jpg'
  }
}

// Build edit JSON for text/prompt-based video
function buildTextVideoEdit(prompt, duration, dimensions, templateId) {
  // Create text slides from the prompt
  const lines = prompt ? prompt.split('\n').filter(l => l.trim()).slice(0, 5) : ['Your Video']
  const slideDuration = Math.max(2, Math.floor(duration / Math.max(1, lines.length)))
  
  // Color schemes based on template
  const colorSchemes = {
    'auto-story-reels': { bg: '#1a1a2e', text: '#eaeaea', accent: '#e94560' },
    'motivation-broll': { bg: '#0f0f0f', text: '#ffffff', accent: '#ffd700' },
    'cinematic-script': { bg: '#000000', text: '#ffffff', accent: '#4a90d9' },
    'small-business-promo': { bg: '#1e3a5f', text: '#ffffff', accent: '#ff6b35' },
    'default': { bg: '#0a0a0a', text: '#ffffff', accent: '#00d4ff' }
  }
  
  const colors = colorSchemes[templateId] || colorSchemes.default
  
  const clips = []
  
  // Add background
  clips.push({
    asset: {
      type: 'html',
      html: `<div style="width:100%;height:100%;background:linear-gradient(135deg, ${colors.bg} 0%, ${colors.accent}22 100%);"></div>`,
      width: dimensions.width,
      height: dimensions.height
    },
    start: 0,
    length: duration
  })
  
  // Add text for each line with animation
  lines.forEach((line, index) => {
    const startTime = index * slideDuration
    const fontSize = dimensions.width < 1200 ? 60 : 80
    
    clips.push({
      asset: {
        type: 'html',
        html: `<div style="display:flex;align-items:center;justify-content:center;height:100%;padding:40px;text-align:center;">
          <p style="font-family:'Montserrat',sans-serif;font-size:${fontSize}px;color:${colors.text};font-weight:bold;line-height:1.3;text-shadow:2px 2px 10px rgba(0,0,0,0.8);">${line.trim()}</p>
        </div>`,
        width: dimensions.width,
        height: dimensions.height
      },
      start: startTime,
      length: slideDuration,
      transition: {
        in: 'fade',
        out: 'fade'
      },
      effect: 'zoomIn'
    })
  })
  
  return {
    timeline: {
      background: colors.bg,
      fonts: [
        {
          src: 'https://fonts.googleapis.com/css2?family=Montserrat:wght@700&display=swap'
        }
      ],
      tracks: [{ clips }]
    },
    output: {
      format: 'mp4',
      size: {
        width: dimensions.width,
        height: dimensions.height
      },
      fps: 30
    }
  }
}

// Build edit JSON for image-based video with Ken Burns effect
function buildImageVideoEdit(imageUrl, prompt, duration, dimensions) {
  const clips = [
    {
      asset: {
        type: 'image',
        src: imageUrl
      },
      start: 0,
      length: duration,
      fit: 'cover',
      effect: 'zoomIn',
      transition: {
        in: 'fade',
        out: 'fade'
      }
    }
  ]
  
  // Add text overlay if prompt is provided
  if (prompt && prompt.trim()) {
    clips.push({
      asset: {
        type: 'html',
        html: `<div style="display:flex;align-items:flex-end;justify-content:center;height:100%;padding:60px;background:linear-gradient(transparent 60%, rgba(0,0,0,0.7) 100%);">
          <p style="font-family:'Montserrat',sans-serif;font-size:48px;color:white;text-align:center;font-weight:bold;text-shadow:2px 2px 10px rgba(0,0,0,0.8);">${prompt.substring(0, 100)}</p>
        </div>`,
        width: dimensions.width,
        height: dimensions.height
      },
      start: 0,
      length: duration
    })
  }
  
  return {
    timeline: {
      background: '#000000',
      fonts: [
        {
          src: 'https://fonts.googleapis.com/css2?family=Montserrat:wght@700&display=swap'
        }
      ],
      tracks: [{ clips }]
    },
    output: {
      format: 'mp4',
      size: {
        width: dimensions.width,
        height: dimensions.height
      },
      fps: 30
    }
  }
}

// Build default video edit
function buildDefaultVideoEdit(prompt, duration, dimensions) {
  return {
    timeline: {
      background: '#000000',
      fonts: [
        {
          src: 'https://fonts.googleapis.com/css2?family=Montserrat:wght@700&display=swap'
        }
      ],
      tracks: [
        {
          clips: [
            {
              asset: {
                type: 'html',
                html: `<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);padding:60px;">
                  <p style="font-family:'Montserrat',sans-serif;font-size:72px;color:white;text-align:center;font-weight:bold;text-shadow:2px 2px 20px rgba(0,0,0,0.5);">${(prompt || 'Your Video').substring(0, 150)}</p>
                </div>`,
                width: dimensions.width,
                height: dimensions.height
              },
              start: 0,
              length: duration,
              effect: 'zoomIn',
              transition: {
                in: 'fade',
                out: 'fade'
              }
            }
          ]
        }
      ]
    },
    output: {
      format: 'mp4',
      size: {
        width: dimensions.width,
        height: dimensions.height
      },
      fps: 30
    }
  }
}

// ==================== REPLICATE GENERATION ====================
async function generateWithReplicate({ jobId, mode, prompt, duration, format, templateId, imageFile }) {
  console.log(`[${jobId}] Using Replicate for AI video generation...`)
  
  const replicateKey = process.env.REPLICATE_API_TOKEN
  
  if (!replicateKey) {
    throw new Error('Replicate API key not configured. Please add REPLICATE_API_TOKEN to environment variables.')
  }
  
  // Get format dimensions
  const dimensions = format === 'portrait' 
    ? { width: 576, height: 1024 }
    : { width: 1024, height: 576 }
  
  let videoUrl
  
  if (mode === 'image-to-video' && imageFile) {
    // Convert uploaded image to base64
    const imageBuffer = Buffer.from(await imageFile.arrayBuffer())
    const base64Image = imageBuffer.toString('base64')
    const mimeType = imageFile.type || 'image/jpeg'
    const imageDataUrl = `data:${mimeType};base64,${base64Image}`
    
    console.log(`[${jobId}] Running SVD image-to-video...`)
    
    // Use Stable Video Diffusion via Replicate API directly
    const response = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${replicateKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        version: '3f0457e4619daac51203dedb472816fd4af51f3149fa7a9e0b5ffcf1b8172438',
        input: {
          input_image: imageDataUrl,
          video_length: '25_frames_with_svd_xt',
          sizing_strategy: 'maintain_aspect_ratio',
          frames_per_second: 6,
          motion_bucket_id: 127,
          cond_aug: 0.02
        }
      })
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Replicate API error: ${response.status} - ${errorText}`)
    }
    
    let prediction = await response.json()
    console.log(`[${jobId}] Prediction started: ${prediction.id}`)
    
    // Poll until complete
    while (!['succeeded', 'failed', 'canceled'].includes(prediction.status)) {
      await new Promise(r => setTimeout(r, 2000))
      
      const statusResponse = await fetch(`https://api.replicate.com/v1/predictions/${prediction.id}`, {
        headers: { 'Authorization': `Bearer ${replicateKey}` }
      })
      prediction = await statusResponse.json()
      console.log(`[${jobId}] SVD status: ${prediction.status}`)
    }
    
    if (prediction.status !== 'succeeded') {
      throw new Error(`SVD generation failed: ${prediction.error || prediction.status}`)
    }
    
    videoUrl = extractVideoUrl(prediction.output)
    
  } else {
    // Text-to-video using ZeroScope
    console.log(`[${jobId}] Running ZeroScope text-to-video...`)
    
    const formattedPrompt = format === 'portrait'
      ? `${prompt || 'beautiful scenery'}, vertical video, 9:16 aspect ratio, high quality`
      : `${prompt || 'beautiful scenery'}, horizontal video, 16:9 aspect ratio, cinematic, high quality`
    
    const response = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${replicateKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        version: '9f747673945c62801b13b84701c783929c0ee784e4748ec062204894dda1a351',
        input: {
          prompt: formattedPrompt,
          num_frames: 36,
          fps: 8,
          width: dimensions.width,
          height: dimensions.height
        }
      })
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Replicate API error: ${response.status} - ${errorText}`)
    }
    
    let prediction = await response.json()
    console.log(`[${jobId}] Prediction started: ${prediction.id}`)
    
    // Poll until complete
    while (!['succeeded', 'failed', 'canceled'].includes(prediction.status)) {
      await new Promise(r => setTimeout(r, 2000))
      
      const statusResponse = await fetch(`https://api.replicate.com/v1/predictions/${prediction.id}`, {
        headers: { 'Authorization': `Bearer ${replicateKey}` }
      })
      prediction = await statusResponse.json()
      console.log(`[${jobId}] ZeroScope status: ${prediction.status}`)
    }
    
    if (prediction.status !== 'succeeded') {
      throw new Error(`ZeroScope generation failed: ${prediction.error || prediction.status}`)
    }
    
    videoUrl = extractVideoUrl(prediction.output)
  }
  
  if (!videoUrl) {
    throw new Error('No video URL returned from Replicate')
  }
  
  console.log(`[${jobId}] ✅ Replicate generation complete! URL: ${videoUrl}`)
  
  return {
    videoUrl,
    duration,
    format,
    provider: 'replicate'
  }
}

// Helper to extract video URL from various output formats
function extractVideoUrl(output) {
  if (!output) return null
  if (typeof output === 'string') return output
  if (Array.isArray(output)) {
    const first = output[0]
    if (typeof first === 'string') return first
    if (first?.url) return typeof first.url === 'function' ? first.url() : first.url
  }
  if (output.url) return typeof output.url === 'function' ? output.url() : output.url
  if (output.video) return output.video
  return null
}
