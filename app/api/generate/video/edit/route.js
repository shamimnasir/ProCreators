import { NextResponse } from 'next/server'
import { writeFile, readFile, unlink } from 'fs/promises'
import { join } from 'path'
import { execSync } from 'child_process'
import { randomUUID } from 'crypto'

export async function POST(request) {
  try {
    const { videoUrl, trimStart, trimEnd, brightness, contrast, saturation } = await request.json()

    if (!videoUrl) {
      return NextResponse.json(
        { success: false, error: 'Video URL is required' },
        { status: 400 }
      )
    }

    // Download the video
    const videoResponse = await fetch(videoUrl)
    const videoBuffer = Buffer.from(await videoResponse.arrayBuffer())
    
    const inputPath = `/tmp/${randomUUID()}.mp4`
    const outputPath = `/tmp/${randomUUID()}.mp4`
    
    await writeFile(inputPath, videoBuffer)

    // Calculate trim times (assuming 30 second max video)
    const startTime = (trimStart / 100) * 30
    const endTime = (trimEnd / 100) * 30
    const duration = endTime - startTime

    // Build FFmpeg command
    let filterComplex = []
    
    // Color adjustments
    const brightnessValue = (brightness - 100) / 100
    const contrastValue = contrast / 100
    const saturationValue = saturation / 100
    
    filterComplex.push(`eq=brightness=${brightnessValue}:contrast=${contrastValue}:saturation=${saturationValue}`)
    
    const ffmpegCmd = `ffmpeg -i ${inputPath} -ss ${startTime} -t ${duration} -vf "${filterComplex.join(',')}" -c:v libx264 -preset fast -crf 23 ${outputPath}`
    
    console.log('[FFmpeg] Running:', ffmpegCmd)
    execSync(ffmpegCmd)

    // Read the edited video
    const editedVideo = await readFile(outputPath)
    const base64Video = editedVideo.toString('base64')
    const dataUrl = `data:video/mp4;base64,${base64Video}`

    // Cleanup
    await unlink(inputPath).catch(() => {})
    await unlink(outputPath).catch(() => {})

    return NextResponse.json({
      success: true,
      videoUrl: dataUrl,
      message: 'Video edited successfully'
    })

  } catch (error) {
    console.error('Video editing error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to edit video' },
      { status: 500 }
    )
  }
}
