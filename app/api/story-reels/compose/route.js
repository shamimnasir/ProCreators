import { NextResponse } from 'next/server'
import { writeFile, unlink, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import { join } from 'path'
import { randomUUID } from 'crypto'
import ffmpeg from 'fluent-ffmpeg'
import textToSpeech from '@google-cloud/text-to-speech'

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

    console.log(`[${jobId}] Config:`, { duration, voiceOption, ttsLanguage, selectedVoice, captionStyle, resolution })
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
      // Use uploaded audio directly (original recording option)
      console.log(`[${jobId}] Using uploaded audio directly...`)
      
      if (voiceFile) {
        const buffer = Buffer.from(await voiceFile.arrayBuffer())
        await writeFile(audioPath, buffer)
        console.log(`[${jobId}] Uploaded audio saved, size:`, buffer.length)
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
    
    // Determine target height based on resolution
    const targetHeight = resolution === '4k' ? '2160' : resolution === '2k' ? '1440' : resolution === '1080p' ? '1080' : '720'
    
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
            '-vf', `scale=-2:${targetHeight},fps=30`,
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
    const captionContent = generateASSCaptions(script, actualAudioDuration, captionStyle, targetHeight)
    await writeFile(captionsPath, captionContent, 'utf8')

    // Step 6: Add background music if requested
    console.log(`[${jobId}] Step 6: Processing audio and music...`)
    let finalAudioPath = audioPath
    
    if (musicTrack !== 'none') {
      console.log(`[${jobId}] Adding background music: ${musicTrack}`)
      const musicPath = getMusicPath(musicTrack)
      
      if (musicPath && existsSync(musicPath)) {
        const mixedAudioPath = join(tempDir, 'mixed-audio.mp3')
        
        await new Promise((resolve, reject) => {
          ffmpeg()
            .input(audioPath)
            .input(musicPath)
            .complexFilter([
              '[0:a]volume=1.0[voice]',
              '[1:a]volume=0.3,afade=t=out:st=' + (duration - 2) + ':d=2[music]',
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
      } else {
        console.log(`[${jobId}] Music file not found, continuing without background music`)
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
function generateASSCaptions(script, duration, captionStyle, targetHeight) {
  const words = script.split(/\s+/).filter(w => w.length > 0)
  const wordsPerSecond = words.length / duration
  
  // Font size based on resolution - increased for better visibility
  let fontSize = targetHeight === '2160' ? 52 : targetHeight === '1440' ? 42 : targetHeight === '1080' ? 32 : 24
  const marginV = targetHeight === '2160' ? 80 : targetHeight === '1440' ? 60 : targetHeight === '1080' ? 50 : 30
  
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
      primaryColor = '&H00FF00FF' // Magenta/Pink
      outlineColor = '&H00FF00FF' // Same color for glow effect
      outline = 4
      shadow = 6
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
  
  // ASS Header
  let ass = `[Script Info]
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
