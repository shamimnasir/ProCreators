import { NextResponse } from 'next/server'
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import { getCollection } from '@/lib/mongodb'
import { randomUUID } from 'crypto'
import fs from 'fs/promises'
import path from 'path'
import { 
  PDF_COLOR_SCHEMES, 
  COVER_STYLES, 
  drawCoverPageWithImage,
  drawCoverPage,
  getCurrentYear
} from '@/lib/pdf-design'
import { generateCoverImage, getWorksheetTheme } from '@/lib/cover-image-generator'

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

export async function POST(request) {
  try {
    const { cover, sections, bonusQuestions, settings, includeAnswerKey } = await request.json()
    
    if (!cover?.title || !sections?.length) {
      return NextResponse.json(
        { success: false, error: 'Title and sections are required' },
        { status: 400 }
      )
    }
    
    console.log(`Generating worksheet PDF: "${cover.title}"...`)
    
    const colorScheme = settings?.colorScheme || 'ocean-blue'
    const coverStyle = settings?.coverStyle || 'modern'
    const subject = settings?.subject || 'general'
    
    // Generate cover image
    let coverImageUrl = null
    if (settings?.generateCoverImage !== false) {
      try {
        const themeKey = getWorksheetTheme(subject)
        console.log(`Generating cover image for theme: ${themeKey}`)
        const imageResult = await generateCoverImage(themeKey)
        if (imageResult.success && imageResult.imageUrl) {
          coverImageUrl = imageResult.imageUrl
          console.log('Cover image generated successfully')
        }
      } catch (imgError) {
        console.log('Cover image generation failed:', imgError.message)
      }
    }
    
    const pdfDoc = await PDFDocument.create()
    const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica)
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
    const italicFont = await pdfDoc.embedFont(StandardFonts.HelveticaOblique)
    
    const pageWidth = 612
    const pageHeight = 792
    const margin = 55
    const contentWidth = pageWidth - (margin * 2)
    
    const colors = PDF_COLOR_SCHEMES[colorScheme] || PDF_COLOR_SCHEMES['ocean-blue']
    const coverStyleObj = COVER_STYLES[coverStyle] || COVER_STYLES['modern']
    
    // ===== COVER PAGE =====
    let page = pdfDoc.addPage([pageWidth, pageHeight])
    
    if (coverImageUrl) {
      await drawCoverPageWithImage(page, pdfDoc, {
        width: pageWidth,
        height: pageHeight,
        title: sanitizeText(cover.title),
        subtitle: sanitizeText(cover.subtitle || `${cover.subject} - ${cover.gradeLevel}`),
        authorName: sanitizeText(cover.teacherName),
        year: getCurrentYear(),
        colors,
        coverStyle: coverStyleObj,
        boldFont,
        regularFont,
        coverImageUrl
      })
    } else {
      drawCoverPage(page, {
        width: pageWidth,
        height: pageHeight,
        title: sanitizeText(cover.title),
        subtitle: sanitizeText(cover.subtitle || `${cover.subject} - ${cover.gradeLevel}`),
        authorName: sanitizeText(cover.teacherName),
        year: getCurrentYear(),
        colors,
        coverStyle: coverStyleObj,
        boldFont,
        regularFont
      })
    }
    
    // ===== STUDENT INFO PAGE =====
    page = pdfDoc.addPage([pageWidth, pageHeight])
    page.drawRectangle({ x: 0, y: 0, width: pageWidth, height: pageHeight, color: colors.background })
    
    // Header
    page.drawRectangle({ x: 0, y: pageHeight - 70, width: pageWidth, height: 70, color: colors.accent })
    page.drawText(sanitizeText(cover.title), {
      x: margin,
      y: pageHeight - 45,
      size: 18,
      font: boldFont,
      color: colors.primary,
    })
    
    // Student info fields
    let y = pageHeight - 100
    const infoFields = ['Name:', 'Date:', 'Class:', 'Score:    /']
    infoFields.forEach(field => {
      page.drawText(field, { x: margin, y, size: 11, font: boldFont, color: colors.text })
      page.drawLine({
        start: { x: margin + 60, y: y - 2 },
        end: { x: margin + 200, y: y - 2 },
        thickness: 0.5,
        color: colors.secondary,
      })
      y -= 30
    })
    
    // Instructions
    if (cover.instructions) {
      y -= 20
      page.drawRectangle({
        x: margin,
        y: y - 60,
        width: contentWidth,
        height: 70,
        color: colors.accent,
        borderColor: colors.secondary,
        borderWidth: 1,
      })
      page.drawRectangle({ x: margin, y: y - 60, width: 4, height: 70, color: colors.primary })
      
      page.drawText('Instructions:', { x: margin + 15, y: y - 5, size: 12, font: boldFont, color: colors.primary })
      
      const instrLines = wrapText(cover.instructions, regularFont, 10, contentWidth - 30)
      let instrY = y - 22
      instrLines.slice(0, 3).forEach(line => {
        page.drawText(line, { x: margin + 15, y: instrY, size: 10, font: regularFont, color: colors.text })
        instrY -= 14
      })
      
      y -= 90
    }
    
    // ===== QUESTIONS =====
    let questionNum = 1
    y -= 20
    
    for (const section of sections) {
      // Section header
      if (y < margin + 150) {
        page = pdfDoc.addPage([pageWidth, pageHeight])
        page.drawRectangle({ x: 0, y: 0, width: pageWidth, height: pageHeight, color: colors.background })
        y = pageHeight - margin - 30
      }
      
      page.drawRectangle({
        x: margin - 5,
        y: y - 5,
        width: contentWidth + 10,
        height: 25,
        color: colors.primary,
      })
      page.drawText(sanitizeText(section.name), {
        x: margin,
        y: y,
        size: 12,
        font: boldFont,
        color: colors.background,
      })
      
      if (section.instructions) {
        y -= 35
        page.drawText(sanitizeText(section.instructions), {
          x: margin,
          y,
          size: 9,
          font: italicFont,
          color: colors.secondary,
        })
      }
      
      y -= 30
      
      // Questions
      for (const q of (section.questions || [])) {
        if (y < margin + 100) {
          page = pdfDoc.addPage([pageWidth, pageHeight])
          page.drawRectangle({ x: 0, y: 0, width: pageWidth, height: pageHeight, color: colors.background })
          y = pageHeight - margin - 30
        }
        
        // Question number
        page.drawCircle({ x: margin + 10, y: y + 4, size: 10, color: colors.accent })
        page.drawText(String(questionNum), {
          x: margin + 7,
          y: y,
          size: 9,
          font: boldFont,
          color: colors.primary,
        })
        
        // Question text
        const qLines = wrapText(q.question, regularFont, 11, contentWidth - 30)
        qLines.forEach((line, idx) => {
          page.drawText(line, {
            x: margin + 25,
            y: y - (idx * 15),
            size: 11,
            font: regularFont,
            color: colors.text,
          })
        })
        y -= (qLines.length * 15) + 10
        
        // Options for multiple choice
        if (section.type === 'multiple-choice' && q.options) {
          q.options.forEach(opt => {
            page.drawText(sanitizeText(opt), {
              x: margin + 35,
              y,
              size: 10,
              font: regularFont,
              color: colors.text,
            })
            y -= 18
          })
        }
        
        // Answer lines for short answer
        if (section.type === 'short-answer' || section.type === 'fill-blank') {
          for (let i = 0; i < 2; i++) {
            page.drawLine({
              start: { x: margin + 25, y },
              end: { x: pageWidth - margin, y },
              thickness: 0.5,
              color: colors.secondary,
            })
            y -= 22
          }
        }
        
        y -= 15
        questionNum++
      }
      
      y -= 20
    }
    
    // Bonus questions
    if (bonusQuestions && bonusQuestions.length > 0) {
      if (y < margin + 150) {
        page = pdfDoc.addPage([pageWidth, pageHeight])
        page.drawRectangle({ x: 0, y: 0, width: pageWidth, height: pageHeight, color: colors.background })
        y = pageHeight - margin - 30
      }
      
      page.drawRectangle({
        x: margin - 5,
        y: y - 5,
        width: contentWidth + 10,
        height: 25,
        color: colors.secondary,
      })
      page.drawText('BONUS QUESTIONS', {
        x: margin,
        y: y,
        size: 12,
        font: boldFont,
        color: colors.background,
      })
      y -= 35
      
      bonusQuestions.forEach((q, idx) => {
        const qLines = wrapText(`Bonus ${idx + 1}: ${q.question}`, boldFont, 11, contentWidth)
        qLines.forEach((line, lIdx) => {
          page.drawText(line, { x: margin, y: y - (lIdx * 15), size: 11, font: boldFont, color: colors.text })
        })
        y -= (qLines.length * 15) + 10
        
        for (let i = 0; i < 3; i++) {
          page.drawLine({
            start: { x: margin, y },
            end: { x: pageWidth - margin, y },
            thickness: 0.5,
            color: colors.secondary,
          })
          y -= 22
        }
        y -= 20
      })
    }
    
    // ===== ANSWER KEY (separate page) =====
    if (includeAnswerKey !== false) {
      page = pdfDoc.addPage([pageWidth, pageHeight])
      page.drawRectangle({ x: 0, y: 0, width: pageWidth, height: pageHeight, color: colors.background })
      
      page.drawRectangle({ x: 0, y: pageHeight - 60, width: pageWidth, height: 60, color: colors.primary })
      page.drawText('ANSWER KEY', {
        x: margin,
        y: pageHeight - 40,
        size: 20,
        font: boldFont,
        color: colors.background,
      })
      
      y = pageHeight - 90
      questionNum = 1
      
      for (const section of sections) {
        page.drawText(sanitizeText(section.name), {
          x: margin,
          y,
          size: 12,
          font: boldFont,
          color: colors.secondary,
        })
        y -= 20
        
        for (const q of (section.questions || [])) {
          if (y < margin + 50) {
            page = pdfDoc.addPage([pageWidth, pageHeight])
            page.drawRectangle({ x: 0, y: 0, width: pageWidth, height: pageHeight, color: colors.background })
            y = pageHeight - margin - 30
          }
          
          page.drawText(`${questionNum}. ${sanitizeText(q.answer)}`, {
            x: margin + 10,
            y,
            size: 10,
            font: regularFont,
            color: colors.text,
          })
          y -= 18
          questionNum++
        }
        y -= 15
      }
      
      if (bonusQuestions && bonusQuestions.length > 0) {
        page.drawText('Bonus Answers:', { x: margin, y, size: 12, font: boldFont, color: colors.secondary })
        y -= 20
        bonusQuestions.forEach((q, idx) => {
          page.drawText(`Bonus ${idx + 1}: ${sanitizeText(q.answer)}`, {
            x: margin + 10, y, size: 10, font: regularFont, color: colors.text
          })
          y -= 18
        })
      }
    }
    
    // Save PDF
    const pdfBytes = await pdfDoc.save()
    
    const outputDir = '/app/public/worksheets'
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
      type: 'document',
      category: 'document',
      title: sanitizeText(cover.title),
      description: `${cover.subject} worksheet for ${cover.gradeLevel}`,
      filePath: `/worksheets/${fileName}`,
      fileSize: pdfBytes.length,
      tool: 'worksheet-maker',
      metadata: { subject, gradeLevel: cover.gradeLevel, colorScheme, coverStyle },
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    })
    
    console.log(`Worksheet PDF generated: ${filePath}`)
    
    return NextResponse.json({
      success: true,
      downloadUrl: `/worksheets/${fileName}`,
      pageCount: pdfDoc.getPageCount(),
      libraryId: documentId
    })
    
  } catch (error) {
    console.error('Worksheet PDF generation error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to generate PDF' },
      { status: 500 }
    )
  }
}
