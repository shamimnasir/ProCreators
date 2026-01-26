import { NextResponse } from 'next/server'
import { writeFile, mkdir, appendFile, stat, unlink } from 'fs/promises'
import { existsSync } from 'fs'
import { join } from 'path'
import { randomUUID } from 'crypto'

export const maxDuration = 300
export const dynamic = 'force-dynamic'

// Upload directory
const UPLOAD_DIR = '/app/public/video-editor/uploads'

export async function POST(request) {
  try {
    const formData = await request.formData()
    const file = formData.get('file')
    const chunkIndex = parseInt(formData.get('chunkIndex') || '0')
    const totalChunks = parseInt(formData.get('totalChunks') || '1')
    const fileId = formData.get('fileId') || randomUUID()
    const fileName = formData.get('fileName') || 'video.mp4'
    const processingMode = formData.get('processingMode') || 'fast' // 'fast' or 'medium'
    
    if (!file) {
      return NextResponse.json({ success: false, error: 'No file provided' }, { status: 400 })
    }
    
    // Validate file size based on processing mode
    const maxSizes = {
      fast: 100 * 1024 * 1024,    // 100MB
      medium: 500 * 1024 * 1024   // 500MB
    }
    
    const maxSize = maxSizes[processingMode] || maxSizes.fast
    
    // Create upload directory
    await mkdir(UPLOAD_DIR, { recursive: true })
    
    const tempPath = join(UPLOAD_DIR, `${fileId}.temp`)
    const finalPath = join(UPLOAD_DIR, `${fileId}.mp4`)
    
    // Get chunk data
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    
    console.log(`[Upload] Chunk ${chunkIndex + 1}/${totalChunks} for ${fileId} (${buffer.length} bytes)`)
    
    if (chunkIndex === 0) {
      // First chunk - create new file
      await writeFile(tempPath, buffer)
    } else {
      // Subsequent chunks - append to file
      await appendFile(tempPath, buffer)
    }
    
    // Check if all chunks received
    if (chunkIndex === totalChunks - 1) {
      // All chunks received - finalize the file
      const { rename } = await import('fs/promises')
      await rename(tempPath, finalPath)
      
      // Get file stats
      const stats = await stat(finalPath)
      
      // Validate total file size
      if (stats.size > maxSize) {
        await unlink(finalPath)
        return NextResponse.json({
          success: false,
          error: `File too large for ${processingMode} mode. Max: ${Math.round(maxSize / 1024 / 1024)}MB`
        }, { status: 400 })
      }
      
      console.log(`[Upload] ✅ Complete: ${fileId} (${Math.round(stats.size / 1024 / 1024)}MB)`)
      
      return NextResponse.json({
        success: true,
        complete: true,
        fileId,
        fileName,
        fileSize: stats.size,
        filePath: `/video-editor/uploads/${fileId}.mp4`,
        processingMode
      })
    }
    
    // More chunks expected
    return NextResponse.json({
      success: true,
      complete: false,
      fileId,
      chunkIndex,
      totalChunks,
      message: `Chunk ${chunkIndex + 1}/${totalChunks} received`
    })
    
  } catch (error) {
    console.error('[Upload Error]', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

// Get upload status
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const fileId = searchParams.get('fileId')
    
    if (!fileId) {
      return NextResponse.json({ success: false, error: 'fileId required' }, { status: 400 })
    }
    
    const finalPath = join(UPLOAD_DIR, `${fileId}.mp4`)
    const tempPath = join(UPLOAD_DIR, `${fileId}.temp`)
    
    if (existsSync(finalPath)) {
      const stats = await stat(finalPath)
      return NextResponse.json({
        success: true,
        status: 'complete',
        fileSize: stats.size,
        filePath: `/video-editor/uploads/${fileId}.mp4`
      })
    }
    
    if (existsSync(tempPath)) {
      const stats = await stat(tempPath)
      return NextResponse.json({
        success: true,
        status: 'uploading',
        currentSize: stats.size
      })
    }
    
    return NextResponse.json({
      success: false,
      status: 'not_found'
    }, { status: 404 })
    
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
