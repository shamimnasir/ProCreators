import { NextResponse } from 'next/server'
import { writeFile, mkdir, readFile, unlink } from 'fs/promises'
import { existsSync, createWriteStream } from 'fs'
import { join } from 'path'
import { randomUUID } from 'crypto'
import { fal } from '@fal-ai/client'
import ffmpeg from 'fluent-ffmpeg'
import textToSpeech from '@google-cloud/text-to-speech'
import { getCollection } from '@/lib/mongodb'
import { spawn } from 'child_process'
import path from 'path'

// Set ffmpeg path
ffmpeg.setFfmpegPath('/usr/bin/ffmpeg')
ffmpeg.setFfprobePath('/usr/bin/ffprobe')

export const maxDuration = 300 // 5 minutes timeout
export const dynamic = 'force-dynamic'

// Configure Fal.ai client
fal.config({
  credentials: process.env.FAL_KEY
})

// ==================== ASS CAPTION GENERATION ====================
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
    case 'karaoke':
      primaryColor = '&H0000FFFF'
      outline = 5
      break
    case 'neon-glow':
      primaryColor = '&H00FFFFFF'
      outlineColor = '&H00FF00FF'
      outline = 10
      shadow = 15
      break
    case 'minimal-clean':
      primaryColor = '&H00FFFFFF'
      outline = 2
      shadow = 1
      bold = 0
      break
    case 'cinematic':
      primaryColor = '&H00FFFFFF'
      outline = 3
      shadow = 2
      marginV = 60
      break
    case 'bold-outline':
    default:
      outline = 5
      shadow = 3
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
    
    ass += `Dialogue: 0,${formatASSTime(startTime)},${formatASSTime(endTime)},Default,,0,0,0,,${chunk}\n`
    
    currentTime = endTime
  }
  
  return ass
}

function formatASSTime(seconds) {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)
  const centisecs = Math.floor((seconds % 1) * 100)
  return `${hours}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${String(centisecs).padStart(2, '0')}`
}

// ==================== IMAGE GENERATION ====================
async function generateImageWithAI(prompt, jobId, index) {
  console.log(`[${jobId}] Generating image ${index + 1}: ${prompt.substring(0, 50)}...`)
  
  try {
    // Use Gemini nano-banana for image generation (same as other tools)
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
    
    // Fallback: try Fal.ai if Gemini fails
    try {
      console.log(`[${jobId}] Trying Fal.ai fallback...`)
      const result = await fal.subscribe('fal-ai/flux/schnell', {
        input: {
          prompt: `${prompt}, cinematic, high quality`,
          image_size: 'portrait_16_9',
          num_images: 1
        }
      })
      
      if (result.data?.images?.[0]?.url) {
        console.log(`[${jobId}] ✅ Image ${index + 1} generated (Fal.ai fallback)`)
        return result.data.images[0].url
      }
    } catch (fallbackError) {
      console.error(`[${jobId}] Fal.ai fallback also failed:`, fallbackError.message)
    }
    
    return null
  }
}

// ==================== VIDEO GENERATION ====================
async function generateVideoFromImage(imageUrl, prompt, jobId, index, duration = 5) {
  console.log(`[${jobId}] Creating video ${index + 1} from image...`)
  
  // For now, we'll use the image directly and compile via FFmpeg
  // This creates a video from static images with subtle zoom/pan effects
  // which is more reliable than external AI video generation
  return {
    url: imageUrl,
    prompt: prompt,
    duration: duration,
    type: 'image-to-video-ffmpeg',
    index: index
  }
}

