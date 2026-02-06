import { NextResponse } from 'next/server'
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'
import fs from 'fs/promises'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'
import { getCollection } from '@/lib/mongodb'
import { enforceRateLimit } from '@/lib/rate-limiter'

// KDP Sizes in points (72 points = 1 inch)
const KDP_SIZES = {
  '6x9': { width: 432, height: 648, cardsPerPage: 4, cardWidth: 180, cardHeight: 270 },
  '8.5x11': { width: 612, height: 792, cardsPerPage: 4, cardWidth: 270, cardHeight: 360 },
  '5x8': { width: 360, height: 576, cardsPerPage: 2, cardWidth: 160, cardHeight: 240 }
}

// Helper to convert hex to RGB
function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result ? {
    r: parseInt(result[1], 16) / 255,
    g: parseInt(result[2], 16) / 255,
    b: parseInt(result[3], 16) / 255
  } : { r: 0, g: 0, b: 0 }
}

// Helper to wrap text
function wrapText(text, maxWidth, font, fontSize) {
  const words = text.split(' ')
  const lines = []
  let currentLine = ''
  
  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word
    const width = font.widthOfTextAtSize(testLine, fontSize)
    
    if (width <= maxWidth) {
      currentLine = testLine
    } else {
      if (currentLine) lines.push(currentLine)
      currentLine = word
    }
  }
  if (currentLine) lines.push(currentLine)
  
  return lines
}

// Strip emojis for PDF
function stripEmojis(text) {
  if (!text) return ''
  return String(text)
    .replace(/[\u{1F600}-\u{1F64F}]/gu, '')
    .replace(/[\u{1F300}-\u{1F5FF}]/gu, '')
    .replace(/[\u{1F680}-\u{1F6FF}]/gu, '')
    .replace(/[\u{1F1E0}-\u{1F1FF}]/gu, '')
    .replace(/[\u{2600}-\u{26FF}]/gu, '')
    .replace(/[\u{2700}-\u{27BF}]/gu, '')
    .replace(/[\u{FE00}-\u{FE0F}]/gu, '')
    .replace(/[\u{1F900}-\u{1F9FF}]/gu, '')
    .replace(/[^\x00-\x7F]/g, '')
    .trim()
}

