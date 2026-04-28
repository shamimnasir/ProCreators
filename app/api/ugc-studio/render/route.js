import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-middleware'
import { connectToDatabase } from '@/lib/mongodb'
import { v4 as uuidv4 } from 'uuid'
import { writeFile, mkdir, readFile, rm } from 'fs/promises'
import { existsSync, createWriteStream } from 'fs'
import { join } from 'path'
import { Readable } from 'stream'
import { pipeline } from 'stream/promises'
import ffmpeg from 'fluent-ffmpeg'

// =====================================================
// UGC STUDIO — FINAL VIDEO STITCHER (ASYNC)
// =====================================================
// POST: Start a stitching job — accepts ordered clip URLs, kicks off ffmpeg in background
// GET ?jobId=: Poll job status
// Stitches all clips into a single final UGC ad video (1080x1920 portrait, H.264 + AAC)

ffmpeg.setFfmpegPath('/usr/bin/ffmpeg')
ffmpeg.setFfprobePath('/usr/bin/ffprobe')

export const maxDuration = 300
export const dynamic = 'force-dynamic'

// Aspect-ratio → target dimension map (always 1080 on the short side)
const ASPECT_DIMENSIONS = {
  '9:16': { width: 1080, height: 1920 },  // TikTok / Reels / Shorts / Stories (vertical)
  '16:9': { width: 1920, height: 1080 },  // YouTube long-form (horizontal)
  '1:1':  { width: 1080, height: 1080 },  // IG Feed / FB Feed (square)
  '4:5':  { width: 1080, height: 1350 }   // IG Feed (portrait)
}