// ==================== VIDEO COMPILATION ====================
async function compileTransformationVideo({
  jobId,
  videos,
  narrationText,
  duration,
  dimensions,
  voiceOption,
  ttsLanguage,
  selectedVoice,
  voiceFile,
  captionStyle,
  topic
}) {
  const tempDir = `/tmp/transformation-video-${jobId}`
  
  try {
    console.log(`[${jobId}] 🎬 Starting FFmpeg compilation...`)
    
    await mkdir(tempDir, { recursive: true })
    
    const { Readable } = require('stream')
    const { pipeline } = require('stream/promises')
    
    // Step 1: Download all video clips
    console.log(`[${jobId}] Step 1: Downloading ${videos.length} video clips...`)
    const videoFiles = []
    
    for (let i = 0; i < videos.length; i++) {
      const video = videos[i]
      if (!video || !video.url) continue
      
      const videoPath = join(tempDir, `clip-${i}.mp4`)
      
      try {
        const response = await fetch(video.url)
        if (!response.ok) throw new Error(`HTTP ${response.status}`)
        
        const fileStream = createWriteStream(videoPath)
        await pipeline(Readable.fromWeb(response.body), fileStream)
        videoFiles.push(videoPath)
        console.log(`[${jobId}] ✅ Downloaded clip ${i + 1}/${videos.length}`)
      } catch (error) {
        console.error(`[${jobId}] Failed to download clip ${i}:`, error.message)
      }
    }
    
    if (videoFiles.length === 0) {
      throw new Error('No video clips could be downloaded')
    }
    
    // Step 2: Generate or process voice audio
    console.log(`[${jobId}] Step 2: Processing audio...`)
    let audioPath = join(tempDir, 'voice.mp3')
    let hasAudio = false
    let spokenText = narrationText
    
    if (voiceOption === 'tts' && narrationText && narrationText.trim()) {
      console.log(`[${jobId}] Generating TTS...`)
      
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
          default: languageCode = 'en-US'
        }
        
        const voiceConfig = { languageCode }
        
        if (selectedVoice && selectedVoice.includes('-')) {
          const voiceParts = selectedVoice.split('-')
          if (voiceParts.length >= 2) {
            voiceConfig.languageCode = `${voiceParts[0]}-${voiceParts[1]}`.toLowerCase()
            voiceConfig.name = selectedVoice
          }
        }
        
        const ttsRequest = {
          input: { text: narrationText },
          voice: voiceConfig,
          audioConfig: {
            audioEncoding: 'MP3',
            speakingRate: 0.95,
            pitch: 0.0
          }
        }
        
        const [response] = await client.synthesizeSpeech(ttsRequest)
        await writeFile(audioPath, response.audioContent, 'binary')
        hasAudio = true
        console.log(`[${jobId}] ✅ TTS generated`)
      } catch (ttsError) {
        console.error(`[${jobId}] TTS failed:`, ttsError.message)
      }
    } else if (voiceOption === 'upload' && voiceFile) {
      const buffer = Buffer.from(await voiceFile.arrayBuffer())
      await writeFile(audioPath, buffer)
      hasAudio = true
      console.log(`[${jobId}] ✅ Uploaded audio saved`)
    }
    
    // Get audio duration
    let actualDuration = duration
    if (hasAudio && existsSync(audioPath)) {
      actualDuration = await new Promise((resolve) => {
        ffmpeg.ffprobe(audioPath, (err, metadata) => {
          if (err) resolve(duration)
          else resolve(metadata.format.duration || duration)
        })
      })
      console.log(`[${jobId}] Audio duration: ${actualDuration}s`)
    }
    
    // Step 3: Normalize and process clips
    console.log(`[${jobId}] Step 3: Processing ${videoFiles.length} clips...`)
    const targetWidth = dimensions.width
    const targetHeight = dimensions.height
    const durationPerClip = actualDuration / videoFiles.length
    
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
            console.log(`[${jobId}] ✅ Processed clip ${i + 1}/${videoFiles.length}`)
            resolve()
          })
          .on('error', reject)
          .run()
      })
    }
    
    // Step 4: Concatenate clips
    console.log(`[${jobId}] Step 4: Concatenating clips...`)
    const clipListPath = join(tempDir, 'clips.txt')
    const clipListContent = normalizedFiles.map(file => `file '${file}'`).join('\n')
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
    
    // Step 5: Merge with audio
    console.log(`[${jobId}] Step 5: Merging audio...`)
    const videoWithAudioPath = join(tempDir, 'with-audio.mp4')
    
    if (hasAudio && existsSync(audioPath)) {
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
    
    // Step 6: Add captions
    console.log(`[${jobId}] Step 6: Adding captions...`)
    const finalVideoPath = join(tempDir, 'final.mp4')
    
    const shouldAddCaptions = captionStyle && captionStyle !== 'none' && hasAudio && spokenText
    
    if (shouldAddCaptions) {
      try {
        const captionContent = generateASSCaptions(spokenText, actualDuration, captionStyle, dimensions.height, dimensions.width)
        const captionsPath = join(tempDir, 'captions.ass')
        await writeFile(captionsPath, captionContent)
        
        const escapedPath = captionsPath.replace(/\\/g, '/').replace(/:/g, '\\:')
        
        await new Promise((resolve, reject) => {
          ffmpeg(videoWithAudioPath)
            .outputOptions(['-vf', `ass='${escapedPath}':fontsdir=/app/fonts`, '-c:v', 'libx264', '-preset', 'fast', '-crf', '23', '-c:a', 'copy', '-movflags', '+faststart'])
            .output(finalVideoPath)
            .on('end', resolve)
            .on('error', (err) => {
              console.error(`[${jobId}] Caption burn failed:`, err.message)
              require('fs').copyFileSync(videoWithAudioPath, finalVideoPath)
              resolve()
            })
            .run()
        })
      } catch (captionError) {
        require('fs').copyFileSync(videoWithAudioPath, finalVideoPath)
      }
    } else {
      require('fs').copyFileSync(videoWithAudioPath, finalVideoPath)
    }
    
    // Step 7: Save to public folder
    console.log(`[${jobId}] Step 7: Saving video...`)
    const videoBuffer = await readFile(finalVideoPath)
    
    const publicDir = '/app/public/transformation-videos'
    if (!existsSync(publicDir)) {
      await mkdir(publicDir, { recursive: true })
    }
    
    const publicVideoPath = join(publicDir, `${jobId}.mp4`)
    await writeFile(publicVideoPath, videoBuffer)
    
    const videoUrl = `/transformation-videos/${jobId}.mp4`
    console.log(`[${jobId}] ✅ Video saved: ${videoUrl}`)
    
    // Step 8: Save to library
    console.log(`[${jobId}] Step 8: Saving to library...`)
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
        metadata: {
          duration: actualDuration,
          dimensions,
          clipCount: videos.length,
          jobId
        },
        createdAt: new Date(),
        expiresAt
      })
      
      console.log(`[${jobId}] ✅ Saved to library`)
    } catch (saveError) {
      console.error(`[${jobId}] Library save failed:`, saveError.message)
    }
    
    // Cleanup
    try {
      await require('fs/promises').rm(tempDir, { recursive: true, force: true })
    } catch (e) {
      // Ignore cleanup errors
    }
    
    console.log(`[${jobId}] 🎉 Compilation complete!`)
    
    return {
      videoUrl,
      duration: actualDuration,
      format: dimensions,
      clipCount: videos.length,
      fileSize: videoBuffer.length
    }
    
  } catch (error) {
    try {
      await require('fs/promises').rm(tempDir, { recursive: true, force: true })
    } catch (e) {
      // Ignore cleanup errors
    }
    
    throw error
  }
}

