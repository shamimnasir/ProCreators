import { NextResponse } from 'next/server'
import { spawn } from 'child_process'
import path from 'path'
import { writeFile, mkdir } from 'fs/promises'
import { randomUUID } from 'crypto'
import { getCollection } from '@/lib/mongodb'
import { getUserIdFromRequest, checkCredits, deductCredits, completeTransaction, refundCredits } from '@/lib/credits'

export const maxDuration = 120
export const dynamic = 'force-dynamic'

// Helper to save image to library
async function saveToLibrary(imageUrl, prompt, action, style = null) {
  try {
    // Extract base64 data
    const base64Data = imageUrl.split('base64,')[1]
    if (!base64Data) return null
    
    // Create directory for images
    const imageDir = path.join(process.cwd(), 'public', 'library', 'images')
    await mkdir(imageDir, { recursive: true })
    
    // Generate filename
    const imageId = randomUUID()
    const filename = `${imageId}.png`
    const filePath = path.join(imageDir, filename)
    const publicPath = `/library/images/${filename}`
    
    // Write image file
    const buffer = Buffer.from(base64Data, 'base64')
    await writeFile(filePath, buffer)
    
    // Save to MongoDB library
    const libraryCollection = await getCollection('library')
    
    // Calculate expiration: 30 days
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 30)
    
    // Determine title based on action
    let title = 'AI Generated Image'
    if (action === 'edit') title = 'Edited Image'
    if (action === 'fuse') title = 'Fused Image'
    
    const document = {
      id: imageId,
      userId: 'default-user',
      content: '',
      filePath: publicPath,
      fileSize: buffer.length,
      type: 'image-generator',
      category: 'image',
      title,
      description: prompt.slice(0, 200),
      metadata: { action, style, prompt },
      createdAt: new Date(),
      expiresAt
    }
    
    await libraryCollection.insertOne(document)
    return { id: imageId, filePath: publicPath }
  } catch (error) {
    console.error('[Image Editor] Library save error:', error)
    return null
  }
}

// Style presets
const STYLE_PRESETS = {
  realistic: {
    name: 'Realistic Photography',
    description: 'Lifelike photos with natural lighting',
    icon: '📸'
  },
  product: {
    name: 'Product & E-commerce',
    description: 'Clean product visuals',
    icon: '🛍️'
  },
  illustration: {
    name: 'Illustration & Art',
    description: 'Creative illustrations',
    icon: '🎨'
  },
  portrait: {
    name: 'Portrait',
    description: 'Professional portraits',
    icon: '👤'
  },
  cinematic: {
    name: 'Cinematic',
    description: 'Movie poster style',
    icon: '🎬'
  },
  minimalist: {
    name: 'Minimalist',
    description: 'Clean and simple',
    icon: '⬜'
  },
  vintage: {
    name: 'Vintage',
    description: 'Retro aesthetic',
    icon: '📷'
  },
  '3d': {
    name: '3D Render',
    description: 'High quality 3D',
    icon: '🎮'
  },
  watercolor: {
    name: 'Watercolor',
    description: 'Soft artistic style',
    icon: '🖌️'
  },
  'pixel-art': {
    name: 'Pixel Art',
    description: 'Retro game aesthetic',
    icon: '👾'
  },
  comic: {
    name: 'Comic Book',
    description: 'Bold ink lines',
    icon: '💥'
  },
  infographic: {
    name: 'Infographic',
    description: 'Data visualization',
    icon: '📊'
  }
}

// Execute Python script for image operations
async function executeNanoBanana(inputData) {
  const fs = await import('fs/promises')
  const tempInputPath = `/tmp/nano-input-${Date.now()}.json`
  
  try {
    // Write input to temp file to avoid command line length limits
    await fs.writeFile(tempInputPath, JSON.stringify(inputData), 'utf8')
    
    return new Promise((resolve, reject) => {
      const scriptPath = path.join(process.cwd(), 'scripts', 'nano_banana_image.py')
      const pythonProcess = spawn('/root/.venv/bin/python3', [scriptPath, '--input-file', tempInputPath], {
        env: { ...process.env }
      })
      
      let stdout = ''
      let stderr = ''
      
      pythonProcess.stdout.on('data', (data) => {
        stdout += data.toString()
      })
      
      pythonProcess.stderr.on('data', (data) => {
        stderr += data.toString()
      })
      
      pythonProcess.on('close', async (code) => {
        // Clean up temp file
        await fs.unlink(tempInputPath).catch(() => {})
        
        if (code !== 0) {
          console.error('Python script error:', stderr)
          reject(new Error(stderr || 'Failed to process image'))
          return
        }
        
        try {
          const result = JSON.parse(stdout)
          resolve(result)
        } catch (error) {
          console.error('Error parsing Python response:', error, stdout)
          reject(new Error('Failed to parse response'))
        }
      })
      
      pythonProcess.on('error', async (error) => {
        await fs.unlink(tempInputPath).catch(() => {})
        reject(error)
      })
    })
  } catch (error) {
    await fs.unlink(tempInputPath).catch(() => {})
    throw error
  }
}

