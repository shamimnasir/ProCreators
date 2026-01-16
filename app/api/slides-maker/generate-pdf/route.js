import { NextResponse } from 'next/server'
import { PDFDocument, rgb } from 'pdf-lib'
import fontkit from '@pdf-lib/fontkit'
import { getCollection } from '@/lib/mongodb'
import { randomUUID } from 'crypto'
import fs from 'fs/promises'
import path from 'path'

// Helper function to check if text contains Bangla characters
function containsBangla(text) {
  if (!text) return false
  return /[\u0980-\u09FF]/.test(text)
}

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

// Wrap text helper - safe for custom fonts
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
      // Skip characters that can't be rendered
      if (currentLine) lines.push(currentLine)
      currentLine = ''
    }
  }
  if (currentLine) lines.push(currentLine)
  return lines
}

// Safe draw text - handles font errors gracefully
function safeDrawText(page, text, options) {
  try {
    const cleanText = sanitizeText(text)
    if (!cleanText) return
    page.drawText(cleanText, options)
  } catch (e) {
    // If Bangla font fails, try with fallback or skip
    console.warn('Text drawing error:', e.message)
  }
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
      const response = await fetch(imageUrl, { timeout: 10000 })
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
      try {
        const imageBytes = await fs.readFile(filePath)
        if (imageUrl.endsWith('.png')) {
          return await pdfDoc.embedPng(imageBytes)
        } else {
          return await pdfDoc.embedJpg(imageBytes)
        }
      } catch {
        return null
      }
    }
    
    return null
  } catch (error) {
    console.error('Error embedding image:', error)
    return null
  }
}

// Draw rounded rectangle (for infographic style)
function drawRoundedRect(page, x, y, width, height, color, opacity = 1) {
  // Draw main rectangle
  page.drawRectangle({
    x, y, width, height,
    color,
    opacity,
    borderRadius: 8
  })
}

// Draw numbered bullet (infographic style)
function drawNumberedBullet(page, x, y, number, fonts, textColor) {
  const { boldFont } = fonts
  
  // Draw circle background
  page.drawCircle({
    x: x + 12, y: y + 8,
    size: 14,
    color: rgb(1, 1, 1),
    opacity: 0.25
  })
  
  // Draw number
  const numStr = String(number)
  const numWidth = boldFont.widthOfTextAtSize(numStr, 12)
  safeDrawText(page, numStr, {
    x: x + 12 - numWidth/2,
    y: y + 3,
    size: 12,
    font: boldFont,
    color: textColor
  })
}

// Draw a single slide
async function drawSlide(page, slide, pdfDoc, fonts, dimensions, hasBangla) {
  const { width, height } = dimensions
  const { boldFont, regularFont, banglaFont, banglaBoldFont } = fonts
  const margin = 50
  const contentWidth = width - (margin * 2)
  
  // Choose fonts based on content
  const titleFont = hasBangla && banglaBoldFont ? banglaBoldFont : boldFont
  const bodyFont = hasBangla && banglaFont ? banglaFont : regularFont
  
  // Get slide colors from style
  const bgColor = slide.style?.backgroundColor ? hexToRgb(slide.style.backgroundColor) : rgb(0.1, 0.4, 0.8)
  const textColor = slide.style?.textColor ? hexToRgb(slide.style.textColor) : rgb(1, 1, 1)
  const textAlign = slide.style?.textAlign || 'center'
  
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
        
        // Add darker overlay for text readability
        page.drawRectangle({
          x: 0, y: 0, width, height,
          color: rgb(0, 0, 0),
          opacity: 0.45
        })
      }
    } catch (err) {
      console.error('Failed to embed background image:', err)
    }
  }
  
  // Slide number badge
  page.drawRectangle({
    x: width - 50, y: 15,
    width: 35, height: 22,
    color: rgb(1, 1, 1),
    opacity: 0.2
  })
  safeDrawText(page, String(slide.slideNumber || ''), {
    x: width - 38, y: 21,
    size: 12, font: regularFont, color: textColor
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
      await drawTitleSlide(page, slide, fonts, dimensions, textColor, getX, hasBangla)
      break
    case 'section':
      await drawSectionSlide(page, slide, fonts, dimensions, textColor, getX, hasBangla)
      break
    case 'quote':
      await drawQuoteSlide(page, slide, fonts, dimensions, textColor, getX, hasBangla)
      break
    case 'stats':
      await drawStatsSlide(page, slide, fonts, dimensions, textColor, bgColor, getX, hasBangla)
      break
    case 'two-column':
      await drawTwoColumnSlide(page, slide, fonts, dimensions, textColor, bgColor, hasBangla)
      break
    case 'conclusion':
    case 'cta':
      await drawConclusionSlide(page, slide, fonts, dimensions, textColor, bgColor, getX, hasBangla)
      break
    default:
      await drawContentSlide(page, slide, fonts, dimensions, textColor, getX, hasBangla)
  }
}

