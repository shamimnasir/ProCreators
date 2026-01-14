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

// ==================== DIALOGUE EXTRACTION ====================
// Extracts only dialogue (quoted text) from a script for TTS
// This reduces TTS cost by ~70% and creates more natural narration

// ==================== SMART DIALOGUE EXTRACTION ====================
// Extracts dialogue from scripts using multiple detection methods
// Supports: English, Bengali, Hindi quotes and dialogue indicators

function extractDialogueFromScript(script, language = 'en') {
  if (!script || typeof script !== 'string') {
    return { dialogueOnly: '', fullScript: script || '', dialogueCount: 0, costSavings: 0 }
  }
  
  const dialogues = []
  
  // Method 1: Match text inside various quote types
  // Supports multiple quote styles used across languages
  const quotePatterns = [
    /"([^"]+)"/g,           // Straight double quotes "text"
    /"([^"]+)"/g,           // Curly double quotes "text"
    /'([^']+)'/g,           // Curly single quotes 'text'
    /'([^']+)'/g,           // Straight single quotes 'text'
    /「([^」]+)」/g,         // Japanese/Chinese quotes
    /«([^»]+)»/g,           // French/Russian quotes
    /„([^"]+)"/g,           // German quotes
    /『([^』]+)』/g,         // Japanese double quotes
    /\u201C([^\u201D]+)\u201D/g,  // Unicode left/right double quotes
  ]
  
  for (const pattern of quotePatterns) {
    let match
    // Reset regex lastIndex for each pattern
    pattern.lastIndex = 0
    while ((match = pattern.exec(script)) !== null) {
      const dialogue = match[1]
      if (dialogue && dialogue.trim() && dialogue.trim().length > 2) {
        // If language is Bengali/Hindi, prioritize text containing those scripts
        if (language === 'bn' || language === 'hi') {
          // Check if text contains Bengali/Devanagari characters
          const hasBengali = /[\u0980-\u09FF]/.test(dialogue)
          const hasDevanagari = /[\u0900-\u097F]/.test(dialogue)
          
          if (hasBengali || hasDevanagari) {
            dialogues.push(dialogue.trim())
            console.log(`[Dialogue] Found ${language} dialogue: "${dialogue.substring(0, 50)}..."`)
          }
        } else {
          dialogues.push(dialogue.trim())
        }
      }
    }
  }
  
  // Method 2: If no quotes found OR language-specific extraction needed, 
  // try dialogue indicators
  if (dialogues.length === 0 || (language !== 'en' && dialogues.length === 0)) {
    // Bengali dialogue indicators - common verbs meaning "said/told/shouted"
    if (language === 'bn') {
      const bengaliIndicators = /(?:বললো|বলল|বলে|বললেন|বলেছিল|বলেছে|চিৎকার করল|চিৎকার করে|জিজ্ঞেস করল|জিজ্ঞেস করে|উত্তর দিল|উত্তর দিয়ে|ডাকল|ডেকে)[,:\s—–-]+["'"']?([^।.!?]+[।.!?]?)/gi
      let match
      bengaliIndicators.lastIndex = 0
      while ((match = bengaliIndicators.exec(script)) !== null) {
        const dialogue = match[1]
        if (dialogue && dialogue.trim() && dialogue.trim().length > 3) {
          dialogues.push(dialogue.trim())
        }
      }
    }
    
    // Hindi dialogue indicators
    if (language === 'hi') {
      const hindiIndicators = /(?:बोला|बोली|कहा|कही|चिल्लाया|पूछा|जवाब दिया|बताया)[,:\s]+["'"']?([^।.!?]+[।.!?]?)/gi
      let match
      hindiIndicators.lastIndex = 0
      while ((match = hindiIndicators.exec(script)) !== null) {
        const dialogue = match[1]
        if (dialogue && dialogue.trim() && dialogue.trim().length > 3) {
          dialogues.push(dialogue.trim())
        }
      }
    }
    
    // English dialogue indicators
    if (language === 'en' && dialogues.length === 0) {
      const englishIndicators = /(?:said|says|shouted|whispered|asked|replied|exclaimed|muttered|yelled|screamed|spoke|cried|answered|told)[,:\s]+["'"']?([^.!?"']+[.!?]?)/gi
      let match
      englishIndicators.lastIndex = 0
      while ((match = englishIndicators.exec(script)) !== null) {
        const dialogue = match[1]
        if (dialogue && dialogue.trim() && dialogue.trim().length > 3) {
          dialogues.push(dialogue.trim())
        }
      }
    }
  }
  
  // If still no dialogues and language is Bengali/Hindi, 
  // extract ALL text in that script (Bengali/Devanagari characters)
  if (dialogues.length === 0 && (language === 'bn' || language === 'hi')) {
    console.log(`[Dialogue] No quoted dialogues found, extracting all ${language} text...`)
    
    // Extract sentences containing Bengali/Hindi script
    const sentences = script.split(/[.!?।]+/)
    for (const sentence of sentences) {
      const trimmed = sentence.trim()
      const hasBengali = /[\u0980-\u09FF]/.test(trimmed)
      const hasDevanagari = /[\u0900-\u097F]/.test(trimmed)
      
      if ((language === 'bn' && hasBengali) || (language === 'hi' && hasDevanagari)) {
        if (trimmed.length > 5) {
          dialogues.push(trimmed)
        }
      }
    }
  }
  
  // Remove duplicates and join with natural pauses
  const uniqueDialogues = [...new Set(dialogues)]
  const dialogueOnly = uniqueDialogues.join('. ')
  
  const costSavings = dialogueOnly.length > 0 
    ? Math.round((1 - dialogueOnly.length / script.length) * 100) 
    : 0
  
  console.log(`[Smart Dialogue Extraction] Language: ${language}, Full: ${script.length} chars → Dialogue: ${dialogueOnly.length} chars (${costSavings}% savings, ${uniqueDialogues.length} dialogues found)`)
  
  return {
    dialogueOnly,
    fullScript: script,
    dialogueCount: uniqueDialogues.length,
    costSavings,
    method: dialogues.length > 0 ? 'quotes' : uniqueDialogues.length > 0 ? 'script-based' : 'none'
  }
}

// ==================== ASS CAPTION GENERATION ====================
// Generates ASS subtitle files for video captions (reused from Quick Reels Hub)

function generateASSCaptions(script, duration, captionStyle, targetHeight, targetWidth) {
  const height = parseInt(targetHeight) || 1920
  const width = parseInt(targetWidth) || 1080
  
  // Split on spaces - handles both English and Bengali
  const words = script.trim().split(/\s+/).filter(w => w.length > 0)
  const totalChars = script.replace(/\s+/g, '').length
  const charsPerSecond = totalChars / duration
  
  console.log(`[Captions] Words: ${words.length}, Chars: ${totalChars}, Duration: ${duration}s`)
  
  // Base font size for portrait videos
  const baseFontSize = height >= 2160 ? 72 : height >= 1920 ? 64 : height >= 1440 ? 56 : 48
  let fontSize = baseFontSize
  
  // Margin (vertical position)
  let marginV = height >= 2160 ? 150 : height >= 1920 ? 120 : 90
  
  // Style settings based on caption style
  let primaryColor = '&H00FFFFFF' // White
  let outlineColor = '&H00000000' // Black
  let outline = 4
  let shadow = 2
  let bold = -1
  let fontName = 'Siyam Rupali' // Good for Bengali
  let alignment = 2 // Bottom center
  
  switch (captionStyle) {
    case 'karaoke':
      primaryColor = '&H0000FFFF' // Yellow
      outline = 5
      break
    case 'neon-glow':
      primaryColor = '&H00FFFFFF'
      outlineColor = '&H00FF00FF' // Magenta
      outline = 10
      shadow = 15
      break
    case 'yellow-highlight':
      primaryColor = '&H00000000' // Black text
      outlineColor = '&H0000FFFF' // Yellow background
      outline = 12
      shadow = 0
      break
    case 'tiktok-style':
      primaryColor = '&H00FFFFFF'
      outlineColor = '&H000000FF' // Red
      outline = 5
      shadow = 3
      break
    case 'minimal-clean':
      primaryColor = '&H00FFFFFF'
      outline = 2
      shadow = 1
      bold = 0
      alignment = 8 // Top
      break
    case 'zoomed-in':
      fontSize = Math.floor(fontSize * 1.5)
      outline = 6
      shadow = 3
      alignment = 5 // Center
      break
    case 'bold-outline':
    default:
      outline = 5
      shadow = 3
  }
  
  // ASS Header with UTF-8 BOM
  let ass = `\ufeff[Script Info]
Title: AI Video Studio Captions
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

  // Generate dialogue lines (3 words per caption, or 1 for karaoke)
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

// Format time for ASS subtitles
function formatASSTime(seconds) {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)
  const centisecs = Math.floor((seconds % 1) * 100)
  return `${hours}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${String(centisecs).padStart(2, '0')}`
}

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
  narrationMode, // 'full' or 'dialogue-only' (default: dialogue-only)
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
        // Extract URL from video object - handle different formats
        let videoUrl = null
        if (typeof video === 'string') {
          videoUrl = video
        } else if (video && typeof video.url === 'string') {
          videoUrl = video.url
        } else if (video && video.url && typeof video.url.url === 'string') {
          // Nested URL object
          videoUrl = video.url.url
        } else if (video && video.video && typeof video.video.url === 'string') {
          // Fal.ai format: { video: { url: '...' } }
          videoUrl = video.video.url
        }
        
        if (!videoUrl) {
          console.error(`[${jobId}] ❌ No valid URL found for clip ${index}:`, JSON.stringify(video).substring(0, 200))
          return { index, path: null, success: false }
        }
        
        console.log(`[${jobId}] Downloading clip ${index + 1}: ${videoUrl.substring(0, 60)}...`)
        
        if (videoUrl.startsWith('/')) {
          // Local file - copy it
          const localPath = join(process.cwd(), 'public', videoUrl)
          const fs = require('fs')
          if (fs.existsSync(localPath)) {
            const buffer = fs.readFileSync(localPath)
            await writeFile(videoPath, buffer)
            console.log(`[${jobId}] ✅ Copied local clip ${index + 1}/${videos.length}`)
            return { index, path: videoPath, success: true }
          }
        } else {
          // Download from URL
          const response = await fetch(videoUrl)
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
    let spokenText = prompt // Track what text is actually spoken for caption sync
    
    if (voiceOption === 'tts' && prompt && prompt.trim()) {
      // Generate TTS with Google Cloud
      console.log(`[${jobId}] Generating TTS with Google Cloud...`)
      
      // Extract dialogue if narration mode is 'dialogue-only' (default)
      let ttsText = prompt
      if (narrationMode !== 'full') {
        const extracted = extractDialogueFromScript(prompt, ttsLanguage)
        if (extracted.dialogueOnly && extracted.dialogueOnly.length > 0) {
          ttsText = extracted.dialogueOnly
          spokenText = extracted.dialogueOnly // Captions should match spoken text
          console.log(`[${jobId}] 🎭 Dialogue-only mode: ${extracted.dialogueCount} dialogues, ~${extracted.costSavings}% cost savings`)
          console.log(`[${jobId}] 🗣️ Will speak: "${ttsText.substring(0, 100)}..."`)
        } else {
          console.log(`[${jobId}] ⚠️ No dialogue found in script, using full text`)
        }
      } else {
        console.log(`[${jobId}] 📜 Full narration mode: using entire script`)
      }
      
      try {
        const client = new textToSpeech.TextToSpeechClient({
          keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS
        })
        
        // Set language code based on ttsLanguage selection - DON'T override with selectedVoice
        let languageCode = 'en-US'
        switch (ttsLanguage) {
          case 'bn': languageCode = 'bn-IN'; break
          case 'hi': languageCode = 'hi-IN'; break
          case 'es': languageCode = 'es-ES'; break
          case 'fr': languageCode = 'fr-FR'; break
          case 'de': languageCode = 'de-DE'; break
          case 'ja': languageCode = 'ja-JP'; break
          case 'ko': languageCode = 'ko-KR'; break
          case 'zh': languageCode = 'cmn-CN'; break
          case 'ar': languageCode = 'ar-XA'; break
          default: languageCode = 'en-US'
        }
        
        console.log(`[${jobId}] 🌐 TTS Language selection: ${ttsLanguage}`)
        
        // Build voice config - CRITICAL: Extract language code FROM the voice name
        // Google TTS requires the languageCode to MATCH the voice's language
        // Voice format is: {lang}-{region}-{modelName}, e.g., "en-AU-Chirp3-HD-Achernar"
        const voiceConfig = { languageCode }
        
        if (selectedVoice && selectedVoice.includes('-')) {
          // Extract language code from voice name (first 2 parts: en-AU, en-US, bn-IN, etc.)
          const voiceParts = selectedVoice.split('-')
          if (voiceParts.length >= 2) {
            const voiceLanguageCode = `${voiceParts[0]}-${voiceParts[1]}`.toLowerCase()
            // Use the voice's actual language code to avoid mismatch errors
            voiceConfig.languageCode = voiceLanguageCode
            voiceConfig.name = selectedVoice
            console.log(`[${jobId}] 🎤 Using voice: ${selectedVoice} (language: ${voiceLanguageCode})`)
          }
        } else {
          // No specific voice selected - use default for the language
          console.log(`[${jobId}] 🎤 Using default ${languageCode} voice`)
        }
        
        const ttsRequest = {
          input: { text: ttsText },  // Use extracted dialogue or full text
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
      const videoMeta = videos[i] || {} // Get video metadata (type, keyword, etc.)
      
      await new Promise((resolve, reject) => {
        const cmd = ffmpeg(videoFile)
        
        // Apply 3-second trim ONLY for stock videos (skip watermarks/intros)
        if (videoMeta.type === 'stock') {
          cmd.inputOptions(['-ss', '3']) // Skip first 3 seconds
          console.log(`[${jobId}] 📹 Trimming first 3s from stock clip ${i + 1} (keyword: ${videoMeta.keyword || 'unknown'})`)
        } else {
          console.log(`[${jobId}] 🎨 Processing AI clip ${i + 1} (no trim)`)
        }
        
        // Build basic video filter string
        let videoFilter = `scale=${targetWidth}:${targetHeight}:force_original_aspect_ratio=increase,crop=${targetWidth}:${targetHeight},fps=30`
        
        // Add text overlay from prompt (positioned at bottom)
        // For now, skip text overlay to get basic compilation working
        // Text overlays will be handled in a later step using ASS subtitles (like story-reels)
        
        cmd.outputOptions([
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
    const videoWithAudioPath = join(tempDir, 'with-audio.mp4')
    
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
          .output(videoWithAudioPath)
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
      fs.copyFileSync(concatVideoPath, videoWithAudioPath)
      console.log(`[${jobId}] Video saved without audio`)
    }
    
    // Step 6: Add captions if caption style is not 'none'
    // IMPORTANT: Captions should match what's actually being spoken (spokenText)
    console.log(`[${jobId}] Step 6: Processing captions...`)
    const finalVideoPath = join(tempDir, 'final.mp4')
    
    // Only add captions if we have audio (captions should sync with spoken audio)
    const shouldAddCaptions = captionStyle && captionStyle !== 'none' && hasAudio && spokenText && spokenText.trim()
    
    if (shouldAddCaptions) {
      try {
        // Generate ASS captions from the SPOKEN text (not full script)
        // This ensures captions are synced with what's actually being said
        const captionContent = generateASSCaptions(
          spokenText,  // Use spoken text, not full prompt
          actualDuration, 
          captionStyle, 
          dimensions.height, 
          dimensions.width
        )
        
        const captionsPath = join(tempDir, 'captions.ass')
        await writeFile(captionsPath, captionContent)
        console.log(`[${jobId}] ✅ ASS captions generated (synced with ${spokenText.length} chars of spoken text)`)
        
        // Burn captions into video
        const escapedPath = captionsPath.replace(/\\/g, '/').replace(/:/g, '\\:')
        
        await new Promise((resolve, reject) => {
          ffmpeg(videoWithAudioPath)
            .outputOptions([
              '-vf', `ass='${escapedPath}':fontsdir=/app/fonts`,
              '-c:v', 'libx264',
              '-preset', 'fast',
              '-crf', '23',
              '-c:a', 'copy',
              '-movflags', '+faststart'
            ])
            .output(finalVideoPath)
            .on('end', () => {
              console.log(`[${jobId}] ✅ Captions burned into video`)
              resolve()
            })
            .on('error', (err) => {
              console.error(`[${jobId}] ⚠️ Caption burn failed:`, err.message)
              // Fallback: just copy the video without captions
              require('fs').copyFileSync(videoWithAudioPath, finalVideoPath)
              resolve()
            })
            .run()
        })
      } catch (captionError) {
        console.error(`[${jobId}] ⚠️ Caption generation failed:`, captionError.message)
        // Fallback: just copy the video without captions
        require('fs').copyFileSync(videoWithAudioPath, finalVideoPath)
      }
    } else {
      // No captions - just copy the video
      require('fs').copyFileSync(videoWithAudioPath, finalVideoPath)
      console.log(`[${jobId}] Skipping captions (style: ${captionStyle}, hasAudio: ${hasAudio})`)
    }
    
    // Step 7: Save to public folder
    console.log(`[${jobId}] Step 7: Saving video...`)
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

// AI Video Generation Models - Updated June 2025
// Pricing from fal.ai/pricing - Ordered by cost (cheapest first)
const AI_VIDEO_MODELS = {
  // TIER 1: Budget-Friendly (~$0.04/video)
  'pixverse': {
    name: 'Pixverse v5.5',
    endpoint: 'fal-ai/pixverse/v5.5/text-to-video',
    costPerVideo: 0.04,
    costPerSecond: 0.008,
    description: 'Budget-friendly creative videos',
    maxDuration: 5,
    tier: 'budget'
  },
  'longcat': {
    name: 'LongCat Distilled',
    endpoint: 'fal-ai/longcat-video/distilled/text-to-video/720p',
    costPerVideo: 0.05,
    costPerSecond: 0.01,
    description: 'Fast long-form video generation',
    maxDuration: 10,
    tier: 'budget'
  },
  
  // TIER 2: Value (~$0.05/s)
  'wan': {
    name: 'Wan 2.5',
    endpoint: 'fal-ai/wan/v2.2-a14b/text-to-video',
    costPerSecond: 0.05,
    description: 'Reliable high-quality video',
    maxDuration: 5,
    tier: 'value'
  },
  'hunyuan': {
    name: 'Hunyuan 1.5',
    endpoint: 'fal-ai/hunyuan-video-v1.5/text-to-video',
    costPerSecond: 0.05,
    description: 'Tencent\'s best video model',
    maxDuration: 5,
    tier: 'value'
  },
  'sana': {
    name: 'Sana Video',
    endpoint: 'fal-ai/sana-video',
    costPerSecond: 0.05,
    description: 'Ultra-fast video generation',
    maxDuration: 5,
    tier: 'value'
  },
  
  // TIER 3: Premium (~$0.07-0.08/s)
  'kling-turbo': {
    name: 'Kling 2.5 Turbo Pro',
    endpoint: 'fal-ai/kling-video/v2.5-turbo/pro/text-to-video',
    costPerSecond: 0.07,
    description: 'Cinematic quality, fluid motion',
    maxDuration: 10,
    tier: 'premium'
  },
  'kling-26': {
    name: 'Kling 2.6 Pro',
    endpoint: 'fal-ai/kling-video/v2.6/pro/text-to-video',
    costPerSecond: 0.08,
    description: 'Latest Kling with audio generation',
    maxDuration: 10,
    tier: 'premium'
  },
  
  // TIER 4: Ultra (~$0.20+/s - highest quality)
  'veo': {
    name: 'Veo 3.1 Fast',
    endpoint: 'fal-ai/veo3.1/fast',
    costPerSecond: 0.20,
    description: 'Google DeepMind\'s best video AI',
    maxDuration: 8,
    tier: 'ultra'
  }
}

// Provider configurations
const PROVIDERS = {
  fal: {
    name: 'Fal.ai',
    description: 'AI video generation with Pixverse, Wan, Hunyuan, Kling, Veo models'
  },
  replicate: {
    name: 'Replicate',
    description: 'Fallback AI video generation'
  }
}

// Extract keywords from script for stock video search
function extractKeywordsFromScript(script, count = 5) {
  if (!script) return ['nature', 'people', 'lifestyle']
  
  // Common stop words to ignore
  const stopWords = new Set([
    'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
    'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
    'should', 'may', 'might', 'must', 'shall', 'can', 'need', 'dare',
    'ought', 'used', 'to', 'of', 'in', 'for', 'on', 'with', 'at', 'by',
    'from', 'up', 'about', 'into', 'over', 'after', 'beneath', 'under',
    'above', 'and', 'but', 'or', 'nor', 'so', 'yet', 'both', 'either',
    'neither', 'not', 'only', 'own', 'same', 'than', 'too', 'very',
    'just', 'also', 'now', 'here', 'there', 'when', 'where', 'why', 'how',
    'all', 'each', 'every', 'both', 'few', 'more', 'most', 'other', 'some',
    'such', 'no', 'any', 'i', 'me', 'my', 'myself', 'we', 'our', 'ours',
    'you', 'your', 'yours', 'he', 'him', 'his', 'she', 'her', 'hers',
    'it', 'its', 'they', 'them', 'their', 'this', 'that', 'these', 'those',
    // Bengali stop words
    'এবং', 'কিন্তু', 'যে', 'এই', 'সেই', 'তার', 'আমি', 'তুমি', 'সে', 'আমরা',
    'তোমরা', 'তারা', 'কি', 'কে', 'কোথায়', 'কখন', 'কেন', 'কিভাবে'
  ])
  
  // Extract meaningful words
  const words = script
    .toLowerCase()
    .replace(/["""''।,!?.:;()\[\]{}]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 3 && !stopWords.has(word))
  
  // Count word frequency
  const wordCount = {}
  words.forEach(word => {
    wordCount[word] = (wordCount[word] || 0) + 1
  })
  
  // Sort by frequency and get top keywords
  const sortedWords = Object.entries(wordCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, count * 2)
    .map(([word]) => word)
  
  // Return unique keywords
  return sortedWords.length > 0 ? sortedWords.slice(0, count) : ['nature', 'people', 'lifestyle']
}

// Search stock videos by keywords using the Quick Reels Hub API
async function searchStockVideosByKeywords(keywords, count = 3) {
  try {
    console.log(`[Hybrid] Searching stock videos for keywords: ${keywords.join(', ')}`)
    
    // Use the existing search-videos API from Quick Reels Hub
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
    const response = await fetch(`${baseUrl}/api/story-reels/search-videos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ keywords: keywords.slice(0, count) })
    })
    
    if (!response.ok) {
      throw new Error(`Search API returned ${response.status}`)
    }
    
    const data = await response.json()
    
    if (data.success && data.videos && data.videos.length > 0) {
      console.log(`[Hybrid] ✅ Found ${data.videos.length} stock videos`)
      return data.videos.map(v => ({
        url: v.url,
        keyword: v.keyword,
        type: 'stock',
        duration: v.duration || 5,
        source: v.source || 'pexels'
      }))
    }
    
    throw new Error('No videos found')
  } catch (error) {
    console.error(`[Hybrid] Stock search failed:`, error.message)
    // Fallback to direct Pexels fetch
    return fetchStockVideos(keywords, count)
  }
}

