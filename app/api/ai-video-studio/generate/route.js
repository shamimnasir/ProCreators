import { NextResponse } from 'next/server'
import { writeFile, mkdir, unlink } from 'fs/promises'
import { existsSync } from 'fs'
import { join } from 'path'
import { randomUUID } from 'crypto'
import Replicate from 'replicate'
import ffmpeg from 'fluent-ffmpeg'
import { getUseCaseById, FORMAT_OPTIONS } from '@/config/ai-video-usecases'

// Set ffmpeg paths
ffmpeg.setFfmpegPath('/usr/bin/ffmpeg')
ffmpeg.setFfprobePath('/usr/bin/ffprobe')

export const maxDuration = 300 // 5 minutes timeout
export const dynamic = 'force-dynamic'

// Video generation models
const VIDEO_MODELS = {
  imageToVideo: {
    id: 'stability-ai/stable-video-diffusion:3f0457e4619daac51203dedb472816fd4af51f3149fa7a9e0b5ffcf1b8172438',
    name: 'Stable Video Diffusion',
    type: 'image',
    framesPerSecond: 6,
    outputFrames: 25
  },
  textToVideo: {
    id: 'anotherjesse/zeroscope-v2-xl:9f747673945c62801b13b84701c783929c0ee784e4748ec062204894dda1a351',
    name: 'ZeroScope V2 XL',
    type: 'text',
    framesPerSecond: 8
  }
}

export async function POST(request) {
  const jobId = randomUUID()
  const tempDir = `/tmp/ai-video-studio-${jobId}`
  
  try {
    console.log(`[${jobId}] Starting AI Video Studio generation...`)
    
    // Parse request
    const formData = await request.formData()
    const mode = formData.get('mode') // 'image-to-video' or 'text-to-video'
    const prompt = formData.get('prompt')
    const duration = parseInt(formData.get('duration') || '5')
    const format = formData.get('format') || 'portrait'
    const useCaseId = formData.get('useCaseId') || 'make-anything'
    const imageFile = formData.get('image') // For image-to-video
    
    // Optional: Voice, Music, Text overlay (for future integration)
    const voiceOption = formData.get('voiceOption') // 'none', 'tts', 'upload'
    const ttsLanguage = formData.get('ttsLanguage')
    const selectedVoice = formData.get('selectedVoice')
    const voiceScript = formData.get('voiceScript')
    const voiceFile = formData.get('voiceFile')
    const musicPath = formData.get('musicPath')
    const textOverlay = formData.get('textOverlay') ? JSON.parse(formData.get('textOverlay')) : null
    
    console.log(`[${jobId}] Config:`, { mode, duration, format, useCaseId, hasImage: !!imageFile })
    
    // Validate inputs
    if (mode === 'image-to-video' && !imageFile) {
      return NextResponse.json(
        { success: false, error: 'Image is required for image-to-video mode' },
        { status: 400 }
      )
    }
    
    if (mode === 'text-to-video' && !prompt) {
      return NextResponse.json(
        { success: false, error: 'Prompt is required for text-to-video mode' },
        { status: 400 }
      )
    }
    
    // Check Replicate API key
    const replicateKey = process.env.REPLICATE_API_TOKEN
    if (!replicateKey) {
      return NextResponse.json(
        { success: false, error: 'Replicate API key not configured. Please add REPLICATE_API_TOKEN to environment variables.' },
        { status: 500 }
      )
    }
    
    // Create temp directory
    await mkdir(tempDir, { recursive: true })
    
    // Initialize Replicate
    const replicate = new Replicate({ auth: replicateKey })
    
    // Get format configuration
    const formatConfig = FORMAT_OPTIONS.find(f => f.value === format) || FORMAT_OPTIONS[0]
    
    // Calculate segments needed for duration
    const segmentDuration = 5 // Each AI generation produces ~5 seconds
    const segmentsNeeded = Math.ceil(duration / segmentDuration)
    
    console.log(`[${jobId}] Generating ${segmentsNeeded} segment(s) for ${duration}s video`)
    
    // Generate video segments
    const videoSegments = []
    let currentImage = null
    
    // If image-to-video, save the uploaded image
    if (mode === 'image-to-video' && imageFile) {
      const imageBuffer = Buffer.from(await imageFile.arrayBuffer())
      const imagePath = join(tempDir, 'input-image.jpg')
      await writeFile(imagePath, imageBuffer)
      
      // Convert to base64 data URL for Replicate
      const base64Image = imageBuffer.toString('base64')
      const mimeType = imageFile.type || 'image/jpeg'
      currentImage = `data:${mimeType};base64,${base64Image}`
      
      console.log(`[${jobId}] Saved input image: ${imagePath}`)
    }
    
    // Generate each segment
    for (let segment = 0; segment < segmentsNeeded; segment++) {
      console.log(`[${jobId}] Generating segment ${segment + 1}/${segmentsNeeded}...`)
      
      let videoUrl
      
      if (mode === 'image-to-video' || (segment > 0 && currentImage)) {
        // Image-to-Video generation (SVD)
        videoUrl = await generateImageToVideo(replicate, currentImage, prompt, formatConfig, jobId)
      } else {
        // Text-to-Video generation (ZeroScope)
        videoUrl = await generateTextToVideo(replicate, prompt, formatConfig, jobId)
      }
      
      if (!videoUrl) {
        throw new Error(`Failed to generate segment ${segment + 1}`)
      }
      
      // Download the generated video
      const segmentPath = join(tempDir, `segment-${segment}.mp4`)
      const response = await fetch(videoUrl)
      const videoBuffer = Buffer.from(await response.arrayBuffer())
      await writeFile(segmentPath, videoBuffer)
      
      videoSegments.push(segmentPath)
      console.log(`[${jobId}] ✅ Segment ${segment + 1} saved: ${segmentPath}`)
      
      // Extract last frame for chaining (if more segments needed)
      if (segment < segmentsNeeded - 1) {
        const lastFramePath = join(tempDir, `lastframe-${segment}.jpg`)
        await extractLastFrame(segmentPath, lastFramePath)
        
        // Convert to base64 for next generation
        const fs = require('fs')
        const frameBuffer = fs.readFileSync(lastFramePath)
        currentImage = `data:image/jpeg;base64,${frameBuffer.toString('base64')}`
        
        console.log(`[${jobId}] Extracted last frame for chaining`)
      }
    }
    
    // Concatenate all segments into final video
    console.log(`[${jobId}] Concatenating ${videoSegments.length} segments...`)
    const rawVideoPath = join(tempDir, 'raw-output.mp4')
    await concatenateVideos(videoSegments, rawVideoPath, jobId)
    
    // Apply post-processing (format, voice, music, text overlay)
    console.log(`[${jobId}] Applying post-processing...`)
    const finalVideoPath = join(tempDir, 'final-output.mp4')
    
    await postProcessVideo({
      inputPath: rawVideoPath,
      outputPath: finalVideoPath,
      format: formatConfig,
      voiceOption,
      ttsLanguage,
      selectedVoice,
      voiceScript,
      voiceFile,
      musicPath,
      textOverlay,
      tempDir,
      jobId
    })
    
    // Move to public folder
    const publicDir = join(process.cwd(), 'public', 'ai-video-studio')
    await mkdir(publicDir, { recursive: true })
    
    const outputFileName = `video-${jobId}.mp4`
    const publicPath = join(publicDir, outputFileName)
    
    const fs = require('fs')
    fs.copyFileSync(finalVideoPath, publicPath)
    
    // Clean up temp directory
    try {
      fs.rmSync(tempDir, { recursive: true, force: true })
    } catch (e) {
      console.log(`[${jobId}] Cleanup warning:`, e.message)
    }
    
    console.log(`[${jobId}] ✅ Video generation complete!`)
    
    return NextResponse.json({
      success: true,
      videoUrl: `/ai-video-studio/${outputFileName}`,
      duration,
      format: formatConfig.value,
      segments: segmentsNeeded,
      jobId
    })
    
  } catch (error) {
    console.error(`[${jobId}] Video generation error:`, error)
    
    // Clean up on error
    try {
      const fs = require('fs')
      if (existsSync(tempDir)) {
        fs.rmSync(tempDir, { recursive: true, force: true })
      }
    } catch (e) {}
    
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to generate video' },
      { status: 500 }
    )
  }
}

