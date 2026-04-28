import { NextResponse } from 'next/server'
import { getCollection } from '@/lib/mongodb'
import { refundCredits, partialRefundCredits } from '@/lib/credits'

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
    
    // Calculate partial refund based on clips already generated
    const clipsGenerated = job.clipsGenerated || 0
    const totalClips = job.totalClips || 1
    const originalCost = job.creditCost || 0
    
    // Calculate how much to charge for generated clips
    // Charge proportionally: (clips generated / total clips) * original cost
    const chargeForGenerated = Math.ceil((clipsGenerated / totalClips) * originalCost)
    const refundAmount = Math.max(0, originalCost - chargeForGenerated)
    
    
    // Update job status to cancelled
    await jobsCollection.updateOne(
      { jobId },
      { 
        $set: { 
          status: 'cancelled',
          progress: 0,
          progressMessage: `Cancelled by user (${clipsGenerated} clips generated)`,
          cancelledAt: new Date(),
          updatedAt: new Date(),
          partialCharge: chargeForGenerated,
          partialRefund: refundAmount
        }
      }
    )
    
    // Process refund if transaction exists
    let refundResult = null
    if (job.transactionId) {
      try {
        if (clipsGenerated === 0) {
          // No clips generated - full refund
          refundResult = await refundCredits(job.transactionId, 'User cancelled before generation started')
        } else if (refundAmount > 0) {
          // Partial refund - charge for generated clips, refund the rest
          refundResult = await partialRefundCredits(job.transactionId, refundAmount, 
            `User cancelled after ${clipsGenerated}/${totalClips} clips generated`)
        } else {
          // All clips generated - no refund
          refundResult = { success: true, refundedAmount: 0, message: 'All clips already generated' }
        }
      } catch (refundError) {
        console.error(`[${jobId}] Refund failed:`, refundError.message)
      }
    }
    
    
    return NextResponse.json({
      success: true,
      message: clipsGenerated > 0 
        ? `Cancelled. Charged ${chargeForGenerated} credits for ${clipsGenerated} clips generated.`
        : 'Video generation cancelled. Full refund processed.',
      refunded: refundResult?.success || false,
      refundedAmount: refundResult?.refundedAmount || refundAmount,
      chargedAmount: chargeForGenerated,
      clipsGenerated,
      totalClips
    })
    
  } catch (error) {
    console.error('Cancel job error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
