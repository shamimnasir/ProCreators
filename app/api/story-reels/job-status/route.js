import { NextResponse } from 'next/server'
import { getCollection } from '@/lib/mongodb'

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
      completedAt: job.completedAt || null
    })
  } catch (error) {
    console.error('Job status error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