// Title slide - with author name support
function drawTitleSlide(page, slide, fonts, dimensions, textColor, getX, hasBangla) {
  const { width, height } = dimensions
  const { boldFont, regularFont, banglaFont, banglaBoldFont } = fonts
  
  const titleFont = hasBangla && banglaBoldFont ? banglaBoldFont : boldFont
  const bodyFont = hasBangla && banglaFont ? banglaFont : regularFont
  
  // Title
  const titleLines = wrapText(slide.title || '', titleFont, 44, width - 100)
  let y = height / 2 + (titleLines.length * 25) + 20
  titleLines.forEach(line => {
    try {
      const titleWidth = titleFont.widthOfTextAtSize(line, 44)
      safeDrawText(page, line, {
        x: getX(titleWidth), y,
        size: 44, font: titleFont, color: textColor
      })
    } catch (e) {
      // Fallback to regular font
      const titleWidth = boldFont.widthOfTextAtSize(line, 44)
      safeDrawText(page, line, {
        x: getX(titleWidth), y,
        size: 44, font: boldFont, color: textColor
      })
    }
    y -= 54
  })
  
  // Subtitle
  if (slide.subtitle) {
    const subtitleLines = wrapText(slide.subtitle, bodyFont, 22, width - 100)
    y -= 10
    subtitleLines.forEach(line => {
      try {
        const subWidth = bodyFont.widthOfTextAtSize(line, 22)
        safeDrawText(page, line, {
          x: getX(subWidth), y,
          size: 22, font: bodyFont, color: textColor, opacity: 0.85
        })
      } catch (e) {
        const subWidth = regularFont.widthOfTextAtSize(line, 22)
        safeDrawText(page, line, {
          x: getX(subWidth), y,
          size: 22, font: regularFont, color: textColor, opacity: 0.85
        })
      }
      y -= 30
    })
  }
  
  // Author name - NEW!
  if (slide.authorName) {
    y -= 20
    const authorText = `— ${sanitizeText(slide.authorName)}`
    try {
      const authorWidth = bodyFont.widthOfTextAtSize(authorText, 18)
      safeDrawText(page, authorText, {
        x: getX(authorWidth), y,
        size: 18, font: bodyFont, color: textColor, opacity: 0.8
      })
    } catch (e) {
      const authorWidth = regularFont.widthOfTextAtSize(authorText, 18)
      safeDrawText(page, authorText, {
        x: getX(authorWidth), y,
        size: 18, font: regularFont, color: textColor, opacity: 0.8
      })
    }
  }
}

// Section divider slide
function drawSectionSlide(page, slide, fonts, dimensions, textColor, getX, hasBangla) {
  const { width, height } = dimensions
  const { boldFont, banglaBoldFont } = fonts
  
  const titleFont = hasBangla && banglaBoldFont ? banglaBoldFont : boldFont
  
  const titleLines = wrapText(slide.title || '', titleFont, 40, width - 100)
  let y = height / 2 + (titleLines.length * 25)
  titleLines.forEach(line => {
    try {
      const titleWidth = titleFont.widthOfTextAtSize(line, 40)
      safeDrawText(page, line, {
        x: getX(titleWidth), y,
        size: 40, font: titleFont, color: textColor
      })
    } catch (e) {
      const titleWidth = boldFont.widthOfTextAtSize(line, 40)
      safeDrawText(page, line, {
        x: getX(titleWidth), y,
        size: 40, font: boldFont, color: textColor
      })
    }
    y -= 50
  })
}

