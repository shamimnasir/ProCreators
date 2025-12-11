import { NextResponse } from 'next/server'
import { writeFile, mkdir, readFile } from 'fs/promises'
import { existsSync } from 'fs'
import { join } from 'path'
import { randomUUID } from 'crypto'
import { buildCinematicVideoEdit, getTemplateVisualConfig } from '@/lib/cinematic-video-builder'

export const maxDuration = 300 // 5 minutes timeout
export const dynamic = 'force-dynamic'

// Stock video keywords for different templates
const TEMPLATE_VIDEO_KEYWORDS = {
  'auto-story-reels': ['dramatic', 'cinematic', 'emotional', 'city night', 'people silhouette'],
  'small-business-promo': ['business office', 'professional', 'success', 'modern building', 'teamwork'],
  'motivation-broll': ['fitness gym', 'mountain summit', 'sunrise motivation', 'running athlete', 'achievement'],
  'cinematic-script': ['cinematic rain', 'film noir', 'dramatic clouds', 'atmosphere fog', 'dark city'],
  'local-language-explainer': ['technology abstract', 'education', 'world globe', 'science', 'digital'],
  'music-facts': ['abstract particles', 'neon lights', 'energy waves', 'colorful abstract', 'dynamic motion'],
  'tribute-video': ['love couple', 'family happy', 'memories photo', 'celebration', 'romantic sunset'],
  'default': ['abstract background', 'nature aerial', 'city skyline', 'modern architecture', 'sky clouds']
}

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

// Fetch stock videos from Pexels
async function fetchStockVideos(keywords, count = 3) {
  const pexelsKey = process.env.PEXELS_API_KEY
  
  if (!pexelsKey) {
    console.log('[Stock Videos] No PEXELS_API_KEY, using fallback videos')
    return getFallbackVideos(count)
  }
  
  const videos = []
  
  for (const keyword of keywords.slice(0, count)) {
    try {
      const response = await fetch(
        `https://api.pexels.com/videos/search?query=${encodeURIComponent(keyword)}&per_page=3&orientation=portrait`,
        {
          headers: { 'Authorization': pexelsKey }
        }
      )
      
      if (response.ok) {
        const data = await response.json()
        if (data.videos && data.videos.length > 0) {
          // Get the first video with a suitable file
          const video = data.videos[0]
          const videoFile = video.video_files.find(f => f.quality === 'hd' || f.quality === 'sd') || video.video_files[0]
          if (videoFile) {
            videos.push({
              url: videoFile.link,
              keyword,
              width: videoFile.width,
              height: videoFile.height
            })
          }
        }
      }
    } catch (error) {
      console.error(`[Stock Videos] Error fetching for "${keyword}":`, error.message)
    }
  }
  
  // Fill with fallbacks if needed
  while (videos.length < count) {
    const fallbacks = getFallbackVideos(count - videos.length)
    videos.push(...fallbacks)
  }
  
  return videos.slice(0, count)
}

// Fallback stock videos (using Shotstack's free assets - guaranteed working)
function getFallbackVideos(count) {
  const fallbackUrls = [
    'https://shotstack-assets.s3.amazonaws.com/footage/beach-overhead.mp4',
    'https://shotstack-assets.s3.amazonaws.com/footage/earth.mp4',
    'https://shotstack-assets.s3.amazonaws.com/footage/night-sky.mp4',
    'https://shotstack-assets.s3.amazonaws.com/footage/city-timelapse.mp4',
    'https://shotstack-assets.s3.amazonaws.com/footage/rain-on-window.mp4',
    'https://shotstack-assets.s3.amazonaws.com/footage/slow-motion-coffee.mp4',
    'https://shotstack-assets.s3.amazonaws.com/footage/abstract-blue.mp4',
  ]
  
  return fallbackUrls.slice(0, count).map((url, i) => ({
    url,
    keyword: 'background',
    width: 1920,
    height: 1080
  }))
}

