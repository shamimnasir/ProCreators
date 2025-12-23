import { NextResponse } from 'next/server'
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'
import fs from 'fs/promises'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'

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

export async function POST(request) {
  try {
    const body = await request.json()
    const {
      title,
      description,
      category,
      flashcards,
      kdpSize,
      paperOption,
      colorTheme,
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
      color: rgb(1, 1, 1, 0.6)
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
        color: rgb(1, 1, 1)
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
    
    // ============ PADDING PAGES (if needed for minimum) ============
    const currentPages = pdfDoc.getPageCount()
    const minPages = paperOption === 'standard-color' ? 72 : 24
    
    while (pdfDoc.getPageCount() < minPages) {
      page = pdfDoc.addPage([width, height])
      
      // Simple notes page
      page.drawText('Notes', {
        x: 50, y: height - 60,
        size: 18,
        font: fontBold,
        color: rgb(0.3, 0.3, 0.3)
      })
      
      // Draw lines for notes
      for (let i = 0; i < 20; i++) {
        page.drawLine({
          start: { x: 50, y: height - 100 - (i * 30) },
          end: { x: width - 50, y: height - 100 - (i * 30) },
          thickness: 0.5,
          color: rgb(0.8, 0.8, 0.8)
        })
      }
    }
    
    // Save PDF
    const pdfBytes = await pdfDoc.save()
    
    const outputDir = path.join(process.cwd(), 'public', 'flashcards')
    await fs.mkdir(outputDir, { recursive: true })
    
    const filename = `${uuidv4()}.pdf`
    await fs.writeFile(path.join(outputDir, filename), pdfBytes)
    
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
