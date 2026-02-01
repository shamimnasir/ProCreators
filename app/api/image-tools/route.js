import { NextResponse } from 'next/server'
import { writeFile, readFile, unlink, mkdir } from 'fs/promises'
import { join } from 'path'
import { exec } from 'child_process'
import { promisify } from 'util'
import { randomUUID } from 'crypto'
import { existsSync } from 'fs'
import sharp from 'sharp'

const execAsync = promisify(exec)

// Ensure tmp directory exists
const ensureTmpDir = async () => {
  const tmpDir = '/tmp/image-tools'
  if (!existsSync(tmpDir)) {
    await mkdir(tmpDir, { recursive: true })
  }
  return tmpDir
}

export async function POST(request) {
  const tmpDir = await ensureTmpDir()
  const tempFiles = []
  
  try {
    const formData = await request.formData()
    const action = formData.get('action') || 'info'
    
    console.log(`[Image Tools] Action: ${action}`)
    
    if (action === 'info') {
      // Get image file info
      const imageFile = formData.get('image')
      if (!imageFile) {
        return NextResponse.json({ success: false, error: 'No image file provided' }, { status: 400 })
      }
      
      const buffer = Buffer.from(await imageFile.arrayBuffer())
      const metadata = await sharp(buffer).metadata()
      
      return NextResponse.json({
        success: true,
        width: metadata.width,
        height: metadata.height,
        format: metadata.format,
        fileSize: buffer.length,
        fileName: imageFile.name
      })
      
    } else if (action === 'upscale') {
      // Upscale image
      const imageFile = formData.get('image')
      const scale = parseFloat(formData.get('scale') || '2')
      const method = formData.get('method') || 'lanczos3'
      
      if (!imageFile) {
        return NextResponse.json({ success: false, error: 'No image file provided' }, { status: 400 })
      }
      
      const buffer = Buffer.from(await imageFile.arrayBuffer())
      const metadata = await sharp(buffer).metadata()
      
      const newWidth = Math.round(metadata.width * scale)
      const newHeight = Math.round(metadata.height * scale)
      
      // Limit max dimensions
      const maxDimension = 8192
      if (newWidth > maxDimension || newHeight > maxDimension) {
        return NextResponse.json({ 
          success: false, 
          error: `Output size too large. Max ${maxDimension}px. Requested: ${newWidth}x${newHeight}` 
        }, { status: 400 })
      }
      
      // Kernel options for different quality levels
      const kernelMap = {
        'nearest': sharp.kernel.nearest,
        'cubic': sharp.kernel.cubic,
        'mitchell': sharp.kernel.mitchell,
        'lanczos2': sharp.kernel.lanczos2,
        'lanczos3': sharp.kernel.lanczos3
      }
      
      const upscaledBuffer = await sharp(buffer)
        .resize(newWidth, newHeight, {
          kernel: kernelMap[method] || sharp.kernel.lanczos3,
          fastShrinkOnLoad: false
        })
        .sharpen() // Add slight sharpening for better quality
        .png({ quality: 100 })
        .toBuffer()
      
      const base64Image = upscaledBuffer.toString('base64')
      
      return NextResponse.json({
        success: true,
        imageUrl: `data:image/png;base64,${base64Image}`,
        originalWidth: metadata.width,
        originalHeight: metadata.height,
        newWidth,
        newHeight,
        scale,
        fileSize: upscaledBuffer.length,
        message: `Upscaled from ${metadata.width}x${metadata.height} to ${newWidth}x${newHeight} (${scale}x)`
      })
      
    } else if (action === 'compress') {
      // Compress image
      const imageFile = formData.get('image')
      const quality = parseInt(formData.get('quality') || '80')
      const format = formData.get('format') || 'jpeg'
      const maxWidth = parseInt(formData.get('maxWidth') || '0')
      const maxHeight = parseInt(formData.get('maxHeight') || '0')
      
      if (!imageFile) {
        return NextResponse.json({ success: false, error: 'No image file provided' }, { status: 400 })
      }
      
      const buffer = Buffer.from(await imageFile.arrayBuffer())
      const originalMetadata = await sharp(buffer).metadata()
      const originalSize = buffer.length
      
      let sharpInstance = sharp(buffer)
      
      // Resize if max dimensions specified
      if (maxWidth > 0 || maxHeight > 0) {
        sharpInstance = sharpInstance.resize(
          maxWidth > 0 ? maxWidth : null, 
          maxHeight > 0 ? maxHeight : null, 
          { fit: 'inside', withoutEnlargement: true }
        )
      }
      
      let compressedBuffer
      let mimeType
      
      if (format === 'jpeg' || format === 'jpg') {
        compressedBuffer = await sharpInstance
          .jpeg({ quality, mozjpeg: true })
          .toBuffer()
        mimeType = 'image/jpeg'
      } else if (format === 'png') {
        compressedBuffer = await sharpInstance
          .png({ quality, compressionLevel: 9 })
          .toBuffer()
        mimeType = 'image/png'
      } else if (format === 'webp') {
        compressedBuffer = await sharpInstance
          .webp({ quality })
          .toBuffer()
        mimeType = 'image/webp'
      } else if (format === 'avif') {
        compressedBuffer = await sharpInstance
          .avif({ quality })
          .toBuffer()
        mimeType = 'image/avif'
      } else {
        compressedBuffer = await sharpInstance
          .jpeg({ quality, mozjpeg: true })
          .toBuffer()
        mimeType = 'image/jpeg'
      }
      
      const compressedMetadata = await sharp(compressedBuffer).metadata()
      const savedBytes = originalSize - compressedBuffer.length
      const savedPercent = Math.round((savedBytes / originalSize) * 100)
      
      const base64Image = compressedBuffer.toString('base64')
      
      return NextResponse.json({
        success: true,
        imageUrl: `data:${mimeType};base64,${base64Image}`,
        originalSize,
        compressedSize: compressedBuffer.length,
        savedBytes,
        savedPercent,
        originalWidth: originalMetadata.width,
        originalHeight: originalMetadata.height,
        newWidth: compressedMetadata.width,
        newHeight: compressedMetadata.height,
        format,
        quality,
        message: `Compressed: ${formatBytes(originalSize)} → ${formatBytes(compressedBuffer.length)} (${savedPercent}% smaller)`
      })
      
    } else if (action === 'resize') {
      // Resize image to specific dimensions
      const imageFile = formData.get('image')
      const width = parseInt(formData.get('width') || '0')
      const height = parseInt(formData.get('height') || '0')
      const fit = formData.get('fit') || 'cover' // cover, contain, fill, inside, outside
      
      if (!imageFile) {
        return NextResponse.json({ success: false, error: 'No image file provided' }, { status: 400 })
      }
      
      if (width <= 0 && height <= 0) {
        return NextResponse.json({ success: false, error: 'Width or height required' }, { status: 400 })
      }
      
      const buffer = Buffer.from(await imageFile.arrayBuffer())
      const originalMetadata = await sharp(buffer).metadata()
      
      const resizedBuffer = await sharp(buffer)
        .resize(width > 0 ? width : null, height > 0 ? height : null, { fit })
        .png({ quality: 90 })
        .toBuffer()
      
      const resizedMetadata = await sharp(resizedBuffer).metadata()
      const base64Image = resizedBuffer.toString('base64')
      
      return NextResponse.json({
        success: true,
        imageUrl: `data:image/png;base64,${base64Image}`,
        originalWidth: originalMetadata.width,
        originalHeight: originalMetadata.height,
        newWidth: resizedMetadata.width,
        newHeight: resizedMetadata.height,
        fileSize: resizedBuffer.length,
        message: `Resized from ${originalMetadata.width}x${originalMetadata.height} to ${resizedMetadata.width}x${resizedMetadata.height}`
      })
      
    } else if (action === 'convert') {
      // Convert image format
      const imageFile = formData.get('image')
      const format = formData.get('format') || 'png'
      const quality = parseInt(formData.get('quality') || '90')
      
      if (!imageFile) {
        return NextResponse.json({ success: false, error: 'No image file provided' }, { status: 400 })
      }
      
      const buffer = Buffer.from(await imageFile.arrayBuffer())
      const originalMetadata = await sharp(buffer).metadata()
      
      let convertedBuffer
      let mimeType
      
      if (format === 'jpeg' || format === 'jpg') {
        convertedBuffer = await sharp(buffer).jpeg({ quality }).toBuffer()
        mimeType = 'image/jpeg'
      } else if (format === 'png') {
        convertedBuffer = await sharp(buffer).png({ quality }).toBuffer()
        mimeType = 'image/png'
      } else if (format === 'webp') {
        convertedBuffer = await sharp(buffer).webp({ quality }).toBuffer()
        mimeType = 'image/webp'
      } else if (format === 'avif') {
        convertedBuffer = await sharp(buffer).avif({ quality }).toBuffer()
        mimeType = 'image/avif'
      } else if (format === 'gif') {
        convertedBuffer = await sharp(buffer).gif().toBuffer()
        mimeType = 'image/gif'
      } else if (format === 'tiff') {
        convertedBuffer = await sharp(buffer).tiff({ quality }).toBuffer()
        mimeType = 'image/tiff'
      } else {
        convertedBuffer = await sharp(buffer).png({ quality }).toBuffer()
        mimeType = 'image/png'
      }
      
      const base64Image = convertedBuffer.toString('base64')
      
      return NextResponse.json({
        success: true,
        imageUrl: `data:${mimeType};base64,${base64Image}`,
        originalFormat: originalMetadata.format,
        newFormat: format,
        fileSize: convertedBuffer.length,
        message: `Converted from ${originalMetadata.format?.toUpperCase()} to ${format.toUpperCase()}`
      })
      
    } else {
      return NextResponse.json({ success: false, error: `Unknown action: ${action}` }, { status: 400 })
    }
    
  } catch (error) {
    console.error('[Image Tools] Error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Image processing failed' },
      { status: 500 }
    )
  } finally {
    // Cleanup temp files
    for (const file of tempFiles) {
      await unlink(file).catch(() => {})
    }
  }
}

// Format bytes to human readable
function formatBytes(bytes) {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export async function GET() {
  return NextResponse.json({
    success: true,
    actions: ['info', 'upscale', 'compress', 'resize', 'convert'],
    supportedFormats: ['jpeg', 'png', 'webp', 'avif', 'gif', 'tiff'],
    upscaleMethods: ['nearest', 'cubic', 'mitchell', 'lanczos2', 'lanczos3'],
    maxUpscale: '4x',
    maxDimension: 8192
  })
}
