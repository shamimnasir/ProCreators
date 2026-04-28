import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-middleware'
import { connectToDatabase } from '@/lib/mongodb'
import { generateUGCBrollClip } from '@/lib/services'
import { deductCredits, refundCredits, completeTransaction } from '@/lib/credits'
import { v4 as uuidv4 } from 'uuid'

// =====================================================
// UGC STUDIO — B-ROLL GENERATOR (ASYNC)
// =====================================================
// POST: Submit a B-roll generation job (returns immediately)
// GET with ?jobId=: Poll job status
// GET without jobId: Return available templates
// Primary: Kling 3.0 Pro (Native 4K, enhanced photorealism)
// Fallback: Seedance 1.5 Pro

const BROLL_TEMPLATES = {
  'product-closeup': {
    name: 'Product Close-Up',
    promptSuffix: 'close-up shot, product on clean surface, soft lighting',
  },
  'product-lifestyle': {
    name: 'Lifestyle Shot',
    promptSuffix: 'person using product casually, natural setting',
  },
  'unboxing': {
    name: 'Unboxing',
    promptSuffix: 'hands opening a package, revealing product, overhead angle',
  },
  'before-after': {
    name: 'Before & After',
    promptSuffix: 'before and after comparison, clean transition',
  },
  'aesthetic': {
    name: 'Aesthetic / Mood',
    promptSuffix: 'aesthetic mood shot, beautiful composition, soft lighting',
  },
  'app-demo': {
    name: 'App/Screen Demo',
    promptSuffix: 'person holding phone, showing screen, natural hand position',
  }
}

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const jobId = searchParams.get('jobId')

  // If jobId provided, return job status (requires auth)
  if (jobId) {
    const auth = await requireAuth(request)
    if (!auth.authenticated) {
      return auth.response
    }

    try {
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
          template: job.template || null,
          createdAt: job.createdAt
        }
      })
    } catch (error) {
      return NextResponse.json({ success: false, error: 'Failed to check job status' }, { status: 500 })
    }
  }

  // Otherwise return templates
  return NextResponse.json({
    success: true,
    templates: BROLL_TEMPLATES
  })
}

export async function POST(request) {
  const auth = await requireAuth(request)
  if (!auth.authenticated) {
    return auth.response
  }

  try {
    const body = await request.json()
    const {
      prompt,
      template = 'product-closeup',
      duration = 8,
      aspectRatio = '9:16',
      referenceImageUrl = null,
      projectId = null
    } = body

    if (!prompt) {
      return NextResponse.json({ success: false, error: 'Prompt is required' }, { status: 400 })
    }

    const templateConfig = BROLL_TEMPLATES[template] || BROLL_TEMPLATES['product-closeup']
    const clampedDuration = Math.max(4, Math.min(12, parseInt(duration)))

    const userId = auth.userId
    const toolId = 'ugc-broll'

    // Deduct credits upfront
    const deductResult = await deductCredits(userId, toolId, { duration: clampedDuration })
    if (!deductResult.success) {
      return NextResponse.json({
        success: false,
        error: deductResult.error || 'Insufficient credits',
        required: deductResult.required,
        available: deductResult.available
      }, { status: 402 })
    }

    const jobId = uuidv4()
    const fullPrompt = `${prompt}, ${templateConfig.promptSuffix}`

    // Save job as "processing"
    const { db } = await connectToDatabase()
    await db.collection('ugc_generations').insertOne({
      _id: jobId,
      userId,
      type: 'broll',
      status: 'processing',
      template,
      prompt: fullPrompt,
      videoUrl: null,
      duration: clampedDuration,
      creditsCost: deductResult.cost,
      transactionId: deductResult.transactionId,
      projectId,
      error: null,
      createdAt: new Date()
    })

    // Start generation in background
    generateBrollAsync({
      jobId,
      userId,
      fullPrompt,
      aspectRatio,
      clampedDuration,
      referenceImageUrl,
      template,
      transactionId: deductResult.transactionId,
      templateName: templateConfig.name
    })

    // Return immediately
    return NextResponse.json({
      success: true,
      jobId,
      status: 'processing',
      message: 'B-roll generation started. Poll for status using GET with ?jobId=' + jobId
    })

  } catch (error) {
    console.error('B-roll submission error:', error)
    return NextResponse.json({ success: false, error: error.message || 'Failed to start B-roll generation' }, { status: 500 })
  }
}

// Background generation function
async function generateBrollAsync({
  jobId, userId, fullPrompt, aspectRatio, clampedDuration, referenceImageUrl, template, transactionId, templateName
}) {
  try {
    const result = await generateUGCBrollClip({
      prompt: fullPrompt,
      aspectRatio,
      duration: String(clampedDuration),
      imageUrl: referenceImageUrl,
      jobId,
      resolution: '720p'
    })

    // Complete credit transaction
    await completeTransaction(transactionId)

    // Update job with success
    const { db } = await connectToDatabase()
    await db.collection('ugc_generations').updateOne(
      { _id: jobId },
      {
        $set: {
          status: 'completed',
          videoUrl: result.url,
          engine: result.engine || 'kling-3.0',
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
        title: `UGC B-Roll (${templateName || template})`,
        description: fullPrompt.slice(0, 200),
        content: '',
        videoUrl: result.url,
        metadata: { template, engine: result.engine, tool: 'ugc-broll', duration: clampedDuration },
        createdAt: new Date(),
        expiresAt
      })
    } catch (libErr) {
      console.warn(`[${jobId}] Failed to save to library:`, libErr.message)
    }

    console.log(`[${jobId}] B-roll job completed successfully (${result.engine})`)
  } catch (error) {
    console.error(`[${jobId}] B-roll background generation failed:`, error.message)

    // Refund credits
    await refundCredits(transactionId, error.message || 'B-roll generation failed')

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
