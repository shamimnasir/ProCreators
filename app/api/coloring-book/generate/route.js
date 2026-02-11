import { NextResponse } from 'next/server'
import { PDFDocument, rgb } from 'pdf-lib'
import { getCollection } from '@/lib/mongodb'
import { randomUUID } from 'crypto'
import fs from 'fs/promises'
import path from 'path'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { spawn } from 'child_process'
import { enforceRateLimit } from '@/lib/rate-limiter'
import { getUserIdFromRequest, checkCredits, deductCredits, completeTransaction, refundCredits } from '@/lib/credits'

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY)

// Generate a single coloring page image using Nano Banana
async function generateColoringPageImage(description, difficulty) {
  return new Promise((resolve) => {
    try {
      // Build prompt for line art coloring page
      const difficultyStyles = {
        easy: 'very simple line art with large shapes, thick bold outlines, minimal details, suitable for young children ages 3-6 to color',
        medium: 'clean line art with moderate detail, medium thickness outlines, some smaller areas, suitable for children ages 7-12 to color',
        hard: 'detailed line art with fine lines, intricate patterns, many small areas, suitable for teens and adults to color',
        expert: 'highly detailed mandala-style line art with very fine intricate patterns, complex designs, suitable for experienced adult colorers'
      }
      
      const styleGuide = difficultyStyles[difficulty] || difficultyStyles.medium
      
      const fullPrompt = `Black and white coloring page, ${styleGuide}: ${description}. Pure black line art on white background, no shading, no gradients, no fill colors, no gray tones - only black outlines on pure white background, ready to be colored in. High contrast printable coloring book page.`
      
      const scriptPath = path.join(process.cwd(), 'scripts', 'generate_image_nano_banana.py')
      
      const inputData = JSON.stringify({
        prompt: fullPrompt,
        model: 'models/nano-banana-pro-preview'
      })
      
      const pythonProcess = spawn('/root/.venv/bin/python3', [scriptPath, inputData], {
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
      
      pythonProcess.on('close', (code) => {
        if (code !== 0) {
          console.error('Coloring page generation error:', stderr)
          resolve({ success: false, imageUrl: null, error: stderr })
          return
        }
        
        try {
          const result = JSON.parse(stdout)
          resolve(result)
        } catch (error) {
          resolve({ success: false, imageUrl: null, error: 'Failed to parse response' })
        }
      })
      
      pythonProcess.on('error', (error) => {
        resolve({ success: false, imageUrl: null, error: error.message })
      })
      
      // Timeout after 60 seconds
      setTimeout(() => {
        pythonProcess.kill()
        resolve({ success: false, imageUrl: null, error: 'Image generation timed out' })
      }, 60000)
      
    } catch (error) {
      resolve({ success: false, imageUrl: null, error: error.message })
    }
  })
}

// Generate cover image with custom prompt support
async function generateCoverImage(theme, customTheme, primaryColor, customCoverPrompt) {
  return new Promise((resolve) => {
    try {
      const themeDesc = customTheme || theme
      
      // Use custom prompt if provided, otherwise generate automatic one
      const fullPrompt = customCoverPrompt 
        ? `${customCoverPrompt}. Professional book cover quality, vibrant colors, artistic and eye-catching design.`
        : `Beautiful coloring book cover design for "${themeDesc}" theme. Artistic elegant design with decorative borders, suitable for a coloring book cover, vibrant colors representing ${themeDesc}, professional book cover quality, no text on the image.`
      
      const scriptPath = path.join(process.cwd(), 'scripts', 'generate_image_nano_banana.py')
      
      const inputData = JSON.stringify({
        prompt: fullPrompt,
        model: 'models/nano-banana-pro-preview'
      })
      
      const pythonProcess = spawn('/root/.venv/bin/python3', [scriptPath, inputData], {
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
      
      pythonProcess.on('close', (code) => {
        if (code !== 0) {
          console.error('Cover image generation error:', stderr)
          resolve({ success: false, imageUrl: null, error: stderr })
          return
        }
        
        try {
          const result = JSON.parse(stdout)
          resolve(result)
        } catch (error) {
          resolve({ success: false, imageUrl: null, error: 'Failed to parse response' })
        }
      })
      
      pythonProcess.on('error', (error) => {
        resolve({ success: false, imageUrl: null, error: error.message })
      })
      
      setTimeout(() => {
        pythonProcess.kill()
        resolve({ success: false, imageUrl: null, error: 'Cover generation timed out' })
      }, 45000)
      
    } catch (error) {
      resolve({ success: false, imageUrl: null, error: error.message })
    }
  })
}

// Helper function to get image bytes from URL or base64 data URL
async function getImageBytes(imageUrl) {
  if (!imageUrl) {
    throw new Error('No image URL provided')
  }
  
  // Check if it's a base64 data URL
  if (imageUrl.startsWith('data:')) {
    // Extract the base64 part
    const matches = imageUrl.match(/^data:image\/(\w+);base64,(.+)$/)
    if (!matches) {
      throw new Error('Invalid base64 data URL format')
    }
    const format = matches[1] // 'png' or 'jpeg' etc.
    const base64Data = matches[2]
    const imageBytes = Buffer.from(base64Data, 'base64')
    return { imageBytes: new Uint8Array(imageBytes), format }
  }
  
  // Otherwise fetch from URL
  const response = await fetch(imageUrl)
  if (!response.ok) {
    throw new Error(`Failed to fetch image: ${response.status}`)
  }
  const contentType = response.headers.get('content-type') || ''
  const format = contentType.includes('png') ? 'png' : 'jpeg'
  const arrayBuffer = await response.arrayBuffer()
  return { imageBytes: new Uint8Array(arrayBuffer), format }
}

// Generate coloring page descriptions with AI
async function generatePageDescriptions(theme, customTheme, difficulty, pageCount) {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })
    
    const themeDescription = customTheme || theme
    const difficultyGuide = {
      easy: 'Simple, large shapes with minimal details. Suitable for young children ages 3-6.',
      medium: 'Moderate detail with some smaller areas. Suitable for children ages 7-12.',
      hard: 'Intricate details and finer lines. Suitable for teens and adults.',
      expert: 'Highly detailed and complex designs like mandalas. For experienced colorers.'
    }
    
    const prompt = `Generate ${pageCount} unique coloring page ideas for a "${themeDescription}" themed coloring book.

Difficulty Level: ${difficulty} - ${difficultyGuide[difficulty]}

For each page, provide:
1. A catchy title for the page
2. A detailed visual description of what should be drawn (describe the scene, characters, objects in detail for an AI image generator)
3. Key visual elements to include

Make each page unique, varied, and engaging. The descriptions should be detailed enough that an AI image generator can create proper line art from them.

Format as JSON array:
[
  {
    "title": "Page title",
    "description": "Detailed visual description of the scene/design - be specific about what should be drawn",
    "elements": ["element1", "element2", "element3"]
  }
]

IMPORTANT: Return ONLY valid JSON array, no markdown.`

    const result = await model.generateContent(prompt)
    const response = await result.response
    let text = response.text().trim()
    text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    
    return JSON.parse(text)
  } catch (error) {
    console.error('AI generation error:', error)
    // Return fallback pages with better descriptions
    const themeExamples = {
      animals: ['A majestic lion with flowing mane standing proudly', 'A cute bunny surrounded by flowers', 'A friendly elephant spraying water'],
      nature: ['A beautiful rose garden with butterflies', 'A tall tree with birds and squirrels', 'A peaceful pond with lily pads'],
      mandala: ['A circular mandala with flower petals pattern', 'A geometric mandala with star shapes', 'A nature-inspired mandala with leaves'],
      fantasy: ['A magical unicorn in an enchanted forest', 'A friendly dragon guarding treasure', 'A fairy with butterfly wings'],
      ocean: ['A happy dolphin jumping over waves', 'A colorful coral reef with fish', 'A friendly sea turtle swimming'],
      space: ['An astronaut floating among stars', 'A rocket ship blasting off', 'Planets and moons in space'],
      holiday: ['A decorated Christmas tree with presents', 'A jack-o-lantern with autumn leaves', 'Easter eggs in a basket'],
      patterns: ['Abstract swirls and circles pattern', 'Geometric shapes tessellation', 'Doodle pattern with various objects'],
      characters: ['A cute kawaii cat with big eyes', 'A chibi princess character', 'Adorable baby animals playing'],
      vehicles: ['A racing car on a track', 'A steam train going through mountains', 'A helicopter flying over city']
    }
    
    const examples = themeExamples[theme] || themeExamples.animals
    const themeName = customTheme || theme
    
    return Array.from({ length: pageCount }, (_, i) => ({
      title: `${themeName} Page ${i + 1}`,
      description: examples[i % examples.length] || `A beautiful ${themeName} scene with interesting details`,
      elements: [themeName, 'decorative elements', 'background details']
    }))
  }
}

// Helper: Convert hex color to rgb
function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  if (!result) return rgb(0.3, 0.3, 0.6)
  return rgb(
    parseInt(result[1], 16) / 255,
    parseInt(result[2], 16) / 255,
    parseInt(result[3], 16) / 255
  )
}

