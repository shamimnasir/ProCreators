import { NextResponse } from 'next/server'
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'
import { getCollection } from '@/lib/mongodb'
import { randomUUID } from 'crypto'
import fs from 'fs/promises'
import path from 'path'
import { spawn } from 'child_process'

// KDP Paper Sizes for Children's Books
const PAPER_SIZES = {
  '8.5x8.5': { width: 612, height: 612, name: '8.5" x 8.5" (Square)' },
  '8x10': { width: 576, height: 720, name: '8" x 10"' },
  '8.5x11': { width: 612, height: 792, name: '8.5" x 11" (Letter)' },
  '6x9': { width: 432, height: 648, name: '6" x 9"' }
}

// Age group writing styles
const AGE_STYLES = {
  'toddler': 'Very simple words, 1-2 short sentences per page, repetitive patterns, focus on familiar objects and routines',
  'preschool': 'Simple sentences, 2-3 sentences per page, rhyming encouraged, bright action words, relatable characters',
  'early-reader': 'Short paragraphs, 3-5 sentences per page, simple dialogue, beginning chapter book style',
  'middle-grade': 'Full paragraphs, more complex vocabulary, detailed descriptions, character development'
}

// Generate story text using Emergent LLM
async function generateStoryText(title, genre, ageGroup, pageCount, customPrompt) {
  return new Promise((resolve) => {
    try {
      const ageStyle = AGE_STYLES[ageGroup] || AGE_STYLES['preschool']
      
      const prompt = `Create an illustrated children's storybook with EXACTLY ${pageCount} pages.

Title: "${title}"
Genre: ${genre}
Target Age: ${ageGroup}
Writing Style: ${ageStyle}
${customPrompt ? `Additional Instructions: ${customPrompt}` : ''}

IMPORTANT REQUIREMENTS:
1. Create EXACTLY ${pageCount} story pages (not including cover)
2. Each page should have text appropriate for the age group
3. Each page needs a clear, describable scene for illustration
4. The story should have a clear beginning, middle, and end
5. Include engaging characters and a simple moral or lesson

Return as a JSON object with this EXACT structure:
{
  "title": "Story Title",
  "summary": "One sentence story summary",
  "characters": ["Character 1", "Character 2"],
  "moral": "The lesson of the story",
  "pages": [
    {
      "pageNumber": 1,
      "text": "The story text for this page...",
      "illustrationPrompt": "Detailed description of what should be illustrated on this page, including characters, setting, actions, and mood"
    }
  ]
}

Return ONLY valid JSON, no markdown or extra text.`

      const scriptPath = path.join(process.cwd(), 'lib', 'gemini-text.py')
      
      const inputData = JSON.stringify({
        prompt: prompt,
        systemMessage: 'You are a professional children\'s book author who creates engaging, age-appropriate stories with vivid imagery perfect for illustration. Always return valid JSON.'
      })
      
      const pythonProcess = spawn('/root/.venv/bin/python3', [scriptPath], {
        env: { ...process.env }
      })
      
      pythonProcess.stdin.write(inputData)
      pythonProcess.stdin.end()
      
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
          console.error('Story generation error:', stderr)
          resolve({ success: false, error: stderr })
          return
        }
        
        try {
          const result = JSON.parse(stdout)
          if (result.success && result.content) {
            // Parse the story content
            let storyData
            try {
              // Clean up the response - remove markdown if present
              let content = result.content
              content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
              storyData = JSON.parse(content)
            } catch (parseErr) {
              console.error('Failed to parse story JSON:', parseErr)
              resolve({ success: false, error: 'Failed to parse story content' })
              return
            }
            resolve({ success: true, story: storyData })
          } else {
            resolve({ success: false, error: result.error || 'Generation failed' })
          }
        } catch (error) {
          resolve({ success: false, error: 'Failed to parse response' })
        }
      })
      
      pythonProcess.on('error', (error) => {
        resolve({ success: false, error: error.message })
      })
      
      // Timeout after 60 seconds
      setTimeout(() => {
        pythonProcess.kill()
        resolve({ success: false, error: 'Story generation timed out' })
      }, 60000)
      
    } catch (error) {
      resolve({ success: false, error: error.message })
    }
  })
}

