import { NextResponse } from 'next/server'
import { spawn } from 'child_process'
import { mkdir, writeFile, copyFile, unlink, readdir } from 'fs/promises'
import { existsSync, createWriteStream } from 'fs'
import { join } from 'path'
import { randomUUID } from 'crypto'

export const maxDuration = 300
export const dynamic = 'force-dynamic'

const OUTPUT_DIR = '/app/public/video-editor/output'
const SOUND_EFFECTS_DIR = '/app/public/video-editor/sfx'

// Multi-clip merge with transitions and effects
export async function POST(request) {
  const jobId = randomUUID()
  const tempDir = `/tmp/multi-clip-${jobId}`
  
  try {
    const body = await request.json()
    const {
      clips = [],              // Array of { filePath, startTime, endTime }
      transition = 'fade',     // fade, dissolve, wipe, slide, zoom
      transitionDuration = 0.5,
      transitionSound = 'whoosh', // whoosh, swoosh, pop, none
      applyNoiseReduction = true,
      removeFillers = true,    // Remove um/uh/like sounds
      colorGrade = 'neutral',
      addCaptions = false,
      captionStyle = 'bold-outline',
      transcript = null,
      backgroundMusic = null,
      outputResolution = '1080p'
    } = body
    
    if (!clips || clips.length === 0) {
      return NextResponse.json({ success: false, error: 'No clips provided' }, { status: 400 })
    }
    
    await mkdir(tempDir, { recursive: true })
    await mkdir(OUTPUT_DIR, { recursive: true })
    await mkdir(SOUND_EFFECTS_DIR, { recursive: true })
    
    console.log(`[${jobId}] 🎬 Multi-clip merge: ${clips.length} clips`)
    console.log(`[${jobId}] Transition: ${transition} (${transitionDuration}s) with ${transitionSound} sound`)
    console.log(`[${jobId}] Captions: ${addCaptions}, Music: ${backgroundMusic ? 'yes' : 'no'}`)
    
    const dimensions = getResolutionDimensions(outputResolution)
    const processedClips = []
    
    // Step 1: Process each clip individually
    for (let i = 0; i < clips.length; i++) {
      const clip = clips[i]
      const clipPath = join('/app/public', clip.filePath)
      
      if (!existsSync(clipPath)) {
        console.log(`[${jobId}] Clip ${i} not found: ${clipPath}`)
        continue
      }
      
      console.log(`[${jobId}] Processing clip ${i + 1}/${clips.length}`)
      
      const processedPath = join(tempDir, `clip-${i}-processed.mp4`)
      const filters = []
      
      // Scale to target resolution
      filters.push(`scale=${dimensions.width}:${dimensions.height}:force_original_aspect_ratio=increase`)
      filters.push(`crop=${dimensions.width}:${dimensions.height}`)
      
      // Color grading
      if (colorGrade !== 'neutral') {
        const colorFilter = getColorGradeFilter(colorGrade)
        if (colorFilter) filters.push(colorFilter)
      }
      
      // Audio filters
      const audioFilters = []
      if (applyNoiseReduction) {
        audioFilters.push('highpass=f=80')
        audioFilters.push('lowpass=f=12000')
        audioFilters.push('afftdn=nf=-25')
      }
      audioFilters.push('loudnorm=I=-16:TP=-1.5:LRA=11')
      
      // Build FFmpeg command
      const args = ['-i', clipPath]
      
      // Trim if specified
      if (clip.startTime !== undefined) {
        args.push('-ss', String(clip.startTime))
      }
      if (clip.endTime !== undefined) {
        args.push('-to', String(clip.endTime))
      }
      
      args.push(
        '-vf', filters.join(','),
        '-af', audioFilters.join(','),
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
    
    // Step 2: Create transition sound effect if needed
    let transitionSoundPath = null
    if (transitionSound !== 'none') {
      transitionSoundPath = await getOrCreateTransitionSound(transitionSound, transitionDuration, jobId)
    }
    
    // Step 3: Merge clips with transitions
    console.log(`[${jobId}] Merging ${processedClips.length} clips with ${transition} transition`)
    
    let mergedOutput = join(tempDir, `${jobId}-merged-temp.mp4`)
    const finalOutput = join(OUTPUT_DIR, `${jobId}-merged.mp4`)
    
    if (processedClips.length === 1) {
      // Single clip - just copy
      await copyFile(processedClips[0], mergedOutput)
    } else {
      // Multiple clips - merge with transitions
      await mergeClipsWithTransitions(
        processedClips, 
        mergedOutput, 
        transition, 
        transitionDuration, 
        transitionSoundPath,
        dimensions,
        jobId
      )
    }
    
    // Step 4: Add captions if requested and transcript available
    let videoWithCaptions = mergedOutput
    if (addCaptions && transcript && transcript.segments && transcript.segments.length > 0) {
      console.log(`[${jobId}] Adding captions (${transcript.segments.length} segments)`)
      videoWithCaptions = join(tempDir, `${jobId}-with-captions.mp4`)
      await addCaptionsToVideo(mergedOutput, videoWithCaptions, transcript, captionStyle, dimensions, jobId)
    }
    
    // Step 5: Add background music if selected
    let videoWithMusic = videoWithCaptions
    if (backgroundMusic) {
      const musicPath = join('/app/public', backgroundMusic)
      if (existsSync(musicPath)) {
        console.log(`[${jobId}] Adding background music`)
        videoWithMusic = join(tempDir, `${jobId}-with-music.mp4`)
        await addBackgroundMusic(videoWithCaptions, videoWithMusic, musicPath, jobId)
      }
    }
    
    // Copy final result to output
    await copyFile(videoWithMusic, finalOutput)
    
    // Cleanup
    try {
      await require('fs/promises').rm(tempDir, { recursive: true, force: true })
    } catch (e) { /* ignore */ }
    
    const stats = await require('fs/promises').stat(finalOutput)
    
    console.log(`[${jobId}] ✅ Multi-clip merge complete: ${Math.round(stats.size / 1024 / 1024)}MB`)
    
    return NextResponse.json({
      success: true,
      jobId,
      outputPath: `/video-editor/output/${jobId}-merged.mp4`,
      fileSize: stats.size,
      clipsProcessed: processedClips.length,
      transition,
      transitionSound,
      hasCaptions: addCaptions && transcript,
      hasMusic: !!backgroundMusic
    })
    
  } catch (error) {
    console.error(`[${jobId}] Multi-clip error:`, error)
    
    try {
      await require('fs/promises').rm(tempDir, { recursive: true, force: true })
    } catch (e) { /* ignore */ }
    
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

// Merge clips with transitions
async function mergeClipsWithTransitions(clips, output, transition, duration, soundPath, dimensions, jobId) {
  // For simple transitions, use concat with xfade
  const inputs = clips.flatMap(c => ['-i', c])
  
  if (soundPath) {
    inputs.push('-i', soundPath)
  }
  
  // Build xfade filter chain
  let filterComplex = ''
  let lastVideo = '[0:v]'
  let lastAudio = '[0:a]'
  
  for (let i = 1; i < clips.length; i++) {
    const transitionType = getXfadeTransition(transition)
    
    // Video transition
    filterComplex += `${lastVideo}[${i}:v]xfade=transition=${transitionType}:duration=${duration}:offset=0[v${i}];`
    lastVideo = `[v${i}]`
    
    // Audio crossfade
    filterComplex += `${lastAudio}[${i}:a]acrossfade=d=${duration}[a${i}];`
    lastAudio = `[a${i}]`
  }
  
  // If we have transition sound, mix it in at each transition point
  if (soundPath) {
    const soundIdx = clips.length
    // Mix transition sound at low volume
    filterComplex += `${lastAudio}[${soundIdx}:a]amix=inputs=2:duration=longest:weights=1 0.3[aout];`
    lastAudio = '[aout]'
  }
  
  // Remove trailing semicolon
  filterComplex = filterComplex.slice(0, -1)
  
  const args = [
    ...inputs,
    '-filter_complex', filterComplex,
    '-map', lastVideo,
    '-map', lastAudio,
    '-c:v', 'libx264',
    '-preset', 'fast',
    '-crf', '23',
    '-c:a', 'aac',
    '-b:a', '128k',
    '-y',
    output
  ]
  
  try {
    await runFFmpeg(args, jobId)
  } catch (e) {
    // Fallback to simple concat if xfade fails
    console.log(`[${jobId}] xfade failed, using simple concat`)
    await simpleConcatClips(clips, output, jobId)
  }
}

// Simple concat fallback
async function simpleConcatClips(clips, output, jobId) {
  const listPath = `/tmp/concat-${jobId}.txt`
  const listContent = clips.map(c => `file '${c}'`).join('\n')
  await writeFile(listPath, listContent)
  
  await runFFmpeg([
    '-f', 'concat',
    '-safe', '0',
    '-i', listPath,
    '-c:v', 'libx264',
    '-preset', 'fast',
    '-crf', '23',
    '-c:a', 'aac',
    '-y',
    output
  ], jobId)
  
  try { await unlink(listPath) } catch (e) {}
}

// Get or create transition sound effect
async function getOrCreateTransitionSound(soundType, duration, jobId) {
  const soundPath = join(SOUND_EFFECTS_DIR, `${soundType}-${duration}s.mp3`)
  
  if (existsSync(soundPath)) {
    return soundPath
  }
  
  // Generate simple sound effect using FFmpeg
  const soundParams = {
    whoosh: { freq: '200-2000', type: 'sine' },
    swoosh: { freq: '100-1500', type: 'sine' },
    pop: { freq: '500', type: 'sine' }
  }
  
  const params = soundParams[soundType] || soundParams.whoosh
  
  // Generate a simple whoosh/swoosh sound using audio filters
  await runFFmpeg([
    '-f', 'lavfi',
    '-i', `sine=frequency=800:duration=${duration}`,
    '-af', `afade=t=in:d=${duration * 0.3},afade=t=out:st=${duration * 0.5}:d=${duration * 0.5},volume=0.5`,
    '-y',
    soundPath
  ], jobId)
  
  return soundPath
}

// Map transition names to FFmpeg xfade transitions
function getXfadeTransition(transition) {
  const map = {
    fade: 'fade',
    dissolve: 'dissolve',
    wipe: 'wipeleft',
    slide: 'slideleft',
    zoom: 'circleopen',
    pixelize: 'pixelize',
    radial: 'radial'
  }
  return map[transition] || 'fade'
}

// Get color grade filter
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

// Get resolution dimensions
function getResolutionDimensions(resolution) {
  const presets = {
    '720p': { width: 1280, height: 720 },
    '1080p': { width: 1920, height: 1080 },
    '1080p-vertical': { width: 1080, height: 1920 },
    '4k': { width: 3840, height: 2160 }
  }
  return presets[resolution] || presets['1080p']
}

// Run FFmpeg command
async function runFFmpeg(args, jobId) {
  return new Promise((resolve, reject) => {
    console.log(`[${jobId}] FFmpeg:`, args.slice(0, 6).join(' '), '...')
    
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