// Helper: Strip emojis from text for pdf-lib compatibility
function stripEmojis(text) {
  if (!text) return ''
  // Remove emojis and other non-BMP characters
  return text.replace(/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F900}-\u{1F9FF}]|[\u{1FA00}-\u{1FA6F}]|[\u{1FA70}-\u{1FAFF}]|[\u{FE00}-\u{FE0F}]|[\u{1F000}-\u{1F02F}]/gu, '').trim()
}

export async function POST(request) {
  try {
    // SECURITY: Rate limiting for content generation
    const rateLimitCheck = await enforceRateLimit(request, 'content_generate')
    if (rateLimitCheck.limited) {
      return rateLimitCheck.response
    }

    const { 
      theme, 
      customTheme, 
      difficulty, 
      pageCount, 
      pages, 
      title, 
      authorName,
      generateImages,
      primaryColor,
      secondaryColor,
      generateCover,
      customCoverPrompt, // NEW: Custom cover prompt
      // KDP Settings
      paperSize,
      useBleed,
      bleed
    } = await request.json()
    
    // Clean theme for display (strip emojis)
    const cleanTheme = stripEmojis(customTheme) || stripEmojis(theme) || 'Coloring Book'
    const cleanAuthor = stripEmojis(authorName) || ''
    const cleanTitle = stripEmojis(title) || ''
    
    // If pages are provided (from editor), use them. Otherwise generate new ones.
    let coloringPages = pages
    if (!coloringPages || coloringPages.length === 0) {
      coloringPages = await generatePageDescriptions(theme, customTheme, difficulty, pageCount || 24)
    }
    
    // Generate actual coloring page images if requested - PARALLEL for speed
    if (generateImages) {
      const pagesToGenerate = coloringPages.filter(p => !p.imageUrl)
      
      if (pagesToGenerate.length > 0) {
        // Process in batches of 3 for parallel generation (to avoid overwhelming API)
        const BATCH_SIZE = 3
        const batches = []
        for (let i = 0; i < pagesToGenerate.length; i += BATCH_SIZE) {
          batches.push(pagesToGenerate.slice(i, i + BATCH_SIZE))
        }
        
        for (let batchIdx = 0; batchIdx < batches.length; batchIdx++) {
          const batch = batches[batchIdx]
          // Generate all images in this batch simultaneously
          const batchPromises = batch.map(async (page) => {
            const pageIndex = coloringPages.findIndex(p => p.title === page.title)
            const imageResult = await generateColoringPageImage(page.description, difficulty)
            return { pageIndex, imageResult, title: page.title }
          })
          
          // Wait for all in batch to complete
          const batchResults = await Promise.all(batchPromises)
          
          // Update pages with results
          for (const { pageIndex, imageResult, title } of batchResults) {
            if (imageResult.success && imageResult.imageUrl) {
              coloringPages[pageIndex].imageUrl = imageResult.imageUrl
              } else {
              }
          }
          
          // Small delay between batches to be nice to the API
          if (batchIdx < batches.length - 1) {
            await new Promise(r => setTimeout(r, 500))
          }
        }
        
        // Validation complete
      }
    }
    
    // Generate cover image if requested
    let coverImageUrl = null
    if (generateCover !== false) {
      const coverResult = await generateCoverImage(theme, customTheme, primaryColor, customCoverPrompt)
      if (coverResult.success && coverResult.imageUrl) {
        coverImageUrl = coverResult.imageUrl
        } else {
        }
    }
    
    // Create PDF with KDP dimensions
    const pdfDoc = await PDFDocument.create()
    
    // Get page dimensions from settings or use default 8.5x11
    const baseWidth = paperSize?.width || 612  // 8.5" × 72
    const baseHeight = paperSize?.height || 792 // 11" × 72
    
    // Add bleed if enabled (0.125" = 9 points on each side)
    const bleedPoints = useBleed ? 9 : 0
    const pageWidth = baseWidth + (bleedPoints * 2)
    const pageHeight = baseHeight + (bleedPoints * 2)
    
    // Colors
    const pColor = hexToRgb(primaryColor || '#6b21a8')
    const sColor = hexToRgb(secondaryColor || '#a855f7')
    
    const bookTitle = cleanTitle || `${cleanTheme} Coloring Book`
    
    // ===== COVER PAGE =====
    let page = pdfDoc.addPage([pageWidth, pageHeight])
    
    if (coverImageUrl) {
      // Embed cover image
      try {
        const { imageBytes, format } = await getImageBytes(coverImageUrl)
        let embeddedImage
        if (format === 'png') {
          embeddedImage = await pdfDoc.embedPng(imageBytes)
        } else {
          embeddedImage = await pdfDoc.embedJpg(imageBytes)
        }
        
        // Draw full-page cover image
        page.drawImage(embeddedImage, {
          x: 0, y: 0,
          width: pageWidth, height: pageHeight
        })
        
        // Professional title bar at BOTTOM of cover
        const hasAuthor = cleanAuthor && cleanAuthor.length > 0
        const barHeight = hasAuthor ? 80 : 60
        const barY = 40 // Distance from bottom
        
        // Elegant dark semi-transparent bar at bottom
        page.drawRectangle({
          x: 0,
          y: barY,
          width: pageWidth,
          height: barHeight,
          color: rgb(0, 0, 0),
          opacity: 0.75
        })
        
        // Title - clean white text, centered
        const titleFontSize = Math.min(26, 450 / bookTitle.length)
        const titleWidth = bookTitle.length * titleFontSize * 0.55
        page.drawText(bookTitle.toUpperCase(), {
          x: (pageWidth - titleWidth) / 2,
          y: barY + (hasAuthor ? barHeight - 35 : barHeight / 2 - 8),
          size: titleFontSize,
          color: rgb(1, 1, 1)
        })
        
        // Author name below title (if provided)
        if (hasAuthor) {
          const authorFontSize = 12
          const authorWidth = cleanAuthor.length * authorFontSize * 0.55
          page.drawText(cleanAuthor, {
            x: (pageWidth - authorWidth) / 2,
            y: barY + 18,
            size: authorFontSize,
            color: rgb(0.85, 0.85, 0.85)
          })
        }
        
        } catch (imgError) {
        console.error('Failed to embed cover image:', imgError.message)
        // Fall back to text-only cover
        drawTextCover(page, pageWidth, pageHeight, bookTitle, coloringPages.length, cleanAuthor, difficulty, pColor, sColor)
      }
    } else {
      drawTextCover(page, pageWidth, pageHeight, bookTitle, coloringPages.length, cleanAuthor, difficulty, pColor, sColor)
    }
    
    // ===== COLORING PAGES =====
    for (let i = 0; i < coloringPages.length; i++) {
      const pageData = coloringPages[i]
      page = pdfDoc.addPage([pageWidth, pageHeight])
      
      // White background
      page.drawRectangle({
        x: 0, y: 0,
        width: pageWidth, height: pageHeight,
        color: rgb(1, 1, 1)
      })
      
      // Stylish page header with decorative banner
      const headerHeight = 55
      const margin = bleedPoints + 20
      
      // Header background with gradient effect (light to dark)
      page.drawRectangle({
        x: margin, y: pageHeight - headerHeight - bleedPoints,
        width: pageWidth - (margin * 2), height: headerHeight,
        color: rgb(0.98, 0.98, 0.98),
        borderColor: pColor,
        borderWidth: 2
      })
      
      // Decorative accent bar at top of header
      page.drawRectangle({
        x: margin, y: pageHeight - bleedPoints - 6,
        width: pageWidth - (margin * 2), height: 6,
        color: pColor
      })
      
      // Page title centered in header (strip emojis)
      const pageTitle = stripEmojis(pageData.title) || `Page ${i + 1}`
      const titleFontSize = Math.min(18, 400 / pageTitle.length)
      const titleWidth = pageTitle.length * titleFontSize * 0.55
      page.drawText(pageTitle, {
        x: Math.max(margin + 20, (pageWidth - titleWidth) / 2),
        y: pageHeight - 42 - bleedPoints,
        size: titleFontSize,
        color: pColor
      })
      
      // Small decorative circles on header corners
      page.drawCircle({ x: margin + 15, y: pageHeight - 30 - bleedPoints, size: 6, color: sColor })
      page.drawCircle({ x: pageWidth - margin - 15, y: pageHeight - 30 - bleedPoints, size: 6, color: sColor })
      
      // Embed coloring page image if available
      if (pageData.imageUrl) {
        try {
          const { imageBytes, format } = await getImageBytes(pageData.imageUrl)
          let embeddedImage
          try {
            if (format === 'png') {
              embeddedImage = await pdfDoc.embedPng(imageBytes)
            } else {
              embeddedImage = await pdfDoc.embedJpg(imageBytes)
            }
          } catch (formatError) {
            // Try the other format
            embeddedImage = format === 'png' 
              ? await pdfDoc.embedJpg(imageBytes) 
              : await pdfDoc.embedPng(imageBytes)
          }
          
          // Get original dimensions and scale to fit
          const imgDims = embeddedImage.scale(1)
          const imgMargin = 50 + bleedPoints
          const maxWidth = pageWidth - (imgMargin * 2)
          const maxHeight = pageHeight - 100 - imgMargin
          
          // Calculate scale to fit while maintaining aspect ratio
          const widthScale = maxWidth / imgDims.width
          const heightScale = maxHeight / imgDims.height
          const scale = Math.min(widthScale, heightScale)
          
          const scaledWidth = imgDims.width * scale
          const scaledHeight = imgDims.height * scale
          
          // Center the image
          const imgX = imgMargin + (maxWidth - scaledWidth) / 2
          const imgY = imgMargin + (maxHeight - scaledHeight) / 2
          
          page.drawImage(embeddedImage, {
            x: imgX, 
            y: imgY,
            width: scaledWidth, 
            height: scaledHeight
          })
          
          } catch (imgError) {
          console.error(`Failed to embed page ${i + 1} image:`, imgError.message)
          drawPlaceholder(page, pageWidth, pageHeight, bleedPoints, pageData.description)
        }
      } else {
        drawPlaceholder(page, pageWidth, pageHeight, bleedPoints, pageData.description)
      }
      
      // Stylish page number footer
      const footerY = bleedPoints + 12
      
      // Decorative line above page number
      page.drawLine({
        start: { x: pageWidth / 2 - 30, y: footerY + 12 },
        end: { x: pageWidth / 2 + 30, y: footerY + 12 },
        thickness: 1,
        color: sColor
      })
      
      // Page number with circle background
      page.drawCircle({ 
        x: pageWidth / 2, 
        y: footerY, 
        size: 12, 
        color: rgb(0.97, 0.97, 0.97),
        borderColor: sColor,
        borderWidth: 1
      })
      page.drawText(`${i + 1}`, {
        x: pageWidth / 2 - (i + 1 >= 10 ? 6 : 3),
        y: footerY - 4,
        size: 10,
        color: pColor
      })
    }
    
    // Save PDF
    const pdfBytes = await pdfDoc.save()
    
    const outputDir = '/app/public/coloring-books'
    await fs.mkdir(outputDir, { recursive: true })
    
    const fileName = `${randomUUID()}.pdf`
    const filePath = path.join(outputDir, fileName)
    await fs.writeFile(filePath, pdfBytes)
    
    // Save to library
    const libraryCollection = await getCollection('library')
    const documentId = randomUUID()
    
    await libraryCollection.insertOne({
      id: documentId,
      userId: 'default-user',
      type: 'coloring-book',
      category: 'document',
      title: bookTitle,
      description: `${coloringPages.length} page coloring book - ${difficulty} difficulty`,
      filePath: `/coloring-books/${fileName}`,
      fileSize: pdfBytes.length,
      tool: 'coloring-book',
      metadata: { 
        theme: cleanTheme, 
        difficulty, 
        pageCount: coloringPages.length,
        primaryColor,
        secondaryColor,
        hasImages: coloringPages.some(p => p.imageUrl),
        paperSize: paperSize?.name || '8.5" × 11"',
        paperSizeId: paperSize?.id || '8.5x11',
        hasBleed: useBleed || false,
        kdpCompliant: coloringPages.length >= 24,
        hasCustomCoverPrompt: !!customCoverPrompt
      },
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    })
    
    return NextResponse.json({
      success: true,
      title: bookTitle,
      downloadUrl: `/coloring-books/${fileName}`,
      pageCount: coloringPages.length,
      pages: coloringPages,
      libraryId: documentId,
      coverImageUrl
    })
    
  } catch (error) {
    console.error('Coloring book generation error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to generate coloring book' },
      { status: 500 }
    )
  }
}

