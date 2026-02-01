import { NextResponse } from 'next/server'
import { writeFile, readFile, unlink, mkdir } from 'fs/promises'
import { join } from 'path'
import { exec } from 'child_process'
import { promisify } from 'util'
import { randomUUID } from 'crypto'
import { existsSync } from 'fs'

const execAsync = promisify(exec)

// Ensure tmp directory exists
const ensureTmpDir = async () => {
  const tmpDir = '/tmp/audio-editor'
  if (!existsSync(tmpDir)) {
    await mkdir(tmpDir, { recursive: true })
  }
  return tmpDir
}

// Get audio duration using ffprobe
const getAudioDuration = async (filePath) => {
  try {
    const { stdout } = await execAsync(
      `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${filePath}"`
    )
    return parseFloat(stdout.trim())
  } catch (error) {
    console.error('FFprobe error:', error)
    return 0
  }
}

// Get audio info using ffprobe
const getAudioInfo = async (filePath) => {
  try {
    const { stdout } = await execAsync(
      `ffprobe -v error -show_entries stream=codec_name,sample_rate,channels,bit_rate -show_entries format=duration,size -of json "${filePath}"`
    )
    return JSON.parse(stdout)
  } catch (error) {
    console.error('FFprobe error:', error)
    return null
  }
}

