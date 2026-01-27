import { NextResponse } from 'next/server'
import { spawn } from 'child_process'
import { mkdir, writeFile, copyFile, unlink, stat } from 'fs/promises'
import { existsSync } from 'fs'
import { join } from 'path'
import { randomUUID } from 'crypto'

export const maxDuration = 300
export const dynamic = 'force-dynamic'

const OUTPUT_DIR = '/app/public/video-editor/output'
const SOUNDS_DIR = '/app/public/video-editor/sounds'

const VIDEO_PRESETS = {
  'youtube-hd': { width: 1920, height: 1080 },
  'instagram-reel': { width: 1080, height: 1920 },
  'instagram-square': { width: 1080, height: 1080 },
  'tiktok': { width: 1080, height: 1920 },
  'facebook-square': { width: 1080, height: 1080 },
  'facebook-feed': { width: 1200, height: 628 },
  'twitter': { width: 1280, height: 720 },
  'original': { width: 0, height: 0 }
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
      transitionSound = 'whoosh',
      applyNoiseReduction = false,
      colorGrade = 'neutral',
      addCaptions = false,
      captionStyle = 'bold-outline',
      transcript = null,
      backgroundMusic = null,
      outputPreset = 'youtube-hd'
    } = body
    
    if (!clips || clips.length === 0) {
      return NextResponse.json({ success: false, error: 'No clips provided' }, { status: 400 })
    }
    
    await mkdir(tempDir, { recursive: true })
    await mkdir(OUTPUT_DIR, { recursive: true })
    await mkdir(SOUNDS_DIR, { recursive: true })
    
    const preset = VIDEO_PRESETS[outputPreset] || VIDEO_PRESETS['youtube-hd']
    const keepOriginal = outputPreset === 'original'
    
    console.log(`[${jobId}] 🎬 Merge: ${clips.length} clips, transition: ${transition} (${transitionDuration}s)`)
    
    // Generate transition sound
    let soundPath = null
    if (transitionSound && transitionSound !== 'none') {
      soundPath = join(SOUNDS_DIR, `${transitionSound}-${transitionDuration}.mp3`)
      if (!existsSync(soundPath)) {
        await generateTransitionSound(transitionSound, soundPath, transitionDuration, jobId)
      }
    }
    
    const processedClips = []
    
    // Step 1: Process each clip with NORMALIZED timebase for xfade compatibility
    for (let i = 0; i < clips.length; i++) {
      const clip = clips[i]
      const clipPath = join('/app/public', clip.filePath)
      
      if (!existsSync(clipPath)) {
        console.log(`[${jobId}] Clip ${i} not found: ${clipPath}`)
        continue
      }
      
      console.log(`[${jobId}] Processing clip ${i + 1}/${clips.length}`)
      
      const processedPath = join(tempDir, `clip-${i}.mp4`)
      const filters = []
      
      // Video filters
      if (!keepOriginal && preset.width > 0) {
        filters.push(`scale=${preset.width}:${preset.height}:force_original_aspect_ratio=decrease`)
        filters.push(`pad=${preset.width}:${preset.height}:(ow-iw)/2:(oh-ih)/2:black`)
      }
      filters.push('setsar=1')
      filters.push('fps=30')  // Normalize framerate for xfade
      filters.push('settb=1/30')  // Normalize timebase for xfade
      
      // Color grade
      if (colorGrade !== 'neutral') {
        const cg = getColorGradeFilter(colorGrade)
        if (cg) filters.push(cg)
      }
      
      // Audio filters
      const audioFilters = []
      
      // Noise reduction using FFmpeg's afftdn filter
      if (applyNoiseReduction) {
        audioFilters.push('afftdn=nf=-25:nr=10:nt=w')  // Adaptive FFT denoising
        audioFilters.push('highpass=f=60')  // Remove low rumble
        audioFilters.push('lowpass=f=13000')  // Remove high hiss
      }
      
      audioFilters.push('aresample=44100')  // Normalize audio sample rate
      audioFilters.push('loudnorm=I=-16:TP=-1.5:LRA=11')
      
      await runFFmpeg([
        '-i', clipPath,
        '-vf', filters.join(','),
        '-af', audioFilters.join(','),
        '-c:v', 'libx264', '-preset', 'fast', '-crf', '23',
        '-c:a', 'aac', '-b:a', '128k',
        '-y', processedPath
      ], jobId)
      
      processedClips.push(processedPath)
    }
    
    if (processedClips.length === 0) {
      throw new Error('No clips processed')
    }
    
    // Step 2: Merge with transitions
    let mergedOutput = join(tempDir, `merged.mp4`)
    
    if (processedClips.length === 1) {
      await copyFile(processedClips[0], mergedOutput)
    } else if (transition === 'none') {
      await concatClips(processedClips, mergedOutput, jobId)
    } else {
      // Use xfade transitions
      const success = await mergeWithXfade(processedClips, mergedOutput, transition, transitionDuration, soundPath, jobId)
      if (!success) {
        console.log(`[${jobId}] Xfade failed, using concat`)
        await concatClips(processedClips, mergedOutput, jobId)
      }
    }
    
    // Step 3: Add captions
    let finalVideo = mergedOutput
    if (addCaptions && transcript?.segments?.length > 0) {
      const captioned = join(tempDir, `captioned.mp4`)
      await addCaptionsToVideo(mergedOutput, captioned, transcript, jobId)
      finalVideo = captioned
    }
    
    // Step 4: Add background music
    if (backgroundMusic) {
      const musicPath = join('/app/public', backgroundMusic)
      if (existsSync(musicPath)) {
        const withMusic = join(tempDir, `with-music.mp4`)
        await addMusic(finalVideo, withMusic, musicPath, jobId)
        finalVideo = withMusic
      }
    }
    
    // Copy to output
    const outputPath = join(OUTPUT_DIR, `${jobId}-merged.mp4`)
    await copyFile(finalVideo, outputPath)
    
    // Cleanup
    try {
      const { rm } = await import('fs/promises')
      await rm(tempDir, { recursive: true, force: true })
    } catch (e) {}
    
    const stats = await stat(outputPath)
    console.log(`[${jobId}] ✅ Complete: ${Math.round(stats.size / 1024 / 1024)}MB`)
    
    return NextResponse.json({
      success: true,
      jobId,
      outputPath: `/video-editor/output/${jobId}-merged.mp4`,
      fileSize: stats.size,
      clipsProcessed: processedClips.length,
      transition
    })
    
  } catch (error) {
    console.error(`[${jobId}] Error:`, error)
    try {
      const { rm } = await import('fs/promises')
      await rm(tempDir, { recursive: true, force: true })
    } catch (e) {}
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

// Merge with xfade transitions
async function mergeWithXfade(clips, output, transition, duration, soundPath, jobId) {
  const xfadeType = getXfadeType(transition)
  
  try {
    // Get durations of all clips
    const durations = []
    for (const clip of clips) {
      durations.push(await getVideoDuration(clip))
    }
    
    // Build filter complex for all clips
    let filterComplex = ''
    let videoChain = '[0:v]'
    let audioChain = '[0:a]'
    
    let cumulativeOffset = 0
    
    for (let i = 1; i < clips.length; i++) {
      // Calculate offset: sum of previous durations minus transition overlap
      cumulativeOffset = 0
      for (let j = 0; j < i; j++) {
        cumulativeOffset += durations[j]
      }
      cumulativeOffset -= duration * i  // Account for all previous transitions
      cumulativeOffset = Math.max(0, cumulativeOffset)
      
      const vOutLabel = i < clips.length - 1 ? `[v${i}]` : '[vout]'
      const aOutLabel = i < clips.length - 1 ? `[a${i}]` : '[aout]'
      
      filterComplex += `${videoChain}[${i}:v]xfade=transition=${xfadeType}:duration=${duration}:offset=${cumulativeOffset}${vOutLabel};`
      filterComplex += `${audioChain}[${i}:a]acrossfade=d=${duration}${aOutLabel};`
      
      videoChain = vOutLabel
      audioChain = aOutLabel
    }
    
    // Remove trailing semicolon
    filterComplex = filterComplex.slice(0, -1)
    
    console.log(`[${jobId}] Xfade filter: ${filterComplex.slice(0, 200)}...`)
    
    // Build input args
    const inputArgs = clips.flatMap(c => ['-i', c])
    
    await runFFmpeg([
      ...inputArgs,
      '-filter_complex', filterComplex,
      '-map', '[vout]',
      '-map', '[aout]',
      '-c:v', 'libx264', '-preset', 'fast', '-crf', '23',
      '-c:a', 'aac', '-b:a', '128k',
      '-y', output
    ], jobId)
    
    // Add transition sounds if available
    if (soundPath && existsSync(soundPath)) {
      await addTransitionSounds(output, soundPath, durations, duration, jobId)
    }
    
    return true
  } catch (error) {
    console.error(`[${jobId}] Xfade error:`, error.message)
    return false
  }
}

// Add transition sounds at transition points
async function addTransitionSounds(videoPath, soundPath, durations, transitionDur, jobId) {
  try {
    const tempOutput = videoPath + '.temp.mp4'
    
    // Calculate transition times
    const transitionTimes = []
    let cumTime = 0
    for (let i = 0; i < durations.length - 1; i++) {
      cumTime += durations[i] - transitionDur
      transitionTimes.push(cumTime)
    }
    
    if (transitionTimes.length === 0) return
    
    // Build filter to add sounds at transition points
    let filterComplex = '[0:a]'
    const soundInputs = transitionTimes.map((t, i) => `-i ${soundPath}`).join(' ')
    
    // Delay each sound to its transition time and mix
    const soundFilters = transitionTimes.map((t, i) => 
      `[${i + 1}:a]adelay=${Math.floor(t * 1000)}|${Math.floor(t * 1000)}[s${i}]`
    ).join(';')
    
    const mixInputs = transitionTimes.map((_, i) => `[s${i}]`).join('')
    filterComplex = `${soundFilters};[0:a]${mixInputs}amix=inputs=${transitionTimes.length + 1}:duration=first:weights=${['1'].concat(transitionTimes.map(() => '0.3')).join(' ')}[aout]`
    
    const inputArgs = ['-i', videoPath, ...transitionTimes.flatMap(() => ['-i', soundPath])]
    
    await runFFmpeg([
      ...inputArgs,
      '-filter_complex', filterComplex,
      '-map', '0:v',
      '-map', '[aout]',
      '-c:v', 'copy',
      '-c:a', 'aac', '-b:a', '128k',
      '-y', tempOutput
    ], jobId)
    
    await copyFile(tempOutput, videoPath)
    await unlink(tempOutput)
    
    console.log(`[${jobId}] Added ${transitionTimes.length} transition sounds`)
  } catch (error) {
    console.log(`[${jobId}] Sound overlay skipped: ${error.message}`)
  }
}

// Simple concat without transitions
async function concatClips(clips, output, jobId) {
  const listPath = `/tmp/concat-${jobId}.txt`
  await writeFile(listPath, clips.map(c => `file '${c}'`).join('\n'))
  
  await runFFmpeg([
    '-f', 'concat', '-safe', '0', '-i', listPath,
    '-c:v', 'libx264', '-preset', 'fast', '-crf', '23',
    '-c:a', 'aac', '-b:a', '128k',
    '-y', output
  ], jobId)
  
  await unlink(listPath)
}

// Get video duration
async function getVideoDuration(path) {
  return new Promise((resolve) => {
    const proc = spawn('ffprobe', [
      '-v', 'error', '-show_entries', 'format=duration',
      '-of', 'default=noprint_wrappers=1:nokey=1', path
    ])
    let out = ''
    proc.stdout.on('data', d => out += d)
    proc.on('close', () => resolve(parseFloat(out) || 5))
  })
}

// Generate transition sound
async function generateTransitionSound(type, output, duration, jobId) {
  const freq = type === 'whoosh' ? 400 : type === 'swoosh' ? 600 : 800
  await runFFmpeg([
    '-f', 'lavfi', '-i', `sine=frequency=${freq}:duration=${duration}`,
    '-af', `afade=t=in:d=${duration/3},afade=t=out:st=${duration*2/3}:d=${duration/3},volume=0.4`,
    '-y', output
  ], jobId)
}

// Xfade transition types
function getXfadeType(t) {
  const map = {
    fade: 'fade', dissolve: 'dissolve', wipe: 'wipeleft',
    slide: 'slideleft', zoom: 'zoomin', circle: 'circleopen'
  }
  return map[t] || 'fade'
}

// Color grade filters - improved for professional look
function getColorGradeFilter(g) {
  const map = {
    // Warm tones - orange/golden glow
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
    hdr: 'eq=contrast=1.2:saturation=1.2:brightness=0.03:gamma=0.95,unsharp=5:5:1.0'
  }
  return map[g]
}

// Add captions
async function addCaptionsToVideo(input, output, transcript, jobId) {
  const srtPath = `/tmp/captions-${jobId}.srt`
  let srt = ''
  transcript.segments.forEach((s, i) => {
    const start = formatSrt(s.start || 0)
    const end = formatSrt(s.end || s.start + 2)
    if (s.text?.trim()) {
      srt += `${i + 1}\n${start} --> ${end}\n${s.text.trim()}\n\n`
    }
  })
  await writeFile(srtPath, srt)
  
  try {
    await runFFmpeg([
      '-i', input,
      '-vf', `subtitles=${srtPath}:force_style='FontSize=24,PrimaryColour=&HFFFFFF,OutlineColour=&H000000,Outline=2'`,
      '-c:v', 'libx264', '-preset', 'fast', '-crf', '23',
      '-c:a', 'copy', '-y', output
    ], jobId)
  } catch (e) {
    await copyFile(input, output)
  }
  await unlink(srtPath).catch(() => {})
}

function formatSrt(s) {
  const h = Math.floor(s/3600), m = Math.floor((s%3600)/60), sec = Math.floor(s%60), ms = Math.floor((s%1)*1000)
  return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')},${String(ms).padStart(3,'0')}`
}

// Add background music
async function addMusic(video, output, music, jobId) {
  try {
    await runFFmpeg([
      '-i', video, '-i', music,
      '-filter_complex', '[0:a][1:a]amix=inputs=2:duration=first:weights=1 0.15[a]',
      '-map', '0:v', '-map', '[a]',
      '-c:v', 'copy', '-c:a', 'aac', '-shortest', '-y', output
    ], jobId)
  } catch (e) {
    await copyFile(video, output)
  }
}

// Run FFmpeg
function runFFmpeg(args, jobId) {
  return new Promise((resolve, reject) => {
    console.log(`[${jobId}] FFmpeg: ${args.slice(0, 8).join(' ')}...`)
    const proc = spawn('ffmpeg', args)
    let err = ''
    proc.stderr.on('data', d => err += d)
    proc.on('close', code => code === 0 ? resolve() : reject(new Error(`FFmpeg error: ${err.slice(-500)}`)))
    proc.on('error', reject)
  })
}

export async function GET() {
  return NextResponse.json({
    success: true,
    presets: Object.keys(VIDEO_PRESETS),
    transitions: ['fade', 'dissolve', 'wipe', 'slide', 'zoom', 'circle', 'none']
  })
}
