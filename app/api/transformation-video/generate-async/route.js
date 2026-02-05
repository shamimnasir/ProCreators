import { NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { writeFile, readFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import { join } from 'path'
import ffmpeg from 'fluent-ffmpeg'
import textToSpeech from '@google-cloud/text-to-speech'
import { getCollection } from '@/lib/mongodb'

export const maxDuration = 300
export const dynamic = 'force-dynamic'

// Update job status
async function updateJobStatus(jobId, updates) {
  const collection = await getCollection('transformation-jobs')
  await collection.updateOne(
    { jobId },
    { $set: { ...updates, updatedAt: new Date() } }
  )
}

// Generate image using Gemini nano-banana
async function generateImageWithAI(prompt, jobId, index) {
  const apiKey = process.env.GOOGLE_API_KEY
  if (!apiKey) {
    throw new Error('Google API key not configured')
  }
  
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-preview-image-generation:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: `Generate a photorealistic image: ${prompt}` }]
          }],
          generationConfig: { responseModalities: ['image', 'text'] }
        })
      }
    )
    
    if (!response.ok) {
      throw new Error(`Image generation failed: ${response.status}`)
    }
    
    const data = await response.json()
    const imagePart = data.candidates?.[0]?.content?.parts?.find(p => p.inlineData)
    
    if (imagePart?.inlineData?.data) {
      return `data:image/png;base64,${imagePart.inlineData.data}`
    }
    
    throw new Error('No image in response')
  } catch (error) {
    console.error(`[${jobId}] Image generation error:`, error.message)
    throw error
  }
}

