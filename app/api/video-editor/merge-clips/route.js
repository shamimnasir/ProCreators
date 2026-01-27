import { NextResponse } from 'next/server'
import { spawn } from 'child_process'
import { mkdir, writeFile, copyFile, unlink, stat } from 'fs/promises'
import { existsSync } from 'fs'
import { join } from 'path'
import { randomUUID } from 'crypto'

export const maxDuration = 300
export const dynamic = 'force-dynamic'

const OUTPUT_DIR = '/app/public/video-editor/output'

// Video size presets for different platforms
const VIDEO_PRESETS = {
  'youtube-hd': { width: 1920, height: 1080, label: 'YouTube HD (16:9)' },
  'youtube-4k': { width: 3840, height: 2160, label: 'YouTube 4K (16:9)' },
  'instagram-reel': { width: 1080, height: 1920, label: 'Instagram Reel (9:16)' },
  'instagram-square': { width: 1080, height: 1080, label: 'Instagram Square (1:1)' },
  'instagram-feed': { width: 1080, height: 1350, label: 'Instagram Feed (4:5)' },
  'tiktok': { width: 1080, height: 1920, label: 'TikTok (9:16)' },
  'facebook-square': { width: 1080, height: 1080, label: 'Facebook Square (1:1)' },
  'facebook-feed': { width: 1200, height: 628, label: 'Facebook Feed (1.91:1)' },
  'twitter': { width: 1280, height: 720, label: 'Twitter/X (16:9)' },
  'original': { width: 0, height: 0, label: 'Keep Original' }
}

