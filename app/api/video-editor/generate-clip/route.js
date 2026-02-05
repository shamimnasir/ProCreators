import { NextResponse } from 'next/server'
import { spawn } from 'child_process'
import { mkdir, stat } from 'fs/promises'
import { join } from 'path'
import { randomUUID } from 'crypto'

export const maxDuration = 60
export const dynamic = 'force-dynamic'

const OUTPUT_DIR = '/app/public/video-editor/generated'

// Font paths for different scripts
const FONTS = {
  bengali: '/usr/share/fonts/truetype/noto/NotoSansBengali-Regular.ttf',
  default: '/usr/share/fonts/truetype/noto/NotoSans-Regular.ttf',
  fallback: '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'
}

// Detect if text contains Bengali characters
function containsBengali(text) {
  return /[\u0980-\u09FF]/.test(text)
}

// Get appropriate font for text
function getFontPath(text) {
  if (containsBengali(text)) {
    return FONTS.bengali
  }
  return FONTS.default
}

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
    
    }..." (${duration}s) ${width}x${height}`)
    
    const outputPath = join(OUTPUT_DIR, `${jobId}-${type}.mp4`)
    
    // Convert hex color to FFmpeg format
    const bgColor = backgroundColor.replace('#', '')
    const txtColor = textColor.replace('#', '')
    
    // Get font that supports the text
    const fontPath = getFontPath(text + subtext)
    // Calculate font size based on text length and width to prevent overflow
    let adjustedFontSize = fontSize
    const textLength = text.length
    const maxCharsPerLine = Math.floor(width / (fontSize * 0.6))
    if (textLength > maxCharsPerLine) {
      adjustedFontSize = Math.floor(fontSize * (maxCharsPerLine / textLength) * 0.9)
      adjustedFontSize = Math.max(adjustedFontSize, 24) // Minimum size
    }
    
    // Build video filter based on background type
    let videoSource = ''
    if (backgroundType === 'gradient') {
      const c1 = gradientColors[0].replace('#', '')
      const c2 = gradientColors[1].replace('#', '')
      videoSource = `color=c=0x${c1}:s=${width}x${height}:d=${duration},format=yuv420p`
    } else if (backgroundType === 'animated') {
      videoSource = `color=c=0x${bgColor}:s=${width}x${height}:d=${duration},format=yuv420p,hue=H=2*PI*t/${duration}`
    } else if (backgroundType === 'particles') {
      videoSource = `color=c=black:s=${width}x${height}:d=${duration},format=yuv420p,noise=alls=20:allf=t`
    } else {
      videoSource = `color=c=0x${bgColor}:s=${width}x${height}:d=${duration},format=yuv420p`
    }
    
    // Calculate text position (centered with margin)
    const textY = subtext ? `(h-text_h)/2-40` : `(h-text_h)/2`
    const margin = Math.floor(width * 0.1) // 10% margin on each side
    
    // Escape text for FFmpeg - handle special characters
    const safeText = escapeFFmpegText(text || 'Title')
    const safeSubtext = escapeFFmpegText(subtext || '')
    
    // Build text filter with font file
    let textFilter = ''
    
    // Add fade animation for text
    let alphaExpr = ''
    if (animationType === 'fade') {
      alphaExpr = `:alpha='if(lt(t,0.5),t*2,if(gt(t,${duration-0.5}),(${duration}-t)*2,1))'`
    }
    
    // Main text with proper font and text wrapping
    textFilter = `drawtext=fontfile='${fontPath}':text='${safeText}':fontsize=${adjustedFontSize}:fontcolor=0x${txtColor}:x=(w-text_w)/2:y=${textY}:borderw=3:bordercolor=0x000000${alphaExpr}`
    
    // Add subtitle if present
    if (safeSubtext) {
      const subtitleSize = Math.floor(adjustedFontSize * 0.5)
      const subFontPath = getFontPath(subtext)
      textFilter += `,drawtext=fontfile='${subFontPath}':text='${safeSubtext}':fontsize=${subtitleSize}:fontcolor=0x${txtColor}@0.8:x=(w-text_w)/2:y=(h/2)+60:borderw=2:bordercolor=0x000000`
    }
    
    const fullFilter = `${videoSource},${textFilter}`
    
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
    
    }...`)
    
    await runFFmpeg(args, jobId)
    
    const stats = await stat(outputPath)
    
    }KB`)
    
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

// Escape text for FFmpeg drawtext filter
function escapeFFmpegText(text) {
  if (!text) return ''
  return text
    .replace(/\\/g, '\\\\\\\\')
    .replace(/'/g, "\\'")
    .replace(/:/g, '\\:')
    .replace(/%/g, '\\%')
    .replace(/\n/g, ' ')
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
        console.error(`[${jobId}] FFmpeg error:`, stderr.slice(-1000))
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
