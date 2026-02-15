import { NextResponse } from 'next/server'
import { writeFile, unlink, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import { join } from 'path'
import { randomUUID } from 'crypto'
import ffmpeg from 'fluent-ffmpeg'
import textToSpeech from '@google-cloud/text-to-speech'
import { getCollection } from '@/lib/mongodb'
import { getUserIdFromRequest, checkCredits, deductCredits, completeTransaction, refundCredits } from '@/lib/credits'
import { fal } from '@fal-ai/client'

// Set ffmpeg path
ffmpeg.setFfmpegPath('/usr/bin/ffmpeg')
ffmpeg.setFfprobePath('/usr/bin/ffprobe')

// Configure Fal.ai client
fal.config({
  credentials: process.env.FAL_KEY
})

export const maxDuration = 300 // 5 minutes timeout
export const dynamic = 'force-dynamic'
export const maxBodySize = 100 * 1024 * 1024 // 100MB for video response

// AI Video Generation Tiers (generic names - no commercial branding)
const AI_VIDEO_TIERS = {
  essential: {
    models: [
      { name: 'Essential Fast', endpoint: 'fal-ai/pixverse/v5.5/text-to-video', costPerVideo: 0.04 },
      { name: 'Essential Extended', endpoint: 'fal-ai/longcat-video/distilled/text-to-video/720p', costPerVideo: 0.05 }
    ],
    description: 'Budget-friendly fast videos',
    creditCost: 50
  },
  standard: {
    models: [
      { name: 'Standard Quality', endpoint: 'fal-ai/wan/v2.2-a14b/text-to-video', costPerSecond: 0.05 },
      { name: 'Standard Plus', endpoint: 'fal-ai/hunyuan-video-v1.5/text-to-video', costPerSecond: 0.05 },
      { name: 'Standard Fast', endpoint: 'fal-ai/sana-video', costPerSecond: 0.05 }
    ],
    description: 'Good quality reliable videos',
    creditCost: 70
  },
  professional: {
    models: [
      { name: 'Professional HD', endpoint: 'fal-ai/kling-video/v2.5-turbo/pro/text-to-video', costPerSecond: 0.07 },
      { name: 'Professional Ultra', endpoint: 'fal-ai/kling-video/v2.6/pro/text-to-video', costPerSecond: 0.08 }
    ],
    description: 'High quality professional videos',
    creditCost: 100
  },
  cinema: {
    models: [
      { name: 'Cinema Quality', endpoint: 'fal-ai/veo3.1/fast', costPerSecond: 0.20 }
    ],
    description: 'Highest quality cinematic videos',
    creditCost: 150
  }
}

// Generate AI video clips using Fal.ai
async function generateAIVideoClips(script, duration, dimensions, tier, jobId) {
  const videos = []
  const numClips = Math.min(Math.ceil(duration / 5), 3) // 5 seconds per clip, max 3 clips
  
  // Parse script into scene prompts
  const scenes = parseScriptToScenes(script, numClips)
  
  // Get models for the selected tier
  const tierConfig = AI_VIDEO_TIERS[tier] || AI_VIDEO_TIERS.essential
  const models = tierConfig.models
  
  let currentModelIndex = 0
  
  for (let i = 0; i < numClips; i++) {
    const scenePrompt = scenes[i] || scenes[scenes.length - 1]
    const cinematicPrompt = `${scenePrompt}, cinematic, high quality, professional, ${
      dimensions.height > dimensions.width ? 'vertical portrait video, 9:16 aspect ratio' : 'horizontal landscape video, 16:9 aspect ratio'
    }`
    
    // Add delay between requests to avoid rate limits
    if (i > 0) {
      console.log(`[${jobId}] Waiting 3s before next AI clip...`)
      await new Promise(r => setTimeout(r, 3000))
    }
    
    let clipGenerated = false
    let retryCount = 0
    const maxRetries = 2
    
    while (!clipGenerated && retryCount < maxRetries && currentModelIndex < models.length) {
      const model = models[currentModelIndex]
      
      try {
        console.log(`[${jobId}] Generating AI clip ${i + 1}/${numClips} with ${model.name}...`)
        
        const result = await fal.subscribe(model.endpoint, {
          input: {
            prompt: cinematicPrompt,
            aspect_ratio: dimensions.height > dimensions.width ? '9:16' : '16:9',
            duration: '5'
          },
          logs: true,
          onQueueUpdate: (update) => {
            if (update.status === 'IN_PROGRESS') {
              console.log(`[${jobId}] AI model processing...`)
            }
          }
        })
        
        // Extract video URL from result
        const videoUrl = result.data?.video?.url || result.data?.video_url || result.data?.url || result.data?.output?.url
        
        if (videoUrl) {
          videos.push({
            url: videoUrl,
            keyword: `ai-scene-${i + 1}`,
            type: 'ai-generated',
            model: model.name,
            tier: tier
          })
          clipGenerated = true
          console.log(`[${jobId}] ✅ AI clip ${i + 1} generated with ${model.name}`)
        } else {
          throw new Error('No video URL in response')
        }
      } catch (error) {
        const errorMsg = error.message || ''
        console.error(`[${jobId}] ❌ AI clip ${i + 1} failed with ${model.name}:`, errorMsg)
        
        // Check for rate limit
        if (errorMsg.includes('concurrent') || errorMsg.includes('rate') || errorMsg.includes('limit')) {
          console.log(`[${jobId}] Rate limit hit, waiting 10s before retry...`)
          await new Promise(r => setTimeout(r, 10000))
          retryCount++
          continue
        }
        
        // Try next model
        currentModelIndex++
        retryCount = 0
      }
    }
    
    if (!clipGenerated) {
      console.log(`[${jobId}] Could not generate AI clip ${i + 1}, will fall back to stock`)
    }
  }
  
  return videos
}

// Parse script into scene descriptions for AI generation
function parseScriptToScenes(script, numScenes) {
  if (!script) return ['cinematic scene']
  
  // Split by sentences
  const sentences = script.split(/[.!?।]+/).filter(s => s.trim().length > 5)
  
  if (sentences.length === 0) {
    return [script.substring(0, 200)]
  }
  
  // Distribute sentences across scenes
  const scenesPerPart = Math.ceil(sentences.length / numScenes)
  const scenes = []
  
  for (let i = 0; i < numScenes; i++) {
    const start = i * scenesPerPart
    const end = Math.min(start + scenesPerPart, sentences.length)
    const sceneText = sentences.slice(start, end).join('. ')
    scenes.push(sceneText.substring(0, 300)) // Limit prompt length
  }
  
  return scenes
}

export async function POST(request) {
  const jobId = randomUUID()
  const tempDir = `/tmp/story-reels-${jobId}`
  let transactionId = null
  
  try {
    // Get user ID and check credits first
    const userId = await getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json({
        success: false,
        error: 'Authentication required. Please log in to use this tool.'
      }, { status: 401 })
    }
    
    const creditCheck = await checkCredits(userId, 'quick-reels')
    if (!creditCheck.hasEnough) {
      return NextResponse.json({
        success: false,
        error: `Insufficient credits. This tool costs ${creditCheck.cost} credits, but you have ${creditCheck.currentBalance}.`,
        creditInfo: creditCheck
      }, { status: 402 })
    }
    
    const deductResult = await deductCredits(userId, 'quick-reels')
    if (!deductResult.success) {
      return NextResponse.json({
        success: false,
        error: deductResult.error || 'Failed to process credits'
      }, { status: 402 })
    }
    transactionId = deductResult.transactionId
    
    // Create temp directory
    await mkdir(tempDir, { recursive: true })
    
    // Parse form data
    const formData = await request.formData()
    const script = formData.get('script')
    const duration = parseInt(formData.get('duration'))
    const voiceOption = formData.get('voiceOption') // 'tts' or 'upload'
    const ttsLanguage = formData.get('ttsLanguage') // 'bn' or 'en'
    const selectedVoice = formData.get('selectedVoice') // voice name from Google
    const captionStyle = formData.get('captionStyle')
    const musicTrack = formData.get('musicTrack')
    const resolution = formData.get('resolution')
    const stockVideos = JSON.parse(formData.get('stockVideos') || '[]')
    const videoOrder = JSON.parse(formData.get('videoOrder') || '[]')
    const keywords = JSON.parse(formData.get('keywords') || '[]')
    const voiceFile = formData.get('voiceFile')
    const captionFontSize = formData.get('captionFontSize') || 'medium'
    const captionPosition = formData.get('captionPosition') || 'bottom'
    const videoOrientation = formData.get('videoOrientation') || 'portrait' // portrait, landscape, square
    const customMusicPath = formData.get('customMusicPath') || null // For Freesound downloads
    const niche = formData.get('niche') || 'story-reels' // For Quick Reels categorization
    
    // Collect custom video files
    const customVideoFiles = []
    let customIdx = 0
    while (formData.has(`customVideo_${customIdx}`)) {
      customVideoFiles.push(formData.get(`customVideo_${customIdx}`))
      customIdx++
    }

    // Log detailed info about each clip
    const imageClips = stockVideos.filter(v => v.type === 'image' || /\.(jpg|jpeg|png|webp|gif)$/i.test(v.url))
    const videoClips = stockVideos.filter(v => !imageClips.includes(v))
    if (imageClips.length > 0) {
      // Image clips found
    }

    // Step 1: Process all video clips (stock videos + custom uploads) - PARALLELIZED
    const { Readable } = require('stream')
    const { pipeline } = require('stream/promises')
    const pLimit = (await import('p-limit')).default
    
    // Limit concurrent operations - increased for faster processing
    const limit = pLimit(8) // Process max 8 clips at once
    
    // Determine total clips based on video order or just stock videos (backward compatibility)
    // IMPORTANT: Limit to max 15 clips to avoid timeout issues
    const MAX_CLIPS = 15
    let totalClips = videoOrder.length > 0 ? videoOrder.length : stockVideos.length
    if (totalClips > MAX_CLIPS) {
      console.log(`[${jobId}] ⚠️ Limiting clips from ${totalClips} to ${MAX_CLIPS} to avoid timeout`)
      totalClips = MAX_CLIPS
      // Also limit the arrays
      if (videoOrder.length > MAX_CLIPS) videoOrder.length = MAX_CLIPS
      if (stockVideos.length > MAX_CLIPS) stockVideos.length = MAX_CLIPS
    }
    
    // Pre-calculate indices for each clip BEFORE parallel execution
    const clipIndices = []
    let stockVideoIdx = 0
    let customVideoIdx = 0
    
    for (let i = 0; i < totalClips; i++) {
      const orderInfo = videoOrder[i]
      const isCustom = orderInfo ? orderInfo.isCustom : false
      
      if (isCustom) {
        clipIndices.push({ isCustom: true, customIdx: customVideoIdx, stockIdx: null })
        customVideoIdx++
      } else {
        clipIndices.push({ isCustom: false, customIdx: null, stockIdx: stockVideoIdx })
        stockVideoIdx++
      }
    }
    
    // Build processing tasks
    const processingTasks = []
    
    for (let i = 0; i < totalClips; i++) {
      const videoPath = join(tempDir, `clip-${i}.mp4`)
      const clipInfo = clipIndices[i]
      const orderInfo = videoOrder[i]
      
      const task = limit(async () => {
        try {
          if (clipInfo.isCustom && customVideoFiles[clipInfo.customIdx]) {
            // Handle custom uploaded video
            const customFile = customVideoFiles[clipInfo.customIdx]
            const buffer = Buffer.from(await customFile.arrayBuffer())
            await writeFile(videoPath, buffer)
            return { index: i, path: videoPath, success: true }
          } else if (stockVideos[clipInfo.stockIdx]) {
            // Handle stock video URL, UGC video, or product image
            const video = stockVideos[clipInfo.stockIdx]
            const isImage = video.type === 'image' || /\.(jpg|jpeg|png|webp|gif)$/i.test(video.url)
            const isUGCVideo = video.type === 'ugc-video'
            
            if (isImage) {
              // Download image and convert to video with motion effects
              const imagePath = join(tempDir, `image-${i}.jpg`)
              
              // Handle local cached images vs external URLs
              let imageBuffer
              if (video.url.startsWith('/')) {
                // Local cached image - read from file system
                const localPath = join(process.cwd(), 'public', video.url)
                const fs = require('fs')
                if (!fs.existsSync(localPath)) {
                  throw new Error(`Local image not found: ${localPath}`)
                }
                imageBuffer = fs.readFileSync(localPath)
              } else {
                // External URL - fetch it
                const response = await fetch(video.url)
                if (!response.ok) {
                  throw new Error(`HTTP ${response.status}`)
                }
                imageBuffer = Buffer.from(await response.arrayBuffer())
              }
              
              // Save image to temp directory
              await writeFile(imagePath, imageBuffer)
              
              // Convert image to video with Ken Burns effect - OPTIMIZED
              await new Promise((resolve, reject) => {
                const randomEffect = Math.floor(Math.random() * 3) // 0: zoom in, 1: zoom out, 2: pan
                let filterComplex = ''
                
                if (randomEffect === 0) {
                  // Ken Burns: Zoom In effect - OPTIMIZED: scale reduced from 8000 to 2160
                  filterComplex = 'scale=2160:-1,zoompan=z=\'min(zoom+0.0015,1.5)\':d=125:x=\'iw/2-(iw/zoom/2)\':y=\'ih/2-(ih/zoom/2)\':s=1080x1920'
                } else if (randomEffect === 1) {
                  // Ken Burns: Zoom Out effect - OPTIMIZED
                  filterComplex = 'scale=2160:-1,zoompan=z=\'if(lte(zoom,1.0),1.5,max(1.001,zoom-0.0015))\':d=125:x=\'iw/2-(iw/zoom/2)\':y=\'ih/2-(ih/zoom/2)\':s=1080x1920'
                } else {
                  // Ken Burns: Pan effect - OPTIMIZED
                  filterComplex = 'scale=2160:-1,zoompan=z=1.2:d=125:x=\'if(gte(on,1),x+2,0)\':y=\'ih/2-(ih/zoom/2)\':s=1080x1920'
                }
                
                ffmpeg(imagePath)
                  .inputOptions(['-loop 1'])
                  .outputOptions([
                    '-vf', filterComplex,
                    '-t', '5', // 5 seconds per image
                    '-pix_fmt', 'yuv420p',
                    '-c:v', 'libx264',
                    '-preset', 'veryfast', // Changed from ultrafast for better quality/speed balance
                    '-crf', '23', // Better quality than 28
                    '-r', '30'
                  ])
                  .output(videoPath)
                  .on('end', () => {
                    resolve()
                  })
                  .on('error', (err) => {
                    console.error(`[${jobId}] ❌ Image to video conversion error:`, err.message)
                    reject(err)
                  })
                  .run()
              })
            } else {
              // Handle regular video URL or UGC video
              if (video.url.startsWith('/')) {
                // Local cached video (UGC) - copy from filesystem
                const localPath = join(process.cwd(), 'public', video.url)
                const fs = require('fs')
                if (!fs.existsSync(localPath)) {
                  throw new Error(`Local UGC video not found: ${localPath}`)
                }
                const videoBuffer = fs.readFileSync(localPath)
                await writeFile(videoPath, videoBuffer)
                } else {
                // External stock video - download it
                console.log(`[${jobId}] Downloading video from: ${video.url.substring(0, 100)}...`)
                const response = await fetch(video.url, {
                  headers: {
                    'User-Agent': 'Mozilla/5.0 (compatible; VideoComposer/1.0)'
                  }
                })
                if (!response.ok) {
                  console.error(`[${jobId}] Video download failed: HTTP ${response.status} for ${video.url.substring(0, 100)}`)
                  throw new Error(`HTTP ${response.status}`)
                }
                
                // Convert Web Stream to Node Stream and pipe to file
                const fileStream = require('fs').createWriteStream(videoPath)
                await pipeline(
                  Readable.fromWeb(response.body),
                  fileStream
                )
                
                }
            }
            
            return { index: i, path: videoPath, success: true }
          }
          
          return { index: i, path: null, success: false }
        } catch (error) {
          console.error(`[${jobId}] ❌ Error processing clip ${i}:`, error.message)
          return { index: i, path: null, success: false }
        }
      })
      
      processingTasks.push(task)
    }
    
    // Execute all tasks in parallel (with concurrency limit)
    const results = await Promise.all(processingTasks)
    
    // Collect successful video files in correct order
    const videoFiles = results
      .filter(r => r.success && r.path)
      .sort((a, b) => a.index - b.index)
      .map(r => r.path)

    if (videoFiles.length === 0) {
      throw new Error('Failed to process any video clips')
    }
    
    // Step 2: Generate or use voice audio
    let audioPath = join(tempDir, 'voice.mp3')
    
    if (voiceOption === 'tts') {
      // Generate TTS with Google Cloud
      try {
        // Initialize Google Cloud TTS client with service account
        const client = new textToSpeech.TextToSpeechClient({
          keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS
        })

        // Parse voice selection to extract language code
        let voiceName = selectedVoice
        let languageCode = ttsLanguage === 'bn' ? 'bn-IN' : 'en-US' // Default
        
        // If voice name is provided, extract language code from it
        if (selectedVoice && selectedVoice.includes('-')) {
          // Voice names are like: "en-US-Neural2-A", "bn-IN-Wavenet-A", "en-GB-Studio-C"
          const parts = selectedVoice.split('-')
          if (parts.length >= 2) {
            // Extract language code (e.g., "en-US", "bn-IN", "en-GB")
            languageCode = `${parts[0]}-${parts[1]}`
          }
        }
        
        const languageName = ttsLanguage === 'bn' ? 'Bengali' : 'English'

        // Construct the request - omit ssmlGender when using specific voice name
        // Google TTS will use the voice's natural gender
        const voiceConfig = {
          languageCode: languageCode
        }
        
        // Add voice name if provided
        if (voiceName) {
          voiceConfig.name = voiceName
          
          // Some voices require a model parameter
          // Studio voices and full Chirp3-HD voices work better with model parameter
          if (voiceName.includes('Studio')) {
            voiceConfig.model = voiceName
          } else if (voiceName.includes('Chirp3-HD') || voiceName.includes('Chirp-HD')) {
            // Chirp HD voices work with model parameter (optional but recommended)
            voiceConfig.model = voiceName
          }
          // Other voices (Neural2, Wavenet, Standard) don't need model parameter
        }
        
        const request = {
          input: { text: script },
          voice: voiceConfig,
          audioConfig: {
            audioEncoding: 'MP3',
            speakingRate: 1.0,
            pitch: 0.0,
            volumeGainDb: 0.0,
          },
        }

        const [response] = await client.synthesizeSpeech(request)

        // Write the audio content to file
        await writeFile(audioPath, response.audioContent, 'binary')
        
        } catch (googleError) {
        console.error(`[${jobId}] Google Cloud TTS failed:`, googleError.message)
        // Fallback to silent audio if Google TTS fails
        await new Promise((resolve, reject) => {
          ffmpeg()
            .input('anullsrc=r=44100:cl=stereo')
            .inputFormat('lavfi')
            .duration(duration)
            .audioCodec('libmp3lame')
            .save(audioPath)
            .on('end', () => {
              resolve()
            })
            .on('error', reject)
        })
      }
    } else if (voiceOption === 'upload') {
      // Use uploaded audio with volume boost (original recording option)
      if (voiceFile) {
        const buffer = Buffer.from(await voiceFile.arrayBuffer())
        const tempUploadPath = join(tempDir, 'uploaded-voice-raw.mp3')
        await writeFile(tempUploadPath, buffer)
        // Normalize volume to match TTS loudness (boost by 6dB and normalize)
        await new Promise((resolve, reject) => {
          ffmpeg(tempUploadPath)
            .audioFilters([
              'loudnorm=I=-16:TP=-1.5:LRA=11',  // Loudness normalization
              'volume=2.0'  // Additional 2x volume boost
            ])
            .audioCodec('libmp3lame')
            .audioBitrate('128k')
            .output(audioPath)
            .on('end', () => {
              resolve()
            })
            .on('error', (err) => {
              console.error(`[${jobId}] Audio normalization error:`, err.message)
              // Fallback: use original file if normalization fails
              require('fs').copyFileSync(tempUploadPath, audioPath)
              resolve()
            })
            .run()
        })
      } else {
        throw new Error('Voice file is required for upload option')
      }
    }

    // Verify audio file exists
    if (!existsSync(audioPath)) {
      throw new Error('Audio file was not created')
    }

    // Step 2b: Get actual audio duration BEFORE processing video clips
    const actualAudioDuration = await new Promise((resolve, reject) => {
      ffmpeg.ffprobe(audioPath, (err, metadata) => {
        if (err) {
          console.error(`[${jobId}] Could not get audio duration, using target:`, err.message)
          resolve(duration) // Fallback to target duration
        } else {
          const audioDuration = metadata.format.duration
          resolve(audioDuration)
        }
      })
    })

    // Step 3: Normalize each clip individually, then concatenate
    // Determine target dimensions based on video orientation
    let targetWidth, targetHeight
    
    if (videoOrientation === 'landscape') {
      // Landscape 16:9 (YouTube)
      targetWidth = resolution === '4k' ? '3840' : resolution === '2k' ? '2560' : resolution === '1080p' ? '1920' : '1280'
      targetHeight = resolution === '4k' ? '2160' : resolution === '2k' ? '1440' : resolution === '1080p' ? '1080' : '720'
    } else if (videoOrientation === 'square') {
      // Square 1:1 (Instagram)
      targetWidth = resolution === '4k' ? '2160' : resolution === '2k' ? '1440' : resolution === '1080p' ? '1080' : '720'
      targetHeight = resolution === '4k' ? '2160' : resolution === '2k' ? '1440' : resolution === '1080p' ? '1080' : '720'
    } else {
      // Portrait 9:16 (TikTok/Reels) - default
      targetWidth = resolution === '4k' ? '1216' : resolution === '2k' ? '810' : resolution === '1080p' ? '1080' : '720'
      targetHeight = resolution === '4k' ? '2160' : resolution === '2k' ? '1440' : resolution === '1080p' ? '1920' : '1280'
    }
    
    console.log(`[${jobId}] 📐 Video orientation: ${videoOrientation}, Dimensions: ${targetWidth}x${targetHeight}`)
    
    // Calculate duration per clip based on ACTUAL AUDIO DURATION (not target duration)
    const durationPerClip = actualAudioDuration / videoFiles.length
    
    // Step 3a: Normalize each clip individually - PARALLELIZED
    // Track which clips are images, stock videos, or custom uploads
    const clipTypes = []
    let stockIdx = 0
    let customIdx2 = 0
    
    for (let i = 0; i < totalClips; i++) {
      const orderInfo = videoOrder[i]
      const isCustom = orderInfo ? orderInfo.isCustom : false
      
      if (isCustom) {
        clipTypes.push({ type: 'custom' })
        customIdx2++
      } else {
        const stockVideo = stockVideos[stockIdx]
        const isImage = stockVideo && (stockVideo.type === 'image' || /\.(jpg|jpeg|png|webp|gif)$/i.test(stockVideo.url))
        const isUGC = stockVideo && stockVideo.type === 'ugc-video'
        clipTypes.push({ type: isImage ? 'image' : isUGC ? 'ugc' : 'stock', data: stockVideo })
        stockIdx++
      }
    }
    
    // Create all normalization tasks
    const normalizationTasks = videoFiles.map((videoFile, i) => {
      return limit(async () => {
        const normalizedPath = join(tempDir, `normalized-${i}.mp4`)
        const clipType = clipTypes[i]
        const orderInfo = videoOrder[i]
        const textOverlay = orderInfo?.textOverlay
        
        return new Promise((resolve, reject) => {
          const cmd = ffmpeg(videoFile)
          
          // Trim first 3 seconds ONLY for stock videos (not images, UGC, or custom)
          if (clipType && clipType.type === 'stock') {
            cmd.inputOptions(['-ss', '3'])
          }
          
          // Build video filter with optional text overlay
          let videoFilter = `scale=${targetWidth}:${targetHeight}:force_original_aspect_ratio=increase,crop=${targetWidth}:${targetHeight},fps=30`
          
          // Add text overlay if present - VIRAL COLORED BOX STYLE
          if (textOverlay && textOverlay.text) {
            const position = textOverlay.position || 'top'
            const color = textOverlay.color || 'yellow'
            
            // Viral font size - bold and impossible to miss  
            const fontSize = parseInt(targetHeight) >= 1920 ? 64 : 52
            
            // Calculate approximate characters per line (based on font size and video width)
            const charsPerLine = Math.floor(parseInt(targetWidth) / (fontSize * 0.55))
            
            // Split text into lines for wrapping
            const words = textOverlay.text.split(' ')
            let lines = []
            let currentLine = ''
            
            for (const word of words) {
              if ((currentLine + ' ' + word).trim().length <= charsPerLine) {
                currentLine = (currentLine + ' ' + word).trim()
              } else {
                if (currentLine) lines.push(currentLine)
                currentLine = word
              }
            }
            if (currentLine) lines.push(currentLine)
            
            // Limit to max 3 lines
            if (lines.length > 3) {
              lines = lines.slice(0, 3)
              lines[2] = lines[2] + '...'
            }
            
            // Join with newline character for ffmpeg
            const wrappedText = lines.join('\\n')
            
            // Escape special characters for ffmpeg
            const text = wrappedText
              .replace(/\\/g, '\\\\')
              .replace(/'/g, "'\\''")
              .replace(/:/g, "\\:")
              .replace(/\[/g, "\\[")
              .replace(/\]/g, "\\]")
              .replace(/\\\\n/g, '\n') // Restore newlines after escaping
            
            // Calculate Y position based on user selection
            let yPosition
            if (position === 'top') {
              yPosition = '120' // Near top
            } else if (position === 'center') {
              yPosition = '(h-text_h)/2'
            } else { // bottom
              yPosition = 'h-text_h-280' // Near bottom, above captions
            }
            
            // COLOR CONFIGURATION - Viral TikTok/Reels style
            const colorConfig = {
              yellow: { boxcolor: 'yellow@0.9', fontcolor: 'black' },
              red: { boxcolor: 'red@0.9', fontcolor: 'white' },
              green: { boxcolor: 'green@0.9', fontcolor: 'white' },
              blue: { boxcolor: 'blue@0.9', fontcolor: 'white' }
            }
            
            const config = colorConfig[color] || colorConfig.yellow
            
            // VIRAL STYLE: Bold colored box with high-contrast text + LINE WRAPPING
            videoFilter += `,drawtext=text='${text}':fontsize=${fontSize}:fontcolor=${config.fontcolor}:x=(w-text_w)/2:y=${yPosition}:box=1:boxcolor=${config.boxcolor}:boxborderw=18:line_spacing=8`
          }
          
          cmd.outputOptions([
              '-vf', videoFilter,
              '-t', String(durationPerClip),
              '-c:v', 'libx264',
              '-preset', 'ultrafast', // Fastest encoding for speed
              '-crf', '26', // Slightly lower quality for speed
              '-pix_fmt', 'yuv420p',
              '-threads', '0', // Use all available threads
              '-an' // Remove audio from individual clips
            ])
            .output(normalizedPath)
            .on('end', () => {
              resolve({ index: i, path: normalizedPath })
            })
            .on('error', (err) => {
              console.error(`[${jobId}] ❌ Error normalizing clip ${i}:`, err.message)
              reject(err)
            })
            .run()
        })
      })
    })
    
    // Execute all normalization tasks in parallel
    const normalizationResults = await Promise.all(normalizationTasks)
    
    // Sort by index to maintain order
    const normalizedFiles = normalizationResults
      .sort((a, b) => a.index - b.index)
      .map(r => r.path)
    
    // Step 3b: Concatenate normalized clips
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
          '-preset', 'ultrafast', // Fastest encoding
          '-crf', '26', // Slightly lower quality for speed
          '-pix_fmt', 'yuv420p',
          '-threads', '0' // Use all available threads
        ])
        .output(concatVideoPath)
        .on('end', () => {
          resolve()
        })
        .on('error', (err) => {
          console.error(`[${jobId}] Concat error:`, err.message)
          reject(err)
        })
        .on('progress', (progress) => {
          if (progress.percent) {
            // Progress logging
          }
        })
        .run()
    })

    // Step 4: Generate ASS captions file synced with actual audio duration
    const captionsPath = join(tempDir, 'captions.ass')
    const captionContent = generateASSCaptions(script, actualAudioDuration, captionStyle, targetHeight, targetWidth, captionFontSize, captionPosition)
    await writeFile(captionsPath, captionContent, 'utf8')

    // Step 5: Add background music if requested
    let finalAudioPath = audioPath
    
    if (musicTrack !== 'none') {
      // Determine music path (custom Freesound download or built-in)
      let musicPath = customMusicPath ? `/app/public${customMusicPath}` : getMusicPath(musicTrack)
      
      if (musicPath && existsSync(musicPath)) {
        // Step 6a: Trim music to match video duration (auto-cut)
        const trimmedMusicPath = join(tempDir, 'trimmed-music.mp3')
        
        await new Promise((resolve, reject) => {
          ffmpeg(musicPath)
            .setStartTime(0)
            .duration(actualAudioDuration) // Match exact audio duration
            .outputOptions([
              '-acodec', 'libmp3lame',
              '-b:a', '128k',
              '-ar', '44100'
            ])
            .output(trimmedMusicPath)
            .on('end', () => {
              resolve()
            })
            .on('error', (err) => {
              console.error(`[${jobId}] Music trim error:`, err.message)
              resolve() // Continue without music on error
            })
            .run()
        })
        
        // Step 6b: Mix trimmed music with voice
        if (existsSync(trimmedMusicPath)) {
          const mixedAudioPath = join(tempDir, 'mixed-audio.mp3')
          
          await new Promise((resolve, reject) => {
            ffmpeg()
              .input(audioPath)
              .input(trimmedMusicPath)
              .complexFilter([
                '[0:a]volume=1.0[voice]',
                `[1:a]volume=0.20,afade=t=out:st=${Math.max(actualAudioDuration - 2, 0)}:d=2[music]`,
                '[voice][music]amix=inputs=2:duration=shortest:dropout_transition=2[out]'
              ])
              .outputOptions([
                '-map', '[out]',
                '-ac', '2',
                '-ar', '44100',
                '-b:a', '128k'
              ])
              .output(mixedAudioPath)
              .on('end', () => {
                finalAudioPath = mixedAudioPath
                resolve()
              })
              .on('error', (err) => {
                console.error(`[${jobId}] Music mixing error:`, err.message)
                resolve() // Continue without music on error
              })
              .run()
          })
        }
      } else {
        }
    }

    // Step 7: Add captions to video directly (OPTIMIZED - removed redundant normalization step)
    const captionedVideoPath = join(tempDir, 'captioned.mp4')
    
    // Build caption filter based on style
    const captionFilter = buildCaptionFilter(captionStyle, captionsPath, targetHeight)
    
    await new Promise((resolve, reject) => {
      ffmpeg()
        .input(concatVideoPath)
        .outputOptions([
          '-vf', captionFilter,
          '-c:v', 'libx264',
          '-preset', 'ultrafast', // Fastest encoding
          '-crf', '26',
          '-pix_fmt', 'yuv420p',
          '-threads', '0', // Use all available threads
          '-an'
        ])
        .output(captionedVideoPath)
        .on('end', () => {
          resolve()
        })
        .on('error', (err) => {
          console.error(`[${jobId}] FFmpeg caption error:`, err.message)
          reject(err)
        })
        .on('progress', (progress) => {
          // Progress logging
        })
        .run()
    })
    
    // Step 7b: Merge captioned video with audio
    const finalVideoPath = join(tempDir, 'final.mp4')
    
    await new Promise((resolve, reject) => {
      ffmpeg()
        .input(captionedVideoPath)
        .input(finalAudioPath)
        .outputOptions([
          '-c:v', 'copy',  // Copy video stream (already encoded)
          '-c:a', 'aac',
          '-b:a', '128k',
          '-movflags', '+faststart',
          '-map', '0:v:0',
          '-map', '1:a:0',
          '-shortest'
        ])
        .output(finalVideoPath)
        .on('end', () => {
          resolve()
        })
        .on('error', (err) => {
          console.error(`[${jobId}] FFmpeg merge error:`, err.message)
          reject(err)
        })
        .run()
    })

    // Step 8: Save video to public folder
    const videoBuffer = await require('fs/promises').readFile(finalVideoPath)
    
    // Ensure public directory exists
    const publicDir = '/app/public/story-reels'
    if (!existsSync(publicDir)) {
      await mkdir(publicDir, { recursive: true })
    }
    
    // Save to public folder
    const publicVideoPath = join(publicDir, `${jobId}.mp4`)
    await writeFile(publicVideoPath, videoBuffer)
    // Generate public URL
    const videoUrl = `/story-reels/${jobId}.mp4`

    // Save captions to public folder
    let captionsUrl = null
    if (existsSync(captionsPath)) {
      const captionsPublicPath = join(publicDir, `${jobId}.srt`)
      const captionsBuffer = await require('fs/promises').readFile(captionsPath)
      await writeFile(captionsPublicPath, captionsBuffer)
      captionsUrl = `/story-reels/${jobId}.srt`
      }

    // Cleanup temp files
    try {
      for (const file of videoFiles) {
        await unlink(file).catch(() => {})
      }
      // Clean up normalized files if they exist
      if (normalizedFiles && normalizedFiles.length > 0) {
        for (const file of normalizedFiles) {
          await unlink(file).catch(() => {})
        }
      }
      await unlink(audioPath).catch(() => {})
      await unlink(concatVideoPath).catch(() => {})
      await unlink(finalVideoPath).catch(() => {})
      await unlink(captionsPath).catch(() => {})
      await unlink(clipListPath).catch(() => {})
    } catch (e) {
      }

    // Step 9: Auto-save to Library
    try {
      const libraryCollection = await getCollection('library')
      
      // Create TTL index if it doesn't exist
      try {
        await libraryCollection.createIndex(
          { expiresAt: 1 },
          { expireAfterSeconds: 0 }
        )
      } catch (indexError) {
        // Index may already exist, ignore error
      }

      // Calculate expiration: 30 days from now
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + 30)

      // Get niche display name for better UX
      const nicheDisplayName = niche === 'story-reels' ? 'Story Reel' : 
        niche.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')

      const libraryDoc = {
        id: randomUUID(),
        userId: userId, // Use actual authenticated user ID
        content: script || '',
        videoUrl,
        filePath: videoUrl, // Same as videoUrl for backwards compatibility
        fileSize: videoBuffer.length,
        script: script || '',
        type: 'story-reel',
        category: 'video',
        niche: niche, // Store the niche slug for filtering
        title: script ? `${nicheDisplayName}: ${script.substring(0, 50)}...` : `${nicheDisplayName} Video`,
        description: script ? script.substring(0, 100) + '...' : `AI-generated ${nicheDisplayName.toLowerCase()} video`,
        metadata: {
          duration,
          resolution,
          clipCount: videoFiles.length,
          voiceOption,
          captionStyle,
          niche,
          nicheDisplayName,
          jobId
        },
        createdAt: new Date(),
        expiresAt,
      }

      await libraryCollection.insertOne(libraryDoc)
    } catch (saveError) {
      console.error(`[${jobId}] Failed to auto-save to library:`, saveError)
      // Don't fail the request if library save fails
    }

    // Complete credit transaction on success
    if (transactionId) {
      await completeTransaction(transactionId)
    }

    return NextResponse.json({
      success: true,
      videoUrl,
      captionsUrl,
      jobId,
      duration,
      resolution,
      clipCount: videoFiles.length,
      videoSize: videoBuffer.length,
      message: 'Story video created successfully with Google Cloud TTS!',
      creditsUsed: creditCheck.cost,
      remainingCredits: deductResult.newBalance
    })

  } catch (error) {
    console.error(`[${jobId}] Composition error:`, error)
    
    // Refund credits on failure
    if (transactionId) {
      await refundCredits(transactionId, error.message || 'Video composition failed')
    }
    
    // Cleanup on error
    try {
      await require('fs/promises').rm(tempDir, { recursive: true, force: true })
    } catch (e) {
      }

    return NextResponse.json(
      { success: false, error: error.message || 'Failed to compose video' },
      { status: 500 }
    )
  }
}