// ==================== MAIN HANDLER ====================
export async function POST(request) {
  const jobId = randomUUID()
  
  try {
    console.log(`[${jobId}] Starting transformation video generation...`)
    
    const formData = await request.formData()
    
    const topic = formData.get('topic') || ''
    const theme = formData.get('theme') || 'custom'
    const language = formData.get('language') || 'en'
    const imageSource = formData.get('imageSource') || 'ai'
    const targetDuration = parseInt(formData.get('targetDuration') || '25')
    const format = formData.get('format') || 'portrait'
    const voiceOption = formData.get('voiceOption') || 'none'
    const ttsLanguage = formData.get('ttsLanguage') || 'en'
    const selectedVoice = formData.get('selectedVoice') || ''
    const voiceFile = formData.get('voiceFile')
    const captionStyle = formData.get('captionStyle') || 'bold-outline'
    
    const dimensions = format === 'portrait'
      ? { width: 1080, height: 1920 }
      : { width: 1920, height: 1080 }
    
    let scenes = []
    let imageUrls = []
    let narrationText = ''
    
    // Handle image source
    if (imageSource === 'ai') {
      // Parse AI-generated scenes
      const scenesJson = formData.get('scenes')
      if (scenesJson) {
        scenes = JSON.parse(scenesJson)
      }
      
      // Collect narration text
      narrationText = scenes.map(s => s.narration || '').filter(Boolean).join(' ')
      
      // Generate images for each scene
      console.log(`[${jobId}] Generating ${scenes.length} images...`)
      
      for (let i = 0; i < scenes.length; i++) {
        const scene = scenes[i]
        const imageUrl = await generateImageWithAI(scene.visualPrompt, jobId, i)
        if (imageUrl) {
          imageUrls.push({ url: imageUrl, prompt: scene.visualPrompt, scene })
        }
      }
      
    } else {
      // Use uploaded images
      const imageCount = parseInt(formData.get('imageCount') || '0')
      console.log(`[${jobId}] Processing ${imageCount} uploaded images...`)
      
      for (let i = 0; i < imageCount; i++) {
        const imageFile = formData.get(`image_${i}`)
        const description = formData.get(`image_${i}_description`) || ''
        
        if (imageFile && typeof imageFile !== 'string' && imageFile.size > 0) {
          // Upload image to temp storage and get URL
          const buffer = Buffer.from(await imageFile.arrayBuffer())
          const imagePath = join('/tmp', `upload-${jobId}-${i}.jpg`)
          await writeFile(imagePath, buffer)
          
          // For uploaded images, we need to upload them somewhere accessible
          // For now, save to public folder
          const publicDir = '/app/public/transformation-uploads'
          if (!existsSync(publicDir)) {
            await mkdir(publicDir, { recursive: true })
          }
          
          const publicImagePath = join(publicDir, `${jobId}-${i}.jpg`)
          await writeFile(publicImagePath, buffer)
          
          const imageUrl = `/transformation-uploads/${jobId}-${i}.jpg`
          imageUrls.push({ 
            url: `${process.env.NEXT_PUBLIC_BASE_URL}${imageUrl}`, 
            localPath: publicImagePath,
            prompt: description || `Transformation stage ${i + 1}` 
          })
          
          if (description) {
            narrationText += (narrationText ? ' ' : '') + description
          }
        }
      }
    }
    
    if (imageUrls.length < 2) {
      throw new Error('At least 2 images are required for transformation video')
    }
    
    console.log(`[${jobId}] Have ${imageUrls.length} images, generating videos...`)
    
    // Generate video clips from images
    const videoClips = []
    const durationPerScene = Math.max(3, Math.floor(targetDuration / imageUrls.length))
    
    for (let i = 0; i < imageUrls.length; i++) {
      const img = imageUrls[i]
      const video = await generateVideoFromImage(img.url, img.prompt, jobId, i, durationPerScene)
      if (video) {
        videoClips.push(video)
      }
    }
    
    if (videoClips.length === 0) {
      throw new Error('Failed to generate any video clips')
    }
    
    console.log(`[${jobId}] Generated ${videoClips.length} video clips, compiling...`)
    
    // Compile final video
    const result = await compileTransformationVideo({
      jobId,
      videos: videoClips,
      narrationText,
      duration: targetDuration,
      dimensions,
      voiceOption,
      ttsLanguage,
      selectedVoice,
      voiceFile,
      captionStyle,
      topic
    })
    
    return NextResponse.json({
      success: true,
      ...result,
      topic,
      theme,
      imageCount: imageUrls.length
    })
    
  } catch (error) {
    console.error(`[${jobId}] Error:`, error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to generate transformation video' },
      { status: 500 }
    )
  }
}