// Content slide with INFOGRAPHIC-STYLE numbered bullets
function drawContentSlide(page, slide, fonts, dimensions, textColor, getX, hasBangla) {
  const { width, height } = dimensions
  const { boldFont, regularFont, banglaFont, banglaBoldFont } = fonts
  const margin = 40
  const contentWidth = width - (margin * 2)
  
  const titleFont = hasBangla && banglaBoldFont ? banglaBoldFont : boldFont
  const bodyFont = hasBangla && banglaFont ? banglaFont : regularFont
  
  // Draw content area background to cover any background image text
  page.drawRectangle({
    x: margin - 10,
    y: 40,
    width: contentWidth + 20,
    height: height - 80,
    color: rgb(0, 0, 0),
    opacity: 0.55
  })
  
  // Title
  const titleLines = wrapText(slide.title || '', titleFont, 28, contentWidth)
  let y = height - 60
  titleLines.forEach(line => {
    try {
      safeDrawText(page, line, {
        x: margin, y, size: 28, font: titleFont, color: textColor
      })
    } catch (e) {
      safeDrawText(page, line, {
        x: margin, y, size: 28, font: boldFont, color: textColor
      })
    }
    y -= 36
  })
  
  y -= 20
  
  // Bullets - INFOGRAPHIC STYLE with numbered cards
  const bullets = slide.bullets || []
  const bulletHeight = 42
  
  bullets.forEach((bullet, idx) => {
    if (y < 65) return
    
    // Draw bullet card background
    page.drawRectangle({
      x: margin,
      y: y - 6,
      width: contentWidth,
      height: bulletHeight,
      color: rgb(1, 1, 1),
      opacity: 0.18
    })
    
    // Draw number circle
    page.drawCircle({
      x: margin + 22,
      y: y + 14,
      size: 15,
      color: rgb(1, 1, 1),
      opacity: 0.35
    })
    
    // Draw number
    const numStr = String(idx + 1)
    safeDrawText(page, numStr, {
      x: margin + 18 - (numStr.length > 1 ? 3 : 0),
      y: y + 8,
      size: 13,
      font: boldFont,
      color: textColor
    })
    
    // Bullet text
    const bulletLines = wrapText(bullet, bodyFont, 16, contentWidth - 60)
    let bulletY = y + 15
    bulletLines.forEach((line, lineIdx) => {
      try {
        safeDrawText(page, line, {
          x: margin + 48,
          y: bulletY - (lineIdx * 18),
          size: 16,
          font: bodyFont,
          color: textColor
        })
      } catch (e) {
        safeDrawText(page, line, {
          x: margin + 48,
          y: bulletY - (lineIdx * 18),
          size: 16,
          font: regularFont,
          color: textColor
        })
      }
    })
    
    y -= bulletHeight + 6
  })
}

// Quote slide
function drawQuoteSlide(page, slide, fonts, dimensions, textColor, getX, hasBangla) {
  const { width, height } = dimensions
  const { boldFont, regularFont, banglaFont, banglaBoldFont } = fonts
  
  const bodyFont = hasBangla && banglaFont ? banglaFont : regularFont
  
  // Large quote mark
  safeDrawText(page, '"', {
    x: 50, y: height - 120,
    size: 100, font: boldFont, color: textColor, opacity: 0.25
  })
  
  // Quote text
  const quoteLines = wrapText(slide.quote || '', bodyFont, 24, width - 140)
  let y = height - 170
  quoteLines.forEach(line => {
    try {
      safeDrawText(page, line, {
        x: 70, y, size: 24, font: bodyFont, color: textColor
      })
    } catch (e) {
      safeDrawText(page, line, {
        x: 70, y, size: 24, font: regularFont, color: textColor
      })
    }
    y -= 34
  })
  
  // Attribution
  if (slide.attribution) {
    y -= 20
    safeDrawText(page, `— ${sanitizeText(slide.attribution)}`, {
      x: 70, y, size: 16, font: regularFont, color: textColor, opacity: 0.8
    })
  }
}