// Helper function to generate ASS captions with Bengali support
function generateASSCaptions(script, duration, captionStyle, targetHeight, targetWidth, fontSizeOption = 'medium', positionOption = 'bottom') {
  // Ensure height and width are numbers for comparison
  const height = parseInt(targetHeight) || 1920
  const width = parseInt(targetWidth) || 1080
  
  // Better word splitting for Bengali - split on spaces but preserve Unicode characters
  const words = script.trim().split(/\s+/).filter(w => w.length > 0)
  
  // Calculate total characters for better sync (Bengali characters take longer to read)
  const totalChars = script.replace(/\s+/g, '').length
  const avgCharsPerWord = totalChars / words.length
  
  // For Bengali, use character-based timing instead of word-based
  // Average reading speed for Bengali: ~10-12 characters per second for narration
  const charsPerSecond = totalChars / duration
  
  // Base font size - SIGNIFICANTLY INCREASED for portrait videos
  // Portrait 1080x1920 needs much larger fonts than landscape
  const baseFontSize = height >= 2160 ? 72 : height >= 1920 ? 64 : height >= 1440 ? 56 : height >= 1280 ? 48 : 40
  
  // Adjust font size based on user preference - more aggressive multipliers
  let fontSizeMultiplier = 1
  switch (fontSizeOption) {
    case 'small':
      fontSizeMultiplier = 0.85
      break
    case 'medium':
      fontSizeMultiplier = 1.0  // Base is already larger
      break
    case 'large':
      fontSizeMultiplier = 1.3
      break
    case 'extra-large':
      fontSizeMultiplier = 1.6
      break
  }
  
  let fontSize = Math.round(baseFontSize * fontSizeMultiplier)
  
  // Margin (vertical position) based on user preference
  let marginV
  switch (positionOption) {
    case 'top':
      marginV = 50  // High position
      break
    case 'center':
      marginV = Math.round(height / 2)  // Middle of screen
      break
    case 'bottom':
    default:
      marginV = height >= 2160 ? 150 : height >= 1920 ? 120 : height >= 1440 ? 120 : height >= 1280 ? 90 : 80
      break
  }
  
  // Style based on caption style - ALL STYLES NOW MORE PROMINENT
  let primaryColor = '&H00FFFFFF' // White (default)
  let outlineColor = '&H00000000' // Black
  let outline = 4 // Increased default outline
  let shadow = 2 // Increased default shadow
  let bold = -1 // -1 = bold
  // Use Siyam Rupali for best Bengali rendering - well-tested with complex conjuncts
  // Font name must match exactly as registered in the system
  let fontName = 'Siyam Rupali'
  let alignment = 2 // 2 = bottom center, 5 = middle center, 8 = top center
  
  switch (captionStyle) {
    case 'karaoke':
      primaryColor = '&H0000FFFF' // Yellow
      outlineColor = '&H00000000' // Black outline
      outline = 5 // Increased
      shadow = 2
      bold = -1
      alignment = 2 // Bottom
      break
    case 'animated':
      primaryColor = '&H00FFFFFF' // White
      outlineColor = '&H00000000' // Black outline
      outline = 4 // Increased
      shadow = 4 // Increased
      bold = -1
      alignment = 2 // Bottom
      break
    case 'neon-glow':
      primaryColor = '&H00FFFFFF' // Pure white text (ASS format: &H00BBGGRR)
      outlineColor = '&H00FF00FF' // Bright magenta outline (BGR format)
      outline = 10 // Extra thick outline for intense glow
      shadow = 15 // Very large shadow for maximum glow effect
      bold = -1
      alignment = 2 // Bottom
      break
    case 'yellow-highlight':
      primaryColor = '&H00000000' // Black text
      outlineColor = '&H0000FFFF' // Yellow outline/background
      outline = 12 // Very thick outline for highlight effect
      shadow = 0
      bold = -1
      alignment = 2 // Bottom
      break
    case 'zoomed-in':
      primaryColor = '&H00FFFFFF' // White
      outlineColor = '&H00000000' // Black outline
      outline = 6 // Increased
      shadow = 3
      bold = -1
      fontSize = Math.floor(fontSize * 1.5) // 50% larger
      alignment = 5 // Center of screen
      break
    case 'gradient-pop':
      primaryColor = '&H00FFD700' // Gold
      outlineColor = '&H00FF1493' // Deep pink outline
      outline = 5 // Increased
      shadow = 5 // Increased
      bold = -1
      alignment = 2 // Bottom
      break
    case 'minimal-clean':
      primaryColor = '&H00FFFFFF' // White
      outlineColor = '&H00000000' // Black outline
      outline = 2 // Slightly increased
      shadow = 1
      bold = 0 // Not bold
      alignment = 8 // Top
      break
    case 'tiktok-style':
      primaryColor = '&H00FFFFFF' // White
      outlineColor = '&H000000FF' // Red outline (TikTok vibe)
      outline = 5 // Increased
      shadow = 3
      bold = -1
      alignment = 2 // Bottom
      break
    case 'bold-outline':
    default:
      primaryColor = '&H00FFFFFF' // White
      outlineColor = '&H00000000' // Black
      outline = 5 // Increased default
      shadow = 3 // Increased default
      bold = -1
      alignment = 2 // Bottom
  }
  
  // ASS Header with UTF-8 support for Bengali
  let ass = String.fromCharCode(0xFEFF) + `[Script Info]
Title: Story Reels Captions
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

  // For karaoke: word-by-word, for others: 3-4 words per caption
  // Use character count to determine timing for better Bengali sync
  const wordsPerCaption = captionStyle === 'karaoke' ? 1 : 3
  let currentTime = 0
  
  for (let i = 0; i < words.length; i += wordsPerCaption) {
    const chunk = words.slice(i, i + wordsPerCaption).join(' ')
    const chunkChars = chunk.replace(/\s+/g, '').length
    
    // Calculate duration based on character count (more accurate for Bengali)
    // Add a small buffer for natural reading pace
    const chunkDuration = (chunkChars / charsPerSecond) * 1.05 // 5% buffer for natural pace
    
    const startTime = currentTime
    const endTime = Math.min(currentTime + chunkDuration, duration) // Don't exceed total duration
    
    ass += `Dialogue: 0,${formatASSTime(startTime)},${formatASSTime(endTime)},Default,,0,0,0,,${chunk}\n`
    
    currentTime = endTime
  }
  
  return ass
}

// Helper function to format time in ASS format (0:00:00.00)
function formatASSTime(seconds) {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)
  const centisecs = Math.floor((seconds % 1) * 100)

  return `${hours}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${String(centisecs).padStart(2, '0')}`
}

// Helper function to build caption filter for ASS format
function buildCaptionFilter(captionStyle, captionsPath, targetHeight) {
  // Escape path for ffmpeg - need proper escaping for the filter
  const escapedPath = captionsPath
    .replace(/\\/g, '/')
    .replace(/:/g, '\\:')
  
  // Use ass filter with fontsdir pointing to our custom fonts
  // The ass filter properly handles complex scripts like Bengali
  return `ass='${escapedPath}':fontsdir=/app/fonts`
}

// Helper function to get music file path based on track selection
function getMusicPath(musicTrack) {
  const musicDir = '/app/public/music'
  
  const musicMap = {
    'upbeat': join(musicDir, 'upbeat.mp3'),
    'calm': join(musicDir, 'calm.mp3'),
    'epic': join(musicDir, 'epic.mp3'),
    'emotional': join(musicDir, 'emotional.mp3')
  }
  
  return musicMap[musicTrack] || null
}
