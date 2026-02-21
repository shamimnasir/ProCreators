import { NextResponse } from 'next/server'
import { getCollection } from '@/lib/mongodb'

// Time estimates (in seconds) for different stages
const TIME_ESTIMATES = {
  CLIP_GENERATION: 120, // ~2 minutes per AI clip
  AUDIO_PROCESSING: 30,  // Voice/TTS generation
  MUSIC_PROCESSING: 15,  // Background music mixing
  VIDEO_COMPOSITION: 45, // Final video assembly with captions
  UPLOAD: 20,            // Upload to storage
}

function calculateEstimatedTimeRemaining(job) {
  if (!job || job.status === 'completed' || job.status === 'failed') {
    return null
  }
  
  const totalClips = job.totalClips || 1
  const clipsGenerated = job.clipsGenerated || 0
  const progress = job.progress || 0
  
  // Base time calculation
  let remainingSeconds = 0
  
  if (job.status === 'pending' || job.status === 'processing') {
    // Full estimation: all clips + processing
    remainingSeconds = (totalClips * TIME_ESTIMATES.CLIP_GENERATION) +
                       TIME_ESTIMATES.AUDIO_PROCESSING +
                       TIME_ESTIMATES.MUSIC_PROCESSING +
                       TIME_ESTIMATES.VIDEO_COMPOSITION +
                       TIME_ESTIMATES.UPLOAD
  } else if (job.status === 'generating_clips') {
    // Remaining clips + post-processing
    const remainingClips = totalClips - clipsGenerated
    remainingSeconds = (remainingClips * TIME_ESTIMATES.CLIP_GENERATION) +
                       TIME_ESTIMATES.MUSIC_PROCESSING +
                       TIME_ESTIMATES.VIDEO_COMPOSITION +
                       TIME_ESTIMATES.UPLOAD
  } else if (job.status === 'composing') {
    // Just composition and upload remaining
    remainingSeconds = TIME_ESTIMATES.VIDEO_COMPOSITION + TIME_ESTIMATES.UPLOAD
    // Adjust based on progress within composition
    if (progress > 80) {
      remainingSeconds = TIME_ESTIMATES.UPLOAD
    }
  }
  
  // Apply a small buffer for uncertainty
  return Math.ceil(remainingSeconds * 1.1)
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
