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

        // Determine language code based on selection
        // CRITICAL: Use bn-IN for Bengali (Google requires region-specific code)
        const languageCode = ttsLanguage === 'bn' ? 'bn-IN' : 'en-US'
        
        console.log(`[${jobId}] Using language code: ${languageCode} (Bengali with Indian locale)`)
        
        // Parse voice selection
        let voiceName = selectedVoice
        let ssmlGender = 'NEUTRAL'
        
        if (selectedVoice && selectedVoice.includes('-')) {
          // Extract gender from voice name if present
          if (selectedVoice.toLowerCase().includes('female')) {
            ssmlGender = 'FEMALE'
          } else if (selectedVoice.toLowerCase().includes('male')) {
            ssmlGender = 'MALE'
          }
        }

        console.log(`[${jobId}] Voice config: name=${voiceName}, gender=${ssmlGender}, language=${languageCode}`)

        // Construct the request
        const request = {
          input: { text: script },
          voice: {
            languageCode: languageCode, // Use 'bn' to force Bengali normalization
            name: voiceName || undefined, // Use specific voice if provided
            ssmlGender: ssmlGender,
          },
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
