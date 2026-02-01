import { NextResponse } from 'next/server'
import { writeFile, readFile, unlink, mkdir } from 'fs/promises'
import { join } from 'path'
import { exec } from 'child_process'
import { promisify } from 'util'
import { randomUUID } from 'crypto'
import { existsSync } from 'fs'

const execAsync = promisify(exec)

// Ensure tmp directory exists
const ensureTmpDir = async () => {
  const tmpDir = '/tmp/video-tools'
  if (!existsSync(tmpDir)) {
    await mkdir(tmpDir, { recursive: true })
  }
  return tmpDir
}

// Get video duration using ffprobe
const getVideoDuration = async (filePath) => {
  try {
    const { stdout } = await execAsync(
      `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${filePath}"`
    )
    return parseFloat(stdout.trim())
  } catch (error) {
    console.error('FFprobe error:', error)
    return 0
  }
}

// Get video info using ffprobe
const getVideoInfo = async (filePath) => {
  try {
    const { stdout } = await execAsync(
      `ffprobe -v error -select_streams v:0 -show_entries stream=width,height,r_frame_rate,codec_name -show_entries format=duration,size,bit_rate -of json "${filePath}"`
    )
    return JSON.parse(stdout)
  } catch (error) {
    console.error('FFprobe error:', error)
    return null
  }
}