// Stats slide - INFOGRAPHIC STYLE
function drawStatsSlide(page, slide, fonts, dimensions, textColor, bgColor, getX, hasBangla) {
  const { width, height } = dimensions
  const { boldFont, regularFont, banglaFont, banglaBoldFont } = fonts
  const margin = 50
  
  const titleFont = hasBangla && banglaBoldFont ? banglaBoldFont : boldFont
  const bodyFont = hasBangla && banglaFont ? banglaFont : regularFont
  
  // Title
  const titleLines = wrapText(slide.title || 'Key Statistics', titleFont, 30, width - 100)
  let y = height - 65
  titleLines.forEach(line => {
    try {
      safeDrawText(page, line, {
        x: margin, y, size: 30, font: titleFont, color: textColor
      })
    } catch (e) {
      safeDrawText(page, line, {
        x: margin, y, size: 30, font: boldFont, color: textColor
      })
    }
    y -= 38
  })
  
  // Stats grid - LARGE CARDS
  const stats = slide.stats || []
  const statCount = Math.min(stats.length, 3)
  const statWidth = (width - margin * 2 - 30) / statCount
  const statHeight = 130
  
  stats.slice(0, 3).forEach((stat, idx) => {
    const x = margin + (idx * (statWidth + 15))
    const boxY = height - 240
    
    // Stat card background
    page.drawRectangle({
      x, y: boxY, width: statWidth, height: statHeight,
      color: rgb(1, 1, 1), opacity: 0.2
    })
    
    // Value - LARGE
    const value = sanitizeText(stat.value || '')
    const valueWidth = boldFont.widthOfTextAtSize(value, 42)
    safeDrawText(page, value, {
      x: x + (statWidth - valueWidth) / 2, y: boxY + 75,
      size: 42, font: boldFont, color: textColor
    })
    
    // Label
    const labelLines = wrapText(stat.label || '', bodyFont, 13, statWidth - 16)
    let labelY = boxY + 35
    labelLines.forEach(line => {
      try {
        const labelWidth = bodyFont.widthOfTextAtSize(line, 13)
        safeDrawText(page, line, {
          x: x + (statWidth - labelWidth) / 2, y: labelY,
          size: 13, font: bodyFont, color: textColor, opacity: 0.9
        })
      } catch (e) {
        const labelWidth = regularFont.widthOfTextAtSize(line, 13)
        safeDrawText(page, line, {
          x: x + (statWidth - labelWidth) / 2, y: labelY,
          size: 13, font: regularFont, color: textColor, opacity: 0.9
        })
      }
      labelY -= 18
    })
  })
}

