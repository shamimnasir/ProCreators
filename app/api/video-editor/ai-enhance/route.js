import { NextResponse } from 'next/server'
import { spawn } from 'child_process'
import { mkdir, writeFile, unlink, copyFile, stat } from 'fs/promises'
import { existsSync } from 'fs'
import { join } from 'path'
import { randomUUID } from 'crypto'

export const maxDuration = 300
export const dynamic = 'force-dynamic'

const OUTPUT_DIR = '/app/public/video-editor/output'

/**
 * AI-powered video enhancement features:
 * 1. Silence Removal - Remove dead air/pauses
 * 2. Audio Ducking - Auto-lower music when speech detected
 * 3. Filler Word Removal - Cut "um", "uh", "like" etc.
 * 4. Speed up silences (alternative to cutting)
 */
export async function POST(request) {
  const jobId = randomUUID()
  const tempDir = `/tmp/ai-enhance-${jobId}`
  
  try {
    const body = await request.json()
    const {
      filePath,
      features = [],  // Array of features to apply
      silenceThreshold = -30,  // dB threshold for silence detection
      silenceMinDuration = 0.5,  // Minimum silence duration to detect (seconds)
      silenceAction = 'remove',  // 'remove', 'speed_up', 'keep'
      speedUpFactor = 3,  // How much to speed up silences
      // Comprehensive filler words list based on user guidelines
      fillerWords = [
        // Basic filler sounds
        'um', 'uh', 'uhh', 'umm', 'ummm', 'oh', 'er', 'err', 'ah', 'ahh', 'aah', 'aaa',
        'mmm', 'mm', 'hmm', 'hm', 'mhm',
        
        // Extended sounds (with variations)
        'then', 'thenn', 'thennnn',
        'so', 'soo', 'sooo',
        'well', 'welll',
        
        // Adverbs of intensity (often unnecessary)
        'very', 'really', 'highly',
        
        // Common filler words
        'like', 'just', 'actually', 'basically', 'literally', 'seriously', 'totally',
        
        // Phrases (will check these separately)
        'you know', 'you see', 'right',
        'i mean', 'i guess', 'i suppose',
        'sort of', 'kind of', 'kinda', 'sorta',
        
        // Hesitation/hedge words
        'okay', 'ok', 'yeah', 'yep', 'nah',
        
        // Bengali common fillers
        'মানে', 'আসলে', 'তো', 'এই', 'ওই', 'আচ্ছা', 'হ্যাঁ'
      ],
      transcript = null,  // Whisper transcript with word timestamps
      musicPath = null,  // Background music for ducking
      duckingRatio = 0.2,  // Music volume when speech detected (0.2 = 20%)
    } = body
    
    if (!filePath) {
      return NextResponse.json({ success: false, error: 'filePath required' }, { status: 400 })
    }
    
    const inputPath = join('/app/public', filePath)
    if (!existsSync(inputPath)) {
      return NextResponse.json({ success: false, error: 'Video not found' }, { status: 404 })
    }
    
    await mkdir(tempDir, { recursive: true })
    await mkdir(OUTPUT_DIR, { recursive: true })
    
    console.log(`[${jobId}] AI Enhancement: ${features.join(', ')}`)
    
    let currentInput = inputPath
    const results = {}
    
    // Feature 1: Silence Detection & Removal
    if (features.includes('silence_removal')) {
      console.log(`[${jobId}] Detecting silences...`)
      
      // Detect silent segments
      const silences = await detectSilences(currentInput, silenceThreshold, silenceMinDuration, jobId)
      results.silencesDetected = silences.length
      results.silenceDuration = silences.reduce((sum, s) => sum + (s.end - s.start), 0)
      
      if (silences.length > 0 && silenceAction !== 'keep') {
        const outputPath = join(tempDir, `silence-removed.mp4`)
        
        if (silenceAction === 'remove') {
          await removeSilences(currentInput, outputPath, silences, jobId)
        } else if (silenceAction === 'speed_up') {
          await speedUpSilences(currentInput, outputPath, silences, speedUpFactor, jobId)
        }
        
        currentInput = outputPath
        console.log(`[${jobId}] Removed ${silences.length} silent segments (${results.silenceDuration.toFixed(1)}s)`)
      }
    }
    
    // Feature 2: Filler Word Removal
    if (features.includes('filler_removal') && transcript?.segments) {
      console.log(`[${jobId}] Detecting filler words...`)
      
      // Log what's in the transcript for debugging
      console.log(`[${jobId}] Transcript segments: ${transcript.segments.length}`)
      const sampleWords = transcript.segments.slice(0, 3).map(s => s.text).join(' | ')
      console.log(`[${jobId}] Sample transcript: ${sampleWords}`)
      
      const fillerSegments = detectFillerWords(transcript, fillerWords)
      results.fillersDetected = fillerSegments.length
      results.fillerDuration = fillerSegments.reduce((sum, s) => sum + (s.end - s.start), 0)
      
      // Log detected fillers
      if (fillerSegments.length > 0) {
        console.log(`[${jobId}] Found fillers: ${fillerSegments.map(f => f.word).join(', ')}`)
      } else {
        console.log(`[${jobId}] No fillers detected in transcript. Whisper may not have transcribed them.`)
      }
      
      const fillerSegments = detectFillerWords(transcript, fillerWords)
      results.fillersDetected = fillerSegments.length
      results.fillerDuration = fillerSegments.reduce((sum, s) => sum + (s.end - s.start), 0)
      
      if (fillerSegments.length > 0) {
        const outputPath = join(tempDir, `fillers-removed.mp4`)
        await removeSegments(currentInput, outputPath, fillerSegments, jobId)
        currentInput = outputPath
        console.log(`[${jobId}] Removed ${fillerSegments.length} filler words (${results.fillerDuration.toFixed(1)}s)`)
      }
    }
    
    // Feature 3: Audio Ducking (lower music when speech)
    if (features.includes('audio_ducking') && musicPath) {
      console.log(`[${jobId}] Applying audio ducking...`)
      
      const musicFullPath = join('/app/public', musicPath)
      if (existsSync(musicFullPath)) {
        const outputPath = join(tempDir, `ducked.mp4`)
        await applyAudioDucking(currentInput, outputPath, musicFullPath, duckingRatio, jobId)
        currentInput = outputPath
        results.audioDuckingApplied = true
      }
    }
    
    // Copy final output
    const finalOutput = join(OUTPUT_DIR, `${jobId}-enhanced.mp4`)
    await copyFile(currentInput, finalOutput)
    
    // Cleanup
    try {
      const { rm } = await import('fs/promises')
      await rm(tempDir, { recursive: true, force: true })
    } catch (e) {}
    
    const stats = await stat(finalOutput)
    
    console.log(`[${jobId}] ✅ AI Enhancement complete: ${Math.round(stats.size / 1024 / 1024)}MB`)
    
    return NextResponse.json({
      success: true,
      jobId,
      outputPath: `/video-editor/output/${jobId}-enhanced.mp4`,
      fileSize: stats.size,
      results
    })
    
  } catch (error) {
    console.error(`[${jobId}] AI Enhancement error:`, error)
    
    try {
      const { rm } = await import('fs/promises')
      await rm(tempDir, { recursive: true, force: true })
    } catch (e) {}
    
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

// Detect silent segments in video
async function detectSilences(videoPath, threshold, minDuration, jobId) {
  return new Promise((resolve, reject) => {
    const silences = []
    
    const ffmpeg = spawn('ffmpeg', [
      '-i', videoPath,
      '-af', `silencedetect=noise=${threshold}dB:d=${minDuration}`,
      '-f', 'null',
      '-'
    ])
    
    let stderr = ''
    ffmpeg.stderr.on('data', (data) => {
      stderr += data.toString()
      
      // Parse silence_start and silence_end from FFmpeg output
      const lines = data.toString().split('\n')
      for (const line of lines) {
        const startMatch = line.match(/silence_start: ([\d.]+)/)
        const endMatch = line.match(/silence_end: ([\d.]+)/)
        
        if (startMatch) {
          silences.push({ start: parseFloat(startMatch[1]), end: null })
        }
        if (endMatch && silences.length > 0) {
          const lastSilence = silences[silences.length - 1]
          if (lastSilence.end === null) {
            lastSilence.end = parseFloat(endMatch[1])
          }
        }
      }
    })
    
    ffmpeg.on('close', (code) => {
      // Filter out incomplete silences
      const validSilences = silences.filter(s => s.start !== null && s.end !== null)
      resolve(validSilences)
    })
    
    ffmpeg.on('error', reject)
  })
}

// Remove silent segments from video
async function removeSilences(inputPath, outputPath, silences, jobId) {
  // Get video duration first
  const duration = await getVideoDuration(inputPath)
  
  // Create list of segments to KEEP (inverse of silences)
  const keepSegments = []
  let lastEnd = 0
  
  for (const silence of silences) {
    if (silence.start > lastEnd) {
      keepSegments.push({ start: lastEnd, end: silence.start })
    }
    lastEnd = silence.end
  }
  
  // Add final segment if needed
  if (lastEnd < duration) {
    keepSegments.push({ start: lastEnd, end: duration })
  }
  
  if (keepSegments.length === 0) {
    await copyFile(inputPath, outputPath)
    return
  }
  
  // Build filter complex to concat kept segments
  const filterParts = []
  const concatInputs = []
  
  keepSegments.forEach((seg, i) => {
    filterParts.push(`[0:v]trim=start=${seg.start}:end=${seg.end},setpts=PTS-STARTPTS[v${i}]`)
    filterParts.push(`[0:a]atrim=start=${seg.start}:end=${seg.end},asetpts=PTS-STARTPTS[a${i}]`)
    concatInputs.push(`[v${i}][a${i}]`)
  })
  
  const filterComplex = filterParts.join(';') + `;${concatInputs.join('')}concat=n=${keepSegments.length}:v=1:a=1[outv][outa]`
  
  await runFFmpeg([
    '-i', inputPath,
    '-filter_complex', filterComplex,
    '-map', '[outv]',
    '-map', '[outa]',
    '-c:v', 'libx264', '-preset', 'fast', '-crf', '23',
    '-c:a', 'aac', '-b:a', '128k',
    '-y', outputPath
  ], jobId)
}

// Speed up silent segments instead of removing
async function speedUpSilences(inputPath, outputPath, silences, speedFactor, jobId) {
  const duration = await getVideoDuration(inputPath)
  
  // Build complex filter for variable speed
  const filterParts = []
  const concatInputs = []
  let lastEnd = 0
  let segIndex = 0
  
  for (const silence of silences) {
    // Normal speed segment before silence
    if (silence.start > lastEnd) {
      filterParts.push(`[0:v]trim=start=${lastEnd}:end=${silence.start},setpts=PTS-STARTPTS[v${segIndex}]`)
      filterParts.push(`[0:a]atrim=start=${lastEnd}:end=${silence.start},asetpts=PTS-STARTPTS[a${segIndex}]`)
      concatInputs.push(`[v${segIndex}][a${segIndex}]`)
      segIndex++
    }
    
    // Sped up silence segment
    filterParts.push(`[0:v]trim=start=${silence.start}:end=${silence.end},setpts=PTS/${speedFactor}-STARTPTS[v${segIndex}]`)
    filterParts.push(`[0:a]atrim=start=${silence.start}:end=${silence.end},atempo=${speedFactor},asetpts=PTS-STARTPTS[a${segIndex}]`)
    concatInputs.push(`[v${segIndex}][a${segIndex}]`)
    segIndex++
    
    lastEnd = silence.end
  }
  
  // Final segment
  if (lastEnd < duration) {
    filterParts.push(`[0:v]trim=start=${lastEnd},setpts=PTS-STARTPTS[v${segIndex}]`)
    filterParts.push(`[0:a]atrim=start=${lastEnd},asetpts=PTS-STARTPTS[a${segIndex}]`)
    concatInputs.push(`[v${segIndex}][a${segIndex}]`)
    segIndex++
  }
  
  const filterComplex = filterParts.join(';') + `;${concatInputs.join('')}concat=n=${segIndex}:v=1:a=1[outv][outa]`
  
  await runFFmpeg([
    '-i', inputPath,
    '-filter_complex', filterComplex,
    '-map', '[outv]',
    '-map', '[outa]',
    '-c:v', 'libx264', '-preset', 'fast', '-crf', '23',
    '-c:a', 'aac', '-b:a', '128k',
    '-y', outputPath
  ], jobId)
}

// Detect filler words from transcript
function detectFillerWords(transcript, fillerWords) {
  const fillerSegments = []
  const fillerSet = new Set(fillerWords.map(f => f.toLowerCase()))
  
  // Also detect by patterns (catches "ummm", "uhhh", etc.)
  const fillerPatterns = [
    /^u+[mh]+$/i,        // um, umm, ummm, uh, uhh, uhhh
    /^a+[hm]+$/i,        // ah, ahh, am, amm, ammm
    /^e+r+$/i,           // er, err, errr
    /^m+h*m*$/i,         // mm, mmm, mhm, hmm
    /^h+m+$/i,           // hm, hmm, hmmm
    /^o+[hk]+$/i,        // oh, ohh, ok, okk
  ]
  
  if (!transcript.segments) return fillerSegments
  
  for (const segment of transcript.segments) {
    // Check if segment has word-level timestamps
    if (segment.words) {
      for (const word of segment.words) {
        const cleanWord = word.word.toLowerCase().replace(/[^a-z\u0980-\u09FF]/g, '')
        
        // Check exact match
        if (fillerSet.has(cleanWord)) {
          fillerSegments.push({
            start: word.start,
            end: word.end,
            word: word.word
          })
          continue
        }
        
        // Check pattern match (catches variations like "ummm", "uhhh")
        for (const pattern of fillerPatterns) {
          if (pattern.test(cleanWord)) {
            fillerSegments.push({
              start: word.start,
              end: word.end,
              word: word.word
            })
            break
          }
        }
      }
    } else {
      // Fallback: check entire segment text
      const words = segment.text.toLowerCase().split(/\s+/)
      for (const filler of fillerWords) {
        if (words.includes(filler.toLowerCase())) {
          // Can't get exact timestamps, mark whole segment
          fillerSegments.push({
            start: segment.start,
            end: segment.end,
            word: filler,
            approximate: true
          })
          break
        }
      }
    }
  }
  
  // Merge overlapping segments
  fillerSegments.sort((a, b) => a.start - b.start)
  const merged = []
  for (const seg of fillerSegments) {
    if (merged.length === 0 || seg.start > merged[merged.length - 1].end + 0.1) {
      merged.push({ ...seg })
    } else {
      merged[merged.length - 1].end = Math.max(merged[merged.length - 1].end, seg.end)
    }
  }
  
  return merged
}

// Remove specific segments from video (for filler words)
async function removeSegments(inputPath, outputPath, segments, jobId) {
  // Same logic as removeSilences - keep everything except the segments
  const duration = await getVideoDuration(inputPath)
  
  const keepSegments = []
  let lastEnd = 0
  
  for (const seg of segments) {
    if (seg.start > lastEnd + 0.05) {  // Small buffer
      keepSegments.push({ start: lastEnd, end: seg.start })
    }
    lastEnd = seg.end
  }
  
  if (lastEnd < duration) {
    keepSegments.push({ start: lastEnd, end: duration })
  }
  
  if (keepSegments.length === 0) {
    await copyFile(inputPath, outputPath)
    return
  }
  
  const filterParts = []
  const concatInputs = []
  
  keepSegments.forEach((seg, i) => {
    filterParts.push(`[0:v]trim=start=${seg.start}:end=${seg.end},setpts=PTS-STARTPTS[v${i}]`)
    filterParts.push(`[0:a]atrim=start=${seg.start}:end=${seg.end},asetpts=PTS-STARTPTS[a${i}]`)
    concatInputs.push(`[v${i}][a${i}]`)
  })
  
  const filterComplex = filterParts.join(';') + `;${concatInputs.join('')}concat=n=${keepSegments.length}:v=1:a=1[outv][outa]`
  
  await runFFmpeg([
    '-i', inputPath,
    '-filter_complex', filterComplex,
    '-map', '[outv]',
    '-map', '[outa]',
    '-c:v', 'libx264', '-preset', 'fast', '-crf', '23',
    '-c:a', 'aac', '-b:a', '128k',
    '-y', outputPath
  ], jobId)
}

// Apply audio ducking (lower music when speech detected)
async function applyAudioDucking(videoPath, outputPath, musicPath, duckRatio, jobId) {
  // Use sidechain compression: music ducks when video audio is loud
  const filterComplex = [
    // Split video audio for sidechain
    '[0:a]asplit=2[voice][sc]',
    // Apply compressor to music, sidechained by voice
    `[1:a][sc]sidechaincompress=threshold=0.02:ratio=10:attack=200:release=1000:level_sc=1[music]`,
    // Mix ducked music with voice
    `[voice][music]amix=inputs=2:duration=first:weights=1 ${duckRatio}[aout]`
  ].join(';')
  
  await runFFmpeg([
    '-i', videoPath,
    '-i', musicPath,
    '-filter_complex', filterComplex,
    '-map', '0:v',
    '-map', '[aout]',
    '-c:v', 'copy',
    '-c:a', 'aac', '-b:a', '192k',
    '-shortest',
    '-y', outputPath
  ], jobId)
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
    proc.on('close', () => resolve(parseFloat(out) || 60))
  })
}