// Generate AI video scenes using Replicate
async function generateAIVideoScenes(prompt, duration, format, jobId) {
  const replicateKey = process.env.REPLICATE_API_TOKEN
  
  if (!replicateKey) {
    console.log(`[${jobId}] No Replicate key, falling back to stock videos`)
    return getFallbackVideos(Math.ceil(duration / 5))
  }
  
  const numScenes = Math.ceil(duration / 5) // Each scene is ~5 seconds
  const aiVideos = []
  
  // Parse prompt into scene descriptions
  const scenes = parsePromptToScenes(prompt, numScenes)
  
  console.log(`[${jobId}] Generating ${scenes.length} AI scenes...`)
  
  // Get format dimensions for AI generation
  const dimensions = format === 'portrait' 
    ? { width: 576, height: 1024 }
    : { width: 1024, height: 576 }
  
  // Generate scenes in parallel (up to 2 at a time to avoid rate limits)
  for (let i = 0; i < scenes.length; i++) {
    const scene = scenes[i]
    console.log(`[${jobId}] Generating scene ${i + 1}/${scenes.length}: "${scene.substring(0, 50)}..."`)
    
    try {
      // Use ZeroScope for text-to-video
      const response = await fetch('https://api.replicate.com/v1/predictions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${replicateKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          version: '9f747673945c62801b13b84701c783929c0ee784e4748ec062204894dda1a351',
          input: {
            prompt: `${scene}, cinematic lighting, high quality, smooth motion, ${format === 'portrait' ? 'vertical video 9:16' : 'horizontal video 16:9'}`,
            num_frames: 36,
            fps: 8,
            width: dimensions.width,
            height: dimensions.height
          }
        })
      })
      
      if (!response.ok) {
        console.error(`[${jobId}] Scene ${i + 1} failed to start:`, response.status)
        continue
      }
      
      let prediction = await response.json()
      console.log(`[${jobId}] Scene ${i + 1} prediction ID: ${prediction.id}`)
      
      // Poll until complete
      let attempts = 0
      while (!['succeeded', 'failed', 'canceled'].includes(prediction.status) && attempts < 120) {
        await new Promise(r => setTimeout(r, 2000))
        attempts++
        
        const statusResponse = await fetch(`https://api.replicate.com/v1/predictions/${prediction.id}`, {
          headers: { 'Authorization': `Bearer ${replicateKey}` }
        })
        prediction = await statusResponse.json()
        
        if (attempts % 10 === 0) {
          console.log(`[${jobId}] Scene ${i + 1} status: ${prediction.status} (${attempts * 2}s)`)
        }
      }
      
      if (prediction.status === 'succeeded' && prediction.output) {
        const videoUrl = Array.isArray(prediction.output) ? prediction.output[0] : prediction.output
        console.log(`[${jobId}] ✅ Scene ${i + 1} complete: ${videoUrl}`)
        aiVideos.push({
          url: videoUrl,
          keyword: scene,
          width: dimensions.width,
          height: dimensions.height
        })
      } else {
        console.error(`[${jobId}] Scene ${i + 1} failed: ${prediction.status}`)
      }
    } catch (error) {
      console.error(`[${jobId}] Scene ${i + 1} error:`, error.message)
    }
  }
  
  // If we didn't get any AI videos, fall back to stock
  if (aiVideos.length === 0) {
    console.log(`[${jobId}] No AI videos generated, falling back to stock videos`)
    return getFallbackVideos(numScenes)
  }
  
  return aiVideos
}

// Parse prompt into individual scene descriptions
function parsePromptToScenes(prompt, numScenes) {
  // Split by newlines or sentences
  let parts = prompt.split(/\n+/).filter(l => l.trim())
  
  if (parts.length < numScenes) {
    // Split by sentences
    parts = prompt.split(/[.!?]+/).filter(l => l.trim()).map(l => l.trim())
  }
  
  // Ensure we have enough scenes
  while (parts.length < numScenes) {
    // Duplicate the last part with variations
    const lastPart = parts[parts.length - 1] || prompt
    parts.push(lastPart + ', different angle')
  }
  
  // Take only what we need
  return parts.slice(0, numScenes)
}

