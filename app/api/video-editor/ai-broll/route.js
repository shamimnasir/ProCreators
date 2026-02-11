import { NextResponse } from 'next/server'
import { spawn } from 'child_process'
import { mkdir, writeFile, copyFile, stat, unlink } from 'fs/promises'
import { existsSync } from 'fs'
import { join } from 'path'
import { randomUUID } from 'crypto'

export const maxDuration = 120
export const dynamic = 'force-dynamic'

const OUTPUT_DIR = '/app/public/video-editor/output'

/**
 * AI B-Roll Suggestions & Insertion
 * Analyzes transcript to suggest relevant stock videos
 * Can auto-insert B-roll at suggested timestamps
 */
export async function POST(request) {
  const jobId = randomUUID()
  
  try {
    const body = await request.json()
    const {
      transcript,           // Whisper transcript with segments
      mode = 'suggest',     // 'suggest' or 'insert'
      filePath = null,      // Original video (for insert mode)
      brollSelections = [], // Array of { timestamp, stockVideoUrl, duration }
      maxSuggestions = 5,
    } = body
    
    if (!transcript?.segments) {
      return NextResponse.json({ success: false, error: 'Transcript with segments required' }, { status: 400 })
    }
    
    // Analyze transcript to find good B-roll insertion points
    const suggestions = await analyzeBrollOpportunities(transcript, maxSuggestions)
    
    if (mode === 'suggest') {
      // Just return suggestions
      return NextResponse.json({
        success: true,
        jobId,
        suggestions,
        message: `Found ${suggestions.length} B-roll opportunities`
      })
    }
    
    // Insert mode - actually add B-roll to video
    if (mode === 'insert' && filePath && brollSelections.length > 0) {
      await mkdir(OUTPUT_DIR, { recursive: true })
      
      const inputPath = join('/app/public', filePath)
      if (!existsSync(inputPath)) {
        return NextResponse.json({ success: false, error: 'Video not found' }, { status: 404 })
      }
      
      const outputPath = join(OUTPUT_DIR, `${jobId}-with-broll.mp4`)
      await insertBroll(inputPath, outputPath, brollSelections, jobId)
      
      const stats = await stat(outputPath)
      
      return NextResponse.json({
        success: true,
        jobId,
        outputPath: `/video-editor/output/${jobId}-with-broll.mp4`,
        fileSize: stats.size,
        brollInserted: brollSelections.length
      })
    }
    
    return NextResponse.json({
      success: true,
      jobId,
      suggestions
    })
    
  } catch (error) {
    console.error(`[${jobId}] B-Roll error:`, error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

// Analyze transcript to find B-roll opportunities
async function analyzeBrollOpportunities(transcript, maxSuggestions) {
  const suggestions = []
  
  // Keywords that typically benefit from B-roll
  const brollTriggers = {
    // Actions & Activities
    'working': ['office work', 'typing', 'business'],
    'walking': ['walking', 'footsteps', 'path'],
    'running': ['running', 'jogging', 'fitness'],
    'eating': ['food', 'restaurant', 'dining'],
    'cooking': ['cooking', 'kitchen', 'chef'],
    'driving': ['car driving', 'road', 'traffic'],
    'traveling': ['travel', 'airport', 'adventure'],
    'studying': ['studying', 'books', 'education'],
    
    // Places
    'city': ['city skyline', 'urban', 'buildings'],
    'beach': ['beach', 'ocean', 'waves'],
    'mountain': ['mountain', 'nature', 'hiking'],
    'office': ['office', 'workplace', 'business'],
    'home': ['home interior', 'living room', 'cozy'],
    'school': ['classroom', 'education', 'students'],
    'hospital': ['hospital', 'medical', 'healthcare'],
    
    // Concepts
    'money': ['money', 'finance', 'currency'],
    'time': ['clock', 'time', 'schedule'],
    'technology': ['technology', 'computer', 'digital'],
    'success': ['success', 'achievement', 'celebration'],
    'problem': ['challenge', 'thinking', 'solution'],
    'team': ['teamwork', 'collaboration', 'meeting'],
    'growth': ['growth', 'progress', 'chart'],
    'nature': ['nature', 'landscape', 'green'],
    
    // Emotions
    'happy': ['happy', 'joy', 'smile'],
    'sad': ['sad', 'melancholy', 'rain'],
    'excited': ['excitement', 'celebration', 'energy'],
    'stressed': ['stress', 'overwhelmed', 'busy'],
  }
  
  for (const segment of transcript.segments) {
    const text = segment.text.toLowerCase()
    const words = text.split(/\s+/)
    
    for (const [trigger, searchTerms] of Object.entries(brollTriggers)) {
      if (text.includes(trigger)) {
        // Check if we already have a suggestion near this timestamp
        const nearbyExists = suggestions.some(s => 
          Math.abs(s.timestamp - segment.start) < 5
        )
        
        if (!nearbyExists && suggestions.length < maxSuggestions) {
          suggestions.push({
            timestamp: segment.start,
            duration: Math.min(3, segment.end - segment.start),
            trigger: trigger,
            searchKeywords: searchTerms,
            context: segment.text.slice(0, 100),
            confidence: calculateConfidence(text, trigger)
          })
        }
        break
      }
    }
  }
  
  // Sort by confidence
  suggestions.sort((a, b) => b.confidence - a.confidence)
  
  return suggestions.slice(0, maxSuggestions)
}

// Calculate confidence score for B-roll suggestion
function calculateConfidence(text, trigger) {
  let score = 0.5
  
  // Higher confidence if trigger is a key word
  if (text.split(/\s+/).includes(trigger)) score += 0.2
  
  // Higher confidence for longer segments (more context)
  if (text.length > 50) score += 0.1
  if (text.length > 100) score += 0.1
  
  // Lower confidence if it's a question
  if (text.includes('?')) score -= 0.1
  
  return Math.min(1, Math.max(0, score))
}

// Insert B-roll clips into video at specified timestamps
async function insertBroll(inputPath, outputPath, brollSelections, jobId) {
  const tempDir = `/tmp/broll-${jobId}`
  await mkdir(tempDir, { recursive: true })
  
  try {
    // Sort selections by timestamp
    brollSelections.sort((a, b) => a.timestamp - b.timestamp)
    
    // Get original video duration
    const originalDuration = await getVideoDuration(inputPath)
    
    // Download B-roll clips
    const downloadedClips = []
    for (let i = 0; i < brollSelections.length; i++) {
      const sel = brollSelections[i]
      const clipPath = join(tempDir, `broll-${i}.mp4`)
      
      // Download or copy the stock video
      if (sel.stockVideoUrl.startsWith('http')) {
        await downloadVideo(sel.stockVideoUrl, clipPath)
      } else {
        const localPath = join('/app/public', sel.stockVideoUrl)
        if (existsSync(localPath)) {
          await copyFile(localPath, clipPath)
        } else {
          continue
        }
      }
      
      downloadedClips.push({
        path: clipPath,
        timestamp: sel.timestamp,
        duration: sel.duration || 3
      })
    }
    
    if (downloadedClips.length === 0) {
      await copyFile(inputPath, outputPath)
      return
    }
    
    // Build filter complex for picture-in-picture or cut-away style
    // For simplicity, we'll do "cut-away" style: replace video at timestamp but keep audio
    
    const filterParts = []
    const segments = []
    let lastEnd = 0
    
    for (let i = 0; i < downloadedClips.length; i++) {
      const clip = downloadedClips[i]
      
      // Original segment before B-roll
      if (clip.timestamp > lastEnd) {
        segments.push({
          type: 'original',
          start: lastEnd,
          end: clip.timestamp
        })
      }
      
      // B-roll segment
      segments.push({
        type: 'broll',
        clipIndex: i,
        duration: clip.duration
      })
      
      lastEnd = clip.timestamp + clip.duration
    }
    
    // Final original segment
    if (lastEnd < originalDuration) {
      segments.push({
        type: 'original',
        start: lastEnd,
        end: originalDuration
      })
    }
    
    // Build inputs
    const inputs = ['-i', inputPath]
    downloadedClips.forEach(c => {
      inputs.push('-i', c.path)
    })
    
    // Build filter for each segment
    let videoConcat = ''
    let audioConcat = ''
    let segIdx = 0
    
    for (const seg of segments) {
      if (seg.type === 'original') {
        filterParts.push(`[0:v]trim=start=${seg.start}:end=${seg.end},setpts=PTS-STARTPTS[v${segIdx}]`)
        filterParts.push(`[0:a]atrim=start=${seg.start}:end=${seg.end},asetpts=PTS-STARTPTS[a${segIdx}]`)
      } else {
        // B-roll video with original audio
        const brollIdx = seg.clipIndex + 1
        const brollStart = downloadedClips[seg.clipIndex].timestamp
        filterParts.push(`[${brollIdx}:v]trim=duration=${seg.duration},setpts=PTS-STARTPTS,scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2[v${segIdx}]`)
        filterParts.push(`[0:a]atrim=start=${brollStart}:end=${brollStart + seg.duration},asetpts=PTS-STARTPTS[a${segIdx}]`)
      }
      videoConcat += `[v${segIdx}]`
      audioConcat += `[a${segIdx}]`
      segIdx++
    }
    
    filterParts.push(`${videoConcat}concat=n=${segIdx}:v=1:a=0[vout]`)
    filterParts.push(`${audioConcat}concat=n=${segIdx}:v=0:a=1[aout]`)
    
    const filterComplex = filterParts.join(';')
    
    await runFFmpeg([
      ...inputs,
      '-filter_complex', filterComplex,
      '-map', '[vout]',
      '-map', '[aout]',
      '-c:v', 'libx264', '-preset', 'fast', '-crf', '23',
      '-c:a', 'aac', '-b:a', '128k',
      '-y', outputPath
    ], jobId)
    
  } finally {
    // Cleanup
    try {
      const { rm } = await import('fs/promises')
      await rm(tempDir, { recursive: true, force: true })
    } catch (e) {}
  }
}

// Download video from URL
async function downloadVideo(url, outputPath) {
  const response = await fetch(url)
  if (!response.ok) throw new Error(`Failed to download: ${url}`)
  
  const buffer = await response.arrayBuffer()
  await writeFile(outputPath, Buffer.from(buffer))
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
    const proc = spawn('ffmpeg', args)
    let err = ''
    proc.stderr.on('data', d => err += d)
    proc.on('close', code => {
      if (code === 0) resolve()
      else reject(new Error(`FFmpeg failed: ${err.slice(-300)}`))
    })
    proc.on('error', reject)
  })
}

export async function GET() {
  return NextResponse.json({
    success: true,
    description: 'AI B-Roll Suggestion & Insertion API',
    modes: ['suggest', 'insert'],
    usage: {
      suggest: 'POST with transcript to get B-roll suggestions',
      insert: 'POST with transcript, filePath, and brollSelections to insert B-roll'
    }
  })
}
