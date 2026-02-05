import { NextResponse } from 'next/server'
import { spawn } from 'child_process'
import { writeFile, mkdir, readFile, unlink } from 'fs/promises'
import { existsSync } from 'fs'
import { join } from 'path'
import { randomUUID } from 'crypto'

export const maxDuration = 300
export const dynamic = 'force-dynamic'

// Detect scenes in video using FFmpeg
export async function POST(request) {
  const jobId = randomUUID()
  
  try {
    const { fileId, filePath, threshold = 0.3 } = await request.json()
    
    if (!fileId && !filePath) {
      return NextResponse.json({ success: false, error: 'fileId or filePath required' }, { status: 400 })
    }
    
    const videoPath = filePath 
      ? join('/app/public', filePath)
      : join('/app/public/video-editor/uploads', `${fileId}.mp4`)
    
    if (!existsSync(videoPath)) {
      return NextResponse.json({ success: false, error: 'Video file not found' }, { status: 404 })
    }
    
    // Get video duration first
    const durationResult = await new Promise((resolve, reject) => {
      const ffprobe = spawn('ffprobe', [
        '-v', 'error',
        '-show_entries', 'format=duration',
        '-of', 'default=noprint_wrappers=1:nokey=1',
        videoPath
      ])
      
      let stdout = ''
      ffprobe.stdout.on('data', (data) => { stdout += data.toString() })
      ffprobe.on('close', (code) => {
        if (code === 0) resolve(parseFloat(stdout.trim()))
        else reject(new Error('Failed to get duration'))
      })
    })
    
    const videoDuration = durationResult || 0
    // Use FFmpeg scene detection filter
    const scenesOutput = await new Promise((resolve, reject) => {
      const ffmpeg = spawn('ffmpeg', [
        '-i', videoPath,
        '-filter:v', `select='gt(scene,${threshold})',showinfo`,
        '-f', 'null',
        '-'
      ])
      
      let stderr = ''
      ffmpeg.stderr.on('data', (data) => { stderr += data.toString() })
      ffmpeg.on('close', (code) => {
        resolve(stderr) // Scene detection info comes through stderr
      })
      ffmpeg.on('error', reject)
    })
    
    // Parse scene detection output
    const scenes = []
    const regex = /pts_time:(\d+\.?\d*)/g
    let match
    let prevTime = 0
    
    while ((match = regex.exec(scenesOutput)) !== null) {
      const timestamp = parseFloat(match[1])
      if (timestamp > prevTime + 0.5) { // Minimum 0.5s between scenes
        scenes.push({
          id: scenes.length,
          start: prevTime,
          end: timestamp,
          duration: timestamp - prevTime
        })
        prevTime = timestamp
      }
    }
    
    // Add final scene
    if (videoDuration > prevTime) {
      scenes.push({
        id: scenes.length,
        start: prevTime,
        end: videoDuration,
        duration: videoDuration - prevTime
      })
    }
    
    // If no scenes detected, create default segments
    if (scenes.length === 0) {
      const segmentDuration = 5 // 5-second segments
      let currentTime = 0
      while (currentTime < videoDuration) {
        const endTime = Math.min(currentTime + segmentDuration, videoDuration)
        scenes.push({
          id: scenes.length,
          start: currentTime,
          end: endTime,
          duration: endTime - currentTime
        })
        currentTime = endTime
      }
    }
    
    // Generate thumbnails for each scene
    const thumbnailsDir = '/app/public/video-editor/thumbnails'
    await mkdir(thumbnailsDir, { recursive: true })
    
    const scenesWithThumbnails = await Promise.all(
      scenes.slice(0, 20).map(async (scene, index) => { // Limit to 20 thumbnails
        const thumbnailPath = join(thumbnailsDir, `${jobId}-scene-${index}.jpg`)
        const thumbnailTime = scene.start + (scene.duration / 2)
        
        try {
          await new Promise((resolve, reject) => {
            const ffmpeg = spawn('ffmpeg', [
              '-ss', String(thumbnailTime),
              '-i', videoPath,
              '-vframes', '1',
              '-vf', 'scale=320:-1',
              '-y',
              thumbnailPath
            ])
            ffmpeg.on('close', (code) => code === 0 ? resolve() : reject())
            ffmpeg.on('error', reject)
          })
          
          return {
            ...scene,
            thumbnail: `/video-editor/thumbnails/${jobId}-scene-${index}.jpg`
          }
        } catch (e) {
          return scene
        }
      })
    )
    
    return NextResponse.json({
      success: true,
      jobId,
      videoDuration,
      sceneCount: scenes.length,
      scenes: scenesWithThumbnails,
      threshold
    })
    
  } catch (error) {
    console.error(`[${jobId}] Scene detection error:`, error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
