import { NextResponse } from 'next/server'
import { writeFile, readFile, unlink } from 'fs/promises'
import { join } from 'path'
import { exec } from 'child_process'
import { promisify } from 'util'
import { randomUUID } from 'crypto'
import { enforceRateLimit } from '@/lib/rate-limiter'

const execAsync = promisify(exec)

export async function POST(request) {
  let inputPath = null
  let outputPath = null
  
  try {
    // SECURITY: Rate limiting for content generation
    const rateLimitCheck = await enforceRateLimit(request, 'content_generate')
    if (rateLimitCheck.limited) {
      return rateLimitCheck.response
    }

    const { videoUrl, trimStart, trimEnd, brightness, contrast, saturation } = await request.json()

    if (!videoUrl) {
      return NextResponse.json(
        { success: false, error: 'Video URL is required' },
        { status: 400 }
      )
    }

    // Download the video
    const videoResponse = await fetch(videoUrl)
    if (!videoResponse.ok) {
      throw new Error(`Failed to download video: ${videoResponse.status}`)
    }
    
    const videoBuffer = Buffer.from(await videoResponse.arrayBuffer())
    inputPath = `/tmp/${randomUUID()}.mp4`
    outputPath = `/tmp/${randomUUID()}.mp4`
    
    await writeFile(inputPath, videoBuffer)
    // Get actual video duration using ffprobe
    const probeCmd = `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${inputPath}"`
    const { stdout: durationOutput } = await execAsync(probeCmd)
    const videoDuration = parseFloat(durationOutput.trim())
    if (!videoDuration || videoDuration <= 0) {
      throw new Error('Could not determine video duration')
    }

    // Calculate trim times based on actual video duration
    const startTime = (trimStart / 100) * videoDuration
    const endTime = (trimEnd / 100) * videoDuration
    const duration = endTime - startTime

    if (duration <= 0) {
      throw new Error('Invalid trim range: end time must be after start time')
    }

    // Build FFmpeg command with filters
    let filterComplex = []
    
    // Color adjustments (convert percentages to ffmpeg values)
    const brightnessValue = (brightness - 100) / 100  // 100% = 0, 150% = 0.5, 50% = -0.5
    const contrastValue = contrast / 100               // 100% = 1, 150% = 1.5, 50% = 0.5
    const saturationValue = saturation / 100           // 100% = 1, 200% = 2, 0% = 0
    
    filterComplex.push(`eq=brightness=${brightnessValue}:contrast=${contrastValue}:saturation=${saturationValue}`)
    
    // Build the complete ffmpeg command
    // -ss before -i for faster seeking, -t for duration
    const ffmpegCmd = `ffmpeg -y -ss ${startTime} -i "${inputPath}" -t ${duration} -vf "${filterComplex.join(',')}" -c:v libx264 -preset fast -crf 23 -c:a copy "${outputPath}"`
    
    // Execute ffmpeg with proper error handling
    try {
      const { stderr } = await execAsync(ffmpegCmd, { maxBuffer: 10 * 1024 * 1024 })
      if (stderr) {
        // Log stderr if needed
      }
    } catch (execError) {
      console.error('[FFmpeg] Execution error:', execError.message)
      console.error('[FFmpeg] stderr:', execError.stderr?.substring(0, 500))
      throw new Error(`FFmpeg processing failed: ${execError.message}`)
    }

    // Read the edited video
    const editedVideo = await readFile(outputPath)
    if (editedVideo.length === 0) {
      throw new Error('Edited video is empty')
    }
    
    // Convert to base64 data URL for immediate use
    const base64Video = editedVideo.toString('base64')
    const dataUrl = `data:video/mp4;base64,${base64Video}`

    // Cleanup
    await unlink(inputPath).catch(() => {})
    await unlink(outputPath).catch(() => {})

    return NextResponse.json({
      success: true,
      videoUrl: dataUrl,
      message: 'Video edited successfully',
      details: {
        originalDuration: videoDuration,
        trimmedDuration: duration,
        appliedFilters: { brightness, contrast, saturation }
      }
    })

  } catch (error) {
    console.error('[Video Edit] Error:', error)
    
    // Cleanup on error
    if (inputPath) await unlink(inputPath).catch(() => {})
    if (outputPath) await unlink(outputPath).catch(() => {})
    
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to edit video' },
      { status: 500 }
    )
  }
}