export async function POST(request) {
  const tmpDir = await ensureTmpDir()
  const tempFiles = []
  
  try {
    const formData = await request.formData()
    const action = formData.get('action') || 'info'
    
    console.log(`[Audio Editor] Action: ${action}`)
    
    if (action === 'info') {
      // Get audio file info
      const audioFile = formData.get('audio')
      if (!audioFile) {
        return NextResponse.json({ success: false, error: 'No audio file provided' }, { status: 400 })
      }
      
      const buffer = Buffer.from(await audioFile.arrayBuffer())
      const inputPath = join(tmpDir, `${randomUUID()}.${audioFile.name.split('.').pop()}`)
      tempFiles.push(inputPath)
      await writeFile(inputPath, buffer)
      
      const duration = await getAudioDuration(inputPath)
      const info = await getAudioInfo(inputPath)
      
      return NextResponse.json({
        success: true,
        duration,
        info,
        fileSize: buffer.length,
        fileName: audioFile.name
      })
      
    } else if (action === 'trim') {
      // Trim audio
      const audioFile = formData.get('audio')
      const startTime = parseFloat(formData.get('startTime') || '0')
      const endTime = parseFloat(formData.get('endTime') || '0')
      
      if (!audioFile) {
        return NextResponse.json({ success: false, error: 'No audio file provided' }, { status: 400 })
      }
      
      const buffer = Buffer.from(await audioFile.arrayBuffer())
      const ext = audioFile.name.split('.').pop() || 'mp3'
      const inputPath = join(tmpDir, `${randomUUID()}.${ext}`)
      const outputPath = join(tmpDir, `${randomUUID()}.${ext}`)
      tempFiles.push(inputPath, outputPath)
      
      await writeFile(inputPath, buffer)
      
      const duration = endTime - startTime
      const ffmpegCmd = `ffmpeg -y -i "${inputPath}" -ss ${startTime} -t ${duration} -acodec copy "${outputPath}"`
      
      console.log('[FFmpeg] Running:', ffmpegCmd)
      await execAsync(ffmpegCmd, { maxBuffer: 50 * 1024 * 1024 })
      
      const outputBuffer = await readFile(outputPath)
      const base64Audio = outputBuffer.toString('base64')
      const mimeType = ext === 'wav' ? 'audio/wav' : ext === 'ogg' ? 'audio/ogg' : 'audio/mpeg'
      
      return NextResponse.json({
        success: true,
        audioUrl: `data:${mimeType};base64,${base64Audio}`,
        duration: duration,
        message: `Trimmed audio from ${startTime.toFixed(2)}s to ${endTime.toFixed(2)}s`
      })
      
    } else if (action === 'merge') {
      // Merge multiple audio files
      const files = formData.getAll('audio')
      
      if (files.length < 2) {
        return NextResponse.json({ success: false, error: 'At least 2 audio files required for merge' }, { status: 400 })
      }
      
      const inputPaths = []
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        const buffer = Buffer.from(await file.arrayBuffer())
        const ext = file.name.split('.').pop() || 'mp3'
        const path = join(tmpDir, `${randomUUID()}.${ext}`)
        inputPaths.push(path)
        tempFiles.push(path)
        await writeFile(path, buffer)
      }
      
      // Create concat file
      const concatFile = join(tmpDir, `${randomUUID()}.txt`)
      const concatContent = inputPaths.map(p => `file '${p}'`).join('\n')
      await writeFile(concatFile, concatContent)
      tempFiles.push(concatFile)
      
      const outputPath = join(tmpDir, `${randomUUID()}.mp3`)
      tempFiles.push(outputPath)
      
      const ffmpegCmd = `ffmpeg -y -f concat -safe 0 -i "${concatFile}" -acodec libmp3lame -b:a 192k "${outputPath}"`
      
      console.log('[FFmpeg] Running merge:', ffmpegCmd)
      await execAsync(ffmpegCmd, { maxBuffer: 100 * 1024 * 1024 })
      
      const outputBuffer = await readFile(outputPath)
      const base64Audio = outputBuffer.toString('base64')
      const duration = await getAudioDuration(outputPath)
      
      return NextResponse.json({
        success: true,
        audioUrl: `data:audio/mpeg;base64,${base64Audio}`,
        duration,
        message: `Merged ${files.length} audio files`
      })
      
    } else if (action === 'convert') {
      // Convert audio format
      const audioFile = formData.get('audio')
      const outputFormat = formData.get('format') || 'mp3'
      const bitrate = formData.get('bitrate') || '192k'
      
      if (!audioFile) {
        return NextResponse.json({ success: false, error: 'No audio file provided' }, { status: 400 })
      }
      
      const buffer = Buffer.from(await audioFile.arrayBuffer())
      const inputExt = audioFile.name.split('.').pop() || 'mp3'
      const inputPath = join(tmpDir, `${randomUUID()}.${inputExt}`)
      const outputPath = join(tmpDir, `${randomUUID()}.${outputFormat}`)
      tempFiles.push(inputPath, outputPath)
      
      await writeFile(inputPath, buffer)
      
      let ffmpegCmd = `ffmpeg -y -i "${inputPath}"`
      
      if (outputFormat === 'mp3') {
        ffmpegCmd += ` -acodec libmp3lame -b:a ${bitrate}`
      } else if (outputFormat === 'wav') {
        ffmpegCmd += ` -acodec pcm_s16le`
      } else if (outputFormat === 'ogg') {
        ffmpegCmd += ` -acodec libvorbis -b:a ${bitrate}`
      } else if (outputFormat === 'aac') {
        ffmpegCmd += ` -acodec aac -b:a ${bitrate}`
      } else if (outputFormat === 'flac') {
        ffmpegCmd += ` -acodec flac`
      }
      
      ffmpegCmd += ` "${outputPath}"`
      
      console.log('[FFmpeg] Running convert:', ffmpegCmd)
      await execAsync(ffmpegCmd, { maxBuffer: 100 * 1024 * 1024 })
      
      const outputBuffer = await readFile(outputPath)
      const base64Audio = outputBuffer.toString('base64')
      const duration = await getAudioDuration(outputPath)
      
      const mimeTypes = {
        mp3: 'audio/mpeg',
        wav: 'audio/wav',
        ogg: 'audio/ogg',
        aac: 'audio/aac',
        flac: 'audio/flac'
      }
      
      return NextResponse.json({
        success: true,
        audioUrl: `data:${mimeTypes[outputFormat] || 'audio/mpeg'};base64,${base64Audio}`,
        duration,
        format: outputFormat,
        message: `Converted to ${outputFormat.toUpperCase()}`
      })
      
    } else if (action === 'noise-reduce') {
      // Remove background noise
      const audioFile = formData.get('audio')
      const noiseLevel = formData.get('noiseLevel') || 'medium'
      
      if (!audioFile) {
        return NextResponse.json({ success: false, error: 'No audio file provided' }, { status: 400 })
      }
      
      const buffer = Buffer.from(await audioFile.arrayBuffer())
      const ext = audioFile.name.split('.').pop() || 'mp3'
      const inputPath = join(tmpDir, `${randomUUID()}.${ext}`)
      const outputPath = join(tmpDir, `${randomUUID()}.mp3`)
      tempFiles.push(inputPath, outputPath)
      
      await writeFile(inputPath, buffer)
      
      // Noise reduction levels
      const noiseLevels = {
        light: 'highpass=f=80,lowpass=f=12000,afftdn=nf=-20',
        medium: 'highpass=f=100,lowpass=f=10000,afftdn=nf=-25,anlmdn=s=0.0001',
        heavy: 'highpass=f=150,lowpass=f=8000,afftdn=nf=-35,anlmdn=s=0.001'
      }
      
      const filter = noiseLevels[noiseLevel] || noiseLevels.medium
      const ffmpegCmd = `ffmpeg -y -i "${inputPath}" -af "${filter}" -acodec libmp3lame -b:a 192k "${outputPath}"`
      
      console.log('[FFmpeg] Running noise reduction:', ffmpegCmd)
      await execAsync(ffmpegCmd, { maxBuffer: 100 * 1024 * 1024 })
      
      const outputBuffer = await readFile(outputPath)
      const base64Audio = outputBuffer.toString('base64')
      const duration = await getAudioDuration(outputPath)
      
      return NextResponse.json({
        success: true,
        audioUrl: `data:audio/mpeg;base64,${base64Audio}`,
        duration,
        message: `Applied ${noiseLevel} noise reduction`
      })
      
    } else if (action === 'enhance-voice') {
      // Enhance voice clarity
      const audioFile = formData.get('audio')
      const preset = formData.get('preset') || 'podcast'
      
      if (!audioFile) {
        return NextResponse.json({ success: false, error: 'No audio file provided' }, { status: 400 })
      }
      
      const buffer = Buffer.from(await audioFile.arrayBuffer())
      const ext = audioFile.name.split('.').pop() || 'mp3'
      const inputPath = join(tmpDir, `${randomUUID()}.${ext}`)
      const outputPath = join(tmpDir, `${randomUUID()}.mp3`)
      tempFiles.push(inputPath, outputPath)
      
      await writeFile(inputPath, buffer)
      
      // Voice enhancement presets
      const presets = {
        podcast: 'highpass=f=80,lowpass=f=12000,equalizer=f=150:t=h:w=100:g=2,equalizer=f=3000:t=h:w=500:g=3,compand=attacks=0.3:decays=0.8:points=-80/-900|-45/-15|-27/-9|0/-3|20/-3:gain=5,loudnorm=I=-16:TP=-1.5:LRA=11',
        voiceover: 'highpass=f=60,equalizer=f=100:t=h:w=80:g=3,equalizer=f=2500:t=h:w=400:g=4,equalizer=f=5000:t=h:w=300:g=2,compand=attacks=0.2:decays=0.5:points=-70/-900|-45/-12|-20/-6|0/-3:gain=4,loudnorm=I=-14:TP=-1:LRA=9',
        interview: 'highpass=f=100,lowpass=f=10000,equalizer=f=200:t=h:w=100:g=1,equalizer=f=3500:t=h:w=500:g=2,compand=attacks=0.4:decays=1:points=-60/-900|-40/-12|-20/-6|0/-2:gain=3,loudnorm=I=-18:TP=-2:LRA=13',
        speech: 'highpass=f=120,lowpass=f=8000,equalizer=f=300:t=h:w=100:g=2,equalizer=f=2000:t=h:w=300:g=3,compand=attacks=0.3:decays=0.7:points=-50/-900|-35/-10|-15/-5|0/-2:gain=4,loudnorm=I=-16:TP=-1.5:LRA=11',
        music: 'equalizer=f=60:t=h:w=50:g=1,equalizer=f=250:t=h:w=100:g=1,equalizer=f=1000:t=h:w=200:g=0.5,equalizer=f=4000:t=h:w=400:g=1,equalizer=f=12000:t=h:w=2000:g=2,loudnorm=I=-14:TP=-1:LRA=7'
      }
      
      const filter = presets[preset] || presets.podcast
      const ffmpegCmd = `ffmpeg -y -i "${inputPath}" -af "${filter}" -acodec libmp3lame -b:a 192k "${outputPath}"`
      
      console.log('[FFmpeg] Running voice enhancement:', ffmpegCmd)
      await execAsync(ffmpegCmd, { maxBuffer: 100 * 1024 * 1024 })
      
      const outputBuffer = await readFile(outputPath)
      const base64Audio = outputBuffer.toString('base64')
      const duration = await getAudioDuration(outputPath)
      
      return NextResponse.json({
        success: true,
        audioUrl: `data:audio/mpeg;base64,${base64Audio}`,
        duration,
        message: `Applied ${preset} voice enhancement`
      })
      
    } else if (action === 'adjust-volume') {
      // Adjust volume
      const audioFile = formData.get('audio')
      const volume = parseFloat(formData.get('volume') || '1.0')
      const normalize = formData.get('normalize') === 'true'
      
      if (!audioFile) {
        return NextResponse.json({ success: false, error: 'No audio file provided' }, { status: 400 })
      }
      
      const buffer = Buffer.from(await audioFile.arrayBuffer())
      const ext = audioFile.name.split('.').pop() || 'mp3'
      const inputPath = join(tmpDir, `${randomUUID()}.${ext}`)
      const outputPath = join(tmpDir, `${randomUUID()}.mp3`)
      tempFiles.push(inputPath, outputPath)
      
      await writeFile(inputPath, buffer)
      
      let filter = `volume=${volume}`
      if (normalize) {
        filter += ',loudnorm=I=-16:TP=-1.5:LRA=11'
      }
      
      const ffmpegCmd = `ffmpeg -y -i "${inputPath}" -af "${filter}" -acodec libmp3lame -b:a 192k "${outputPath}"`
      
      console.log('[FFmpeg] Running volume adjustment:', ffmpegCmd)
      await execAsync(ffmpegCmd, { maxBuffer: 100 * 1024 * 1024 })
      
      const outputBuffer = await readFile(outputPath)
      const base64Audio = outputBuffer.toString('base64')
      const duration = await getAudioDuration(outputPath)
      
      return NextResponse.json({
        success: true,
        audioUrl: `data:audio/mpeg;base64,${base64Audio}`,
        duration,
        message: `Adjusted volume to ${Math.round(volume * 100)}%${normalize ? ' with normalization' : ''}`
      })
      
    } else if (action === 'fade') {
      // Add fade in/out
      const audioFile = formData.get('audio')
      const fadeIn = parseFloat(formData.get('fadeIn') || '0')
      const fadeOut = parseFloat(formData.get('fadeOut') || '0')
      
      if (!audioFile) {
        return NextResponse.json({ success: false, error: 'No audio file provided' }, { status: 400 })
      }
      
      const buffer = Buffer.from(await audioFile.arrayBuffer())
      const ext = audioFile.name.split('.').pop() || 'mp3'
      const inputPath = join(tmpDir, `${randomUUID()}.${ext}`)
      const outputPath = join(tmpDir, `${randomUUID()}.mp3`)
      tempFiles.push(inputPath, outputPath)
      
      await writeFile(inputPath, buffer)
      
      const duration = await getAudioDuration(inputPath)
      
      let filters = []
      if (fadeIn > 0) {
        filters.push(`afade=t=in:st=0:d=${fadeIn}`)
      }
      if (fadeOut > 0) {
        const fadeOutStart = Math.max(0, duration - fadeOut)
        filters.push(`afade=t=out:st=${fadeOutStart}:d=${fadeOut}`)
      }
      
      if (filters.length === 0) {
        return NextResponse.json({ success: false, error: 'No fade duration specified' }, { status: 400 })
      }
      
      const ffmpegCmd = `ffmpeg -y -i "${inputPath}" -af "${filters.join(',')}" -acodec libmp3lame -b:a 192k "${outputPath}"`
      
      console.log('[FFmpeg] Running fade:', ffmpegCmd)
      await execAsync(ffmpegCmd, { maxBuffer: 100 * 1024 * 1024 })
      
      const outputBuffer = await readFile(outputPath)
      const base64Audio = outputBuffer.toString('base64')
      
      return NextResponse.json({
        success: true,
        audioUrl: `data:audio/mpeg;base64,${base64Audio}`,
        duration,
        message: `Added fade in: ${fadeIn}s, fade out: ${fadeOut}s`
      })
      
    } else if (action === 'speed') {
      // Change speed/tempo
      const audioFile = formData.get('audio')
      const speed = parseFloat(formData.get('speed') || '1.0')
      const preservePitch = formData.get('preservePitch') !== 'false'
      
      if (!audioFile) {
        return NextResponse.json({ success: false, error: 'No audio file provided' }, { status: 400 })
      }
      
      const buffer = Buffer.from(await audioFile.arrayBuffer())
      const ext = audioFile.name.split('.').pop() || 'mp3'
      const inputPath = join(tmpDir, `${randomUUID()}.${ext}`)
      const outputPath = join(tmpDir, `${randomUUID()}.mp3`)
      tempFiles.push(inputPath, outputPath)
      
      await writeFile(inputPath, buffer)
      
      let filter
      if (preservePitch) {
        // Use rubberband for pitch-preserved tempo change
        filter = `atempo=${speed}`
        // atempo only supports 0.5 to 2.0, chain multiple for larger ranges
        if (speed < 0.5) {
          filter = `atempo=0.5,atempo=${speed / 0.5}`
        } else if (speed > 2.0) {
          filter = `atempo=2.0,atempo=${speed / 2.0}`
        }
      } else {
        // Simple speed change (affects pitch)
        filter = `asetrate=44100*${speed},aresample=44100`
      }
      
      const ffmpegCmd = `ffmpeg -y -i "${inputPath}" -af "${filter}" -acodec libmp3lame -b:a 192k "${outputPath}"`
      
      console.log('[FFmpeg] Running speed change:', ffmpegCmd)
      await execAsync(ffmpegCmd, { maxBuffer: 100 * 1024 * 1024 })
      
      const outputBuffer = await readFile(outputPath)
      const base64Audio = outputBuffer.toString('base64')
      const newDuration = await getAudioDuration(outputPath)
      
      return NextResponse.json({
        success: true,
        audioUrl: `data:audio/mpeg;base64,${base64Audio}`,
        duration: newDuration,
        message: `Changed speed to ${speed}x${preservePitch ? ' (pitch preserved)' : ''}`
      })
      
    } else {
      return NextResponse.json({ success: false, error: `Unknown action: ${action}` }, { status: 400 })
    }
    
  } catch (error) {
    console.error('[Audio Editor] Error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Audio processing failed' },
      { status: 500 }
    )
  } finally {
    // Cleanup temp files
    for (const file of tempFiles) {
      await unlink(file).catch(() => {})
    }
  }
}

export async function GET() {
  return NextResponse.json({
    success: true,
    actions: [
      'info', 'trim', 'merge', 'convert', 'noise-reduce', 
      'enhance-voice', 'adjust-volume', 'fade', 'speed'
    ],
    formats: ['mp3', 'wav', 'ogg', 'aac', 'flac'],
    noiseReductionLevels: ['light', 'medium', 'heavy'],
    voicePresets: ['podcast', 'voiceover', 'interview', 'speech', 'music']
  })
}
