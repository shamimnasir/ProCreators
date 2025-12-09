import { NextResponse } from 'next/server'
import { writeFile, unlink, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import { join } from 'path'
import { randomUUID } from 'crypto'
import ffmpeg from 'fluent-ffmpeg'
import textToSpeech from '@google-cloud/text-to-speech'
import { getCollection } from '@/lib/mongodb'

// Set ffmpeg path
ffmpeg.setFfmpegPath('/usr/bin/ffmpeg')
ffmpeg.setFfprobePath('/usr/bin/ffprobe')

export const maxDuration = 300 // 5 minutes timeout
export const dynamic = 'force-dynamic'
export const maxBodySize = 100 * 1024 * 1024 // 100MB for video response

export async function POST(request) {
  const jobId = randomUUID()
  const tempDir = `/tmp/story-reels-${jobId}`
  
  try {
    console.log(`[${jobId}] Starting video composition...`)
    
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
    const stockVideos = JSON.parse(formData.get('stockVideos'))
    const keywords = JSON.parse(formData.get('keywords'))
    const voiceFile = formData.get('voiceFile')
    const captionFontSize = formData.get('captionFontSize') || 'medium'
    const captionPosition = formData.get('captionPosition') || 'bottom'
    const customMusicPath = formData.get('customMusicPath') || null // For Freesound downloads
    const niche = formData.get('niche') || 'story-reels' // For Quick Reels categorization

    console.log(`[${jobId}] Config:`, { duration, voiceOption, ttsLanguage, selectedVoice, captionStyle, resolution, captionFontSize, captionPosition, musicTrack, customMusicPath })
    console.log(`[${jobId}] Stock videos:`, stockVideos.length)

    // Step 1: Download stock videos using streams to save memory
    console.log(`[${jobId}] Step 1: Downloading ${stockVideos.length} stock videos...`)
    const videoFiles = []
    const { Readable } = require('stream')
    const { pipeline } = require('stream/promises')
    
    for (let i = 0; i < stockVideos.length; i++) {
      const video = stockVideos[i]
      const videoPath = join(tempDir, `clip-${i}.mp4`)
      
      try {
        const response = await fetch(video.url)
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`)
        }
        
        // Convert Web Stream to Node Stream and pipe to file
        const fileStream = require('fs').createWriteStream(videoPath)
        await pipeline(
          Readable.fromWeb(response.body),
          fileStream
        )
        
        videoFiles.push(videoPath)
        console.log(`[${jobId}] Downloaded clip ${i + 1}/${stockVideos.length}`)
      } catch (error) {
        console.error(`[${jobId}] Error downloading clip ${i}:`, error.message)
      }
    }

    if (videoFiles.length === 0) {
      throw new Error('Failed to download any stock videos')
    }

    // Step 2: Generate or use voice audio
    console.log(`[${jobId}] Step 2: Processing voice audio...`)
    let audioPath = join(tempDir, 'voice.mp3')
    
    if (voiceOption === 'tts') {
      // Generate TTS with Google Cloud
      console.log(`[${jobId}] Generating TTS with Google Cloud Text-to-Speech...`)
      
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
        console.log(`[${jobId}] Using language code: ${languageCode} (${languageName})`)

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

        console.log(`[${jobId}] Voice config:`, JSON.stringify(voiceConfig))
        
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

        console.log(`[${jobId}] Calling Google Cloud TTS API...`)
        const [response] = await client.synthesizeSpeech(request)

        // Write the audio content to file
        await writeFile(audioPath, response.audioContent, 'binary')
        
        console.log(`[${jobId}] Google Cloud TTS generated successfully, size:`, response.audioContent.length)
      } catch (googleError) {
        console.error(`[${jobId}] Google Cloud TTS failed:`, googleError.message)
        console.log(`[${jobId}] Falling back to silent audio...`)
        
        // Fallback to silent audio if Google TTS fails
        await new Promise((resolve, reject) => {
          ffmpeg()
            .input('anullsrc=r=44100:cl=stereo')
            .inputFormat('lavfi')
            .duration(duration)
            .audioCodec('libmp3lame')
            .save(audioPath)
            .on('end', () => {
              console.log(`[${jobId}] Silent audio fallback created`)
              resolve()
            })
            .on('error', reject)
        })
      }
    } else if (voiceOption === 'upload') {
      // Use uploaded audio with volume boost (original recording option)
      console.log(`[${jobId}] Processing uploaded audio with volume normalization...`)
      
      if (voiceFile) {
        const buffer = Buffer.from(await voiceFile.arrayBuffer())
        const tempUploadPath = join(tempDir, 'uploaded-voice-raw.mp3')
        await writeFile(tempUploadPath, buffer)
        console.log(`[${jobId}] Uploaded audio saved, size:`, buffer.length)
        
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
              console.log(`[${jobId}] Uploaded audio normalized and boosted`)
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

    // Step 3: Normalize each clip individually, then concatenate
    console.log(`[${jobId}] Step 3: Processing and concatenating video clips...`)
    
    // Determine target dimensions for 9:16 portrait (vertical) format
    // For Reels/Shorts, we need portrait orientation
    const targetWidth = resolution === '4k' ? '1216' : resolution === '2k' ? '810' : resolution === '1080p' ? '1080' : '720'
    const targetHeight = resolution === '4k' ? '2160' : resolution === '2k' ? '1440' : resolution === '1080p' ? '1920' : '1280'
    
    console.log(`[${jobId}] Target resolution: ${targetWidth}x${targetHeight} (9:16 portrait)`)
    
    // Calculate duration per clip
    const durationPerClip = duration / videoFiles.length
    console.log(`[${jobId}] Each clip will be ${durationPerClip.toFixed(2)} seconds`)
    
    // Step 3a: Normalize each clip individually
    const normalizedFiles = []
    for (let i = 0; i < videoFiles.length; i++) {
      const normalizedPath = join(tempDir, `normalized-${i}.mp4`)
      
      await new Promise((resolve, reject) => {
        ffmpeg(videoFiles[i])
          .outputOptions([
            // Force 9:16 portrait aspect ratio with center crop
            '-vf', `scale=${targetWidth}:${targetHeight}:force_original_aspect_ratio=increase,crop=${targetWidth}:${targetHeight},fps=30`,
            '-t', String(durationPerClip),
            '-c:v', 'libx264',
            '-preset', 'ultrafast',
            '-crf', '28',
            '-pix_fmt', 'yuv420p',
            '-an' // Remove audio from individual clips
          ])
          .output(normalizedPath)
          .on('end', () => {
            normalizedFiles.push(normalizedPath)
            console.log(`[${jobId}] Normalized clip ${i + 1}/${videoFiles.length}`)
            resolve()
          })
          .on('error', (err) => {
            console.error(`[${jobId}] Error normalizing clip ${i}:`, err.message)
            reject(err)
          })
          .run()
      })
    }
    
    // Step 3b: Concatenate normalized clips
    console.log(`[${jobId}] Concatenating ${normalizedFiles.length} normalized clips...`)
    const clipListPath = join(tempDir, 'clips.txt')
    const clipListContent = normalizedFiles.map(file => `file '${file}'`).join('\n')
    await writeFile(clipListPath, clipListContent)
    console.log(`[${jobId}] Concat list created with ${normalizedFiles.length} files`)
    
    const concatVideoPath = join(tempDir, 'concat.mp4')
    
    await new Promise((resolve, reject) => {
      ffmpeg()
        .input(clipListPath)
        .inputOptions(['-f', 'concat', '-safe', '0'])
        .outputOptions([
          '-c:v', 'libx264',
          '-preset', 'ultrafast',
          '-crf', '28',
          '-pix_fmt', 'yuv420p'
        ])
        .output(concatVideoPath)
        .on('end', () => {
          console.log(`[${jobId}] Video clips concatenated successfully`)
          resolve()
        })
        .on('error', (err) => {
          console.error(`[${jobId}] Concat error:`, err.message)
          reject(err)
        })
        .on('progress', (progress) => {
          if (progress.percent) {
            console.log(`[${jobId}] Concat progress: ${Math.round(progress.percent)}%`)
          }
        })
        .run()
    })

    // Step 4: Get actual audio duration for precise caption timing
    console.log(`[${jobId}] Step 4: Getting actual audio duration...`)
    const actualAudioDuration = await new Promise((resolve, reject) => {
      ffmpeg.ffprobe(audioPath, (err, metadata) => {
        if (err) {
          console.error(`[${jobId}] ffprobe error:`, err.message)
          resolve(duration) // Fallback to target duration
        } else {
          const audioDuration = metadata.format.duration
          console.log(`[${jobId}] Actual audio duration: ${audioDuration}s (target was ${duration}s)`)
          resolve(audioDuration)
        }
      })
    })

    // Step 5: Generate ASS captions file synced with actual audio duration
    console.log(`[${jobId}] Step 5: Generating captions synced with audio...`)
    const captionsPath = join(tempDir, 'captions.ass')
    const captionContent = generateASSCaptions(script, actualAudioDuration, captionStyle, targetHeight, captionFontSize, captionPosition)
    await writeFile(captionsPath, captionContent, 'utf8')

    // Step 6: Add background music if requested
    console.log(`[${jobId}] Step 6: Processing audio and music...`)
    let finalAudioPath = audioPath
    
    if (musicTrack !== 'none') {
      console.log(`[${jobId}] Adding background music: ${musicTrack}`)
      
      // Determine music path (custom Freesound download or built-in)
      let musicPath = customMusicPath ? `/app/public${customMusicPath}` : getMusicPath(musicTrack)
      
      if (musicPath && existsSync(musicPath)) {
        console.log(`[${jobId}] Music file found: ${musicPath}`)
        
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
              console.log(`[${jobId}] Music trimmed to ${actualAudioDuration}s`)
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
                console.log(`[${jobId}] Background music mixed successfully`)
                resolve()
              })
              .on('error', (err) => {
                console.error(`[${jobId}] Music mixing error:`, err.message)
                console.log(`[${jobId}] Continuing without background music`)
                resolve() // Continue without music on error
              })
              .run()
          })
        }
      } else {
        console.log(`[${jobId}] Music file not found: ${musicPath}, continuing without background music`)
      }
    }

    // Step 7: Add captions and audio to video
    console.log(`[${jobId}] Step 7: Adding captions and audio to video...`)
    const finalVideoPath = join(tempDir, 'final.mp4')
    
    // Build caption filter based on style
    const captionFilter = buildCaptionFilter(captionStyle, captionsPath, targetHeight)
    
    await new Promise((resolve, reject) => {
      ffmpeg()
        .input(concatVideoPath)
        .input(finalAudioPath)
        .outputOptions([
          '-vf', captionFilter,
          '-c:v', 'libx264',
          '-preset', 'fast',
          '-crf', '23',
          '-c:a', 'aac',
          '-b:a', '128k',
          '-movflags', '+faststart',
          '-map', '0:v:0',
          '-map', '1:a:0',
          '-shortest'
        ])
        .output(finalVideoPath)
        .on('end', () => {
          console.log(`[${jobId}] Video composition complete with captions`)
          resolve()
        })
        .on('error', (err) => {
          console.error(`[${jobId}] FFmpeg error:`, err.message)
          reject(err)
        })
        .on('progress', (progress) => {
          console.log(`[${jobId}] Final processing: ${Math.round(progress.percent || 0)}%`)
        })
        .run()
    })

    // Step 8: Save video to public folder
    console.log(`[${jobId}] Step 8: Saving video to public folder...`)
    const videoBuffer = await require('fs/promises').readFile(finalVideoPath)
    
    // Ensure public directory exists
    const publicDir = '/app/public/story-reels'
    if (!existsSync(publicDir)) {
      await mkdir(publicDir, { recursive: true })
    }
    
    // Save to public folder
    const publicVideoPath = join(publicDir, `${jobId}.mp4`)
    await writeFile(publicVideoPath, videoBuffer)
    console.log(`[${jobId}] Video saved to:`, publicVideoPath)
    
    // Generate public URL
    const videoUrl = `/story-reels/${jobId}.mp4`

    // Save captions to public folder
    let captionsUrl = null
    if (existsSync(captionsPath)) {
      const captionsPublicPath = join(publicDir, `${jobId}.srt`)
      const captionsBuffer = await require('fs/promises').readFile(captionsPath)
      await writeFile(captionsPublicPath, captionsBuffer)
      captionsUrl = `/story-reels/${jobId}.srt`
      console.log(`[${jobId}] Captions saved to:`, captionsPublicPath)
    }

    // Cleanup temp files
    console.log(`[${jobId}] Cleaning up temp files...`)
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
      console.log(`[${jobId}] Cleanup warning:`, e.message)
    }

    console.log(`[${jobId}] Video composition complete! Size:`, videoBuffer.length, 'bytes')

    // Step 9: Auto-save to Library
    console.log(`[${jobId}] Step 9: Saving to library...`)
    try {
      const libraryCollection = await getCollection('library')
      
      // Create TTL index if it doesn't exist
      try {
        await libraryCollection.createIndex(
          { expiresAt: 1 },
          { expireAfterSeconds: 0 }
        )
      } catch (indexError) {
        console.log('TTL index creation skipped (may already exist)')
      }

      // Calculate expiration: 30 days from now
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + 30)

      // Get niche display name for better UX
      const nicheDisplayName = niche === 'story-reels' ? 'Story Reel' : 
        niche.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')

      const libraryDoc = {
        id: randomUUID(),
        userId: 'default-user', // TODO: Replace with actual user ID when auth is implemented
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
      console.log(`[${jobId}] Video auto-saved to library (expires in 30 days)`)
    } catch (saveError) {
      console.error(`[${jobId}] Failed to auto-save to library:`, saveError)
      // Don't fail the request if library save fails
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
      message: 'Story video created successfully with Google Cloud TTS!'
    })

  } catch (error) {
    console.error(`[${jobId}] Composition error:`, error)
    
    // Cleanup on error
    try {
      await require('fs/promises').rm(tempDir, { recursive: true, force: true })
    } catch (e) {
      console.log(`[${jobId}] Cleanup error:`, e.message)
    }

    return NextResponse.json(
      { success: false, error: error.message || 'Failed to compose video' },
      { status: 500 }
    )
  }
}

// Helper function to generate ASS captions with Bengali support
function generateASSCaptions(script, duration, captionStyle, targetHeight, fontSizeOption = 'medium', positionOption = 'bottom') {
  // Better word splitting for Bengali - split on spaces but preserve Unicode characters
  const words = script.trim().split(/\s+/).filter(w => w.length > 0)
  const wordsPerSecond = words.length / duration
  
  // Base font size based on resolution (portrait orientation)
  const baseFontSize = targetHeight === '2160' ? 52 : targetHeight === '1920' ? 38 : targetHeight === '1440' ? 42 : targetHeight === '1280' ? 28 : 24
  
  // Adjust font size based on user preference
  let fontSizeMultiplier = 1
  switch (fontSizeOption) {
    case 'small':
      fontSizeMultiplier = 0.8
      break
    case 'medium':
      fontSizeMultiplier = 1.2  // Default is now 20% larger
      break
    case 'large':
      fontSizeMultiplier = 1.5
      break
    case 'extra-large':
      fontSizeMultiplier = 1.8
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
      marginV = Math.round(targetHeight / 2)  // Middle of screen
      break
    case 'bottom':
    default:
      marginV = targetHeight === '2160' ? 150 : targetHeight === '1920' ? 120 : targetHeight === '1440' ? 120 : targetHeight === '1280' ? 90 : 80
      break
  }
  
  // Style based on caption style
  let primaryColor = '&H00FFFFFF' // White (default)
  let outlineColor = '&H00000000' // Black
  let outline = 2
  let shadow = 1
  let bold = -1 // -1 = bold
  let fontName = 'Noto Sans Bengali UI'
  let alignment = 2 // 2 = bottom center, 5 = middle center, 8 = top center
  
  switch (captionStyle) {
    case 'karaoke':
      primaryColor = '&H0000FFFF' // Yellow
      outlineColor = '&H00000000' // Black outline
      outline = 3
      shadow = 1
      bold = -1
      alignment = 2 // Bottom
      break
    case 'animated':
      primaryColor = '&H00FFFFFF' // White
      outlineColor = '&H00000000' // Black outline
      outline = 2
      shadow = 3
      bold = -1
      alignment = 2 // Bottom
      break
    case 'neon-glow':
      primaryColor = '&H00FFFFFF' // Pure white text (ASS format: &H00BBGGRR)
      outlineColor = '&H00FF00FF' // Bright magenta outline (BGR format)
      outline = 8 // Extra thick outline for intense glow
      shadow = 12 // Very large shadow for maximum glow effect
      bold = -1
      alignment = 2 // Bottom
      break
    case 'yellow-highlight':
      primaryColor = '&H00000000' // Black text
      outlineColor = '&H0000FFFF' // Yellow outline/background
      outline = 8 // Thick outline for highlight effect
      shadow = 0
      bold = -1
      alignment = 2 // Bottom
      break
    case 'zoomed-in':
      primaryColor = '&H00FFFFFF' // White
      outlineColor = '&H00000000' // Black outline
      outline = 4
      shadow = 2
      bold = -1
      fontSize = Math.floor(fontSize * 1.5) // 50% larger
      alignment = 5 // Center of screen
      break
    case 'gradient-pop':
      primaryColor = '&H00FFD700' // Gold
      outlineColor = '&H00FF1493' // Deep pink outline
      outline = 3
      shadow = 4
      bold = -1
      alignment = 2 // Bottom
      break
    case 'minimal-clean':
      primaryColor = '&H00FFFFFF' // White
      outlineColor = '&H00000000' // Black outline
      outline = 1
      shadow = 0
      bold = 0 // Not bold
      alignment = 8 // Top
      break
    case 'tiktok-style':
      primaryColor = '&H00FFFFFF' // White
      outlineColor = '&H000000FF' // Red outline (TikTok vibe)
      outline = 3
      shadow = 2
      bold = -1
      alignment = 2 // Bottom
      break
    case 'bold-outline':
    default:
      primaryColor = '&H00FFFFFF' // White
      outlineColor = '&H00000000' // Black
      outline = 2
      shadow = 1
      bold = -1
      alignment = 2 // Bottom
  }
  
  // ASS Header with UTF-8 support for Bengali
  let ass = `\ufeff[Script Info]
Title: Story Reels Captions
ScriptType: v4.00+
WrapStyle: 0
PlayResX: 1080
PlayResY: ${targetHeight}
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,${fontName},${fontSize},${primaryColor},&H000000FF,${outlineColor},&H00000000,${bold},0,0,0,100,100,0,0,1,${outline},${shadow},${alignment},10,10,${marginV},1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
`

  // For karaoke: word-by-word, for others: 3-4 words per caption
  const wordsPerCaption = captionStyle === 'karaoke' ? 1 : 3
  let currentTime = 0
  
  for (let i = 0; i < words.length; i += wordsPerCaption) {
    const chunk = words.slice(i, i + wordsPerCaption).join(' ')
    const wordCount = Math.min(wordsPerCaption, words.length - i)
    const chunkDuration = wordCount / wordsPerSecond
    const startTime = currentTime
    const endTime = currentTime + chunkDuration
    
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
  // Escape path for ffmpeg
  const escapedPath = captionsPath.replace(/\\/g, '/').replace(/:/g, '\\:')
  
  // ASS format handles styling internally, just load the file
  return `ass=${escapedPath}`
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