// Draw background pattern on card
function drawBackgroundPattern(page, x, y, cardWidth, cardHeight, design, baseColor, textColor) {
  const patternColor = rgb(textColor.r, textColor.g, textColor.b, 0.08)
  const spacing = 30
  
  switch (design) {
    case 'dots':
      for (let px = x + 15; px < x + cardWidth - 10; px += spacing) {
        for (let py = y + 15; py < y + cardHeight - 10; py += spacing) {
          page.drawCircle({ x: px, y: py, size: 2, color: patternColor })
        }
      }
      break
      
    case 'lines':
      for (let py = y + 20; py < y + cardHeight - 10; py += 20) {
        page.drawLine({
          start: { x: x + 10, y: py },
          end: { x: x + cardWidth - 10, y: py },
          thickness: 0.5,
          color: patternColor
        })
      }
      break
      
    case 'grid':
      for (let px = x + 20; px < x + cardWidth - 10; px += spacing) {
        page.drawLine({
          start: { x: px, y: y + 10 },
          end: { x: px, y: y + cardHeight - 10 },
          thickness: 0.3,
          color: patternColor
        })
      }
      for (let py = y + 20; py < y + cardHeight - 10; py += spacing) {
        page.drawLine({
          start: { x: x + 10, y: py },
          end: { x: x + cardWidth - 10, y: py },
          thickness: 0.3,
          color: patternColor
        })
      }
      break
      
    case 'stars':
      // Draw small star shapes
      for (let px = x + 25; px < x + cardWidth - 20; px += 45) {
        for (let py = y + 25; py < y + cardHeight - 20; py += 45) {
          // Simple 4-point star using lines
          const starSize = 6
          page.drawLine({ start: { x: px - starSize, y: py }, end: { x: px + starSize, y: py }, thickness: 1, color: patternColor })
          page.drawLine({ start: { x: px, y: py - starSize }, end: { x: px, y: py + starSize }, thickness: 1, color: patternColor })
          page.drawLine({ start: { x: px - starSize/1.4, y: py - starSize/1.4 }, end: { x: px + starSize/1.4, y: py + starSize/1.4 }, thickness: 0.7, color: patternColor })
          page.drawLine({ start: { x: px + starSize/1.4, y: py - starSize/1.4 }, end: { x: px - starSize/1.4, y: py + starSize/1.4 }, thickness: 0.7, color: patternColor })
        }
      }
      break
      
    case 'hearts':
      // Draw heart shapes using circles and triangles approximation
      for (let px = x + 30; px < x + cardWidth - 25; px += 50) {
        for (let py = y + 30; py < y + cardHeight - 25; py += 50) {
          // Simplified heart using two circles
          page.drawCircle({ x: px - 3, y: py + 2, size: 4, color: patternColor })
          page.drawCircle({ x: px + 3, y: py + 2, size: 4, color: patternColor })
          // Triangle bottom part
          page.drawLine({ start: { x: px - 6, y: py }, end: { x: px, y: py - 8 }, thickness: 1, color: patternColor })
          page.drawLine({ start: { x: px + 6, y: py }, end: { x: px, y: py - 8 }, thickness: 1, color: patternColor })
        }
      }
      break
      
    case 'nature':
      // Draw simple leaf shapes
      for (let px = x + 35; px < x + cardWidth - 30; px += 60) {
        for (let py = y + 35; py < y + cardHeight - 30; py += 55) {
          // Leaf outline using ellipse approximation with lines
          page.drawEllipse({ x: px, y: py, xScale: 8, yScale: 12, color: patternColor })
          page.drawLine({ start: { x: px, y: py - 12 }, end: { x: px, y: py + 12 }, thickness: 0.5, color: patternColor })
        }
      }
      break
      
    case 'science':
      // Draw atom-like shapes
      for (let px = x + 40; px < x + cardWidth - 35; px += 70) {
        for (let py = y + 40; py < y + cardHeight - 35; py += 60) {
          // Center circle (nucleus)
          page.drawCircle({ x: px, y: py, size: 3, color: patternColor })
          // Orbit ellipses
          page.drawEllipse({ x: px, y: py, xScale: 12, yScale: 6, borderColor: patternColor, borderWidth: 0.5 })
          page.drawEllipse({ x: px, y: py, xScale: 6, yScale: 12, borderColor: patternColor, borderWidth: 0.5 })
        }
      }
      break
      
    case 'math':
      // Draw math symbols (+, -, x, =)
      const symbols = ['+', '-', 'x', '=']
      let symbolIdx = 0
      for (let px = x + 30; px < x + cardWidth - 25; px += 50) {
        for (let py = y + 30; py < y + cardHeight - 25; py += 45) {
          const sym = symbols[symbolIdx % symbols.length]
          const symSize = 6
          if (sym === '+') {
            page.drawLine({ start: { x: px - symSize, y: py }, end: { x: px + symSize, y: py }, thickness: 1.5, color: patternColor })
            page.drawLine({ start: { x: px, y: py - symSize }, end: { x: px, y: py + symSize }, thickness: 1.5, color: patternColor })
          } else if (sym === '-') {
            page.drawLine({ start: { x: px - symSize, y: py }, end: { x: px + symSize, y: py }, thickness: 1.5, color: patternColor })
          } else if (sym === 'x') {
            page.drawLine({ start: { x: px - symSize, y: py - symSize }, end: { x: px + symSize, y: py + symSize }, thickness: 1.2, color: patternColor })
            page.drawLine({ start: { x: px + symSize, y: py - symSize }, end: { x: px - symSize, y: py + symSize }, thickness: 1.2, color: patternColor })
          } else if (sym === '=') {
            page.drawLine({ start: { x: px - symSize, y: py + 2 }, end: { x: px + symSize, y: py + 2 }, thickness: 1.2, color: patternColor })
            page.drawLine({ start: { x: px - symSize, y: py - 2 }, end: { x: px + symSize, y: py - 2 }, thickness: 1.2, color: patternColor })
          }
          symbolIdx++
        }
      }
      break
      
    case 'gradient':
      // Draw gradient effect using multiple rectangles with decreasing opacity
      const steps = 5
      const stepHeight = cardHeight / steps
      for (let i = 0; i < steps; i++) {
        const opacity = 0.15 - (i * 0.025)
        if (opacity > 0) {
          page.drawRectangle({
            x: x,
            y: y + (i * stepHeight),
            width: cardWidth,
            height: stepHeight,
            color: rgb(textColor.r, textColor.g, textColor.b, opacity)
          })
        }
      }
      break
      
    // 'solid' and default - no pattern
    default:
      break
  }
}

