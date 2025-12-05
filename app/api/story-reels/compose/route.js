import { NextResponse } from 'next/server'
import { writeFile, unlink, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import { join } from 'path'
import { randomUUID } from 'crypto'
import ffmpeg from 'fluent-ffmpeg'
import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js'

export const maxDuration = 300 // 5 minutes timeout

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
      } else {
        // Google TTS fallback - simple implementation
        console.log(`[${jobId}] Using simple TTS fallback...`)
        // For now, create a silent audio file as placeholder
        await new Promise((resolve, reject) => {
          ffmpeg()
            .input('anullsrc=r=44100:cl=stereo')
            .inputFormat('lavfi')
            .duration(duration)
            .audioCodec('libmp3lame')
            .save(audioPath)
            .on('end', resolve)
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

    // Step 3: Create video clips list for concatenation
    console.log(`[${jobId}] Step 3: Preparing video clips...`)
    const clipListPath = join(tempDir, 'clips.txt')
    const clipListContent = videoFiles.map(file => `file '${file}'`).join('\n')
    await writeFile(clipListPath, clipListContent)

    // Step 4: Concatenate videos and add audio
    console.log(`[${jobId}] Step 4: Composing final video...`)
    const concatVideoPath = join(tempDir, 'concat.mp4')
    
    await new Promise((resolve, reject) => {
      ffmpeg()
        .input(clipListPath)
        .inputOptions(['-f', 'concat', '-safe', '0'])
        .input(audioPath)
        .outputOptions([
          '-c:v', 'libx264',
          '-preset', 'fast',
          '-crf', '23',
          '-c:a', 'aac',
          '-shortest', // Cut video to audio length
          '-vf', `scale=-2:${resolution === '4k' ? '2160' : resolution === '2k' ? '1440' : resolution === '1080p' ? '1080' : '720'}`
        ])
        .output(concatVideoPath)
        .on('end', () => {
          console.log(`[${jobId}] Video concatenation complete`)
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

    // Step 5: Add captions
    console.log(`[${jobId}] Step 5: Adding captions...`)
    const finalVideoPath = join(tempDir, 'final.mp4')
    
    // Generate SRT captions
    const captionsPath = join(tempDir, 'captions.srt')
    const captionLines = generateCaptions(script, duration)
    await writeFile(captionsPath, captionLines)

    // Caption style mapping
    const captionFilters = {
      'bold-outline': "FontName=Arial,FontSize=24,Bold=1,Outline=2,OutlineColour=&H00000000,BorderStyle=1",
      'karaoke': "FontName=Arial,FontSize=28,Bold=1,PrimaryColour=&H00FFFF00,Karaoke=1",
      'animated': "FontName=Arial,FontSize=26,Bold=1,PrimaryColour=&H00FFFFFF,Outline=2"
    }

    await new Promise((resolve, reject) => {
      ffmpeg(concatVideoPath)
        .outputOptions([
          '-vf', `subtitles=${captionsPath}:force_style='${captionFilters[captionStyle] || captionFilters['bold-outline']}'`,
          '-c:a', 'copy'
        ])
        .output(finalVideoPath)
        .on('end', () => {
          console.log(`[${jobId}] Captions added successfully`)
          resolve()
        })
        .on('error', (err) => {
          console.error(`[${jobId}] Caption error:`, err.message)
          // If captions fail, use video without captions
          resolve()
        })
        .run()
    })

    // Step 6: Read final video
    console.log(`[${jobId}] Step 6: Finalizing...`)
    const outputPath = existsSync(finalVideoPath) ? finalVideoPath : concatVideoPath
    const videoBuffer = await require('fs/promises').readFile(outputPath)
    const base64Video = videoBuffer.toString('base64')
    const videoDataUrl = `data:video/mp4;base64,${base64Video}`

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

    console.log(`[${jobId}] Video composition complete!`)

    return NextResponse.json({
      success: true,
      videoUrl: videoDataUrl,
      captionsUrl: null, // Would be a URL to uploaded SRT file
      jobId,
      duration,
      resolution,
      clipCount: videoFiles.length,
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
