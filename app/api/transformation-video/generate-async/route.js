import { NextResponse } from 'next/server'
import { writeFile, mkdir, readFile } from 'fs/promises'
import { existsSync, createWriteStream } from 'fs'
import { join } from 'path'
import { randomUUID } from 'crypto'
import ffmpeg from 'fluent-ffmpeg'
import textToSpeech from '@google-cloud/text-to-speech'
import { getCollection } from '@/lib/mongodb'

// Set ffmpeg path
ffmpeg.setFfmpegPath('/usr/bin/ffmpeg')
ffmpeg.setFfprobePath('/usr/bin/ffprobe')

export const maxDuration = 60 // Only need 60s to start the job
export const dynamic = 'force-dynamic'

// Update job status in DB
async function updateJobStatus(jobId, updates) {
  try {
    const jobsCollection = await getCollection('transformation-jobs')
    await jobsCollection.updateOne(
      { jobId },
      { $set: { ...updates, updatedAt: new Date() } }
    )
  } catch (error) {
    console.error(`[${jobId}] Failed to update job status:`, error.message)
  }
}

// Generate image with Gemini
async function generateImageWithAI(prompt, jobId, index) {
  console.log(`[${jobId}] Generating image ${index + 1}: ${prompt.substring(0, 50)}...`)
  
  try {
    const { generateImage } = await import('@/lib/gemini-image')
    
    const result = await generateImage(
      `${prompt}, ultra realistic, cinematic lighting, 8k quality, detailed, photorealistic`,
      'models/nano-banana-pro-preview'
    )
    
    if (result.success && result.imageUrl) {
      console.log(`[${jobId}] ✅ Image ${index + 1} generated`)
      return result.imageUrl
    }
    
    throw new Error(result.error || 'No image URL in response')
  } catch (error) {
    console.error(`[${jobId}] Image generation failed:`, error.message)
    return null
  }
}

// Generate AI video from image using Replicate - Kling v2.1 (high quality, realistic motion)
async function generateAIVideo(imageUrl, prompt, jobId, index, duration = 5) {
  console.log(`[${jobId}] Generating AI video ${index + 1} with Kling v2.1...`)
  
  const replicateKey = process.env.REPLICATE_API_TOKEN
  
  if (!replicateKey) {
    throw new Error('REPLICATE_API_TOKEN not configured')
  }
  
  try {
    // Use Kling v2.1 for high-quality image-to-video generation
    // This model produces realistic motion and natural movement
    console.log(`[${jobId}] Using Kling v2.1 (standard 720p mode)...`)
    
    // Create a motion-focused prompt from the visual prompt
    const motionPrompt = `${prompt}, natural movement, smooth motion, cinematic, photorealistic, seamless transformation`
    
    const response = await fetch('https://api.replicate.com/v1/models/kwaivgi/kling-v2.1/predictions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${replicateKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        input: {
          mode: 'standard', // 720p, faster and more cost-effective
          duration: 5, // 5 seconds per clip
          prompt: motionPrompt,
          start_image: imageUrl,
          negative_prompt: 'static, frozen, blurry, low quality, distorted, glitchy, jerky motion'
        }
      })
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Replicate/Kling API error: ${response.status} - ${errorText}`)
    }
    
    let prediction = await response.json()
    console.log(`[${jobId}] Kling video ${index + 1} prediction ID: ${prediction.id}`)
    
    // Poll until complete (Kling typically takes 2-3 minutes)
    let attempts = 0
    const maxAttempts = 180 // 6 minutes max per video
    while (!['succeeded', 'failed', 'canceled'].includes(prediction.status) && attempts < maxAttempts) {
      await new Promise(r => setTimeout(r, 2000))
      attempts++
      
      const statusResponse = await fetch(`https://api.replicate.com/v1/predictions/${prediction.id}`, {
        headers: { 'Authorization': `Bearer ${replicateKey}` }
      })
      prediction = await statusResponse.json()
      
      if (attempts % 15 === 0) {
        const elapsed = attempts * 2
        console.log(`[${jobId}] Kling video ${index + 1} status: ${prediction.status} (${elapsed}s)`)
        await updateJobStatus(jobId, {
          message: `🎬 Generating realistic AI video ${index + 1}... (${Math.floor(elapsed / 60)}m ${elapsed % 60}s)`
        })
      }
    }
    
    if (prediction.status === 'succeeded' && prediction.output) {
      // Kling returns the video URL directly (not in an array)
      const videoUrl = typeof prediction.output === 'string' ? prediction.output : prediction.output.url || prediction.output
      console.log(`[${jobId}] ✅ Kling AI Video ${index + 1} generated successfully`)
      return videoUrl
    } else {
      throw new Error(`Kling video generation failed: ${prediction.status} - ${prediction.error || 'Unknown error'}`)
    }
  } catch (error) {
    console.error(`[${jobId}] Kling AI video generation failed:`, error.message)
    throw error
  }
}