// Generate AI video from image using Replicate
async function generateAIVideo(imageUrl, visualPrompt, motionPrompt, jobId, index, duration = 5) {
  const replicateKey = process.env.REPLICATE_API_TOKEN
  
  if (!replicateKey) {
    throw new Error('REPLICATE_API_TOKEN not configured')
  }
  
  try {
    // Create a motion-focused prompt
    const fullMotionPrompt = motionPrompt 
      ? `${motionPrompt}. Progressive construction, workers moving, realistic building activity, smooth cinematic motion, time-lapse feel.`
      : `${visualPrompt}, natural movement, workers actively building, construction in progress, smooth cinematic motion, photorealistic, seamless transformation, time-lapse construction feel`
    
    const response = await fetch('https://api.replicate.com/v1/models/kwaivgi/kling-v2.1/predictions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${replicateKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        input: {
          mode: 'standard',
          duration: 5,
          prompt: fullMotionPrompt,
          start_image: imageUrl,
          negative_prompt: 'static, frozen, blurry, low quality, distorted, glitchy, jerky motion, cartoon, anime, drawing, painting, illustration, unrealistic'
        }
      })
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Video API error: ${response.status} - ${errorText}`)
    }
    
    let prediction = await response.json()
    // Poll until complete
    const maxWaitTime = 300000 // 5 minutes max
    const startTime = Date.now()
    
    while (prediction.status !== 'succeeded' && prediction.status !== 'failed') {
      if (Date.now() - startTime > maxWaitTime) {
        throw new Error('Video generation timed out')
      }
      
      await new Promise(resolve => setTimeout(resolve, 5000))
      
      const pollResponse = await fetch(`https://api.replicate.com/v1/predictions/${prediction.id}`, {
        headers: { 'Authorization': `Bearer ${replicateKey}` }
      })
      prediction = await pollResponse.json()
      
      const elapsed = Math.round((Date.now() - startTime) / 1000)
      `)
    }
    
    if (prediction.status === 'succeeded') {
      const videoUrl = prediction.output
      return videoUrl
    }
    
    throw new Error(`Video generation failed: ${prediction.status} - ${prediction.error || 'Unknown error'}`)
  } catch (error) {
    console.error(`[${jobId}] AI video generation failed:`, error.message)
    throw error
  }
}

// Generate ASS captions
function generateASSCaptions(text, duration, style, height, width) {
  const words = text.split(/\s+/).filter(Boolean)
  if (words.length === 0) return ''
  
  const totalChars = words.join('').length
  const charsPerSecond = totalChars / duration
  
  let fontName = 'Arial'
  let fontSize = Math.round(height * 0.05)
  let primaryColor = '&H00FFFFFF'
  let outlineColor = '&H00000000'
  let outline = 4
  let shadow = 2
  let bold = 1
  let marginV = 40
  let alignment = 2
  
  switch (style) {
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

  const wordsPerCaption = style === 'karaoke' ? 1 : 3
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
      topic,
      backgroundMusic
    } = params
    
    await mkdir(tempDir, { recursive: true })
    
    // Step 1: Generate images (or use existing ones from draft)
    await updateJobStatus(jobId, { status: 'generating-images', progress: 5, message: '🎨 Checking for existing images...' })
    
    const imageUrls = []
    const updatedScenes = [...scenes]
    
    for (let i = 0; i < scenes.length; i++) {
      const scene = scenes[i]
      let imageUrl = scene.imageUrl
      
      if (imageUrl) {
        imageUrls.push({ url: imageUrl, prompt: scene.visualPrompt, scene })
        await updateJobStatus(jobId, { 
          progress: 5 + Math.floor((i + 1) / scenes.length * 20),
          message: `✅ Using cached image ${i + 1}/${scenes.length}`
        })
      } else {
        await updateJobStatus(jobId, { 
          message: `🎨 Generating image ${i + 1}/${scenes.length}...`
        })
        imageUrl = await generateImageWithAI(scene.visualPrompt, jobId, i)
        if (imageUrl) {
          imageUrls.push({ url: imageUrl, prompt: scene.visualPrompt, scene })
          updatedScenes[i] = { ...scene, imageUrl }
        }
        await updateJobStatus(jobId, { 
          progress: 5 + Math.floor((i + 1) / scenes.length * 20),
          message: `🎨 Generated image ${i + 1}/${scenes.length}`
        })
      }
    }
    
    await updateJobStatus(jobId, { 
      updatedScenes,
      message: `🎨 All ${imageUrls.length} images ready`
    })
    
    if (imageUrls.length < 2) {
      throw new Error('Failed to generate enough images')
    }
    
    // Step 2: Generate AI videos from images IN PARALLEL for speed
    await updateJobStatus(jobId, { status: 'generating-videos', progress: 25, message: '🎬 Creating AI videos (processing in parallel for speed)...' })
    
    // Process videos in parallel batches for faster generation
    const PARALLEL_BATCH_SIZE = 3 // Process 3 videos at a time
    const videoUrls = []
    
    for (let batchStart = 0; batchStart < imageUrls.length; batchStart += PARALLEL_BATCH_SIZE) {
      const batchEnd = Math.min(batchStart + PARALLEL_BATCH_SIZE, imageUrls.length)
      const batch = imageUrls.slice(batchStart, batchEnd)
      
      await updateJobStatus(jobId, { 
        message: `🎬 Generating videos ${batchStart + 1}-${batchEnd} of ${imageUrls.length} (parallel batch)...`
      })
      
      // Process batch in parallel
      const batchPromises = batch.map((img, idx) => {
        const globalIdx = batchStart + idx
        return generateAIVideo(
          img.url, 
          img.prompt, 
          img.scene?.motionPrompt || '',
          jobId, 
          globalIdx, 
          5
        ).then(videoUrl => ({ url: videoUrl, type: 'ai-video', index: globalIdx }))
         .catch(error => {
           console.error(`[${jobId}] Video ${globalIdx + 1} failed:`, error.message)
           return { url: img.url, type: 'image-fallback', index: globalIdx }
         })
      })
      
      const batchResults = await Promise.all(batchPromises)
      
      // Sort by index and add to videoUrls
      batchResults.sort((a, b) => a.index - b.index)
      videoUrls.push(...batchResults)
      
      const successCount = batchResults.filter(r => r.type === 'ai-video').length
      await updateJobStatus(jobId, { 
        progress: 25 + Math.floor((batchEnd / imageUrls.length) * 45),
        message: `🎬 Completed batch: ${successCount}/${batch.length} AI videos ✅`
      })
    }
    
    // Step 3: Compile final video with transitions
    await updateJobStatus(jobId, { status: 'compiling', progress: 70, message: '✨ Compiling final video with transitions...' })
    
    const { Readable } = require('stream')
    const { pipeline } = require('stream/promises')
    
    // Download and process video clips
    const videoFiles = []
    for (let i = 0; i < videoUrls.length; i++) {
      const video = videoUrls[i]
      const videoPath = join(tempDir, `clip-${i}.mp4`)
      
      if (video.type === 'ai-video') {
        try {
          const videoResponse = await fetch(video.url)
          if (videoResponse.ok) {
            const videoBuffer = Buffer.from(await videoResponse.arrayBuffer())
            await writeFile(videoPath, videoBuffer)
            videoFiles.push(videoPath)
          }
        } catch (downloadError) {
          console.error(`[${jobId}] Failed to download video ${i + 1}:`, downloadError.message)
        }
      } else {
        // Create video from image with Ken Burns effect for fallback
        const imageData = video.url.split(',')[1]
        const imagePath = join(tempDir, `image-${i}.png`)
        await writeFile(imagePath, Buffer.from(imageData, 'base64'))
        
        await new Promise((resolve, reject) => {
          ffmpeg(imagePath)
            .loop(5)
            .outputOptions([
              '-vf', `scale=${dimensions.width * 1.2}:${dimensions.height * 1.2},zoompan=z='min(zoom+0.001,1.2)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=150:s=${dimensions.width}x${dimensions.height}:fps=30`,
              '-t', '5',
              '-c:v', 'libx264',
              '-pix_fmt', 'yuv420p'
            ])
            .output(videoPath)
            .on('end', () => { videoFiles.push(videoPath); resolve() })
            .on('error', reject)
            .run()
        })
      }
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
    
    // Create video with smooth transitions (crossfade/flash effect)
    await updateJobStatus(jobId, { progress: 85, message: '🎞️ Adding smooth transitions between clips...' })
    
    const transitionDuration = 0.5 // 0.5 second transition
    const concatVideoPath = join(tempDir, 'concat.mp4')
    
    if (normalizedFiles.length >= 2) {
      // Build complex filter for crossfade transitions
      let filterComplex = []
      let currentStream = '[0:v]'
      
      // Add fade-in to first clip
      filterComplex.push(`[0:v]fade=t=in:st=0:d=0.3[v0]`)
      currentStream = '[v0]'
      
      for (let i = 1; i < normalizedFiles.length; i++) {
        const offset = (i * clipDuration) - (transitionDuration * i)
        
        // Add xfade (crossfade) transition between clips
        // Using 'fade' transition which creates a smooth flash-like effect
        filterComplex.push(`${currentStream}[${i}:v]xfade=transition=fade:duration=${transitionDuration}:offset=${offset.toFixed(2)}[v${i}]`)
        currentStream = `[v${i}]`
      }
      
      // Add fade-out to last clip
      const totalDuration = (normalizedFiles.length * clipDuration) - (transitionDuration * (normalizedFiles.length - 1))
      filterComplex.push(`${currentStream}fade=t=out:st=${(totalDuration - 0.3).toFixed(2)}:d=0.3[vout]`)
      
      await new Promise((resolve, reject) => {
        const cmd = ffmpeg()
        
        // Add all input files
        normalizedFiles.forEach(file => cmd.input(file))
        
        cmd.complexFilter(filterComplex.join(';'), 'vout')
          .outputOptions(['-c:v', 'libx264', '-preset', 'fast', '-crf', '23', '-pix_fmt', 'yuv420p'])
          .output(concatVideoPath)
          .on('end', resolve)
          .on('error', (err) => {
            console.error(`[${jobId}] Transition filter failed, using simple concat:`, err.message)
            // Fallback to simple concatenation
            const clipListPath = join(tempDir, 'clips.txt')
            require('fs').writeFileSync(clipListPath, normalizedFiles.map(f => `file '${f}'`).join('\n'))
            
            ffmpeg()
              .input(clipListPath)
              .inputOptions(['-f', 'concat', '-safe', '0'])
              .outputOptions(['-c:v', 'libx264', '-preset', 'fast', '-crf', '23', '-pix_fmt', 'yuv420p'])
              .output(concatVideoPath)
              .on('end', resolve)
              .on('error', reject)
              .run()
          })
          .run()
      })
    } else {
      // Single clip, just copy
      require('fs').copyFileSync(normalizedFiles[0], concatVideoPath)
    }
    
    // Generate TTS if needed
    let narrationText = scenes.map(s => s.narration || '').filter(Boolean).join(' ')
    let audioPath = join(tempDir, 'voice.mp3')
    let hasVoiceAudio = false
    
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
        hasVoiceAudio = true
      } catch (ttsError) {
        console.error(`[${jobId}] TTS failed:`, ttsError.message)
      }
    }
    
    // Handle audio: voice, music, or both
    const finalVideoPath = join(tempDir, 'final.mp4')
    let currentVideoPath = concatVideoPath
    
    // Step 1: Add voiceover if available
    if (hasVoiceAudio) {
      await updateJobStatus(jobId, { progress: 90, message: '🔊 Adding voiceover...' })
      const videoWithVoicePath = join(tempDir, 'with-voice.mp4')
      
      await new Promise((resolve, reject) => {
        ffmpeg()
          .input(currentVideoPath)
          .input(audioPath)
          .outputOptions(['-c:v', 'copy', '-c:a', 'aac', '-b:a', '128k', '-movflags', '+faststart', '-map', '0:v:0', '-map', '1:a:0', '-shortest'])
          .output(videoWithVoicePath)
          .on('end', resolve)
          .on('error', reject)
          .run()
      })
      currentVideoPath = videoWithVoicePath
    }
    
    // Step 2: Add background music if provided
    if (backgroundMusic && (backgroundMusic.url || backgroundMusic.path)) {
      await updateJobStatus(jobId, { progress: 92, message: '🎵 Adding background music...' })
      
      try {
        // Support both 'url' and 'path' properties for backward compatibility
        const musicUrl = backgroundMusic.url || backgroundMusic.path
        const musicPath = join(tempDir, 'music.mp3')
        
        // Check if it's a local path or URL
        let musicBuffer
        if (musicUrl.startsWith('/')) {
          // Local file path - read directly
          const localPath = join('/app/public', musicUrl)
          if (existsSync(localPath)) {
            musicBuffer = await readFile(localPath)
            } else {
            throw new Error(`Local music file not found: ${localPath}`)
          }
        } else {
          // Remote URL - fetch it
          const musicResponse = await fetch(musicUrl)
          if (musicResponse.ok) {
            musicBuffer = Buffer.from(await musicResponse.arrayBuffer())
            } else {
            throw new Error(`Failed to download music: ${musicResponse.status}`)
          }
        }
        
        if (musicBuffer && musicBuffer.length > 0) {
          await writeFile(musicPath, musicBuffer)
          const videoWithMusicPath = join(tempDir, 'with-music.mp4')
          
          await new Promise((resolve, reject) => {
            const cmd = ffmpeg()
              .input(currentVideoPath)
              .input(musicPath)
            
            if (hasVoiceAudio) {
              // Mix voice (louder) with background music (softer)
              cmd.complexFilter([
                '[0:a]volume=1.0[voice]',
                '[1:a]volume=0.3,aloop=loop=-1:size=2e+09[music]',
                '[voice][music]amix=inputs=2:duration=first:dropout_transition=2[aout]'
              ])
              .outputOptions(['-c:v', 'copy', '-map', '0:v:0', '-map', '[aout]', '-c:a', 'aac', '-b:a', '192k', '-movflags', '+faststart', '-shortest'])
            } else {
              // Just background music - video has no audio track yet
              ...`)
              cmd.outputOptions([
                '-c:v', 'copy',
                '-c:a', 'aac', 
                '-b:a', '192k',
                '-map', '0:v:0',
                '-map', '1:a:0',
                '-shortest',
                '-movflags', '+faststart'
              ])
            }
            
            cmd.output(videoWithMusicPath)
              .on('end', () => {
                resolve()
              })
              .on('error', (err) => {
                console.error(`[${jobId}] Music merge error:`, err.message)
                reject(err)
              })
              .run()
          })
          
          currentVideoPath = videoWithMusicPath
        }
      } catch (musicError) {
        console.error(`[${jobId}] Background music failed:`, musicError.message)
        // Continue without music
      }
    }
    
    // Step 3: Add captions if needed
    const shouldAddCaptions = captionStyle && captionStyle !== 'none' && hasVoiceAudio && narrationText
    
    if (shouldAddCaptions) {
      await updateJobStatus(jobId, { progress: 95, message: '📝 Adding captions...' })
      try {
        const captionContent = generateASSCaptions(narrationText, targetDuration, captionStyle, dimensions.height, dimensions.width)
        const captionsPath = join(tempDir, 'captions.ass')
        await writeFile(captionsPath, captionContent)
        
        const escapedPath = captionsPath.replace(/\\/g, '/').replace(/:/g, '\\:')
        
        await new Promise((resolve, reject) => {
          ffmpeg(currentVideoPath)
            .outputOptions(['-vf', `ass='${escapedPath}':fontsdir=/app/fonts`, '-c:v', 'libx264', '-preset', 'fast', '-crf', '23', '-c:a', 'copy', '-movflags', '+faststart'])
            .output(finalVideoPath)
            .on('end', resolve)
            .on('error', () => { require('fs').copyFileSync(currentVideoPath, finalVideoPath); resolve() })
            .run()
        })
      } catch (captionError) {
        require('fs').copyFileSync(currentVideoPath, finalVideoPath)
      }
    } else {
      require('fs').copyFileSync(currentVideoPath, finalVideoPath)
    }
    
    // Save to public folder
    await updateJobStatus(jobId, { progress: 97, message: '💾 Saving video...' })
    
    const videoBuffer = await readFile(finalVideoPath)
    const publicDir = '/app/public/transformation-videos'
    if (!existsSync(publicDir)) {
      await mkdir(publicDir, { recursive: true })
    }
    
    const publicVideoPath = join(publicDir, `${jobId}.mp4`)
    await writeFile(publicVideoPath, videoBuffer)
    
    const videoUrl = `/transformation-videos/${jobId}.mp4`
    
    // Save to library
    await updateJobStatus(jobId, { progress: 99, message: '📚 Saving to library...' })
    
    try {
      const libraryCollection = await getCollection('library')
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + 30)
      
      await libraryCollection.insertOne({
        id: randomUUID(),
        url: videoUrl,
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
    
    // Parse background music if provided
    let backgroundMusic = null
    const backgroundMusicJson = formData.get('backgroundMusic')
    if (backgroundMusicJson) {
      try {
        backgroundMusic = JSON.parse(backgroundMusicJson)
        } catch (e) {
        }
    }
    
    // Support portrait (9:16), landscape (16:9), and square (1:1)
    let dimensions
    if (format === 'portrait') {
      dimensions = { width: 1080, height: 1920 }
    } else if (format === 'square') {
      dimensions = { width: 1080, height: 1080 }
    } else {
      dimensions = { width: 1920, height: 1080 }
    }
    
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
      topic,
      backgroundMusic
    }).catch(err => console.error(`[${jobId}] Background job error:`, err))
    
    // Return immediately with job ID
    return NextResponse.json({
      success: true,
      jobId,
      message: 'Video generation started. Poll /api/transformation-video/status?jobId=' + jobId + ' for updates.',
      estimatedTime: `${Math.ceil(scenes.length * 2)} minutes (processing ${scenes.length} scenes in parallel)`
    })
    
  } catch (error) {
    console.error(`[${jobId}] Error starting job:`, error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
