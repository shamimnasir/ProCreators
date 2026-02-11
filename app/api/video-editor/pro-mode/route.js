import { NextResponse } from 'next/server'
import { spawn } from 'child_process'
import { writeFile, mkdir, readFile, unlink, copyFile } from 'fs/promises'
import { existsSync, createWriteStream } from 'fs'
import { join } from 'path'
import { randomUUID } from 'crypto'
import { Readable } from 'stream'
import { pipeline } from 'stream/promises'

export const maxDuration = 300
export const dynamic = 'force-dynamic'

const OUTPUT_DIR = '/app/public/video-editor/output'

// Pro Mode: Transform raw video into professional content
export async function POST(request) {
  const jobId = randomUUID()
  const tempDir = `/tmp/video-editor-pro-${jobId}`
  
  try {
    const body = await request.json()
    const {
      filePath,           // Source video path
      transcript,         // Transcript data from analysis
      brollKeywords = [], // Keywords for B-roll stock videos
      addBroll = false,   // Whether to add B-roll cuts
      brollStyle = 'intercut', // 'intercut', 'overlay', 'replace-silences'
      musicTrack = 'none', // Music selection
      captionStyle = 'bold-outline',
      colorGrade = 'neutral',
      audioEnhance = true,
      removeFillers = false,
      removeSilences = false,
      fillerWords = [],
      silences = [],
      beats = [],         // Beat markers for sync
      scenes = [],        // Scene markers
      resolution = '1080p'
    } = body
    
    if (!filePath) {
      return NextResponse.json({ success: false, error: 'filePath required' }, { status: 400 })
    }
    
    const inputPath = join('/app/public', filePath)
    
    if (!existsSync(inputPath)) {
      return NextResponse.json({ success: false, error: 'Video file not found' }, { status: 404 })
    }
    
    await mkdir(tempDir, { recursive: true })
    await mkdir(OUTPUT_DIR, { recursive: true })
    
    // Get video info
    const videoInfo = await getVideoInfo(inputPath)
    // Step 1: Download B-roll videos if requested
    let brollVideos = []
    if (addBroll && brollKeywords.length > 0) {
      }`)
      brollVideos = await fetchBrollVideos(brollKeywords, tempDir, jobId)
      }
    
    // Step 2: Build segments to remove (fillers + silences)
    const segmentsToRemove = []
    if (removeFillers && fillerWords.length > 0) {
      segmentsToRemove.push(...fillerWords.map(f => ({ start: f.start, end: f.end, type: 'filler' })))
    }
    if (removeSilences && silences.length > 0) {
      // Only remove silences longer than 0.8s
      segmentsToRemove.push(...silences.filter(s => s.duration > 0.8).map(s => ({ start: s.start, end: s.end, type: 'silence' })))
    }
    
    // Step 3: Calculate segments to keep
    const keepSegments = calculateKeepSegments(segmentsToRemove, videoInfo.duration)
    // Step 4: Process main video - extract, normalize, cut
    const targetDimensions = getTargetDimensions(resolution, videoInfo)
    let processedVideoPath = join(tempDir, 'processed-main.mp4')
    
    // If we have segments to remove, do smart cutting
    if (segmentsToRemove.length > 0 && keepSegments.length > 0) {
      await smartCutVideo(inputPath, processedVideoPath, keepSegments, targetDimensions, jobId)
    } else {
      // Just normalize the video
      await normalizeVideo(inputPath, processedVideoPath, targetDimensions, jobId)
    }
    
    // Step 5: Insert B-roll if requested
    if (addBroll && brollVideos.length > 0) {
      const brollVideoPath = join(tempDir, 'with-broll.mp4')
      await insertBroll(processedVideoPath, brollVideoPath, brollVideos, brollStyle, scenes, beats, targetDimensions, jobId)
      processedVideoPath = brollVideoPath
    }
    
    // Step 6: Enhance audio
    if (audioEnhance) {
      const enhancedPath = join(tempDir, 'audio-enhanced.mp4')
      await enhanceAudio(processedVideoPath, enhancedPath, jobId)
      processedVideoPath = enhancedPath
    }
    
    // Step 7: Apply color grading
    if (colorGrade !== 'neutral') {
      const gradedPath = join(tempDir, 'color-graded.mp4')
      await applyColorGrade(processedVideoPath, gradedPath, colorGrade, jobId)
      processedVideoPath = gradedPath
    }
    
    // Step 8: Add captions
    if (transcript && transcript.segments && transcript.segments.length > 0) {
      const captionedPath = join(tempDir, 'captioned.mp4')
      
      // Recalculate transcript timing if we removed segments
      const adjustedTranscript = segmentsToRemove.length > 0 
        ? adjustTranscriptTiming(transcript, keepSegments)
        : transcript
      
      await addCaptions(processedVideoPath, captionedPath, adjustedTranscript, captionStyle, targetDimensions, jobId)
      processedVideoPath = captionedPath
    }
    
    // Step 9: Add background music
    if (musicTrack !== 'none') {
      const musicPath = join(tempDir, 'with-music.mp4')
      await addBackgroundMusic(processedVideoPath, musicPath, musicTrack, jobId)
      processedVideoPath = musicPath
    }
    
    // Step 10: Move to output directory
    const finalPath = join(OUTPUT_DIR, `${jobId}-pro.mp4`)
    await copyFile(processedVideoPath, finalPath)
    
    // Cleanup
    try {
      await require('fs/promises').rm(tempDir, { recursive: true, force: true })
    } catch (e) { /* ignore */ }
    
    const stats = await require('fs/promises').stat(finalPath)
    
    return NextResponse.json({
      success: true,
      jobId,
      outputPath: `/video-editor/output/${jobId}-pro.mp4`,
      fileSize: stats.size,
      features: {
        brollAdded: addBroll && brollVideos.length > 0,
        brollCount: brollVideos.length,
        fillersRemoved: removeFillers ? fillerWords.length : 0,
        silencesRemoved: removeSilences ? silences.filter(s => s.duration > 0.8).length : 0,
        captionsAdded: !!transcript,
        musicAdded: musicTrack !== 'none',
        colorGradeApplied: colorGrade !== 'neutral',
        audioEnhanced: audioEnhance
      }
    })
    
  } catch (error) {
    console.error(`[${jobId}] PRO MODE error:`, error)
    
    try {
      await require('fs/promises').rm(tempDir, { recursive: true, force: true })
    } catch (e) { /* ignore */ }
    
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

// Fetch B-roll videos from stock sources
async function fetchBrollVideos(keywords, tempDir, jobId) {
  const videos = []
  
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
    const response = await fetch(`${baseUrl}/api/story-reels/search-videos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ keywords: keywords.slice(0, 5) })
    })
    
    const data = await response.json()
    
    if (data.success && data.videos) {
      // Download each video
      for (let i = 0; i < Math.min(data.videos.length, 5); i++) {
        const video = data.videos[i]
        const videoPath = join(tempDir, `broll-${i}.mp4`)
        
        try {
          const videoResponse = await fetch(video.url)
          if (videoResponse.ok) {
            const fileStream = createWriteStream(videoPath)
            await pipeline(Readable.fromWeb(videoResponse.body), fileStream)
            videos.push({
              path: videoPath,
              keyword: video.keyword,
              duration: video.duration || 5
            })
            }
        } catch (e) {
          }
      }
    }
  } catch (error) {
    console.error(`[${jobId}] B-roll fetch error:`, error.message)
  }
  
  return videos
}

