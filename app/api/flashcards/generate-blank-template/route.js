import { NextResponse } from 'next/server'
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'
import fs from 'fs/promises'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'

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
    
    // Page dimensions based on KDP size
    const pageDimensions = {
      '6x9': { width: 432, height: 648 },
      '8.5x11': { width: 612, height: 792 },
      '5x8': { width: 360, height: 576 }
    }
    
    const pageSize = pageDimensions[kdpSize] || pageDimensions['6x9']
    const margin = 36
    const contentWidth = pageSize.width - (margin * 2)
    const contentHeight = pageSize.height - (margin * 2)

    // Card dimensions based on index card size (in points, 72 points = 1 inch)
    const cardDimensions = {
      '3x5': { width: 216, height: 360 }, // 3" x 5"
      '4x6': { width: 288, height: 432 }, // 4" x 6"  
      '5x7': { width: 360, height: 504 }  // 5" x 7"
    }

    const cardSize = cardDimensions[indexCardSize] || cardDimensions['3x5']
    
    // Calculate cards per page
    const cardsPerRow = Math.floor(contentWidth / cardSize.width)
    const cardsPerCol = Math.floor(contentHeight / cardSize.height)
    const cardsPerPage = Math.max(1, cardsPerRow * cardsPerCol)

    // Add title page if requested
    if (includeTitle) {
      const titlePage = pdfDoc.addPage([pageSize.width, pageSize.height])
      const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
      const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica)
      
      titlePage.drawText(title, {
        x: margin,
        y: pageSize.height - 200,
        size: 24,
        font,
        color: rgb(0, 0, 0),
        maxWidth: contentWidth
      })
      
      titlePage.drawText(`${pageCount} Pages of ${templateStyle} Templates`, {
        x: margin,
        y: pageSize.height - 250,
        size: 14,
        font: regularFont,
        color: rgb(0.4, 0.4, 0.4),
        maxWidth: contentWidth
      })
      
      titlePage.drawText(`${indexCardSize} Cards`, {
        x: margin,
        y: pageSize.height - 270,
        size: 14,
        font: regularFont,
        color: rgb(0.4, 0.4, 0.4),
        maxWidth: contentWidth
      })
    }

    // Generate template pages
    const totalPages = Math.ceil(pageCount)
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica)

    for (let pageNum = 0; pageNum < totalPages; pageNum++) {
      const page = pdfDoc.addPage([pageSize.width, pageSize.height])

      // Draw cards on page
      for (let row = 0; row < cardsPerCol; row++) {
        for (let col = 0; col < cardsPerRow; col++) {
          const x = margin + (col * cardSize.width)
          const y = pageSize.height - margin - ((row + 1) * cardSize.height)

          // Draw card border
          const borderColor = cardColor.hex === '#ffffff' ? rgb(0.9, 0.9, 0.9) : rgb(0.8, 0.8, 0.8)
          page.drawRectangle({
            x,
            y,
            width: cardSize.width,
            height: cardSize.height,
            borderColor,
            borderWidth: 1
          })

          // Draw template content based on style
          if (templateStyle === 'lined') {
            // Draw horizontal lines
            const lineSpacing = 20
            const startY = y + cardSize.height - 20
            const endY = y + 20
            
            for (let lineY = startY; lineY > endY; lineY -= lineSpacing) {
              page.drawLine({
                start: { x: x + 10, y: lineY },
                end: { x: x + cardSize.width - 10, y: lineY },
                thickness: 0.5,
                color: rgb(0.8, 0.8, 0.8)
              })
            }
          } else if (templateStyle === 'ruled-blank') {
            // Lines on front (odd pages), blank on back (even pages)
            if (pageNum % 2 === 0) {
              const lineSpacing = 20
              const startY = y + cardSize.height - 20
              const endY = y + 20
              
              for (let lineY = startY; lineY > endY; lineY -= lineSpacing) {
                page.drawLine({
                  start: { x: x + 10, y: lineY },
                  end: { x: x + cardSize.width - 10, y: lineY },
                  thickness: 0.5,
                  color: rgb(0.8, 0.8, 0.8)
                })
              }
            }
          } else if (templateStyle === 'dotted') {
            // Draw dot grid
            const dotSpacing = 15
            const startX = x + 15
            const startY = y + cardSize.height - 15
            const endX = x + cardSize.width - 15
            const endY = y + 15
            
            for (let dotY = startY; dotY > endY; dotY -= dotSpacing) {
              for (let dotX = startX; dotX < endX; dotX += dotSpacing) {
                page.drawCircle({
                  x: dotX,
                  y: dotY,
                  size: 1,
                  color: rgb(0.8, 0.8, 0.8)
                })
              }
            }
          }
          // 'blank' style has no additional content
        }
      }

      // Add page number
      page.drawText(`Page ${pageNum + 1} of ${totalPages}`, {
        x: margin,
        y: 20,
        size: 8,
        font,
        color: rgb(0.4, 0.4, 0.4)
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
    const filename = `blank-template-${uuidv4()}.pdf`
    const filepath = path.join(outputDir, filename)
    
    // Write PDF file
    await fs.writeFile(filepath, pdfBytes)

    // Return success response
    return NextResponse.json({
      success: true,
      downloadUrl: `/generated/${filename}`,
      pageCount: totalPages,
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