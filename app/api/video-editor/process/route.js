import { NextResponse } from 'next/server'
import { spawn } from 'child_process'
import { writeFile, mkdir, readFile, unlink, copyFile } from 'fs/promises'
import { existsSync, createWriteStream } from 'fs'
import { join } from 'path'
import { randomUUID } from 'crypto'

export const maxDuration = 300
export const dynamic = 'force-dynamic'

const OUTPUT_DIR = '/app/public/video-editor/output'

// Process video with various operations
export async function POST(request) {
  const jobId = randomUUID()
  
  try {
    const body = await request.json()
    const {
      fileId,
      filePath,
      operations = [], // Array of operations to apply
      outputFormat = 'mp4'
    } = body
    
    if (!fileId && !filePath) {
      return NextResponse.json({ success: false, error: 'fileId or filePath required' }, { status: 400 })
    }
    
    const inputPath = filePath 
      ? join('/app/public', filePath)
      : join('/app/public/video-editor/uploads', `${fileId}.mp4`)
    
    if (!existsSync(inputPath)) {
      return NextResponse.json({ success: false, error: 'Video file not found' }, { status: 404 })
    }
    
    await mkdir(OUTPUT_DIR, { recursive: true })
    
    console.log(`[${jobId}] Processing video with ${operations.length} operations`)
    
    let currentInput = inputPath
    let tempFiles = []
    
    for (let i = 0; i < operations.length; i++) {
      const op = operations[i]
      const tempOutput = join(OUTPUT_DIR, `${jobId}-temp-${i}.mp4`)
      tempFiles.push(tempOutput)
      
      console.log(`[${jobId}] Operation ${i + 1}: ${op.type}`)
      
      switch (op.type) {
        case 'remove_segments':
          // Remove specific time segments (fillers, silences, etc.)
          await removeSegments(currentInput, tempOutput, op.segments, jobId)
          break
          
        case 'add_captions':
          // Add burned-in captions
          await addCaptions(currentInput, tempOutput, op.transcript, op.style, jobId)
          break
          
        case 'enhance_audio':
          // Apply audio enhancement filters
          await enhanceAudio(currentInput, tempOutput, op.settings, jobId)
          break
          
        case 'color_grade':
          // Apply color grading
          await applyColorGrade(currentInput, tempOutput, op.preset, jobId)
          break
          
        case 'trim':
          // Trim video to specific time range
          await trimVideo(currentInput, tempOutput, op.start, op.end, jobId)
          break
          
        case 'crop':
          // Crop/reframe video (for repurposing)
          await cropVideo(currentInput, tempOutput, op.aspectRatio, op.position, jobId)
          break
          
        case 'beat_sync':
          // Sync cuts to beat markers
          await beatSyncCuts(currentInput, tempOutput, op.beats, op.scenes, jobId)
          break
          
        default:
          console.log(`[${jobId}] Unknown operation: ${op.type}`)
          continue
      }
      
      currentInput = tempOutput
    }
    
    // Move final output to permanent location
    const finalOutput = join(OUTPUT_DIR, `${jobId}-final.${outputFormat}`)
    
    if (currentInput !== inputPath) {
      await copyFile(currentInput, finalOutput)
    } else {
      await copyFile(inputPath, finalOutput)
    }
    
    // Cleanup temp files
    for (const tempFile of tempFiles) {
      try {
        if (tempFile !== finalOutput && existsSync(tempFile)) {
          await unlink(tempFile)
        }
      } catch (e) { /* ignore */ }
    }
    
    // Get output file info
    const { stat } = await import('fs/promises')
    const stats = await stat(finalOutput)
    
    console.log(`[${jobId}] ✅ Processing complete: ${Math.round(stats.size / 1024 / 1024)}MB`)
    
    return NextResponse.json({
      success: true,
      jobId,
      outputPath: `/video-editor/output/${jobId}-final.${outputFormat}`,
      fileSize: stats.size,
      operationsApplied: operations.length
    })
    
  } catch (error) {
    console.error(`[${jobId}] Processing error:`, error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

// Remove segments (for filler word and silence removal)
async function removeSegments(input, output, segments, jobId) {
  if (!segments || segments.length === 0) {
    await copyFile(input, output)
    return
  }
  
  // Sort segments by start time
  const sortedSegments = [...segments].sort((a, b) => a.start - b.start)
  
  // Get video duration
  const duration = await getVideoDuration(input)
  
  // Build list of segments to KEEP
  const keepSegments = []
  let currentTime = 0
  
  for (const seg of sortedSegments) {
    if (seg.start > currentTime) {
      keepSegments.push({ start: currentTime, end: seg.start })
    }
    currentTime = Math.max(currentTime, seg.end)
  }
  
  // Add final segment
  if (currentTime < duration) {
    keepSegments.push({ start: currentTime, end: duration })
  }
  
  if (keepSegments.length === 0) {
    await copyFile(input, output)
    return
  }
  
  console.log(`[${jobId}] Keeping ${keepSegments.length} segments, removing ${segments.length}`)
  
  // Build FFmpeg filter for concatenating kept segments
  const filterParts = []
  const concatInputs = []
  
  for (let i = 0; i < keepSegments.length; i++) {
    const seg = keepSegments[i]
    filterParts.push(`[0:v]trim=${seg.start}:${seg.end},setpts=PTS-STARTPTS[v${i}]`)
    filterParts.push(`[0:a]atrim=${seg.start}:${seg.end},asetpts=PTS-STARTPTS[a${i}]`)
    concatInputs.push(`[v${i}][a${i}]`)
  }
  
  const filterComplex = `${filterParts.join(';')};${concatInputs.join('')}concat=n=${keepSegments.length}:v=1:a=1[outv][outa]`
  
  await runFFmpeg([
    '-i', input,
    '-filter_complex', filterComplex,
    '-map', '[outv]',
    '-map', '[outa]',
    '-c:v', 'libx264',
    '-preset', 'fast',
    '-crf', '23',
    '-c:a', 'aac',
    '-b:a', '128k',
    '-y',
    output
  ], jobId)
}

// Add burned-in captions
async function addCaptions(input, output, transcript, style = {}, jobId) {
  if (!transcript || !transcript.segments || transcript.segments.length === 0) {
    await copyFile(input, output)
    return
  }
  
  // Generate ASS subtitle file
  const assContent = generateASSFromTranscript(transcript, style)
  const assPath = `/tmp/${jobId}-captions.ass`
  await writeFile(assPath, assContent)
  
  console.log(`[${jobId}] Generated ASS captions with ${transcript.segments.length} segments`)
  
  // Burn captions into video
  const escapedPath = assPath.replace(/\\/g, '/').replace(/:/g, '\\:')
  
  await runFFmpeg([
    '-i', input,
    '-vf', `ass='${escapedPath}'`,
    '-c:v', 'libx264',
    '-preset', 'fast',
    '-crf', '23',
    '-c:a', 'copy',
    '-y',
    output
  ], jobId)
  
  // Cleanup
  try { await unlink(assPath) } catch (e) { /* ignore */ }
}

// Enhance audio (noise reduction, normalization, etc.)
async function enhanceAudio(input, output, settings = {}, jobId) {
  const {
    normalize = true,
    noiseReduction = true,
    removeClicks = true,
    volume = 1.0,
    highpass = 60,
    lowpass = 13000
  } = settings
  
  const audioFilters = []
  
  // Apply noise reduction first
  if (noiseReduction) {
    audioFilters.push('afftdn=nf=-25:nr=10:nt=w')  // FFT-based adaptive noise reduction
  }
  
  // Remove low rumble and high hiss
  if (highpass > 0) audioFilters.push(`highpass=f=${highpass}`)
  if (lowpass > 0) audioFilters.push(`lowpass=f=${lowpass}`)
  
  // Remove clicks and pops
  if (removeClicks) {
    audioFilters.push('adeclick=w=55:p=50')
  }
  
  // Normalize loudness
  if (normalize) audioFilters.push('loudnorm=I=-16:TP=-1.5:LRA=11')
  
  // Adjust volume
  if (volume !== 1.0) audioFilters.push(`volume=${volume}`)
  
  const filterString = audioFilters.length > 0 ? audioFilters.join(',') : 'anull'
  
  console.log(`[${jobId}] Applying audio filters: ${filterString}`)
  
  await runFFmpeg([
    '-i', input,
    '-af', filterString,
    '-c:v', 'copy',
    '-c:a', 'aac',
    '-b:a', '192k',
    '-y',
    output
  ], jobId)
}

// Apply color grading preset - improved professional looks
async function applyColorGrade(input, output, preset = 'neutral', jobId) {
  const presets = {
    neutral: 'eq=brightness=0:contrast=1:saturation=1',
    
    // Warm tones - golden/orange glow
    warm: 'colortemperature=temperature=6000,eq=saturation=1.15:contrast=1.05:brightness=0.03',
    
    // Cool tones - blue/teal tint
    cool: 'colortemperature=temperature=8000,eq=saturation=1.05:contrast=1.03:brightness=-0.01',
    
    // Cinematic - teal & orange look with lifted blacks
    cinematic: 'colorbalance=rs=0.1:gs=-0.05:bs=-0.1:rm=0.05:gm=0:bm=0.05:rh=-0.05:gh=0:bh=0.1,eq=contrast=1.15:saturation=1.1:brightness=0.02:gamma=1.1',
    
    // Vibrant - punchy colors
    vibrant: 'eq=saturation=1.4:contrast=1.1:brightness=0.02,unsharp=5:5:0.8',
    
    // Vintage/retro - faded with warm tint
    vintage: 'colorlevels=rimin=0.1:gimin=0.1:bimin=0.1:rimax=0.9:gimax=0.85:bimax=0.8,eq=saturation=0.85:contrast=0.95',
    
    // Black & white - high contrast mono
    bw: 'hue=s=0,eq=contrast=1.2:brightness=0.02',
    
    // Film look - subtle grain and color
    film: 'colorbalance=rs=0.05:bs=-0.05,eq=saturation=0.95:contrast=1.08,noise=alls=5:allf=t',
    
    // HDR-style - expanded dynamic range look
    hdr: 'eq=contrast=1.2:saturation=1.2:brightness=0.03:gamma=0.95,unsharp=5:5:1.0',
    
    highcontrast: 'eq=contrast=1.3:brightness=0.05:saturation=1.1'
  }
  
  const filter = presets[preset] || presets.neutral
  
  console.log(`[${jobId}] Applying color grade: ${preset}`)
  
  await runFFmpeg([
    '-i', input,
    '-vf', filter,
    '-c:v', 'libx264',
    '-preset', 'fast',
    '-crf', '23',
    '-c:a', 'copy',
    '-y',
    output
  ], jobId)
}

// Trim video to specific time range
async function trimVideo(input, output, start, end, jobId) {
  const args = ['-i', input]
  
  if (start !== undefined && start > 0) {
    args.push('-ss', String(start))
  }
  if (end !== undefined) {
    args.push('-to', String(end))
  }
  
  args.push(
    '-c:v', 'libx264',
    '-preset', 'fast',
    '-crf', '23',
    '-c:a', 'aac',
    '-y',
    output
  )
  
  console.log(`[${jobId}] Trimming: ${start || 0}s to ${end || 'end'}`)
  
  await runFFmpeg(args, jobId)
}

// Crop video for different aspect ratios (repurposing)
async function cropVideo(input, output, aspectRatio = '9:16', position = 'center', jobId) {
  // Get input dimensions
  const info = await getVideoInfo(input)
  const { width: inW, height: inH } = info
  
  // Calculate output dimensions based on aspect ratio
  const [ratioW, ratioH] = aspectRatio.split(':').map(Number)
  let outW, outH, cropX, cropY
  
  // Calculate crop dimensions
  const targetRatio = ratioW / ratioH
  const currentRatio = inW / inH
  
  if (currentRatio > targetRatio) {
    // Need to crop width
    outH = inH
    outW = Math.floor(inH * targetRatio)
    cropY = 0
    
    switch (position) {
      case 'left': cropX = 0; break
      case 'right': cropX = inW - outW; break
      default: cropX = Math.floor((inW - outW) / 2) // center
    }
  } else {
    // Need to crop height
    outW = inW
    outH = Math.floor(inW / targetRatio)
    cropX = 0
    
    switch (position) {
      case 'top': cropY = 0; break
      case 'bottom': cropY = inH - outH; break
      default: cropY = Math.floor((inH - outH) / 2) // center
    }
  }
  
  console.log(`[${jobId}] Cropping to ${aspectRatio} (${outW}x${outH})`)
  
  await runFFmpeg([
    '-i', input,
    '-vf', `crop=${outW}:${outH}:${cropX}:${cropY}`,
    '-c:v', 'libx264',
    '-preset', 'fast',
    '-crf', '23',
    '-c:a', 'copy',
    '-y',
    output
  ], jobId)
}

// Beat sync - cut video at beat markers
async function beatSyncCuts(input, output, beats, scenes, jobId) {
  if (!beats || beats.length === 0 || !scenes || scenes.length === 0) {
    await copyFile(input, output)
    return
  }
  
  // Match beats to scene boundaries
  const cutPoints = []
  let sceneIndex = 0
  
  for (const beat of beats) {
    // Find closest scene boundary
    while (sceneIndex < scenes.length - 1 && scenes[sceneIndex].end < beat.time) {
      sceneIndex++
    }
    
    if (sceneIndex < scenes.length) {
      const scene = scenes[sceneIndex]
      // If beat is close to scene boundary, use it
      if (Math.abs(beat.time - scene.start) < 0.5 || Math.abs(beat.time - scene.end) < 0.5) {
        cutPoints.push(beat.time)
      }
    }
  }
  
  if (cutPoints.length === 0) {
    // No matching cut points, use beat times directly
    cutPoints.push(...beats.slice(0, 10).map(b => b.time))
  }
  
  console.log(`[${jobId}] Beat sync with ${cutPoints.length} cut points`)
  
  // For now, just copy - beat sync would require more complex editing
  // This is a placeholder for the full implementation
  await copyFile(input, output)
}

// Helper: Generate ASS subtitle content
function generateASSFromTranscript(transcript, style = {}) {
  const {
    fontSize = 48,
    fontName = 'Arial',
    primaryColor = '&H00FFFFFF',
    outlineColor = '&H00000000',
    outline = 3,
    shadow = 2,
    marginV = 60,
    alignment = 2 // Bottom center
  } = style
  
  let ass = `[Script Info]
Title: Auto-Generated Captions
ScriptType: v4.00+
WrapStyle: 0
PlayResX: 1920
PlayResY: 1080
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,${fontName},${fontSize},${primaryColor},&H000000FF,${outlineColor},&H00000000,-1,0,0,0,100,100,0,0,1,${outline},${shadow},${alignment},10,10,${marginV},1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
`

  for (const segment of transcript.segments) {
    const startTime = formatASSTime(segment.start)
    const endTime = formatASSTime(segment.end)
    const text = segment.text.replace(/\n/g, '\\N')
    
    ass += `Dialogue: 0,${startTime},${endTime},Default,,0,0,0,,${text}\n`
  }
  
  return ass
}

function formatASSTime(seconds) {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)
  const centisecs = Math.floor((seconds % 1) * 100)
  return `${hours}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${String(centisecs).padStart(2, '0')}`
}

// Helper: Get video duration
async function getVideoDuration(videoPath) {
  return new Promise((resolve, reject) => {
    const ffprobe = spawn('ffprobe', [
      '-v', 'error',
      '-show_entries', 'format=duration',
      '-of', 'default=noprint_wrappers=1:nokey=1',
      videoPath
    ])
    
    let stdout = ''
    ffprobe.stdout.on('data', (data) => { stdout += data.toString() })
    ffprobe.on('close', (code) => {
      if (code === 0) resolve(parseFloat(stdout.trim()) || 0)
      else reject(new Error('Failed to get duration'))
    })
  })
}

// Helper: Get video info
async function getVideoInfo(videoPath) {
  return new Promise((resolve, reject) => {
    const ffprobe = spawn('ffprobe', [
      '-v', 'error',
      '-select_streams', 'v:0',
      '-show_entries', 'stream=width,height,duration',
      '-of', 'json',
      videoPath
    ])
    
    let stdout = ''
    ffprobe.stdout.on('data', (data) => { stdout += data.toString() })
    ffprobe.on('close', (code) => {
      if (code === 0) {
        try {
          const data = JSON.parse(stdout)
          const stream = data.streams[0] || {}
          resolve({
            width: stream.width || 1920,
            height: stream.height || 1080,
            duration: parseFloat(stream.duration) || 0
          })
        } catch (e) {
          resolve({ width: 1920, height: 1080, duration: 0 })
        }
      } else {
        reject(new Error('Failed to get video info'))
      }
    })
  })
}

// Helper: Run FFmpeg command
async function runFFmpeg(args, jobId) {
  return new Promise((resolve, reject) => {
    console.log(`[${jobId}] FFmpeg:`, args.slice(0, 10).join(' '), '...')
    
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
