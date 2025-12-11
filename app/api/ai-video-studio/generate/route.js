import { NextResponse } from 'next/server'
import { writeFile, mkdir, readFile, unlink } from 'fs/promises'
import { existsSync, createWriteStream } from 'fs'
import { join } from 'path'
import { randomUUID } from 'crypto'
import { buildCinematicVideoEdit, getTemplateVisualConfig } from '@/lib/cinematic-video-builder'
import { fal } from '@fal-ai/client'
import ffmpeg from 'fluent-ffmpeg'
import textToSpeech from '@google-cloud/text-to-speech'
import { getCollection } from '@/lib/mongodb'

// Set ffmpeg path
ffmpeg.setFfmpegPath('/usr/bin/ffmpeg')
ffmpeg.setFfprobePath('/usr/bin/ffprobe')

export const maxDuration = 300 // 5 minutes timeout
export const dynamic = 'force-dynamic'

// Configure Fal.ai client
fal.config({
  credentials: process.env.FAL_KEY
})

// ==================== FFMPEG VIDEO COMPILATION ====================
// This replaces Shotstack for video composition - handles AI clips, stock videos,
// text overlays, TTS, and custom audio

async function compileVideoWithFFmpeg({
  jobId,
  videos,        // Array of video objects with {url, prompt, model} from AI or stock
  prompt,        // User's prompt/script text
  duration,      // Target duration
  dimensions,    // {width, height}
  templateId,    // For styling config
  voiceOption,   // 'tts', 'upload', or 'none'
  ttsLanguage,   // 'en' or other language code
  selectedVoice, // Google TTS voice name
  voiceFile,     // Uploaded audio file (if any)
  captionStyle,  // Caption styling option
  musicTrack,    // Background music option
}) {
  const tempDir = `/tmp/ai-video-studio-${jobId}`
  
  try {
    console.log(`[${jobId}] 🎬 Starting FFmpeg compilation...`)
    
    // Create temp directory
    await mkdir(tempDir, { recursive: true })
    
    const { Readable } = require('stream')
    const { pipeline } = require('stream/promises')
    
    // Step 1: Download all video clips in parallel
    console.log(`[${jobId}] Step 1: Downloading ${videos.length} video clips...`)
    const videoFiles = []
    
    const downloadPromises = videos.map(async (video, index) => {
      const videoPath = join(tempDir, `clip-${index}.mp4`)
      
      try {
        if (video.url.startsWith('/')) {
          // Local file - copy it
          const localPath = join(process.cwd(), 'public', video.url)
          const fs = require('fs')
          if (fs.existsSync(localPath)) {
            const buffer = fs.readFileSync(localPath)
            await writeFile(videoPath, buffer)
            console.log(`[${jobId}] ✅ Copied local clip ${index + 1}/${videos.length}`)
            return { index, path: videoPath, success: true }
          }
        } else {
          // Download from URL
          const response = await fetch(video.url)
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}`)
          }
          
          const fileStream = createWriteStream(videoPath)
          await pipeline(Readable.fromWeb(response.body), fileStream)
          console.log(`[${jobId}] ✅ Downloaded clip ${index + 1}/${videos.length}`)
          return { index, path: videoPath, success: true }
        }
      } catch (error) {
        console.error(`[${jobId}] ❌ Error downloading clip ${index}:`, error.message)
        return { index, path: null, success: false }
      }
      
      return { index, path: null, success: false }
    })
    
    const downloadResults = await Promise.all(downloadPromises)
    const successfulDownloads = downloadResults
      .filter(r => r.success && r.path)
      .sort((a, b) => a.index - b.index)
    
    if (successfulDownloads.length === 0) {
      throw new Error('Failed to download any video clips')
    }
    
    for (const result of successfulDownloads) {
      videoFiles.push(result.path)
    }
    
    console.log(`[${jobId}] Downloaded ${videoFiles.length} clips successfully`)
    
    // Step 2: Generate or process voice audio
    console.log(`[${jobId}] Step 2: Processing audio...`)
    let audioPath = join(tempDir, 'voice.mp3')
    let hasAudio = false
    
    if (voiceOption === 'tts' && prompt && prompt.trim()) {
      // Generate TTS with Google Cloud
      console.log(`[${jobId}] Generating TTS with Google Cloud...`)
      
      try {
        const client = new textToSpeech.TextToSpeechClient({
          keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS
        })
        
        let languageCode = ttsLanguage === 'bn' ? 'bn-IN' : 'en-US'
        
        if (selectedVoice && selectedVoice.includes('-')) {
          const parts = selectedVoice.split('-')
          if (parts.length >= 2) {
            languageCode = `${parts[0]}-${parts[1]}`
          }
        }
        
        const voiceConfig = { languageCode }
        if (selectedVoice) {
          voiceConfig.name = selectedVoice
          if (selectedVoice.includes('Studio') || selectedVoice.includes('Chirp')) {
            voiceConfig.model = selectedVoice
          }
        }
        
        const ttsRequest = {
          input: { text: prompt },
          voice: voiceConfig,
          audioConfig: {
            audioEncoding: 'MP3',
            speakingRate: 1.0,
            pitch: 0.0
          }
        }
        
        const [response] = await client.synthesizeSpeech(ttsRequest)
        await writeFile(audioPath, response.audioContent, 'binary')
        hasAudio = true
        console.log(`[${jobId}] ✅ TTS generated successfully`)
      } catch (ttsError) {
        console.error(`[${jobId}] ⚠️ TTS failed:`, ttsError.message)
        // Continue without audio
      }
    } else if (voiceOption === 'upload' && voiceFile) {
      // Use uploaded audio
      const buffer = Buffer.from(await voiceFile.arrayBuffer())
      const rawPath = join(tempDir, 'uploaded-raw.mp3')
      await writeFile(rawPath, buffer)
      
      // Normalize the audio
      await new Promise((resolve, reject) => {
        ffmpeg(rawPath)
          .audioFilters(['loudnorm=I=-16:TP=-1.5:LRA=11', 'volume=2.0'])
          .audioCodec('libmp3lame')
          .audioBitrate('128k')
          .output(audioPath)
          .on('end', () => {
            hasAudio = true
            console.log(`[${jobId}] ✅ Uploaded audio normalized`)
            resolve()
          })
          .on('error', (err) => {
            console.error(`[${jobId}] Audio normalization error:`, err.message)
            require('fs').copyFileSync(rawPath, audioPath)
            hasAudio = true
            resolve()
          })
          .run()
      })
    }
    
    // Get actual audio duration if we have audio
    let actualDuration = duration
    if (hasAudio && existsSync(audioPath)) {
      actualDuration = await new Promise((resolve) => {
        ffmpeg.ffprobe(audioPath, (err, metadata) => {
          if (err) {
            resolve(duration)
          } else {
            resolve(metadata.format.duration || duration)
          }
        })
      })
      console.log(`[${jobId}] Audio duration: ${actualDuration}s`)
    }
    
    // Step 3: Normalize and trim each clip
    console.log(`[${jobId}] Step 3: Normalizing ${videoFiles.length} clips...`)
    const targetWidth = dimensions.width
    const targetHeight = dimensions.height
    const durationPerClip = actualDuration / videoFiles.length
    
    const normalizedFiles = []
    
    for (let i = 0; i < videoFiles.length; i++) {
      const normalizedPath = join(tempDir, `normalized-${i}.mp4`)
      const videoFile = videoFiles[i]
      
      await new Promise((resolve, reject) => {
        // Build video filter with text overlay support
        let videoFilter = `scale=${targetWidth}:${targetHeight}:force_original_aspect_ratio=increase,crop=${targetWidth}:${targetHeight},fps=30`
        
        // Add text overlay from prompt (positioned at bottom)
        if (prompt && captionStyle !== 'none') {
          const lines = parsePromptToLines(prompt, 4)
          const lineIndex = i % lines.length
          // Proper FFmpeg text escaping: escape single quotes, colons, and backslashes
          const text = lines[lineIndex]
            .replace(/\\/g, '\\\\')     // Escape backslashes first
            .replace(/'/g, "'\\''")      // Escape single quotes
            .replace(/:/g, '\\:')        // Escape colons
            .replace(/\[/g, '\\[')       // Escape brackets
            .replace(/\]/g, '\\]')
            .replace(/,/g, '\\,')        // Escape commas
            .replace(/;/g, '\\;')        // Escape semicolons
          const fontSize = targetHeight >= 1920 ? 56 : 42
          
          // Simple bottom-positioned text with shadow
          videoFilter += `,drawtext=text='${text}':fontsize=${fontSize}:fontcolor=white:x=(w-text_w)/2:y=h-text_h-100:shadowcolor=black:shadowx=2:shadowy=2`
        }
        
        ffmpeg(videoFile)
          .outputOptions([
            '-vf', videoFilter,
            '-t', String(durationPerClip),
            '-c:v', 'libx264',
            '-preset', 'fast',
            '-crf', '23',
            '-pix_fmt', 'yuv420p',
            '-an'
          ])
          .output(normalizedPath)
          .on('end', () => {
            normalizedFiles.push(normalizedPath)
            console.log(`[${jobId}] ✅ Normalized clip ${i + 1}/${videoFiles.length}`)
            resolve()
          })
          .on('error', (err) => {
            console.error(`[${jobId}] ❌ Normalization error for clip ${i}:`, err.message)
            reject(err)
          })
          .run()
      })
    }
    
    // Step 4: Concatenate all normalized clips
    console.log(`[${jobId}] Step 4: Concatenating ${normalizedFiles.length} clips...`)
    const clipListPath = join(tempDir, 'clips.txt')
    const clipListContent = normalizedFiles.map(file => `file '${file}'`).join('\n')
    await writeFile(clipListPath, clipListContent)
    
    const concatVideoPath = join(tempDir, 'concat.mp4')
    
    await new Promise((resolve, reject) => {
      ffmpeg()
        .input(clipListPath)
        .inputOptions(['-f', 'concat', '-safe', '0'])
        .outputOptions([
          '-c:v', 'libx264',
          '-preset', 'fast',
          '-crf', '23',
          '-pix_fmt', 'yuv420p'
        ])
        .output(concatVideoPath)
        .on('end', () => {
          console.log(`[${jobId}] ✅ Clips concatenated`)
          resolve()
        })
        .on('error', reject)
        .run()
    })
    
    // Step 5: Merge video with audio (if audio exists)
    console.log(`[${jobId}] Step 5: Merging video with audio...`)
    const finalVideoPath = join(tempDir, 'final.mp4')
    
    if (hasAudio && existsSync(audioPath)) {
      await new Promise((resolve, reject) => {
        ffmpeg()
          .input(concatVideoPath)
          .input(audioPath)
          .outputOptions([
            '-c:v', 'copy',
            '-c:a', 'aac',
            '-b:a', '128k',
            '-movflags', '+faststart',
            '-map', '0:v:0',
            '-map', '1:a:0',
            '-shortest'
          ])
          .output(finalVideoPath)
          .on('end', () => {
            console.log(`[${jobId}] ✅ Audio merged`)
            resolve()
          })
          .on('error', reject)
          .run()
      })
    } else {
      // No audio - just copy the concatenated video
      const fs = require('fs')
      fs.copyFileSync(concatVideoPath, finalVideoPath)
      console.log(`[${jobId}] Video saved without audio`)
    }
    
    // Step 6: Save to public folder
    console.log(`[${jobId}] Step 6: Saving video...`)
    const videoBuffer = await readFile(finalVideoPath)
    
    const publicDir = '/app/public/ai-video-studio'
    if (!existsSync(publicDir)) {
      await mkdir(publicDir, { recursive: true })
    }
    
    const publicVideoPath = join(publicDir, `${jobId}.mp4`)
    await writeFile(publicVideoPath, videoBuffer)
    
    const videoUrl = `/ai-video-studio/${jobId}.mp4`
    console.log(`[${jobId}] ✅ Video saved to: ${videoUrl}`)
    
    // Step 7: Auto-save to library
    console.log(`[${jobId}] Step 7: Saving to library...`)
    try {
      const libraryCollection = await getCollection('library')
      
      // Create TTL index if needed
      try {
        await libraryCollection.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 })
      } catch (e) { /* Index may already exist */ }
      
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + 30)
      
      const libraryDoc = {
        id: randomUUID(),
        userId: 'default-user',
        content: prompt || '',
        videoUrl,
        filePath: videoUrl,
        fileSize: videoBuffer.length,
        script: prompt || '',
        type: 'ai-video-studio',
        category: 'video',
        title: prompt ? `AI Video: ${prompt.substring(0, 50)}...` : 'AI Generated Video',
        description: prompt ? prompt.substring(0, 200) : 'AI-generated cinematic video',
        metadata: {
          duration: actualDuration,
          dimensions,
          clipCount: videos.length,
          templateId,
          voiceOption,
          models: videos.map(v => v.model).filter(Boolean),
          jobId
        },
        createdAt: new Date(),
        expiresAt
      }
      
      await libraryCollection.insertOne(libraryDoc)
      console.log(`[${jobId}] ✅ Video auto-saved to library`)
    } catch (saveError) {
      console.error(`[${jobId}] ⚠️ Library save failed:`, saveError.message)
    }
    
    // Cleanup temp files
    console.log(`[${jobId}] Cleaning up...`)
    try {
      await require('fs/promises').rm(tempDir, { recursive: true, force: true })
    } catch (e) { /* Ignore cleanup errors */ }
    
    console.log(`[${jobId}] 🎉 FFmpeg compilation complete!`)
    
    return {
      videoUrl,
      duration: actualDuration,
      format: dimensions,
      clipCount: videos.length,
      fileSize: videoBuffer.length
    }
    
  } catch (error) {
    // Cleanup on error
    try {
      await require('fs/promises').rm(tempDir, { recursive: true, force: true })
    } catch (e) { /* Ignore */ }
    
    throw error
  }
}

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

// AI Video Generation Models - Ordered by cost (cheapest first)
// Pricing as of 2025 from fal.ai/pricing
const AI_VIDEO_MODELS = {
  // TIER 1: Budget-Friendly (~$0.04/s)
  'ovi': {
    name: 'Ovi',
    endpoint: 'fal-ai/ovi/text-to-video',
    costPerVideo: 0.20, // $0.20 per 5s video = ~$0.04/s
    costPerSecond: 0.04,
    description: 'Ultra budget-friendly AI video',
    maxDuration: 5,
    tier: 'budget'
  },
  'pixverse': {
    name: 'Pixverse v5',
    endpoint: 'fal-ai/pixverse/v5/text-to-video',
    costPerVideo: 0.20, // $0.20 per 5s video at 720p
    costPerSecond: 0.04,
    description: 'Creative effects & stylized videos',
    maxDuration: 5,
    tier: 'budget'
  },
  
  // TIER 2: Value (~$0.05/s)
  'wan': {
    name: 'Wan 2.5',
    endpoint: 'fal-ai/wan-t2v',
    costPerSecond: 0.05,
    description: 'Fast & reliable video generation',
    maxDuration: 5,
    tier: 'value'
  },
  'minimax-hailuo': {
    name: 'Minimax Hailuo',
    endpoint: 'fal-ai/minimax-video/video-01-live',
    costPerSecond: 0.05,
    description: 'High-quality cinematic AI video',
    maxDuration: 6,
    tier: 'value'
  },
  
  // TIER 3: Premium (~$0.07/s)
  'kling-turbo': {
    name: 'Kling 2.5 Turbo Pro',
    endpoint: 'fal-ai/kling-video/v2.5-turbo/pro/text-to-video',
    costPerSecond: 0.07,
    description: 'Top-tier cinematic quality',
    maxDuration: 10,
    tier: 'premium'
  }
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
  fal: {
    name: 'Fal.ai',
    description: 'AI video generation with Ovi, Pixverse, Wan, Minimax, Kling models'
  },
  replicate: {
    name: 'Replicate',
    description: 'Fallback AI video generation'
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
    
    // New parameters for TTS and audio
    const voiceOption = formData.get('voiceOption') || 'tts' // 'tts', 'upload', 'none'
    const ttsLanguage = formData.get('ttsLanguage') || 'en'
    const selectedVoice = formData.get('selectedVoice') || 'en-US-Neural2-D'
    const voiceFile = formData.get('voiceFile')
    const captionStyle = formData.get('captionStyle') || 'bold-outline'
    const musicTrack = formData.get('musicTrack') || 'none'
    
    // Check if imageFile is actually a file or just a string
    const hasValidImage = imageFile && typeof imageFile !== 'string' && imageFile.size > 0
    console.log(`[${jobId}] Mode: ${mode}, Duration: ${duration}s, Format: ${format}`)
    console.log(`[${jobId}] Template: ${templateId}, VideoSource: ${videoSource}, HasValidImage: ${hasValidImage}`)
    console.log(`[${jobId}] Voice: ${voiceOption}, TTS Language: ${ttsLanguage}`)
    
    // Get format dimensions
    const dimensions = format === 'portrait' 
      ? { width: 1080, height: 1920 }
      : { width: 1920, height: 1080 }
    
    // Step 1: Generate or fetch video clips
    let videos = []
    
    if (videoSource === 'ai') {
      // Generate AI video clips using Fal.ai
      console.log(`[${jobId}] 🎨 Generating AI video clips with Fal.ai...`)
      
      try {
        videos = await generateAIVideosWithFal(prompt, duration, dimensions, jobId)
        
        if (videos.length === 0) {
          throw new Error('No AI videos generated from Fal.ai')
        }
        console.log(`[${jobId}] ✅ Generated ${videos.length} AI clips`)
      } catch (falError) {
        console.error(`[${jobId}] ⚠️ Fal.ai failed:`, falError.message)
        
        // Try Replicate as fallback
        try {
          console.log(`[${jobId}] 🔄 Trying Replicate fallback...`)
          videos = await generateAIVideosWithReplicate(prompt, duration, dimensions, jobId)
          
          if (videos.length === 0) {
            throw new Error('Replicate also failed')
          }
          console.log(`[${jobId}] ✅ Generated ${videos.length} clips with Replicate`)
        } catch (replicateError) {
          console.error(`[${jobId}] ⚠️ Replicate failed:`, replicateError.message)
          console.log(`[${jobId}] 📹 Falling back to stock videos`)
          
          const keywords = getKeywordsFromPromptAndTemplate(prompt, templateId)
          videos = await fetchStockVideos(keywords, Math.ceil(duration / 5))
        }
      }
    } else if (videoSource === 'hybrid') {
      // Mix AI and stock videos
      console.log(`[${jobId}] ✨ Building hybrid video (AI + Stock)...`)
      
      try {
        const aiVideos = await generateAIVideosWithFal(prompt, Math.min(duration, 10), dimensions, jobId)
        if (aiVideos.length > 0) {
          videos.push(...aiVideos)
        }
      } catch (e) {
        console.log(`[${jobId}] AI generation failed for hybrid, using stock only`)
      }
      
      // Add stock videos
      const keywords = getKeywordsFromPromptAndTemplate(prompt, templateId)
      const stockVideos = await fetchStockVideos(keywords, Math.ceil(duration / 5))
      videos.push(...stockVideos)
    } else {
      // Stock videos only
      console.log(`[${jobId}] 📹 Fetching stock videos...`)
      const keywords = getKeywordsFromPromptAndTemplate(prompt, templateId)
      videos = await fetchStockVideos(keywords, Math.ceil(duration / 5))
    }
    
    if (videos.length === 0) {
      throw new Error('No video clips available for compilation')
    }
    
    console.log(`[${jobId}] 🎬 Compiling ${videos.length} clips with FFmpeg...`)
    
    // Step 2: Compile video using FFmpeg (replaces Shotstack)
    const result = await compileVideoWithFFmpeg({
      jobId,
      videos,
      prompt,
      duration,
      dimensions,
      templateId,
      voiceOption,
      ttsLanguage,
      selectedVoice,
      voiceFile,
      captionStyle,
      musicTrack
    })
    
    return NextResponse.json({
      success: true,
      ...result,
      provider: 'ffmpeg',
      models: videos.map(v => v.model).filter(Boolean)
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
  let generatedAIVideos = [] // Store AI videos in case Shotstack fails
  
  if (mode === 'image-to-video' && imageFile && typeof imageFile !== 'string' && imageFile.size > 0) {
    // For image-to-video, first upload the image to Shotstack Serve API
    console.log(`[${jobId}] Uploading image to Shotstack...`)
    const imageUrl = await uploadImageToShotstack(imageFile, apiKey, baseUrl, jobId)
    console.log(`[${jobId}] Image uploaded: ${imageUrl}`)
    editJson = buildImageVideoEdit(imageUrl, prompt, duration, dimensions, templateId)
  } else if (videoSource === 'ai') {
    // AI-Generated Video Scenes using Fal.ai
    // Primary: Ovi/Pixverse (cheapest), then Wan/Minimax, then Kling, then Replicate
    console.log(`[${jobId}] 🎨 Starting AI video generation with Fal.ai...`)
    
    let aiVideos = []
    try {
      // Generate AI video clips using Fal.ai
      aiVideos = await generateAIVideosWithFal(prompt, duration, dimensions, jobId)
      
      if (aiVideos.length > 0) {
        console.log(`[${jobId}] ✅ Generated ${aiVideos.length} AI video clips with Fal.ai`)
        // Try to compose the AI videos with text overlays using Shotstack
        editJson = buildAIVideoComposition(templateId, prompt, duration, dimensions, aiVideos, jobId)
      } else {
        throw new Error('No AI videos generated')
      }
    } catch (falError) {
      console.error(`[${jobId}] ⚠️ Fal.ai failed, trying Replicate fallback:`, falError.message)
      
      try {
        // Fallback to Replicate
        const replicateVideos = await generateAIVideosWithReplicate(prompt, duration, dimensions, jobId)
        
        if (replicateVideos.length > 0) {
          console.log(`[${jobId}] ✅ Generated ${replicateVideos.length} AI video clips with Replicate (fallback)`)
          aiVideos = replicateVideos
          editJson = buildAIVideoComposition(templateId, prompt, duration, dimensions, replicateVideos, jobId)
        } else {
          throw new Error('Replicate also failed')
        }
      } catch (replicateError) {
        console.error(`[${jobId}] ⚠️ Replicate fallback also failed, using stock videos:`, replicateError.message)
        const keywords = getKeywordsFromPromptAndTemplate(prompt, templateId)
        const stockVideos = await fetchStockVideos(keywords, Math.ceil(duration / 5))
        editJson = buildStockVideoEdit(templateId, prompt, duration, dimensions, stockVideos)
      }
    }
    
    // Store AI videos in case Shotstack fails later
    if (aiVideos.length > 0) {
      // We'll use this if Shotstack composition fails
      generatedAIVideos = aiVideos
    }
  } else if (videoSource === 'hybrid') {
    // Hybrid: Mix AI-generated video with stock footage
    console.log(`[${jobId}] ✨ Building hybrid video (AI + Stock)...`)
    
    let aiVideos = []
    try {
      // Generate 1-2 AI video clips for key moments
      aiVideos = await generateAIVideosWithFal(prompt, Math.min(duration, 10), dimensions, jobId)
    } catch (error) {
      console.log(`[${jobId}] ⚠️ AI generation failed for hybrid, using more stock footage`)
    }
    
    // Fetch stock videos for B-roll
    const keywords = getKeywordsFromPromptAndTemplate(prompt, templateId)
    const stockVideos = await fetchStockVideos(keywords, Math.ceil(duration / 8))
    
    editJson = buildHybridVideoEdit(templateId, prompt, duration, dimensions, stockVideos, aiVideos, jobId)
  } else {
    // Stock Videos: Original implementation
    console.log(`[${jobId}] 📹 Fetching cinematic stock videos for template: ${templateId}`)
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
    
    // If we have AI videos, return the first one directly instead of failing
    if (generatedAIVideos.length > 0) {
      console.log(`[${jobId}] ⚠️ Shotstack failed, returning raw AI video instead`)
      const firstAIVideo = generatedAIVideos[0]
      return {
        videoUrl: firstAIVideo.url,
        renderId: `ai-direct-${jobId}`,
        duration,
        format: dimensions,
        provider: 'fal-ai-direct',
        model: firstAIVideo.model,
        aiVideos: generatedAIVideos,
        note: 'Returned raw AI video (Shotstack composition unavailable)'
      }
    }
    
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
      // If Shotstack composition fails but we have AI videos, return them
      if (generatedAIVideos.length > 0) {
        console.log(`[${jobId}] ⚠️ Shotstack composition failed, returning raw AI video`)
        const firstAIVideo = generatedAIVideos[0]
        return {
          videoUrl: firstAIVideo.url,
          renderId: `ai-direct-${jobId}`,
          duration,
          format: dimensions,
          provider: 'fal-ai-direct',
          model: firstAIVideo.model,
          aiVideos: generatedAIVideos,
          note: 'Returned raw AI video (Shotstack composition failed)'
        }
      }
      throw new Error(`Shotstack render failed: ${statusData.response?.error || 'Unknown error'}`)
    }
  }
  
  if (!videoUrl) {
    // If we have AI videos and timed out, return them
    if (generatedAIVideos.length > 0) {
      console.log(`[${jobId}] ⚠️ Shotstack timed out, returning raw AI video`)
      const firstAIVideo = generatedAIVideos[0]
      return {
        videoUrl: firstAIVideo.url,
        renderId: `ai-direct-${jobId}`,
        duration,
        format: dimensions,
        provider: 'fal-ai-direct',
        model: firstAIVideo.model,
        aiVideos: generatedAIVideos,
        note: 'Returned raw AI video (Shotstack timed out)'
      }
    }
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

// ==================== FAL.AI VIDEO GENERATION ====================
// Generate AI video clips using Fal.ai - tries models from cheapest to more expensive
// Order: Ovi ($0.04/s) → Pixverse ($0.04/s) → Wan ($0.05/s) → Minimax ($0.05/s) → Kling ($0.07/s)
async function generateAIVideosWithFal(prompt, duration, dimensions, jobId) {
  const videos = []
  const numClips = Math.ceil(duration / 5) // Each clip is ~5 seconds
  const scenes = parsePromptToScenes(prompt, numClips)
  
  // Models ordered by cost (cheapest first)
  const models = [
    { 
      name: 'Ovi', 
      endpoint: 'fal-ai/ovi/text-to-video',
      costPerSecond: 0.04,
      tier: '💰 Budget'
    },
    { 
      name: 'Pixverse v5', 
      endpoint: 'fal-ai/pixverse/v5/text-to-video',
      costPerSecond: 0.04,
      tier: '💰 Budget'
    },
    { 
      name: 'Wan 2.5', 
      endpoint: 'fal-ai/wan-t2v',
      costPerSecond: 0.05,
      tier: '⭐ Value'
    },
    { 
      name: 'Minimax Hailuo', 
      endpoint: 'fal-ai/minimax-video/video-01-live',
      costPerSecond: 0.05,
      tier: '⭐ Value'
    },
    { 
      name: 'Kling 2.5 Turbo', 
      endpoint: 'fal-ai/kling-video/v2.5-turbo/pro/text-to-video',
      costPerSecond: 0.07,
      tier: '🏆 Premium'
    }
  ]
  
  let selectedModel = models[0]
  let modelIndex = 0
  let consecutiveFailures = 0
  
  console.log(`[${jobId}] 🎬 Starting AI video generation with ${models.length} available models`)
  console.log(`[${jobId}] Model priority: ${models.map(m => `${m.name} ($${m.costPerSecond}/s)`).join(' → ')}`)
  
  for (let i = 0; i < numClips; i++) {
    const scenePrompt = scenes[i] || scenes[scenes.length - 1]
    const cinematicPrompt = `${scenePrompt}, cinematic, high quality, professional, ${
      dimensions.height > dimensions.width ? 'vertical portrait video, 9:16 aspect ratio' : 'horizontal landscape video, 16:9 aspect ratio'
    }`
    
    console.log(`[${jobId}] 🎬 Clip ${i + 1}/${numClips} using ${selectedModel.tier} ${selectedModel.name}...`)
    console.log(`[${jobId}] Prompt: "${cinematicPrompt.substring(0, 80)}..."`)
    
    try {
      const result = await fal.subscribe(selectedModel.endpoint, {
        input: {
          prompt: cinematicPrompt,
          aspect_ratio: dimensions.height > dimensions.width ? '9:16' : '16:9',
          duration: '5'
        },
        logs: true,
        onQueueUpdate: (update) => {
          if (update.status === 'IN_PROGRESS') {
            console.log(`[${jobId}] Clip ${i + 1} progress: ${update.logs?.length || 0} logs`)
          }
        }
      })
      
      // Extract video URL from result (different models return in different formats)
      const videoUrl = result.data?.video?.url || result.data?.video_url || result.data?.url || result.data?.output?.url
      
      if (videoUrl) {
        console.log(`[${jobId}] ✅ Clip ${i + 1} generated with ${selectedModel.name}: ${videoUrl.substring(0, 60)}...`)
        videos.push({
          url: videoUrl,
          prompt: scenePrompt,
          model: selectedModel.name,
          tier: selectedModel.tier,
          cost: selectedModel.costPerSecond * 5,
          index: i
        })
        consecutiveFailures = 0 // Reset on success
      } else {
        console.log(`[${jobId}] ⚠️ Clip ${i + 1} - no video URL in response from ${selectedModel.name}`)
        consecutiveFailures++
        // Try next model after 2 consecutive failures
        if (consecutiveFailures >= 2 && modelIndex < models.length - 1) {
          modelIndex++
          selectedModel = models[modelIndex]
          console.log(`[${jobId}] 🔄 Switching to ${selectedModel.tier} ${selectedModel.name} after failures`)
          consecutiveFailures = 0
        }
        i-- // Retry this clip
      }
    } catch (error) {
      console.error(`[${jobId}] ❌ Clip ${i + 1} failed with ${selectedModel.name}:`, error.message)
      consecutiveFailures++
      
      // Try next model after failure
      if (modelIndex < models.length - 1) {
        modelIndex++
        selectedModel = models[modelIndex]
        console.log(`[${jobId}] 🔄 Switching to ${selectedModel.tier} ${selectedModel.name} due to error`)
        consecutiveFailures = 0
        i-- // Retry this clip
      }
    }
  }
  
  // Log summary
  if (videos.length > 0) {
    const modelUsed = [...new Set(videos.map(v => v.model))].join(', ')
    const totalCost = videos.reduce((sum, v) => sum + v.cost, 0)
    console.log(`[${jobId}] 📊 Generated ${videos.length} clips using: ${modelUsed} | Est. cost: $${totalCost.toFixed(2)}`)
  }
  
  return videos
}

// ==================== REPLICATE FALLBACK ====================
async function generateAIVideosWithReplicate(prompt, duration, dimensions, jobId) {
  const videos = []
  const numClips = Math.ceil(duration / 5)
  const scenes = parsePromptToScenes(prompt, numClips)
  
  const replicateApiKey = process.env.REPLICATE_API_TOKEN
  if (!replicateApiKey) {
    throw new Error('Replicate API key not configured')
  }
  
  for (let i = 0; i < numClips; i++) {
    const scenePrompt = scenes[i] || scenes[scenes.length - 1]
    const cinematicPrompt = `${scenePrompt}, cinematic, high quality, professional video`
    
    console.log(`[${jobId}] 🎬 Generating clip ${i + 1}/${numClips} with Replicate (fallback)...`)
    
    try {
      // Use MiniMax video model on Replicate
      const response = await fetch('https://api.replicate.com/v1/predictions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${replicateApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          version: "minimax/video-01",
          input: {
            prompt: cinematicPrompt,
            prompt_optimizer: true
          }
        })
      })
      
      if (!response.ok) {
        throw new Error(`Replicate API error: ${response.status}`)
      }
      
      const prediction = await response.json()
      
      // Poll for completion
      let result = prediction
      let attempts = 0
      const maxAttempts = 120 // 4 minutes max
      
      while (result.status !== 'succeeded' && result.status !== 'failed' && attempts < maxAttempts) {
        await new Promise(r => setTimeout(r, 2000))
        attempts++
        
        const statusResponse = await fetch(result.urls.get, {
          headers: { 'Authorization': `Bearer ${replicateApiKey}` }
        })
        result = await statusResponse.json()
        
        if (attempts % 10 === 0) {
          console.log(`[${jobId}] Replicate clip ${i + 1} status: ${result.status} (${attempts * 2}s)`)
        }
      }
      
      if (result.status === 'succeeded' && result.output) {
        const videoUrl = Array.isArray(result.output) ? result.output[0] : result.output
        console.log(`[${jobId}] ✅ Replicate clip ${i + 1} generated`)
        videos.push({
          url: videoUrl,
          prompt: scenePrompt,
          model: 'Replicate MiniMax',
          cost: 0.10,
          index: i
        })
      }
    } catch (error) {
      console.error(`[${jobId}] ❌ Replicate clip ${i + 1} failed:`, error.message)
    }
  }
  
  return videos
}

// ==================== AI VIDEO COMPOSITION ====================
// Compose AI-generated video clips with text overlays using Shotstack
function buildAIVideoComposition(templateId, prompt, duration, dimensions, aiVideos, jobId) {
  const config = getTemplateVisualConfig(templateId)
  const lines = parsePromptToLines(prompt, Math.min(4, aiVideos.length || 2))
  
  const tracks = []
  
  // Track 1: AI-generated video clips
  const videoClips = aiVideos.map((video, index) => {
    const clipDuration = duration / aiVideos.length
    return {
      asset: {
        type: 'video',
        src: video.url,
        volume: 0.3 // Keep some ambient audio from AI video
      },
      start: index * clipDuration,
      length: clipDuration + 0.5, // Slight overlap for smooth transitions
      fit: 'cover',
      transition: {
        in: 'fade',
        out: 'fade'
      }
    }
  })
  
  tracks.push({ clips: videoClips })
  
  // Track 2: Gradient overlay for text readability (bottom only)
  tracks.push({
    clips: [{
      asset: {
        type: 'html',
        html: `<div style="width:100%;height:100%;background:linear-gradient(180deg, transparent 0%, transparent 50%, ${config.colorScheme.secondary}88 75%, ${config.colorScheme.secondary}dd 100%);"></div>`,
        width: dimensions.width,
        height: dimensions.height
      },
      start: 0,
      length: duration
    }]
  })
  
  // Track 3: AI badge showing model used
  const modelNames = [...new Set(aiVideos.map(v => v.model))].join(' + ')
  tracks.push({
    clips: [{
      asset: {
        type: 'html',
        html: `<div style="position:absolute;top:30px;right:30px;background:linear-gradient(135deg, #8b5cf6, #ec4899);padding:10px 20px;border-radius:25px;box-shadow:0 4px 15px rgba(0,0,0,0.3);">
          <span style="font-family:'Montserrat',sans-serif;font-size:12px;color:white;font-weight:700;letter-spacing:1px;">✨ AI: ${modelNames}</span>
        </div>`,
        width: dimensions.width,
        height: dimensions.height
      },
      start: 0,
      length: duration
    }]
  })
  
  // Track 4: Text content (positioned at bottom)
  const textClips = lines.map((line, index) => {
    const startTime = index * (duration / lines.length)
    const clipDuration = duration / lines.length + 0.5
    
    return {
      asset: {
        type: 'html',
        html: `<div style="position:absolute;bottom:8%;left:0;right:0;display:flex;flex-direction:column;align-items:center;padding:0 40px;">
          <p style="font-family:'${config.typography.fontFamily}',sans-serif;font-size:${Math.round(config.typography.titleSize * 0.85)}px;color:${config.colorScheme.text};font-weight:${config.typography.fontWeight};text-align:center;text-shadow:0 2px 10px rgba(0,0,0,0.9),0 4px 30px rgba(0,0,0,0.7);line-height:1.3;max-width:95%;">
            ${line}
          </p>
        </div>`,
        width: dimensions.width,
        height: dimensions.height
      },
      start: startTime,
      length: clipDuration,
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
        { src: `https://fonts.googleapis.com/css2?family=${config.typography.fontFamily.replace(' ', '+')}:wght@400;700;800&display=swap` },
        { src: 'https://fonts.googleapis.com/css2?family=Montserrat:wght@600;700&display=swap' }
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

// ==================== OLD AI-GENERATED VIDEO EDIT (KEPT FOR REFERENCE) ====================
// Step 1: Generate images using Create API (text-to-image with FLUX model)
// Step 2: Use image-to-video asset type to animate those images with real motion
async function generateAIImages(prompt, numScenes, dimensions, apiKey, jobId) {
  const createBaseUrl = process.env.SHOTSTACK_ENV === 'production'
    ? 'https://api.shotstack.io/create/v1'
    : 'https://api.shotstack.io/create/stage'
  
  const scenes = parsePromptToScenes(prompt, numScenes)
  const generatedImages = []
  
  console.log(`[${jobId}] Generating ${numScenes} AI images using FLUX model...`)
  
  // Generate images in parallel (up to 3 at a time)
  const imagePromises = scenes.slice(0, numScenes).map(async (scenePrompt, index) => {
    const cinematicPrompt = `${scenePrompt}, cinematic lighting, dramatic atmosphere, high quality, professional photography, ${
      dimensions.height > dimensions.width ? 'vertical composition, portrait orientation' : 'wide cinematic shot, landscape orientation'
    }, 8K resolution, photorealistic`
    
    console.log(`[${jobId}] Scene ${index + 1}: "${cinematicPrompt.substring(0, 60)}..."`)
    
    try {
      // Create image using Shotstack Create API
      const createResponse = await fetch(`${createBaseUrl}/assets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey
        },
        body: JSON.stringify({
          provider: 'shotstack',
          options: {
            type: 'text-to-image',
            prompt: cinematicPrompt,
            width: Math.min(1280, Math.round(dimensions.width / 256) * 256), // Must be multiple of 256
            height: Math.min(1280, Math.round(dimensions.height / 256) * 256)
          }
        })
      })
      
      if (!createResponse.ok) {
        const errorText = await createResponse.text()
        console.error(`[${jobId}] Image ${index + 1} creation failed:`, errorText)
        return null
      }
      
      const createData = await createResponse.json()
      const assetId = createData.data?.id
      
      if (!assetId) {
        console.error(`[${jobId}] No asset ID returned for image ${index + 1}`)
        return null
      }
      
      console.log(`[${jobId}] Image ${index + 1} queued: ${assetId}`)
      
      // Poll for completion
      let imageUrl = null
      let attempts = 0
      const maxAttempts = 60 // 2 minutes max per image
      
      while (!imageUrl && attempts < maxAttempts) {
        await new Promise(r => setTimeout(r, 2000))
        attempts++
        
        const statusResponse = await fetch(`${createBaseUrl}/assets/${assetId}`, {
          headers: { 'x-api-key': apiKey }
        })
        
        if (statusResponse.ok) {
          const statusData = await statusResponse.json()
          const status = statusData.data?.attributes?.status
          
          if (status === 'done') {
            imageUrl = statusData.data?.attributes?.url
            console.log(`[${jobId}] ✅ Image ${index + 1} ready: ${imageUrl}`)
          } else if (status === 'failed') {
            console.error(`[${jobId}] ❌ Image ${index + 1} failed`)
            break
          } else if (attempts % 5 === 0) {
            console.log(`[${jobId}] Image ${index + 1} status: ${status} (${attempts * 2}s)`)
          }
        }
      }
      
      return imageUrl ? { url: imageUrl, prompt: scenePrompt, index } : null
    } catch (error) {
      console.error(`[${jobId}] Image ${index + 1} error:`, error.message)
      return null
    }
  })
  
  // Wait for all images
  const results = await Promise.all(imagePromises)
  return results.filter(r => r !== null).sort((a, b) => a.index - b.index)
}

// Build AI video using image-to-video asset type (creates actual motion from images)
function buildAIGeneratedVideoEdit(templateId, prompt, duration, dimensions, generatedImages, jobId) {
  const config = getTemplateVisualConfig(templateId)
  
  // Each image-to-video clip is ~5-6 seconds with real motion
  const sceneLength = 6
  const numScenes = generatedImages.length
  
  const tracks = []
  
  // Motion prompts for different effects
  const motionPrompts = [
    'Slowly zoom out while orbiting left around the scene',
    'Gentle push in with subtle camera shake',
    'Slow pan right across the scene',
    'Dolly zoom effect, slowly pulling back',
    'Smooth crane shot moving upward',
    'Slow motion zoom in on the center'
  ]
  
  // Track 1: AI-generated video scenes using image-to-video (REAL MOTION)
  const videoClips = generatedImages.map((img, index) => {
    const startTime = index * sceneLength
    const motionPrompt = motionPrompts[index % motionPrompts.length]
    
    return {
      asset: {
        type: 'image-to-video',
        src: img.url,
        prompt: motionPrompt // This tells Shotstack how to animate the image
      },
      start: startTime,
      length: 'auto', // Let Shotstack determine optimal length (usually 5-6s)
      fit: 'cover',
      transition: {
        in: 'fade',
        out: 'fade'
      }
    }
  })
  
  tracks.push({ clips: videoClips })
  
  // Track 2: Cinematic gradient overlay (positioned at bottom for text readability)
  tracks.push({
    clips: [{
      asset: {
        type: 'html',
        html: `<div style="width:100%;height:100%;background:linear-gradient(180deg, transparent 0%, transparent 40%, ${config.colorScheme.secondary}99 70%, ${config.colorScheme.secondary}ee 100%);"></div>`,
        width: dimensions.width,
        height: dimensions.height
      },
      start: 0,
      length: duration
    }]
  })
  
  // Track 3: AI badge indicator (top right)
  tracks.push({
    clips: [{
      asset: {
        type: 'html',
        html: `<div style="position:absolute;top:30px;right:30px;background:linear-gradient(135deg, #8b5cf6, #ec4899);padding:10px 20px;border-radius:25px;box-shadow:0 4px 15px rgba(0,0,0,0.3);">
          <span style="font-family:'Montserrat',sans-serif;font-size:14px;color:white;font-weight:700;letter-spacing:1px;">✨ AI GENERATED</span>
        </div>`,
        width: dimensions.width,
        height: dimensions.height
      },
      start: 0,
      length: duration
    }]
  })
  
  // Track 4: Main text content (positioned at bottom with proper styling)
  const lines = parsePromptToLines(prompt, Math.min(4, numScenes))
  const textClips = lines.map((line, index) => {
    const startTime = index * (duration / lines.length)
    const clipDuration = duration / lines.length + 0.5
    
    // Position text at bottom 30% of screen
    return {
      asset: {
        type: 'html',
        html: `<div style="position:absolute;bottom:8%;left:0;right:0;display:flex;flex-direction:column;align-items:center;padding:0 40px;">
          <p style="font-family:'${config.typography.fontFamily}',sans-serif;font-size:${Math.round(config.typography.titleSize * 0.85)}px;color:${config.colorScheme.text};font-weight:${config.typography.fontWeight};text-align:center;text-shadow:0 2px 10px rgba(0,0,0,0.9),0 4px 30px rgba(0,0,0,0.7);line-height:1.3;max-width:95%;">
            ${line}
          </p>
          <div style="margin-top:15px;width:60px;height:3px;background:linear-gradient(90deg, transparent, ${config.colorScheme.primary}, transparent);"></div>
        </div>`,
        width: dimensions.width,
        height: dimensions.height
      },
      start: startTime,
      length: clipDuration,
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
        { src: `https://fonts.googleapis.com/css2?family=${config.typography.fontFamily.replace(' ', '+')}:wght@400;700;800&display=swap` },
        { src: 'https://fonts.googleapis.com/css2?family=Montserrat:wght@600&display=swap' }
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

// ==================== HYBRID VIDEO EDIT (AI + STOCK) ====================
// Mixes AI-generated video clips for key moments with stock footage for B-roll
function buildHybridVideoEdit(templateId, prompt, duration, dimensions, stockVideos, aiVideos, jobId) {
  const config = getTemplateVisualConfig(templateId)
  const lines = parsePromptToLines(prompt, 4)
  
  const tracks = []
  const totalSegments = Math.max(4, Math.ceil(duration / 5))
  const segmentDuration = duration / totalSegments
  
  // Create alternating AI video and Stock clips for hybrid effect
  const backgroundClips = []
  let aiVideoIndex = 0
  let stockIndex = 0
  
  for (let i = 0; i < totalSegments; i++) {
    const startTime = i * segmentDuration
    // Use AI video for first, middle, and last segments (hook, climax, resolution)
    const useAI = (i === 0 || i === Math.floor(totalSegments / 2) || i === totalSegments - 1) && aiVideoIndex < aiVideos.length
    
    if (useAI && aiVideos.length > 0) {
      // Use AI-generated video clip
      const aiVideo = aiVideos[aiVideoIndex]
      
      backgroundClips.push({
        asset: {
          type: 'video',
          src: aiVideo.url,
          volume: 0.2 // Low volume for ambient AI video audio
        },
        start: startTime,
        length: segmentDuration + 0.5,
        fit: 'cover',
        transition: {
          in: 'fade',
          out: 'fade'
        }
      })
      aiVideoIndex++
    } else {
      // Stock video for B-roll
      const stockVideo = stockVideos[stockIndex % stockVideos.length] || stockVideos[0]
      if (stockVideo) {
        backgroundClips.push({
          asset: {
            type: 'video',
            src: stockVideo.url,
            volume: 0
          },
          start: startTime,
          length: segmentDuration + 0.3,
          fit: 'cover',
          effect: stockIndex % 2 === 0 ? 'zoomOut' : 'slideRight',
          transition: {
            in: 'fade',
            out: 'fade'
          }
        })
        stockIndex++
      }
    }
  }
  
  tracks.push({ clips: backgroundClips })
  
  // Track 2: Cinematic overlay (positioned at bottom for text readability)
  tracks.push({
    clips: [{
      asset: {
        type: 'html',
        html: `<div style="width:100%;height:100%;background:linear-gradient(180deg, transparent 0%, transparent 40%, ${config.colorScheme.secondary}88 70%, ${config.colorScheme.secondary}dd 100%);"></div>`,
        width: dimensions.width,
        height: dimensions.height
      },
      start: 0,
      length: duration
    }]
  })
  
  // Track 3: Hybrid indicator badge with model info
  const aiModelName = aiVideos.length > 0 ? aiVideos[0].model || 'AI' : 'AI'
  tracks.push({
    clips: [{
      asset: {
        type: 'html',
        html: `<div style="position:absolute;top:30px;right:30px;background:linear-gradient(135deg, #3b82f6, #06b6d4);padding:10px 20px;border-radius:25px;box-shadow:0 4px 15px rgba(0,0,0,0.3);">
          <span style="font-family:'Montserrat',sans-serif;font-size:12px;color:white;font-weight:700;letter-spacing:1px;">✨ ${aiModelName} + STOCK</span>
        </div>`,
        width: dimensions.width,
        height: dimensions.height
      },
      start: 0,
      length: duration
    }]
  })
  
  // Track 4: Main text content (positioned at bottom)
  const textClips = lines.map((line, index) => {
    const startTime = index * (duration / lines.length)
    const clipDuration = duration / lines.length + 0.5
    
    return {
      asset: {
        type: 'html',
        html: `<div style="position:absolute;bottom:8%;left:0;right:0;display:flex;flex-direction:column;align-items:center;padding:0 40px;">
          <p style="font-family:'${config.typography.fontFamily}',sans-serif;font-size:${Math.round(config.typography.titleSize * 0.85)}px;color:${config.colorScheme.text};font-weight:${config.typography.fontWeight};text-align:center;text-shadow:0 2px 10px rgba(0,0,0,0.9),0 4px 30px rgba(0,0,0,0.7);line-height:1.3;max-width:95%;">
            ${line}
          </p>
          <div style="margin-top:15px;width:60px;height:3px;background:linear-gradient(90deg, transparent, ${config.colorScheme.primary}, transparent);"></div>
        </div>`,
        width: dimensions.width,
        height: dimensions.height
      },
      start: startTime,
      length: clipDuration,
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
        { src: `https://fonts.googleapis.com/css2?family=${config.typography.fontFamily.replace(' ', '+')}:wght@400;700;800&display=swap` },
        { src: 'https://fonts.googleapis.com/css2?family=Montserrat:wght@600&display=swap' }
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
  
  // Track 2: Dark overlay for text readability (gradient at bottom only)
  tracks.push({
    clips: [{
      asset: {
        type: 'html',
        html: `<div style="width:100%;height:100%;background:linear-gradient(180deg, transparent 0%, transparent 40%, ${config.colorScheme.secondary}88 70%, ${config.colorScheme.secondary}dd 100%);"></div>`,
        width: dimensions.width,
        height: dimensions.height
      },
      start: 0,
      length: duration
    }]
  })
  
  // Track 3: Stock badge indicator
  tracks.push({
    clips: [{
      asset: {
        type: 'html',
        html: `<div style="position:absolute;top:30px;right:30px;background:rgba(0,0,0,0.6);padding:10px 20px;border-radius:25px;box-shadow:0 4px 15px rgba(0,0,0,0.3);">
          <span style="font-family:'Montserrat',sans-serif;font-size:14px;color:white;font-weight:700;letter-spacing:1px;">📹 HD VIDEO</span>
        </div>`,
        width: dimensions.width,
        height: dimensions.height
      },
      start: 0,
      length: duration
    }]
  })
  
  // Track 4: Main text content (positioned at bottom)
  const textClips = lines.map((line, index) => {
    const startTime = index * (duration / lines.length)
    const clipDuration = duration / lines.length + 0.5
    
    return {
      asset: {
        type: 'html',
        html: `<div style="position:absolute;bottom:8%;left:0;right:0;display:flex;flex-direction:column;align-items:center;padding:0 40px;">
          <p style="font-family:'${config.typography.fontFamily}',sans-serif;font-size:${Math.round(config.typography.titleSize * 0.85)}px;color:${config.colorScheme.text};font-weight:${config.typography.fontWeight};text-align:center;text-shadow:0 2px 10px rgba(0,0,0,0.9),0 4px 30px rgba(0,0,0,0.7);line-height:1.3;max-width:95%;">
            ${line}
          </p>
          <div style="margin-top:15px;width:60px;height:3px;background:linear-gradient(90deg, transparent, ${config.colorScheme.primary}, transparent);"></div>
        </div>`,
        width: dimensions.width,
        height: dimensions.height
      },
      start: startTime,
      length: clipDuration,
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
