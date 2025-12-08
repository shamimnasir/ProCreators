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

export const maxDuration = 120 // 2 minutes timeout for preview
export const dynamic = 'force-dynamic'

export async function POST(request) {
  const jobId = randomUUID()
  const tempDir = `/tmp/story-reels-preview-${jobId}`
  
  try {
    console.log(`[Preview ${jobId}] Starting preview generation...`)
    
    // Create temp directory
    await mkdir(tempDir, { recursive: true })
    
    // Parse form data
    const formData = await request.formData()
    const script = formData.get('script')
    const duration = parseInt(formData.get('duration'))
    const voiceOption = formData.get('voiceOption') || 'tts'
    const ttsLanguage = formData.get('ttsLanguage')
    const selectedVoice = formData.get('selectedVoice')
    const voiceFile = formData.get('voiceFile')
    const stockVideos = JSON.parse(formData.get('stockVideos'))

    console.log(`[Preview ${jobId}] Config:`, { duration, voiceOption, ttsLanguage, selectedVoice })

    // Step 1: Download stock videos (using streams)
    console.log(`[Preview ${jobId}] Downloading ${stockVideos.length} videos...`)
    const videoFiles = []
    const { Readable } = require('stream')
    const { pipeline } = require('stream/promises')
    
    for (let i = 0; i < stockVideos.length; i++) {
      const video = stockVideos[i]
      const videoPath = join(tempDir, `clip-${i}.mp4`)
      
      try {
        const response = await fetch(video.url)
        if (!response.ok) throw new Error(`HTTP ${response.status}`)
        
        const fileStream = require('fs').createWriteStream(videoPath)
        await pipeline(Readable.fromWeb(response.body), fileStream)
        
        videoFiles.push(videoPath)
        console.log(`[Preview ${jobId}] Downloaded clip ${i + 1}/${stockVideos.length}`)
      } catch (error) {
        console.error(`[Preview ${jobId}] Error downloading clip ${i}:`, error.message)
      }
    }

    if (videoFiles.length === 0) {
      throw new Error('Failed to download any stock videos')
    }

    // Step 2: Generate TTS audio
    console.log(`[Preview ${jobId}] Generating TTS audio...`)
    const audioPath = join(tempDir, 'voice.mp3')
    
    try {
      const client = new textToSpeech.TextToSpeechClient({
        keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS
      })

      let voiceName = selectedVoice
      let languageCode = ttsLanguage === 'bn' ? 'bn-IN' : 'en-US'
      
      if (selectedVoice && selectedVoice.includes('-')) {
        const parts = selectedVoice.split('-')
        if (parts.length >= 2) {
          languageCode = `${parts[0]}-${parts[1]}`
        }
      }

      const voiceConfig = { languageCode }
      
      if (voiceName) {
        voiceConfig.name = voiceName
        if (voiceName.includes('Studio') || voiceName.includes('Chirp3-HD') || voiceName.includes('Chirp-HD')) {
          voiceConfig.model = voiceName
        }
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

      console.log(`[Preview ${jobId}] Calling Google Cloud TTS...`)
      const [response] = await client.synthesizeSpeech(request)
      await writeFile(audioPath, response.audioContent, 'binary')
      
      console.log(`[Preview ${jobId}] TTS generated successfully`)
    } catch (error) {
      console.error(`[Preview ${jobId}] TTS failed:`, error.message)
      // Create silent audio as fallback
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

    // Step 3: Get actual audio duration
    const actualAudioDuration = await new Promise((resolve, reject) => {
      ffmpeg.ffprobe(audioPath, (err, metadata) => {
        if (err) {
          resolve(duration)
        } else {
          resolve(metadata.format.duration)
        }
      })
    })

    // Step 4: Create PREVIEW video (720p, fast encoding)
    console.log(`[Preview ${jobId}] Creating preview video (720p)...`)
    
    const durationPerClip = actualAudioDuration / videoFiles.length
    const normalizedFiles = []
    
    // Normalize clips to 720p for preview
    for (let i = 0; i < videoFiles.length; i++) {
      const normalizedPath = join(tempDir, `normalized-${i}.mp4`)
      
      await new Promise((resolve, reject) => {
        ffmpeg(videoFiles[i])
          .outputOptions([
            '-vf', 'scale=-2:720,fps=30',  // 720p preview
            '-t', String(durationPerClip),
            '-c:v', 'libx264',
            '-preset', 'ultrafast',  // Fast encoding for preview
            '-crf', '28',
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
    
    // Concatenate clips
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
          '-preset', 'ultrafast',
          '-crf', '28',
          '-pix_fmt', 'yuv420p'
        ])
        .output(concatVideoPath)
        .on('end', resolve)
        .on('error', reject)
        .run()
    })

    // Step 5: Add audio to video (no captions yet - will be CSS overlay)
    console.log(`[Preview ${jobId}] Adding audio to preview...`)
    const previewVideoPath = join(tempDir, 'preview.mp4')
    
    await new Promise((resolve, reject) => {
      ffmpeg()
        .input(concatVideoPath)
        .input(audioPath)
        .outputOptions([
          '-c:v', 'copy',  // Just copy video (no re-encoding)
          '-c:a', 'aac',
          '-b:a', '128k',
          '-movflags', '+faststart',
          '-map', '0:v:0',
          '-map', '1:a:0',
          '-shortest'
        ])
        .output(previewVideoPath)
        .on('end', resolve)
        .on('error', reject)
        .run()
    })

    // Step 6: Save to public folder
    console.log(`[Preview ${jobId}] Saving preview...`)
    const videoBuffer = await require('fs/promises').readFile(previewVideoPath)
    const audioBuffer = await require('fs/promises').readFile(audioPath)
    
    const publicDir = '/app/public/story-reels-preview'
    if (!existsSync(publicDir)) {
      await mkdir(publicDir, { recursive: true })
    }
    
    const publicVideoPath = join(publicDir, `${jobId}.mp4`)
    const publicAudioPath = join(publicDir, `${jobId}-audio.mp3`)
    
    await writeFile(publicVideoPath, videoBuffer)
    await writeFile(publicAudioPath, audioBuffer)
    
    const videoUrl = `/story-reels-preview/${jobId}.mp4`
    const audioUrl = `/story-reels-preview/${jobId}-audio.mp3`

    // Generate caption data (timing info)
    const words = script.split(/\s+/).filter(w => w.length > 0)
    const wordsPerSecond = words.length / actualAudioDuration
    const captionData = []
    
    let currentTime = 0
    for (let i = 0; i < words.length; i += 3) {
      const chunk = words.slice(i, i + 3).join(' ')
      const wordCount = Math.min(3, words.length - i)
      const chunkDuration = wordCount / wordsPerSecond
      
      captionData.push({
        text: chunk,
        startTime: currentTime,
        endTime: currentTime + chunkDuration
      })
      
      currentTime += chunkDuration
    }

    // Cleanup temp files
    console.log(`[Preview ${jobId}] Cleaning up...`)
    try {
      for (const file of [...videoFiles, ...normalizedFiles]) {
        await unlink(file).catch(() => {})
      }
      await unlink(audioPath).catch(() => {})
      await unlink(concatVideoPath).catch(() => {})
      await unlink(previewVideoPath).catch(() => {})
      await unlink(clipListPath).catch(() => {})
    } catch (e) {
      console.log(`[Preview ${jobId}] Cleanup warning:`, e.message)
    }

    console.log(`[Preview ${jobId}] Preview generation complete!`)

    return NextResponse.json({
      success: true,
      previewId: jobId,
      videoUrl,
      audioUrl,
      duration: actualAudioDuration,
      captionData,
      resolution: '720p',
      message: 'Preview generated successfully!'
    })

  } catch (error) {
    console.error(`[Preview ${jobId}] Error:`, error)
    
    try {
      await require('fs/promises').rm(tempDir, { recursive: true, force: true })
    } catch (e) {
      console.log(`[Preview ${jobId}] Cleanup error:`, e.message)
    }

    return NextResponse.json(
      { success: false, error: error.message || 'Failed to generate preview' },
      { status: 500 }
    )
  }
}
