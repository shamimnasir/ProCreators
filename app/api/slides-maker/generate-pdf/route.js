import { NextResponse } from 'next/server'
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import { getCollection } from '@/lib/mongodb'
import { randomUUID } from 'crypto'
import fs from 'fs/promises'
import path from 'path'

// Slide design themes
const THEMES = {
  'modern-blue': {
    primary: rgb(0.1, 0.4, 0.8),
    secondary: rgb(0.2, 0.5, 0.9),
    accent: rgb(0.9, 0.95, 1),
    text: rgb(0.1, 0.1, 0.15),
    lightText: rgb(1, 1, 1),
    background: rgb(1, 1, 1),
    name: 'Modern Blue'
  },
  'corporate-dark': {
    primary: rgb(0.15, 0.15, 0.2),
    secondary: rgb(0.25, 0.25, 0.3),
    accent: rgb(0.95, 0.6, 0.1),
    text: rgb(1, 1, 1),
    lightText: rgb(1, 1, 1),
    background: rgb(0.12, 0.12, 0.15),
    name: 'Corporate Dark'
  },
  'fresh-green': {
    primary: rgb(0.1, 0.6, 0.4),
    secondary: rgb(0.15, 0.7, 0.5),
    accent: rgb(0.9, 1, 0.95),
    text: rgb(0.1, 0.15, 0.1),
    lightText: rgb(1, 1, 1),
    background: rgb(1, 1, 1),
    name: 'Fresh Green'
  },
  'elegant-purple': {
    primary: rgb(0.4, 0.2, 0.6),
    secondary: rgb(0.5, 0.3, 0.7),
    accent: rgb(0.95, 0.92, 1),
    text: rgb(0.15, 0.1, 0.2),
    lightText: rgb(1, 1, 1),
    background: rgb(1, 1, 1),
    name: 'Elegant Purple'
  },
  'warm-orange': {
    primary: rgb(0.9, 0.4, 0.1),
    secondary: rgb(0.95, 0.5, 0.2),
    accent: rgb(1, 0.97, 0.93),
    text: rgb(0.2, 0.15, 0.1),
    lightText: rgb(1, 1, 1),
    background: rgb(1, 1, 1),
    name: 'Warm Orange'
  },
  'minimal-gray': {
    primary: rgb(0.3, 0.3, 0.35),
    secondary: rgb(0.5, 0.5, 0.55),
    accent: rgb(0.96, 0.96, 0.97),
    text: rgb(0.15, 0.15, 0.15),
    lightText: rgb(1, 1, 1),
    background: rgb(1, 1, 1),
    name: 'Minimal Gray'
  }
}