// Two-column slide - INFOGRAPHIC STYLE
function drawTwoColumnSlide(page, slide, fonts, dimensions, textColor, bgColor, hasBangla) {
  const { width, height } = dimensions
  const { boldFont, regularFont, banglaFont, banglaBoldFont } = fonts
  const margin = 50
  const colWidth = (width - margin * 2 - 30) / 2
  
  const titleFont = hasBangla && banglaBoldFont ? banglaBoldFont : boldFont
  const bodyFont = hasBangla && banglaFont ? banglaFont : regularFont
  
  // Title
  const titleLines = wrapText(slide.title || '', titleFont, 28, width - 100)
  let y = height - 60
  titleLines.forEach(line => {
    try {
      safeDrawText(page, line, {
        x: margin, y, size: 28, font: titleFont, color: textColor
      })
    } catch (e) {
      safeDrawText(page, line, {
        x: margin, y, size: 28, font: boldFont, color: textColor
      })
    }
    y -= 36
  })
  
  y -= 20
  const contentY = y
  
  // Left column card
  const leftCol = slide.leftColumn || { heading: '', points: [] }
  let leftY = contentY
  
  // Left column background
  page.drawRectangle({
    x: margin, y: leftY - 180, width: colWidth, height: 185,
    color: rgb(1, 1, 1), opacity: 0.12
  })
  
  // Left heading
  page.drawRectangle({
    x: margin, y: leftY - 5, width: colWidth, height: 32,
    color: rgb(1, 1, 1), opacity: 0.25
  })
  try {
    safeDrawText(page, sanitizeText(leftCol.heading || 'Left'), {
      x: margin + 12, y: leftY + 3,
      size: 16, font: titleFont, color: textColor
    })
  } catch (e) {
    safeDrawText(page, sanitizeText(leftCol.heading || 'Left'), {
      x: margin + 12, y: leftY + 3,
      size: 16, font: boldFont, color: textColor
    })
  }
  leftY -= 45
  
  // Left points with numbers
  const leftPoints = leftCol.points || []
  leftPoints.forEach((point, idx) => {
    if (leftY < 80) return
    
    // Number
    safeDrawText(page, `${idx + 1}.`, {
      x: margin + 10, y: leftY + 3, size: 13, font: boldFont, color: textColor
    })
    
    const lines = wrapText(point, bodyFont, 13, colWidth - 35)
    lines.forEach((line, i) => {
      try {
        safeDrawText(page, line, {
          x: margin + 28, y: leftY - (i * 18),
          size: 13, font: bodyFont, color: textColor
        })
      } catch (e) {
        safeDrawText(page, line, {
          x: margin + 28, y: leftY - (i * 18),
          size: 13, font: regularFont, color: textColor
        })
      }
    })
    leftY -= (lines.length * 18) + 12
  })
  
  // Right column card
  const rightCol = slide.rightColumn || { heading: '', points: [] }
  let rightY = contentY
  const rightX = margin + colWidth + 30
  
  // Right column background
  page.drawRectangle({
    x: rightX, y: rightY - 180, width: colWidth, height: 185,
    color: rgb(1, 1, 1), opacity: 0.12
  })
  
  // Right heading
  page.drawRectangle({
    x: rightX, y: rightY - 5, width: colWidth, height: 32,
    color: rgb(1, 1, 1), opacity: 0.25
  })
  try {
    safeDrawText(page, sanitizeText(rightCol.heading || 'Right'), {
      x: rightX + 12, y: rightY + 3,
      size: 16, font: titleFont, color: textColor
    })
  } catch (e) {
    safeDrawText(page, sanitizeText(rightCol.heading || 'Right'), {
      x: rightX + 12, y: rightY + 3,
      size: 16, font: boldFont, color: textColor
    })
  }
  rightY -= 45
  
  // Right points with numbers
  const rightPoints = rightCol.points || []
  rightPoints.forEach((point, idx) => {
    if (rightY < 80) return
    
    // Number
    safeDrawText(page, `${idx + 1}.`, {
      x: rightX + 10, y: rightY + 3, size: 13, font: boldFont, color: textColor
    })
    
    const lines = wrapText(point, bodyFont, 13, colWidth - 35)
    lines.forEach((line, i) => {
      try {
        safeDrawText(page, line, {
          x: rightX + 28, y: rightY - (i * 18),
          size: 13, font: bodyFont, color: textColor
        })
      } catch (e) {
        safeDrawText(page, line, {
          x: rightX + 28, y: rightY - (i * 18),
          size: 13, font: regularFont, color: textColor
        })
      }
    })
    rightY -= (lines.length * 18) + 12
  })
}