export async function POST(request) {
  const tmpDir = await ensureTmpDir()
  const tempFiles = []
  
  try {
    const formData = await request.formData()
    const action = formData.get('action') || 'info'
    
    console.log(`[Video Tools] Action: ${action}`)
    
    if (action === 'info') {
      // Get video file info
      const videoFile = formData.get('video')
      if (!videoFile) {
        return NextResponse.json({ success: false, error: 'No video file provided' }, { status: 400 })
      }
      
      const buffer = Buffer.from(await videoFile.arrayBuffer())
      const ext = videoFile.name.split('.').pop() || 'mp4'
      const inputPath = join(tmpDir, `${randomUUID()}.${ext}`)
      tempFiles.push(inputPath)
      await writeFile(inputPath, buffer)
      
      const duration = await getVideoDuration(inputPath)
      const info = await getVideoInfo(inputPath)
      
      return NextResponse.json({
        success: true,
        duration,
        info,
        fileSize: buffer.length,
        fileName: videoFile.name
      })
      
    } else if (action === 'trim') {
      // Trim video
      const videoFile = formData.get('video')
      const startTime = parseFloat(formData.get('startTime') || '0')
      const endTime = parseFloat(formData.get('endTime') || '0')
      
      if (!videoFile) {
        return NextResponse.json({ success: false, error: 'No video file provided' }, { status: 400 })
      }
      
      const buffer = Buffer.from(await videoFile.arrayBuffer())
      const ext = videoFile.name.split('.').pop() || 'mp4'
      const inputPath = join(tmpDir, `${randomUUID()}.${ext}`)
      const outputPath = join(tmpDir, `${randomUUID()}.mp4`)
      tempFiles.push(inputPath, outputPath)
      
      await writeFile(inputPath, buffer)
      
      const duration = endTime - startTime
      
      if (duration <= 0) {
        return NextResponse.json({ success: false, error: 'Invalid trim range' }, { status: 400 })
      }
      
      // Use fast copy for simple trim, re-encode for accuracy
      const ffmpegCmd = `ffmpeg -y -ss ${startTime} -i "${inputPath}" -t ${duration} -c:v libx264 -preset fast -crf 23 -c:a aac -b:a 128k "${outputPath}"`
      
      console.log('[FFmpeg] Running trim:', ffmpegCmd)
      await execAsync(ffmpegCmd, { maxBuffer: 100 * 1024 * 1024 })
      
      const outputBuffer = await readFile(outputPath)
      const base64Video = outputBuffer.toString('base64')
      
      return NextResponse.json({
        success: true,
        videoUrl: `data:video/mp4;base64,${base64Video}`,
        duration: duration,
        fileSize: outputBuffer.length,
        message: `Trimmed video from ${startTime.toFixed(2)}s to ${endTime.toFixed(2)}s`
      })
      
    } else if (action === 'clip') {
      // Create multiple clips from one video
      const videoFile = formData.get('video')
      const clipsJson = formData.get('clips') // JSON array of {start, end} objects
      
      if (!videoFile || !clipsJson) {
        return NextResponse.json({ success: false, error: 'Video and clips data required' }, { status: 400 })
      }
      
      const clips = JSON.parse(clipsJson)
      if (!Array.isArray(clips) || clips.length === 0) {
        return NextResponse.json({ success: false, error: 'No clips defined' }, { status: 400 })
      }
      
      const buffer = Buffer.from(await videoFile.arrayBuffer())
      const ext = videoFile.name.split('.').pop() || 'mp4'
      const inputPath = join(tmpDir, `${randomUUID()}.${ext}`)
      tempFiles.push(inputPath)
      await writeFile(inputPath, buffer)
      
      const results = []
      
      for (let i = 0; i < clips.length; i++) {
        const clip = clips[i]
        const clipOutputPath = join(tmpDir, `${randomUUID()}_clip${i + 1}.mp4`)
        tempFiles.push(clipOutputPath)
        
        const duration = clip.end - clip.start
        const ffmpegCmd = `ffmpeg -y -ss ${clip.start} -i "${inputPath}" -t ${duration} -c:v libx264 -preset fast -crf 23 -c:a aac -b:a 128k "${clipOutputPath}"`
        
        console.log(`[FFmpeg] Creating clip ${i + 1}:`, ffmpegCmd)
        await execAsync(ffmpegCmd, { maxBuffer: 100 * 1024 * 1024 })
        
        const clipBuffer = await readFile(clipOutputPath)
        results.push({
          index: i + 1,
          start: clip.start,
          end: clip.end,
          duration: duration,
          videoUrl: `data:video/mp4;base64,${clipBuffer.toString('base64')}`,
          fileSize: clipBuffer.length
        })
      }
      
      return NextResponse.json({
        success: true,
        clips: results,
        message: `Created ${clips.length} clip(s)`
      })
      
    } else if (action === 'merge') {
      // Merge multiple video files
      const files = formData.getAll('video')
      
      if (files.length < 2) {
        return NextResponse.json({ success: false, error: 'At least 2 video files required for merge' }, { status: 400 })
      }
      
      const inputPaths = []
      const scaledPaths = []
      
      // Save all input files and get their info
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        const buffer = Buffer.from(await file.arrayBuffer())
        const ext = file.name.split('.').pop() || 'mp4'
        const path = join(tmpDir, `${randomUUID()}_input${i}.${ext}`)
        inputPaths.push(path)
        tempFiles.push(path)
        await writeFile(path, buffer)
      }
      
      // First, scale all videos to the same resolution (1080p) and re-encode for compatibility
      for (let i = 0; i < inputPaths.length; i++) {
        const scaledPath = join(tmpDir, `${randomUUID()}_scaled${i}.mp4`)
        scaledPaths.push(scaledPath)
        tempFiles.push(scaledPath)
        
        // Scale to 1080p, pad if necessary, normalize audio
        const scaleCmd = `ffmpeg -y -i "${inputPaths[i]}" -vf "scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2,setsar=1" -c:v libx264 -preset fast -crf 23 -r 30 -c:a aac -b:a 128k -ar 44100 -ac 2 "${scaledPath}"`
        
        console.log(`[FFmpeg] Scaling video ${i + 1}:`, scaleCmd)
        await execAsync(scaleCmd, { maxBuffer: 100 * 1024 * 1024 })
      }
      
      // Create concat file
      const concatFile = join(tmpDir, `${randomUUID()}.txt`)
      const concatContent = scaledPaths.map(p => `file '${p}'`).join('\n')
      await writeFile(concatFile, concatContent)
      tempFiles.push(concatFile)
      
      const outputPath = join(tmpDir, `${randomUUID()}_merged.mp4`)
      tempFiles.push(outputPath)
      
      // Merge using concat demuxer
      const mergeCmd = `ffmpeg -y -f concat -safe 0 -i "${concatFile}" -c copy "${outputPath}"`
      
      console.log('[FFmpeg] Running merge:', mergeCmd)
      await execAsync(mergeCmd, { maxBuffer: 200 * 1024 * 1024 })
      
      const outputBuffer = await readFile(outputPath)
      const duration = await getVideoDuration(outputPath)
      
      return NextResponse.json({
        success: true,
        videoUrl: `data:video/mp4;base64,${outputBuffer.toString('base64')}`,
        duration,
        fileSize: outputBuffer.length,
        message: `Merged ${files.length} videos`
      })
      
    } else if (action === 'split') {
      // Split video into equal parts
      const videoFile = formData.get('video')
      const parts = parseInt(formData.get('parts') || '2')
      
      if (!videoFile) {
        return NextResponse.json({ success: false, error: 'No video file provided' }, { status: 400 })
      }
      
      if (parts < 2 || parts > 10) {
        return NextResponse.json({ success: false, error: 'Parts must be between 2 and 10' }, { status: 400 })
      }
      
      const buffer = Buffer.from(await videoFile.arrayBuffer())
      const ext = videoFile.name.split('.').pop() || 'mp4'
      const inputPath = join(tmpDir, `${randomUUID()}.${ext}`)
      tempFiles.push(inputPath)
      await writeFile(inputPath, buffer)
      
      const totalDuration = await getVideoDuration(inputPath)
      const partDuration = totalDuration / parts
      
      const results = []
      
      for (let i = 0; i < parts; i++) {
        const startTime = i * partDuration
        const partOutputPath = join(tmpDir, `${randomUUID()}_part${i + 1}.mp4`)
        tempFiles.push(partOutputPath)
        
        const ffmpegCmd = `ffmpeg -y -ss ${startTime} -i "${inputPath}" -t ${partDuration} -c:v libx264 -preset fast -crf 23 -c:a aac -b:a 128k "${partOutputPath}"`
        
        console.log(`[FFmpeg] Creating part ${i + 1}:`, ffmpegCmd)
        await execAsync(ffmpegCmd, { maxBuffer: 100 * 1024 * 1024 })
        
        const partBuffer = await readFile(partOutputPath)
        results.push({
          index: i + 1,
          start: startTime,
          duration: partDuration,
          videoUrl: `data:video/mp4;base64,${partBuffer.toString('base64')}`,
          fileSize: partBuffer.length
        })
      }
      
      return NextResponse.json({
        success: true,
        parts: results,
        message: `Split into ${parts} parts`
      })
      
    } else {
      return NextResponse.json({ success: false, error: `Unknown action: ${action}` }, { status: 400 })
    }
    
  } catch (error) {
    console.error('[Video Tools] Error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Video processing failed' },
      { status: 500 }
    )
  } finally {
    // Cleanup temp files
    for (const file of tempFiles) {
      await unlink(file).catch(() => {})
    }
  }
}

export async function GET() {
  return NextResponse.json({
    success: true,
    actions: ['info', 'trim', 'clip', 'merge', 'split'],
    supportedFormats: ['mp4', 'mov', 'avi', 'mkv', 'webm'],
    maxFileSize: '100MB per file'
  })
}
