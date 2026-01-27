import { NextResponse } from 'next/server'
import { spawn } from 'child_process'
import { mkdir, stat } from 'fs/promises'
import { join } from 'path'
import { randomUUID } from 'crypto'

export const maxDuration = 60
export const dynamic = 'force-dynamic'

const OUTPUT_DIR = '/app/public/video-editor/generated'

// Generate intro/outro clips with text and backgrounds
export async function POST(request) {
  const jobId = randomUUID()
  
  try {
    const body = await request.json()
    const {
      type = 'intro',
      duration = 3,
      text = '',
      subtext = '',
      textColor = '#FFFFFF',
      fontSize = 72,
      backgroundType = 'solid',
      backgroundColor = '#000000',
      gradientColors = ['#667eea', '#764ba2'],
      animationType = 'fade',
      width = 1920,
      height = 1080
    } = body
    
    await mkdir(OUTPUT_DIR, { recursive: true })
    
    console.log(`[${jobId}] Generating ${type} clip: "${text}" (${duration}s) ${width}x${height}`)
    
    const outputPath = join(OUTPUT_DIR, `${jobId}-${type}.mp4`)
    
    // Escape text for FFmpeg (simpler approach)
    const safeText = (text || 'Title').replace(/'/g, '').replace(/:/g, ' ').replace(/\\/g, '')
    const safeSubtext = (subtext || '').replace(/'/g, '').replace(/:/g, ' ').replace(/\\/g, '')
    
    // Convert hex color to FFmpeg format (remove #)
    const bgColor = backgroundColor.replace('#', '')
    const txtColor = textColor.replace('#', '')
    
    // Build filter based on background type
    let videoFilter = ''
    
    if (backgroundType === 'gradient') {
      const c1 = gradientColors[0].replace('#', '')
      const c2 = gradientColors[1].replace('#', '')
      // Simple gradient using geq
      videoFilter = `color=c=0x${c1}:s=${width}x${height}:d=${duration},format=yuv420p`
    } else if (backgroundType === 'animated') {
      // Color shifting background
      videoFilter = `color=c=0x${bgColor}:s=${width}x${height}:d=${duration},format=yuv420p,hue=H=2*PI*t/${duration}`
    } else if (backgroundType === 'particles') {
      // Starfield effect
      videoFilter = `color=c=black:s=${width}x${height}:d=${duration},format=yuv420p,noise=alls=20:allf=t`
    } else {
      // Solid color
      videoFilter = `color=c=0x${bgColor}:s=${width}x${height}:d=${duration},format=yuv420p`
    }
    
    // Calculate text position (centered)
    const textY = subtext ? `(h-text_h)/2-30` : `(h-text_h)/2`
    
    // Add text with fade animation
    let textFilter = ''
    if (animationType === 'fade') {
      textFilter = `drawtext=text='${safeText}':fontsize=${fontSize}:fontcolor=0x${txtColor}:x=(w-text_w)/2:y=${textY}:alpha='if(lt(t,0.5),t*2,if(gt(t,${duration-0.5}),(${duration}-t)*2,1))'`
    } else if (animationType === 'zoom') {
      textFilter = `drawtext=text='${safeText}':fontsize=${Math.floor(fontSize)}:fontcolor=0x${txtColor}:x=(w-text_w)/2:y=${textY}`
    } else if (animationType === 'slide') {
      textFilter = `drawtext=text='${safeText}':fontsize=${fontSize}:fontcolor=0x${txtColor}:x='min((w-text_w)/2,t*500-text_w)':y=${textY}`
    } else {
      textFilter = `drawtext=text='${safeText}':fontsize=${fontSize}:fontcolor=0x${txtColor}:x=(w-text_w)/2:y=${textY}`
    }
    
    // Add subtitle if present
    if (safeSubtext) {
      textFilter += `,drawtext=text='${safeSubtext}':fontsize=${Math.floor(fontSize*0.4)}:fontcolor=0x${txtColor}@0.8:x=(w-text_w)/2:y=(h/2)+50`
    }
    
    const fullFilter = `${videoFilter},${textFilter}`
    
    // Build FFmpeg command
    const args = [
      '-f', 'lavfi',
      '-i', `anullsrc=r=44100:cl=stereo:d=${duration}`,
      '-f', 'lavfi',
      '-i', fullFilter,
      '-map', '1:v',
      '-map', '0:a',
      '-c:v', 'libx264',
      '-preset', 'ultrafast',
      '-crf', '23',
      '-c:a', 'aac',
      '-b:a', '128k',
      '-t', String(duration),
      '-y',
      outputPath
    ]
    
    console.log(`[${jobId}] FFmpeg generate: ffmpeg ${args.slice(0, 8).join(' ')}...`)
    
    await runFFmpeg(args, jobId)
    
    const stats = await stat(outputPath)
    
    console.log(`[${jobId}] ✅ ${type} clip generated: ${Math.round(stats.size / 1024)}KB`)
    
    return NextResponse.json({
      success: true,
      jobId,
      type,
      filePath: `/video-editor/generated/${jobId}-${type}.mp4`,
      duration,
      fileSize: stats.size
    })
    
  } catch (error) {
    console.error(`[${jobId}] Generate clip error:`, error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

function runFFmpeg(args, jobId) {
  return new Promise((resolve, reject) => {
    const ffmpeg = spawn('ffmpeg', args)
    
    let stderr = ''
    ffmpeg.stderr.on('data', (data) => { 
      stderr += data.toString()
    })
    
    ffmpeg.on('close', (code) => {
      if (code === 0) {
        resolve()
      } else {
        console.error(`[${jobId}] FFmpeg error:`, stderr.slice(-800))
        reject(new Error(`FFmpeg failed with code ${code}`))
      }
    })
    
    ffmpeg.on('error', (err) => {
      reject(err)
    })
  })
}

export async function GET() {
  return NextResponse.json({
    success: true,
    templates: [
      { id: 'simple-fade', name: 'Simple Fade', backgroundType: 'solid', animationType: 'fade' },
      { id: 'gradient-slide', name: 'Gradient Slide', backgroundType: 'gradient', animationType: 'slide' },
      { id: 'animated-zoom', name: 'Animated Zoom', backgroundType: 'animated', animationType: 'zoom' },
      { id: 'particles-fade', name: 'Starfield', backgroundType: 'particles', animationType: 'fade' }
    ]
  })
}
