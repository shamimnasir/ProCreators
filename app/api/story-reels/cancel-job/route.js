import { NextResponse } from 'next/server'
import { getCollection } from '@/lib/mongodb'
import { refundCredits } from '@/lib/credits'

export const dynamic = 'force-dynamic'

export async function POST(request) {
  try {
    const { jobId } = await request.json()
    
    if (!jobId) {
      return NextResponse.json({ success: false, error: 'Job ID required' }, { status: 400 })
    }
    
    const jobsCollection = await getCollection('video_jobs')
    
    // Find the job
    const job = await jobsCollection.findOne({ jobId })
    
    if (!job) {
      return NextResponse.json({ success: false, error: 'Job not found' }, { status: 404 })
    }
    
    // Check if job can be cancelled (only pending or processing jobs)
    if (job.status === 'completed') {
      return NextResponse.json({ 
        success: false, 
        error: 'Job already completed, cannot cancel' 
      }, { status: 400 })
    }
    
    if (job.status === 'cancelled') {
      return NextResponse.json({ 
        success: false, 
        error: 'Job already cancelled' 
      }, { status: 400 })
    }
    
    if (job.status === 'failed') {
      return NextResponse.json({ 
        success: false, 
        error: 'Job already failed' 
      }, { status: 400 })
    }
    
    // Update job status to cancelled
    await jobsCollection.updateOne(
      { jobId },
      { 
        $set: { 
          status: 'cancelled',
          progress: 0,
          progressMessage: 'Cancelled by user',
          cancelledAt: new Date(),
          updatedAt: new Date()
        }
      }
    )
    
    // Refund credits if transaction exists
    let refundResult = null
    if (job.transactionId) {
      try {
        refundResult = await refundCredits(job.transactionId, 'User cancelled video generation')
        console.log(`[${jobId}] Credits refunded:`, refundResult)
      } catch (refundError) {
        console.error(`[${jobId}] Refund failed:`, refundError.message)
      }
    }
    
    console.log(`[${jobId}] Job cancelled by user`)
    
    return NextResponse.json({
      success: true,
      message: 'Video generation cancelled',
      refunded: refundResult?.success || false,
      refundedAmount: refundResult?.refundedAmount || 0
    })
    
  } catch (error) {
    console.error('Cancel job error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