// Fetch stock videos from Pexels (fallback)
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
              type: 'stock',
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
  // Support portrait (9:16), landscape (16:9), and square (1:1)
  let dimensions
  if (format === 'portrait') {
    dimensions = { width: 576, height: 1024 }
  } else if (format === 'square') {
    dimensions = { width: 768, height: 768 }
  } else {
    dimensions = { width: 1024, height: 576 }
  }
  
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
// ==================== SMART SCENE PARSER ====================
// Extracts scene context from scripts for better AI video generation
// Handles: Time of day, mood, location, weather, actions

function extractSceneContext(text) {
  const context = {
    timeOfDay: null,
    mood: null,
    location: null,
    weather: null,
    lighting: null
  }
  
  const lowerText = text.toLowerCase()
  
  // Time of day detection (English + Bengali + Hindi)
  const timePatterns = {
    night: /night|midnight|3\s*am|2\s*am|1\s*am|4\s*am|রাত|মধ্যরাত|রাত্রি|रात|आधी रात/i,
    evening: /evening|dusk|sunset|twilight|সন্ধ্যা|গোধূলি|शाम|सूर्यास्त/i,
    morning: /morning|dawn|sunrise|সকাল|ভোর|সূর্যোদয়|सुबह|भोर/i,
    afternoon: /afternoon|noon|midday|দুপুর|বিকেল|दोपहर/i,
    day: /day|daytime|bright|দিন|दिन/i
  }
  
  for (const [time, pattern] of Object.entries(timePatterns)) {
    if (pattern.test(lowerText)) {
      context.timeOfDay = time
      break
    }
  }
  
  // Mood detection
  const moodPatterns = {
    dark: /dark|scary|horror|fear|ভয়|অন্ধকার|डरावना|अंधेरा/i,
    romantic: /love|romantic|heart|ভালোবাসা|রোমান্টিক|प्यार|रोमांटिक/i,
    sad: /sad|cry|tear|কান্না|দুঃখ|रोना|दुखी/i,
    happy: /happy|joy|smile|laugh|হাসি|আনন्দ|खुश|हंसी/i,
    tense: /tension|suspense|nervous|উত্তেজনা|সন্দেহ|तनाव|रहस्य/i,
    peaceful: /calm|peace|serene|quiet|শান্ত|শান্তি|शांत|शांति/i
  }
  
  for (const [mood, pattern] of Object.entries(moodPatterns)) {
    if (pattern.test(lowerText)) {
      context.mood = mood
      break
    }
  }
  
  // Location detection
  const locationPatterns = {
    indoor: /room|house|home|bedroom|kitchen|office|ঘর|বাড়ি|অফিস|घर|कमरा|ऑफिस/i,
    outdoor: /outside|street|road|garden|park|forest|বাইরে|রাস্তা|বাগান|बाहर|सड़क|पार्क/i,
    urban: /city|building|urban|শহর|বিল्ডিং|शहर|इमारत/i,
    nature: /nature|mountain|river|sea|ocean|প্রকৃতি|পাহাড়|নদী|समुद्र|पहाड़|नदी/i
  }
  
  for (const [loc, pattern] of Object.entries(locationPatterns)) {
    if (pattern.test(lowerText)) {
      context.location = loc
      break
    }
  }
  
  // Weather detection
  const weatherPatterns = {
    rain: /rain|storm|thunder|বৃষ্টি|ঝড়|बारिश|तूफान/i,
    snow: /snow|winter|cold|তুষার|শীত|बर्फ|सर्दी/i,
    sunny: /sun|sunny|bright|রোদ|সূর্য|धूप|सूरज/i,
    cloudy: /cloud|overcast|মেঘ|মেঘলা|बादल/i
  }
  
  for (const [weather, pattern] of Object.entries(weatherPatterns)) {
    if (pattern.test(lowerText)) {
      context.weather = weather
      break
    }
  }
  
  // Build lighting instruction based on context
  if (context.timeOfDay === 'night') {
    context.lighting = 'dark nighttime scene, moonlight, shadows, low-key lighting, night atmosphere'
  } else if (context.timeOfDay === 'evening') {
    context.lighting = 'golden hour, warm sunset lighting, dusk atmosphere'
  } else if (context.timeOfDay === 'morning') {
    context.lighting = 'soft morning light, sunrise, gentle rays, dawn atmosphere'
  } else if (context.mood === 'dark') {
    context.lighting = 'dark moody lighting, dramatic shadows, low-key'
  }
  
  return context
}

