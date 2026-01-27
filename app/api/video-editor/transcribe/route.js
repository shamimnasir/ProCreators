import { NextResponse } from 'next/server'
import { spawn } from 'child_process'
import { writeFile, mkdir, readFile, unlink } from 'fs/promises'
import { existsSync } from 'fs'
import { join } from 'path'
import { randomUUID } from 'crypto'

export const maxDuration = 300
export const dynamic = 'force-dynamic'

// Transcribe video using Whisper
export async function POST(request) {
  const jobId = randomUUID()
  
  try {
    const { fileId, filePath, language = 'en' } = await request.json()
    
    if (!fileId && !filePath) {
      return NextResponse.json({ success: false, error: 'fileId or filePath required' }, { status: 400 })
    }
    
    const videoPath = filePath 
      ? join('/app/public', filePath)
      : join('/app/public/video-editor/uploads', `${fileId}.mp4`)
    
    if (!existsSync(videoPath)) {
      return NextResponse.json({ success: false, error: 'Video file not found' }, { status: 404 })
    }
    
    console.log(`[${jobId}] Transcribing video: ${videoPath}`)
    
    // Extract audio from video using FFmpeg
    const audioPath = `/tmp/audio-${jobId}.wav`
    
    await new Promise((resolve, reject) => {
      const ffmpeg = spawn('ffmpeg', [
        '-i', videoPath,
        '-vn',
        '-acodec', 'pcm_s16le',
        '-ar', '16000',
        '-ac', '1',
        '-y',
        audioPath
      ])
      
      let stderr = ''
      ffmpeg.stderr.on('data', (data) => { stderr += data.toString() })
      ffmpeg.on('close', (code) => {
        if (code === 0) resolve()
        else reject(new Error(`FFmpeg failed: ${stderr.slice(-500)}`))
      })
      ffmpeg.on('error', reject)
    })
    
    console.log(`[${jobId}] Audio extracted, running Whisper...`)
    
    // Run Whisper transcription
    const outputDir = `/tmp/whisper-${jobId}`
    await mkdir(outputDir, { recursive: true })
    
    // Use whisper CLI with word-level timestamps (use full path to venv)
    const whisperPath = '/root/.venv/bin/whisper'
    const whisperResult = await new Promise((resolve, reject) => {
      const whisper = spawn(whisperPath, [
        audioPath,
        '--model', 'base',  // Use 'base' model for balance of speed/accuracy
        '--language', language,
        '--output_format', 'json',
        '--output_dir', outputDir,
        '--word_timestamps', 'True'
      ])
      
      let stdout = ''
      let stderr = ''
      whisper.stdout.on('data', (data) => { stdout += data.toString() })
      whisper.stderr.on('data', (data) => { stderr += data.toString() })
      
      whisper.on('close', async (code) => {
        console.log(`[${jobId}] Whisper exit code: ${code}`)
        if (code === 0) {
          try {
            // Read the JSON output
            const jsonPath = join(outputDir, `audio-${jobId}.json`)
            if (existsSync(jsonPath)) {
              const jsonContent = await readFile(jsonPath, 'utf-8')
              resolve(JSON.parse(jsonContent))
            } else {
              // Try alternative path
              const files = await require('fs/promises').readdir(outputDir)
              const jsonFile = files.find(f => f.endsWith('.json'))
              if (jsonFile) {
                const jsonContent = await readFile(join(outputDir, jsonFile), 'utf-8')
                resolve(JSON.parse(jsonContent))
              } else {
                reject(new Error('Whisper output not found'))
              }
            }
          } catch (e) {
            reject(new Error(`Failed to read Whisper output: ${e.message}`))
          }
        } else {
          reject(new Error(`Whisper failed (${code}): ${stderr.slice(-500)}`))
        }
      })
      
      whisper.on('error', reject)
    })
    
    // Process Whisper output into our format
    const segments = []
    const words = []
    let fullText = ''
    
    if (whisperResult.segments) {
      for (const seg of whisperResult.segments) {
        segments.push({
          id: seg.id,
          start: seg.start,
          end: seg.end,
          text: seg.text.trim(),
          confidence: seg.confidence || 0.9
        })
        
        fullText += seg.text + ' '
        
        // Extract word-level data if available
        if (seg.words) {
          for (const word of seg.words) {
            words.push({
              word: word.word,
              start: word.start,
              end: word.end,
              confidence: word.probability || 0.9
            })
          }
        }
      }
    }
    
    // Detect filler words
    const fillerPatterns = /\b(um|uh|uhm|hmm|ah|er|like|you know|basically|actually|literally|so|well|i mean)\b/gi
    const fillerWords = []
    
    for (const word of words) {
      if (fillerPatterns.test(word.word.toLowerCase())) {
        fillerWords.push({
          word: word.word,
          start: word.start,
          end: word.end,
          type: 'filler'
        })
      }
    }
    
    // Detect silences (gaps > 0.5s between words)
    const silences = []
    for (let i = 1; i < words.length; i++) {
      const gap = words[i].start - words[i - 1].end
      if (gap > 0.5) {
        silences.push({
          start: words[i - 1].end,
          end: words[i].start,
          duration: gap,
          type: 'silence'
        })
      }
    }
    
    // Cleanup temp files
    try {
      await unlink(audioPath)
      await require('fs/promises').rm(outputDir, { recursive: true, force: true })
    } catch (e) { /* ignore */ }
    
    console.log(`[${jobId}] ✅ Transcription complete: ${segments.length} segments, ${words.length} words`)
    
    return NextResponse.json({
      success: true,
      jobId,
      transcript: {
        text: fullText.trim(),
        segments,
        words,
        language,
        duration: segments.length > 0 ? segments[segments.length - 1].end : 0
      },
      analysis: {
        fillerWords,
        fillerCount: fillerWords.length,
        silences,
        silenceCount: silences.length,
        totalSilenceDuration: silences.reduce((sum, s) => sum + s.duration, 0)
      }
    })
    
  } catch (error) {
    console.error(`[${jobId}] Transcription error:`, error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
