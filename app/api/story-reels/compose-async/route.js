import { NextResponse } from 'next/server'
import { writeFile, unlink, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import { join } from 'path'
import { randomUUID } from 'crypto'
import ffmpeg from 'fluent-ffmpeg'
import textToSpeech from '@google-cloud/text-to-speech'
import { getCollection } from '@/lib/mongodb'
import { getUserIdFromRequest, checkCredits, deductCredits, completeTransaction, refundCredits } from '@/lib/credits'

// Set ffmpeg path
ffmpeg.setFfmpegPath('/usr/bin/ffmpeg')
ffmpeg.setFfprobePath('/usr/bin/ffprobe')

export const maxDuration = 60 // Quick response - actual work happens in background
export const dynamic = 'force-dynamic'

// AI Video Generation Tiers - Using Replicate as primary provider
const AI_VIDEO_TIERS = {
  essential: {
    models: [
      { name: 'MiniMax Video', provider: 'replicate', model: 'minimax/video-01', costPerVideo: 0.05 },
    ],
    creditCost: 50
  },
  standard: {
    models: [
      { name: 'MiniMax Video', provider: 'replicate', model: 'minimax/video-01', costPerVideo: 0.10 },
      { name: 'Luma Ray2', provider: 'replicate', model: 'luma/ray', costPerVideo: 0.15 },
    ],
    creditCost: 70
  },
  professional: {
    models: [
      { name: 'Luma Ray2', provider: 'replicate', model: 'luma/ray', costPerVideo: 0.15 },
      { name: 'Kling', provider: 'replicate', model: 'fofr/kling-video', costPerVideo: 0.20 },
    ],
    creditCost: 100
  },
  cinema: {
    models: [
      { name: 'Kling Pro', provider: 'replicate', model: 'fofr/kling-video', costPerVideo: 0.25 },
    ],
    creditCost: 150
  }
}

// Update job status helper
async function updateJobStatus(jobId, updates) {
  const jobsCollection = await getCollection('video_jobs')
  await jobsCollection.updateOne(
    { jobId },
    { $set: { ...updates, updatedAt: new Date() } }
  )
}

// Background video generation process
async function processVideoInBackground(jobId, formDataObj, userId, transactionId) {
  const tempDir = `/tmp/story-reels-${jobId}`
  
  try {
    await updateJobStatus(jobId, { status: 'processing', progress: 5, progressMessage: 'Starting video generation...' })
    
    // Create temp directory
    await mkdir(tempDir, { recursive: true })
    
    // Extract form data
    const {
      script, duration, voiceOption, ttsLanguage, selectedVoice,
      captionStyle, musicTrack, resolution, stockVideos, videoOrder,
      scenePrompts, voiceFile, captionFontSize, captionPosition,
      videoOrientation, customMusicPath, niche, videoSource
    } = formDataObj
    
    // Determine video dimensions
    let dimensions = { width: 1080, height: 1920 }
    if (videoOrientation === 'landscape') {
      dimensions = { width: 1920, height: 1080 }
    } else if (videoOrientation === 'square') {
      dimensions = { width: 1080, height: 1080 }
    }
    
    const isAIMode = videoSource && videoSource.startsWith('ai-')
    const aiTier = isAIMode ? videoSource.replace('ai-', '') : 'standard'
    
    // Calculate clips needed for duration (5 sec per clip + buffer)
    const numClips = Math.min(Math.ceil(duration / 5) + 1, 40) // Max 40 clips for 3+ min
    
    await updateJobStatus(jobId, { 
      status: 'generating_clips', 
      progress: 10, 
      progressMessage: `Generating ${numClips} AI video clips...`,
      totalClips: numClips
    })
    
    // Generate AI video clips
    let aiVideos = []
    if (isAIMode) {
      const tierConfig = AI_VIDEO_TIERS[aiTier] || AI_VIDEO_TIERS.standard
      const models = tierConfig.models
      
      // Get Replicate API key
      const replicateApiKey = process.env.REPLICATE_API_TOKEN
      if (!replicateApiKey) {
        console.error(`[${jobId}] ❌ REPLICATE_API_TOKEN not configured`)
        throw new Error('AI video service not configured')
      }
      
      // Prepare scene prompts
      let scenes = scenePrompts && scenePrompts.length > 0 
        ? scenePrompts.map(p => p.fullPrompt || p.prompt)
        : generateFallbackScenes(script, numClips)
      
      // Extend if needed
      while (scenes.length < numClips) {
        scenes.push(scenes[scenes.length - 1])
      }
      
      let currentModelIndex = 0
      
      for (let i = 0; i < numClips; i++) {
        const scenePrompt = scenes[i] || scenes[scenes.length - 1]
        const cinematicPrompt = `${scenePrompt}, cinematic, high quality, professional video`
        
        // Update progress
        const clipProgress = 10 + Math.floor((i / numClips) * 50)
        await updateJobStatus(jobId, {
          progress: clipProgress,
          progressMessage: `Generating clip ${i + 1}/${numClips}...`,
          clipsGenerated: i
        })
        
        // Add delay between requests
        if (i > 0) {
          await new Promise(r => setTimeout(r, 2000))
        }
        
        let clipGenerated = false
        let retryCount = 0
        
        while (!clipGenerated && retryCount < 2 && currentModelIndex < models.length) {
          const model = models[currentModelIndex]
          
          try {
            console.log(`[${jobId}] Generating clip ${i + 1}/${numClips} with ${model.name} (Replicate)...`)
            
            // Create prediction on Replicate
            const createResponse = await fetch('https://api.replicate.com/v1/predictions', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${replicateApiKey}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                version: model.model,
                input: {
                  prompt: cinematicPrompt,
                  prompt_optimizer: true
                }
              })
            })
            
            if (!createResponse.ok) {
              throw new Error(`Replicate API error: ${createResponse.status}`)
            }
            
            let prediction = await createResponse.json()
            
            // Poll for completion (max 3 minutes per clip)
            let attempts = 0
            const maxAttempts = 90
            
            console.log(`[${jobId}] Starting poll for clip ${i + 1}, prediction: ${prediction.id}`)
            
            while (!['succeeded', 'failed', 'canceled'].includes(prediction.status) && attempts < maxAttempts) {
              await new Promise(r => setTimeout(r, 2000))
              attempts++
              
              try {
                const controller = new AbortController()
                const timeoutId = setTimeout(() => controller.abort(), 10000) // 10s timeout
                
                const statusResponse = await fetch(prediction.urls.get, {
                  headers: { 'Authorization': `Bearer ${replicateApiKey}` },
                  signal: controller.signal
                })
                clearTimeout(timeoutId)
                
                if (!statusResponse.ok) {
                  console.log(`[${jobId}] Status check failed: ${statusResponse.status}`)
                  continue // Retry
                }
                
                prediction = await statusResponse.json()
              } catch (pollError) {
                console.log(`[${jobId}] Poll attempt ${attempts} failed:`, pollError.message)
                // Continue to retry
                continue
              }
              
              // Update progress periodically
              if (attempts % 15 === 0) {
                console.log(`[${jobId}] Still polling clip ${i + 1}... (${attempts * 2}s, status: ${prediction.status})`)
                await updateJobStatus(jobId, {
                  progressMessage: `Generating clip ${i + 1}/${numClips}... (${attempts * 2}s)`
                })
              }
            }
            
            console.log(`[${jobId}] Poll complete for clip ${i + 1}: status=${prediction.status}`)
            
            if (prediction.status === 'succeeded' && prediction.output) {
              let videoUrl = prediction.output
              if (Array.isArray(prediction.output)) {
                videoUrl = prediction.output[0]
              } else if (typeof prediction.output === 'object') {
                videoUrl = prediction.output.url || prediction.output.video_url || prediction.output.video?.url
              }
              
              if (videoUrl) {
                aiVideos.push({
                  url: videoUrl,
                  keyword: `ai-scene-${i + 1}`,
                  type: 'ai-generated',
                  model: model.name
                })
                clipGenerated = true
                console.log(`[${jobId}] ✅ Clip ${i + 1} generated`)
              } else {
                throw new Error('No video URL in response')
              }
            } else {
              throw new Error(prediction.error || 'Prediction failed or timeout')
            }
          } catch (error) {
            console.error(`[${jobId}] ❌ Clip ${i + 1} failed:`, error.message)
            if (error.message.includes('rate') || error.message.includes('429')) {
              await new Promise(r => setTimeout(r, 10000))
              retryCount++
            } else {
              currentModelIndex++
              retryCount = 0
            }
          }
        }
        
        if (!clipGenerated) {
          console.log(`[${jobId}] Skipping clip ${i + 1}`)
        }
      }
      
      await updateJobStatus(jobId, {
        progress: 60,
        progressMessage: `Generated ${aiVideos.length} clips. Downloading...`,
        clipsGenerated: aiVideos.length
      })
    }
    
    // Download and process video clips
    const videosToProcess = isAIMode && aiVideos.length > 0 ? aiVideos : stockVideos
    
    if (videosToProcess.length === 0) {
      throw new Error('No video clips generated')
    }
    
    const { Readable } = require('stream')
    const { pipeline } = require('stream/promises')
    
    const videoFiles = []
    for (let i = 0; i < videosToProcess.length; i++) {
      const video = videosToProcess[i]
      const videoPath = join(tempDir, `clip-${i}.mp4`)
      
      try {
        console.log(`[${jobId}] Downloading clip ${i + 1}...`)
        const response = await fetch(video.url)
        if (!response.ok) throw new Error(`HTTP ${response.status}`)
        
        const fileStream = require('fs').createWriteStream(videoPath)
        await pipeline(Readable.fromWeb(response.body), fileStream)
        videoFiles.push(videoPath)
      } catch (error) {
        console.error(`[${jobId}] Download failed for clip ${i + 1}:`, error.message)
      }
    }
    
    if (videoFiles.length === 0) {
      throw new Error('Failed to download any clips')
    }
    
    await updateJobStatus(jobId, {
      progress: 70,
      progressMessage: 'Generating voiceover...'
    })
    
    // Generate TTS audio
    let audioPath = join(tempDir, 'voice.mp3')
    
    if (voiceOption === 'tts') {
      const client = new textToSpeech.TextToSpeechClient({
        keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS
      })
      
      let languageCode = ttsLanguage === 'bn' ? 'bn-IN' : 'en-US'
      if (selectedVoice && selectedVoice.includes('-')) {
        const parts = selectedVoice.split('-')
        if (parts.length >= 2) languageCode = `${parts[0]}-${parts[1]}`
      }
      
      const [response] = await client.synthesizeSpeech({
        input: { text: script },
        voice: { languageCode, name: selectedVoice || undefined },
        audioConfig: { audioEncoding: 'MP3', speakingRate: 1.0 }
      })
      
      await writeFile(audioPath, response.audioContent, 'binary')
    } else if (voiceFile) {
      await writeFile(audioPath, voiceFile)
    }
    
    // Get audio duration
    const actualAudioDuration = await new Promise((resolve) => {
      ffmpeg.ffprobe(audioPath, (err, metadata) => {
        resolve(err ? duration : metadata.format.duration)
      })
    })
    
    await updateJobStatus(jobId, {
      progress: 75,
      progressMessage: 'Normalizing video clips...'
    })
    
    // Determine target dimensions
    let targetWidth, targetHeight
    if (videoOrientation === 'landscape') {
      targetWidth = resolution === '1080p' ? '1920' : '1280'
      targetHeight = resolution === '1080p' ? '1080' : '720'
    } else if (videoOrientation === 'square') {
      targetWidth = resolution === '1080p' ? '1080' : '720'
      targetHeight = resolution === '1080p' ? '1080' : '720'
    } else {
      targetWidth = resolution === '1080p' ? '1080' : '720'
      targetHeight = resolution === '1080p' ? '1920' : '1280'
    }
    
    // Normalize clips
    const durationPerClip = actualAudioDuration / videoFiles.length
    const normalizedFiles = []
    
    for (let i = 0; i < videoFiles.length; i++) {
      const normalizedPath = join(tempDir, `normalized-${i}.mp4`)
      
      await new Promise((resolve, reject) => {
        ffmpeg(videoFiles[i])
          .outputOptions([
            '-vf', `scale=${targetWidth}:${targetHeight}:force_original_aspect_ratio=increase,crop=${targetWidth}:${targetHeight},fps=30`,
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
            resolve()
          })
          .on('error', reject)
          .run()
      })
    }
    
    await updateJobStatus(jobId, {
      progress: 85,
      progressMessage: 'Concatenating video...'
    })
    
    // Concatenate clips
    const clipListPath = join(tempDir, 'clips.txt')
    const clipListContent = normalizedFiles.map(f => `file '${f}'`).join('\n')
    await writeFile(clipListPath, clipListContent)
    
    const concatVideoPath = join(tempDir, 'concat.mp4')
    await new Promise((resolve, reject) => {
      ffmpeg()
        .input(clipListPath)
        .inputOptions(['-f', 'concat', '-safe', '0'])
        .outputOptions(['-c:v', 'libx264', '-preset', 'fast', '-crf', '23', '-pix_fmt', 'yuv420p'])
        .output(concatVideoPath)
        .on('end', resolve)
        .on('error', reject)
        .run()
    })
    
    await updateJobStatus(jobId, {
      progress: 90,
      progressMessage: 'Adding captions and audio...'
    })
    
    // Generate captions
    const captionsPath = join(tempDir, 'captions.ass')
    const captionContent = generateASSCaptions(script, actualAudioDuration, captionStyle, targetHeight, targetWidth, captionFontSize, captionPosition)
    await writeFile(captionsPath, captionContent, 'utf8')
    
    // Add captions
    const captionedPath = join(tempDir, 'captioned.mp4')
    const escapedCaptionsPath = captionsPath.replace(/\\/g, '/').replace(/:/g, '\\:')
    
    await new Promise((resolve, reject) => {
      ffmpeg()
        .input(concatVideoPath)
        .outputOptions([
          '-vf', `ass='${escapedCaptionsPath}':fontsdir=/app/fonts`,
          '-c:v', 'libx264', '-preset', 'fast', '-crf', '23', '-pix_fmt', 'yuv420p', '-an'
        ])
        .output(captionedPath)
        .on('end', resolve)
        .on('error', reject)
        .run()
    })
    
    // Merge with audio
    const finalVideoPath = join(tempDir, 'final.mp4')
    await new Promise((resolve, reject) => {
      ffmpeg()
        .input(captionedPath)
        .input(audioPath)
        .outputOptions([
          '-c:v', 'copy', '-c:a', 'aac', '-b:a', '128k',
          '-movflags', '+faststart', '-map', '0:v:0', '-map', '1:a:0', '-shortest'
        ])
        .output(finalVideoPath)
        .on('end', resolve)
        .on('error', reject)
        .run()
    })
    
    await updateJobStatus(jobId, {
      progress: 95,
      progressMessage: 'Saving to library...'
    })
    
    // Verify final video exists and has content
    if (!existsSync(finalVideoPath)) {
      throw new Error('Final video file was not created')
    }
    
    const finalVideoStats = await require('fs/promises').stat(finalVideoPath)
    if (finalVideoStats.size === 0) {
      throw new Error('Final video file is empty (0 bytes)')
    }
    
    console.log(`[${jobId}] ✅ Final video size: ${(finalVideoStats.size / 1024 / 1024).toFixed(2)} MB`)
    
    // Save to public folder
    const videoBuffer = await require('fs/promises').readFile(finalVideoPath)
    
    // Double-check buffer has content
    if (!videoBuffer || videoBuffer.length === 0) {
      throw new Error('Failed to read final video file - buffer is empty')
    }
    
    const publicDir = '/app/public/story-reels'
    if (!existsSync(publicDir)) await mkdir(publicDir, { recursive: true })
    
    const publicVideoPath = join(publicDir, `${jobId}.mp4`)
    await writeFile(publicVideoPath, videoBuffer)
    
    // Verify the public file was written correctly
    const publicFileStats = await require('fs/promises').stat(publicVideoPath)
    if (publicFileStats.size !== videoBuffer.length) {
      throw new Error(`Public video file size mismatch: expected ${videoBuffer.length}, got ${publicFileStats.size}`)
    }
    
    console.log(`[${jobId}] ✅ Video saved to public folder: ${publicVideoPath}`)
    
    const videoUrl = `/story-reels/${jobId}.mp4`
    
    // Save to library
    const libraryCollection = await getCollection('library')
    const nicheDisplayName = niche === 'story-reels' ? 'Story Reel' : 
      niche?.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') || 'AI Video'
    
    await libraryCollection.insertOne({
      id: randomUUID(),
      userId,
      content: script || '',
      videoUrl,
      filePath: videoUrl,
      fileSize: videoBuffer.length,
      script: script || '',
      type: 'story-reel',
      category: 'video',
      niche: niche || 'story-reels',
      title: script ? `${nicheDisplayName}: ${script.substring(0, 50)}...` : `${nicheDisplayName} Video`,
      description: script ? script.substring(0, 100) + '...' : `AI-generated video`,
      metadata: { duration: actualAudioDuration, resolution, clipCount: videoFiles.length, voiceOption, captionStyle, niche, jobId },
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    })
    
    // Complete transaction
    if (transactionId) {
      await completeTransaction(transactionId)
    }
    
    // Update job as completed
    await updateJobStatus(jobId, {
      status: 'completed',
      progress: 100,
      progressMessage: 'Video ready!',
      videoUrl,
      duration: actualAudioDuration,
      completedAt: new Date()
    })
    
    console.log(`[${jobId}] ✅ Video completed: ${videoUrl}`)
    
    // Cleanup temp files
    try {
      await require('fs/promises').rm(tempDir, { recursive: true, force: true })
    } catch (e) {}
    
  } catch (error) {
    console.error(`[${jobId}] ❌ Error:`, error)
    
    // Refund credits
    if (transactionId) {
      await refundCredits(transactionId, error.message)
    }
    
    await updateJobStatus(jobId, {
      status: 'failed',
      progress: 0,
      progressMessage: 'Generation failed',
      error: error.message
    })
    
    // Cleanup
    try {
      await require('fs/promises').rm(tempDir, { recursive: true, force: true })
    } catch (e) {}
  }
}

