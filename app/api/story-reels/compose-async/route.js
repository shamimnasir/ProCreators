import { NextResponse } from 'next/server'
import { writeFile, unlink, mkdir, readFile } from 'fs/promises'
import { existsSync, readFileSync } from 'fs'
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

// AI Video Generation Tiers — repriced Feb 2026 for 30% margin on fal.ai costs
// (essential=Pixverse $0.008/s, standard=Wan 2.2 $0.05/s, professional=Kling 2.5 $0.07/s,
//  cinema=Seedance 2 Fast $0.2419/s — all per 30s base)
const AI_VIDEO_TIERS = {
  essential: {
    name: 'Essential',
    description: 'Basic AI video, no consistency',
    consistencyMode: 'none',
    creditCost: 20
  },
  standard: {
    name: 'Standard',
    description: 'Good quality with seed-based consistency',
    consistencyMode: 'seed',
    creditCost: 110
  },
  professional: {
    name: 'Professional',
    description: 'High quality with frame-chain consistency',
    consistencyMode: 'frame-chain',
    creditCost: 175
  },
  cinema: {
    name: 'Cinema',
    description: 'Best quality with advanced frame-chain (Seedance 2 Fast)',
    consistencyMode: 'frame-chain',
    creditCost: 600
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
  const startTime = Date.now()
  
  // Helper to calculate ETA based on progress
  const getETA = (progress) => {
    if (progress <= 5) return null
    const elapsed = (Date.now() - startTime) / 1000 // seconds
    const remaining = (elapsed / progress) * (100 - progress)
    return Math.ceil(remaining)
  }
  
  try {
    await updateJobStatus(jobId, { 
      status: 'processing', 
      progress: 5, 
      progressMessage: 'Starting video generation...',
      startedAt: new Date(),
      estimatedSecondsRemaining: null
    })
    
    // Create temp directory
    await mkdir(tempDir, { recursive: true })
    
    // Extract form data
    const {
      script, duration, voiceOption, ttsLanguage, selectedVoice,
      captionStyle, musicTrack, resolution, stockVideos, videoOrder,
      scenePrompts, voiceFile, captionFontSize, captionPosition,
      videoOrientation, customMusicPath, niche, videoSource,
      consistencyMode: userConsistencyMode, // User's selected consistency mode
      seedImage, seedImageType, // Single seed image for character/scene consistency
      sceneRefScenes, // JSON string of scene numbers with references
      showCaptions = true, // Whether to show captions on video
      useScenePrompts = true // Whether to use AI-generated scene prompts or raw prompt
    } = formDataObj
    
    // Parse scene reference images from form data
    let sceneReferenceImages = {}
    if (sceneRefScenes) {
      try {
        const sceneNumbers = JSON.parse(sceneRefScenes)
        for (const sceneNum of sceneNumbers) {
          const refImage = formDataObj[`sceneRefImage_${sceneNum}`]
          if (refImage) {
            sceneReferenceImages[sceneNum] = refImage
          }
        }
      } catch (e) {
        console.error(`[${jobId}] Failed to parse scene references:`, e.message)
      }
    }
    
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
    
    // Estimate total time: ~60 seconds per clip for AI generation + 60 seconds for processing
    const estimatedTotalSeconds = numClips * 60 + 60
    
    await updateJobStatus(jobId, { 
      status: 'generating_clips', 
      progress: 10, 
      progressMessage: `Generating ${numClips} AI video clips with Kling...`,
      totalClips: numClips,
      estimatedSecondsRemaining: estimatedTotalSeconds,
      estimatedTotalSeconds: estimatedTotalSeconds
    })
    
    // Get tier configuration
    const tierConfig = AI_VIDEO_TIERS[aiTier] || AI_VIDEO_TIERS.standard
    // Use user's selected consistency mode if provided, otherwise use tier default
    const consistencyMode = userConsistencyMode || tierConfig.consistencyMode || 'none'
    
    
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
      
      // Determine video model from videoSource
      // ai-standard / ai-pro / default → seedance 2 fast (primary), Kling 3.0 fallback
      // ai-wan / ai-ltx → legacy options, kept for backwards compat
      const videoModel = videoSource === 'ai-wan' ? 'wan' : videoSource === 'ai-ltx' ? 'ltx' : 'seedance'
      
      // Handle seed image upload if provided
      let seedImageUrl = null
      if (seedImage) {
        try {
          
          // Save seed image to temp and upload to fal storage
          const seedImagePath = join(tempDir, 'seed-image.jpg')
          
          // If seedImage is a File/Blob, write it to disk first
          if (seedImage instanceof Buffer) {
            await writeFile(seedImagePath, seedImage)
          } else if (seedImage.arrayBuffer) {
            const buffer = Buffer.from(await seedImage.arrayBuffer())
            await writeFile(seedImagePath, buffer)
          }
          
          // Upload to fal storage for use in image-to-video
          if (existsSync(seedImagePath)) {
            const { fal } = await import('@fal-ai/client')
            fal.config({ credentials: process.env.FAL_KEY })
            
            const fileBuffer = await require('fs/promises').readFile(seedImagePath)
            const uploadResult = await fal.storage.upload(new Blob([fileBuffer], { type: 'image/jpeg' }))
            seedImageUrl = uploadResult.url || uploadResult
            
          }
        } catch (seedError) {
          console.error(`[${jobId}] ⚠️ Seed image upload failed:`, seedError.message)
          // Continue without seed image
        }
      }
      
      // Upload multi-scene reference images
      let sceneReferenceUrls = {}
      if (Object.keys(sceneReferenceImages).length > 0) {
        
        const { fal } = await import('@fal-ai/client')
        fal.config({ credentials: process.env.FAL_KEY })
        
        for (const [sceneNum, imageFile] of Object.entries(sceneReferenceImages)) {
          try {
            const refImagePath = join(tempDir, `scene-ref-${sceneNum}.jpg`)
            
            if (imageFile instanceof Buffer) {
              await writeFile(refImagePath, imageFile)
            } else if (imageFile.arrayBuffer) {
              const buffer = Buffer.from(await imageFile.arrayBuffer())
              await writeFile(refImagePath, buffer)
            }
            
            if (existsSync(refImagePath)) {
              const fileBuffer = await require('fs/promises').readFile(refImagePath)
              const uploadResult = await fal.storage.upload(new Blob([fileBuffer], { type: 'image/jpeg' }))
              sceneReferenceUrls[sceneNum] = uploadResult.url || uploadResult
            }
          } catch (refErr) {
            console.error(`[${jobId}] ⚠️ Scene ${sceneNum} reference upload failed:`, refErr.message)
          }
        }
      }
      
      try {
        const hasSceneRefs = Object.keys(sceneReferenceUrls).length > 0
        
        // Use the centralized video service with consistency
        const result = await generateConsistentVideoClips({
          script,
          duration: parseInt(duration),
          aspectRatio,
          consistencyMode: (videoModel === 'wan' || videoModel === 'ltx') ? 'none' : consistencyMode, // Wan/LTX don't support consistency
          characterDescription: null, // Will be extracted from script
          jobId,
          videoModel, // Pass the video model
          seedImageUrl, // Pass the seed image URL for image-to-video
          seedImageType, // 'character' or 'scene'
          sceneReferenceUrls, // Pass multi-scene reference URLs
          useScenePrompts, // Whether to use AI-generated scene prompts or raw prompt
          onProgress: async (progress) => {
            // Estimate time per clip based on model
            const timePerClip = videoModel === 'ltx' ? 30 : videoModel === 'wan' ? 50 : 60
            const clipsRemaining = progress.totalClips - progress.clipIndex
            const estimatedSecondsRemaining = clipsRemaining * timePerClip + 60 // + 60s processing
            
            await updateJobStatus(jobId, {
              progress: 10 + Math.floor((progress.clipIndex / progress.totalClips) * 50),
              progressMessage: progress.message,
              clipsGenerated: progress.clipIndex,
              estimatedSecondsRemaining
            })
          }
        })
        
        aiVideos = result.clips.map((clip, i) => ({
          url: clip.url,
          keyword: `ai-scene-${i + 1}`,
          type: 'ai-generated',
          model: videoModel === 'wan' ? 'Wan 2.2' : videoModel === 'ltx' ? 'LTX' : 'Kling',
          frameChained: clip.frameChained
        }))
        
        
      } catch (genError) {
        console.error(`[${jobId}] ⚠️ ${videoModel} generation failed:`, genError.message)
        
        // DO NOT silently fall back to stock — inform the user clearly
        const errorMessage = genError.message || 'Unknown error'
        let userFriendlyMessage = `AI video generation failed: ${errorMessage}`
        
        if (errorMessage.includes('Unauthorized') || errorMessage.includes('401')) {
          userFriendlyMessage = 'AI video generation failed: Service authentication error. Please contact support.'
        } else if (errorMessage.includes('timeout') || errorMessage.includes('Timeout')) {
          userFriendlyMessage = 'AI video generation timed out. Please try again or use a shorter duration.'
        }
        
        throw new Error(userFriendlyMessage)
      }
      
      await updateJobStatus(jobId, {
        progress: 60,
        progressMessage: `Generated ${aiVideos.length} clips. Downloading...`,
        clipsGenerated: aiVideos.length
      })
    }
    
    // Download and process video clips
    const videosToProcess = isAIMode && aiVideos.length > 0 ? aiVideos : stockVideos
    // Track if we're using stock videos (need trimming) or AI videos (no trimming)
    const isUsingStockVideos = !isAIMode || aiVideos.length === 0
    
    if (videosToProcess.length === 0) {
      throw new Error('No video clips generated')
    }
    
    const { Readable } = require('stream')
    const { pipeline } = require('stream/promises')
    
    // Store video info alongside paths for trimming decisions
    const videoFilesInfo = []
    for (let i = 0; i < videosToProcess.length; i++) {
      const video = videosToProcess[i]
      const videoPath = join(tempDir, `clip-${i}.mp4`)
      
      try {
        const response = await fetch(video.url)
        if (!response.ok) throw new Error(`HTTP ${response.status}`)
        
        const fileStream = require('fs').createWriteStream(videoPath)
        await pipeline(Readable.fromWeb(response.body), fileStream)
        // Track video type for later trimming decision
        const isStockVideo = isUsingStockVideos || video.type === 'stock' || video.source === 'pexels'
        const isAIGenerated = video.type === 'ai-generated'
        videoFilesInfo.push({
          path: videoPath,
          isStock: isStockVideo && !isAIGenerated,
          type: video.type || 'unknown'
        })
      } catch (error) {
        console.error(`[${jobId}] Download failed for clip ${i + 1}:`, error.message)
      }
    }
    
    // Extract just paths for backward compat
    const videoFiles = videoFilesInfo.map(v => v.path)
    
    if (videoFiles.length === 0) {
      throw new Error('Failed to download any clips')
    }
    
    await updateJobStatus(jobId, {
      progress: 70,
      progressMessage: 'Generating voiceover...'
    })
    
    // Clean script for TTS - remove screenplay formatting and technical terms
    // ENHANCED: Now catches INLINE patterns (not just start of line)
    const cleanScriptForTTS = (rawScript) => {
      let cleaned = rawScript
      
      // CRITICAL: Remove @image tags (like @image1, @image2, @image 3, etc.)
      cleaned = cleaned.replace(/@image\s*\d*/gi, '')
      cleaned = cleaned.replace(/@\w+/gi, '') // Remove any @mentions like @Linda, @product
      
      // Remove section headers - BOTH at start of line AND inline
      // Start of line patterns
      cleaned = cleaned.replace(/^(Opening|Intro|Outro|Introduction|Conclusion|Scene\s*\d*|Act\s*\d*|Part\s*\d*|Section\s*\d*)[:\s]*/gim, '')
      // Inline patterns (e.g., "Opening: text" anywhere in the text)
      cleaned = cleaned.replace(/\b(Opening|Intro|Outro|Introduction|Conclusion):\s*/gi, '')
      cleaned = cleaned.replace(/\bScene\s*\d+[:\.\-]\s*/gi, '') // "Scene 1:", "Scene 2.", "Scene3-"
      cleaned = cleaned.replace(/\bAct\s*\d+[:\.\-]\s*/gi, '')
      cleaned = cleaned.replace(/\bPart\s*\d+[:\.\-]\s*/gi, '')
      
      // Remove voiceover/narrator indicators - BOTH at start AND inline
      cleaned = cleaned.replace(/^(VO|V\.O\.|Voiceover|Voice\s*Over|Voice-Over|Narrator|NARRATOR|Narration)[:\s]*/gim, '')
      cleaned = cleaned.replace(/\b(VO|V\.O\.)[:\s]+/gi, '') // Inline "VO:" 
      cleaned = cleaned.replace(/\b(Voiceover|Voice\s*Over|Voice-Over|Narrator|Narration)[:\s]+/gi, '')
      cleaned = cleaned.replace(/\(VO\)|\(V\.O\.\)|\(voiceover\)|\(narrator\)/gi, '')
      
      // Remove visual/video direction indicators
      cleaned = cleaned.replace(/^(Visual|Video|On\s*Screen|On-Screen|Shot|Footage|Clip|B-Roll|B\s*Roll)[:\s]*/gim, '')
      
      // Remove text/title indicators  
      cleaned = cleaned.replace(/^(Text|Title|Caption|Super|Lower\s*Third|Graphic|On\s*Screen\s*Text)[:\s]*[^\n]*/gim, '')
      
      // Remove SFX/Music cues
      cleaned = cleaned.replace(/^(SFX|Sound|Music|Audio|BGM|Background\s*Music)[:\s]*[^\n]*/gim, '')
      cleaned = cleaned.replace(/\[SFX[^\]]*\]|\[Music[^\]]*\]|\[Sound[^\]]*\]/gi, '')
      
      // Remove common video generation meta instructions
      const metaPhrases = [
        /\bcinematic\s+(video|shot|sequence|clip|footage)\s+of\b/gi,
        /\bdynamic\s+\d+-second\s+(video|shot|clip)\b/gi,
        /\bstart\s+with\s+a?\s*(wide|aerial|medium|close)?\s*shot\b/gi,
        /\bin\s+(slow[- ]?motion|extreme)?\s*(close[- ]?up|wide\s+shot|medium\s+shot)\b/gi,
        /\bshow\s+this\s+in\b/gi,
        /\b(wide|aerial|medium|close|tracking|establishing)\s+shot\s+(of|showing|capturing)?\b/gi,
        /\bcut\s+to\s+(a|the)?\b/gi,
        /\bimmediately\s+transition\s+to\b/gi,
        /\btransition\s+to\s+(celebration|scene)?\b/gi,
        /\buse\s+dramatic\s+music\b/gi,
        /\bquick\s+cuts\b/gi,
        /\bhigh[- ]?energy\s+camera\s+movements?\b/gi,
        /\bkeep\s+it\s+action[- ]?packed\b/gi,
        /\bthen\s+(wide|zoom|cut)\s+shot\b/gi,
        /\b(on|with)\s+the\s+net\s+rippling\b/gi,
        /\barms?\s+outstretched\b/gi,
        /\bgenerate\s+a\s+video\b/gi,
        /\bcreate\s+a\s+(cinematic\s+)?(video|clip)\b/gi,
        /\bmake\s+a\s+video\b/gi,
      ]
      
      metaPhrases.forEach(pattern => {
        cleaned = cleaned.replace(pattern, '')
      })
      
      // Remove camera direction terms when they appear standalone
      cleaned = cleaned.replace(/\b(wide shot|medium shot|close-?up|aerial shot|tracking shot|extreme close-?up|POV shot|establishing shot)\b/gi, '')
      
      // Remove technical video terms
      cleaned = cleaned.replace(/\b(front[- ]?facing|for lip sync|4K resolution|professional quality|cinematic lighting)\b/gi, '')
      
      // Remove screenplay scene headings: INT./EXT., DAY/NIGHT, etc.
      cleaned = cleaned.replace(/^(INT\.|EXT\.|INT\/EXT\.|I\/E\.)[^\n]*$/gim, '')
      
      // Remove FADE IN/OUT, CUT TO, DISSOLVE TO, etc.
      cleaned = cleaned.replace(/^(FADE IN:|FADE OUT:|FADE TO:|CUT TO:|DISSOLVE TO:|SMASH CUT:|MATCH CUT:|JUMP CUT:|INTERCUT:|CONTINUOUS:)[^\n]*$/gim, '')
      
      // Remove TITLE CARD lines
      cleaned = cleaned.replace(/^TITLE CARD:[^\n]*$/gim, '')
      
      // Remove VO / Narrator / Speaker labels (common in AI-generated scripts)
      cleaned = cleaned.replace(/^(VO|V\.O\.|NARRATOR|VOICEOVER|VOICE OVER|SPEAKER|HOST|ANCHOR|PRESENTER|NARRATION)\s*[:–—-]\s*/gim, '')
      cleaned = cleaned.replace(/^\*\*(VO|Narrator|Voiceover|Voice Over|Speaker|Host)\*\*\s*[:–—-]?\s*/gim, '')
      cleaned = cleaned.replace(/^\[(VO|Narrator|Voiceover|Voice|Speaker|Host|Music|SFX|Sound|Audio|Visual|Video|Scene|Cut|Transition)[^\]]*\]\s*/gim, '')
      
      // Remove character names in all caps before dialogue (e.g., "JOHN:")
      cleaned = cleaned.replace(/^[A-Z][A-Z\s\-']+(\s*\([^)]*\))?:\s*/gm, '')
      
      // Remove parenthetical directions like (softly), (V.O.), (O.S.), (CONT'D), (beat), (pause)
      cleaned = cleaned.replace(/\([^)]*\)/g, '')
      
      // Remove action/description blocks in brackets or with scene numbers
      cleaned = cleaned.replace(/^\[.*\]$/gm, '')
      cleaned = cleaned.replace(/^Scene \d+:?.*$/gim, '')
      
      // Remove markdown headers and bold/italic markers
      cleaned = cleaned.replace(/^#{1,6}\s+/gm, '')
      cleaned = cleaned.replace(/\*{1,3}([^*]+)\*{1,3}/g, '$1')
      cleaned = cleaned.replace(/_{1,3}([^_]+)_{1,3}/g, '$1')
      
      // Remove common script section labels
      cleaned = cleaned.replace(/^(Hook|Opening|Introduction|Body|Conclusion|Closing|Outro|Intro|Section \d+|Part \d+|Act \d+)\s*[:–—-]\s*/gim, '')
      
      // Remove camera directions
      cleaned = cleaned.replace(/^(CLOSE ON|ANGLE ON|POV|WIDE SHOT|MEDIUM SHOT|CLOSE-UP|TWO SHOT|INSERT|BACK TO)[:\s][^\n]*$/gim, '')
      
      // Remove time indicators like "-- DAY", "-- NIGHT", "-- DAWN"
      cleaned = cleaned.replace(/\s*--\s*(DAY|NIGHT|DAWN|DUSK|MORNING|EVENING|LATER|CONTINUOUS|SAME)[^\n]*/gi, '')
      
      // Clean up em-dashes commonly used in prompts
      cleaned = cleaned.replace(/—/g, ', ')
      
      // Clean up multiple punctuation
      cleaned = cleaned.replace(/[,;:]\s*[,;:]/g, ',')
      cleaned = cleaned.replace(/\.\s*\./g, '.')
      
      // Clean up multiple newlines and whitespace
      cleaned = cleaned.replace(/\n{3,}/g, '\n\n')
      cleaned = cleaned.replace(/^\s+|\s+$/gm, '')
      
      // Remove empty lines
      cleaned = cleaned.split('\n').filter(line => line.trim().length > 0).join(' ')
      
      // Clean up multiple spaces
      cleaned = cleaned.replace(/\s{2,}/g, ' ').trim()
      
      return cleaned
    }
    
    // Convert plain text to SSML with natural pauses for more human-like delivery
    const textToSSML = (text) => {
      // Escape special XML characters
      let ssml = text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;')
      
      // Add medium pause after periods (end of sentences)
      ssml = ssml.replace(/\.\s+/g, '.<break time="600ms"/> ')
      
      // Add short pause after commas
      ssml = ssml.replace(/,\s+/g, ',<break time="300ms"/> ')
      
      // Add medium pause after question marks
      ssml = ssml.replace(/\?\s+/g, '?<break time="600ms"/> ')
      
      // Add medium pause after exclamation marks
      ssml = ssml.replace(/!\s+/g, '!<break time="500ms"/> ')
      
      // Add pause after colons
      ssml = ssml.replace(/:\s+/g, ':<break time="400ms"/> ')
      
      // Add pause after semicolons
      ssml = ssml.replace(/;\s+/g, ';<break time="400ms"/> ')
      
      // Add emphasis to words in ALL CAPS (but not single letters)
      ssml = ssml.replace(/\b([A-Z]{2,})\b/g, '<emphasis level="strong">$1</emphasis>')
      
      // Wrap in speak tags
      return `<speak>${ssml}</speak>`
    }
    
    const ttsScript = cleanScriptForTTS(script)
    const ttsSSML = textToSSML(ttsScript)
    
    // Character voice mapping for Google Cloud TTS
    // Maps character types to appropriate voices
    const CHARACTER_VOICE_MAP = {
      // Adult voices
      'adult_male': {
        voiceName: 'en-US-Studio-M', // Deep male studio voice
        pitch: -2.0,
        speakingRate: 1.0
      },
      'adult_female': {
        voiceName: 'en-US-Studio-O', // Clear female studio voice
        pitch: 0,
        speakingRate: 1.0
      },
      // Older/elderly voices
      'elderly_male': {
        voiceName: 'en-US-Wavenet-B', // Mature male voice
        pitch: -4.0,
        speakingRate: 0.9
      },
      'elderly_female': {
        voiceName: 'en-US-Wavenet-C', // Mature female voice
        pitch: -2.0,
        speakingRate: 0.9
      },
      // Young adult voices
      'young_male': {
        voiceName: 'en-US-Neural2-D', // Younger male voice
        pitch: 2.0,
        speakingRate: 1.05
      },
      'young_female': {
        voiceName: 'en-US-Neural2-F', // Younger female voice
        pitch: 2.0,
        speakingRate: 1.05
      },
      // Child voices (using pitch adjustment for child-like sound)
      'child_boy': {
        voiceName: 'en-US-Neural2-D', // Male voice pitched up
        pitch: 6.0,
        speakingRate: 1.1
      },
      'child_girl': {
        voiceName: 'en-US-Neural2-F', // Female voice pitched up
        pitch: 6.0,
        speakingRate: 1.1
      },
      // Baby/toddler voices (higher pitch, slower)
      'baby_boy': {
        voiceName: 'en-US-Neural2-D',
        pitch: 10.0,
        speakingRate: 0.85
      },
      'baby_girl': {
        voiceName: 'en-US-Neural2-F',
        pitch: 10.0,
        speakingRate: 0.85
      },
      // Default neutral voice
      'neutral': {
        voiceName: 'en-US-Studio-O',
        pitch: 0,
        speakingRate: 1.0
      }
    }
    
    // Function to detect character type from prompt text
    const detectCharacterType = (promptText) => {
      const prompt = promptText.toLowerCase()
      
      // Baby detection (check first as it's most specific)
      if (/baby\s*(boy|male)|infant\s*(boy|male)|toddler\s*(boy|male)/.test(prompt)) {
        return 'baby_boy'
      }
      if (/baby\s*(girl|female)|infant\s*(girl|female)|toddler\s*(girl|female)|baby/.test(prompt)) {
        return 'baby_girl'
      }
      
      // Child/kid detection
      if (/\b(boy|kid|child)\b.*\b(male|boy|son)\b|\b(little|young|small)\s+(boy|kid|son)\b|\b\d{1,2}[\s-]?year[\s-]?old\s+(boy|male\s+child)\b/.test(prompt)) {
        return 'child_boy'
      }
      if (/\b(girl|kid|child)\b.*\b(female|girl|daughter)\b|\b(little|young|small)\s+(girl|daughter)\b|\b\d{1,2}[\s-]?year[\s-]?old\s+(girl|female\s+child)\b/.test(prompt)) {
        return 'child_girl'
      }
      // Generic child detection
      if (/\bchild\b|\bkid\b|\bchildren\b/.test(prompt)) {
        // Default child to girl unless male indicators
        if (/\b(he|him|his|boy|male|son)\b/.test(prompt)) return 'child_boy'
        return 'child_girl'
      }
      
      // Elderly detection
      if (/\b(old|elderly|senior|aged|grandfather|grandpa|grandad)\s*(man|male|gentleman|guy)\b|\b(old|elderly)\s+(man|male)\b|\bgrandfather\b|\bgrandpa\b/.test(prompt)) {
        return 'elderly_male'
      }
      if (/\b(old|elderly|senior|aged|grandmother|grandma|granny)\s*(woman|female|lady)\b|\b(old|elderly)\s+(woman|lady|female)\b|\bgrandmother\b|\bgrandma\b/.test(prompt)) {
        return 'elderly_female'
      }
      
      // Young adult detection
      if (/\b(young|teen|teenage|adolescent)\s*(man|male|boy|guy)\b|\b(young|teen)\s+(man|guy|male)\b/.test(prompt)) {
        return 'young_male'
      }
      if (/\b(young|teen|teenage|adolescent)\s*(woman|female|girl|lady)\b|\b(young|teen)\s+(woman|girl|lady|female)\b/.test(prompt)) {
        return 'young_female'
      }
      
      // Adult male detection
      if (/\b(man|male|gentleman|businessman|father|dad|husband|guy|boy(?:friend)?|he|him)\b/.test(prompt)) {
        // Check for age indicators
        if (/\b(\d{2,}[\s-]?year[\s-]?old)\b/.test(prompt)) {
          const ageMatch = prompt.match(/(\d{2,})[\s-]?year/)
          if (ageMatch) {
            const age = parseInt(ageMatch[1])
            if (age >= 60) return 'elderly_male'
            if (age <= 25) return 'young_male'
          }
        }
        return 'adult_male'
      }
      
      // Adult female detection
      if (/\b(woman|female|lady|businesswoman|mother|mom|wife|girl(?:friend)?|she|her)\b/.test(prompt)) {
        // Check for age indicators
        if (/\b(\d{2,}[\s-]?year[\s-]?old)\b/.test(prompt)) {
          const ageMatch = prompt.match(/(\d{2,})[\s-]?year/)
          if (ageMatch) {
            const age = parseInt(ageMatch[1])
            if (age >= 60) return 'elderly_female'
            if (age <= 25) return 'young_female'
          }
        }
        return 'adult_female'
      }
      
      // Default to neutral if no character type detected
      return 'neutral'
    }
    
    // Function to extract dialogues from scene prompts with character detection
    const extractDialoguesFromPrompts = (prompts) => {
      const dialogues = []
      if (!prompts || !Array.isArray(prompts)) return dialogues
      
      prompts.forEach((scene, index) => {
        const prompt = scene.prompt || scene
        // Match: saying 'dialogue' or saying "dialogue"
        const matches = prompt.match(/saying\s+['"]([^'"]+)['"]/gi)
        if (matches) {
          matches.forEach(match => {
            const dialogue = match.match(/saying\s+['"]([^'"]+)['"]/i)
            if (dialogue && dialogue[1]) {
              // Detect character type from the full prompt
              const characterType = detectCharacterType(prompt)
              
              dialogues.push({
                sceneIndex: index,
                text: dialogue[1],
                characterType: characterType,
                fullPrompt: prompt // Store for logging
              })
            }
          })
        }
      })
      return dialogues
    }
    
    // Function to generate character dialogue audio with character-specific voices
    const generateDialogueAudio = async (dialogues, totalDuration, numScenes, baseLanguageCode) => {
      if (!dialogues.length) return null
      
      const client = new textToSpeech.TextToSpeechClient({
        keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS
      })
      
      const sceneDuration = totalDuration / numScenes
      const dialogueAudios = []
      
      for (const dialogue of dialogues) {
        try {
          // Get character-specific voice configuration
          const voiceConfig = CHARACTER_VOICE_MAP[dialogue.characterType] || CHARACTER_VOICE_MAP.neutral
          
          // Adjust voice name for non-English languages
          let voiceName = voiceConfig.voiceName
          if (baseLanguageCode && !baseLanguageCode.startsWith('en')) {
            // For non-English, use a generic voice with the right language
            const langPrefix = baseLanguageCode.split('-')[0]
            // Try to find a matching voice or fall back
            voiceName = undefined // Let Google TTS pick the best voice for the language
          }
          
          
          const [response] = await client.synthesizeSpeech({
            input: { text: dialogue.text },
            voice: { 
              languageCode: baseLanguageCode || 'en-US', 
              name: voiceName,
              ssmlGender: dialogue.characterType.includes('male') || dialogue.characterType.includes('boy') ? 'MALE' : 'FEMALE'
            },
            audioConfig: { 
              audioEncoding: 'MP3', 
              speakingRate: voiceConfig.speakingRate || 1.0,
              pitch: voiceConfig.pitch || 0
            }
          })
          
          const dialogueFile = join(tempDir, `dialogue_${dialogue.sceneIndex}.mp3`)
          await writeFile(dialogueFile, response.audioContent, 'binary')
          
          // Get dialogue audio duration
          const dialogueDuration = await new Promise((resolve) => {
            ffmpeg.ffprobe(dialogueFile, (err, metadata) => {
              resolve(err ? 2 : metadata.format.duration)
            })
          })
          
          // Calculate start time (middle of the scene for natural feel)
          const sceneStart = dialogue.sceneIndex * sceneDuration
          const startTime = sceneStart + (sceneDuration - dialogueDuration) / 2
          
          dialogueAudios.push({
            file: dialogueFile,
            startTime: Math.max(0, startTime),
            duration: dialogueDuration,
            text: dialogue.text
          })
          
        } catch (err) {
          console.error(`[${jobId}] Failed to generate dialogue: ${err.message}`)
        }
      }
      
      return dialogueAudios
    }
    
    // Function to create combined dialogue audio track
    const createDialogueTrack = async (dialogueAudios, totalDuration) => {
      if (!dialogueAudios || !dialogueAudios.length) return null
      
      const outputPath = join(tempDir, 'dialogue_track.mp3')
      
      // Create a silent base track and overlay dialogues
      return new Promise((resolve, reject) => {
        let command = ffmpeg()
          // Create silent base track
          .input('anullsrc=r=44100:cl=stereo')
          .inputFormat('lavfi')
          .duration(totalDuration)
        
        // Add each dialogue audio
        dialogueAudios.forEach(d => {
          command = command.input(d.file)
        })
        
        // Build filter complex for overlaying
        let filterParts = ['[0:a]aformat=sample_fmts=fltp:sample_rates=44100:channel_layouts=stereo[base]']
        let mixInputs = '[base]'
        
        dialogueAudios.forEach((d, i) => {
          const inputIndex = i + 1
          const delayMs = Math.round(d.startTime * 1000)
          filterParts.push(`[${inputIndex}:a]adelay=${delayMs}|${delayMs},aformat=sample_fmts=fltp:sample_rates=44100:channel_layouts=stereo[d${i}]`)
          mixInputs += `[d${i}]`
        })
        
        // Mix all audio streams
        filterParts.push(`${mixInputs}amix=inputs=${dialogueAudios.length + 1}:duration=first[out]`)
        
        command
          .complexFilter(filterParts.join(';'), 'out')
          .audioCodec('libmp3lame')
          .audioBitrate('192k')
          .output(outputPath)
          .on('end', () => resolve(outputPath))
          .on('error', (err) => {
            console.error(`[${jobId}] Dialogue track creation failed: ${err.message}`)
            reject(err)
          })
          .run()
      })
    }
    
    // Generate TTS audio (or skip if voiceOption is 'none')
    let audioPath = join(tempDir, 'voice.mp3')
    let hasAudio = true
    let dialogueTrackPath = null
    
    // Parse scenePrompts if it's a string
    let parsedScenePrompts = scenePrompts
    if (typeof scenePrompts === 'string') {
      try {
        parsedScenePrompts = JSON.parse(scenePrompts)
      } catch (e) {
        parsedScenePrompts = []
      }
    }
    
    if (voiceOption === 'none' || voiceOption === 'silent') {
      // Check if we have character dialogues in prompts
      const dialogues = extractDialoguesFromPrompts(parsedScenePrompts)
      
      if (dialogues.length > 0 && isAIMode) {
        dialogues.forEach(d => {
        })
        
        // Generate dialogue audio for character speech with character-specific voices
        const dialogueAudios = await generateDialogueAudio(
          dialogues, 
          duration, 
          parsedScenePrompts.length || Math.ceil(duration / 10),
          ttsLanguage === 'bn' ? 'bn-IN' : 'en-US' // Pass language code directly
        )
        
        if (dialogueAudios && dialogueAudios.length > 0) {
          dialogueTrackPath = await createDialogueTrack(dialogueAudios, duration)
          if (dialogueTrackPath) {
            hasAudio = true
            audioPath = dialogueTrackPath
          } else {
            hasAudio = false
          }
        } else {
          hasAudio = false
        }
      } else {
        // No dialogues found - create truly silent video
        hasAudio = false
      }
    } else if (voiceOption === 'tts') {
      const client = new textToSpeech.TextToSpeechClient({
        keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS
      })
      
      let languageCode = ttsLanguage === 'bn' ? 'bn-IN' : 'en-US'
      if (selectedVoice && selectedVoice.includes('-')) {
        const parts = selectedVoice.split('-')
        if (parts.length >= 2) languageCode = `${parts[0]}-${parts[1]}`
      }
      
      // Helper: Build TTS request with proper voice config
      // Chirp3-HD and other newer voices may fail — use fallback
      const FALLBACK_VOICES = {
        'en': 'en-US-Neural2-C',
        'bn': 'bn-IN-Standard-A',
      }
      
      const buildTTSRequest = (inputObj) => {
        return {
          input: inputObj,
          voice: { languageCode, name: selectedVoice || undefined },
          audioConfig: { 
            audioEncoding: 'MP3', 
            speakingRate: 0.95,
            pitch: 0,
            volumeGainDb: 0
          }
        }
      }
      
      const synthesizeWithFallback = async (inputObj) => {
        try {
          const [response] = await client.synthesizeSpeech(buildTTSRequest(inputObj))
          return response
        } catch (primaryError) {
          // If the selected voice fails (e.g., Chirp3-HD needs model param), use fallback
          console.log(`[${jobId}] Primary voice "${selectedVoice}" failed: ${primaryError.message}. Trying fallback...`)
          const langBase = languageCode.split('-')[0] || 'en'
          const fallbackVoice = FALLBACK_VOICES[langBase] || FALLBACK_VOICES['en']
          const fallbackLang = langBase === 'bn' ? 'bn-IN' : 'en-US'
          
          const [response] = await client.synthesizeSpeech({
            input: inputObj,
            voice: { languageCode: fallbackLang, name: fallbackVoice },
            audioConfig: { audioEncoding: 'MP3', speakingRate: 0.95, pitch: 0, volumeGainDb: 0 }
          })
          console.log(`[${jobId}] Fallback voice "${fallbackVoice}" succeeded`)
          return response
        }
      }
      
      // Google TTS has a 5000 byte limit per request
      // Split long scripts into chunks and concatenate audio
      const MAX_BYTES = 4500 // Leave buffer for SSML tags
      const ssmlBytes = Buffer.byteLength(ttsSSML, 'utf8')
      
      if (ssmlBytes <= 5000) {
        // Short enough — single request
        const response = await synthesizeWithFallback({ ssml: ttsSSML })
        await writeFile(audioPath, response.audioContent, 'binary')
      } else {
        // Long script — split by sentences, chunk, and concatenate
        console.log(`[${jobId}] Script is ${ssmlBytes} bytes, splitting into chunks...`)
        
        // Split the clean text (not SSML) into sentences
        const sentences = ttsScript.split(/(?<=[.!?])\s+/).filter(s => s.trim().length > 0)
        const chunks = []
        let currentChunk = ''
        
        for (const sentence of sentences) {
          const testChunk = currentChunk ? `${currentChunk} ${sentence}` : sentence
          const testSSML = textToSSML(testChunk)
          
          if (Buffer.byteLength(testSSML, 'utf8') > MAX_BYTES && currentChunk) {
            chunks.push(currentChunk)
            currentChunk = sentence
          } else {
            currentChunk = testChunk
          }
        }
        if (currentChunk) chunks.push(currentChunk)
        
        console.log(`[${jobId}] Split into ${chunks.length} TTS chunks`)
        
        // Generate audio for each chunk
        const chunkAudioPaths = []
        for (let i = 0; i < chunks.length; i++) {
          const chunkSSML = textToSSML(chunks[i])
          const response = await synthesizeWithFallback({ ssml: chunkSSML })
          
          const chunkPath = join(tmpDir, `tts_chunk_${i}.mp3`)
          await writeFile(chunkPath, response.audioContent, 'binary')
          chunkAudioPaths.push(chunkPath)
        }
        
        // Concatenate all chunks using ffmpeg
        if (chunkAudioPaths.length === 1) {
          const singleChunkData = readFileSync(chunkAudioPaths[0])
          await writeFile(audioPath, singleChunkData)
        } else {
          const concatListPath = join(tmpDir, 'tts_concat.txt')
          const concatContent = chunkAudioPaths.map(p => `file '${p}'`).join('\n')
          await writeFile(concatListPath, concatContent)
          
          await new Promise((resolve, reject) => {
            ffmpeg()
              .input(concatListPath)
              .inputOptions(['-f', 'concat', '-safe', '0'])
              .outputOptions(['-c', 'copy'])
              .output(audioPath)
              .on('end', resolve)
              .on('error', reject)
              .run()
          })
        }
        
        console.log(`[${jobId}] TTS chunks concatenated successfully`)
      }
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
    
    // Add background music if requested and we have voice/dialogue audio
    if (musicTrack && musicTrack !== 'none' && hasAudio) {
      const musicDir = '/app/public/music'
      const musicMap = {
        'upbeat': join(musicDir, 'upbeat.mp3'),
        'calm': join(musicDir, 'calm.mp3'),
        'epic': join(musicDir, 'epic.mp3'),
        'emotional': join(musicDir, 'emotional.mp3')
      }
      
      let musicPath = customMusicPath ? `/app/public${customMusicPath}` : musicMap[musicTrack]
      
      if (musicPath && existsSync(musicPath)) {
        
        // Trim music to match audio duration
        const trimmedMusicPath = join(tempDir, 'trimmed-music.mp3')
        
        await new Promise((resolve) => {
          ffmpeg(musicPath)
            .setStartTime(0)
            .duration(actualAudioDuration)
            .outputOptions(['-acodec', 'libmp3lame', '-b:a', '128k', '-ar', '44100'])
            .output(trimmedMusicPath)
            .on('end', resolve)
            .on('error', (err) => {
              console.error(`[${jobId}] Music trim error:`, err.message)
              resolve() // Continue without music on error
            })
            .run()
        })
        
        // Mix music with voice
        if (existsSync(trimmedMusicPath)) {
          const mixedAudioPath = join(tempDir, 'mixed-audio.mp3')
          
          await new Promise((resolve) => {
            ffmpeg()
              .input(audioPath)
              .input(trimmedMusicPath)
              .complexFilter([
                '[0:a]volume=1.0[voice]',
                `[1:a]volume=0.20,afade=t=out:st=${Math.max(actualAudioDuration - 2, 0)}:d=2[music]`,
                '[voice][music]amix=inputs=2:duration=shortest:dropout_transition=2[out]'
              ])
              .outputOptions(['-map', '[out]', '-ac', '2', '-ar', '44100', '-b:a', '128k'])
              .output(mixedAudioPath)
              .on('end', () => {
                audioPath = mixedAudioPath // Use mixed audio
                resolve()
              })
              .on('error', (err) => {
                console.error(`[${jobId}] Music mixing error:`, err.message)
                resolve() // Continue without music on error
              })
              .run()
          })
        }
      }
    } else if (musicTrack && musicTrack !== 'none' && !hasAudio) {
      // No voice but music requested - use music as background
      const musicDir = '/app/public/music'
      const musicMap = {
        'upbeat': join(musicDir, 'upbeat.mp3'),
        'calm': join(musicDir, 'calm.mp3'),
        'epic': join(musicDir, 'epic.mp3'),
        'emotional': join(musicDir, 'emotional.mp3')
      }
      
      let musicPath = customMusicPath ? `/app/public${customMusicPath}` : musicMap[musicTrack]
      
      if (musicPath && existsSync(musicPath)) {
        
        // Trim and use music as the audio track
        const trimmedMusicPath = join(tempDir, 'trimmed-music.mp3')
        
        await new Promise((resolve) => {
          ffmpeg(musicPath)
            .setStartTime(0)
            .duration(actualAudioDuration)
            .outputOptions([
              '-acodec', 'libmp3lame', '-b:a', '128k', '-ar', '44100',
              `-af`, `volume=0.8,afade=t=out:st=${Math.max(actualAudioDuration - 2, 0)}:d=2`
            ])
            .output(trimmedMusicPath)
            .on('end', () => {
              audioPath = trimmedMusicPath
              hasAudio = true
              resolve()
            })
            .on('error', (err) => {
              console.error(`[${jobId}] Music-only error:`, err.message)
              resolve()
            })
            .run()
        })
      }
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
    
    // Normalize clips - Apply trimming to stock videos (skip first 3-5 seconds to avoid watermarks)
    const durationPerClip = actualAudioDuration / videoFiles.length
    const normalizedFiles = []
    
    // Stock video trim offset - skip first 3 seconds to avoid intro/watermark
    const STOCK_VIDEO_TRIM_OFFSET = 3
    
    for (let i = 0; i < videoFiles.length; i++) {
      const normalizedPath = join(tempDir, `normalized-${i}.mp4`)
      const videoInfo = videoFilesInfo[i]
      const isStockClip = videoInfo?.isStock || false
      
      await new Promise((resolve, reject) => {
        const cmd = ffmpeg(videoFiles[i])
        
        // For stock videos: skip first 3 seconds to avoid watermarks/intros
        // For AI-generated videos: use from the start
        if (isStockClip) {
          cmd.inputOptions(['-ss', String(STOCK_VIDEO_TRIM_OFFSET)])
        }
        
        cmd.outputOptions([
            '-vf', `scale=${targetWidth}:${targetHeight}:force_original_aspect_ratio=increase,crop=${targetWidth}:${targetHeight},fps=30`,
            '-t', String(durationPerClip),
            '-c:v', 'libx264',
            '-preset', 'fast',
            '-crf', '23',
            '-pix_fmt', 'yuv420p',
            '-c:a', 'aac', '-b:a', '128k' // Keep original audio from Kling
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
      progressMessage: 'Concatenating video with transitions...'
    })
    
    // Concatenate clips with crossfade transitions
    const concatVideoPath = join(tempDir, 'concat.mp4')
    
    if (normalizedFiles.length === 1) {
      // Single clip - just copy
      await require('fs/promises').copyFile(normalizedFiles[0], concatVideoPath)
    } else if (normalizedFiles.length === 2) {
      // Two clips - simple video-only crossfade (AI videos are silent)
      const transitionDuration = 0.5 // 0.5 second crossfade
      await new Promise((resolve, reject) => {
        ffmpeg()
          .input(normalizedFiles[0])
          .input(normalizedFiles[1])
          .complexFilter([
            // Video crossfade only - AI videos don't have audio
            `[0:v][1:v]xfade=transition=fade:duration=${transitionDuration}:offset=${durationPerClip - transitionDuration}[v]`
          ])
          .outputOptions([
            '-map', '[v]',
            '-c:v', 'libx264', '-preset', 'fast', '-crf', '23', '-pix_fmt', 'yuv420p',
            '-an' // No audio in concat (will add later)
          ])
          .output(concatVideoPath)
          .on('end', resolve)
          .on('error', (err) => {
            // Fallback to simple concat
            const clipListPath = join(tempDir, 'clips.txt')
            const clipListContent = normalizedFiles.map(f => `file '${f}'`).join('\n')
            require('fs/promises').writeFile(clipListPath, clipListContent).then(() => {
              ffmpeg()
                .input(clipListPath)
                .inputOptions(['-f', 'concat', '-safe', '0'])
                .outputOptions(['-c:v', 'libx264', '-preset', 'fast', '-crf', '23', '-pix_fmt', 'yuv420p', '-an'])
                .output(concatVideoPath)
                .on('end', resolve)
                .on('error', reject)
                .run()
            })
          })
          .run()
      })
    } else {
      // Multiple clips - use simple concat (AI videos are silent)
      const clipListPath = join(tempDir, 'clips.txt')
      const clipListContent = normalizedFiles.map(f => `file '${f}'`).join('\n')
      await writeFile(clipListPath, clipListContent)
      
      await new Promise((resolve, reject) => {
        ffmpeg()
          .input(clipListPath)
          .inputOptions(['-f', 'concat', '-safe', '0'])
          .outputOptions([
            '-c:v', 'libx264', '-preset', 'fast', '-crf', '23', '-pix_fmt', 'yuv420p',
            '-an' // No audio in concat (will add later)
          ])
          .output(concatVideoPath)
          .on('end', resolve)
          .on('error', reject)
          .run()
      })
    }
    
    await updateJobStatus(jobId, {
      progress: 90,
      progressMessage: showCaptions ? 'Adding captions and audio...' : 'Adding audio...'
    })
    
    // Determine input video for final processing
    let processedVideoPath = concatVideoPath
    
    // Add captions only if showCaptions is true
    if (showCaptions && captionStyle !== 'none') {
      // Generate captions - use the cleaned TTS script to remove screenplay formatting
      const captionsPath = join(tempDir, 'captions.ass')
      const captionContent = generateASSCaptions(ttsScript, actualAudioDuration, captionStyle, targetHeight, targetWidth, captionFontSize, captionPosition)
      await writeFile(captionsPath, captionContent, 'utf8')
      
      // Add captions (preserving Kling's original audio)
      const captionedPath = join(tempDir, 'captioned.mp4')
      const escapedCaptionsPath = captionsPath.replace(/\\/g, '/').replace(/:/g, '\\:')
      
      await new Promise((resolve, reject) => {
        ffmpeg()
          .input(concatVideoPath)
          .outputOptions([
            '-vf', `ass='${escapedCaptionsPath}':fontsdir=/app/fonts`,
            '-c:v', 'libx264', '-preset', 'fast', '-crf', '23', '-pix_fmt', 'yuv420p',
            '-c:a', 'copy' // Keep Kling's original audio (environment sounds, footsteps, etc.)
          ])
          .output(captionedPath)
          .on('end', resolve)
          .on('error', reject)
          .run()
      })
      
      processedVideoPath = captionedPath
    } else {
    }
    
    // Merge with audio - MIX Kling's original audio with dialogue/voiceover
    const finalVideoPath = join(tempDir, 'final.mp4')
    
    // Check if the processed video has audio (from Kling)
    const hasKlingAudio = await new Promise((resolve) => {
      ffmpeg.ffprobe(processedVideoPath, (err, metadata) => {
        if (err) {
          resolve(false)
        } else {
          const audioStreams = metadata.streams?.filter(s => s.codec_type === 'audio') || []
          resolve(audioStreams.length > 0)
        }
      })
    })
    
    
    if (hasAudio && hasKlingAudio) {
      // MIX Kling's original audio (ambient, effects) with dialogue/voiceover
      // Kling audio at 70% volume, dialogue/voiceover at 100% volume
      await new Promise((resolve, reject) => {
        ffmpeg()
          .input(processedVideoPath)
          .input(audioPath)
          .complexFilter([
            '[0:a]volume=0.7[kling]',  // Kling audio at 70% (background)
            '[1:a]volume=1.0[voice]',   // Dialogue/voiceover at 100%
            '[kling][voice]amix=inputs=2:duration=first:dropout_transition=2[aout]'
          ])
          .outputOptions([
            '-c:v', 'copy',
            '-map', '0:v:0',
            '-map', '[aout]',
            '-c:a', 'aac', '-b:a', '192k',
            '-movflags', '+faststart',
            '-shortest'
          ])
          .output(finalVideoPath)
          .on('end', resolve)
          .on('error', (err) => {
            console.error(`[${jobId}] Audio mix failed: ${err.message}, falling back to dialogue only`)
            // Fallback: just use dialogue audio
            ffmpeg()
              .input(processedVideoPath)
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
          .run()
      })
    } else if (hasAudio) {
      // Only dialogue/voiceover audio (no Kling audio)
      await new Promise((resolve, reject) => {
        ffmpeg()
          .input(processedVideoPath)
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
    } else if (hasKlingAudio) {
      // Only Kling's original audio (no dialogue)
      await new Promise((resolve, reject) => {
        ffmpeg()
          .input(processedVideoPath)
          .outputOptions([
            '-c:v', 'copy', '-c:a', 'copy',
            '-movflags', '+faststart'
          ])
          .output(finalVideoPath)
          .on('end', resolve)
          .on('error', reject)
          .run()
      })
    } else {
      // No audio at all
      await new Promise((resolve, reject) => {
        ffmpeg()
          .input(processedVideoPath)
          .outputOptions([
            '-c:v', 'copy', '-an',
            '-movflags', '+faststart'
          ])
          .output(finalVideoPath)
          .on('end', resolve)
          .on('error', reject)
          .run()
      })
    }
    
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

// Caption generator (improved sync with speech patterns)
function generateASSCaptions(script, duration, style, height, width, fontSize, position) {
  const h = parseInt(height) || 1920
  const w = parseInt(width) || 1080
  
  // Clean script and split into words
  const cleanScript = script.trim().replace(/\s+/g, ' ')
  const words = cleanScript.split(' ').filter(w => w.length > 0)
  
  if (words.length === 0) return ''
  
  const wordsPerCaption = style === 'karaoke' ? 1 : 3
  
  // Use word-based timing (more accurate than character-based for speech)
  // Average speech rate: ~2.5 words per second for narration
  // Calculate actual words-per-second from total
  const wordsPerSecond = words.length / duration
  
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
  
  const formatTime = (s) => {
    const hrs = Math.floor(s / 3600)
    const mins = Math.floor((s % 3600) / 60)
    const secs = Math.floor(s % 60)
    const cs = Math.floor((s % 1) * 100)
    return `${hrs}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${String(cs).padStart(2, '0')}`
  }
  
  // Check if a word ends a sentence (contains punctuation)
  const endsWithPunctuation = (word) => /[.!?;:—]$/.test(word)
  const endsWithComma = (word) => /[,]$/.test(word)
  const isEllipsis = (word) => word.includes('...')
  
  let currentTime = 0
  // Add a small initial delay to sync with speech start
  currentTime = 0.15
  
  for (let i = 0; i < words.length; i += wordsPerCaption) {
    const chunkWords = words.slice(i, i + wordsPerCaption)
    const chunk = chunkWords.join(' ')
    
    // Calculate duration for this chunk based on word count
    let chunkDuration = chunkWords.length / wordsPerSecond
    
    // Add natural pauses for sentence endings
    const lastWord = chunkWords[chunkWords.length - 1] || ''
    if (endsWithPunctuation(lastWord)) {
      chunkDuration += 0.25 // Natural sentence-end pause
    } else if (endsWithComma(lastWord)) {
      chunkDuration += 0.12 // Shorter comma pause
    } else if (isEllipsis(lastWord)) {
      chunkDuration += 0.35 // Longer dramatic pause
    }
    
    const startTime = currentTime
    const endTime = Math.min(currentTime + chunkDuration, duration - 0.05)
    
    // Only add caption if it has meaningful duration
    if (endTime > startTime + 0.1) {
      ass += `Dialogue: 0,${formatTime(startTime)},${formatTime(endTime)},Default,,0,0,0,,${chunk}\n`
    }
    
    currentTime = endTime
  }
  
  return ass
}

export async function POST(request) {
  const jobId = randomUUID()
  
  try {
    
    // Get user ID
    const userId = await getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 })
    }
    
    // Parse form data
    const formData = await request.formData()
    const videoSource = formData.get('videoSource') || 'stock'
    const duration = parseInt(formData.get('duration')) || 30
    
    
    // Validate duration (max 10 minutes = 600 seconds for long-form videos)
    if (duration > 600) {
      return NextResponse.json({ success: false, error: 'Maximum duration is 10 minutes (600 seconds)' }, { status: 400 })
    }
    
    // Determine credit cost
    let creditToolId = 'quick-reels-stock'
    if (videoSource === 'ai-essential') creditToolId = 'quick-reels-ai-essential'
    else if (videoSource === 'ai-standard') creditToolId = 'quick-reels-ai-standard'
    else if (videoSource === 'ai-professional') creditToolId = 'quick-reels-ai-professional'
    else if (videoSource === 'ai-cinema') creditToolId = 'quick-reels-ai-cinema'
    else if (videoSource === 'ai-wan') creditToolId = 'quick-reels-ai-wan'
    else if (videoSource === 'ai-ltx') creditToolId = 'quick-reels-ai-ltx'
    
    
    // Linear duration scaling (per-scene pricing)
    // 30s = 100% of base, 20s = 67%, 10s = 33%
    const durationMultiplier = duration / 30
    
    // Check and deduct credits
    const creditCheck = await checkCredits(userId, creditToolId)
    
    // Calculate cost with linear scaling (minimum 25% of base)
    const totalCost = Math.max(
      Math.ceil(creditCheck.cost * durationMultiplier),
      Math.ceil(creditCheck.cost * 0.25) // Minimum 25%
    )
    
    if (creditCheck.currentBalance < totalCost) {
      return NextResponse.json({
        success: false,
        error: `Insufficient credits. ${duration}s video costs ${totalCost} credits, you have ${creditCheck.currentBalance}.`
      }, { status: 402 })
    }
    
    const deductResult = await deductCredits(userId, creditToolId, { duration: duration })
    if (!deductResult.success) {
      return NextResponse.json({ success: false, error: deductResult.error }, { status: 402 })
    }
    
    // Extract all form data
    const formDataObj = {
      script: formData.get('script'),
      duration,
      voiceOption: formData.get('voiceOption') || 'tts',
      ttsLanguage: formData.get('ttsLanguage') || 'en',
      selectedVoice: formData.get('selectedVoice'),
      captionStyle: formData.get('captionStyle') || 'bold-outline',
      showCaptions: formData.get('showCaptions') !== 'false', // Default true
      useScenePrompts: formData.get('useScenePrompts') !== 'false', // Default true
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
