import { NextResponse } from 'next/server'
import { spawn } from 'child_process'
import { writeFile, mkdir, readFile, unlink } from 'fs/promises'
import { existsSync } from 'fs'
import { join } from 'path'
import { randomUUID } from 'crypto'

export const maxDuration = 300
export const dynamic = 'force-dynamic'

// Analyze audio: detect beats, loudness, silences
export async function POST(request) {
  const jobId = randomUUID()
  
  try {
    const { fileId, filePath, detectBeats = true, detectSilences = true } = await request.json()
    
    if (!fileId && !filePath) {
      return NextResponse.json({ success: false, error: 'fileId or filePath required' }, { status: 400 })
    }
    
    const videoPath = filePath 
      ? join('/app/public', filePath)
      : join('/app/public/video-editor/uploads', `${fileId}.mp4`)
    
    if (!existsSync(videoPath)) {
      return NextResponse.json({ success: false, error: 'Video file not found' }, { status: 404 })
    }
    
    console.log(`[${jobId}] Analyzing audio in: ${videoPath}`)
    
    const result = {
      beats: [],
      silences: [],
      loudnessInfo: null,
      duration: 0
    }
    
    // Get duration
    const duration = await new Promise((resolve, reject) => {
      const ffprobe = spawn('ffprobe', [
        '-v', 'error',
        '-show_entries', 'format=duration',
        '-of', 'default=noprint_wrappers=1:nokey=1',
        videoPath
      ])
      let stdout = ''
      ffprobe.stdout.on('data', (data) => { stdout += data.toString() })
      ffprobe.on('close', (code) => resolve(parseFloat(stdout.trim()) || 0))
    })
    result.duration = duration
    
    // Detect silences using FFmpeg silencedetect filter
    if (detectSilences) {
      console.log(`[${jobId}] Detecting silences...`)
      
      const silenceOutput = await new Promise((resolve, reject) => {
        const ffmpeg = spawn('ffmpeg', [
          '-i', videoPath,
          '-af', 'silencedetect=noise=-30dB:d=0.3',
          '-f', 'null',
          '-'
        ])
        
        let stderr = ''
        ffmpeg.stderr.on('data', (data) => { stderr += data.toString() })
        ffmpeg.on('close', () => resolve(stderr))
        ffmpeg.on('error', reject)
      })
      
      // Parse silence detection output
      const silenceStartRegex = /silence_start: (\d+\.?\d*)/g
      const silenceEndRegex = /silence_end: (\d+\.?\d*)/g
      
      const starts = []
      const ends = []
      
      let match
      while ((match = silenceStartRegex.exec(silenceOutput)) !== null) {
        starts.push(parseFloat(match[1]))
      }
      while ((match = silenceEndRegex.exec(silenceOutput)) !== null) {
        ends.push(parseFloat(match[1]))
      }
      
      for (let i = 0; i < Math.min(starts.length, ends.length); i++) {
        result.silences.push({
          id: i,
          start: starts[i],
          end: ends[i],
          duration: ends[i] - starts[i]
        })
      }
      
      console.log(`[${jobId}] Found ${result.silences.length} silences`)
    }
    
    // Detect beats using FFmpeg audio analysis
    if (detectBeats) {
      console.log(`[${jobId}] Detecting beats...`)
      
      // Use volume changes as beat approximation
      const beatOutput = await new Promise((resolve, reject) => {
        const ffmpeg = spawn('ffmpeg', [
          '-i', videoPath,
          '-af', 'asetnsamples=n=1024,astats=metadata=1:reset=1,ametadata=print:key=lavfi.astats.Overall.RMS_level:file=-',
          '-f', 'null',
          '-'
        ])
        
        let stdout = ''
        let stderr = ''
        ffmpeg.stdout.on('data', (data) => { stdout += data.toString() })
        ffmpeg.stderr.on('data', (data) => { stderr += data.toString() })
        ffmpeg.on('close', () => resolve({ stdout, stderr }))
        ffmpeg.on('error', reject)
      })
      
      // Parse beat detection - look for peaks in audio
      // This is a simplified beat detection - for production, use librosa or aubio
      const rmsRegex = /pts_time:(\d+\.?\d*).*?RMS_level=(-?\d+\.?\d*)/g
      const rmsValues = []
      
      let match
      const fullOutput = beatOutput.stdout + beatOutput.stderr
      while ((match = rmsRegex.exec(fullOutput)) !== null) {
        rmsValues.push({
          time: parseFloat(match[1]),
          rms: parseFloat(match[2])
        })
      }
      
      // If we couldn't detect beats via RMS, create evenly spaced markers
      if (rmsValues.length === 0) {
        // Create beat markers every 0.5 seconds as fallback
        const bpm = 120 // Assume 120 BPM as default
        const beatInterval = 60 / bpm
        let currentTime = 0
        let beatId = 0
        
        while (currentTime < duration) {
          result.beats.push({
            id: beatId++,
            time: currentTime,
            strength: 0.8
          })
          currentTime += beatInterval
        }
      } else {
        // Find peaks in RMS values
        const threshold = -20 // dB threshold for beat detection
        let lastBeatTime = -0.25
        
        for (let i = 1; i < rmsValues.length - 1; i++) {
          const prev = rmsValues[i - 1]
          const curr = rmsValues[i]
          const next = rmsValues[i + 1]
          
          // Detect peak
          if (curr.rms > prev.rms && curr.rms > next.rms && curr.rms > threshold) {
            if (curr.time - lastBeatTime > 0.25) { // Minimum 0.25s between beats
              result.beats.push({
                id: result.beats.length,
                time: curr.time,
                strength: Math.min(1, (curr.rms + 50) / 30) // Normalize strength
              })
              lastBeatTime = curr.time
            }
          }
        }
      }
      
      console.log(`[${jobId}] Found ${result.beats.length} beats`)
    }
    
    // Get loudness info
    const loudnessOutput = await new Promise((resolve, reject) => {
      const ffmpeg = spawn('ffmpeg', [
        '-i', videoPath,
        '-af', 'loudnorm=print_format=json',
        '-f', 'null',
        '-'
      ])
      
      let stderr = ''
      ffmpeg.stderr.on('data', (data) => { stderr += data.toString() })
      ffmpeg.on('close', () => resolve(stderr))
      ffmpeg.on('error', reject)
    })
    
    // Parse loudness JSON from output
    try {
      const jsonMatch = loudnessOutput.match(/\{[\s\S]*"input_i"[\s\S]*\}/)
      if (jsonMatch) {
        result.loudnessInfo = JSON.parse(jsonMatch[0])
      }
    } catch (e) {
      // Couldn't parse loudness info
    }
    
    console.log(`[${jobId}] ✅ Audio analysis complete`)
    
    return NextResponse.json({
      success: true,
      jobId,
      ...result
    })
    
  } catch (error) {
    console.error(`[${jobId}] Audio analysis error:`, error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