// Helper: Draw colorful playful cover
function drawTextCover(page, pageWidth, pageHeight, bookTitle, pageCount, authorName, difficulty, pColor, sColor) {
  // Pastel yellow/cream background
  page.drawRectangle({
    x: 0, y: 0,
    width: pageWidth, height: pageHeight,
    color: rgb(1, 0.98, 0.9) // Warm cream
  })
  
  // Colorful decorative circles at corners and edges (like coloring book covers)
  const decorColors = [
    rgb(0.98, 0.6, 0.6),   // Coral pink
    rgb(0.6, 0.85, 0.95),  // Sky blue
    rgb(0.95, 0.85, 0.5),  // Golden yellow
    rgb(0.7, 0.9, 0.7),    // Mint green
    rgb(0.9, 0.7, 0.9),    // Lavender
    rgb(0.98, 0.75, 0.5),  // Peach
  ]
  
  // Top decorative circles
  page.drawCircle({ x: 80, y: pageHeight - 80, size: 50, color: decorColors[0] })
  page.drawCircle({ x: pageWidth - 80, y: pageHeight - 80, size: 45, color: decorColors[1] })
  page.drawCircle({ x: pageWidth / 2 - 100, y: pageHeight - 60, size: 35, color: decorColors[2] })
  page.drawCircle({ x: pageWidth / 2 + 100, y: pageHeight - 70, size: 40, color: decorColors[3] })
  
  // Bottom decorative shapes
  page.drawCircle({ x: 70, y: 100, size: 45, color: decorColors[4] })
  page.drawCircle({ x: pageWidth - 70, y: 120, size: 50, color: decorColors[5] })
  page.drawCircle({ x: pageWidth / 2, y: 80, size: 35, color: decorColors[0] })
  
  // Side decorative elements
  page.drawCircle({ x: 50, y: pageHeight / 2 + 100, size: 30, color: decorColors[2] })
  page.drawCircle({ x: 60, y: pageHeight / 2 - 50, size: 25, color: decorColors[1] })
  page.drawCircle({ x: pageWidth - 50, y: pageHeight / 2, size: 35, color: decorColors[3] })
  page.drawCircle({ x: pageWidth - 60, y: pageHeight / 2 + 120, size: 28, color: decorColors[4] })
  
  // Stars/sparkles using small shapes
  for (let i = 0; i < 12; i++) {
    const starX = 100 + Math.random() * (pageWidth - 200)
    const starY = 200 + Math.random() * (pageHeight - 400)
    page.drawCircle({ x: starX, y: starY, size: 3 + Math.random() * 5, color: rgb(1, 0.9, 0.5) })
  }
  
  // Main title background banner
  page.drawRectangle({
    x: 40, y: pageHeight / 2 + 30,
    width: pageWidth - 80, height: 140,
    color: rgb(1, 1, 1),
    borderColor: pColor,
    borderWidth: 4
  })
  
  // Title text
  const titleFontSize = Math.min(36, 520 / bookTitle.length)
  const titleWidth = bookTitle.length * titleFontSize * 0.55
  page.drawText(bookTitle.toUpperCase(), {
    x: Math.max(60, (pageWidth - titleWidth) / 2),
    y: pageHeight / 2 + 100,
    size: titleFontSize,
    color: pColor
  })
  
  // Subtitle in banner
  const subtitle = 'COLORING BOOK'
  page.drawText(subtitle, {
    x: pageWidth / 2 - (subtitle.length * 6),
    y: pageHeight / 2 + 50,
    size: 20,
    color: sColor
  })
  
  // Page count badge
  const pageLabel = `${pageCount} Fun Pages to Color!`
  page.drawRectangle({
    x: pageWidth / 2 - 90, y: pageHeight / 2 - 50,
    width: 180, height: 35,
    color: decorColors[2],
    borderColor: rgb(0.8, 0.7, 0.3),
    borderWidth: 2
  })
  page.drawText(pageLabel, {
    x: pageWidth / 2 - 70,
    y: pageHeight / 2 - 40,
    size: 12,
    color: rgb(0.3, 0.2, 0.1)
  })
  
  // Difficulty indicator with fun styling
  const diffLabel = difficulty.charAt(0).toUpperCase() + difficulty.slice(1) + ' Level'
  page.drawRectangle({
    x: pageWidth / 2 - 50, y: pageHeight / 2 - 100,
    width: 100, height: 25,
    color: rgb(0.95, 0.95, 0.95),
    borderColor: rgb(0.8, 0.8, 0.8),
    borderWidth: 1
  })
  page.drawText(diffLabel, {
    x: pageWidth / 2 - 35,
    y: pageHeight / 2 - 92,
    size: 10,
    color: rgb(0.4, 0.4, 0.4)
  })
  
  // Author name (no "by" prefix)
  if (authorName) {
    page.drawText(authorName, {
      x: pageWidth / 2 - (authorName.length * 5),
      y: 160,
      size: 16,
      color: pColor
    })
  }
}

// Helper: Draw placeholder for pages without images
function drawPlaceholder(page, pageWidth, pageHeight, bleedPoints, description) {
  const margin = 50 + bleedPoints
  
  // Coloring area border
  page.drawRectangle({
    x: margin, y: margin,
    width: pageWidth - (margin * 2), height: pageHeight - margin - 70,
    borderColor: rgb(0.85, 0.85, 0.85),
    borderWidth: 2
  })
  
  // Placeholder text
  page.drawText('[ Coloring Page ]', {
    x: pageWidth / 2 - 60,
    y: pageHeight / 2 + 20,
    size: 16,
    color: rgb(0.8, 0.8, 0.8)
  })
  
  // Description hint (strip emojis)
  if (description) {
    const cleanDesc = stripEmojis(description)
    const shortDesc = cleanDesc.substring(0, 60) + (cleanDesc.length > 60 ? '...' : '')
    page.drawText(shortDesc, {
      x: margin + 10,
      y: pageHeight / 2 - 10,
      size: 10,
      color: rgb(0.75, 0.75, 0.75)
    })
  }
}