export async function POST(request) {
  const jobId = randomUUID()
  const tempDir = `/tmp/multi-clip-${jobId}`
  
  try {
    const body = await request.json()
    const {
      clips = [],
      transition = 'fade',
      transitionDuration = 0.5,
      applyNoiseReduction = false,
      colorGrade = 'neutral',
      addCaptions = false,
      captionStyle = 'bold-outline',
      transcript = null,
      backgroundMusic = null,
      outputPreset = 'youtube-hd'  // New: video size preset
    } = body
    
    if (!clips || clips.length === 0) {
      return NextResponse.json({ success: false, error: 'No clips provided' }, { status: 400 })
    }
    
    await mkdir(tempDir, { recursive: true })
    await mkdir(OUTPUT_DIR, { recursive: true })
    
    const preset = VIDEO_PRESETS[outputPreset] || VIDEO_PRESETS['youtube-hd']
    const keepOriginal = outputPreset === 'original'
    
    console.log(`[${jobId}] 🎬 Multi-clip merge: ${clips.length} clips`)
    console.log(`[${jobId}] Output: ${preset.label}, Transition: ${transition}`)
    
    const processedClips = []
    
    // Step 1: Process each clip (normalize format, optional color grade)
    for (let i = 0; i < clips.length; i++) {
      const clip = clips[i]
      const clipPath = join('/app/public', clip.filePath)
      
      if (!existsSync(clipPath)) {
        console.log(`[${jobId}] Clip ${i} not found: ${clipPath}`)
        continue
      }
      
      console.log(`[${jobId}] Processing clip ${i + 1}/${clips.length}`)
      
      const processedPath = join(tempDir, `clip-${i}-processed.mp4`)
      const videoFilters = []
      const audioFilters = []
      
      // Scale/pad to target resolution (NO CROP - use padding for aspect ratio)
      if (!keepOriginal) {
        // Scale to fit within target dimensions, then pad to exact size
        videoFilters.push(`scale=${preset.width}:${preset.height}:force_original_aspect_ratio=decrease`)
        videoFilters.push(`pad=${preset.width}:${preset.height}:(ow-iw)/2:(oh-ih)/2:black`)
      }
      
      // Color grading (optional)
      if (colorGrade !== 'neutral') {
        const colorFilter = getColorGradeFilter(colorGrade)
        if (colorFilter) videoFilters.push(colorFilter)
      }
      
      // Audio normalization
      if (applyNoiseReduction) {
        audioFilters.push('highpass=f=80', 'lowpass=f=12000')
      }
      audioFilters.push('loudnorm=I=-16:TP=-1.5:LRA=11')
      
      const args = ['-i', clipPath]
      
      if (videoFilters.length > 0) {
        args.push('-vf', videoFilters.join(','))
      }
      args.push('-af', audioFilters.join(','))
      args.push(
        '-c:v', 'libx264',
        '-preset', 'fast',
        '-crf', '23',
        '-c:a', 'aac',
        '-b:a', '128k',
        '-y',
        processedPath
      )
      
      await runFFmpeg(args, jobId)
      processedClips.push(processedPath)
    }
    
    if (processedClips.length === 0) {
      throw new Error('No clips were processed successfully')
    }
    
    // Step 2: Concatenate all clips (simple concat - most reliable)
    console.log(`[${jobId}] Concatenating ${processedClips.length} clips`)
    
    let mergedOutput = join(tempDir, `${jobId}-merged.mp4`)
    
    if (processedClips.length === 1) {
      await copyFile(processedClips[0], mergedOutput)
    } else {
      // Use concat demuxer (most reliable method)
      const concatListPath = join(tempDir, 'concat.txt')
      const concatList = processedClips.map(p => `file '${p}'`).join('\n')
      await writeFile(concatListPath, concatList)
      
      await runFFmpeg([
        '-f', 'concat',
        '-safe', '0',
        '-i', concatListPath,
        '-c:v', 'libx264',
        '-preset', 'fast',
        '-crf', '23',
        '-c:a', 'aac',
        '-b:a', '128k',
        '-y',
        mergedOutput
      ], jobId)
    }
    
    // Step 3: Add captions if requested
    let videoWithCaptions = mergedOutput
    if (addCaptions && transcript && transcript.segments && transcript.segments.length > 0) {
      console.log(`[${jobId}] Adding captions`)
      videoWithCaptions = join(tempDir, `${jobId}-captioned.mp4`)
      await addCaptionsToVideo(mergedOutput, videoWithCaptions, transcript, captionStyle, jobId)
    }
    
    // Step 4: Add background music if selected
    let finalVideo = videoWithCaptions
    if (backgroundMusic) {
      const musicPath = join('/app/public', backgroundMusic)
      if (existsSync(musicPath)) {
        console.log(`[${jobId}] Adding background music`)
        finalVideo = join(tempDir, `${jobId}-final.mp4`)
        await addBackgroundMusic(videoWithCaptions, finalVideo, musicPath, jobId)
      }
    }
    
    // Copy to output directory
    const outputPath = join(OUTPUT_DIR, `${jobId}-merged.mp4`)
    await copyFile(finalVideo, outputPath)
    
    // Cleanup temp files
    try {
      const { rm } = await import('fs/promises')
      await rm(tempDir, { recursive: true, force: true })
    } catch (e) { /* ignore */ }
    
    const stats = await stat(outputPath)
    
    console.log(`[${jobId}] ✅ Merge complete: ${Math.round(stats.size / 1024 / 1024)}MB`)
    
    return NextResponse.json({
      success: true,
      jobId,
      outputPath: `/video-editor/output/${jobId}-merged.mp4`,
      fileSize: stats.size,
      clipsProcessed: processedClips.length,
      preset: preset.label,
      hasCaptions: addCaptions && transcript,
      hasMusic: !!backgroundMusic
    })
    
  } catch (error) {
    console.error(`[${jobId}] Merge error:`, error)
    
    try {
      const { rm } = await import('fs/promises')
      await rm(tempDir, { recursive: true, force: true })
    } catch (e) { /* ignore */ }
    
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

// GET endpoint to return available video presets
export async function GET() {
  return NextResponse.json({
    success: true,
    presets: Object.entries(VIDEO_PRESETS).map(([key, value]) => ({
      id: key,
      ...value
    }))
  })
}

// Color grade presets
function getColorGradeFilter(preset) {
  const presets = {
    warm: 'colortemperature=temperature=6500,eq=saturation=1.1',
    cool: 'colortemperature=temperature=7500,eq=saturation=0.95',
    cinematic: 'eq=contrast=1.1:saturation=0.9:brightness=-0.05',
    vibrant: 'eq=saturation=1.3:contrast=1.05',
    vintage: 'eq=saturation=0.8,curves=preset=vintage',
    bw: 'hue=s=0'
  }
  return presets[preset] || null
}

// Add captions using SRT subtitles
async function addCaptionsToVideo(input, output, transcript, style, jobId) {
  const srtPath = `/tmp/captions-${jobId}.srt`
  let srtContent = ''
  
  transcript.segments.forEach((seg, index) => {
    const startTime = formatSrtTime(seg.start || 0)
    const endTime = formatSrtTime(seg.end || seg.start + 2)
    const text = (seg.text || '').trim()
    
    if (text) {
      srtContent += `${index + 1}\n${startTime} --> ${endTime}\n${text}\n\n`
    }
  })
  
  await writeFile(srtPath, srtContent)
  
  try {
    await runFFmpeg([
      '-i', input,
      '-vf', `subtitles=${srtPath}:force_style='FontSize=24,PrimaryColour=&HFFFFFF,OutlineColour=&H000000,Outline=2,Bold=1'`,
      '-c:v', 'libx264',
      '-preset', 'fast',
      '-crf', '23',
      '-c:a', 'copy',
      '-y',
      output
    ], jobId)
  } catch (e) {
    console.log(`[${jobId}] Caption burn failed, copying without captions`)
    await copyFile(input, output)
  }
  
  try { await unlink(srtPath) } catch (e) {}
}

function formatSrtTime(seconds) {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  const ms = Math.floor((seconds % 1) * 1000)
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')},${String(ms).padStart(3, '0')}`
}

// Add background music mixed with original audio
async function addBackgroundMusic(videoInput, output, musicPath, jobId) {
  try {
    await runFFmpeg([
      '-i', videoInput,
      '-i', musicPath,
      '-filter_complex', '[0:a][1:a]amix=inputs=2:duration=first:weights=1 0.15[aout]',
      '-map', '0:v',
      '-map', '[aout]',
      '-c:v', 'copy',
      '-c:a', 'aac',
      '-b:a', '128k',
      '-shortest',
      '-y',
      output
    ], jobId)
  } catch (e) {
    console.log(`[${jobId}] Music mix failed, copying without music`)
    await copyFile(videoInput, output)
  }
}

// Run FFmpeg command with promise
function runFFmpeg(args, jobId) {
  return new Promise((resolve, reject) => {
    console.log(`[${jobId}] FFmpeg: ${args.slice(0, 8).join(' ')}...`)
    
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
