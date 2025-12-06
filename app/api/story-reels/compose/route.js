import { NextResponse } from 'next/server'
import { writeFile, unlink, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import { join } from 'path'
import { randomUUID } from 'crypto'
import ffmpeg from 'fluent-ffmpeg'
import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js'

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
    const captionStyle = formData.get('captionStyle')
    const musicTrack = formData.get('musicTrack')
    const resolution = formData.get('resolution')
    const stockVideos = JSON.parse(formData.get('stockVideos'))
    const keywords = JSON.parse(formData.get('keywords'))
    const voiceFile = formData.get('voiceFile')

    console.log(`[${jobId}] Config:`, { duration, voiceOption, ttsProvider, captionStyle, resolution })
    console.log(`[${jobId}] Stock videos:`, stockVideos.length)

    // Step 1: Download stock videos
    console.log(`[${jobId}] Step 1: Downloading ${stockVideos.length} stock videos...`)
    const videoFiles = []
    
    for (let i = 0; i < stockVideos.length; i++) {
      const video = stockVideos[i]
      const videoPath = join(tempDir, `clip-${i}.mp4`)
      
      try {
        const response = await fetch(video.url)
        const buffer = Buffer.from(await response.arrayBuffer())
        await writeFile(videoPath, buffer)
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
      
      if (ttsProvider === 'elevenlabs') {
        try {
          const elevenlabs = new ElevenLabsClient({
            apiKey: process.env.ELEVENLABS_API_KEY
          })

          // Use appropriate voice based on language
          const voiceId = ttsLanguage === 'bn' 
            ? 'pNInz6obpgDQGcFmaJgB' // Adam (works for multiple languages)
            : 'EXAVITQu4vr4xnSDxMaL' // Sarah
          
          console.log(`[${jobId}] Calling ElevenLabs TTS with voice:`, voiceId)
          
          const audio = await elevenlabs.textToSpeech.convert(voiceId, {
            text: script,
            model_id: 'eleven_multilingual_v2'
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
      } else {
        // Google TTS or silent fallback
        console.log(`[${jobId}] Using silent audio fallback...`)
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
    } else if (voiceOption === 'upload' || voiceOption === 'clone') {
      // Use uploaded/recorded audio
      console.log(`[${jobId}] Using uploaded audio...`)
      
      if (voiceFile) {
        const buffer = Buffer.from(await voiceFile.arrayBuffer())
        await writeFile(audioPath, buffer)
        
        // For voice cloning, we'd call ElevenLabs voice cloning API here
        // For now, just use the uploaded audio directly
        if (voiceOption === 'clone') {
          console.log(`[${jobId}] Note: Voice cloning requires additional API setup`)
        }
      } else {
        throw new Error('Voice file is required for upload/clone option')
      }
    }

    // Verify audio file exists
    if (!existsSync(audioPath)) {
      throw new Error('Audio file was not created')
    }

    // Step 3: Concatenate video clips first without audio
    console.log(`[${jobId}] Step 3: Concatenating video clips...`)
    
    // Determine target height based on resolution
    const targetHeight = resolution === '4k' ? '2160' : resolution === '2k' ? '1440' : resolution === '1080p' ? '1080' : '720'
    
    // Calculate duration per clip
    const durationPerClip = duration / videoFiles.length
    console.log(`[${jobId}] Each clip will be ${durationPerClip.toFixed(2)} seconds`)
    
    const concatVideoPath = join(tempDir, 'concat.mp4')
    
    // Normalize and concatenate all clips
    // We need to re-encode to ensure all clips have same codec/resolution
    await new Promise((resolve, reject) => {
      const command = ffmpeg()
      
      // Add all video files as inputs
      videoFiles.forEach(file => {
        command.input(file)
      })
      
      // Build filter_complex to normalize, trim, and concatenate all clips
      const filterParts = []
      
      // For each clip: scale, trim to equal duration, set format
      for (let i = 0; i < videoFiles.length; i++) {
        filterParts.push(`[${i}:v]scale=-2:${targetHeight},trim=0:${durationPerClip},setpts=PTS-STARTPTS,fps=30,format=yuv420p[v${i}]`)
      }
      
      // Concatenate all normalized clips
      const concatInputs = videoFiles.map((_, i) => `[v${i}]`).join('')
      filterParts.push(`${concatInputs}concat=n=${videoFiles.length}:v=1:a=0[outv]`)
      
      const filterComplex = filterParts.join(';')
      
      command
        .complexFilter(filterComplex)
        .outputOptions([
          '-map', '[outv]',
          '-c:v', 'libx264',
          '-preset', 'ultrafast',
          '-crf', '28',
          '-pix_fmt', 'yuv420p',
          '-movflags', '+faststart'
        ])
        .output(concatVideoPath)
        .on('end', () => {
          console.log(`[${jobId}] Video clips concatenated`)
          resolve()
        })
        .on('error', (err) => {
          console.error(`[${jobId}] Concat error:`, err.message)
          reject(err)
        })
        .on('progress', (progress) => {
          console.log(`[${jobId}] Concatenating: ${Math.round(progress.percent || 0)}%`)
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
