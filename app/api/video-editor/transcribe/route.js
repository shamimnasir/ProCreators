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
    const { fileId, filePath, language = 'auto' } = await request.json()
    
    // Auto-detect language if not specified
    const detectedLanguage = language === 'auto' ? null : language
    
    if (!fileId && !filePath) {
      return NextResponse.json({ success: false, error: 'fileId or filePath required' }, { status: 400 })
    }
    
    const videoPath = filePath 
      ? join('/app/public', filePath)
      : join('/app/public/video-editor/uploads', `${fileId}.mp4`)
    
    if (!existsSync(videoPath)) {
      return NextResponse.json({ success: false, error: 'Video file not found' }, { status: 404 })
    }
    
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
    
    // Run Whisper transcription
    const outputDir = `/tmp/whisper-${jobId}`
    await mkdir(outputDir, { recursive: true })
    
    // Use whisper CLI with word-level timestamps (use full path to venv)
    const whisperPath = '/root/.venv/bin/whisper'
    
    // Build Whisper arguments - auto-detect language if not specified
    const whisperArgs = [
      audioPath,
      '--model', 'base',
      '--output_format', 'json',
      '--output_dir', outputDir,
      '--word_timestamps', 'True'
    ]
    
    // Only add language if explicitly specified (not auto)
    if (detectedLanguage) {
      whisperArgs.push('--language', detectedLanguage)
    }
    // If auto, Whisper will detect language automatically
    
    } (lang: ${detectedLanguage || 'auto-detect'})`)
    
    const whisperResult = await new Promise((resolve, reject) => {
      const whisper = spawn(whisperPath, whisperArgs)
      
      let stdout = ''
      let stderr = ''
      whisper.stdout.on('data', (data) => { stdout += data.toString() })
      whisper.stderr.on('data', (data) => { stderr += data.toString() })
      
      whisper.on('close', async (code) => {
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
    
    // Track detected language from whisper result
    const detectedLang = whisperResult.language || detectedLanguage || 'en'
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
    
    }...`)
    // Detect filler words - comprehensive list including Bengali and English
    const englishFillers = [
      'um', 'uh', 'uhh', 'umm', 'ummm', 'uhm', 'hmm', 'hm', 'mmm', 'mm',
      'ah', 'ahh', 'aah', 'aaa', 'er', 'err', 'oh', 'ohh',
      'like', 'so', 'well', 'right', 'okay', 'ok', 'yeah', 'yep',
      'you know', 'i mean', 'basically', 'actually', 'literally', 'seriously', 'totally',
      'sort of', 'kind of', 'i guess', 'i suppose'
    ]
    
    // Bengali/Hindi fillers (in romanized and native script)
    // These are common hesitation sounds and filler words in Bengali
    const bengaliFillers = [
      // Bengali script filler words
      'মানে', 'আসলে', 'তো', 'এই', 'ওই', 'আচ্ছা', 'হ্যাঁ', 'না', 'কি', 'যে',
      'তাহলে', 'সেটা', 'এটা', 'ওটা', 'একটু', 'বলতে', 'বুঝলে', 'আর', 'এবং',
      // Common hesitation sounds (Whisper may transcribe these differently)
      'আ', 'অ', 'এঁ', 'হুম', 'হ্যা', 'উম', 'আম', 'এম', 'ওম',
      // Romanized versions (if Whisper outputs romanized)
      'mane', 'asole', 'to', 'ei', 'oi', 'accha', 'haan', 'na', 'ki', 'je',
      'tahle', 'seta', 'eta', 'ota', 'ektu', 'bolte', 'bujhle', 'ar', 'ebong',
      'aa', 'a', 'um', 'hum', 'hya', 'am', 'em', 'om'
    ]
    
    const allFillerWords = [...englishFillers, ...bengaliFillers]
    const fillerSet = new Set(allFillerWords.map(f => f.toLowerCase().trim()))
    
    // Also detect by sound patterns (common hesitation sounds)
    const fillerSoundPatterns = [
      /^u+[mh]+$/i,      // um, umm, uh, uhh
      /^a+[hm]*$/i,      // ah, ahh, aaa, am
      /^e+r+$/i,         // er, err
      /^m+h*m*$/i,       // mm, mmm, mhm, hmm
      /^h+m+$/i,         // hm, hmm
      /^o+[hk]*$/i,      // oh, ohh, ok
    ]
    
    // Bengali specific patterns (Unicode ranges for Bengali script hesitations)
    const bengaliSoundPatterns = [
      /^[আঅউএও]+$/,      // Bengali vowel sounds
      /^হু+ম*$/,          // হুম patterns
      /^[আ-ঔ]$/,         // Single Bengali vowel
    ]
    
    const fillerWords = []
    
    for (const word of words) {
      const cleanWord = word.word.toLowerCase().trim()
      
      // Skip empty words
      if (!cleanWord) continue
      
      // Check exact match
      if (fillerSet.has(cleanWord)) {
        fillerWords.push({
          word: word.word,
          start: word.start,
          end: word.end,
          type: 'filler'
        })
        : "${word.word}"`)
        continue
      }
      
      // Check sound patterns (English)
      let matched = false
      for (const pattern of fillerSoundPatterns) {
        if (pattern.test(cleanWord)) {
          fillerWords.push({
            word: word.word,
            start: word.start,
            end: word.end,
            type: 'filler_sound'
          })
          : "${word.word}"`)
          matched = true
          break
        }
      }
      if (matched) continue
      
      // Check Bengali patterns
      for (const pattern of bengaliSoundPatterns) {
        if (pattern.test(word.word)) {  // Use original word for Bengali script match
          fillerWords.push({
            word: word.word,
            start: word.start,
            end: word.end,
            type: 'filler_bengali'
          })
          : "${word.word}"`)
          break
        }
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