export async function POST(request) {
  const jobId = randomUUID()
  
  try {
    console.log(`[${jobId}] Starting video generation...`)
    
    // Parse request
    const formData = await request.formData()
    const mode = formData.get('mode') // 'image-to-video', 'text-to-video', 'slideshow'
    const prompt = formData.get('prompt') || ''
    const duration = parseInt(formData.get('duration') || '5')
    const format = formData.get('format') || 'portrait'
    const templateId = formData.get('templateId') || 'custom'
    const imageFile = formData.get('image')
    const videoSource = formData.get('videoSource') || 'stock' // 'stock', 'ai', 'hybrid'
    
    // Check if imageFile is actually a file or just a string
    const hasValidImage = imageFile && typeof imageFile !== 'string' && imageFile.size > 0
    console.log(`[${jobId}] Mode: ${mode}, Duration: ${duration}s, Format: ${format}`)
    console.log(`[${jobId}] Template: ${templateId}, VideoSource: ${videoSource}, HasValidImage: ${hasValidImage}`)
    
    // Use Shotstack for all video generation
    const result = await generateWithShotstack({
      jobId,
      mode,
      prompt,
      duration,
      format,
      templateId,
      imageFile,
      videoSource // Pass the video source selection
    })
    
    return NextResponse.json({
      success: true,
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
async function generateWithShotstack({ jobId, mode, prompt, duration, format, templateId, imageFile, videoSource }) {
  console.log(`[${jobId}] Using Shotstack for video generation (source: ${videoSource})...`)
  
  const apiKey = process.env.SHOTSTACK_API_KEY
  if (!apiKey) {
    throw new Error('Shotstack API key not configured')
  }
  
  const baseUrl = PROVIDERS.shotstack.baseUrl
  
  // Get format dimensions
  const dimensions = format === 'portrait' 
    ? { width: 1080, height: 1920 }
    : { width: 1920, height: 1080 }
  
  // Build the edit JSON based on mode and video source
  let editJson
  
  if (mode === 'image-to-video' && imageFile && typeof imageFile !== 'string' && imageFile.size > 0) {
    // For image-to-video, first upload the image to Shotstack Serve API
    console.log(`[${jobId}] Uploading image to Shotstack...`)
    const imageUrl = await uploadImageToShotstack(imageFile, apiKey, baseUrl, jobId)
    console.log(`[${jobId}] Image uploaded: ${imageUrl}`)
    editJson = buildImageVideoEdit(imageUrl, prompt, duration, dimensions, templateId)
  } else if (videoSource === 'ai') {
    // AI-Generated Scenes: Use Shotstack's text-to-image and image-to-video assets
    console.log(`[${jobId}] Building AI-generated video using FLUX model...`)
    editJson = buildAIGeneratedVideoEdit(templateId, prompt, duration, dimensions, jobId)
  } else if (videoSource === 'hybrid') {
    // Hybrid: Mix AI-generated scenes with stock footage
    console.log(`[${jobId}] Building hybrid video (AI + Stock)...`)
    const keywords = getKeywordsFromPromptAndTemplate(prompt, templateId)
    const stockVideos = await fetchStockVideos(keywords, Math.ceil(duration / 10)) // Half as many stock videos
    editJson = buildHybridVideoEdit(templateId, prompt, duration, dimensions, stockVideos, jobId)
  } else {
    // Stock Videos: Original implementation
    console.log(`[${jobId}] Fetching cinematic stock videos for template: ${templateId}`)
    const keywords = getKeywordsFromPromptAndTemplate(prompt, templateId)
    console.log(`[${jobId}] Keywords: ${keywords.join(', ')}`)
    
    const stockVideos = await fetchStockVideos(keywords, Math.ceil(duration / 5))
    console.log(`[${jobId}] Fetched ${stockVideos.length} stock videos`)
    
    // Build video with stock footage backgrounds
    editJson = buildStockVideoEdit(templateId, prompt, duration, dimensions, stockVideos)
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

// Build edit JSON for image-based video with Ken Burns effect
function buildImageVideoEdit(imageUrl, prompt, duration, dimensions, templateId) {
  const config = getTemplateVisualConfig(templateId)
  
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
  
  // Add branded text overlay if prompt is provided
  if (prompt && prompt.trim()) {
    clips.push({
      asset: {
        type: 'html',
        html: `<div style="display:flex;align-items:flex-end;justify-content:center;height:100%;padding:60px;background:linear-gradient(transparent 50%, ${config.colorScheme.secondary}ee 100%);">
          <div style="text-align:center;">
            <p style="font-family:'${config.typography.fontFamily}',sans-serif;font-size:${config.typography.titleSize}px;color:${config.colorScheme.text};text-align:center;font-weight:${config.typography.fontWeight};text-shadow:0 4px 20px rgba(0,0,0,0.8);line-height:1.2;">${prompt.substring(0, 100)}</p>
            <div style="margin-top:20px;width:60px;height:4px;background:${config.colorScheme.primary};margin:20px auto 0;"></div>
          </div>
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
      background: config.colorScheme.secondary,
      fonts: [
        { src: `https://fonts.googleapis.com/css2?family=${config.typography.fontFamily.replace(' ', '+')}:wght@400;700&display=swap` }
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

// Extract keywords from prompt and template for stock video search
function getKeywordsFromPromptAndTemplate(prompt, templateId) {
  // Get template-specific keywords
  const templateKeywords = TEMPLATE_VIDEO_KEYWORDS[templateId] || TEMPLATE_VIDEO_KEYWORDS['default']
  
  // Extract important words from prompt
  const promptWords = prompt
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 3)
    .slice(0, 3)
  
  // Combine and deduplicate
  const allKeywords = [...promptWords, ...templateKeywords]
  return [...new Set(allKeywords)].slice(0, 5)
}

// Build video edit with stock footage backgrounds
function buildStockVideoEdit(templateId, prompt, duration, dimensions, stockVideos) {
  const config = getTemplateVisualConfig(templateId)
  const lines = parsePromptToLines(prompt, 4)
  
  // Calculate segment durations
  const numSegments = Math.max(1, stockVideos.length)
  const segmentDuration = Math.max(3, duration / numSegments)
  
  const tracks = []
  
  // Track 1: Stock video backgrounds
  const videoClips = stockVideos.map((video, index) => ({
    asset: {
      type: 'video',
      src: video.url,
      volume: 0 // Mute the video
    },
    start: index * segmentDuration,
    length: segmentDuration + 0.5, // Small overlap for smooth transition
    fit: 'cover',
    effect: index % 2 === 0 ? 'zoomIn' : 'zoomOut',
    transition: {
      in: 'fade',
      out: 'fade'
    }
  }))
  
  tracks.push({ clips: videoClips })
  
  // Track 2: Dark overlay for text readability
  tracks.push({
    clips: [{
      asset: {
        type: 'html',
        html: `<div style="width:100%;height:100%;background:linear-gradient(180deg, ${config.colorScheme.secondary}99 0%, ${config.colorScheme.secondary}dd 100%);"></div>`,
        width: dimensions.width,
        height: dimensions.height
      },
      start: 0,
      length: duration
    }]
  })
  
  // Track 3: Animated accent elements
  tracks.push({
    clips: [{
      asset: {
        type: 'html',
        html: `<div style="position:relative;width:100%;height:100%;">
          <div style="position:absolute;top:10%;left:50%;transform:translateX(-50%);width:80%;height:4px;background:linear-gradient(90deg, transparent, ${config.colorScheme.primary}, transparent);"></div>
          <div style="position:absolute;bottom:10%;left:50%;transform:translateX(-50%);width:60%;height:4px;background:linear-gradient(90deg, transparent, ${config.colorScheme.accent || config.colorScheme.primary}, transparent);"></div>
        </div>`,
        width: dimensions.width,
        height: dimensions.height
      },
      start: 0,
      length: duration
    }]
  })
  
  // Track 4: Main text content
  const textClips = lines.map((line, index) => {
    const startTime = index * (duration / lines.length)
    const clipDuration = duration / lines.length + 0.3
    
    return {
      asset: {
        type: 'html',
        html: `<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;padding:60px;">
          <p style="font-family:'${config.typography.fontFamily}',sans-serif;font-size:${config.typography.titleSize}px;color:${config.colorScheme.text};font-weight:${config.typography.fontWeight};text-align:center;text-shadow:0 4px 30px rgba(0,0,0,0.9),0 0 60px ${config.colorScheme.primary}44;line-height:1.2;max-width:90%;">
            ${line}
          </p>
          <div style="margin-top:30px;width:80px;height:4px;background:${config.colorScheme.primary};"></div>
        </div>`,
        width: dimensions.width,
        height: dimensions.height
      },
      start: startTime,
      length: clipDuration,
      effect: 'slideUp',
      transition: {
        in: 'fade',
        out: 'fade'
      }
    }
  })
  
  tracks.push({ clips: textClips })
  
  return {
    timeline: {
      background: config.colorScheme.secondary,
      fonts: [
        { src: `https://fonts.googleapis.com/css2?family=${config.typography.fontFamily.replace(' ', '+')}:wght@400;700;800&display=swap` }
      ],
      tracks
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

// Parse prompt into lines
function parsePromptToLines(prompt, maxLines = 4) {
  if (!prompt || typeof prompt !== 'string') {
    return ['Your Video Here']
  }
  
  // Split by newlines first
  let lines = prompt.split(/\n+/).filter(l => l.trim())
  
  // If only one line, try to split by sentences
  if (lines.length === 1) {
    lines = prompt.split(/[.!?]+/).filter(l => l.trim()).map(l => l.trim())
  }
  
  // If still one line, split by length
  if (lines.length === 1 && prompt.length > 60) {
    const words = prompt.split(' ')
    const chunkSize = Math.ceil(words.length / maxLines)
    lines = []
    for (let i = 0; i < words.length; i += chunkSize) {
      lines.push(words.slice(i, i + chunkSize).join(' '))
    }
  }
  
  return lines.slice(0, maxLines).map(l => l.trim())
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
