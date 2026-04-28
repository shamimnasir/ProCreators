import { NextResponse } from 'next/server'
import { getCollection } from '@/lib/mongodb'

// Time estimates (in seconds) for different stages
const TIME_ESTIMATES = {
  CLIP_GENERATION: 60,  // ~1 minute per AI clip (Kling 2.5 turbo is faster)
  AUDIO_PROCESSING: 15, // Voice/TTS generation
  MUSIC_PROCESSING: 10, // Background music mixing
  VIDEO_COMPOSITION: 30, // Final video assembly with captions
  NORMALIZATION: 20,    // Per-clip normalization
  UPLOAD: 10,           // Upload to storage
}

function calculateEstimatedTimeRemaining(job) {
  if (!job || job.status === 'completed' || job.status === 'failed') {
    return null
  }
  
  const totalClips = job.totalClips || 1
  const clipsGenerated = job.clipsGenerated || 0
  const progress = job.progress || 0
  
  // PROGRESS-BASED ESTIMATION: Use actual progress to estimate time
  // This is more accurate than stage-based estimation
  if (progress > 0 && job.startedAt) {
    const startTime = new Date(job.startedAt).getTime()
    const elapsed = (Date.now() - startTime) / 1000 // seconds elapsed
    
    // Calculate remaining time based on actual progress rate
    // progress 0-100, so remainingProgress = (100 - progress)
    const progressRate = progress / elapsed // progress per second
    if (progressRate > 0) {
      const remainingProgress = 100 - progress
      const estimatedRemaining = remainingProgress / progressRate
      
      // Cap at reasonable maximum (15 minutes for processing stages, no cap for generation)
      if (progress >= 60) {
        // In post-generation phase - max 15 min
        return Math.min(Math.ceil(estimatedRemaining), 900)
      }
      return Math.ceil(estimatedRemaining)
    }
  }
  
  // FALLBACK: Stage-based estimation for when we don't have good progress data
  let remainingSeconds = 0
  
  if (progress <= 10) {
    // Early stage: all clips + processing
    remainingSeconds = (totalClips * TIME_ESTIMATES.CLIP_GENERATION) +
                       TIME_ESTIMATES.AUDIO_PROCESSING +
                       TIME_ESTIMATES.VIDEO_COMPOSITION
  } else if (progress <= 60) {
    // Generating clips stage
    const remainingClips = totalClips - clipsGenerated
    remainingSeconds = (remainingClips * TIME_ESTIMATES.CLIP_GENERATION) +
                       TIME_ESTIMATES.VIDEO_COMPOSITION
  } else if (progress <= 75) {
    // Downloading/normalizing clips
    remainingSeconds = TIME_ESTIMATES.VIDEO_COMPOSITION + TIME_ESTIMATES.NORMALIZATION
  } else if (progress <= 85) {
    // Concatenating/transitions
    remainingSeconds = 60 // About 1 minute for concatenation
  } else if (progress <= 95) {
    // Adding captions and audio
    remainingSeconds = 30 // About 30 seconds
  } else {
    // Almost done - saving to library
    remainingSeconds = 15
  }
  
  return Math.ceil(remainingSeconds)
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const jobId = searchParams.get('jobId')
    
    if (!jobId) {
      return NextResponse.json({ success: false, error: 'Job ID required' }, { status: 400 })
    }
    
    const jobsCollection = await getCollection('video_jobs')
    const job = await jobsCollection.findOne({ jobId })
    
    if (!job) {
      return NextResponse.json({ success: false, error: 'Job not found' }, { status: 404 })
    }
    
    // Calculate estimated time remaining
    const estimatedSecondsRemaining = calculateEstimatedTimeRemaining(job)
    
    return NextResponse.json({
      success: true,
      jobId: job.jobId,
      status: job.status, // 'pending', 'processing', 'generating_clips', 'composing', 'completed', 'failed'
      progress: job.progress || 0,
      progressMessage: job.progressMessage || '',
      clipsGenerated: job.clipsGenerated || 0,
      totalClips: job.totalClips || 0,
      videoUrl: job.videoUrl || null,
      captionsUrl: job.captionsUrl || null,
      error: job.error || null,
      duration: job.duration || null,
      createdAt: job.createdAt,
      completedAt: job.completedAt || null,
      estimatedSecondsRemaining: estimatedSecondsRemaining
    })
  } catch (error) {
    console.error('Job status error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