export async function POST(request) {
  try {
    // SECURITY: Rate limiting for content generation
    const rateLimitCheck = await enforceRateLimit(request, 'content_generate')
    if (rateLimitCheck.limited) {
      return rateLimitCheck.response
    }

    const body = await request.json()
    const {
      title,
      description,
      category,
      flashcards,
      kdpSize,
      paperOption,
      colorTheme,
      backgroundDesign = 'solid',
      includeInstructions,
      includeCutGuides
    } = body
    
    const sizeConfig = KDP_SIZES[kdpSize] || KDP_SIZES['6x9']
    const { width, height, cardsPerPage, cardWidth, cardHeight } = sizeConfig
    
    // Get colors - now with separate text colors for front and back
    const frontColor = hexToRgb(colorTheme?.front || '#1e40af')
    const backColor = hexToRgb(colorTheme?.back || '#3b82f6')
    const textColorFront = hexToRgb(colorTheme?.textFront || colorTheme?.text || '#ffffff')
    const textColorBack = hexToRgb(colorTheme?.textBack || colorTheme?.text || '#ffffff')
    
    const pdfDoc = await PDFDocument.create()
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
    
    // ============ PAGE 1: Title Page ============
    let page = pdfDoc.addPage([width, height])
    
    // Background
    page.drawRectangle({
      x: 0, y: 0, width, height,
      color: rgb(frontColor.r, frontColor.g, frontColor.b)
    })
    
    // Title
    const cleanTitle = stripEmojis(title || 'Flashcard Pack')
    const titleSize = Math.min(36, 350 / (cleanTitle.length * 0.5))
    const titleWidth = fontBold.widthOfTextAtSize(cleanTitle, titleSize)
    page.drawText(cleanTitle, {
      x: (width - titleWidth) / 2,
      y: height / 2 + 50,
      size: titleSize,
      font: fontBold,
      color: rgb(textColorFront.r, textColorFront.g, textColorFront.b)
    })
    
    // Subtitle
    const cardCountText = `${flashcards.length} Flashcards`
    const subtitleWidth = font.widthOfTextAtSize(cardCountText, 18)
    page.drawText(cardCountText, {
      x: (width - subtitleWidth) / 2,
      y: height / 2,
      size: 18,
      font: font,
      color: rgb(textColorFront.r, textColorFront.g, textColorFront.b, 0.9)
    })
    
    // Description
    if (description) {
      const cleanDesc = stripEmojis(description)
      const descLines = wrapText(cleanDesc, width - 100, font, 12)
      descLines.slice(0, 2).forEach((line, i) => {
        const lineWidth = font.widthOfTextAtSize(line, 12)
        page.drawText(line, {
          x: (width - lineWidth) / 2,
          y: height / 2 - 40 - (i * 18),
          size: 12,
          font: font,
          color: rgb(textColorFront.r, textColorFront.g, textColorFront.b, 0.8)
        })
      })
    }
    
    // KDP compliant notice
    page.drawText('KDP-Ready Flashcard Book', {
      x: 50,
      y: 50,
      size: 10,
      font: font,
      color: rgb(textColorFront.r, textColorFront.g, textColorFront.b, 0.6)
    })
    
    // ============ PAGE 2: Instructions Page ============
    if (includeInstructions) {
      page = pdfDoc.addPage([width, height])
      
      // Header
      page.drawRectangle({
        x: 0, y: height - 80, width, height: 80,
        color: rgb(frontColor.r, frontColor.g, frontColor.b)
      })
      
      page.drawText('How to Use This Book', {
        x: 50, y: height - 50,
        size: 24,
        font: fontBold,
        color: rgb(textColorFront.r, textColorFront.g, textColorFront.b)
      })
      
      // Instructions
      const instructions = [
        '1. Cut along the dotted lines to separate each flashcard.',
        '2. Each card has a question/term on the FRONT and answer on the BACK.',
        '3. For best results, use scissors or a paper cutter.',
        '4. Optional: Laminate cards for durability.',
        '5. Store cards in a box or use a ring to keep them together.',
        '',
        'Study Tips:',
        '* Review cards daily for best retention',
        '* Shuffle cards to avoid memorizing order',
        '* Create piles: "Know", "Learning", "Review"',
        '* Test yourself or study with a partner',
        '',
        `This book contains ${flashcards.length} flashcards designed for effective learning.`
      ]
      
      let yPos = height - 120
      instructions.forEach(line => {
        page.drawText(stripEmojis(line), {
          x: 50, y: yPos,
          size: 12,
          font: line.startsWith('Study Tips') ? fontBold : font,
          color: rgb(0.2, 0.2, 0.2)
        })
        yPos -= 22
      })
    }
    
    // ============ FLASHCARD PAGES ============
    // Cards are laid out in a grid - front pages, then back pages
    const margin = 36 // 0.5 inch margin
    const gutterX = 18
    const gutterY = 18
    
    // Calculate card positions based on size
    let cols, rows
    if (cardsPerPage === 4) {
      cols = 2
      rows = 2
    } else {
      cols = 1
      rows = 2
    }
    
    const actualCardWidth = (width - 2 * margin - (cols - 1) * gutterX) / cols
    const actualCardHeight = (height - 2 * margin - (rows - 1) * gutterY) / rows
    
    // Group cards into pages
    const cardsPerSheetSide = cols * rows
    const totalSheets = Math.ceil(flashcards.length / cardsPerSheetSide)
    
    for (let sheet = 0; sheet < totalSheets; sheet++) {
      const startIdx = sheet * cardsPerSheetSide
      const sheetCards = flashcards.slice(startIdx, startIdx + cardsPerSheetSide)
      
      // ============ FRONT PAGE ============
      page = pdfDoc.addPage([width, height])
      
      // Page background
      page.drawRectangle({
        x: 0, y: 0, width, height,
        color: rgb(0.98, 0.98, 0.98)
      })
      
      // Draw each card front
      sheetCards.forEach((card, idx) => {
        const col = idx % cols
        const row = Math.floor(idx / cols)
        
        const x = margin + col * (actualCardWidth + gutterX)
        const y = height - margin - (row + 1) * actualCardHeight - row * gutterY
        
        // Card background
        page.drawRectangle({
          x, y,
          width: actualCardWidth,
          height: actualCardHeight,
          color: rgb(frontColor.r, frontColor.g, frontColor.b),
          borderColor: rgb(0.3, 0.3, 0.3),
          borderWidth: 0.5
        })
        
        // Draw background pattern
        drawBackgroundPattern(page, x, y, actualCardWidth, actualCardHeight, backgroundDesign, frontColor, textColorFront)
        
        // "FRONT" label
        page.drawText('FRONT', {
          x: x + 10, y: y + actualCardHeight - 20,
          size: 8,
          font: font,
          color: rgb(textColorFront.r, textColorFront.g, textColorFront.b, 0.5)
        })
        
        // Card content
        const frontText = stripEmojis(card.front || '')
        const fontSize = frontText.length > 100 ? 10 : frontText.length > 50 ? 12 : 14
        const lines = wrapText(frontText, actualCardWidth - 30, font, fontSize)
        const lineHeight = fontSize + 4
        const totalTextHeight = lines.length * lineHeight
        const startY = y + (actualCardHeight + totalTextHeight) / 2 - lineHeight
        
        lines.forEach((line, lineIdx) => {
          const lineWidth = fontBold.widthOfTextAtSize(line, fontSize)
          page.drawText(line, {
            x: x + (actualCardWidth - lineWidth) / 2,
            y: startY - lineIdx * lineHeight,
            size: fontSize,
            font: fontBold,
            color: rgb(textColorFront.r, textColorFront.g, textColorFront.b)
          })
        })
        
        // Cut guides (dotted lines)
        if (includeCutGuides) {
          // Draw dotted border
          const dashLength = 4
          const gapLength = 4
          
          // Top line
          for (let dx = 0; dx < actualCardWidth; dx += dashLength + gapLength) {
            page.drawLine({
              start: { x: x + dx, y: y + actualCardHeight },
              end: { x: Math.min(x + dx + dashLength, x + actualCardWidth), y: y + actualCardHeight },
              thickness: 0.5,
              color: rgb(0.5, 0.5, 0.5)
            })
          }
          // Bottom line
          for (let dx = 0; dx < actualCardWidth; dx += dashLength + gapLength) {
            page.drawLine({
              start: { x: x + dx, y: y },
              end: { x: Math.min(x + dx + dashLength, x + actualCardWidth), y: y },
              thickness: 0.5,
              color: rgb(0.5, 0.5, 0.5)
            })
          }
          // Left line
          for (let dy = 0; dy < actualCardHeight; dy += dashLength + gapLength) {
            page.drawLine({
              start: { x: x, y: y + dy },
              end: { x: x, y: Math.min(y + dy + dashLength, y + actualCardHeight) },
              thickness: 0.5,
              color: rgb(0.5, 0.5, 0.5)
            })
          }
          // Right line
          for (let dy = 0; dy < actualCardHeight; dy += dashLength + gapLength) {
            page.drawLine({
              start: { x: x + actualCardWidth, y: y + dy },
              end: { x: x + actualCardWidth, y: Math.min(y + dy + dashLength, y + actualCardHeight) },
              thickness: 0.5,
              color: rgb(0.5, 0.5, 0.5)
            })
          }
        }
        
        // Scissors icon hint
        if (includeCutGuides && idx === 0) {
          page.drawText('[ cut here ]', {
            x: x - 5, y: y + actualCardHeight + 5,
            size: 6,
            font: font,
            color: rgb(0.5, 0.5, 0.5)
          })
        }
      })
      
      // Page number
      const frontPageNum = (sheet * 2) + (includeInstructions ? 3 : 2)
      page.drawText(`Page ${frontPageNum}`, {
        x: width / 2 - 20, y: 20,
        size: 8,
        font: font,
        color: rgb(0.5, 0.5, 0.5)
      })
      
      // ============ BACK PAGE ============
      page = pdfDoc.addPage([width, height])
      
      // Page background
      page.drawRectangle({
        x: 0, y: 0, width, height,
        color: rgb(0.98, 0.98, 0.98)
      })
      
      // Draw each card back (MIRRORED horizontally for correct alignment when printed)
      sheetCards.forEach((card, idx) => {
        // Mirror the column position for back side
        const col = (cols - 1) - (idx % cols)
        const row = Math.floor(idx / cols)
        
        const x = margin + col * (actualCardWidth + gutterX)
        const y = height - margin - (row + 1) * actualCardHeight - row * gutterY
        
        // Card background
        page.drawRectangle({
          x, y,
          width: actualCardWidth,
          height: actualCardHeight,
          color: rgb(backColor.r, backColor.g, backColor.b),
          borderColor: rgb(0.3, 0.3, 0.3),
          borderWidth: 0.5
        })
        
        // Draw background pattern
        drawBackgroundPattern(page, x, y, actualCardWidth, actualCardHeight, backgroundDesign, backColor, textColorBack)
        
        // "BACK" label
        page.drawText('BACK', {
          x: x + 10, y: y + actualCardHeight - 20,
          size: 8,
          font: font,
          color: rgb(textColorBack.r, textColorBack.g, textColorBack.b, 0.5)
        })
        
        // Card content (answer)
        const backText = stripEmojis(card.back || '')
        const fontSize = backText.length > 150 ? 9 : backText.length > 100 ? 10 : backText.length > 50 ? 12 : 14
        const lines = wrapText(backText, actualCardWidth - 30, font, fontSize)
        const lineHeight = fontSize + 4
        const totalTextHeight = lines.length * lineHeight
        const startY = y + (actualCardHeight + totalTextHeight) / 2 - lineHeight
        
        lines.forEach((line, lineIdx) => {
          const lineWidth = font.widthOfTextAtSize(line, fontSize)
          page.drawText(line, {
            x: x + (actualCardWidth - lineWidth) / 2,
            y: startY - lineIdx * lineHeight,
            size: fontSize,
            font: font,
            color: rgb(textColorBack.r, textColorBack.g, textColorBack.b)
          })
        })
        
        // Cut guides
        if (includeCutGuides) {
          const dashLength = 4
          const gapLength = 4
          
          for (let dx = 0; dx < actualCardWidth; dx += dashLength + gapLength) {
            page.drawLine({
              start: { x: x + dx, y: y + actualCardHeight },
              end: { x: Math.min(x + dx + dashLength, x + actualCardWidth), y: y + actualCardHeight },
              thickness: 0.5,
              color: rgb(0.5, 0.5, 0.5)
            })
          }
          for (let dx = 0; dx < actualCardWidth; dx += dashLength + gapLength) {
            page.drawLine({
              start: { x: x + dx, y: y },
              end: { x: Math.min(x + dx + dashLength, x + actualCardWidth), y: y },
              thickness: 0.5,
              color: rgb(0.5, 0.5, 0.5)
            })
          }
          for (let dy = 0; dy < actualCardHeight; dy += dashLength + gapLength) {
            page.drawLine({
              start: { x: x, y: y + dy },
              end: { x: x, y: Math.min(y + dy + dashLength, y + actualCardHeight) },
              thickness: 0.5,
              color: rgb(0.5, 0.5, 0.5)
            })
          }
          for (let dy = 0; dy < actualCardHeight; dy += dashLength + gapLength) {
            page.drawLine({
              start: { x: x + actualCardWidth, y: y + dy },
              end: { x: x + actualCardWidth, y: Math.min(y + dy + dashLength, y + actualCardHeight) },
              thickness: 0.5,
              color: rgb(0.5, 0.5, 0.5)
            })
          }
        }
      })
      
      // Page number
      const backPageNum = (sheet * 2) + (includeInstructions ? 4 : 3)
      page.drawText(`Page ${backPageNum}`, {
        x: width / 2 - 20, y: 20,
        size: 8,
        font: font,
        color: rgb(0.5, 0.5, 0.5)
      })
    }
    
    // Save PDF (no more padding pages - user can generate any size)
    const pdfBytes = await pdfDoc.save()
    
    const outputDir = path.join(process.cwd(), 'public', 'flashcards')
    await fs.mkdir(outputDir, { recursive: true })
    
    const filename = `${uuidv4()}.pdf`
    await fs.writeFile(path.join(outputDir, filename), pdfBytes)
    
    // Save to library
    try {
      const libraryCollection = await getCollection('library')
      const documentId = uuidv4()
      
      await libraryCollection.insertOne({
        id: documentId,
        userId: 'default-user',
        type: 'flashcards',
        category: 'document',
        title: title || 'Flashcard Pack',
        description: `${flashcards.length} flashcards - ${category || 'Educational'}`,
        filePath: `/flashcards/${filename}`,
        fileSize: pdfBytes.length,
        metadata: { 
          cardCount: flashcards.length, 
          kdpSize, 
          colorTheme: colorTheme?.name || 'Classic',
          category 
        },
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      })
      } catch (libError) {
      console.error('Failed to save to library:', libError)
    }
    
    return NextResponse.json({
      success: true,
      downloadUrl: `/flashcards/${filename}`,
      pageCount: pdfDoc.getPageCount(),
      cardCount: flashcards.length
    })
    
  } catch (error) {
    console.error('PDF generation error:', error)
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}