// Generate video from image using Stable Video Diffusion
async function generateImageToVideo(replicate, imageData, prompt, formatConfig, jobId) {
  console.log(`[${jobId}] Running SVD image-to-video...`)
  
  const model = VIDEO_MODELS.imageToVideo
  
  try {
    let prediction = await replicate.predictions.create({
      version: model.id.split(':')[1],
      input: {
        input_image: imageData,
        video_length: '25_frames_with_svd_xt',
        sizing_strategy: 'maintain_aspect_ratio',
        frames_per_second: model.framesPerSecond,
        motion_bucket_id: 127,
        cond_aug: 0.02
      }
    })
    
    // Poll until complete
    while (!['succeeded', 'failed', 'canceled'].includes(prediction.status)) {
      await new Promise(r => setTimeout(r, 2000))
      prediction = await replicate.predictions.get(prediction.id)
      console.log(`[${jobId}] SVD status: ${prediction.status}`)
    }
    
    if (prediction.status !== 'succeeded') {
      throw new Error(`SVD generation failed: ${prediction.status}`)
    }
    
    return extractVideoUrl(prediction.output)
    
  } catch (error) {
    console.error(`[${jobId}] SVD error:`, error.message)
    throw error
  }
}

// Generate video from text using ZeroScope
async function generateTextToVideo(replicate, prompt, formatConfig, jobId) {
  console.log(`[${jobId}] Running ZeroScope text-to-video...`)
  
  const model = VIDEO_MODELS.textToVideo
  
  // Adjust prompt for format
  const formattedPrompt = formatConfig.value === 'portrait'
    ? `${prompt}, vertical video, 9:16 aspect ratio`
    : `${prompt}, horizontal video, 16:9 aspect ratio, cinematic`
  
  try {
    let prediction = await replicate.predictions.create({
      version: model.id.split(':')[1],
      input: {
        prompt: formattedPrompt,
        num_frames: 36,
        fps: model.framesPerSecond,
        width: formatConfig.value === 'portrait' ? 576 : 1024,
        height: formatConfig.value === 'portrait' ? 1024 : 576
      }
    })
    
    // Poll until complete
    while (!['succeeded', 'failed', 'canceled'].includes(prediction.status)) {
      await new Promise(r => setTimeout(r, 2000))
      prediction = await replicate.predictions.get(prediction.id)
      console.log(`[${jobId}] ZeroScope status: ${prediction.status}`)
    }
    
    if (prediction.status !== 'succeeded') {
      throw new Error(`ZeroScope generation failed: ${prediction.status}`)
    }
    
    return extractVideoUrl(prediction.output)
    
  } catch (error) {
    console.error(`[${jobId}] ZeroScope error:`, error.message)
    throw error
  }
}

