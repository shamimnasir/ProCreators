import { NextResponse } from 'next/server'
import PDFDocument from 'pdfkit'
import fs from 'fs'
import path from 'path'

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
    const doc = new PDFDocument({
      size: kdpSize === '6x9' ? [432, 648] : kdpSize === '8.5x11' ? [612, 792] : [360, 576],
      margins: { top: 36, bottom: 36, left: 36, right: 36 }
    })

    // Create output directory if it doesn't exist
    const outputDir = path.join(process.cwd(), 'public', 'generated')
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true })
    }

    // Generate unique filename
    const timestamp = Date.now()
    const filename = `blank-template-${timestamp}.pdf`
    const filepath = path.join(outputDir, filename)
    const stream = fs.createWriteStream(filepath)
    doc.pipe(stream)

    // Page dimensions
    const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right
    const pageHeight = doc.page.height - doc.page.margins.top - doc.page.margins.bottom

    // Card dimensions based on index card size
    const cardDimensions = {
      '3x5': { width: 216, height: 360 }, // 3" x 5" in points
      '4x6': { width: 288, height: 432 }, // 4" x 6" in points  
      '5x7': { width: 360, height: 504 }  // 5" x 7" in points
    }

    const cardSize = cardDimensions[indexCardSize.id] || cardDimensions['3x5']
    
    // Calculate cards per page
    const cardsPerRow = Math.floor(pageWidth / cardSize.width)
    const cardsPerCol = Math.floor(pageHeight / cardSize.height)
    const cardsPerPage = cardsPerRow * cardsPerCol

    // Title page
    if (includeTitle) {
      doc.fontSize(24).font('Helvetica-Bold')
      doc.text(title, 0, 200, { align: 'center', width: pageWidth })
      
      doc.fontSize(14).font('Helvetica')
      doc.text(`${pageCount} Pages of ${templateStyle} Templates`, 0, 250, { align: 'center', width: pageWidth })
      doc.text(`${indexCardSize.name} Cards`, 0, 270, { align: 'center', width: pageWidth })
      
      doc.addPage()
    }

    // Generate template pages
    let currentPage = 0
    const totalPages = Math.ceil(pageCount)

    for (let page = 0; page < totalPages; page++) {
      if (page > 0) doc.addPage()

      // Draw cards on page
      for (let row = 0; row < cardsPerCol; row++) {
        for (let col = 0; col < cardsPerRow; col++) {
          const x = doc.page.margins.left + (col * cardSize.width)
          const y = doc.page.margins.top + (row * cardSize.height)

          // Draw card border
          doc.strokeColor(cardColor.border || '#e5e7eb')
          doc.lineWidth(1)
          doc.rect(x, y, cardSize.width, cardSize.height).stroke()

          // Draw template content based on style
          if (templateStyle === 'lined') {
            // Draw horizontal lines
            const lineSpacing = 20
            const startY = y + 20
            const endY = y + cardSize.height - 20
            
            doc.strokeColor('#d1d5db')
            doc.lineWidth(0.5)
            
            for (let lineY = startY; lineY < endY; lineY += lineSpacing) {
              doc.moveTo(x + 10, lineY)
              doc.lineTo(x + cardSize.width - 10, lineY)
              doc.stroke()
            }
          } else if (templateStyle === 'ruled-blank') {
            // Lines on front (odd pages), blank on back (even pages)
            if (page % 2 === 0) {
              const lineSpacing = 20
              const startY = y + 20
              const endY = y + cardSize.height - 20
              
              doc.strokeColor('#d1d5db')
              doc.lineWidth(0.5)
              
              for (let lineY = startY; lineY < endY; lineY += lineSpacing) {
                doc.moveTo(x + 10, lineY)
                doc.lineTo(x + cardSize.width - 10, lineY)
                doc.stroke()
              }
            }
          } else if (templateStyle === 'dotted') {
            // Draw dot grid
            const dotSpacing = 15
            const startX = x + 15
            const startY = y + 15
            const endX = x + cardSize.width - 15
            const endY = y + cardSize.height - 15
            
            doc.fillColor('#d1d5db')
            
            for (let dotY = startY; dotY < endY; dotY += dotSpacing) {
              for (let dotX = startX; dotX < endX; dotX += dotSpacing) {
                doc.circle(dotX, dotY, 1).fill()
              }
            }
          }
          // 'blank' style has no additional content
        }
      }

      // Add page number
      doc.fontSize(8).fillColor('#6b7280')
      doc.text(`Page ${page + 1} of ${totalPages}`, 0, doc.page.height - 30, { 
        align: 'center', 
        width: pageWidth 
      })
    }

    // Finalize PDF
    doc.end()

    // Wait for PDF to be written
    await new Promise((resolve, reject) => {
      stream.on('finish', resolve)
      stream.on('error', reject)
    })

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