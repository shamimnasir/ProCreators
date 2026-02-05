import { NextResponse } from 'next/server'
import { spawn } from 'child_process'
import { mkdir, writeFile, unlink } from 'fs/promises'
import { existsSync } from 'fs'
import { join } from 'path'
import { randomUUID } from 'crypto'

export const maxDuration = 300
export const dynamic = 'force-dynamic'

// Fast analysis endpoint - returns quick results without heavy processing
export async function POST(request) {
  const jobId = randomUUID()
  
  try {
    const { fileId, filePath, skipThumbnails = true } = await request.json()
    
    if (!fileId && !filePath) {
      return NextResponse.json({ success: false, error: 'fileId or filePath required' }, { status: 400 })
    }
    
    const videoPath = filePath 
      ? join('/app/public', filePath)
      : join('/app/public/video-editor/uploads', `${fileId}.mp4`)
    
    if (!existsSync(videoPath)) {
      return NextResponse.json({ success: false, error: 'Video file not found' }, { status: 404 })
    }
    
    // Get video info quickly
    const videoInfo = await getVideoInfo(videoPath)
    // Quick scene detection with timeout
    const scenes = await detectScenesQuick(videoPath, videoInfo.duration, jobId)
    
    return NextResponse.json({
      success: true,
      jobId,
      videoDuration: videoInfo.duration,
      width: videoInfo.width,
      height: videoInfo.height,
      sceneCount: scenes.length,
      scenes
    })
    
  } catch (error) {
    console.error(`[${jobId}] Fast analysis error:`, error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

// Quick scene detection without thumbnails
async function detectScenesQuick(videoPath, duration, jobId) {
  return new Promise((resolve) => {
    const scenes = []
    
    // Set a timeout - if FFmpeg takes too long, return time-based segments
    const timeout = setTimeout(() => {
      resolve(createTimeBasedSegments(duration))
    }, 15000) // 15 second timeout
    
    const ffmpeg = spawn('ffmpeg', [
      '-i', videoPath,
      '-vf', 'select=gt(scene\\,0.3),showinfo',
      '-vsync', 'vfr',
      '-f', 'null',
      '-'
    ])
    
    let stderr = ''
    
    ffmpeg.stderr.on('data', (data) => {
      stderr += data.toString()
    })
    
    ffmpeg.on('close', (code) => {
      clearTimeout(timeout)
      
      // Parse scene timestamps
      const regex = /pts_time:(\d+\.?\d*)/g
      let match
      let prevTime = 0
      
      while ((match = regex.exec(stderr)) !== null) {
        const timestamp = parseFloat(match[1])
        if (timestamp > prevTime + 1) { // Min 1 second gap
          scenes.push({
            id: scenes.length,
            start: prevTime,
            end: timestamp,
            duration: timestamp - prevTime
          })
          prevTime = timestamp
        }
      }
      
      // Add final segment
      if (duration > prevTime) {
        scenes.push({
          id: scenes.length,
          start: prevTime,
          end: duration,
          duration: duration - prevTime
        })
      }
      
      // If no scenes found, create time-based segments
      if (scenes.length === 0) {
        resolve(createTimeBasedSegments(duration))
      } else {
        resolve(scenes)
      }
    })
    
    ffmpeg.on('error', () => {
      clearTimeout(timeout)
      resolve(createTimeBasedSegments(duration))
    })
  })
}

// Create time-based segments as fallback
function createTimeBasedSegments(duration) {
  const scenes = []
  const segmentDuration = 5 // 5 seconds per segment
  let currentTime = 0
  
  while (currentTime < duration) {
    const endTime = Math.min(currentTime + segmentDuration, duration)
    scenes.push({
      id: scenes.length,
      start: currentTime,
      end: endTime,
      duration: endTime - currentTime
    })
    currentTime = endTime
  }
  
  return scenes
}

// Get video info quickly
async function getVideoInfo(videoPath) {
  return new Promise((resolve) => {
    const ffprobe = spawn('ffprobe', [
      '-v', 'error',
      '-select_streams', 'v:0',
      '-show_entries', 'stream=width,height:format=duration',
      '-of', 'json',
      videoPath
    ])
    
    let stdout = ''
    ffprobe.stdout.on('data', (data) => { stdout += data.toString() })
    
    ffprobe.on('close', () => {
      try {
        const data = JSON.parse(stdout)
        const stream = data.streams?.[0] || {}
        resolve({
          width: stream.width || 1920,
          height: stream.height || 1080,
          duration: parseFloat(data.format?.duration) || 30
        })
      } catch (e) {
        resolve({ width: 1920, height: 1080, duration: 30 })
      }
    })
    
    ffprobe.on('error', () => {
      resolve({ width: 1920, height: 1080, duration: 30 })
    })
  })
}
