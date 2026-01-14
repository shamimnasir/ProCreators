import { NextResponse } from 'next/server'
import { getCollection } from '@/lib/mongodb'

export const dynamic = 'force-dynamic'

// Get job status
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const jobId = searchParams.get('jobId')
    
    if (!jobId) {
      return NextResponse.json({ error: 'Job ID required' }, { status: 400 })
    }
    
    const jobsCollection = await getCollection('transformation-jobs')
    const job = await jobsCollection.findOne({ jobId })
    
    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }
    
    return NextResponse.json({
      jobId: job.jobId,
      status: job.status, // 'pending', 'generating-images', 'generating-videos', 'compiling', 'complete', 'failed'
      progress: job.progress || 0,
      message: job.message || '',
      videoUrl: job.videoUrl || null,
      error: job.error || null,
      duration: job.duration || null,
      clipCount: job.clipCount || null,
      updatedScenes: job.updatedScenes || null, // Scenes with image URLs
      createdAt: job.createdAt,
      updatedAt: job.updatedAt
    })
    
  } catch (error) {
    console.error('[Job Status] Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