// Simple fallback scene generator
function generateFallbackScenes(script, numScenes) {
  const sentences = script.split(/[.!?]+/).filter(s => s.trim().length > 10)
  const scenes = []
  const perScene = Math.ceil(sentences.length / numScenes)
  
  for (let i = 0; i < numScenes; i++) {
    const start = i * perScene
    const text = sentences.slice(start, start + perScene).join('. ')
    scenes.push(text.substring(0, 200) || 'Cinematic scene with professional lighting')
  }
  
  return scenes
}

// Caption generator (simplified)
function generateASSCaptions(script, duration, style, height, width, fontSize, position) {
  const h = parseInt(height) || 1920
  const w = parseInt(width) || 1080
  const words = script.trim().split(/\s+/).filter(w => w.length > 0)
  const wordsPerCaption = style === 'karaoke' ? 1 : 3
  const totalChars = script.replace(/\s+/g, '').length
  const charsPerSecond = totalChars / duration
  
  const baseFontSize = h >= 1920 ? 64 : h >= 1280 ? 48 : 40
  const fontSizeMultiplier = fontSize === 'small' ? 0.85 : fontSize === 'large' ? 1.3 : 1.0
  const finalFontSize = Math.round(baseFontSize * fontSizeMultiplier)
  const marginV = position === 'top' ? 50 : position === 'center' ? Math.round(h / 2) : h >= 1920 ? 120 : 90
  
  let ass = `\ufeff[Script Info]
Title: Story Reels Captions
ScriptType: v4.00+
WrapStyle: 0
PlayResX: ${w}
PlayResY: ${h}
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,Siyam Rupali,${finalFontSize},&H00FFFFFF,&H000000FF,&H00000000,&H00000000,-1,0,0,0,100,100,0,0,1,4,2,2,10,10,${marginV},1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
`
  
  let currentTime = 0
  for (let i = 0; i < words.length; i += wordsPerCaption) {
    const chunk = words.slice(i, i + wordsPerCaption).join(' ')
    const chunkChars = chunk.replace(/\s+/g, '').length
    const chunkDuration = (chunkChars / charsPerSecond) * 1.05
    const startTime = currentTime
    const endTime = Math.min(currentTime + chunkDuration, duration)
    
    const formatTime = (s) => {
      const hrs = Math.floor(s / 3600)
      const mins = Math.floor((s % 3600) / 60)
      const secs = Math.floor(s % 60)
      const cs = Math.floor((s % 1) * 100)
      return `${hrs}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${String(cs).padStart(2, '0')}`
    }
    
    ass += `Dialogue: 0,${formatTime(startTime)},${formatTime(endTime)},Default,,0,0,0,,${chunk}\n`
    currentTime = endTime
  }
  
  return ass
}

