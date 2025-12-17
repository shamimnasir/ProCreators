import { NextResponse } from 'next/server'
import { PDFDocument, rgb } from 'pdf-lib'
import { getCollection } from '@/lib/mongodb'
import { randomUUID } from 'crypto'
import fs from 'fs/promises'
import path from 'path'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { spawn } from 'child_process'

const genAI = new GoogleGenerativeAI(process.env.EMERGENT_LLM_KEY || process.env.GOOGLE_API_KEY)

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
      
      console.log(`Generating coloring page: ${description.substring(0, 50)}...`)
      
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

// Generate cover image
async function generateCoverImage(theme, customTheme, primaryColor) {
  return new Promise((resolve) => {
    try {
      const themeDesc = customTheme || theme
      const fullPrompt = `Beautiful coloring book cover design for "${themeDesc}" theme. Artistic elegant design with decorative borders, suitable for a coloring book cover, vibrant colors representing ${themeDesc}, professional book cover quality, no text on the image.`
      
      console.log(`Generating cover for: ${themeDesc}`)
      
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
          resolve({ success: false, imageUrl: null })
          return
        }
        
        try {
          const result = JSON.parse(stdout)
          resolve(result)
        } catch (error) {
          resolve({ success: false, imageUrl: null })
        }
      })
      
      pythonProcess.on('error', () => {
        resolve({ success: false, imageUrl: null })
      })
      
      setTimeout(() => {
        pythonProcess.kill()
        resolve({ success: false, imageUrl: null })
      }, 45000)
      
    } catch (error) {
      resolve({ success: false, imageUrl: null })
    }
  })
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
    
    return Array.from({ length: pageCount }, (_, i) => ({
      title: `${themeDescription} Page ${i + 1}`,
      description: examples[i % examples.length] || `A beautiful ${themeDescription} scene with interesting details`,
      elements: [themeDescription, 'decorative elements', 'background details']
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

export async function POST(request) {
  try {
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
      generateCover
    } = await request.json()
    
    console.log(`Coloring Book Request: theme=${customTheme || theme}, pages=${pageCount}, generateImages=${generateImages}`)
    
    // If pages are provided (from editor), use them. Otherwise generate new ones.
    let coloringPages = pages
    if (!coloringPages || coloringPages.length === 0) {
      coloringPages = await generatePageDescriptions(theme, customTheme, difficulty, pageCount || 10)
    }
    
    // Generate actual coloring page images if requested
    if (generateImages) {
      console.log('Generating actual coloring page images...')
      for (let i = 0; i < coloringPages.length; i++) {
        const page = coloringPages[i]
        if (!page.imageUrl) {
          console.log(`Generating image ${i + 1}/${coloringPages.length}: ${page.title}`)
          const imageResult = await generateColoringPageImage(page.description, difficulty)
          if (imageResult.success && imageResult.imageUrl) {
            coloringPages[i].imageUrl = imageResult.imageUrl
            console.log(`Image ${i + 1} generated successfully`)
          } else {
            console.log(`Image ${i + 1} failed: ${imageResult.error}`)
          }
          // Small delay between requests
          await new Promise(r => setTimeout(r, 1000))
        }
      }
    }
    
    // Generate cover image if requested
    let coverImageUrl = null
    if (generateCover !== false) {
      console.log('Generating cover image...')
      const coverResult = await generateCoverImage(theme, customTheme, primaryColor)
      if (coverResult.success && coverResult.imageUrl) {
        coverImageUrl = coverResult.imageUrl
        console.log('Cover image generated successfully')
      }
    }
    
    // Create PDF
    const pdfDoc = await PDFDocument.create()
    const pageWidth = 612
    const pageHeight = 792
    
    // Colors
    const pColor = hexToRgb(primaryColor || '#6b21a8')
    const sColor = hexToRgb(secondaryColor || '#a855f7')
    
    const bookTitle = title || `${customTheme || theme} Coloring Book`
    
    // ===== COVER PAGE =====
    let page = pdfDoc.addPage([pageWidth, pageHeight])
    
    if (coverImageUrl) {
      // Embed cover image
      try {
        const imageResponse = await fetch(coverImageUrl)
        const imageArrayBuffer = await imageResponse.arrayBuffer()
        const imageBytes = new Uint8Array(imageArrayBuffer)
        
        let embeddedImage
        if (coverImageUrl.includes('.png') || coverImageUrl.includes('png')) {
          embeddedImage = await pdfDoc.embedPng(imageBytes)
        } else {
          embeddedImage = await pdfDoc.embedJpg(imageBytes)
        }
        
        // Draw full-page cover image
        page.drawImage(embeddedImage, {
          x: 0, y: 0,
          width: pageWidth, height: pageHeight
        })
        
        // Add semi-transparent overlay for title
        page.drawRectangle({
          x: 0, y: pageHeight - 200,
          width: pageWidth, height: 200,
          color: rgb(1, 1, 1),
          opacity: 0.85
        })
        
        // Title
        page.drawText(bookTitle.toUpperCase(), {
          x: pageWidth / 2 - Math.min(bookTitle.length * 10, 250),
          y: pageHeight - 100,
          size: Math.min(32, 600 / bookTitle.length),
          color: pColor
        })
        
        // Subtitle
        const subtitle = `${coloringPages.length} Beautiful Pages to Color`
        page.drawText(subtitle, {
          x: pageWidth / 2 - (subtitle.length * 4),
          y: pageHeight - 140,
          size: 14,
          color: rgb(0.4, 0.4, 0.4)
        })
        
        if (authorName) {
          page.drawText(`By ${authorName}`, {
            x: pageWidth / 2 - (authorName.length * 4),
            y: pageHeight - 170,
            size: 12,
            color: sColor
          })
        }
      } catch (imgError) {
        console.log('Failed to embed cover image:', imgError.message)
        // Fall back to text-only cover
        drawTextCover(page, pageWidth, pageHeight, bookTitle, coloringPages.length, authorName, difficulty, pColor, sColor)
      }
    } else {
      drawTextCover(page, pageWidth, pageHeight, bookTitle, coloringPages.length, authorName, difficulty, pColor, sColor)
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
      
      // Page title at top
      const pageTitle = pageData.title || `Page ${i + 1}`
      const titleX = Math.max(50, pageWidth / 2 - (pageTitle.length * 5))
      page.drawText(pageTitle, {
        x: titleX,
        y: pageHeight - 40,
        size: 14,
        color: pColor
      })
      
      // Embed coloring page image if available
      if (pageData.imageUrl) {
        try {
          const imageResponse = await fetch(pageData.imageUrl)
          const imageArrayBuffer = await imageResponse.arrayBuffer()
          const imageBytes = new Uint8Array(imageArrayBuffer)
          
          let embeddedImage
          if (pageData.imageUrl.includes('.png') || pageData.imageUrl.includes('png')) {
            embeddedImage = await pdfDoc.embedPng(imageBytes)
          } else {
            embeddedImage = await pdfDoc.embedJpg(imageBytes)
          }
          
          // Draw image in the coloring area
          const margin = 50
          const imgWidth = pageWidth - (margin * 2)
          const imgHeight = pageHeight - 120
          
          page.drawImage(embeddedImage, {
            x: margin, y: 40,
            width: imgWidth, height: imgHeight
          })
        } catch (imgError) {
          console.log(`Failed to embed page ${i + 1} image:`, imgError.message)
          drawPlaceholder(page, pageWidth, pageHeight, pageData.description)
        }
      } else {
        drawPlaceholder(page, pageWidth, pageHeight, pageData.description)
      }
      
      // Page number
      page.drawText(`${i + 1}`, {
        x: pageWidth / 2 - 5,
        y: 15,
        size: 10,
        color: rgb(0.5, 0.5, 0.5)
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
        theme: customTheme || theme, 
        difficulty, 
        pageCount: coloringPages.length,
        primaryColor,
        secondaryColor,
        hasImages: coloringPages.some(p => p.imageUrl)
      },
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    })
    
    console.log(`Coloring book generated: ${filePath}`)
    
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

// Helper: Draw text-only cover
function drawTextCover(page, pageWidth, pageHeight, bookTitle, pageCount, authorName, difficulty, pColor, sColor) {
  // Background
  page.drawRectangle({
    x: 0, y: 0,
    width: pageWidth, height: pageHeight,
    color: rgb(0.98, 0.98, 0.95)
  })
  
  // Decorative border
  page.drawRectangle({
    x: 30, y: 30,
    width: pageWidth - 60, height: pageHeight - 60,
    borderColor: pColor,
    borderWidth: 3
  })
  
  // Inner border
  page.drawRectangle({
    x: 40, y: 40,
    width: pageWidth - 80, height: pageHeight - 80,
    borderColor: sColor,
    borderWidth: 1
  })
  
  // Title
  const titleX = Math.max(50, pageWidth / 2 - (bookTitle.length * 10))
  page.drawText(bookTitle.toUpperCase(), {
    x: titleX,
    y: pageHeight - 250,
    size: Math.min(28, 500 / bookTitle.length),
    color: pColor
  })
  
  // Subtitle
  const subtitle = `${pageCount} Beautiful Pages to Color`
  page.drawText(subtitle, {
    x: pageWidth / 2 - (subtitle.length * 4),
    y: pageHeight - 300,
    size: 14,
    color: rgb(0.4, 0.4, 0.4)
  })
  
  // Difficulty badge
  const diffLabel = `Difficulty: ${difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}`
  page.drawText(diffLabel, {
    x: pageWidth / 2 - (diffLabel.length * 4),
    y: pageHeight - 340,
    size: 12,
    color: rgb(0.5, 0.5, 0.5)
  })
  
  // Author if provided
  if (authorName) {
    page.drawText(`By ${authorName}`, {
      x: pageWidth / 2 - (authorName.length * 4),
      y: 150,
      size: 14,
      color: sColor
    })
  }
}

// Helper: Draw placeholder for pages without images
function drawPlaceholder(page, pageWidth, pageHeight, description) {
  // Coloring area border
  page.drawRectangle({
    x: 50, y: 50,
    width: pageWidth - 100, height: pageHeight - 120,
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
  
  // Description hint
  if (description) {
    const shortDesc = description.substring(0, 60) + (description.length > 60 ? '...' : '')
    page.drawText(shortDesc, {
      x: 60,
      y: pageHeight / 2 - 10,
      size: 10,
      color: rgb(0.75, 0.75, 0.75)
    })
  }
}
