import { NextResponse } from 'next/server'
import { writeFile, unlink, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import { join } from 'path'
import { randomUUID } from 'crypto'
import ffmpeg from 'fluent-ffmpeg'
import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js'
import OpenAI from 'openai'
import gtts from 'gtts'

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
    const voiceOption = formData.get('voiceOption')
    const ttsProvider = formData.get('ttsProvider')
    const ttsLanguage = formData.get('ttsLanguage')
    const bengaliVoice = formData.get('bengaliVoice') || 'female-1'
    const captionStyle = formData.get('captionStyle')
    const musicTrack = formData.get('musicTrack')
    const resolution = formData.get('resolution')
    const stockVideos = JSON.parse(formData.get('stockVideos'))
    const keywords = JSON.parse(formData.get('keywords'))
    const voiceFile = formData.get('voiceFile')

    console.log(`[${jobId}] Config:`, { duration, voiceOption, ttsProvider, captionStyle, resolution })
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
      // Generate TTS
      console.log(`[${jobId}] Generating TTS with ${ttsProvider}...`)
      
      if (ttsProvider === 'openai') {
        // OpenAI TTS
        try {
          console.log(`[${jobId}] Calling OpenAI TTS...`)
          
          const openai = new OpenAI({
            apiKey: process.env.EMERGENT_LLM_KEY,
            baseURL: 'https://api.emergentagi.com/v1'
          })

          const mp3 = await openai.audio.speech.create({
            model: "tts-1",
            voice: "alloy",
            input: script,
          })

          const buffer = Buffer.from(await mp3.arrayBuffer())
          await writeFile(audioPath, buffer)
          
          console.log(`[${jobId}] OpenAI TTS generated successfully, size:`, buffer.length)
        } catch (openaiError) {
          console.error(`[${jobId}] OpenAI TTS failed:`, openaiError.message)
          console.log(`[${jobId}] Falling back to silent audio...`)
          
          // Fallback to silent audio
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
      } else if (ttsProvider === 'elevenlabs') {
        try {
          const elevenlabs = new ElevenLabsClient({
            apiKey: process.env.ELEVENLABS_API_KEY
          })

          // Select voice based on language and user selection
          let voiceId
          if (ttsLanguage === 'bn') {
            // If bengaliVoice is provided and looks like a voice ID (long alphanumeric), use it directly
            if (bengaliVoice && bengaliVoice.length > 15) {
              voiceId = bengaliVoice
              console.log(`[${jobId}] Using user-selected Bengali voice ID: ${voiceId}`)
            } else {
              // Fallback to default multilingual voice if no selection
              voiceId = 'pNInz6obpgDQGcFmaJgB' // Adam - multilingual default
              console.log(`[${jobId}] Using default multilingual voice (no Bengali voice selected)`)
            }
          } else {
            voiceId = 'EXAVITQu4vr4xnSDxMaL' // Default English voice (Sarah)
          }
          
          console.log(`[${jobId}] Calling ElevenLabs TTS with voice:`, voiceId)
          
          // Voice settings optimized for authentic Bangladeshi Bengali pronunciation
          const voiceSettings = {
            stability: 0.8,        // Higher stability for consistent Bangladeshi accent patterns
            similarity_boost: 0.95, // Very high similarity to preserve natural pronunciation
            style: 0.2,             // Lower style to reduce AI interpretation, maintain natural speech
            use_speaker_boost: true // Enhanced clarity for better accent clarity
          }
          
          console.log(`[${jobId}] Using Bangladeshi-optimized voice settings for voice: ${voiceId}`)
          
          const audio = await elevenlabs.textToSpeech.convert(voiceId, {
            text: script,
            model_id: 'eleven_multilingual_v2',
            voice_settings: voiceSettings,
            language_code: 'bn', // Always use Bengali for better regional accent
            optimize_streaming_latency: 0, // Highest quality over speed
            output_format: 'mp3_44100_128' // High quality output for better accent clarity
          })

          // Convert audio stream to buffer
          const chunks = []
          for await (const chunk of audio) {
            chunks.push(chunk)
          }
          const audioBuffer = Buffer.concat(chunks)
          await writeFile(audioPath, audioBuffer)
          
          console.log(`[${jobId}] TTS generated successfully, size:`, audioBuffer.length)
        } catch (elevenLabsError) {
          console.error(`[${jobId}] ElevenLabs TTS failed:`, elevenLabsError.message)
          console.log(`[${jobId}] Falling back to silent audio...`)
          
          // Fallback to silent audio if ElevenLabs fails
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
      } else if (ttsProvider === 'google') {
        // Google TTS (using gtts library - free, no API key needed)
        try {
          console.log(`[${jobId}] Generating TTS with Google (gtts library)...`)
          
          // Determine language code
          const lang = ttsLanguage === 'bn' ? 'bn' : 'en'
          
          const speech = new gtts(script, lang)
          
          await new Promise((resolve, reject) => {
            speech.save(audioPath, (err) => {
              if (err) {
                reject(err)
              } else {
                console.log(`[${jobId}] Google TTS generated successfully`)
                resolve()
              }
            })
          })
        } catch (googleTTSError) {
          console.error(`[${jobId}] Google TTS failed:`, googleTTSError.message)
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
      } else {
        // Unknown provider - use silent fallback
        console.log(`[${jobId}] Unknown TTS provider: ${ttsProvider}, using silent audio...`)
        await new Promise((resolve, reject) => {
          ffmpeg()
            .input('anullsrc=r=44100:cl=stereo')
            .inputFormat('lavfi')
            .duration(duration)
            .audioCodec('libmp3lame')
            .save(audioPath)
            .on('end', () => {
              console.log(`[${jobId}] Silent audio created`)
              resolve()
            })
            .on('error', reject)
        })
      }
    } else if (voiceOption === 'upload') {
      // Use uploaded audio directly (no TTS needed)
      console.log(`[${jobId}] Using uploaded audio directly...`)
      
      if (voiceFile) {
        const buffer = Buffer.from(await voiceFile.arrayBuffer())
        await writeFile(audioPath, buffer)
        console.log(`[${jobId}] Uploaded audio saved, size:`, buffer.length)
      } else {
        throw new Error('Voice file is required for upload option')
      }
    } else if (voiceOption === 'clone') {
      // Voice cloning with ElevenLabs - uses a pre-created cloned voice ID
      console.log(`[${jobId}] Using voice cloning with ElevenLabs...`)
      
      // Check if bengaliVoice is provided (should be the cloned voice ID)
      if (!bengaliVoice || bengaliVoice.length < 15) {
        throw new Error('Cloned voice ID is required. Please clone your voice first using the Voice Clone feature.')
      }
      
      try {
        const elevenlabs = new ElevenLabsClient({
          apiKey: process.env.ELEVENLABS_API_KEY
        })
        
        console.log(`[${jobId}] Using cloned voice ID: ${bengaliVoice}`)
        
        // Track voice usage in database
        try {
          const { VoiceStorage } = require('@/lib/voiceStorage')
          await VoiceStorage.incrementUsage(bengaliVoice)
          console.log(`[${jobId}] Voice usage tracked for: ${bengaliVoice}`)
        } catch (usageError) {
          console.error(`[${jobId}] Failed to track voice usage:`, usageError.message)
          // Don't fail TTS generation if usage tracking fails
        }
        
        // Generate TTS using the cloned voice with OPTIMIZED SETTINGS FOR BANGLADESHI ACCENT
        const voiceSettings = {
          stability: 0.8,              // High stability to maintain consistent Bangladeshi accent patterns
          similarity_boost: 1.0,       // MAXIMUM similarity to preserve original Bangladeshi pronunciation
          style: 0.3,                  // Lower style to reduce AI interpretation and maintain original accent
          use_speaker_boost: true      // Enhanced clarity for better accent preservation
        }
        
        console.log(`[${jobId}] Using Bangladeshi-optimized voice settings:`, voiceSettings)
        
        const audio = await elevenlabs.textToSpeech.convert(bengaliVoice, {
          text: script,
          model_id: 'eleven_multilingual_v2',  // Best model for accent preservation
          voice_settings: voiceSettings,
          language_code: 'bn',                 // Bengali language code
          optimize_streaming_latency: 0,       // Highest quality over speed
          output_format: 'mp3_44100_128'       // High quality output
        })
        
        // Convert audio stream to buffer and save
        const chunks = []
        for await (const chunk of audio) {
          chunks.push(chunk)
        }
        const audioBuffer = Buffer.concat(chunks)
        await writeFile(audioPath, audioBuffer)
        
        console.log(`[${jobId}] Cloned voice TTS generated successfully, size:`, audioBuffer.length)
        
      } catch (cloneError) {
        console.error(`[${jobId}] Voice cloning TTS failed:`, cloneError.message)
        throw new Error(`Failed to generate TTS with cloned voice: ${cloneError.message}`)
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

    // Step 4: Add audio to the concatenated video
    console.log(`[${jobId}] Step 4: Adding audio...`)
    const finalVideoPath = join(tempDir, 'final.mp4')
    
    await new Promise((resolve, reject) => {
      ffmpeg()
        .input(concatVideoPath)
        .input(audioPath)
        .outputOptions([
          '-c:v', 'copy', // Video is already processed, just copy
          '-c:a', 'aac',
          '-b:a', '128k',
          '-movflags', '+faststart',
          '-map', '0:v:0', // Map video from first input
          '-map', '1:a:0', // Map audio from second input
          '-shortest' // Stop at shortest stream (audio or video)
        ])
        .output(finalVideoPath)
        .on('end', () => {
          console.log(`[${jobId}] Video composition complete`)
          resolve()
        })
        .on('error', (err) => {
          console.error(`[${jobId}] FFmpeg error:`, err.message)
          reject(err)
        })
        .on('progress', (progress) => {
          console.log(`[${jobId}] Processing: ${Math.round(progress.percent || 0)}%`)
        })
        .run()
    })

    // Step 5: Generate SRT captions file separately
    console.log(`[${jobId}] Step 5: Generating captions file...`)
    const captionsPath = join(tempDir, 'captions.srt')
    const captionLines = generateCaptions(script, duration)
    await writeFile(captionsPath, captionLines)

    // Step 6: Save video to public folder
    console.log(`[${jobId}] Step 6: Saving video to public folder...`)
    const videoBuffer = await require('fs/promises').readFile(finalVideoPath)
    
    // Save to public folder
    const publicVideoPath = `/app/public/story-reels/${jobId}.mp4`
    await writeFile(publicVideoPath, videoBuffer)
    console.log(`[${jobId}] Video saved to:`, publicVideoPath)
    
    // Generate public URL
    const videoUrl = `/story-reels/${jobId}.mp4`

    // Save captions to public folder
    let captionsUrl = null
    if (existsSync(captionsPath)) {
      const captionsPublicPath = `/app/public/story-reels/${jobId}.srt`
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
      message: 'Story video created successfully!'
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

// Helper function to generate SRT captions
function generateCaptions(script, duration) {
  const words = script.split(/\s+/)
  const wordsPerSecond = words.length / duration
  const lines = []
  let currentTime = 0
  let lineIndex = 1

  // Split into caption chunks (5-8 words per caption)
  const wordsPerCaption = 6
  
  for (let i = 0; i < words.length; i += wordsPerCaption) {
    const chunk = words.slice(i, i + wordsPerCaption).join(' ')
    const chunkDuration = wordsPerCaption / wordsPerSecond
    const startTime = currentTime
    const endTime = currentTime + chunkDuration

    lines.push(`${lineIndex}`)
    lines.push(`${formatSRTTime(startTime)} --> ${formatSRTTime(endTime)}`)
    lines.push(chunk)
    lines.push('')

    currentTime = endTime
    lineIndex++
  }

  return lines.join('\n')
}

// Helper function to format time in SRT format (00:00:00,000)
function formatSRTTime(seconds) {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)
  const ms = Math.floor((seconds % 1) * 1000)

  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')},${String(ms).padStart(3, '0')}`
}