export async function POST(request) {
  const jobId = randomUUID()
  
  try {
    console.log(`[${jobId}] Starting compose-async request`)
    
    // Get user ID
    const userId = await getUserIdFromRequest(request)
    if (!userId) {
      console.log(`[${jobId}] No userId found`)
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 })
    }
    console.log(`[${jobId}] User: ${userId}`)
    
    // Parse form data
    const formData = await request.formData()
    const videoSource = formData.get('videoSource') || 'stock'
    const duration = parseInt(formData.get('duration')) || 30
    
    console.log(`[${jobId}] Duration: ${duration}, VideoSource: ${videoSource}`)
    
    // Validate duration (max 10 minutes = 600 seconds for long-form videos)
    if (duration > 600) {
      console.log(`[${jobId}] Duration ${duration} exceeds 600s limit`)
      return NextResponse.json({ success: false, error: 'Maximum duration is 10 minutes (600 seconds)' }, { status: 400 })
    }
    
    // Determine credit cost
    let creditToolId = 'quick-reels-stock'
    if (videoSource === 'ai-essential') creditToolId = 'quick-reels-ai-essential'
    else if (videoSource === 'ai-standard') creditToolId = 'quick-reels-ai-standard'
    else if (videoSource === 'ai-professional') creditToolId = 'quick-reels-ai-professional'
    else if (videoSource === 'ai-cinema') creditToolId = 'quick-reels-ai-cinema'
    
    console.log(`[${jobId}] Credit tool ID: ${creditToolId}`)
    
    // For longer videos, multiply credits
    const durationMultiplier = Math.ceil(duration / 30) // Each 30s costs base rate
    
    // Check and deduct credits
    const creditCheck = await checkCredits(userId, creditToolId)
    console.log(`[${jobId}] Credit check:`, JSON.stringify(creditCheck))
    const totalCost = creditCheck.cost * durationMultiplier
    
    if (creditCheck.currentBalance < totalCost) {
      console.log(`[${jobId}] Insufficient credits: ${creditCheck.currentBalance} < ${totalCost}`)
      return NextResponse.json({
        success: false,
        error: `Insufficient credits. ${duration}s video costs ${totalCost} credits, you have ${creditCheck.currentBalance}.`
      }, { status: 402 })
    }
    
    console.log(`[${jobId}] Deducting credits...`)
    const deductResult = await deductCredits(userId, creditToolId, { multiplier: durationMultiplier })
    if (!deductResult.success) {
      console.log(`[${jobId}] Deduct failed:`, deductResult.error)
      return NextResponse.json({ success: false, error: deductResult.error }, { status: 402 })
    }
    console.log(`[${jobId}] Credits deducted successfully`)
    
    // Extract all form data
    const formDataObj = {
      script: formData.get('script'),
      duration,
      voiceOption: formData.get('voiceOption') || 'tts',
      ttsLanguage: formData.get('ttsLanguage') || 'en',
      selectedVoice: formData.get('selectedVoice'),
      captionStyle: formData.get('captionStyle') || 'bold-outline',
      musicTrack: formData.get('musicTrack') || 'none',
      resolution: formData.get('resolution') || '1080p',
      stockVideos: JSON.parse(formData.get('stockVideos') || '[]'),
      videoOrder: JSON.parse(formData.get('videoOrder') || '[]'),
      scenePrompts: JSON.parse(formData.get('scenePrompts') || '[]'),
      voiceFile: formData.get('voiceFile') ? Buffer.from(await formData.get('voiceFile').arrayBuffer()) : null,
      captionFontSize: formData.get('captionFontSize') || 'medium',
      captionPosition: formData.get('captionPosition') || 'bottom',
      videoOrientation: formData.get('videoOrientation') || 'portrait',
      customMusicPath: formData.get('customMusicPath'),
      niche: formData.get('niche') || 'story-reels',
      videoSource
    }
    
    // Create job record
    const jobsCollection = await getCollection('video_jobs')
    await jobsCollection.insertOne({
      jobId,
      userId,
      status: 'pending',
      progress: 0,
      progressMessage: 'Starting...',
      totalClips: 0,
      clipsGenerated: 0,
      duration,
      videoSource,
      transactionId: deductResult.transactionId,
      createdAt: new Date()
    })
    
    // Start background processing (fire and forget)
    processVideoInBackground(jobId, formDataObj, userId, deductResult.transactionId)
      .catch(err => console.error(`[${jobId}] Background error:`, err))
    
    // Return immediately with job ID
    return NextResponse.json({
      success: true,
      async: true,
      jobId,
      message: 'Video generation started. Poll /api/story-reels/job-status for progress.',
      estimatedTime: Math.ceil(duration / 5) * 60 + 120, // Rough estimate in seconds
      creditsUsed: totalCost,
      remainingCredits: deductResult.newBalance
    })
    
  } catch (error) {
    console.error(`[${jobId}] Error:`, error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