// ASS Caption generation
function generateASSCaptions(script, duration, captionStyle, targetHeight, targetWidth) {
  const height = parseInt(targetHeight) || 1920
  const width = parseInt(targetWidth) || 1080
  
  const words = script.trim().split(/\s+/).filter(w => w.length > 0)
  const totalChars = script.replace(/\s+/g, '').length
  const charsPerSecond = totalChars / duration
  
  const baseFontSize = height >= 1920 ? 64 : height >= 1440 ? 56 : 48
  let fontSize = baseFontSize
  let marginV = height >= 1920 ? 120 : 90
  let primaryColor = '&H00FFFFFF'
  let outlineColor = '&H00000000'
  let outline = 4
  let shadow = 2
  let bold = -1
  let fontName = 'Siyam Rupali'
  let alignment = 2
  
  switch (captionStyle) {
    case 'karaoke': primaryColor = '&H0000FFFF'; outline = 5; break
    case 'neon-glow': outlineColor = '&H00FF00FF'; outline = 10; shadow = 15; break
    case 'minimal-clean': outline = 2; shadow = 1; bold = 0; break
    case 'cinematic': outline = 3; shadow = 2; marginV = 60; break
    default: outline = 5; shadow = 3
  }
  
  let ass = `\ufeff[Script Info]
Title: Transformation Video Captions
ScriptType: v4.00+
WrapStyle: 0
PlayResX: ${width}
PlayResY: ${height}
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,${fontName},${fontSize},${primaryColor},&H000000FF,${outlineColor},&H00000000,${bold},0,0,0,100,100,0,0,1,${outline},${shadow},${alignment},10,10,${marginV},1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
`

  const wordsPerCaption = captionStyle === 'karaoke' ? 1 : 3
  let currentTime = 0
  
  for (let i = 0; i < words.length; i += wordsPerCaption) {
    const chunk = words.slice(i, i + wordsPerCaption).join(' ')
    const chunkChars = chunk.replace(/\s+/g, '').length
    const chunkDuration = (chunkChars / charsPerSecond) * 1.05
    
    const startTime = currentTime
    const endTime = Math.min(currentTime + chunkDuration, duration)
    
    const formatTime = (seconds) => {
      const hours = Math.floor(seconds / 3600)
      const minutes = Math.floor((seconds % 3600) / 60)
      const secs = Math.floor(seconds % 60)
      const centisecs = Math.floor((seconds % 1) * 100)
      return `${hours}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${String(centisecs).padStart(2, '0')}`
    }
    
    ass += `Dialogue: 0,${formatTime(startTime)},${formatTime(endTime)},Default,,0,0,0,,${chunk}\n`
    currentTime = endTime
  }
  
  return ass
}