// Download a remote URL (or copy a local /public/... path) to a local file
async function downloadClip(url, destPath, baseUrl) {
  // Local path under /public — read directly
  if (url.startsWith('/')) {
    const localPath = join(process.cwd(), 'public', url)
    if (existsSync(localPath)) {
      const buf = await readFile(localPath)
      await writeFile(destPath, buf)
      return true
    }
    // If not local, try to fetch via base URL
    if (baseUrl) {
      url = `${baseUrl}${url}`
    }
  }
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Failed to download ${url}: HTTP ${res.status}`)
  const stream = createWriteStream(destPath)
  await pipeline(Readable.fromWeb(res.body), stream)
  return true
}

// Re-encode a clip to a normalized format so concat works cleanly.
// Uses motion-compensated frame interpolation (minterpolate) to eliminate the
// 3:2-pulldown judder that comes from naive fps conversion (e.g. 25→30fps).
function normalizeClip(inputPath, outputPath, targetWidth, targetHeight) {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .outputOptions([
        '-vf',
        `scale=${targetWidth}:${targetHeight}:force_original_aspect_ratio=increase,crop=${targetWidth}:${targetHeight},minterpolate='fps=30:mi_mode=mci:mc_mode=aobmc:me_mode=bidir:vsbmc=1'`,
        '-c:v', 'libx264',
        '-preset', 'medium',
        '-crf', '20',
        '-pix_fmt', 'yuv420p',
        '-c:a', 'aac',
        '-b:a', '128k',
        '-ar', '44100',
        '-ac', '2',
        '-movflags', '+faststart'
      ])
      .output(outputPath)
      .on('end', resolve)
      .on('error', reject)
      .run()
  })
}

// Concat normalized clips using the demuxer concat (lossless when streams match)
function concatClips(clipsListPath, outputPath) {
  return new Promise((resolve, reject) => {
    ffmpeg()
      .input(clipsListPath)
      .inputOptions(['-f', 'concat', '-safe', '0'])
      .outputOptions([
        '-c', 'copy',
        '-movflags', '+faststart'
      ])
      .output(outputPath)
      .on('end', resolve)
      .on('error', reject)
      .run()
  })
}

async function renderJob({ jobId, userId, clips, projectId, baseUrl, aspectRatio = '9:16' }) {
  const tempDir = `/tmp/ugc-render-${jobId}`
  const dims = ASPECT_DIMENSIONS[aspectRatio] || ASPECT_DIMENSIONS['9:16']
  try {
    await mkdir(tempDir, { recursive: true })

    // Step 1: download every clip
    console.log(`[render ${jobId}] Downloading ${clips.length} clips at ${aspectRatio} (${dims.width}x${dims.height})...`)
    const downloadedPaths = []
    for (let i = 0; i < clips.length; i++) {
      const inputPath = join(tempDir, `clip-${i}.mp4`)
      await downloadClip(clips[i].url, inputPath, baseUrl)
      downloadedPaths.push({ idx: i, path: inputPath })
    }

    // Step 2: normalize each (re-encode to the same codec/fps/dims so concat is clean)
    console.log(`[render ${jobId}] Normalizing clips...`)
    const normalizedPaths = []
    for (const { idx, path } of downloadedPaths) {
      const out = join(tempDir, `norm-${idx}.mp4`)
      await normalizeClip(path, out, dims.width, dims.height)
      normalizedPaths.push(out)
    }

    // Step 3: write the concat list file
    const listPath = join(tempDir, 'list.txt')
    const listContent = normalizedPaths.map(p => `file '${p}'`).join('\n')
    await writeFile(listPath, listContent)

    // Step 4: concat
    console.log(`[render ${jobId}] Concatenating...`)
    const finalPath = join(tempDir, 'final.mp4')
    await concatClips(listPath, finalPath)

    // Step 5: save to /public/ugc-renders/<jobId>.mp4
    const outputDir = join(process.cwd(), 'public', 'ugc-renders')
    if (!existsSync(outputDir)) {
      await mkdir(outputDir, { recursive: true })
    }
    const finalBuf = await readFile(finalPath)
    const publicPath = join(outputDir, `${jobId}.mp4`)
    await writeFile(publicPath, finalBuf)
    const videoUrl = `/ugc-renders/${jobId}.mp4`

    // Step 6: update job + library
    const { db } = await connectToDatabase()
    await db.collection('ugc_renders').updateOne(
      { _id: jobId },
      {
        $set: {
          status: 'completed',
          videoUrl,
          fileSize: finalBuf.length,
          completedAt: new Date()
        }
      }
    )

    try {
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + 30)
      await db.collection('library').insertOne({
        id: jobId,
        userId,
        type: 'ugc-studio-final',
        category: 'video',
        title: 'UGC Ad — Final Render',
        description: `Stitched ${clips.length} clips into a final UGC ad`,
        content: '',
        videoUrl,
        metadata: {
          tool: 'ugc-studio-render',
          clipCount: clips.length,
          projectId,
          fileSize: finalBuf.length
        },
        createdAt: new Date(),
        expiresAt
      })
    } catch (libErr) {
      console.warn(`[render ${jobId}] Failed to save to library:`, libErr.message)
    }

    console.log(`[render ${jobId}] Final render complete: ${videoUrl}`)
  } catch (err) {
    console.error(`[render ${jobId}] Render failed:`, err.message)
    try {
      const { db } = await connectToDatabase()
      await db.collection('ugc_renders').updateOne(
        { _id: jobId },
        {
          $set: {
            status: 'failed',
            error: err.message || 'Render failed',
            completedAt: new Date()
          }
        }
      )
    } catch (dbErr) {
      console.error(`[render ${jobId}] Failed to update job status:`, dbErr.message)
    }
  } finally {
    try { await rm(tempDir, { recursive: true, force: true }) } catch (_) { /* ignore */ }
  }
}

export async function POST(request) {
  const auth = await requireAuth(request)
  if (!auth.authenticated) {
    return auth.response
  }

  try {
    const body = await request.json()
    const { clips, projectId = null, aspectRatio = '9:16' } = body

    if (!Array.isArray(clips) || clips.length === 0) {
      return NextResponse.json({ success: false, error: 'clips array is required' }, { status: 400 })
    }

    if (clips.length > 50) {
      return NextResponse.json({ success: false, error: 'Too many clips (max 50)' }, { status: 400 })
    }

    if (!ASPECT_DIMENSIONS[aspectRatio]) {
      return NextResponse.json({ success: false, error: `aspectRatio must be one of: ${Object.keys(ASPECT_DIMENSIONS).join(', ')}` }, { status: 400 })
    }

    // Validate every clip has a URL
    for (const c of clips) {
      if (!c?.url || typeof c.url !== 'string') {
        return NextResponse.json({ success: false, error: 'Every clip must have a "url" string' }, { status: 400 })
      }
    }

    const jobId = uuidv4()
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'

    // Save job
    const { db } = await connectToDatabase()
    await db.collection('ugc_renders').insertOne({
      _id: jobId,
      userId: auth.userId,
      status: 'processing',
      clipCount: clips.length,
      projectId,
      aspectRatio,
      videoUrl: null,
      error: null,
      createdAt: new Date()
    })

    // Kick off async render (fire-and-forget)
    renderJob({ jobId, userId: auth.userId, clips, projectId, baseUrl, aspectRatio })

    return NextResponse.json({
      success: true,
      jobId,
      status: 'processing',
      message: 'Render started. Poll GET ?jobId=' + jobId
    })
  } catch (err) {
    console.error('Render submission error:', err)
    return NextResponse.json({ success: false, error: err.message || 'Failed to start render' }, { status: 500 })
  }
}

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
    const job = await db.collection('ugc_renders').findOne({ _id: jobId, userId: auth.userId })
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
        clipCount: job.clipCount,
        fileSize: job.fileSize || null,
        createdAt: job.createdAt
      }
    })
  } catch (err) {
    console.error('Render status error:', err)
    return NextResponse.json({ success: false, error: 'Failed to check render status' }, { status: 500 })
  }
}