function parsePromptToScenes(prompt, numScenes) {
  // Split by newlines or sentences
  let parts = prompt.split(/\n+/).filter(l => l.trim())
  
  if (parts.length < numScenes) {
    // Split by sentences (handles English, Bengali, Hindi)
    parts = prompt.split(/[.!?।]+/).filter(l => l.trim()).map(l => l.trim())
  }
  
  // Extract overall scene context from the full prompt
  const globalContext = extractSceneContext(prompt)
  
  // Enhance each scene with context
  const enhancedParts = parts.map((part, index) => {
    const sceneContext = extractSceneContext(part)
    
    // Merge local context with global context (local takes priority)
    const finalContext = {
      timeOfDay: sceneContext.timeOfDay || globalContext.timeOfDay,
      mood: sceneContext.mood || globalContext.mood,
      location: sceneContext.location || globalContext.location,
      weather: sceneContext.weather || globalContext.weather,
      lighting: sceneContext.lighting || globalContext.lighting
    }
    
    // Build enhanced prompt
    let enhanced = part
    
    // Add lighting/time instructions
    if (finalContext.lighting) {
      enhanced += `, ${finalContext.lighting}`
    } else if (finalContext.timeOfDay) {
      enhanced += `, ${finalContext.timeOfDay} scene`
    }
    
    // Add mood
    if (finalContext.mood) {
      enhanced += `, ${finalContext.mood} atmosphere`
    }
    
    // Add weather
    if (finalContext.weather) {
      enhanced += `, ${finalContext.weather} weather`
    }
    
    return enhanced
  })
  
  // Ensure we have enough scenes
  while (enhancedParts.length < numScenes) {
    const lastPart = enhancedParts[enhancedParts.length - 1] || prompt
    enhancedParts.push(lastPart + ', different angle, continuous scene')
  }
  
  // Take only what we need
  const scenes = enhancedParts.slice(0, numScenes)
  
  console.log(`[Scene Parser] Extracted ${scenes.length} scenes with context:`, globalContext)
  
  return scenes
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
    const narrationMode = formData.get('narrationMode') || 'dialogue-only' // 'full' or 'dialogue-only'
    
    // Check if imageFile is actually a file or just a string
    const hasValidImage = imageFile && typeof imageFile !== 'string' && imageFile.size > 0
    console.log(`[${jobId}] Mode: ${mode}, Duration: ${duration}s, Format: ${format}`)
    console.log(`[${jobId}] Template: ${templateId}, VideoSource: ${videoSource}, HasValidImage: ${hasValidImage}`)
    console.log(`[${jobId}] Voice: ${voiceOption}, TTS Language: ${ttsLanguage}, Narration: ${narrationMode}`)
    
    // Get format dimensions
    const dimensions = format === 'portrait' 
      ? { width: 1080, height: 1920 }
      : { width: 1920, height: 1080 }
    
    // Step 1: Generate or fetch video clips
    let videos = []
    
    // Check for image-to-video mode with uploaded image
    if (mode === 'image-to-video' && hasValidImage) {
      console.log(`[${jobId}] 📸 IMAGE-TO-VIDEO mode with uploaded image`)
      
      // Upload image and convert to video using Fal.ai image-to-video
      try {
        const imageBuffer = Buffer.from(await imageFile.arrayBuffer())
        const base64Image = imageBuffer.toString('base64')
        const mimeType = imageFile.type || 'image/jpeg'
        const dataUrl = `data:${mimeType};base64,${base64Image}`
        
        // Use Fal.ai image-to-video models
        videos = await generateImageToVideoWithFal(dataUrl, prompt, duration, dimensions, jobId, templateId)
        
        if (videos.length === 0) {
          throw new Error('Image-to-video generation failed')
        }
        console.log(`[${jobId}] ✅ Generated ${videos.length} videos from image`)
      } catch (imgError) {
        console.error(`[${jobId}] ⚠️ Image-to-video failed:`, imgError.message)
        // Fallback to stock videos based on prompt keywords
        const keywords = extractKeywordsFromScript(prompt, 5)
        videos = await searchStockVideosByKeywords(keywords, Math.ceil(duration / 5))
      }
    } else if (videoSource === 'ai') {
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
      // Mix AI and stock videos with smart keyword search
      console.log(`[${jobId}] ✨ Building hybrid video (AI + Stock)...`)
      
      // Extract keywords from script for stock video search
      const keywords = extractKeywordsFromScript(prompt, 5)
      console.log(`[${jobId}] Extracted keywords: ${keywords.join(', ')}`)
      
      // Try to generate 1-2 AI videos for key scenes
      try {
        const aiVideos = await generateAIVideosWithFal(prompt, Math.min(duration, 10), dimensions, jobId)
        if (aiVideos.length > 0) {
          videos.push(...aiVideos.map(v => ({ ...v, type: 'ai' })))
          console.log(`[${jobId}] ✅ Got ${aiVideos.length} AI clips`)
        }
      } catch (e) {
        console.log(`[${jobId}] AI generation skipped: ${e.message}`)
      }
      
      // Search and add stock videos based on keywords (with 3-second trim later)
      const numStockClips = Math.max(2, Math.ceil(duration / 5) - videos.length)
      const stockVideos = await searchStockVideosByKeywords(keywords, numStockClips)
      videos.push(...stockVideos.map(v => ({ ...v, type: 'stock' })))
      console.log(`[${jobId}] ✅ Got ${stockVideos.length} stock clips (will be 3s trimmed)`)
      
    } else {
      // AI only mode (stock-only is now removed)
      console.log(`[${jobId}] 🎨 AI-only mode, generating with Fal.ai...`)
      
      try {
        videos = await generateAIVideosWithFal(prompt, duration, dimensions, jobId)
        
        if (videos.length === 0) {
          throw new Error('No AI videos generated')
        }
        console.log(`[${jobId}] ✅ Generated ${videos.length} AI clips`)
      } catch (falError) {
        console.error(`[${jobId}] ⚠️ Fal.ai failed:`, falError.message)
        
        // Try Replicate as fallback
        try {
          videos = await generateAIVideosWithReplicate(prompt, duration, dimensions, jobId)
        } catch (replicateError) {
          // Final fallback: use hybrid mode
          console.log(`[${jobId}] All AI failed, falling back to stock videos`)
          const keywords = extractKeywordsFromScript(prompt, 5)
          videos = await searchStockVideosByKeywords(keywords, Math.ceil(duration / 5))
        }
      }
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
      musicTrack,
      narrationMode
    })
    
    return NextResponse.json({
      success: true,
      ...result,
      provider: 'ffmpeg',
      narrationMode,
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
// ==================== FAL.AI IMAGE-TO-VIDEO ====================
// Generates video from uploaded image with ad-style motion and effects
// Perfect for Small Business Promo Ads template

async function generateImageToVideoWithFal(imageDataUrl, prompt, duration, dimensions, jobId, templateId) {
  const videos = []
  const numClips = Math.max(1, Math.ceil(duration / 5))
  
  // Image-to-video models ordered by cost (cheapest first)
  const imageToVideoModels = [
    {
      name: 'Pixverse v4 I2V',
      endpoint: 'fal-ai/pixverse/v4/image-to-video',
      costPerVideo: 0.05,
      tier: '💰 Budget',
      inputFormat: 'image_url'
    },
    {
      name: 'Stable Video',
      endpoint: 'fal-ai/stable-video',
      costPerVideo: 0.05,
      tier: '💰 Budget',
      inputFormat: 'image_url'
    },
    {
      name: 'Kling 1.5 I2V',
      endpoint: 'fal-ai/kling-video/v1.5/pro/image-to-video',
      costPerSecond: 0.065,
      tier: '⭐ Value',
      inputFormat: 'image_url'
    },
    {
      name: 'Veo 3 I2V',
      endpoint: 'fal-ai/veo3/image-to-video',
      costPerSecond: 0.20,
      tier: '🏆 Premium',
      inputFormat: 'image_url'
    }
  ]
  
  // Build ad-style motion prompt based on template
  let motionPrompt = prompt
  if (templateId === 'small-business-promo' || templateId?.includes('promo') || templateId?.includes('ads')) {
    motionPrompt = `PROFESSIONAL ADVERTISEMENT VIDEO: ${prompt}. 
Style: Scroll-stopping commercial with dynamic motion. 
Motion: Smooth zoom in, subtle rotation, professional product showcase. 
Effects: High contrast, vibrant colors, clean transitions.
Mood: Energetic, professional, attention-grabbing.`
    console.log(`[${jobId}] 🎬 Using AD-STYLE motion prompt for promo template`)
  } else {
    motionPrompt = `Animate this image with cinematic motion: ${prompt}. 
Add subtle camera movement, depth, and professional lighting effects.`
  }
  
  let selectedModel = imageToVideoModels[0]
  let modelIndex = 0
  
  // Try to generate video from image
  for (let i = 0; i < numClips; i++) {
    let success = false
    let attempts = 0
    
    while (!success && modelIndex < imageToVideoModels.length) {
      const model = imageToVideoModels[modelIndex]
      console.log(`[${jobId}] 🖼️ Generating image-to-video clip ${i + 1}/${numClips} with ${model.name}...`)
      
      try {
        const input = {
          prompt: motionPrompt,
          image_url: imageDataUrl
        }
        
        // Add aspect ratio for portrait/landscape
        if (dimensions.height > dimensions.width) {
          input.aspect_ratio = '9:16'
        } else {
          input.aspect_ratio = '16:9'
        }
        
        const result = await fal.subscribe(model.endpoint, {
          input,
          pollInterval: 2000,
          timeout: 180000, // 3 min timeout
          onQueueUpdate: (update) => {
            if (update.status === 'IN_PROGRESS') {
              console.log(`[${jobId}] 🎬 ${model.name} processing...`)
            }
          }
        })
        
        console.log(`[${jobId}] Raw Fal.ai response:`, JSON.stringify(result.data).substring(0, 300))
        const videoUrl = extractVideoUrl(result.data)
        console.log(`[${jobId}] Extracted URL type: ${typeof videoUrl}, value: ${String(videoUrl).substring(0, 100)}`)
        
        if (videoUrl && typeof videoUrl === 'string') {
          videos.push({
            url: videoUrl,
            prompt: motionPrompt,
            model: model.name,
            type: 'ai-image-to-video',
            index: i
          })
          console.log(`[${jobId}] ✅ Image-to-video clip ${i + 1} complete with ${model.name}`)
          success = true
        } else {
          throw new Error(`No valid video URL in response (got ${typeof videoUrl})`)
        }
      } catch (error) {
        console.error(`[${jobId}] ❌ ${model.name} failed:`, error.message)
        attempts++
        
        // Try next model after 2 failures
        if (attempts >= 2) {
          modelIndex++
          attempts = 0
          if (modelIndex < imageToVideoModels.length) {
            console.log(`[${jobId}] 🔄 Switching to ${imageToVideoModels[modelIndex].name}`)
          }
        }
      }
    }
    
    if (!success) {
      console.log(`[${jobId}] ⚠️ All image-to-video models failed for clip ${i + 1}`)
    }
  }
  
  return videos
}

// Updated Fal.ai Video Models - June 2025
// Order by cost: Cheapest first → Most expensive last
// Reference: https://fal.ai/pricing
async function generateAIVideosWithFal(prompt, duration, dimensions, jobId) {
  const videos = []
  const numClips = Math.ceil(duration / 5) // Each clip is ~5 seconds
  const scenes = parsePromptToScenes(prompt, numClips)
  
  // Models ordered by cost (cheapest first) - Updated endpoints from fal.ai docs
  const models = [
    // Budget Tier - ~$0.04/video
    { 
      name: 'Pixverse v5.5', 
      endpoint: 'fal-ai/pixverse/v5.5/text-to-video',
      costPerVideo: 0.04,
      tier: '💰 Budget',
      inputFormat: { prompt: true, aspect_ratio: true }
    },
    { 
      name: 'LongCat Distilled', 
      endpoint: 'fal-ai/longcat-video/distilled/text-to-video/720p',
      costPerVideo: 0.05,
      tier: '💰 Budget',
      inputFormat: { prompt: true, aspect_ratio: true }
    },
    // Value Tier - ~$0.05/second
    { 
      name: 'Wan 2.5', 
      endpoint: 'fal-ai/wan/v2.2-a14b/text-to-video',
      costPerSecond: 0.05,
      tier: '⭐ Value',
      inputFormat: { prompt: true, resolution: true }
    },
    { 
      name: 'Hunyuan 1.5', 
      endpoint: 'fal-ai/hunyuan-video-v1.5/text-to-video',
      costPerSecond: 0.05,
      tier: '⭐ Value',
      inputFormat: { prompt: true, aspect_ratio: true }
    },
    { 
      name: 'Sana Video', 
      endpoint: 'fal-ai/sana-video',
      costPerSecond: 0.05,
      tier: '⭐ Value',
      inputFormat: { prompt: true }
    },
    // Premium Tier - $0.07+/second
    { 
      name: 'Kling 2.5 Turbo Pro', 
      endpoint: 'fal-ai/kling-video/v2.5-turbo/pro/text-to-video',
      costPerSecond: 0.07,
      tier: '🏆 Premium',
      inputFormat: { prompt: true, aspect_ratio: true, duration: true }
    },
    { 
      name: 'Kling 2.6 Pro', 
      endpoint: 'fal-ai/kling-video/v2.6/pro/text-to-video',
      costPerSecond: 0.08,
      tier: '🏆 Premium',
      inputFormat: { prompt: true, aspect_ratio: true }
    },
    // Ultra Tier - $0.10+/second (highest quality)
    { 
      name: 'Veo 3.1 Fast', 
      endpoint: 'fal-ai/veo3.1/fast',
      costPerSecond: 0.20,
      tier: '💎 Ultra',
      inputFormat: { prompt: true, aspect_ratio: true }
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
  
  // If it's already a string URL, return it
  if (typeof output === 'string') return output
  
  // Handle array output
  if (Array.isArray(output)) {
    const first = output[0]
    if (typeof first === 'string') return first
    if (first?.url) {
      const url = typeof first.url === 'function' ? first.url() : first.url
      return typeof url === 'string' ? url : (url?.url || null)
    }
    if (first?.video?.url) return first.video.url
  }
  
  // Handle object with url property
  if (output.url) {
    const url = typeof output.url === 'function' ? output.url() : output.url
    return typeof url === 'string' ? url : (url?.url || null)
  }
  
  // Handle Fal.ai format: { video: { url: '...' } }
  if (output.video) {
    if (typeof output.video === 'string') return output.video
    if (output.video.url) return output.video.url
  }
  
  // Handle nested video object
  if (output.data?.video?.url) return output.data.video.url
  
  console.log('[extractVideoUrl] Unknown format:', JSON.stringify(output).substring(0, 200))
  return null
}