// Main background processing function
async function processTransformationJob(jobId, params) {
  const tempDir = `/tmp/transformation-video-${jobId}`
  
  try {
    const {
      scenes,
      targetDuration,
      dimensions,
      voiceOption,
      ttsLanguage,
      selectedVoice,
      captionStyle,
      topic
    } = params
    
    await mkdir(tempDir, { recursive: true })
    
    // Step 1: Generate images (or use existing ones from draft)
    await updateJobStatus(jobId, { status: 'generating-images', progress: 5, message: '🎨 Checking for existing images...' })
    
    const imageUrls = []
    const updatedScenes = [...scenes] // Track scenes with their image URLs
    
    for (let i = 0; i < scenes.length; i++) {
      const scene = scenes[i]
      let imageUrl = scene.imageUrl // Check if image already exists in draft
      
      if (imageUrl) {
        console.log(`[${jobId}] Scene ${i + 1} already has image, skipping generation`)
        imageUrls.push({ url: imageUrl, prompt: scene.visualPrompt, scene })
        await updateJobStatus(jobId, { 
          progress: 5 + Math.floor((i + 1) / scenes.length * 20),
          message: `✅ Using cached image ${i + 1}/${scenes.length}`
        })
      } else {
        // Generate new image
        await updateJobStatus(jobId, { 
          message: `🎨 Generating image ${i + 1}/${scenes.length}...`
        })
        imageUrl = await generateImageWithAI(scene.visualPrompt, jobId, i)
        if (imageUrl) {
          imageUrls.push({ url: imageUrl, prompt: scene.visualPrompt, scene })
          // Update scene with image URL for draft saving
          updatedScenes[i] = { ...scene, imageUrl }
        }
        await updateJobStatus(jobId, { 
          progress: 5 + Math.floor((i + 1) / scenes.length * 20),
          message: `🎨 Generated image ${i + 1}/${scenes.length}`
        })
      }
    }
    
    // Save updated scenes with image URLs to job for frontend to retrieve
    await updateJobStatus(jobId, { 
      updatedScenes,
      message: `🎨 All ${imageUrls.length} images ready`
    })
    
    if (imageUrls.length < 2) {
      throw new Error('Failed to generate enough images')
    }
    
    // Step 2: Generate AI videos from images using Kling v2.1
    await updateJobStatus(jobId, { status: 'generating-videos', progress: 25, message: '🎬 Creating realistic AI videos with Kling v2.1 (this takes 2-3 min per clip)...' })
    
    const videoUrls = []
    for (let i = 0; i < imageUrls.length; i++) {
      try {
        const videoUrl = await generateAIVideo(imageUrls[i].url, imageUrls[i].prompt, jobId, i, 5)
        videoUrls.push({ url: videoUrl, type: 'ai-video' })
        await updateJobStatus(jobId, { 
          progress: 25 + Math.floor((i + 1) / imageUrls.length * 45),
          message: `🎬 Generated Kling AI video ${i + 1}/${imageUrls.length} ✅`
        })
      } catch (videoError) {
        console.error(`[${jobId}] Kling video ${i + 1} failed, using animated image fallback:`, videoError.message)
        videoUrls.push({ url: imageUrls[i].url, type: 'image-fallback' })
        await updateJobStatus(jobId, { 
          message: `⚠️ Video ${i + 1} fell back to animated image (API issue)`
        })
      }
    }
    
    // Step 3: Compile final video
    await updateJobStatus(jobId, { status: 'compiling', progress: 70, message: '✨ Compiling final video...' })
    
    const { Readable } = require('stream')
    const { pipeline } = require('stream/promises')
    
    // Download and process video clips
    const videoFiles = []
    for (let i = 0; i < videoUrls.length; i++) {
      const video = videoUrls[i]
      const videoPath = join(tempDir, `clip-${i}.mp4`)
      
      if (video.type === 'ai-video') {
        // Download AI video
        const response = await fetch(video.url)
        if (response.ok) {
          const fileStream = createWriteStream(videoPath)
          await pipeline(Readable.fromWeb(response.body), fileStream)
          videoFiles.push(videoPath)
        }
      } else {
        // Convert image to video with FFmpeg
        const imagePath = join(tempDir, `image-${i}.jpg`)
        const response = await fetch(video.url)
        if (response.ok) {
          const fileStream = createWriteStream(imagePath)
          await pipeline(Readable.fromWeb(response.body), fileStream)
          
          await new Promise((resolve, reject) => {
            ffmpeg(imagePath)
              .loop(5)
              .inputOptions(['-framerate', '30'])
              .outputOptions([
                '-vf', `scale=${dimensions.width}:${dimensions.height}:force_original_aspect_ratio=increase,crop=${dimensions.width}:${dimensions.height}`,
                '-t', '5',
                '-c:v', 'libx264',
                '-preset', 'fast',
                '-crf', '23',
                '-pix_fmt', 'yuv420p',
                '-r', '30'
              ])
              .output(videoPath)
              .on('end', () => { videoFiles.push(videoPath); resolve() })
              .on('error', reject)
              .run()
          })
        }
      }
      
      await updateJobStatus(jobId, { 
        progress: 70 + Math.floor((i + 1) / videoUrls.length * 10),
        message: `✨ Processing clip ${i + 1}/${videoUrls.length}`
      })
    }
    
    // Normalize clips
    await updateJobStatus(jobId, { progress: 80, message: '🔧 Normalizing video clips...' })
    
    const normalizedFiles = []
    const clipDuration = targetDuration / videoFiles.length
    
    for (let i = 0; i < videoFiles.length; i++) {
      const normalizedPath = join(tempDir, `normalized-${i}.mp4`)
      
      await new Promise((resolve, reject) => {
        ffmpeg(videoFiles[i])
          .outputOptions([
            '-vf', `scale=${dimensions.width}:${dimensions.height}:force_original_aspect_ratio=increase,crop=${dimensions.width}:${dimensions.height},fps=30`,
            '-t', String(clipDuration),
            '-c:v', 'libx264',
            '-preset', 'fast',
            '-crf', '23',
            '-pix_fmt', 'yuv420p',
            '-an'
          ])
          .output(normalizedPath)
          .on('end', () => { normalizedFiles.push(normalizedPath); resolve() })
          .on('error', reject)
          .run()
      })
    }
    
    // Concatenate clips
    await updateJobStatus(jobId, { progress: 85, message: '🎞️ Concatenating clips...' })
    
    const clipListPath = join(tempDir, 'clips.txt')
    await writeFile(clipListPath, normalizedFiles.map(f => `file '${f}'`).join('\n'))
    
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
    
    // Generate TTS if needed
    let narrationText = scenes.map(s => s.narration || '').filter(Boolean).join(' ')
    let audioPath = join(tempDir, 'voice.mp3')
    let hasAudio = false
    
    if (voiceOption === 'tts' && narrationText.trim()) {
      await updateJobStatus(jobId, { progress: 88, message: '🎙️ Generating voiceover...' })
      
      try {
        const client = new textToSpeech.TextToSpeechClient({
          keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS
        })
        
        let languageCode = 'en-US'
        switch (ttsLanguage) {
          case 'bn': languageCode = 'bn-IN'; break
          case 'hi': languageCode = 'hi-IN'; break
          case 'es': languageCode = 'es-ES'; break
          case 'ar': languageCode = 'ar-XA'; break
        }
        
        const voiceConfig = { languageCode }
        if (selectedVoice && selectedVoice.includes('-')) {
          const parts = selectedVoice.split('-')
          voiceConfig.languageCode = `${parts[0]}-${parts[1]}`.toLowerCase()
          voiceConfig.name = selectedVoice
        }
        
        const [response] = await client.synthesizeSpeech({
          input: { text: narrationText },
          voice: voiceConfig,
          audioConfig: { audioEncoding: 'MP3', speakingRate: 0.95, pitch: 0.0 }
        })
        
        await writeFile(audioPath, response.audioContent, 'binary')
        hasAudio = true
      } catch (ttsError) {
        console.error(`[${jobId}] TTS failed:`, ttsError.message)
      }
    }
    
    // Merge audio
    const videoWithAudioPath = join(tempDir, 'with-audio.mp4')
    if (hasAudio) {
      await updateJobStatus(jobId, { progress: 90, message: '🔊 Adding audio...' })
      await new Promise((resolve, reject) => {
        ffmpeg()
          .input(concatVideoPath)
          .input(audioPath)
          .outputOptions(['-c:v', 'copy', '-c:a', 'aac', '-b:a', '128k', '-movflags', '+faststart', '-map', '0:v:0', '-map', '1:a:0', '-shortest'])
          .output(videoWithAudioPath)
          .on('end', resolve)
          .on('error', reject)
          .run()
      })
    } else {
      require('fs').copyFileSync(concatVideoPath, videoWithAudioPath)
    }
    
    // Add captions
    const finalVideoPath = join(tempDir, 'final.mp4')
    const shouldAddCaptions = captionStyle && captionStyle !== 'none' && hasAudio && narrationText
    
    if (shouldAddCaptions) {
      await updateJobStatus(jobId, { progress: 93, message: '📝 Adding captions...' })
      try {
        const captionContent = generateASSCaptions(narrationText, targetDuration, captionStyle, dimensions.height, dimensions.width)
        const captionsPath = join(tempDir, 'captions.ass')
        await writeFile(captionsPath, captionContent)
        
        const escapedPath = captionsPath.replace(/\\/g, '/').replace(/:/g, '\\:')
        
        await new Promise((resolve, reject) => {
          ffmpeg(videoWithAudioPath)
            .outputOptions(['-vf', `ass='${escapedPath}':fontsdir=/app/fonts`, '-c:v', 'libx264', '-preset', 'fast', '-crf', '23', '-c:a', 'copy', '-movflags', '+faststart'])
            .output(finalVideoPath)
            .on('end', resolve)
            .on('error', () => { require('fs').copyFileSync(videoWithAudioPath, finalVideoPath); resolve() })
            .run()
        })
      } catch (captionError) {
        require('fs').copyFileSync(videoWithAudioPath, finalVideoPath)
      }
    } else {
      require('fs').copyFileSync(videoWithAudioPath, finalVideoPath)
    }
    
    // Save to public folder
    await updateJobStatus(jobId, { progress: 96, message: '💾 Saving video...' })
    
    const videoBuffer = await readFile(finalVideoPath)
    const publicDir = '/app/public/transformation-videos'
    if (!existsSync(publicDir)) {
      await mkdir(publicDir, { recursive: true })
    }
    
    const publicVideoPath = join(publicDir, `${jobId}.mp4`)
    await writeFile(publicVideoPath, videoBuffer)
    
    const videoUrl = `/transformation-videos/${jobId}.mp4`
    
    // Save to library
    await updateJobStatus(jobId, { progress: 98, message: '📚 Saving to library...' })
    
    try {
      const libraryCollection = await getCollection('library')
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + 30)
      
      await libraryCollection.insertOne({
        id: randomUUID(),
        userId: 'default-user',
        content: topic || '',
        videoUrl,
        filePath: videoUrl,
        fileSize: videoBuffer.length,
        type: 'transformation-video',
        category: 'video',
        title: topic ? `Transformation: ${topic.substring(0, 50)}...` : 'AI Transformation Video',
        description: narrationText?.substring(0, 200) || '',
        metadata: { duration: targetDuration, dimensions, clipCount: videoUrls.length, jobId, aiGenerated: true },
        createdAt: new Date(),
        expiresAt
      })
    } catch (saveError) {
      console.error(`[${jobId}] Library save failed:`, saveError.message)
    }
    
    // Mark job complete
    await updateJobStatus(jobId, {
      status: 'complete',
      progress: 100,
      message: '✅ Video ready!',
      videoUrl,
      duration: targetDuration,
      clipCount: videoUrls.length,
      fileSize: videoBuffer.length
    })
    
    console.log(`[${jobId}] 🎉 Job complete! Video: ${videoUrl}`)
    
    // Cleanup
    try {
      await require('fs/promises').rm(tempDir, { recursive: true, force: true })
    } catch (e) { /* ignore */ }
    
  } catch (error) {
    console.error(`[${jobId}] Job failed:`, error)
    await updateJobStatus(jobId, {
      status: 'failed',
      error: error.message,
      message: `❌ Failed: ${error.message}`
    })
    
    // Cleanup on error
    try {
      await require('fs/promises').rm(tempDir, { recursive: true, force: true })
    } catch (e) { /* ignore */ }
  }
}