// Run FFmpeg
function runFFmpeg(args, jobId) {
  return new Promise((resolve, reject) => {
    console.log(`[${jobId}] FFmpeg: ${args.slice(0, 6).join(' ')}...`)
    const proc = spawn('ffmpeg', args)
    let err = ''
    proc.stderr.on('data', d => err += d)
    proc.on('close', code => {
      if (code === 0) resolve()
      else {
        console.error(`[${jobId}] FFmpeg error:`, err.slice(-500))
        reject(new Error(`FFmpeg failed: ${err.slice(-200)}`))
      }
    })
    proc.on('error', reject)
  })
}

// GET: Return available AI features
export async function GET() {
  return NextResponse.json({
    success: true,
    features: [
      { id: 'silence_removal', name: 'Remove Silences', description: 'Auto-detect and remove dead air' },
      { id: 'filler_removal', name: 'Remove Fillers', description: 'Cut um, uh, like, amm, etc.' },
      { id: 'audio_ducking', name: 'Smart Music Ducking', description: 'Auto-lower music during speech' }
    ],
    fillerWords: [
      'um', 'uh', 'uhh', 'umm', 'ummm', 'er', 'err', 'ah', 'ahh', 'aah',
      'like', 'so', 'well', 'right', 'okay', 'ok',
      'you know', 'i mean', 'basically', 'actually', 'literally',
      'hmm', 'hm', 'mmm', 'mm', 'mhm', 'aam', 'amm', 'ammm', 'aaa', 'eee'
    ],
    patterns: ['u+[mh]+', 'a+[hm]+', 'e+r+', 'm+h*m*', 'h+m+']
  })
}