// Calculate which segments to keep after removing fillers/silences
function calculateKeepSegments(removeSegments, totalDuration) {
  if (!removeSegments || removeSegments.length === 0) {
    return [{ start: 0, end: totalDuration }]
  }
  
  // Sort by start time
  const sorted = [...removeSegments].sort((a, b) => a.start - b.start)
  
  const keepSegments = []
  let currentTime = 0
  
  for (const seg of sorted) {
    if (seg.start > currentTime + 0.1) { // At least 0.1s gap
      keepSegments.push({ start: currentTime, end: seg.start })
    }
    currentTime = Math.max(currentTime, seg.end)
  }
  
  // Add final segment
  if (currentTime < totalDuration - 0.1) {
    keepSegments.push({ start: currentTime, end: totalDuration })
  }
  
  return keepSegments
}

// Smart cut video to remove segments
async function smartCutVideo(input, output, keepSegments, dimensions, jobId) {
  if (keepSegments.length === 0) {
    await copyFile(input, output)
    return
  }
  
  // Build filter for keeping segments
  const filterParts = []
  const concatInputs = []
  
  for (let i = 0; i < keepSegments.length; i++) {
    const seg = keepSegments[i]
    filterParts.push(`[0:v]trim=${seg.start}:${seg.end},setpts=PTS-STARTPTS,scale=${dimensions.width}:${dimensions.height}:force_original_aspect_ratio=increase,crop=${dimensions.width}:${dimensions.height}[v${i}]`)
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

// Normalize video dimensions
async function normalizeVideo(input, output, dimensions, jobId) {
  await runFFmpeg([
    '-i', input,
    '-vf', `scale=${dimensions.width}:${dimensions.height}:force_original_aspect_ratio=increase,crop=${dimensions.width}:${dimensions.height}`,
    '-c:v', 'libx264',
    '-preset', 'fast',
    '-crf', '23',
    '-c:a', 'aac',
    '-b:a', '128k',
    '-y',
    output
  ], jobId)
}

// Insert B-roll cuts
async function insertBroll(mainVideo, output, brollVideos, style, scenes, beats, dimensions, jobId) {
  if (brollVideos.length === 0) {
    await copyFile(mainVideo, output)
    return
  }
  
  // Get main video duration
  const mainDuration = await getVideoDuration(mainVideo)
  
  // Determine insertion points based on style
  let insertPoints = []
  
  if (style === 'intercut' && scenes.length > 0) {
    // Insert at scene changes
    insertPoints = scenes.slice(1).map(s => s.start).slice(0, brollVideos.length)
  } else if (style === 'beat-sync' && beats.length > 0) {
    // Insert at strong beats
    insertPoints = beats.filter(b => b.strength > 0.7).slice(0, brollVideos.length).map(b => b.time)
  } else {
    // Default: evenly distributed
    const interval = mainDuration / (brollVideos.length + 1)
    for (let i = 1; i <= brollVideos.length; i++) {
      insertPoints.push(interval * i)
    }
  }
  
  // For simplicity, we'll use picture-in-picture overlay instead of full cuts
  // This preserves the main audio while showing B-roll visually
  
  // Normalize B-roll videos first
  const normalizedBroll = []
  for (let i = 0; i < brollVideos.length; i++) {
    const normalized = join(require('path').dirname(brollVideos[i].path), `broll-norm-${i}.mp4`)
    await runFFmpeg([
      '-i', brollVideos[i].path,
      '-ss', '3', // Skip first 3 seconds (common watermark area)
      '-t', '3',  // Use 3 seconds of B-roll
      '-vf', `scale=${dimensions.width}:${dimensions.height}:force_original_aspect_ratio=increase,crop=${dimensions.width}:${dimensions.height}`,
      '-an',
      '-c:v', 'libx264',
      '-preset', 'fast',
      '-crf', '23',
      '-y',
      normalized
    ], jobId)
    normalizedBroll.push(normalized)
  }
  
  // Build overlay filter
  let currentInput = mainVideo
  let filterInputs = [`-i`, mainVideo]
  let filterComplex = ''
  let lastOutput = '[0:v]'
  
  for (let i = 0; i < Math.min(normalizedBroll.length, insertPoints.length); i++) {
    filterInputs.push('-i', normalizedBroll[i])
    const insertTime = insertPoints[i]
    const inputIdx = i + 1
    
    // Create overlay with fade in/out
    filterComplex += `${lastOutput}[${inputIdx}:v]overlay=0:0:enable='between(t,${insertTime},${insertTime + 3})':format=yuv420[v${inputIdx}];`
    lastOutput = `[v${inputIdx}]`
  }
  
  // Remove trailing semicolon and add output mapping
  filterComplex = filterComplex.slice(0, -1)
  
  if (filterComplex) {
    await runFFmpeg([
      ...filterInputs,
      '-filter_complex', filterComplex,
      '-map', lastOutput,
      '-map', '0:a',
      '-c:v', 'libx264',
      '-preset', 'fast',
      '-crf', '23',
      '-c:a', 'copy',
      '-y',
      output
    ], jobId)
  } else {
    await copyFile(mainVideo, output)
  }
}

// Enhance audio
async function enhanceAudio(input, output, jobId) {
  await runFFmpeg([
    '-i', input,
    '-af', 'highpass=f=80,lowpass=f=12000,afftdn=nf=-25,loudnorm=I=-16:TP=-1.5:LRA=11',
    '-c:v', 'copy',
    '-c:a', 'aac',
    '-b:a', '192k',
    '-y',
    output
  ], jobId)
}

// Apply color grading
async function applyColorGrade(input, output, preset, jobId) {
  const presets = {
    warm: 'colortemperature=temperature=6500,eq=saturation=1.1',
    cool: 'colortemperature=temperature=7500,eq=saturation=0.95',
    cinematic: 'eq=contrast=1.1:saturation=0.9:brightness=-0.05,curves=preset=vintage',
    vibrant: 'eq=saturation=1.3:contrast=1.05',
    bw: 'hue=s=0',
    vintage: 'curves=preset=vintage,eq=saturation=0.8',
    highcontrast: 'eq=contrast=1.3:brightness=0.05'
  }
  
  const filter = presets[preset] || 'null'
  
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

// Add captions
async function addCaptions(input, output, transcript, style, dimensions, jobId) {
  const tempDir = require('path').dirname(input)
  const assPath = join(tempDir, 'captions.ass')
  
  // Generate ASS content
  const assContent = generateASS(transcript, style, dimensions)
  await writeFile(assPath, assContent)
  
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
}

// Add background music
async function addBackgroundMusic(input, output, musicTrack, jobId) {
  const musicPaths = {
    upbeat: '/app/public/music/upbeat.mp3',
    calm: '/app/public/music/calm.mp3',
    epic: '/app/public/music/epic.mp3',
    emotional: '/app/public/music/emotional.mp3'
  }
  
  const musicPath = musicPaths[musicTrack]
  
  if (!musicPath || !existsSync(musicPath)) {
    await copyFile(input, output)
    return
  }
  
  const duration = await getVideoDuration(input)
  
  await runFFmpeg([
    '-i', input,
    '-i', musicPath,
    '-filter_complex', `[1:a]volume=0.15,afade=t=out:st=${Math.max(duration - 2, 0)}:d=2[music];[0:a][music]amix=inputs=2:duration=shortest[out]`,
    '-map', '0:v',
    '-map', '[out]',
    '-c:v', 'copy',
    '-c:a', 'aac',
    '-b:a', '192k',
    '-shortest',
    '-y',
    output
  ], jobId)
}

// Adjust transcript timing after segment removal
function adjustTranscriptTiming(transcript, keepSegments) {
  if (!transcript || !transcript.segments) return transcript
  
  const adjusted = { ...transcript, segments: [] }
  let timeOffset = 0
  let segmentIdx = 0
  
  for (const seg of transcript.segments) {
    // Find which keep segment this falls into
    while (segmentIdx < keepSegments.length && keepSegments[segmentIdx].end < seg.start) {
      segmentIdx++
    }
    
    if (segmentIdx < keepSegments.length) {
      const keepSeg = keepSegments[segmentIdx]
      
      if (seg.start >= keepSeg.start && seg.end <= keepSeg.end) {
        // Calculate new timing
        let newStart = seg.start - keepSeg.start
        let newEnd = seg.end - keepSeg.start
        
        // Add offset from previous segments
        for (let i = 0; i < segmentIdx; i++) {
          const prevSeg = keepSegments[i]
          newStart += prevSeg.end - prevSeg.start
          newEnd += prevSeg.end - prevSeg.start
        }
        
        adjusted.segments.push({
          ...seg,
          start: newStart,
          end: newEnd
        })
      }
    }
  }
  
  return adjusted
}

// Generate ASS subtitle content
function generateASS(transcript, style, dimensions) {
  const height = dimensions.height || 1920
  const width = dimensions.width || 1080
  
  const styles = {
    'bold-outline': { fontSize: 64, outline: 5, shadow: 3, primaryColor: '&H00FFFFFF', outlineColor: '&H00000000' },
    'neon-glow': { fontSize: 64, outline: 10, shadow: 15, primaryColor: '&H00FFFFFF', outlineColor: '&H00FF00FF' },
    'yellow-highlight': { fontSize: 64, outline: 12, shadow: 0, primaryColor: '&H00000000', outlineColor: '&H0000FFFF' },
    'tiktok-style': { fontSize: 64, outline: 5, shadow: 3, primaryColor: '&H00FFFFFF', outlineColor: '&H000000FF' },
    'minimal-clean': { fontSize: 48, outline: 2, shadow: 1, primaryColor: '&H00FFFFFF', outlineColor: '&H00000000' }
  }
  
  const s = styles[style] || styles['bold-outline']
  
  let ass = `\ufeff[Script Info]
Title: Video Editor Captions
ScriptType: v4.00+
PlayResX: ${width}
PlayResY: ${height}
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,Arial,${s.fontSize},${s.primaryColor},&H000000FF,${s.outlineColor},&H00000000,-1,0,0,0,100,100,0,0,1,${s.outline},${s.shadow},2,10,10,100,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
`

  for (const seg of transcript.segments) {
    const start = formatASSTime(seg.start)
    const end = formatASSTime(seg.end)
    ass += `Dialogue: 0,${start},${end},Default,,0,0,0,,${seg.text}\n`
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

// Helper functions
async function getVideoInfo(videoPath) {
  return new Promise((resolve, reject) => {
    const ffprobe = spawn('ffprobe', [
      '-v', 'error',
      '-select_streams', 'v:0',
      '-show_entries', 'stream=width,height:format=duration',
      '-of', 'json',
      videoPath
    ])
    
    let stdout = ''
    ffprobe.stdout.on('data', (data) => { stdout += data.toString() })
    ffprobe.on('close', (code) => {
      if (code === 0) {
        try {
          const data = JSON.parse(stdout)
          const stream = data.streams?.[0] || {}
          resolve({
            width: stream.width || 1920,
            height: stream.height || 1080,
            duration: parseFloat(data.format?.duration) || 0
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

async function getVideoDuration(videoPath) {
  return new Promise((resolve) => {
    const ffprobe = spawn('ffprobe', [
      '-v', 'error',
      '-show_entries', 'format=duration',
      '-of', 'default=noprint_wrappers=1:nokey=1',
      videoPath
    ])
    
    let stdout = ''
    ffprobe.stdout.on('data', (data) => { stdout += data.toString() })
    ffprobe.on('close', () => resolve(parseFloat(stdout.trim()) || 0))
  })
}

function getTargetDimensions(resolution, sourceInfo) {
  const presets = {
    '720p': { width: 720, height: 1280 },
    '1080p': { width: 1080, height: 1920 },
    '4k': { width: 2160, height: 3840 }
  }
  
  // Default to 9:16 portrait
  return presets[resolution] || presets['1080p']
}

async function runFFmpeg(args, jobId) {
  return new Promise((resolve, reject) => {
    .join(' '), '...')
    
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