// Extract video URL from various output formats
function extractVideoUrl(output) {
  if (!output) return null
  if (typeof output === 'string') return output
  if (Array.isArray(output)) {
    const first = output[0]
    if (typeof first === 'string') return first
    if (first?.url) return typeof first.url === 'function' ? first.url() : first.url
    if (first?.toString) return first.toString()
  }
  if (output.url) return typeof output.url === 'function' ? output.url() : output.url
  if (output.video) return output.video
  return null
}

// Extract last frame from video for chaining
async function extractLastFrame(videoPath, outputPath) {
  return new Promise((resolve, reject) => {
    ffmpeg(videoPath)
      .outputOptions([
        '-sseof', '-0.1', // Seek to 0.1s before end
        '-vframes', '1',
        '-q:v', '2'
      ])
      .output(outputPath)
      .on('end', resolve)
      .on('error', reject)
      .run()
  })
}

// Concatenate multiple video segments
async function concatenateVideos(segments, outputPath, jobId) {
  if (segments.length === 1) {
    // Just copy if single segment
    const fs = require('fs')
    fs.copyFileSync(segments[0], outputPath)
    return
  }
  
  // Create concat file
  const concatFilePath = outputPath.replace('.mp4', '-concat.txt')
  const concatContent = segments.map(s => `file '${s}'`).join('\n')
  await writeFile(concatFilePath, concatContent)
  
  return new Promise((resolve, reject) => {
    ffmpeg()
      .input(concatFilePath)
      .inputOptions(['-f', 'concat', '-safe', '0'])
      .outputOptions(['-c', 'copy'])
      .output(outputPath)
      .on('end', () => {
        console.log(`[${jobId}] Concatenation complete`)
        resolve()
      })
      .on('error', (err) => {
        console.error(`[${jobId}] Concat error:`, err.message)
        reject(err)
      })
      .run()
  })
}

// Post-process video (format, voice, music, text overlay)
async function postProcessVideo(options) {
  const {
    inputPath,
    outputPath,
    format,
    voiceOption,
    ttsLanguage,
    selectedVoice,
    voiceScript,
    voiceFile,
    musicPath,
    textOverlay,
    tempDir,
    jobId
  } = options
  
  // Build FFmpeg filter chain
  const filters = []
  let audioInputs = []
  
  // Scale to correct format
  filters.push(`scale=${format.width}:${format.height}:force_original_aspect_ratio=decrease`)
  filters.push(`pad=${format.width}:${format.height}:(ow-iw)/2:(oh-ih)/2`)
  filters.push('setsar=1')
  
  // Text overlay (if provided)
  if (textOverlay && textOverlay.text) {
    const position = textOverlay.position || 'bottom'
    const color = textOverlay.color || 'yellow'
    
    const colorMap = {
      yellow: { bg: '0xFFD700', text: '0x000000' },
      red: { bg: '0xFF0000', text: '0xFFFFFF' },
      green: { bg: '0x00FF00', text: '0x000000' },
      blue: { bg: '0x0000FF', text: '0xFFFFFF' }
    }
    
    const colors = colorMap[color] || colorMap.yellow
    
    const yPos = position === 'top' ? 'h*0.1' : position === 'center' ? '(h-text_h)/2' : 'h*0.85'
    
    filters.push(`drawtext=text='${textOverlay.text.replace(/'/g, "'\\''")}':fontsize=48:fontcolor=${colors.text}:borderw=3:bordercolor=black:x=(w-text_w)/2:y=${yPos}`)
  }
  
  return new Promise((resolve, reject) => {
    let command = ffmpeg(inputPath)
    
    // Apply video filters
    if (filters.length > 0) {
      command = command.videoFilters(filters)
    }
    
    command
      .outputOptions([
        '-c:v', 'libx264',
        '-preset', 'fast',
        '-crf', '23',
        '-c:a', 'aac',
        '-b:a', '128k',
        '-movflags', '+faststart'
      ])
      .output(outputPath)
      .on('end', () => {
        console.log(`[${jobId}] Post-processing complete`)
        resolve()
      })
      .on('error', (err) => {
        console.error(`[${jobId}] Post-process error:`, err.message)
        reject(err)
      })
      .run()
  })
}
