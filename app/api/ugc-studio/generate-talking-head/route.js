import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-middleware'
import { connectToDatabase } from '@/lib/mongodb'
import { generateTalkingHead } from '@/lib/services'
import { deductCredits, refundCredits, completeTransaction } from '@/lib/credits'
import { v4 as uuidv4 } from 'uuid'

// =====================================================
// UGC STUDIO — TALKING HEAD GENERATOR (ASYNC)
// =====================================================
// POST: Submit a lip-synced talking head job (returns immediately)
// GET: Poll job status by jobId
// Uses Kling Avatar v2 → SadTalker fallback

export async function GET(request) {
  const auth = await requireAuth(request)
  if (!auth.authenticated) {
    return auth.response
  }

  try {
    const { searchParams } = new URL(request.url)
    const jobId = searchParams.get('jobId')

    if (!jobId) {
      return NextResponse.json({ success: false, error: 'jobId required' }, { status: 400 })
    }

    const { db } = await connectToDatabase()
    const job = await db.collection('ugc_generations').findOne({
      _id: jobId,
      userId: auth.userId
    })

    if (!job) {
      return NextResponse.json({ success: false, error: 'Job not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      job: {
        id: job._id,
        status: job.status,
        videoUrl: job.videoUrl || null,
        error: job.error || null,
        creditsCost: job.creditsCost || 0,
        engine: job.engine || null,
        createdAt: job.createdAt
      }
    })
  } catch (error) {
    console.error('Job status check error:', error)
    return NextResponse.json({ success: false, error: 'Failed to check job status' }, { status: 500 })
  }
}

export async function POST(request) {
  const auth = await requireAuth(request)
  if (!auth.authenticated) {
    return auth.response
  }

  try {
    const body = await request.json()
    const {
      avatarImageUrl,
      audioUrl,
      prompt = '',
      tier = 'pro',
      motionStyle = 'strict',     // 'strict' (Kling Avatar v2 — exact lip-sync) | 'natural' (Seedance 2 Reference — more body motion, less precise)
      aspectRatio = '9:16',       // '9:16' | '16:9' | '1:1'
      estimatedDuration = 30,
      projectId = null,
      avatarId = null
    } = body

    if (!avatarImageUrl || !audioUrl) {
      return NextResponse.json({ success: false, error: 'Avatar image URL and audio URL are required' }, { status: 400 })
    }

    if (!['standard', 'pro'].includes(tier)) {
      return NextResponse.json({ success: false, error: 'Tier must be standard or pro' }, { status: 400 })
    }

    if (!['strict', 'natural'].includes(motionStyle)) {
      return NextResponse.json({ success: false, error: 'motionStyle must be strict or natural' }, { status: 400 })
    }

    if (!['9:16', '16:9', '1:1', '4:5'].includes(aspectRatio)) {
      return NextResponse.json({ success: false, error: 'aspectRatio must be 9:16, 16:9, 1:1, or 4:5' }, { status: 400 })
    }

    const userId = auth.userId
    const toolId = `ugc-talking-head-${tier}`

    // Deduct credits upfront
    const deductResult = await deductCredits(userId, toolId, { duration: estimatedDuration })
    if (!deductResult.success) {
      return NextResponse.json({
        success: false,
        error: deductResult.error || 'Insufficient credits',
        required: deductResult.required,
        available: deductResult.available
      }, { status: 402 })
    }

    const jobId = uuidv4()

    // Save job record as "processing"
    const { db } = await connectToDatabase()
    await db.collection('ugc_generations').insertOne({
      _id: jobId,
      userId,
      type: 'talking-head',
      status: 'processing',
      tier,
      avatarImageUrl,
      audioUrl,
      videoUrl: null,
      prompt,
      creditsCost: deductResult.cost,
      transactionId: deductResult.transactionId,
      duration: estimatedDuration,
      projectId,
      error: null,
      createdAt: new Date()
    })

    // Start generation in background (don't await)
    generateTalkingHeadAsync({
      jobId,
      userId,
      avatarImageUrl,
      audioUrl,
      prompt,
      tier,
      motionStyle,
      aspectRatio,
      avatarId,
      transactionId: deductResult.transactionId,
      cost: deductResult.cost
    })

    // Return immediately with job ID
    return NextResponse.json({
      success: true,
      jobId,
      status: 'processing',
      message: 'Talking head generation started. Poll for status using GET with ?jobId=' + jobId
    })

  } catch (error) {
    console.error('Talking head submission error:', error)
    return NextResponse.json({ success: false, error: error.message || 'Failed to start talking head generation' }, { status: 500 })
  }
}

// Background generation function
async function generateTalkingHeadAsync({
  jobId, userId, avatarImageUrl, audioUrl, prompt, tier, motionStyle = 'strict', aspectRatio = '9:16', avatarId, transactionId, cost
}) {
  try {
    const result = await generateTalkingHead({
      imageUrl: avatarImageUrl,
      audioUrl,
      prompt,
      tier,
      motionStyle,
      aspectRatio,
      jobId
    })

    // Complete credit transaction
    await completeTransaction(transactionId)

    // Update job record with success
    const { db } = await connectToDatabase()
    await db.collection('ugc_generations').updateOne(
      { _id: jobId },
      {
        $set: {
          status: 'completed',
          videoUrl: result.url,
          engine: result.engine || 'omnihuman-v1.5',
          duration: result.duration || null,
          completedAt: new Date()
        }
      }
    )

    // Auto-save to library
    try {
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + 30)
      await db.collection('library').insertOne({
        id: jobId,
        userId,
        type: 'ugc-studio',
        category: 'video',
        title: `UGC Talking Head (${result.engine || 'AI'})`,
        description: prompt || 'AI-generated talking head clip',
        content: '',
        videoUrl: result.url,
        metadata: { tier, engine: result.engine, tool: 'ugc-talking-head', avatarId },
        createdAt: new Date(),
        expiresAt
      })
    } catch (libErr) {
      console.warn(`[${jobId}] Failed to save to library:`, libErr.message)
    }

    // Increment avatar usage count
    if (avatarId) {
      await db.collection('ugc_avatars').updateOne(
        { _id: avatarId },
        { $inc: { usageCount: 1 } }
      )
    }

    console.log(`[${jobId}] Talking head job completed successfully`)
  } catch (error) {
    console.error(`[${jobId}] Talking head background generation failed:`, error.message)

    // Refund credits
    await refundCredits(transactionId, error.message || 'Talking head generation failed')

    // Update job record with error
    try {
      const { db } = await connectToDatabase()
      await db.collection('ugc_generations').updateOne(
        { _id: jobId },
        {
          $set: {
            status: 'failed',
            error: error.message || 'Generation failed',
            completedAt: new Date()
          }
        }
      )
    } catch (dbError) {
      console.error(`[${jobId}] Failed to update job status:`, dbError)
    }
  }
}
