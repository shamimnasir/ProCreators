import { NextResponse } from 'next/server'
import { spawn } from 'child_process'
import { writeFile, mkdir, readFile, copyFile } from 'fs/promises'
import { existsSync, createReadStream } from 'fs'
import { join } from 'path'
import { randomUUID } from 'crypto'

export const maxDuration = 300
export const dynamic = 'force-dynamic'

const OUTPUT_DIR = '/app/public/video-editor/exports'

// Export video in different formats
export async function POST(request) {
  const jobId = randomUUID()
  
  try {
    const body = await request.json()
    const {
      filePath,       // Path to processed video
      format = 'mp4', // mp4, webm, mov, gif
      quality = 'high', // low, medium, high
      resolution = 'original', // 720p, 1080p, 4k, original
      includeAudio = true
    } = body
    
    if (!filePath) {
      return NextResponse.json({ success: false, error: 'filePath required' }, { status: 400 })
    }
    
    const inputPath = join('/app/public', filePath)
    
    if (!existsSync(inputPath)) {
      return NextResponse.json({ success: false, error: 'Source file not found' }, { status: 404 })
    }
    
    await mkdir(OUTPUT_DIR, { recursive: true })
    
    console.log(`[${jobId}] Exporting video: format=${format}, quality=${quality}, resolution=${resolution}`)
    
    // Build FFmpeg arguments based on settings
    const outputPath = join(OUTPUT_DIR, `${jobId}.${format}`)
    const args = ['-i', inputPath]
    
    // Resolution scaling
    const resolutionFilters = {
      '720p': 'scale=-2:720',
      '1080p': 'scale=-2:1080',
      '4k': 'scale=-2:2160',
      'original': null
    }
    
    // Quality settings
    const qualitySettings = {
      low: { crf: 28, audioBitrate: '96k' },
      medium: { crf: 23, audioBitrate: '128k' },
      high: { crf: 18, audioBitrate: '192k' }
    }
    
    const { crf, audioBitrate } = qualitySettings[quality] || qualitySettings.medium
    const scaleFilter = resolutionFilters[resolution]
    
    // Format-specific settings
    switch (format) {
      case 'webm':
        if (scaleFilter) args.push('-vf', scaleFilter)
        args.push(
          '-c:v', 'libvpx-vp9',
          '-crf', String(crf),
          '-b:v', '0'
        )
        if (includeAudio) {
          args.push('-c:a', 'libopus', '-b:a', audioBitrate)
        } else {
          args.push('-an')
        }
        break
        
      case 'mov':
        if (scaleFilter) args.push('-vf', scaleFilter)
        args.push(
          '-c:v', 'libx264',
          '-crf', String(crf),
          '-preset', 'fast',
          '-pix_fmt', 'yuv420p'
        )
        if (includeAudio) {
          args.push('-c:a', 'aac', '-b:a', audioBitrate)
        } else {
          args.push('-an')
        }
        break
        
      case 'gif':
        // GIF export (no audio, limited quality)
        const palette = `/tmp/${jobId}-palette.png`
        
        // Generate palette first
        await runFFmpeg([
          '-i', inputPath,
          '-vf', `${scaleFilter ? scaleFilter + ',' : ''}fps=10,scale=480:-1:flags=lanczos,palettegen`,
          '-y', palette
        ], jobId)
        
        // Create GIF with palette
        args.length = 0
        args.push(
          '-i', inputPath,
          '-i', palette,
          '-lavfi', `${scaleFilter ? scaleFilter + ',' : ''}fps=10,scale=480:-1:flags=lanczos[x];[x][1:v]paletteuse`,
          '-y', outputPath
        )
        
        await runFFmpeg(args, jobId)
        
        // Cleanup palette
        try { await require('fs/promises').unlink(palette) } catch (e) {}
        
        const gifStats = await require('fs/promises').stat(outputPath)
        return NextResponse.json({
          success: true,
          jobId,
          downloadUrl: `/video-editor/exports/${jobId}.gif`,
          format: 'gif',
          fileSize: gifStats.size
        })
        
      case 'mp4':
      default:
        if (scaleFilter) args.push('-vf', scaleFilter)
        args.push(
          '-c:v', 'libx264',
          '-crf', String(crf),
          '-preset', 'fast',
          '-pix_fmt', 'yuv420p',
          '-movflags', '+faststart'
        )
        if (includeAudio) {
          args.push('-c:a', 'aac', '-b:a', audioBitrate)
        } else {
          args.push('-an')
        }
    }
    
    args.push('-y', outputPath)
    
    await runFFmpeg(args, jobId)
    
    const stats = await require('fs/promises').stat(outputPath)
    
    console.log(`[${jobId}] ✅ Export complete: ${Math.round(stats.size / 1024 / 1024)}MB`)
    
    return NextResponse.json({
      success: true,
      jobId,
      downloadUrl: `/video-editor/exports/${jobId}.${format}`,
      format,
      quality,
      resolution,
      fileSize: stats.size
    })
    
  } catch (error) {
    console.error(`[${jobId}] Export error:`, error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

// Helper: Run FFmpeg command
async function runFFmpeg(args, jobId) {
  return new Promise((resolve, reject) => {
    console.log(`[${jobId}] FFmpeg export:`, args.slice(0, 8).join(' '), '...')
    
    const ffmpeg = spawn('ffmpeg', args)
    
    let stderr = ''
    ffmpeg.stderr.on('data', (data) => { stderr += data.toString() })
    
    ffmpeg.on('close', (code) => {
      if (code === 0) {
        resolve()
      } else {
        console.error(`[${jobId}] FFmpeg error:`, stderr.slice(-500))
        reject(new Error(`FFmpeg failed with code ${code}`))
      }
    })
    
    ffmpeg.on('error', reject)
  })
}

// GET: Check export status or download
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const jobId = searchParams.get('jobId')
    const format = searchParams.get('format') || 'mp4'
    
    if (!jobId) {
      return NextResponse.json({ success: false, error: 'jobId required' }, { status: 400 })
    }
    
    const filePath = join(OUTPUT_DIR, `${jobId}.${format}`)
    
    if (!existsSync(filePath)) {
      return NextResponse.json({ success: false, error: 'Export not found' }, { status: 404 })
    }
    
    const stats = await require('fs/promises').stat(filePath)
    
    return NextResponse.json({
      success: true,
      downloadUrl: `/video-editor/exports/${jobId}.${format}`,
      fileSize: stats.size
    })
    
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
