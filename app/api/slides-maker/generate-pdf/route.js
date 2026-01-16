import { NextResponse } from 'next/server'
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import { getCollection } from '@/lib/mongodb'
import { randomUUID } from 'crypto'
import fs from 'fs/promises'
import path from 'path'

// Helper function to sanitize text - keeps Unicode/Bangla characters
function sanitizeText(text) {
  if (!text) return ''
  return String(text)
    .replace(/[\r\n\t]/g, ' ')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/\u2026/g, '...')
    .replace(/\u2013/g, '-')
    .replace(/\u2014/g, '--')
    .replace(/\u00A0/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

// Convert hex color to RGB
function hexToRgb(hex) {
  if (!hex) return rgb(1, 1, 1)
  hex = hex.replace('#', '')
  const r = parseInt(hex.substring(0, 2), 16) / 255
  const g = parseInt(hex.substring(2, 4), 16) / 255
  const b = parseInt(hex.substring(4, 6), 16) / 255
  return rgb(r, g, b)
}

// Wrap text helper
function wrapText(text, font, fontSize, maxWidth) {
  const cleanText = sanitizeText(text || '')
  if (!cleanText) return []
  
  const words = cleanText.split(/\s+/).filter(w => w.length > 0)
  const lines = []
  let currentLine = ''
  
  for (const word of words) {
    if (!word) continue
    const testLine = currentLine ? `${currentLine} ${word}` : word
    try {
      const width = font.widthOfTextAtSize(testLine, fontSize)
      if (width <= maxWidth) {
        currentLine = testLine
      } else {
        if (currentLine) lines.push(currentLine)
        currentLine = word
      }
    } catch (e) {
      continue
    }
  }
  if (currentLine) lines.push(currentLine)
  return lines
}

// Fetch and embed image
async function embedImage(pdfDoc, imageUrl) {
  try {
    if (!imageUrl) return null
    
    // Handle base64 images
    if (imageUrl.startsWith('data:image/')) {
      const matches = imageUrl.match(/^data:image\/(png|jpeg|jpg);base64,(.+)$/)
      if (matches) {
        const type = matches[1]
        const base64Data = matches[2]
        const imageBytes = Buffer.from(base64Data, 'base64')
        
        if (type === 'png') {
          return await pdfDoc.embedPng(imageBytes)
        } else {
          return await pdfDoc.embedJpg(imageBytes)
        }
      }
    }
    
    // Handle URL images
    if (imageUrl.startsWith('http')) {
      const response = await fetch(imageUrl)
      if (!response.ok) return null
      
      const arrayBuffer = await response.arrayBuffer()
      const imageBytes = new Uint8Array(arrayBuffer)
      
      // Try PNG first, then JPG
      try {
        return await pdfDoc.embedPng(imageBytes)
      } catch {
        try {
          return await pdfDoc.embedJpg(imageBytes)
        } catch {
          return null
        }
      }
    }
    
    // Handle local file paths
    if (imageUrl.startsWith('/')) {
      const filePath = path.join('/app/public', imageUrl)
      const imageBytes = await fs.readFile(filePath)
      
      if (imageUrl.endsWith('.png')) {
        return await pdfDoc.embedPng(imageBytes)
      } else {
        return await pdfDoc.embedJpg(imageBytes)
      }
    }
    
    return null
  } catch (error) {
    console.error('Error embedding image:', error)
    return null
  }
}

// Draw a single slide
async function drawSlide(page, slide, pdfDoc, fonts, dimensions) {
  const { width, height } = dimensions
  const { boldFont, regularFont, italicFont } = fonts
  const margin = 50
  const contentWidth = width - (margin * 2)
  
  // Get slide colors from style
  const bgColor = slide.style?.backgroundColor ? hexToRgb(slide.style.backgroundColor) : rgb(0.1, 0.4, 0.8)
  const textColor = slide.style?.textColor ? hexToRgb(slide.style.textColor) : rgb(1, 1, 1)
  const textAlign = slide.style?.textAlign || 'left'
  
  // Background color
  page.drawRectangle({
    x: 0, y: 0, width, height,
    color: bgColor
  })
  
  // Embed and draw background image if available
  if (slide.backgroundImage) {
    try {
      const embeddedImage = await embedImage(pdfDoc, slide.backgroundImage)
      if (embeddedImage) {
        const imgDims = embeddedImage.scale(1)
        const scale = Math.max(width / imgDims.width, height / imgDims.height)
        const scaledWidth = imgDims.width * scale
        const scaledHeight = imgDims.height * scale
        
        page.drawImage(embeddedImage, {
          x: (width - scaledWidth) / 2,
          y: (height - scaledHeight) / 2,
          width: scaledWidth,
          height: scaledHeight,
          opacity: 0.9
        })
        
        // Add overlay for text readability
        page.drawRectangle({
          x: 0, y: 0, width, height,
          color: rgb(0, 0, 0),
          opacity: 0.3
        })
      }
    } catch (err) {
      console.error('Failed to embed background image:', err)
    }
  }
  
  // Slide number
  page.drawText(String(slide.slideNumber || ''), {
    x: width - 40, y: 20,
    size: 12, font: regularFont, color: textColor, opacity: 0.7
  })
  
  const slideType = slide.type || 'content'
  
  // Calculate X position based on alignment
  const getX = (textWidth) => {
    if (textAlign === 'center') return (width - textWidth) / 2
    if (textAlign === 'right') return width - margin - textWidth
    return margin
  }
  
  switch (slideType) {
    case 'title':
      await drawTitleSlide(page, slide, fonts, dimensions, textColor, getX)
      break
    case 'section':
      await drawSectionSlide(page, slide, fonts, dimensions, textColor, getX)
      break
    case 'quote':
      await drawQuoteSlide(page, slide, fonts, dimensions, textColor, getX)
      break
    case 'stats':
      await drawStatsSlide(page, slide, fonts, dimensions, textColor, bgColor, getX)
      break
    case 'two-column':
      await drawTwoColumnSlide(page, slide, fonts, dimensions, textColor, bgColor)
      break
    case 'conclusion':
    case 'cta':
      await drawConclusionSlide(page, slide, fonts, dimensions, textColor, bgColor, getX)
      break
    default:
      await drawContentSlide(page, slide, fonts, dimensions, textColor, getX)
  }
}

// Title slide
function drawTitleSlide(page, slide, fonts, dimensions, textColor, getX) {
  const { width, height } = dimensions
  const { boldFont, regularFont } = fonts
  
  // Title
  const titleLines = wrapText(slide.title || '', boldFont, 48, width - 100)
  let y = height / 2 + (titleLines.length * 25)
  titleLines.forEach(line => {
    const titleWidth = boldFont.widthOfTextAtSize(line, 48)
    page.drawText(line, {
      x: getX(titleWidth), y,
      size: 48, font: boldFont, color: textColor
    })
    y -= 58
  })
  
  // Subtitle
  if (slide.subtitle) {
    const subtitleLines = wrapText(slide.subtitle, regularFont, 24, width - 100)
    y -= 20
    subtitleLines.forEach(line => {
      const subWidth = regularFont.widthOfTextAtSize(line, 24)
      page.drawText(line, {
        x: getX(subWidth), y,
        size: 24, font: regularFont, color: textColor, opacity: 0.85
      })
      y -= 32
    })
  }
}

// Section divider slide
function drawSectionSlide(page, slide, fonts, dimensions, textColor, getX) {
  const { width, height } = dimensions
  const { boldFont } = fonts
  
  const titleLines = wrapText(slide.title || '', boldFont, 44, width - 100)
  let y = height / 2 + (titleLines.length * 25)
  titleLines.forEach(line => {
    const titleWidth = boldFont.widthOfTextAtSize(line, 44)
    page.drawText(line, {
      x: getX(titleWidth), y,
      size: 44, font: boldFont, color: textColor
    })
    y -= 54
  })
}

// Content slide with bullets
function drawContentSlide(page, slide, fonts, dimensions, textColor, getX) {
  const { width, height } = dimensions
  const { boldFont, regularFont } = fonts
  const margin = 50
  const contentWidth = width - (margin * 2)
  
  // Title
  const titleLines = wrapText(slide.title || '', boldFont, 32, contentWidth)
  let y = height - 70
  titleLines.forEach(line => {
    page.drawText(line, {
      x: margin, y, size: 32, font: boldFont, color: textColor
    })
    y -= 40
  })
  
  y -= 30
  
  // Bullets
  const bullets = slide.bullets || []
  bullets.forEach((bullet) => {
    if (y < 60) return
    
    // Bullet point
    page.drawCircle({
      x: margin + 8, y: y + 5, size: 4,
      color: textColor, opacity: 0.8
    })
    
    // Bullet text
    const bulletLines = wrapText(bullet, regularFont, 20, contentWidth - 30)
    bulletLines.forEach((line, lineIdx) => {
      page.drawText(line, {
        x: margin + 25, y: y - (lineIdx * 26),
        size: 20, font: regularFont, color: textColor
      })
    })
    y -= (bulletLines.length * 26) + 18
  })
}

// Quote slide
function drawQuoteSlide(page, slide, fonts, dimensions, textColor, getX) {
  const { width, height } = dimensions
  const { boldFont, regularFont, italicFont } = fonts
  
  // Large quote mark
  page.drawText('"', {
    x: 50, y: height - 120,
    size: 120, font: boldFont, color: textColor, opacity: 0.3
  })
  
  // Quote text
  const quoteLines = wrapText(slide.quote || '', italicFont, 26, width - 140)
  let y = height - 180
  quoteLines.forEach(line => {
    page.drawText(line, {
      x: 70, y, size: 26, font: italicFont, color: textColor
    })
    y -= 36
  })
  
  // Attribution
  if (slide.attribution) {
    y -= 25
    page.drawText(`- ${sanitizeText(slide.attribution)}`, {
      x: 70, y, size: 18, font: regularFont, color: textColor, opacity: 0.8
    })
  }
}

// Stats slide
function drawStatsSlide(page, slide, fonts, dimensions, textColor, bgColor, getX) {
  const { width, height } = dimensions
  const { boldFont, regularFont } = fonts
  const margin = 50
  
  // Title
  const titleLines = wrapText(slide.title || 'Key Statistics', boldFont, 32, width - 100)
  let y = height - 70
  titleLines.forEach(line => {
    page.drawText(line, {
      x: margin, y, size: 32, font: boldFont, color: textColor
    })
    y -= 40
  })
  
  // Stats grid
  const stats = slide.stats || []
  const statCount = Math.min(stats.length, 3)
  const statWidth = (width - margin * 2 - 40) / statCount
  
  stats.slice(0, 3).forEach((stat, idx) => {
    const x = margin + (idx * (statWidth + 20))
    const boxY = height - 280
    
    // Stat box background
    page.drawRectangle({
      x, y: boxY, width: statWidth, height: 140,
      color: rgb(1, 1, 1), opacity: 0.15
    })
    
    // Value
    const value = sanitizeText(stat.value || '')
    const valueWidth = boldFont.widthOfTextAtSize(value, 38)
    page.drawText(value, {
      x: x + (statWidth - valueWidth) / 2, y: boxY + 85,
      size: 38, font: boldFont, color: textColor
    })
    
    // Label
    const labelLines = wrapText(stat.label || '', regularFont, 14, statWidth - 20)
    let labelY = boxY + 45
    labelLines.forEach(line => {
      const labelWidth = regularFont.widthOfTextAtSize(line, 14)
      page.drawText(line, {
        x: x + (statWidth - labelWidth) / 2, y: labelY,
        size: 14, font: regularFont, color: textColor, opacity: 0.85
      })
      labelY -= 20
    })
  })
}

// Two-column slide
function drawTwoColumnSlide(page, slide, fonts, dimensions, textColor, bgColor) {
  const { width, height } = dimensions
  const { boldFont, regularFont } = fonts
  const margin = 50
  const colWidth = (width - margin * 2 - 40) / 2
  
  // Title
  const titleLines = wrapText(slide.title || '', boldFont, 32, width - 100)
  let y = height - 70
  titleLines.forEach(line => {
    page.drawText(line, {
      x: margin, y, size: 32, font: boldFont, color: textColor
    })
    y -= 40
  })
  
  y -= 25
  const contentY = y
  
  // Left column
  const leftCol = slide.leftColumn || { heading: '', points: [] }
  let leftY = contentY
  
  // Left heading
  page.drawRectangle({
    x: margin, y: leftY - 5, width: colWidth, height: 35,
    color: rgb(1, 1, 1), opacity: 0.2
  })
  page.drawText(sanitizeText(leftCol.heading || 'Left'), {
    x: margin + 12, y: leftY + 5,
    size: 18, font: boldFont, color: textColor
  })
  leftY -= 50
  
  // Left points
  const leftPoints = leftCol.points || []
  leftPoints.forEach(point => {
    page.drawCircle({ x: margin + 8, y: leftY + 5, size: 3, color: textColor })
    const lines = wrapText(point, regularFont, 16, colWidth - 25)
    lines.forEach((line, i) => {
      page.drawText(line, {
        x: margin + 20, y: leftY - (i * 22),
        size: 16, font: regularFont, color: textColor
      })
    })
    leftY -= (lines.length * 22) + 12
  })
  
  // Right column
  const rightCol = slide.rightColumn || { heading: '', points: [] }
  let rightY = contentY
  const rightX = margin + colWidth + 40
  
  // Right heading
  page.drawRectangle({
    x: rightX, y: rightY - 5, width: colWidth, height: 35,
    color: rgb(1, 1, 1), opacity: 0.2
  })
  page.drawText(sanitizeText(rightCol.heading || 'Right'), {
    x: rightX + 12, y: rightY + 5,
    size: 18, font: boldFont, color: textColor
  })
  rightY -= 50
  
  // Right points
  const rightPoints = rightCol.points || []
  rightPoints.forEach(point => {
    page.drawCircle({ x: rightX + 8, y: rightY + 5, size: 3, color: textColor })
    const lines = wrapText(point, regularFont, 16, colWidth - 25)
    lines.forEach((line, i) => {
      page.drawText(line, {
        x: rightX + 20, y: rightY - (i * 22),
        size: 16, font: regularFont, color: textColor
      })
    })
    rightY -= (lines.length * 22) + 12
  })
}

// Conclusion/CTA slide
function drawConclusionSlide(page, slide, fonts, dimensions, textColor, bgColor, getX) {
  const { width, height } = dimensions
  const { boldFont, regularFont } = fonts
  const margin = 50
  
  // Title
  const titleLines = wrapText(slide.title || 'Thank You', boldFont, 36, width - 100)
  let y = height - 90
  titleLines.forEach(line => {
    const titleWidth = boldFont.widthOfTextAtSize(line, 36)
    page.drawText(line, {
      x: getX(titleWidth), y,
      size: 36, font: boldFont, color: textColor
    })
    y -= 46
  })
  
  // Bullets/Key takeaways
  const bullets = slide.bullets || slide.takeaways || []
  y -= 25
  bullets.forEach(bullet => {
    if (y < 80) return
    page.drawCircle({ x: margin + 8, y: y + 5, size: 4, color: textColor })
    const lines = wrapText(bullet, regularFont, 20, width - margin * 2 - 30)
    lines.forEach((line, i) => {
      page.drawText(line, {
        x: margin + 25, y: y - (i * 26),
        size: 20, font: regularFont, color: textColor
      })
    })
    y -= (lines.length * 26) + 16
  })
  
  // CTA text at bottom
  if (slide.cta || slide.callToAction) {
    const ctaText = sanitizeText(slide.cta || slide.callToAction)
    const ctaWidth = boldFont.widthOfTextAtSize(ctaText, 22)
    page.drawText(ctaText, {
      x: getX(ctaWidth), y: 60,
      size: 22, font: boldFont, color: textColor
    })
  }
}

export async function POST(request) {
  try {
    const { 
      presentation,
      theme = 'modern-blue',
      aspectRatio = '16:9'
    } = await request.json()
    
    if (!presentation || !presentation.slides) {
      return NextResponse.json(
        { success: false, error: 'Presentation data is required' },
        { status: 400 }
      )
    }

    console.log(`Creating PDF with ${presentation.slides.length} slides`)

    // Page dimensions based on aspect ratio
    const dimensions = aspectRatio === '4:3' 
      ? { width: 800, height: 600 }
      : { width: 960, height: 540 } // 16:9

    const pdfDoc = await PDFDocument.create()
    const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica)
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
    const italicFont = await pdfDoc.embedFont(StandardFonts.HelveticaOblique)
    
    const fonts = { regularFont, boldFont, italicFont }

    // Generate each slide
    for (const slide of presentation.slides) {
      const page = pdfDoc.addPage([dimensions.width, dimensions.height])
      await drawSlide(page, slide, pdfDoc, fonts, dimensions)
    }

    // Save PDF
    const pdfBytes = await pdfDoc.save()
    
    // Save file
    const outputDir = '/app/public/presentations'
    await fs.mkdir(outputDir, { recursive: true })
    
    const fileName = `${randomUUID()}.pdf`
    const filePath = path.join(outputDir, fileName)
    await fs.writeFile(filePath, pdfBytes)

    // Save to library
    try {
      const libraryCollection = await getCollection('library')
      const documentId = randomUUID()
      
      await libraryCollection.insertOne({
        id: documentId,
        oduserId: 'default-user',
        type: 'document',
        category: 'presentation',
        title: presentation.title || 'Untitled Presentation',
        description: `${presentation.slides.length} slides`,
        filePath: `/presentations/${fileName}`,
        fileSize: pdfBytes.length,
        tool: 'slides-maker',
        metadata: {
          slideCount: presentation.slides.length,
          theme,
          aspectRatio
        },
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      })
    } catch (dbError) {
      console.error('Failed to save to library:', dbError)
    }

    console.log(`Presentation PDF generated: ${filePath}`)

    return NextResponse.json({
      success: true,
      downloadUrl: `/presentations/${fileName}`,
      pageCount: presentation.slides.length
    })

  } catch (error) {
    console.error('PDF generation error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to generate PDF' },
      { status: 500 }
    )
  }
}