// Conclusion/CTA slide
function drawConclusionSlide(page, slide, fonts, dimensions, textColor, bgColor, getX, hasBangla) {
  const { width, height } = dimensions
  const { boldFont, regularFont, banglaFont, banglaBoldFont } = fonts
  const margin = 50
  
  const titleFont = hasBangla && banglaBoldFont ? banglaBoldFont : boldFont
  const bodyFont = hasBangla && banglaFont ? banglaFont : regularFont
  
  // Title
  const titleLines = wrapText(slide.title || 'Thank You', titleFont, 34, width - 100)
  let y = height - 80
  titleLines.forEach(line => {
    try {
      const titleWidth = titleFont.widthOfTextAtSize(line, 34)
      safeDrawText(page, line, {
        x: getX(titleWidth), y,
        size: 34, font: titleFont, color: textColor
      })
    } catch (e) {
      const titleWidth = boldFont.widthOfTextAtSize(line, 34)
      safeDrawText(page, line, {
        x: getX(titleWidth), y,
        size: 34, font: boldFont, color: textColor
      })
    }
    y -= 44
  })
  
  // Bullets/Key takeaways with numbered cards
  const bullets = slide.bullets || slide.takeaways || []
  y -= 20
  
  bullets.forEach((bullet, idx) => {
    if (y < 90) return
    
    // Card background
    page.drawRectangle({
      x: margin, y: y - 8, width: width - margin * 2, height: 40,
      color: rgb(1, 1, 1), opacity: 0.15
    })
    
    // Number
    safeDrawText(page, `${idx + 1}.`, {
      x: margin + 15, y: y + 8, size: 16, font: boldFont, color: textColor
    })
    
    const lines = wrapText(bullet, bodyFont, 16, width - margin * 2 - 50)
    lines.forEach((line, i) => {
      try {
        safeDrawText(page, line, {
          x: margin + 40, y: y + 8 - (i * 20),
          size: 16, font: bodyFont, color: textColor
        })
      } catch (e) {
        safeDrawText(page, line, {
          x: margin + 40, y: y + 8 - (i * 20),
          size: 16, font: regularFont, color: textColor
        })
      }
    })
    y -= 50
  })
  
  // CTA text at bottom
  if (slide.cta || slide.callToAction) {
    const ctaText = sanitizeText(slide.cta || slide.callToAction)
    const ctaWidth = boldFont.widthOfTextAtSize(ctaText, 20)
    safeDrawText(page, ctaText, {
      x: getX(ctaWidth), y: 55,
      size: 20, font: boldFont, color: textColor
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

    // Check if presentation contains Bangla text
    const presentationText = JSON.stringify(presentation)
    const hasBangla = containsBangla(presentationText)
    console.log(`Presentation contains Bangla: ${hasBangla}`)

    // Page dimensions based on aspect ratio
    const dimensions = aspectRatio === '4:3' 
      ? { width: 800, height: 600 }
      : { width: 960, height: 540 } // 16:9

    const pdfDoc = await PDFDocument.create()
    
    // Register fontkit for custom fonts
    pdfDoc.registerFontkit(fontkit)
    
    // Load fonts
    let regularFont, boldFont, banglaFont, banglaBoldFont
    
    try {
      // Load standard fonts as fallback
      const notoRegularBytes = await fs.readFile('/app/public/fonts/NotoSans-Regular.ttf')
      const notoBoldBytes = await fs.readFile('/app/public/fonts/NotoSans-Bold.ttf')
      regularFont = await pdfDoc.embedFont(notoRegularBytes)
      boldFont = await pdfDoc.embedFont(notoBoldBytes)
      
      // Load Bangla fonts if needed
      if (hasBangla) {
        try {
          const banglaRegularBytes = await fs.readFile('/app/public/fonts/NotoSansBengali-Regular.ttf')
          const banglaBoldBytes = await fs.readFile('/app/public/fonts/NotoSansBengali-Bold.ttf')
          banglaFont = await pdfDoc.embedFont(banglaRegularBytes)
          banglaBoldFont = await pdfDoc.embedFont(banglaBoldBytes)
          console.log('Bangla fonts loaded successfully')
        } catch (banglaErr) {
          console.warn('Could not load Bangla fonts:', banglaErr.message)
        }
      }
    } catch (fontErr) {
      console.warn('Could not load custom fonts, using standard fonts:', fontErr.message)
      const { StandardFonts } = await import('pdf-lib')
      regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica)
      boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
    }
    
    const fonts = { regularFont, boldFont, banglaFont, banglaBoldFont }

    // Generate each slide
    for (const slide of presentation.slides) {
      const page = pdfDoc.addPage([dimensions.width, dimensions.height])
      await drawSlide(page, slide, pdfDoc, fonts, dimensions, hasBangla)
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
          aspectRatio,
          hasBangla
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
