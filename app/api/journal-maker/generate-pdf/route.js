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
import { generateCoverImage, getJournalTheme } from '@/lib/cover-image-generator'

// Helper to sanitize text
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

// Helper to wrap text
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
    const { 
      cover,
      introduction,
      sections,
      weeklyReflection,
      monthlyReview,
      affirmations,
      quotes,
      settings
    } = await request.json()
    
    if (!cover?.title) {
      return NextResponse.json(
        { success: false, error: 'Journal title is required' },
        { status: 400 }
      )
    }
    
    console.log(`Generating journal PDF: "${cover.title}"...`)
    
    const colorScheme = settings?.colorScheme || 'lavender'
    const coverStyle = settings?.coverStyle || 'floral'
    const journalType = settings?.journalType || 'gratitude'
    const pageCount = settings?.pageCount || 90
    
    // Generate cover image
    let coverImageUrl = null
    if (settings?.generateCoverImage !== false) {
      try {
        const themeKey = getJournalTheme(journalType)
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
    
    // Create PDF
    const pdfDoc = await PDFDocument.create()
    const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica)
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
    const italicFont = await pdfDoc.embedFont(StandardFonts.HelveticaOblique)
    
    const pageWidth = 612
    const pageHeight = 792
    const margin = 55
    const contentWidth = pageWidth - (margin * 2)
    
    const colors = PDF_COLOR_SCHEMES[colorScheme] || PDF_COLOR_SCHEMES['lavender']
    const coverStyleObj = COVER_STYLES[coverStyle] || COVER_STYLES['floral']
    
    // ===== COVER PAGE =====
    let page = pdfDoc.addPage([pageWidth, pageHeight])
    
    if (coverImageUrl) {
      await drawCoverPageWithImage(page, pdfDoc, {
        width: pageWidth,
        height: pageHeight,
        title: sanitizeText(cover.title),
        subtitle: sanitizeText(cover.subtitle),
        authorName: sanitizeText(cover.authorName),
        year: cover.year || getCurrentYear(),
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
        subtitle: sanitizeText(cover.subtitle),
        authorName: sanitizeText(cover.authorName),
        year: cover.year || getCurrentYear(),
        colors,
        coverStyle: coverStyleObj,
        boldFont,
        regularFont
      })
    }
    
    // ===== INTRODUCTION PAGE =====
    if (introduction) {
      page = pdfDoc.addPage([pageWidth, pageHeight])
      page.drawRectangle({ x: 0, y: 0, width: pageWidth, height: pageHeight, color: colors.background })
      
      // Header with accent bar
      page.drawRectangle({ x: margin - 8, y: pageHeight - margin - 35, width: 4, height: 30, color: colors.primary })
      page.drawText('Welcome to Your Journal', {
        x: margin,
        y: pageHeight - margin - 25,
        size: 22,
        font: boldFont,
        color: colors.primary
      })
      
      let y = pageHeight - margin - 70
      const introLines = wrapText(introduction, regularFont, 11, contentWidth)
      for (const line of introLines) {
        page.drawText(line, { x: margin, y, size: 11, font: regularFont, color: colors.text })
        y -= 18
      }
      
      // Add affirmations if provided
      if (affirmations && affirmations.length > 0) {
        y -= 30
        page.drawText('Daily Affirmations', { x: margin, y, size: 14, font: boldFont, color: colors.secondary })
        y -= 25
        
        affirmations.slice(0, 5).forEach((affirmation, idx) => {
          page.drawCircle({ x: margin + 8, y: y + 4, size: 3, color: colors.primary })
          page.drawText(sanitizeText(affirmation), { x: margin + 20, y, size: 10, font: italicFont, color: colors.text })
          y -= 20
        })
      }
    }
    
    // ===== JOURNAL PAGES =====
    const dailySections = sections?.filter(s => s.frequency === 'daily') || []
    const weeklySections = sections?.filter(s => s.frequency === 'weekly') || []
    
    for (let dayNum = 1; dayNum <= pageCount; dayNum++) {
      page = pdfDoc.addPage([pageWidth, pageHeight])
      page.drawRectangle({ x: 0, y: 0, width: pageWidth, height: pageHeight, color: colors.background })
      
      // Day header
      const dayLabel = `Day ${dayNum}`
      page.drawRectangle({
        x: margin - 5,
        y: pageHeight - margin - 22,
        width: 70,
        height: 22,
        color: colors.primary,
      })
      page.drawText(dayLabel, {
        x: margin,
        y: pageHeight - margin - 16,
        size: 11,
        font: boldFont,
        color: colors.background,
      })
      
      // Date line
      page.drawText('Date: _______________', {
        x: pageWidth - margin - 120,
        y: pageHeight - margin - 16,
        size: 10,
        font: regularFont,
        color: colors.secondary,
      })
      
      let y = pageHeight - margin - 55
      
      // Draw prompts from sections
      for (const section of dailySections) {
        if (y < margin + 150) break
        
        // Section name
        page.drawText(sanitizeText(section.name), {
          x: margin,
          y,
          size: 12,
          font: boldFont,
          color: colors.secondary,
        })
        y -= 22
        
        // Prompts with lines
        for (const prompt of (section.prompts || []).slice(0, 3)) {
          if (y < margin + 80) break
          
          page.drawText(sanitizeText(prompt.question), {
            x: margin,
            y,
            size: 10,
            font: italicFont,
            color: colors.text,
          })
          y -= 18
          
          // Draw writing lines
          const lineCount = prompt.lines || 3
          for (let i = 0; i < lineCount; i++) {
            page.drawLine({
              start: { x: margin, y },
              end: { x: pageWidth - margin, y },
              thickness: 0.5,
              color: colors.secondary,
            })
            y -= 22
          }
          y -= 10
        }
        y -= 15
      }
      
      // Add quote at bottom if available
      if (quotes && quotes.length > 0) {
        const quote = quotes[dayNum % quotes.length]
        if (quote && y > margin + 50) {
          page.drawLine({
            start: { x: margin + 50, y: margin + 45 },
            end: { x: pageWidth - margin - 50, y: margin + 45 },
            thickness: 0.5,
            color: colors.accent,
          })
          
          const quoteText = `"${sanitizeText(quote.text)}"`
          const quoteLines = wrapText(quoteText, italicFont, 9, contentWidth - 60)
          let quoteY = margin + 35
          quoteLines.forEach(line => {
            const lineWidth = italicFont.widthOfTextAtSize(line, 9)
            page.drawText(line, {
              x: pageWidth / 2 - lineWidth / 2,
              y: quoteY,
              size: 9,
              font: italicFont,
              color: colors.secondary,
            })
            quoteY -= 12
          })
          
          if (quote.author) {
            const authorText = `- ${sanitizeText(quote.author)}`
            const authorWidth = regularFont.widthOfTextAtSize(authorText, 8)
            page.drawText(authorText, {
              x: pageWidth / 2 - authorWidth / 2,
              y: quoteY - 5,
              size: 8,
              font: regularFont,
              color: colors.secondary,
            })
          }
        }
      }
      
      // Weekly reflection page (every 7 days)
      if (dayNum % 7 === 0 && weeklyReflection) {
        page = pdfDoc.addPage([pageWidth, pageHeight])
        page.drawRectangle({ x: 0, y: 0, width: pageWidth, height: pageHeight, color: colors.background })
        
        // Colored header box
        page.drawRectangle({
          x: 0,
          y: pageHeight - 80,
          width: pageWidth,
          height: 80,
          color: colors.accent,
        })
        
        page.drawText(sanitizeText(weeklyReflection.title || 'Weekly Reflection'), {
          x: margin,
          y: pageHeight - 50,
          size: 20,
          font: boldFont,
          color: colors.primary,
        })
        
        page.drawText(`Week ${Math.ceil(dayNum / 7)}`, {
          x: margin,
          y: pageHeight - 70,
          size: 12,
          font: regularFont,
          color: colors.secondary,
        })
        
        y = pageHeight - 110
        
        for (const question of (weeklyReflection.questions || [])) {
          if (y < margin + 100) break
          
          page.drawText(sanitizeText(question), {
            x: margin,
            y,
            size: 11,
            font: boldFont,
            color: colors.text,
          })
          y -= 22
          
          // Lines for writing
          for (let i = 0; i < 5; i++) {
            page.drawLine({
              start: { x: margin, y },
              end: { x: pageWidth - margin, y },
              thickness: 0.5,
              color: colors.secondary,
            })
            y -= 22
          }
          y -= 20
        }
      }
    }
    
    // ===== MONTHLY REVIEW PAGES =====
    if (monthlyReview && monthlyReview.questions) {
      const monthCount = Math.ceil(pageCount / 30)
      for (let month = 1; month <= monthCount; month++) {
        page = pdfDoc.addPage([pageWidth, pageHeight])
        page.drawRectangle({ x: 0, y: 0, width: pageWidth, height: pageHeight, color: colors.background })
        
        // Colored header
        page.drawRectangle({
          x: 0,
          y: pageHeight - 80,
          width: pageWidth,
          height: 80,
          color: colors.primary,
        })
        
        page.drawText(sanitizeText(monthlyReview.title || 'Monthly Review'), {
          x: margin,
          y: pageHeight - 50,
          size: 20,
          font: boldFont,
          color: colors.background,
        })
        
        page.drawText(`Month ${month}`, {
          x: margin,
          y: pageHeight - 70,
          size: 12,
          font: regularFont,
          color: colors.accent,
        })
        
        let y = pageHeight - 110
        
        for (const question of monthlyReview.questions) {
          if (y < margin + 100) break
          
          page.drawText(sanitizeText(question), {
            x: margin,
            y,
            size: 11,
            font: boldFont,
            color: colors.text,
          })
          y -= 22
          
          for (let i = 0; i < 6; i++) {
            page.drawLine({
              start: { x: margin, y },
              end: { x: pageWidth - margin, y },
              thickness: 0.5,
              color: colors.secondary,
            })
            y -= 22
          }
          y -= 20
        }
      }
    }
    
    // Save PDF
    const pdfBytes = await pdfDoc.save()
    
    const outputDir = '/app/public/journals'
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
      description: sanitizeText(cover.subtitle),
      filePath: `/journals/${fileName}`,
      fileSize: pdfBytes.length,
      tool: 'journal-maker',
      metadata: {
        authorName: cover.authorName,
        journalType,
        pageCount,
        colorScheme,
        coverStyle
      },
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    })
    
    console.log(`Journal PDF generated: ${filePath}`)
    
    return NextResponse.json({
      success: true,
      downloadUrl: `/journals/${fileName}`,
      pageCount: pdfDoc.getPageCount(),
      libraryId: documentId
    })
    
  } catch (error) {
    console.error('Journal PDF generation error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to generate PDF' },
      { status: 500 }
    )
  }
}