// Generate illustration using Nano Banana
async function generateIllustration(prompt, style) {
  return new Promise((resolve) => {
    try {
      const styleGuides = {
        'watercolor': 'beautiful watercolor children\'s book illustration style, soft colors, dreamy, artistic',
        'cartoon': 'cute cartoon children\'s book illustration, bright colors, friendly characters, playful',
        'digital': 'modern digital children\'s book illustration, clean lines, vibrant colors',
        'classic': 'classic storybook illustration style, warm colors, nostalgic, timeless feel',
        'whimsical': 'whimsical fantasy illustration, magical, enchanting, detailed'
      }
      
      const styleDesc = styleGuides[style] || styleGuides['cartoon']
      
      const fullPrompt = `${styleDesc}: ${prompt}. Child-friendly, no scary elements, suitable for children's picture book.`
      
      console.log(`Generating illustration: ${prompt.substring(0, 50)}...`)
      
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
          console.error('Illustration generation error:', stderr)
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

// Helper: Get image bytes from URL or base64
async function getImageBytes(imageUrl) {
  if (!imageUrl) throw new Error('No image URL provided')
  
  if (imageUrl.startsWith('data:')) {
    const matches = imageUrl.match(/^data:image\/(\w+);base64,(.+)$/)
    if (!matches) throw new Error('Invalid base64 data URL format')
    const format = matches[1]
    const base64Data = matches[2]
    const imageBytes = Buffer.from(base64Data, 'base64')
    return { imageBytes: new Uint8Array(imageBytes), format }
  }
  
  const response = await fetch(imageUrl)
  if (!response.ok) throw new Error(`Failed to fetch image: ${response.status}`)
  const contentType = response.headers.get('content-type') || ''
  const format = contentType.includes('png') ? 'png' : 'jpeg'
  const arrayBuffer = await response.arrayBuffer()
  return { imageBytes: new Uint8Array(arrayBuffer), format }
}

// Helper: Convert hex to RGB
function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  if (!result) return rgb(0.2, 0.2, 0.4)
  return rgb(
    parseInt(result[1], 16) / 255,
    parseInt(result[2], 16) / 255,
    parseInt(result[3], 16) / 255
  )
}

// Generate the PDF
async function generatePDF(storyData, options) {
  const {
    paperSize = '8.5x8.5',
    primaryColor = '#4f46e5',
    secondaryColor = '#818cf8',
    authorName = '',
    illustrationStyle = 'cartoon'
  } = options
  
  const size = PAPER_SIZES[paperSize] || PAPER_SIZES['8.5x8.5']
  const pdfDoc = await PDFDocument.create()
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
  
  const pColor = hexToRgb(primaryColor)
  const sColor = hexToRgb(secondaryColor)
  
  // ===== COVER PAGE =====
  let page = pdfDoc.addPage([size.width, size.height])
  
  // Cover background gradient effect
  page.drawRectangle({
    x: 0, y: 0,
    width: size.width, height: size.height,
    color: rgb(0.98, 0.98, 1)
  })
  
  // Decorative elements
  page.drawCircle({ x: 80, y: size.height - 80, size: 40, color: sColor, opacity: 0.3 })
  page.drawCircle({ x: size.width - 80, y: size.height - 100, size: 50, color: pColor, opacity: 0.2 })
  page.drawCircle({ x: 60, y: 100, size: 35, color: sColor, opacity: 0.25 })
  page.drawCircle({ x: size.width - 60, y: 80, size: 45, color: pColor, opacity: 0.2 })
  
  // If cover image exists, embed it
  if (storyData.coverImageUrl) {
    try {
      const { imageBytes, format } = await getImageBytes(storyData.coverImageUrl)
      let embeddedImage = format === 'png' 
        ? await pdfDoc.embedPng(imageBytes) 
        : await pdfDoc.embedJpg(imageBytes)
      
      const imgDims = embeddedImage.scale(1)
      const maxWidth = size.width - 80
      const maxHeight = size.height - 200
      const scale = Math.min(maxWidth / imgDims.width, maxHeight / imgDims.height)
      const scaledWidth = imgDims.width * scale
      const scaledHeight = imgDims.height * scale
      
      page.drawImage(embeddedImage, {
        x: (size.width - scaledWidth) / 2,
        y: size.height / 2 - scaledHeight / 2 + 30,
        width: scaledWidth,
        height: scaledHeight
      })
    } catch (e) {
      console.error('Failed to embed cover image:', e.message)
    }
  }
  
  // Title
  const title = storyData.title || 'My Storybook'
  const titleSize = Math.min(32, (size.width - 80) / (title.length * 0.5))
  const titleWidth = font.widthOfTextAtSize(title, titleSize)
  page.drawText(title, {
    x: (size.width - titleWidth) / 2,
    y: size.height - 80,
    size: titleSize,
    font: fontBold,
    color: pColor
  })
  
  // Author
  if (authorName) {
    const authorText = `By ${authorName}`
    const authorWidth = font.widthOfTextAtSize(authorText, 14)
    page.drawText(authorText, {
      x: (size.width - authorWidth) / 2,
      y: 60,
      size: 14,
      font: font,
      color: rgb(0.4, 0.4, 0.4)
    })
  }
  
  // ===== STORY PAGES =====
  const pages = storyData.pages || []
  
  for (let i = 0; i < pages.length; i++) {
    const storyPage = pages[i]
    page = pdfDoc.addPage([size.width, size.height])
    
    // Page background
    page.drawRectangle({
      x: 0, y: 0,
      width: size.width, height: size.height,
      color: rgb(1, 1, 1)
    })
    
    // Subtle border
    page.drawRectangle({
      x: 20, y: 20,
      width: size.width - 40, height: size.height - 40,
      borderColor: rgb(0.9, 0.9, 0.9),
      borderWidth: 1
    })
    
    // Illustration area (top 60% of page)
    const illustrationHeight = (size.height - 100) * 0.6
    const illustrationY = size.height - 50 - illustrationHeight
    
    if (storyPage.imageUrl) {
      try {
        const { imageBytes, format } = await getImageBytes(storyPage.imageUrl)
        let embeddedImage
        try {
          embeddedImage = format === 'png' 
            ? await pdfDoc.embedPng(imageBytes) 
            : await pdfDoc.embedJpg(imageBytes)
        } catch {
          embeddedImage = format === 'png' 
            ? await pdfDoc.embedJpg(imageBytes) 
            : await pdfDoc.embedPng(imageBytes)
        }
        
        const imgDims = embeddedImage.scale(1)
        const maxWidth = size.width - 80
        const maxHeight = illustrationHeight - 20
        const scale = Math.min(maxWidth / imgDims.width, maxHeight / imgDims.height)
        const scaledWidth = imgDims.width * scale
        const scaledHeight = imgDims.height * scale
        
        page.drawImage(embeddedImage, {
          x: (size.width - scaledWidth) / 2,
          y: illustrationY + (illustrationHeight - scaledHeight) / 2,
          width: scaledWidth,
          height: scaledHeight
        })
      } catch (e) {
        console.error(`Failed to embed image for page ${i + 1}:`, e.message)
        // Draw placeholder
        page.drawRectangle({
          x: 40, y: illustrationY,
          width: size.width - 80, height: illustrationHeight - 20,
          color: rgb(0.95, 0.95, 0.95),
          borderColor: rgb(0.85, 0.85, 0.85),
          borderWidth: 1
        })
        page.drawText('[Illustration]', {
          x: size.width / 2 - 40,
          y: illustrationY + illustrationHeight / 2,
          size: 14,
          font: font,
          color: rgb(0.7, 0.7, 0.7)
        })
      }
    } else {
      // Placeholder for illustration
      page.drawRectangle({
        x: 40, y: illustrationY,
        width: size.width - 80, height: illustrationHeight - 20,
        color: rgb(0.97, 0.97, 0.97),
        borderColor: rgb(0.9, 0.9, 0.9),
        borderWidth: 1
      })
    }
    
    // Text area (bottom 35% of page)
    const textY = 50
    const textHeight = illustrationY - textY - 20
    const textWidth = size.width - 80
    const textX = 40
    
    // Story text with word wrapping
    const storyText = storyPage.text || ''
    const fontSize = 14
    const lineHeight = fontSize * 1.5
    const maxCharsPerLine = Math.floor(textWidth / (fontSize * 0.5))
    
    // Simple word wrap
    const words = storyText.split(' ')
    const lines = []
    let currentLine = ''
    
    for (const word of words) {
      if ((currentLine + ' ' + word).length <= maxCharsPerLine) {
        currentLine = currentLine ? currentLine + ' ' + word : word
      } else {
        if (currentLine) lines.push(currentLine)
        currentLine = word
      }
    }
    if (currentLine) lines.push(currentLine)
    
    // Draw text lines
    const startY = textY + textHeight - lineHeight
    lines.forEach((line, lineIdx) => {
      if (lineIdx * lineHeight < textHeight) {
        page.drawText(line, {
          x: textX,
          y: startY - (lineIdx * lineHeight),
          size: fontSize,
          font: font,
          color: rgb(0.15, 0.15, 0.15)
        })
      }
    })
    
    // Page number
    const pageNum = `${i + 1}`
    page.drawText(pageNum, {
      x: size.width / 2 - 5,
      y: 25,
      size: 10,
      font: font,
      color: rgb(0.6, 0.6, 0.6)
    })
  }
  
  // ===== BACK COVER =====
  page = pdfDoc.addPage([size.width, size.height])
  
  page.drawRectangle({
    x: 0, y: 0,
    width: size.width, height: size.height,
    color: rgb(0.98, 0.98, 1)
  })
  
  // Summary/moral
  if (storyData.moral) {
    const moralText = `"${storyData.moral}"`
    const moralWidth = font.widthOfTextAtSize(moralText, 16)
    page.drawText(moralText, {
      x: Math.max(40, (size.width - moralWidth) / 2),
      y: size.height / 2,
      size: 16,
      font: font,
      color: pColor
    })
  }
  
  page.drawText('The End', {
    x: size.width / 2 - 30,
    y: size.height / 2 - 50,
    size: 18,
    font: fontBold,
    color: sColor
  })
  
  return pdfDoc.save()
}

export async function POST(request) {
  try {
    const body = await request.json()
    const {
      action = 'generate-story', // 'generate-story', 'generate-illustrations', 'generate-pdf'
      title,
      genre,
      ageGroup,
      pageCount,
      customPrompt,
      story, // For illustration/pdf generation
      paperSize,
      primaryColor,
      secondaryColor,
      authorName,
      illustrationStyle,
      generateIllustrations = false
    } = body
    
    console.log(`Storybook action: ${action}`)
    
    // ACTION: Generate Story Text
    if (action === 'generate-story') {
      console.log(`Generating story: "${title}" - ${genre} for ${ageGroup}, ${pageCount} pages`)
      
      const result = await generateStoryText(title, genre, ageGroup, pageCount, customPrompt)
      
      if (!result.success) {
        return NextResponse.json({ success: false, error: result.error }, { status: 500 })
      }
      
      return NextResponse.json({
        success: true,
        story: result.story
      })
    }
    
    // ACTION: Generate Illustrations for existing story
    if (action === 'generate-illustrations') {
      if (!story || !story.pages) {
        return NextResponse.json({ success: false, error: 'No story provided' }, { status: 400 })
      }
      
      console.log(`Generating illustrations for ${story.pages.length} pages...`)
      
      const updatedPages = [...story.pages]
      
      // Generate cover image first
      let coverImageUrl = null
      const coverPrompt = `Book cover for children's story "${story.title}": ${story.summary || story.pages[0]?.illustrationPrompt || 'colorful engaging children\'s book cover'}`
      const coverResult = await generateIllustration(coverPrompt, illustrationStyle)
      if (coverResult.success) {
        coverImageUrl = coverResult.imageUrl
        console.log('Cover image generated successfully')
      }
      
      // Generate page illustrations in batches
      const BATCH_SIZE = 2
      for (let i = 0; i < updatedPages.length; i += BATCH_SIZE) {
        const batch = updatedPages.slice(i, i + BATCH_SIZE)
        const batchPromises = batch.map(async (page, batchIdx) => {
          const pageIdx = i + batchIdx
          if (page.imageUrl) return { pageIdx, imageUrl: page.imageUrl } // Already has image
          
          const prompt = page.illustrationPrompt || page.text
          const result = await generateIllustration(prompt, illustrationStyle)
          return { pageIdx, imageUrl: result.success ? result.imageUrl : null }
        })
        
        const batchResults = await Promise.all(batchPromises)
        for (const { pageIdx, imageUrl } of batchResults) {
          if (imageUrl) {
            updatedPages[pageIdx].imageUrl = imageUrl
            console.log(`Page ${pageIdx + 1} illustration generated`)
          }
        }
      }
      
      return NextResponse.json({
        success: true,
        story: {
          ...story,
          coverImageUrl,
          pages: updatedPages
        },
        illustratedCount: updatedPages.filter(p => p.imageUrl).length
      })
    }
    
    // ACTION: Generate Final PDF
    if (action === 'generate-pdf') {
      if (!story) {
        return NextResponse.json({ success: false, error: 'No story provided' }, { status: 400 })
      }
      
      console.log(`Generating PDF for "${story.title}"...`)
      
      // Generate illustrations if requested and not already present
      let finalStory = { ...story }
      
      if (generateIllustrations) {
        const pagesNeedingImages = story.pages.filter(p => !p.imageUrl)
        if (pagesNeedingImages.length > 0 || !story.coverImageUrl) {
          console.log(`Generating ${pagesNeedingImages.length} missing illustrations...`)
          
          // Generate cover
          if (!story.coverImageUrl) {
            const coverPrompt = `Book cover for children's story "${story.title}": ${story.summary || 'colorful engaging children\'s book cover'}`
            const coverResult = await generateIllustration(coverPrompt, illustrationStyle)
            if (coverResult.success) {
              finalStory.coverImageUrl = coverResult.imageUrl
            }
          }
          
          // Generate page illustrations
          for (let i = 0; i < finalStory.pages.length; i++) {
            if (!finalStory.pages[i].imageUrl) {
              const prompt = finalStory.pages[i].illustrationPrompt || finalStory.pages[i].text
              const result = await generateIllustration(prompt, illustrationStyle)
              if (result.success) {
                finalStory.pages[i].imageUrl = result.imageUrl
              }
            }
          }
        }
      }
      
      // Generate the PDF
      const pdfBytes = await generatePDF(finalStory, {
        paperSize,
        primaryColor,
        secondaryColor,
        authorName,
        illustrationStyle
      })
      
      // Save PDF
      const outputDir = '/app/public/storybooks'
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
        type: 'storybook',
        category: 'document',
        title: finalStory.title,
        description: `${finalStory.pages.length} page illustrated storybook - ${genre || 'Adventure'}`,
        filePath: `/storybooks/${fileName}`,
        fileSize: pdfBytes.length,
        tool: 'storybook-maker',
        metadata: {
          genre,
          ageGroup,
          pageCount: finalStory.pages.length,
          hasIllustrations: finalStory.pages.some(p => p.imageUrl),
          illustrationStyle,
          paperSize,
          authorName,
          moral: finalStory.moral
        },
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      })
      
      console.log(`Storybook PDF generated: ${filePath}`)
      
      return NextResponse.json({
        success: true,
        title: finalStory.title,
        downloadUrl: `/storybooks/${fileName}`,
        pageCount: finalStory.pages.length + 2, // +2 for cover and back
        libraryId: documentId,
        story: finalStory
      })
    }
    
    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 })
    
  } catch (error) {
    console.error('Storybook generation error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to generate storybook' },
      { status: 500 }
    )
  }
}
