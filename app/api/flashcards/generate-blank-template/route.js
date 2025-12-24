import { NextResponse } from 'next/server'
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'
import fs from 'fs/promises'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'
import { getCollection } from '@/lib/db'

// Helper to parse hex color to RGB
function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result ? {
    r: parseInt(result[1], 16) / 255,
    g: parseInt(result[2], 16) / 255,
    b: parseInt(result[3], 16) / 255
  } : { r: 1, g: 1, b: 1 }
}

// Assorted pastel colors
const ASSORTED_COLORS = [
  '#fce7f3', // pink
  '#dbeafe', // blue
  '#dcfce7', // green
  '#fef9c3', // yellow
  '#f3e8ff', // purple
  '#fef9e7', // cream
]

export async function POST(request) {
  try {
    const {
      title,
      templateStyle,
      cardColor,
      indexCardSize,
      pageCount,
      includeTitle,
      kdpSize,
      paperOption
    } = await request.json()

    // Validate required fields
    if (!title || !templateStyle || !cardColor || !indexCardSize) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields'
      }, { status: 400 })
    }

    // Create PDF document
    const pdfDoc = await PDFDocument.create()
    
    // Page dimensions based on KDP size (in points, 72pts = 1 inch)
    const pageDimensions = {
      '6x9': { width: 432, height: 648 },
      '8.5x11': { width: 612, height: 792 },
      '5x8': { width: 360, height: 576 }
    }
    
    const pageSize = pageDimensions[kdpSize] || pageDimensions['6x9']
    const margin = 36 // 0.5 inch margin
    const contentWidth = pageSize.width - (margin * 2)
    const contentHeight = pageSize.height - (margin * 2)
    const cardGap = 8 // Gap between cards

    // For blank template books, we want multiple cards per page
    // Calculate optimal card size based on page and desired card count
    // Standard approach: fit 4-6 cards per page for usability
    let cardsPerRow, cardsPerCol, cardWidth, cardHeight

    const cardSizeId = typeof indexCardSize === 'object' ? indexCardSize.id : indexCardSize
    
    // Define card layouts based on book size and card size preference
    if (kdpSize === '8.5x11') {
      // Letter size - can fit more cards
      if (cardSizeId === '3x5') {
        cardsPerRow = 2
        cardsPerCol = 3
      } else if (cardSizeId === '4x6') {
        cardsPerRow = 1
        cardsPerCol = 2
      } else {
        cardsPerRow = 1
        cardsPerCol = 1
      }
    } else if (kdpSize === '6x9') {
      // Standard size
      if (cardSizeId === '3x5') {
        cardsPerRow = 1
        cardsPerCol = 2
      } else if (cardSizeId === '4x6') {
        cardsPerRow = 1
        cardsPerCol = 1
      } else {
        cardsPerRow = 1
        cardsPerCol = 1
      }
    } else {
      // 5x8 compact
      cardsPerRow = 1
      cardsPerCol = 2
    }

    // Calculate actual card dimensions to fit the page
    cardWidth = (contentWidth - (cardGap * (cardsPerRow - 1))) / cardsPerRow
    cardHeight = (contentHeight - (cardGap * (cardsPerCol - 1)) - 20) / cardsPerCol // 20pts for page number

    const cardsPerPage = cardsPerRow * cardsPerCol
    const totalPages = Math.ceil(pageCount)
    
    // Embed fonts
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
    const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica)

    // Add title page if requested
    if (includeTitle) {
      const titlePage = pdfDoc.addPage([pageSize.width, pageSize.height])
      
      // Title
      titlePage.drawText(title, {
        x: margin,
        y: pageSize.height - 150,
        size: 28,
        font: boldFont,
        color: rgb(0.1, 0.1, 0.1),
        maxWidth: contentWidth
      })
      
      // Subtitle
      const styleLabels = {
        blank: 'Blank',
        lined: 'Lined',
        'ruled-blank': 'Ruled Front / Blank Back',
        dotted: 'Dotted Grid'
      }
      
      titlePage.drawText(`${totalPages} Pages of ${styleLabels[templateStyle] || 'Blank'} Index Cards`, {
        x: margin,
        y: pageSize.height - 190,
        size: 14,
        font: regularFont,
        color: rgb(0.4, 0.4, 0.4),
        maxWidth: contentWidth
      })
      
      titlePage.drawText(`${cardsPerPage} cards per page • Total ${totalPages * cardsPerPage} cards`, {
        x: margin,
        y: pageSize.height - 215,
        size: 12,
        font: regularFont,
        color: rgb(0.5, 0.5, 0.5),
        maxWidth: contentWidth
      })

      // Instructions
      const instructions = [
        'Cut along the dotted lines to separate cards',
        'Use for studying, note-taking, or organization',
        'Perfect for flashcard-based learning'
      ]
      
      let instructionY = pageSize.height - 300
      for (const instruction of instructions) {
        titlePage.drawText(instruction, {
          x: margin + 20,
          y: instructionY,
          size: 11,
          font: regularFont,
          color: rgb(0.3, 0.3, 0.3),
          maxWidth: contentWidth - 40
        })
        instructionY -= 25
      }
    }

    // Generate template pages
    let colorIndex = 0

    for (let pageNum = 0; pageNum < totalPages; pageNum++) {
      const page = pdfDoc.addPage([pageSize.width, pageSize.height])

      // Draw cards on page
      for (let row = 0; row < cardsPerCol; row++) {
        for (let col = 0; col < cardsPerRow; col++) {
          const x = margin + (col * (cardWidth + cardGap))
          const y = pageSize.height - margin - ((row + 1) * cardHeight) - (row * cardGap)

          // Get card color
          let bgColor = { r: 1, g: 1, b: 1 } // default white
          if (cardColor?.hex && cardColor.hex !== 'assorted') {
            bgColor = hexToRgb(cardColor.hex)
          } else if (cardColor?.id === 'assorted' || cardColor?.hex === 'assorted') {
            bgColor = hexToRgb(ASSORTED_COLORS[colorIndex % ASSORTED_COLORS.length])
            colorIndex++
          }

          // Draw card background
          page.drawRectangle({
            x,
            y,
            width: cardWidth,
            height: cardHeight,
            color: rgb(bgColor.r, bgColor.g, bgColor.b)
          })

          // Draw card border (dashed for cut lines)
          const borderColor = rgb(0.6, 0.6, 0.6)
          
          // Top border
          for (let i = 0; i < cardWidth; i += 8) {
            page.drawLine({
              start: { x: x + i, y: y + cardHeight },
              end: { x: x + Math.min(i + 4, cardWidth), y: y + cardHeight },
              thickness: 0.5,
              color: borderColor
            })
          }
          
          // Bottom border
          for (let i = 0; i < cardWidth; i += 8) {
            page.drawLine({
              start: { x: x + i, y: y },
              end: { x: x + Math.min(i + 4, cardWidth), y: y },
              thickness: 0.5,
              color: borderColor
            })
          }
          
          // Left border
          for (let i = 0; i < cardHeight; i += 8) {
            page.drawLine({
              start: { x: x, y: y + i },
              end: { x: x, y: y + Math.min(i + 4, cardHeight) },
              thickness: 0.5,
              color: borderColor
            })
          }
          
          // Right border
          for (let i = 0; i < cardHeight; i += 8) {
            page.drawLine({
              start: { x: x + cardWidth, y: y + i },
              end: { x: x + cardWidth, y: y + Math.min(i + 4, cardHeight) },
              thickness: 0.5,
              color: borderColor
            })
          }

          // Draw template content based on style
          const lineColor = rgb(0.75, 0.75, 0.75)
          const cardPadding = 15
          const lineSpacing = 24
          
          // Determine if this page should be lined (for ruled-blank style)
          const isLinedPage = templateStyle === 'lined' || 
            (templateStyle === 'ruled-blank' && pageNum % 2 === 0)

          if (isLinedPage) {
            // Draw horizontal lines
            const startY = y + cardHeight - cardPadding - 20
            const endY = y + cardPadding
            
            for (let lineY = startY; lineY > endY; lineY -= lineSpacing) {
              page.drawLine({
                start: { x: x + cardPadding, y: lineY },
                end: { x: x + cardWidth - cardPadding, y: lineY },
                thickness: 0.5,
                color: lineColor
              })
            }
          } else if (templateStyle === 'dotted') {
            // Draw dot grid
            const dotSpacing = 18
            const startX = x + cardPadding
            const startY = y + cardHeight - cardPadding
            const endX = x + cardWidth - cardPadding
            const endY = y + cardPadding
            
            for (let dotY = startY; dotY > endY; dotY -= dotSpacing) {
              for (let dotX = startX; dotX < endX; dotX += dotSpacing) {
                page.drawCircle({
                  x: dotX,
                  y: dotY,
                  size: 1,
                  color: lineColor
                })
              }
            }
          }
          // 'blank' style has no additional content
        }
      }

      // Add page number
      page.drawText(`${pageNum + 1}`, {
        x: pageSize.width / 2 - 5,
        y: 20,
        size: 9,
        font: regularFont,
        color: rgb(0.5, 0.5, 0.5)
      })
    }

    // Save PDF
    const pdfBytes = await pdfDoc.save()
    
    // Create output directory if it doesn't exist
    const outputDir = path.join(process.cwd(), 'public', 'generated')
    try {
      await fs.access(outputDir)
    } catch {
      await fs.mkdir(outputDir, { recursive: true })
    }

    // Generate unique filename
    const safeTitle = title.replace(/[^a-z0-9]/gi, '-').substring(0, 30)
    const filename = `${safeTitle}-${uuidv4().substring(0, 8)}.pdf`
    const filepath = path.join(outputDir, filename)
    
    // Write PDF file
    await fs.writeFile(filepath, pdfBytes)

    // Save to library
    try {
      const libraryCollection = await getCollection('library')
      const documentId = uuidv4()
      const cardSizeLabel = typeof indexCardSize === 'object' ? indexCardSize.name : indexCardSize
      
      await libraryCollection.insertOne({
        id: documentId,
        userId: 'default-user',
        type: 'blank-flashcards',
        category: 'document',
        title: title || 'Blank Flashcard Templates',
        description: `${totalPages} pages of ${templateStyle} templates - ${cardSizeLabel} cards`,
        filePath: `/generated/${filename}`,
        fileSize: pdfBytes.length,
        metadata: { 
          pageCount: totalPages, 
          templateStyle, 
          cardColor: cardColor?.name || 'White',
          indexCardSize: cardSizeLabel,
          cardsPerPage,
          totalCards: totalPages * cardsPerPage
        },
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      })
      console.log(`Blank template saved to library: ${documentId}`)
    } catch (libError) {
      console.error('Failed to save to library:', libError)
    }

    // Return success response
    return NextResponse.json({
      success: true,
      downloadUrl: `/generated/${filename}`,
      pageCount: totalPages + (includeTitle ? 1 : 0),
      cardsPerPage,
      totalCards: totalPages * cardsPerPage,
      filename
    })

  } catch (error) {
    console.error('Blank template generation error:', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to generate blank template'
    }, { status: 500 })
  }
}
