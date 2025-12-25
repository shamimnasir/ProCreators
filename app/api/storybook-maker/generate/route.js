import { NextResponse } from 'next/server'
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'
import fontkit from '@pdf-lib/fontkit'
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

// Helper: Check if text contains non-ASCII characters
function hasNonAscii(text) {
  return /[^\x00-\x7F]/.test(text)
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
  
  // Register fontkit for Unicode font support
  pdfDoc.registerFontkit(fontkit)
  
  // Load standard fonts as fallback
  const standardFont = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const standardFontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
  
  // Load custom Unicode fonts for non-ASCII text support
  let unicodeFont = standardFont
  let unicodeFontBold = standardFontBold
  let hasUnicodeFont = false
  
  try {
    // Check if we have any non-ASCII text in the story
    const allText = [
      storyData.title || '',
      storyData.moral || '',
      authorName || '',
      ...(storyData.pages || []).map(p => p.text || '')
    ].join('')
    
    if (hasNonAscii(allText)) {
      console.log('Non-ASCII text detected, loading Unicode fonts...')
      
      // FreeSerif has comprehensive Unicode support including Bengali conjuncts
      // Unifont is a fallback with complete Unicode coverage (bitmap-style)
      const fontPaths = [
        '/usr/share/fonts/truetype/freefont/FreeSerif.ttf',  // Best for Bengali
        '/usr/share/fonts/opentype/unifont/unifont.otf',     // Complete Unicode coverage
        '/app/public/fonts/NotoSansBengali-Regular.ttf',     
        '/usr/share/fonts/truetype/unifont/unifont_sample.ttf'
      ]
      
      const fontBoldPaths = [
        '/usr/share/fonts/truetype/freefont/FreeSerifBold.ttf',
        '/app/public/fonts/NotoSansBengali-Bold.ttf',
      ]
      
      // Try to load regular font
      for (const fontPath of fontPaths) {
        try {
          const fontBytes = await fs.readFile(fontPath)
          unicodeFont = await pdfDoc.embedFont(fontBytes, { subset: false })
          hasUnicodeFont = true
          console.log(`Loaded Unicode font: ${fontPath}`)
          break
        } catch (e) {
          console.log(`Failed to load ${fontPath}: ${e.message}`)
          // Try next font
        }
      }
      
      // Try to load bold font
      for (const fontPath of fontBoldPaths) {
        try {
          const fontBytes = await fs.readFile(fontPath)
          unicodeFontBold = await pdfDoc.embedFont(fontBytes, { subset: false })
          console.log(`Loaded Unicode bold font: ${fontPath}`)
          break
        } catch (e) {
          // Try next font, or fall back to regular
        }
      }
      
      // If bold not loaded, use regular
      if (unicodeFontBold === standardFontBold && hasUnicodeFont) {
        unicodeFontBold = unicodeFont
      }
    }
  } catch (fontError) {
    console.error('Failed to load Unicode fonts:', fontError.message)
  }
  
  // Select appropriate font based on text content
  const getFont = (text, bold = false) => {
    if (hasUnicodeFont && hasNonAscii(text)) {
      return bold ? unicodeFontBold : unicodeFont
    }
    return bold ? standardFontBold : standardFont
  }
  
  const pColor = hexToRgb(primaryColor)
  const sColor = hexToRgb(secondaryColor)
  
  // ===== COVER PAGE =====
  let page = pdfDoc.addPage([size.width, size.height])
  
  // Check if we have a cover image - if yes, make it full page
  let hasCoverImage = false
  if (storyData.coverImageUrl) {
    try {
      const { imageBytes, format } = await getImageBytes(storyData.coverImageUrl)
      let embeddedImage = format === 'png' 
        ? await pdfDoc.embedPng(imageBytes) 
        : await pdfDoc.embedJpg(imageBytes)
      
      // Draw cover image to fill the entire page
      const imgDims = embeddedImage.scale(1)
      const scaleX = size.width / imgDims.width
      const scaleY = size.height / imgDims.height
      // Use larger scale to fill (cover) rather than fit (contain)
      const scale = Math.max(scaleX, scaleY)
      const scaledWidth = imgDims.width * scale
      const scaledHeight = imgDims.height * scale
      
      // Center the image (some may be cropped if aspect ratio differs)
      const x = (size.width - scaledWidth) / 2
      const y = (size.height - scaledHeight) / 2
      
      page.drawImage(embeddedImage, {
        x: x,
        y: y,
        width: scaledWidth,
        height: scaledHeight
      })
      
      hasCoverImage = true
      console.log('Cover image embedded full-page successfully')
      
      // Only add author name at bottom if we have a cover image
      // (title is already in the AI-generated cover)
      if (authorName) {
        // Semi-transparent bar at bottom for author
        page.drawRectangle({
          x: 0,
          y: 0,
          width: size.width,
          height: 50,
          color: rgb(1, 1, 1),
          opacity: 0.85
        })
        
        // Author name without "By" prefix
        const authorFont = getFont(authorName, false)
        const authorWidth = authorFont.widthOfTextAtSize(authorName, 14)
        page.drawText(authorName, {
          x: (size.width - authorWidth) / 2,
          y: 18,
          size: 14,
          font: authorFont,
          color: rgb(0.3, 0.3, 0.3)
        })
      }
    } catch (e) {
      console.error('Failed to embed cover image:', e.message)
      hasCoverImage = false
    }
  }
  
  // If no cover image, draw a nice text-based cover
  if (!hasCoverImage) {
    // Cover background
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
    
    // Title
    const title = storyData.title || 'My Storybook'
    const titleFont = getFont(title, true)
    const titleSize = Math.min(28, (size.width - 80) / (title.length * 0.55))
    const titleWidth = titleFont.widthOfTextAtSize(title, titleSize)
    page.drawText(title, {
      x: (size.width - titleWidth) / 2,
      y: size.height / 2 + 50,
      size: titleSize,
      font: titleFont,
      color: pColor
    })
    
    // Subtitle line
    page.drawRectangle({
      x: size.width / 2 - 60,
      y: size.height / 2 + 30,
      width: 120,
      height: 3,
      color: sColor
    })
    
    // Author (without "By" prefix)
    if (authorName) {
      const authorFont = getFont(authorName, false)
      const authorWidth = authorFont.widthOfTextAtSize(authorName, 16)
      page.drawText(authorName, {
        x: (size.width - authorWidth) / 2,
        y: size.height / 2 - 20,
        size: 16,
        font: authorFont,
        color: rgb(0.4, 0.4, 0.4)
      })
    }
  }
  
  // ===== STORY PAGES =====
  const storyPages = storyData.pages || []
  
  for (let i = 0; i < storyPages.length; i++) {
    const storyPage = storyPages[i]
    page = pdfDoc.addPage([size.width, size.height])
    
    // Page background
    page.drawRectangle({
      x: 0, y: 0,
      width: size.width, height: size.height,
      color: rgb(1, 1, 1)
    })
    
    // Subtle border
    page.drawRectangle({
      x: 15, y: 15,
      width: size.width - 30, height: size.height - 30,
      borderColor: rgb(0.92, 0.92, 0.92),
      borderWidth: 1
    })
    
    // Illustration area (top 55% of page for better text space)
    const margin = 30
    const illustrationHeight = (size.height - 100) * 0.55
    const illustrationY = size.height - margin - illustrationHeight
    
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
        const maxWidth = size.width - (margin * 2)
        const maxHeight = illustrationHeight - 10
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
          x: margin, y: illustrationY,
          width: size.width - (margin * 2), height: illustrationHeight - 10,
          color: rgb(0.96, 0.96, 0.96),
          borderColor: rgb(0.88, 0.88, 0.88),
          borderWidth: 1
        })
        page.drawText('[Illustration]', {
          x: size.width / 2 - 40,
          y: illustrationY + illustrationHeight / 2,
          size: 14,
          font: standardFont,
          color: rgb(0.7, 0.7, 0.7)
        })
      }
    } else {
      // Placeholder for illustration
      page.drawRectangle({
        x: margin, y: illustrationY,
        width: size.width - (margin * 2), height: illustrationHeight - 10,
        color: rgb(0.97, 0.97, 0.97),
        borderColor: rgb(0.9, 0.9, 0.9),
        borderWidth: 1
      })
    }
    
    // Text area (bottom 40% of page)
    const textMargin = 35
    const textY = 45
    const textHeight = illustrationY - textY - 15
    const textWidth = size.width - (textMargin * 2)
    const textX = textMargin
    
    // Story text with proper word wrapping using actual font metrics
    const storyText = storyPage.text || ''
    const fontSize = 13
    const lineHeight = fontSize * 1.6
    
    // Get appropriate font for this text
    const textFont = getFont(storyText, false)
    
    // Calculate actual text width for proper wrapping
    const wrapText = (text, maxWidth, fontSize, fontToUse) => {
      const words = text.split(' ')
      const lines = []
      let currentLine = ''
      
      for (const word of words) {
        const testLine = currentLine ? `${currentLine} ${word}` : word
        const testWidth = fontToUse.widthOfTextAtSize(testLine, fontSize)
        
        if (testWidth <= maxWidth) {
          currentLine = testLine
        } else {
          if (currentLine) lines.push(currentLine)
          currentLine = word
        }
      }
      if (currentLine) lines.push(currentLine)
      return lines
    }
    
    const lines = wrapText(storyText, textWidth, fontSize, textFont)
    
    // Draw text lines
    const startY = textY + textHeight - lineHeight
    lines.forEach((line, lineIdx) => {
      if (lineIdx * lineHeight < textHeight) {
        page.drawText(line, {
          x: textX,
          y: startY - (lineIdx * lineHeight),
          size: fontSize,
          font: textFont,
          color: rgb(0.15, 0.15, 0.15)
        })
      }
    })
    
    // Page number (always use standard font for numbers)
    const pageNum = `${i + 1}`
    page.drawText(pageNum, {
      x: size.width / 2 - 5,
      y: 25,
      size: 10,
      font: standardFont,
      color: rgb(0.6, 0.6, 0.6)
    })
  }
  
  // ===== BACK COVER =====
  page = pdfDoc.addPage([size.width, size.height])
  
  // Soft gradient background
  page.drawRectangle({
    x: 0, y: 0,
    width: size.width, height: size.height,
    color: rgb(0.98, 0.97, 1)
  })
  
  // Add decorative theme-based elements
  const drawBackCoverDecorations = (page, size, pColor, sColor) => {
    // Corner decorations - soft circles
    const decorOpacity = 0.15
    
    // Top left cluster
    page.drawCircle({ x: 60, y: size.height - 60, size: 35, color: pColor, opacity: decorOpacity })
    page.drawCircle({ x: 90, y: size.height - 90, size: 20, color: sColor, opacity: decorOpacity + 0.05 })
    page.drawCircle({ x: 40, y: size.height - 100, size: 15, color: pColor, opacity: decorOpacity + 0.1 })
    
    // Top right cluster
    page.drawCircle({ x: size.width - 60, y: size.height - 70, size: 30, color: sColor, opacity: decorOpacity })
    page.drawCircle({ x: size.width - 100, y: size.height - 50, size: 18, color: pColor, opacity: decorOpacity + 0.05 })
    page.drawCircle({ x: size.width - 80, y: size.height - 110, size: 12, color: sColor, opacity: decorOpacity + 0.1 })
    
    // Bottom left cluster
    page.drawCircle({ x: 70, y: 80, size: 28, color: sColor, opacity: decorOpacity })
    page.drawCircle({ x: 40, y: 50, size: 20, color: pColor, opacity: decorOpacity + 0.05 })
    page.drawCircle({ x: 100, y: 45, size: 14, color: sColor, opacity: decorOpacity + 0.1 })
    
    // Bottom right cluster
    page.drawCircle({ x: size.width - 65, y: 70, size: 32, color: pColor, opacity: decorOpacity })
    page.drawCircle({ x: size.width - 40, y: 100, size: 18, color: sColor, opacity: decorOpacity + 0.05 })
    page.drawCircle({ x: size.width - 95, y: 50, size: 15, color: pColor, opacity: decorOpacity + 0.1 })
    
    // Center decorative elements - stars pattern
    const starPositions = [
      { x: size.width * 0.2, y: size.height * 0.3 },
      { x: size.width * 0.8, y: size.height * 0.35 },
      { x: size.width * 0.15, y: size.height * 0.65 },
      { x: size.width * 0.85, y: size.height * 0.7 },
      { x: size.width * 0.25, y: size.height * 0.8 },
      { x: size.width * 0.75, y: size.height * 0.2 },
    ]
    
    starPositions.forEach((pos, i) => {
      const starSize = 4 + (i % 3) * 2
      page.drawCircle({ 
        x: pos.x, 
        y: pos.y, 
        size: starSize, 
        color: i % 2 === 0 ? pColor : sColor, 
        opacity: 0.2 + (i % 3) * 0.05 
      })
    })
    
    // Decorative lines
    page.drawRectangle({
      x: size.width / 2 - 80,
      y: size.height / 2 + 60,
      width: 160,
      height: 2,
      color: sColor,
      opacity: 0.3
    })
    
    page.drawRectangle({
      x: size.width / 2 - 60,
      y: size.height / 2 - 80,
      width: 120,
      height: 2,
      color: sColor,
      opacity: 0.3
    })
  }
  
  drawBackCoverDecorations(page, size, pColor, sColor)
  
  // Moral/quote with proper text wrapping within margins
  if (storyData.moral) {
    const moral = storyData.moral
    const moralFontSize = 14
    const maxMoralWidth = size.width - 100 // 50px margin on each side
    const lineHeight = moralFontSize * 1.6
    
    // Get appropriate font for moral text
    const moralFont = getFont(moral, false)
    
    // Wrap the moral text properly
    const wrapMoralText = (text, maxWidth) => {
      const words = text.split(' ')
      const lines = []
      let currentLine = ''
      
      for (const word of words) {
        const testLine = currentLine ? `${currentLine} ${word}` : word
        const testWidth = moralFont.widthOfTextAtSize(testLine, moralFontSize)
        
        if (testWidth <= maxWidth) {
          currentLine = testLine
        } else {
          if (currentLine) lines.push(currentLine)
          currentLine = word
        }
      }
      if (currentLine) lines.push(currentLine)
      return lines
    }
    
    const moralLines = wrapMoralText(`"${moral}"`, maxMoralWidth)
    const totalMoralHeight = moralLines.length * lineHeight
    const moralStartY = size.height / 2 + totalMoralHeight / 2 + 20
    
    // Draw each line of the moral centered
    moralLines.forEach((line, idx) => {
      const lineWidth = moralFont.widthOfTextAtSize(line, moralFontSize)
      page.drawText(line, {
        x: (size.width - lineWidth) / 2,
        y: moralStartY - (idx * lineHeight),
        size: moralFontSize,
        font: moralFont,
        color: pColor
      })
    })
  }
  
  // "The End" text with decorative styling
  const endText = 'The End'
  const endFontSize = 22
  const endWidth = standardFontBold.widthOfTextAtSize(endText, endFontSize)
  
  page.drawText(endText, {
    x: (size.width - endWidth) / 2,
    y: size.height / 2 - 40,
    size: endFontSize,
    font: standardFontBold,
    color: sColor
  })
  
  // Small decorative flourish under "The End"
  const flourishY = size.height / 2 - 60
  page.drawCircle({ x: size.width / 2 - 25, y: flourishY, size: 3, color: pColor, opacity: 0.5 })
  page.drawCircle({ x: size.width / 2, y: flourishY - 5, size: 4, color: sColor, opacity: 0.6 })
  page.drawCircle({ x: size.width / 2 + 25, y: flourishY, size: 3, color: pColor, opacity: 0.5 })
  
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