// POST - Generate, Edit, or Fuse images
export async function POST(request) {
  try {
    const body = await request.json()
    const { action = 'generate' } = body
    
    let result
    
    if (action === 'generate') {
      // Text-to-image generation
      const { prompt, model = 'nano-banana', style = 'none', aspectRatio = '1:1' } = body
      
      if (!prompt) {
        return NextResponse.json(
          { success: false, error: 'Prompt is required' },
          { status: 400 }
        )
      }
      
      }..." with style: ${style}`)
      
      result = await executeNanoBanana({
        action: 'generate',
        prompt,
        model,
        style,
        aspectRatio
      })
      
    } else if (action === 'edit') {
      // Image editing with natural language
      const { imageBase64, editPrompt, model = 'nano-banana', mimeType = 'image/png' } = body
      
      if (!imageBase64 || !editPrompt) {
        return NextResponse.json(
          { success: false, error: 'Image and edit prompt are required' },
          { status: 400 }
        )
      }
      
      }..."`)
      
      result = await executeNanoBanana({
        action: 'edit',
        imageBase64,
        editPrompt,
        model,
        mimeType
      })
      
    } else if (action === 'fuse') {
      // Multi-image fusion
      const { images, fusionPrompt, model = 'nano-banana-pro' } = body
      
      if (!images || images.length < 2) {
        return NextResponse.json(
          { success: false, error: 'At least 2 images required for fusion' },
          { status: 400 }
        )
      }
      
      if (!fusionPrompt) {
        return NextResponse.json(
          { success: false, error: 'Fusion prompt is required' },
          { status: 400 }
        )
      }
      
      }..."`)
      
      result = await executeNanoBanana({
        action: 'fuse',
        images,
        fusionPrompt,
        model
      })
      
    } else {
      return NextResponse.json(
        { success: false, error: `Unknown action: ${action}` },
        { status: 400 }
      )
    }
    
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || 'Operation failed' },
        { status: 500 }
      )
    }
    
    // Auto-save to library
    let libraryInfo = null
    const promptText = body.prompt || body.editPrompt || body.fusionPrompt || ''
    try {
      libraryInfo = await saveToLibrary(result.imageUrl, promptText, action, body.style)
    } catch (saveError) {
      console.error('[Image Editor] Auto-save failed:', saveError)
    }
    
    return NextResponse.json({
      success: true,
      imageUrl: result.imageUrl,
      mimeType: result.mimeType || 'image/png',
      savedToLibrary: !!libraryInfo,
      libraryId: libraryInfo?.id || null,
      filePath: libraryInfo?.filePath || null
    })
    
  } catch (error) {
    console.error('[Image Editor] Error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Operation failed' },
      { status: 500 }
    )
  }
}

// GET - Return available styles and models
export async function GET() {
  return NextResponse.json({
    success: true,
    styles: STYLE_PRESETS,
    models: [
      { id: 'nano-banana', name: 'Nano Banana', description: 'Fast & balanced (Gemini 2.5 Flash)' },
      { id: 'nano-banana-pro', name: 'Nano Banana Pro', description: 'Higher quality (Gemini 3 Pro)' }
    ],
    aspectRatios: [
      { id: '1:1', name: 'Square (1:1)', icon: '⬜' },
      { id: '16:9', name: 'Landscape (16:9)', icon: '🖼️' },
      { id: '9:16', name: 'Portrait (9:16)', icon: '📱' },
      { id: '4:3', name: 'Standard (4:3)', icon: '🖥️' },
      { id: '3:4', name: 'Portrait (3:4)', icon: '📋' }
    ],
    features: [
      'Text-to-Image Generation',
      'Image Editing with Natural Language',
      'Multi-Image Fusion (up to 14 images)',
      'Style Presets',
      'Multiple Aspect Ratios'
    ]
  })
}
