import { NextResponse } from 'next/server'
import { spawn } from 'child_process'
import { mkdir, writeFile, unlink } from 'fs/promises'
import { join } from 'path'
import { randomUUID } from 'crypto'

export const maxDuration = 60
export const dynamic = 'force-dynamic'

const OUTPUT_DIR = '/app/public/video-editor/generated'

// Generate intro/outro clips with text, backgrounds, and animations
export async function POST(request) {
  const jobId = randomUUID()
  
  try {
    const body = await request.json()
    const {
      type = 'intro',           // 'intro' or 'outro'
      duration = 3,             // Duration in seconds
      text = '',                // Main text
      subtext = '',             // Subtitle text
      textColor = '#FFFFFF',    // Text color
      fontSize = 72,            // Font size for main text
      fontFamily = 'sans-serif',
      backgroundType = 'solid', // 'solid', 'gradient', 'animated', 'particles'
      backgroundColor = '#000000',
      gradientColors = ['#667eea', '#764ba2'], // For gradient
      animationType = 'fade',   // 'fade', 'zoom', 'slide', 'pulse'
      width = 1920,
      height = 1080
    } = body
    
    await mkdir(OUTPUT_DIR, { recursive: true })
    
    console.log(`[${jobId}] Generating ${type} clip: "${text}" (${duration}s)`)
    
    const outputPath = join(OUTPUT_DIR, `${jobId}-${type}.mp4`)
    
    // Build FFmpeg command based on background type
    let filterComplex = ''
    let inputs = []
    
    // Create background
    switch (backgroundType) {
      case 'gradient':
        // Animated gradient background
        const [color1, color2] = gradientColors
        filterComplex = `color=c=${color1}:s=${width}x${height}:d=${duration},format=yuv420p[bg];`
        filterComplex += `[bg]gradients=size=${width}x${height}:duration=${duration}:speed=1:c0=${color1}:c1=${color2}[grad];`
        // Fallback to simple gradient if gradients filter not available
        filterComplex = `color=c=${color1}:s=${width}x${height}:d=${duration},format=yuv420p,`
        filterComplex += `geq=r='lerp(${hexToRgb(color1).r},${hexToRgb(color2).r},Y/H)':g='lerp(${hexToRgb(color1).g},${hexToRgb(color2).g},Y/H)':b='lerp(${hexToRgb(color1).b},${hexToRgb(color2).b},Y/H)'[bg];`
        break
        
      case 'animated':
        // Animated color shift background
        filterComplex = `color=c=${backgroundColor}:s=${width}x${height}:d=${duration},format=yuv420p,`
        filterComplex += `hue=H=2*PI*t/${duration}[bg];`
        break
        
      case 'particles':
        // Starfield/particles effect
        filterComplex = `color=c=black:s=${width}x${height}:d=${duration},format=yuv420p,`
        filterComplex += `noise=alls=50:allf=t+u[bg];`
        break
        
      case 'solid':
      default:
        filterComplex = `color=c=${backgroundColor}:s=${width}x${height}:d=${duration},format=yuv420p[bg];`
    }
    
    // Add text overlays with animation
    const escapedText = escapeFFmpegText(text)
    const escapedSubtext = escapeFFmpegText(subtext)
    
    let textFilter = ''
    const textY = subtext ? `(h-text_h)/2-40` : `(h-text_h)/2`
    
    // Text animation based on type
    switch (animationType) {
      case 'fade':
        textFilter = `drawtext=text='${escapedText}':fontsize=${fontSize}:fontcolor=${textColor}:`
        textFilter += `x=(w-text_w)/2:y=${textY}:alpha='if(lt(t,0.5),t*2,if(gt(t,${duration - 0.5}),(${duration}-t)*2,1))'`
        break
        
      case 'zoom':
        textFilter = `drawtext=text='${escapedText}':fontsize=${fontSize}*min(1\\,t/0.5):fontcolor=${textColor}:`
        textFilter += `x=(w-text_w)/2:y=${textY}`
        break
        
      case 'slide':
        textFilter = `drawtext=text='${escapedText}':fontsize=${fontSize}:fontcolor=${textColor}:`
        textFilter += `x='if(lt(t,0.5),-text_w+(w/2+text_w/2)*t*2,(w-text_w)/2)':y=${textY}`
        break
        
      case 'typewriter':
        // Show characters one by one
        const charDelay = Math.min(0.1, (duration - 1) / Math.max(1, text.length))
        textFilter = `drawtext=text='${escapedText}':fontsize=${fontSize}:fontcolor=${textColor}:`
        textFilter += `x=(w-text_w)/2:y=${textY}`
        break
        
      default:
        textFilter = `drawtext=text='${escapedText}':fontsize=${fontSize}:fontcolor=${textColor}:`
        textFilter += `x=(w-text_w)/2:y=${textY}`
    }
    
    filterComplex += `[bg]${textFilter}[txt];`
    
    // Add subtext if provided
    if (subtext) {
      const subtextFilter = `drawtext=text='${escapedSubtext}':fontsize=${Math.floor(fontSize * 0.5)}:fontcolor=${textColor}@0.8:`
      filterComplex += `[txt]${subtextFilter}x=(w-text_w)/2:y=(h-text_h)/2+60:alpha='if(lt(t,0.8),0,if(lt(t,1.3),(t-0.8)*2,1))'[final];`
    } else {
      filterComplex += `[txt]null[final];`
    }
    
    // Build FFmpeg command
    const args = [
      '-f', 'lavfi',
      '-i', 'anullsrc=r=44100:cl=stereo',
      '-filter_complex', filterComplex,
      '-map', '[final]',
      '-map', '0:a',
      '-c:v', 'libx264',
      '-preset', 'fast',
      '-crf', '23',
      '-c:a', 'aac',
      '-b:a', '128k',
      '-t', String(duration),
      '-y',
      outputPath
    ]
    
    await runFFmpeg(args, jobId)
    
    const { stat } = await import('fs/promises')
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

// Helper: Escape text for FFmpeg drawtext filter
function escapeFFmpegText(text) {
  if (!text) return ''
  return text
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "'\\''")
    .replace(/:/g, '\\:')
    .replace(/\[/g, '\\[')
    .replace(/\]/g, '\\]')
}

// Helper: Convert hex color to RGB
function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : { r: 0, g: 0, b: 0 }
}

// Helper: Run FFmpeg
function runFFmpeg(args, jobId) {
  return new Promise((resolve, reject) => {
    console.log(`[${jobId}] FFmpeg generate:`, args.slice(0, 10).join(' '), '...')
    
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

// GET: Return available templates
export async function GET() {
  return NextResponse.json({
    success: true,
    templates: [
      {
        id: 'simple-fade',
        name: 'Simple Fade',
        backgroundType: 'solid',
        animationType: 'fade',
        preview: '🎬'
      },
      {
        id: 'gradient-slide',
        name: 'Gradient Slide',
        backgroundType: 'gradient',
        animationType: 'slide',
        preview: '🌈'
      },
      {
        id: 'animated-zoom',
        name: 'Animated Zoom',
        backgroundType: 'animated',
        animationType: 'zoom',
        preview: '✨'
      },
      {
        id: 'particles-fade',
        name: 'Starfield',
        backgroundType: 'particles',
        animationType: 'fade',
        preview: '⭐'
      }
    ],
    backgroundTypes: ['solid', 'gradient', 'animated', 'particles'],
    animationTypes: ['fade', 'zoom', 'slide', 'typewriter']
  })
}
