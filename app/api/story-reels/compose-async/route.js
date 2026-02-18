import { NextResponse } from 'next/server'
import { writeFile, unlink, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import { join } from 'path'
import { randomUUID } from 'crypto'
import ffmpeg from 'fluent-ffmpeg'
import textToSpeech from '@google-cloud/text-to-speech'
import { getCollection } from '@/lib/mongodb'
import { getUserIdFromRequest, checkCredits, deductCredits, completeTransaction, refundCredits } from '@/lib/credits'
import { 
  generateConsistentVideoClips, 
  isFalConfigured,
  getFallbackStockVideos,
  generateScenePromptsWithConsistency 
} from '@/lib/services'

// Set ffmpeg path
ffmpeg.setFfmpegPath('/usr/bin/ffmpeg')
ffmpeg.setFfprobePath('/usr/bin/ffprobe')

export const maxDuration = 60 // Quick response - actual work happens in background
export const dynamic = 'force-dynamic'

// AI Video Generation Tiers - Now using Kling via Fal.ai as primary
const AI_VIDEO_TIERS = {
  essential: {
    name: 'Essential',
    description: 'Basic AI video, no consistency',
    consistencyMode: 'none',
    creditCost: 50
  },
  standard: {
    name: 'Standard',
    description: 'Good quality with seed-based consistency',
    consistencyMode: 'seed',
    creditCost: 70
  },
  professional: {
    name: 'Professional',
    description: 'High quality with frame-chain consistency',
    consistencyMode: 'frame-chain',
    creditCost: 100
  },
  cinema: {
    name: 'Cinema',
    description: 'Best quality with advanced frame-chain',
    consistencyMode: 'frame-chain',
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
      videoOrientation, customMusicPath, niche, videoSource,
      consistencyMode: userConsistencyMode // User's selected consistency mode
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
      progressMessage: `Generating ${numClips} AI video clips with Kling...`,
      totalClips: numClips
    })
    
    // Get tier configuration
    const tierConfig = AI_VIDEO_TIERS[aiTier] || AI_VIDEO_TIERS.standard
    // Use user's selected consistency mode if provided, otherwise use tier default
    const consistencyMode = userConsistencyMode || tierConfig.consistencyMode || 'none'
    
    console.log(`[${jobId}] Using consistency mode: ${consistencyMode} (user: ${userConsistencyMode}, tier default: ${tierConfig.consistencyMode})`)
    
    // Determine aspect ratio from orientation
    let aspectRatio = '9:16' // Portrait default
    if (videoOrientation === 'landscape') {
      aspectRatio = '16:9'
    } else if (videoOrientation === 'square') {
      aspectRatio = '1:1'
    }
    
    // Generate AI video clips using Kling with character consistency
    let aiVideos = []
    if (isAIMode) {
      // Check Fal.ai (Kling) availability
      if (!isFalConfigured()) {
        console.error(`[${jobId}] ❌ FAL_KEY not configured`)
        throw new Error('AI video service not configured')
      }
      
      try {
        console.log(`[${jobId}] 🎬 Starting Kling video generation (${consistencyMode} consistency)...`)
        
        // Use the centralized Kling service with consistency
        const result = await generateConsistentVideoClips({
          script,
          duration: parseInt(duration),
          aspectRatio,
          consistencyMode,
          characterDescription: null, // Will be extracted from script
          jobId,
          onProgress: async (progress) => {
            await updateJobStatus(jobId, {
              progress: 10 + Math.floor((progress.clipIndex / progress.totalClips) * 50),
              progressMessage: progress.message,
              clipsGenerated: progress.clipIndex
            })
          }
        })
        
        aiVideos = result.clips.map((clip, i) => ({
          url: clip.url,
          keyword: `ai-scene-${i + 1}`,
          type: 'ai-generated',
          model: 'Kling',
          frameChained: clip.frameChained
        }))
        
        console.log(`[${jobId}] ✅ Generated ${aiVideos.length} clips with ${consistencyMode} consistency`)
        
      } catch (klingError) {
        console.error(`[${jobId}] ⚠️ Kling generation failed:`, klingError.message)
        
        // Fallback to stock videos
        console.log(`[${jobId}] Falling back to stock videos...`)
        const keywords = extractKeywordsFromScript(script)
        const stockResults = await getFallbackStockVideos(keywords, numClips, videoOrientation)
        
        if (stockResults.length > 0) {
          aiVideos = stockResults
        } else {
          throw new Error('AI generation failed and no stock videos available')
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
    
    // Clean script for TTS - remove screenplay formatting
    const cleanScriptForTTS = (rawScript) => {
      let cleaned = rawScript
      
      // Remove screenplay scene headings: INT./EXT., DAY/NIGHT, etc.
      cleaned = cleaned.replace(/^(INT\.|EXT\.|INT\/EXT\.|I\/E\.)[^\n]*$/gim, '')
      
      // Remove FADE IN/OUT, CUT TO, DISSOLVE TO, etc.
      cleaned = cleaned.replace(/^(FADE IN:|FADE OUT:|FADE TO:|CUT TO:|DISSOLVE TO:|SMASH CUT:|MATCH CUT:|JUMP CUT:|INTERCUT:|CONTINUOUS:)[^\n]*$/gim, '')
      
      // Remove TITLE CARD lines
      cleaned = cleaned.replace(/^TITLE CARD:[^\n]*$/gim, '')
      
      // Remove character names in all caps before dialogue (e.g., "JOHN:")
      cleaned = cleaned.replace(/^[A-Z][A-Z\s\-']+(\s*\([^)]*\))?:\s*/gm, '')
      
      // Remove parenthetical directions like (softly), (V.O.), (O.S.), (CONT'D)
      cleaned = cleaned.replace(/\([^)]*\)/g, '')
      
      // Remove action/description blocks in brackets or with scene numbers
      cleaned = cleaned.replace(/^\[.*\]$/gm, '')
      cleaned = cleaned.replace(/^Scene \d+:?.*$/gim, '')
      
      // Remove camera directions
      cleaned = cleaned.replace(/^(CLOSE ON|ANGLE ON|POV|WIDE SHOT|MEDIUM SHOT|CLOSE-UP|TWO SHOT|INSERT|BACK TO)[:\s][^\n]*$/gim, '')
      
      // Remove time indicators like "-- DAY", "-- NIGHT", "-- DAWN"
      cleaned = cleaned.replace(/\s*--\s*(DAY|NIGHT|DAWN|DUSK|MORNING|EVENING|LATER|CONTINUOUS|SAME)[^\n]*/gi, '')
      
      // Clean up multiple newlines and whitespace
      cleaned = cleaned.replace(/\n{3,}/g, '\n\n')
      cleaned = cleaned.replace(/^\s+|\s+$/gm, '')
      
      // Remove empty lines
      cleaned = cleaned.split('\n').filter(line => line.trim().length > 0).join(' ')
      
      // Clean up multiple spaces
      cleaned = cleaned.replace(/\s{2,}/g, ' ').trim()
      
      return cleaned
    }
    
    const ttsScript = cleanScriptForTTS(script)
    console.log(`[${jobId}] TTS Script (cleaned): ${ttsScript.substring(0, 200)}...`)
    
    // Generate TTS audio (or skip if voiceOption is 'none')
    let audioPath = join(tempDir, 'voice.mp3')
    let hasAudio = true
    
    if (voiceOption === 'none') {
      // No audio - create silent audio track matching video duration
      hasAudio = false
      console.log(`[${jobId}] No audio mode - will create silent video`)
    } else if (voiceOption === 'tts') {
      const client = new textToSpeech.TextToSpeechClient({
        keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS
      })
      
      let languageCode = ttsLanguage === 'bn' ? 'bn-IN' : 'en-US'
      if (selectedVoice && selectedVoice.includes('-')) {
        const parts = selectedVoice.split('-')
        if (parts.length >= 2) languageCode = `${parts[0]}-${parts[1]}`
      }
      
      const [response] = await client.synthesizeSpeech({
        input: { text: ttsScript }, // Use cleaned script
        voice: { languageCode, name: selectedVoice || undefined },
        audioConfig: { audioEncoding: 'MP3', speakingRate: 1.0 }
      })
      
      await writeFile(audioPath, response.audioContent, 'binary')
    } else if (voiceFile) {
      await writeFile(audioPath, voiceFile)
    }
    
    // Get audio duration (or use video duration for no-audio mode)
    let actualAudioDuration
    if (hasAudio) {
      actualAudioDuration = await new Promise((resolve) => {
        ffmpeg.ffprobe(audioPath, (err, metadata) => {
          resolve(err ? duration : metadata.format.duration)
        })
      })
    } else {
      actualAudioDuration = duration // Use requested duration for no-audio mode
    }
    
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
    
    // Generate captions - use the cleaned TTS script to remove screenplay formatting
    const captionsPath = join(tempDir, 'captions.ass')
    const captionContent = generateASSCaptions(ttsScript, actualAudioDuration, captionStyle, targetHeight, targetWidth, captionFontSize, captionPosition)
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

// Extract keywords from script for fallback stock video search
function extractKeywordsFromScript(script) {
  // Simple keyword extraction from script
  const stopWords = ['the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'shall', 'can', 'need', 'dare', 'ought', 'used', 'to', 'of', 'in', 'for', 'on', 'with', 'at', 'by', 'from', 'as', 'into', 'through', 'during', 'before', 'after', 'above', 'below', 'between', 'under', 'again', 'further', 'then', 'once', 'here', 'there', 'when', 'where', 'why', 'how', 'all', 'each', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very', 'just', 'and', 'but', 'if', 'or', 'because', 'until', 'while', 'although', 'though', 'after', 'before', 'i', 'me', 'my', 'myself', 'we', 'our', 'ours', 'ourselves', 'you', 'your', 'yours', 'yourself', 'yourselves', 'he', 'him', 'his', 'himself', 'she', 'her', 'hers', 'herself', 'it', 'its', 'itself', 'they', 'them', 'their', 'theirs', 'themselves', 'what', 'which', 'who', 'whom', 'this', 'that', 'these', 'those', 'am']
  
  const words = script.toLowerCase()
    .replace(/[^a-z\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 3 && !stopWords.includes(w))
  
  // Count word frequency
  const freq = {}
  words.forEach(w => { freq[w] = (freq[w] || 0) + 1 })
  
  // Get top keywords
  return Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([word]) => word)
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
      videoSource,
      consistencyMode: formData.get('consistencyMode') || 'none' // User's selected character consistency mode
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