// Helper function to sanitize text
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
    .replace(/[^\x20-\x7E]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
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

// Draw a single slide
function drawSlide(page, slide, theme, fonts, dimensions) {
  const { width, height } = dimensions
  const { boldFont, regularFont } = fonts
  const margin = 60
  const contentWidth = width - (margin * 2)
  
  // Background
  page.drawRectangle({
    x: 0, y: 0, width, height,
    color: theme.background
  })
  
  // Top accent bar
  page.drawRectangle({
    x: 0, y: height - 8, width, height: 8,
    color: theme.primary
  })
  
  // Slide number badge
  page.drawRectangle({
    x: width - 70, y: 20, width: 50, height: 25,
    color: theme.primary
  })
  page.drawText(String(slide.slideNumber || ''), {
    x: width - 52, y: 27,
    size: 14, font: boldFont, color: theme.lightText
  })
  
  const slideType = slide.type || 'content'
  
  switch (slideType) {
    case 'title':
      drawTitleSlide(page, slide, theme, fonts, dimensions)
      break
    case 'section':
      drawSectionSlide(page, slide, theme, fonts, dimensions)
      break
    case 'quote':
      drawQuoteSlide(page, slide, theme, fonts, dimensions)
      break
    case 'stats':
      drawStatsSlide(page, slide, theme, fonts, dimensions)
      break
    case 'two-column':
      drawTwoColumnSlide(page, slide, theme, fonts, dimensions)
      break
    case 'conclusion':
    case 'cta':
      drawConclusionSlide(page, slide, theme, fonts, dimensions)
      break
    default:
      drawContentSlide(page, slide, theme, fonts, dimensions)
  }
}

// Title slide
function drawTitleSlide(page, slide, theme, fonts, dimensions) {
  const { width, height } = dimensions
  const { boldFont, regularFont } = fonts
  
  // Large colored background section
  page.drawRectangle({
    x: 0, y: height * 0.3, width, height: height * 0.7,
    color: theme.primary
  })
  
  // Title
  const titleLines = wrapText(slide.title || '', boldFont, 48, width - 120)
  let y = height * 0.6 + (titleLines.length * 30)
  titleLines.forEach(line => {
    const titleWidth = boldFont.widthOfTextAtSize(line, 48)
    page.drawText(line, {
      x: (width - titleWidth) / 2, y,
      size: 48, font: boldFont, color: theme.lightText
    })
    y -= 58
  })
  
  // Subtitle
  if (slide.subtitle) {
    const subtitleLines = wrapText(slide.subtitle, regularFont, 24, width - 120)
    y -= 20
    subtitleLines.forEach(line => {
      const subWidth = regularFont.widthOfTextAtSize(line, 24)
      page.drawText(line, {
        x: (width - subWidth) / 2, y,
        size: 24, font: regularFont, color: rgb(1, 1, 1, 0.9)
      })
      y -= 32
    })
  }
}

// Section divider slide
function drawSectionSlide(page, slide, theme, fonts, dimensions) {
  const { width, height } = dimensions
  const { boldFont } = fonts
  
  // Colored background
  page.drawRectangle({
    x: 0, y: 0, width, height,
    color: theme.primary
  })
  
  // Section title
  const titleLines = wrapText(slide.title || '', boldFont, 44, width - 120)
  let y = height / 2 + (titleLines.length * 25)
  titleLines.forEach(line => {
    const titleWidth = boldFont.widthOfTextAtSize(line, 44)
    page.drawText(line, {
      x: (width - titleWidth) / 2, y,
      size: 44, font: boldFont, color: theme.lightText
    })
    y -= 54
  })
}

// Content slide with bullets
function drawContentSlide(page, slide, theme, fonts, dimensions) {
  const { width, height } = dimensions
  const { boldFont, regularFont } = fonts
  const margin = 60
  const contentWidth = width - (margin * 2)
  
  // Title
  const titleLines = wrapText(slide.title || '', boldFont, 36, contentWidth)
  let y = height - 80
  titleLines.forEach(line => {
    page.drawText(line, {
      x: margin, y, size: 36, font: boldFont, color: theme.primary
    })
    y -= 44
  })
  
  // Underline
  page.drawRectangle({
    x: margin, y: y + 10, width: 100, height: 4,
    color: theme.secondary
  })
  
  y -= 40
  
  // Bullets
  const bullets = slide.bullets || []
  bullets.forEach((bullet, idx) => {
    if (y < 80) return
    
    // Bullet point
    page.drawCircle({
      x: margin + 10, y: y + 6, size: 5,
      color: theme.primary
    })
    
    // Bullet text
    const bulletLines = wrapText(bullet, regularFont, 22, contentWidth - 40)
    bulletLines.forEach((line, lineIdx) => {
      page.drawText(line, {
        x: margin + 30, y: y - (lineIdx * 28),
        size: 22, font: regularFont, color: theme.text
      })
    })
    y -= (bulletLines.length * 28) + 20
  })
}

// Quote slide
function drawQuoteSlide(page, slide, theme, fonts, dimensions) {
  const { width, height } = dimensions
  const { boldFont, regularFont, italicFont } = fonts
  
  // Light accent background
  page.drawRectangle({
    x: 0, y: 0, width, height,
    color: theme.accent
  })
  
  // Large quote mark
  page.drawText('"', {
    x: 60, y: height - 150,
    size: 150, font: boldFont, color: theme.primary
  })
  
  // Quote text
  const quoteLines = wrapText(slide.quote || '', italicFont, 28, width - 160)
  let y = height - 200
  quoteLines.forEach(line => {
    page.drawText(line, {
      x: 80, y, size: 28, font: italicFont, color: theme.text
    })
    y -= 40
  })
  
  // Attribution
  if (slide.attribution) {
    y -= 30
    page.drawText(`- ${sanitizeText(slide.attribution)}`, {
      x: 80, y, size: 20, font: regularFont, color: theme.secondary
    })
  }
}

// Stats slide
function drawStatsSlide(page, slide, theme, fonts, dimensions) {
  const { width, height } = dimensions
  const { boldFont, regularFont } = fonts
  const margin = 60
  
  // Title
  const titleLines = wrapText(slide.title || 'Key Statistics', boldFont, 36, width - 120)
  let y = height - 80
  titleLines.forEach(line => {
    page.drawText(line, {
      x: margin, y, size: 36, font: boldFont, color: theme.primary
    })
    y -= 44
  })
  
  // Stats grid
  const stats = slide.stats || []
  const statWidth = (width - margin * 2 - 40) / Math.min(stats.length, 3)
  
  stats.slice(0, 3).forEach((stat, idx) => {
    const x = margin + (idx * (statWidth + 20))
    const boxY = height - 250
    
    // Stat box background
    page.drawRectangle({
      x, y: boxY, width: statWidth, height: 150,
      color: theme.accent
    })
    
    // Top accent
    page.drawRectangle({
      x, y: boxY + 146, width: statWidth, height: 4,
      color: theme.primary
    })
    
    // Value
    const value = sanitizeText(stat.value || '')
    const valueWidth = boldFont.widthOfTextAtSize(value, 42)
    page.drawText(value, {
      x: x + (statWidth - valueWidth) / 2, y: boxY + 90,
      size: 42, font: boldFont, color: theme.primary
    })
    
    // Label
    const labelLines = wrapText(stat.label || '', regularFont, 16, statWidth - 20)
    let labelY = boxY + 50
    labelLines.forEach(line => {
      const labelWidth = regularFont.widthOfTextAtSize(line, 16)
      page.drawText(line, {
        x: x + (statWidth - labelWidth) / 2, y: labelY,
        size: 16, font: regularFont, color: theme.text
      })
      labelY -= 22
    })
  })
}

// Two-column slide
function drawTwoColumnSlide(page, slide, theme, fonts, dimensions) {
  const { width, height } = dimensions
  const { boldFont, regularFont } = fonts
  const margin = 60
  const colWidth = (width - margin * 2 - 40) / 2
  
  // Title
  const titleLines = wrapText(slide.title || '', boldFont, 36, width - 120)
  let y = height - 80
  titleLines.forEach(line => {
    page.drawText(line, {
      x: margin, y, size: 36, font: boldFont, color: theme.primary
    })
    y -= 44
  })
  
  y -= 30
  const contentY = y
  
  // Left column
  const leftCol = slide.leftColumn || { heading: '', points: [] }
  let leftY = contentY
  
  // Left heading
  page.drawRectangle({
    x: margin, y: leftY - 5, width: colWidth, height: 40,
    color: theme.primary
  })
  page.drawText(sanitizeText(leftCol.heading || 'Left'), {
    x: margin + 15, y: leftY + 5,
    size: 20, font: boldFont, color: theme.lightText
  })
  leftY -= 55
  
  // Left points
  (leftCol.points || []).forEach(point => {
    page.drawCircle({ x: margin + 10, y: leftY + 6, size: 4, color: theme.secondary })
    const lines = wrapText(point, regularFont, 18, colWidth - 30)
    lines.forEach((line, i) => {
      page.drawText(line, {
        x: margin + 25, y: leftY - (i * 24),
        size: 18, font: regularFont, color: theme.text
      })
    })
    leftY -= (lines.length * 24) + 15
  })
  
  // Right column
  const rightCol = slide.rightColumn || { heading: '', points: [] }
  let rightY = contentY
  const rightX = margin + colWidth + 40
  
  // Right heading
  page.drawRectangle({
    x: rightX, y: rightY - 5, width: colWidth, height: 40,
    color: theme.secondary
  })
  page.drawText(sanitizeText(rightCol.heading || 'Right'), {
    x: rightX + 15, y: rightY + 5,
    size: 20, font: boldFont, color: theme.lightText
  })
  rightY -= 55
  
  // Right points
  (rightCol.points || []).forEach(point => {
    page.drawCircle({ x: rightX + 10, y: rightY + 6, size: 4, color: theme.primary })
    const lines = wrapText(point, regularFont, 18, colWidth - 30)
    lines.forEach((line, i) => {
      page.drawText(line, {
        x: rightX + 25, y: rightY - (i * 24),
        size: 18, font: regularFont, color: theme.text
      })
    })
    rightY -= (lines.length * 24) + 15
  })
}

// Conclusion/CTA slide
function drawConclusionSlide(page, slide, theme, fonts, dimensions) {
  const { width, height } = dimensions
  const { boldFont, regularFont } = fonts
  const margin = 60
  
  // Gradient-like effect with rectangles
  page.drawRectangle({
    x: 0, y: 0, width, height: height * 0.4,
    color: theme.primary
  })
  
  // Title
  const titleLines = wrapText(slide.title || 'Thank You', boldFont, 40, width - 120)
  let y = height - 100
  titleLines.forEach(line => {
    const titleWidth = boldFont.widthOfTextAtSize(line, 40)
    page.drawText(line, {
      x: (width - titleWidth) / 2, y,
      size: 40, font: boldFont, color: theme.primary
    })
    y -= 50
  })
  
  // Bullets/Key takeaways
  const bullets = slide.bullets || slide.takeaways || []
  y -= 30
  bullets.forEach(bullet => {
    if (y < height * 0.45) return
    page.drawCircle({ x: margin + 10, y: y + 6, size: 5, color: theme.secondary })
    const lines = wrapText(bullet, regularFont, 22, width - margin * 2 - 40)
    lines.forEach((line, i) => {
      page.drawText(line, {
        x: margin + 30, y: y - (i * 28),
        size: 22, font: regularFont, color: theme.text
      })
    })
    y -= (lines.length * 28) + 20
  })
  
  // CTA text at bottom
  if (slide.cta || slide.callToAction) {
    const ctaText = sanitizeText(slide.cta || slide.callToAction)
    const ctaWidth = boldFont.widthOfTextAtSize(ctaText, 24)
    page.drawText(ctaText, {
      x: (width - ctaWidth) / 2, y: height * 0.15,
      size: 24, font: boldFont, color: theme.lightText
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

    console.log(`Creating PDF with ${presentation.slides.length} slides, theme: ${theme}`)

    // Page dimensions based on aspect ratio
    const dimensions = aspectRatio === '4:3' 
      ? { width: 800, height: 600 }
      : { width: 960, height: 540 } // 16:9

    const pdfDoc = await PDFDocument.create()
    const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica)
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
    const italicFont = await pdfDoc.embedFont(StandardFonts.HelveticaOblique)
    
    const fonts = { regularFont, boldFont, italicFont }
    const selectedTheme = THEMES[theme] || THEMES['modern-blue']

    // Generate each slide
    for (const slide of presentation.slides) {
      const page = pdfDoc.addPage([dimensions.width, dimensions.height])
      drawSlide(page, slide, selectedTheme, fonts, dimensions)
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
    const libraryCollection = await getCollection('library')
    const documentId = randomUUID()
    
    await libraryCollection.insertOne({
      id: documentId,
      oduserId: 'default-user',
      type: 'document',
      category: 'presentation',
      title: presentation.title || 'Untitled Presentation',
      description: `${presentation.slides.length} slides - ${selectedTheme.name}`,
      filePath: `/presentations/${fileName}`,
      fileSize: pdfBytes.length,
      tool: 'slides-maker',
      metadata: {
        slideCount: presentation.slides.length,
        theme,
        aspectRatio,
        slides: presentation.slides.map(s => ({ number: s.slideNumber, title: s.title, type: s.type }))
      },
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    })

    console.log(`Presentation PDF generated: ${filePath}`)

    return NextResponse.json({
      success: true,
      downloadUrl: `/presentations/${fileName}`,
      pageCount: presentation.slides.length,
      libraryId: documentId
    })

  } catch (error) {
    console.error('PDF generation error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to generate PDF' },
      { status: 500 }
    )
  }
}