// Start async job
export async function POST(request) {
  const jobId = randomUUID()
  
  try {
    console.log(`[${jobId}] Starting async transformation job...`)
    
    const formData = await request.formData()
    
    const topic = formData.get('topic') || ''
    const theme = formData.get('theme') || 'custom'
    const language = formData.get('language') || 'en'
    const targetDuration = parseInt(formData.get('targetDuration') || '25')
    const format = formData.get('format') || 'portrait'
    const voiceOption = formData.get('voiceOption') || 'none'
    const ttsLanguage = formData.get('ttsLanguage') || 'en'
    const selectedVoice = formData.get('selectedVoice') || ''
    const captionStyle = formData.get('captionStyle') || 'bold-outline'
    
    const dimensions = format === 'portrait'
      ? { width: 1080, height: 1920 }
      : { width: 1920, height: 1080 }
    
    // Parse scenes
    const scenesJson = formData.get('scenes')
    let scenes = []
    if (scenesJson) {
      scenes = JSON.parse(scenesJson)
    }
    
    if (scenes.length < 2) {
      return NextResponse.json({ error: 'At least 2 scenes required' }, { status: 400 })
    }
    
    // Create job record
    const jobsCollection = await getCollection('transformation-jobs')
    await jobsCollection.insertOne({
      jobId,
      status: 'pending',
      progress: 0,
      message: 'Starting video generation...',
      topic,
      theme,
      sceneCount: scenes.length,
      dimensions,
      createdAt: new Date(),
      updatedAt: new Date()
    })
    
    // Start processing in background (don't await)
    processTransformationJob(jobId, {
      scenes,
      targetDuration,
      dimensions,
      voiceOption,
      ttsLanguage,
      selectedVoice,
      captionStyle,
      topic
    }).catch(err => console.error(`[${jobId}] Background job error:`, err))
    
    // Return immediately with job ID
    return NextResponse.json({
      success: true,
      jobId,
      message: 'Video generation started. Poll /api/transformation-video/status?jobId=' + jobId + ' for updates.',
      estimatedTime: `${Math.ceil(scenes.length * 2)} minutes`
    })
    
  } catch (error) {
    console.error(`[${jobId}] Error starting job:`, error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
