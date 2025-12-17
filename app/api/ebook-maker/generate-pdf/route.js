// CRITICAL: Load regenerator-runtime FIRST before any fontkit usage
// This polyfill is required for @pdf-lib/fontkit's async generators
require('regenerator-runtime/runtime')

import { NextResponse } from 'next/server'
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import * as fontkit from '@pdf-lib/fontkit'
import { getCollection } from '@/lib/mongodb'
import { randomUUID } from 'crypto'
import fs from 'fs/promises'
import path from 'path'
import { 
  PDF_COLOR_SCHEMES, 
  COVER_STYLES, 
  drawCoverPageWithImage,
  drawCoverPage,
  getCurrentYear,
  generateCustomColors
} from '@/lib/pdf-design'
import { generateCoverImage, getEbookTheme } from '@/lib/cover-image-generator'

// Helper to sanitize text - PRESERVES Unicode characters (Bengali, Hindi, Chinese, etc.)
function sanitizeText(text, preserveNewlines = false) {
  if (!text) return ''
  let result = String(text)
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/\u2026/g, '...')
    .replace(/\u2013/g, '-')
    .replace(/\u2014/g, '--')
    .replace(/\u00A0/g, ' ')
    // Only remove control characters, NOT Unicode letters
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
  
  if (preserveNewlines) {
    result = result.replace(/\n{3,}/g, '\n\n').replace(/[ \t]+/g, ' ')
  } else {
    result = result.replace(/[\r\n\t]/g, ' ').replace(/\s+/g, ' ')
  }
  
  return result.trim()
}

// Helper to sanitize text for single lines (removes newlines)
function sanitizeForLine(text) {
  return sanitizeText(text, false)
}

// Helper to sanitize content (preserves paragraph structure)
function sanitizeContent(text) {
  return sanitizeText(text, true)
}

// Detect if text contains non-Latin characters
function hasNonLatinChars(text) {
  if (!text) return false
  // Bengali, Hindi, Chinese, Arabic, Japanese, Korean, etc.
  return /[\u0900-\u097F\u0980-\u09FF\u0600-\u06FF\u4E00-\u9FFF\u3040-\u309F\u30A0-\u30FF\uAC00-\uD7AF\u0B80-\u0BFF\u0C00-\u0C7F]/.test(text)
}

// Transliterate text for PDF if needed (fallback for fonts that don't support Unicode)
function getDisplayText(text, font, fontSize) {
  if (!text) return ''
  
  // Check if font can render the text
  try {
    // Try to get width - if it fails, the font doesn't support the characters
    font.widthOfTextAtSize(text, fontSize)
    return text
  } catch (e) {
    // Font doesn't support these characters - we'll need to skip or use fallback
    // For now, return the text as-is (PDF will show boxes for unsupported chars)
    return text
  }
}

// Helper to wrap text (for single line/paragraph - strips newlines)
function wrapText(text, font, fontSize, maxWidth) {
  const cleanText = sanitizeForLine(text || '')
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
      chapters,
      conclusion,
      settings
    } = await request.json()
    
    if (!cover?.title || !chapters?.length) {
      return NextResponse.json(
        { success: false, error: 'Cover title and at least one chapter are required' },
        { status: 400 }
      )
    }
    
    console.log(`Generating ebook PDF: "${cover.title}" with ${chapters.length} chapters...`)
    
    const colorScheme = settings?.colorScheme || 'ocean-blue'
    const customColor = settings?.customColor || null
    const coverStyle = settings?.coverStyle || 'elegant'
    const genre = settings?.genre || 'non-fiction'
    
    // Detect if content contains non-Latin characters (Bengali, Hindi, etc.)
    const contentSample = `${cover.title} ${cover.subtitle || ''} ${chapters.map(c => c.title).join(' ')}`
    const needsUnicodeFont = hasNonLatinChars(contentSample)
    
    if (needsUnicodeFont) {
      console.log('Detected non-Latin characters, using Unicode font...')
    }
    
    // Generate cover image if requested
    let coverImageUrl = null
    if (settings?.generateCoverImage !== false) {
      try {
        const themeKey = getEbookTheme(genre)
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
    
    // Register fontkit for custom font support (Unicode)
    // fontkit is imported as namespace, use .default if available
    const fontkitInstance = fontkit.default || fontkit
    pdfDoc.registerFontkit(fontkitInstance)
    
    // Embed fonts - use Unicode fonts if needed
    let regularFont, boldFont, italicFont
    
    if (needsUnicodeFont) {
      // Load custom Unicode fonts for non-Latin scripts
      try {
        // Check if Bengali (most common Unicode request based on user's case)
        const hasBengali = /[\u0980-\u09FF]/.test(contentSample)
        
        if (hasBengali) {
          // Load Bengali font with subset: false for full Unicode support
          const bengaliRegularPath = path.join(process.cwd(), 'public/fonts/NotoSansBengali-Regular.ttf')
          const bengaliBoldPath = path.join(process.cwd(), 'public/fonts/NotoSansBengali-Bold.ttf')
          
          const regularFontBytes = await fs.readFile(bengaliRegularPath)
          const boldFontBytes = await fs.readFile(bengaliBoldPath)
          
          // CRITICAL: Use subset: false to embed full font with all Unicode glyphs
          regularFont = await pdfDoc.embedFont(regularFontBytes, { subset: false })
          boldFont = await pdfDoc.embedFont(boldFontBytes, { subset: false })
          italicFont = regularFont // Bengali fonts typically don't have italic variant
          
          console.log('Bengali fonts embedded successfully with full Unicode support')
        } else {
          // Fallback to standard Noto Sans for other scripts
          const notoRegularPath = path.join(process.cwd(), 'public/fonts/NotoSans-Regular.ttf')
          const notoBoldPath = path.join(process.cwd(), 'public/fonts/NotoSans-Bold.ttf')
          
          const regularFontBytes = await fs.readFile(notoRegularPath)
          const boldFontBytes = await fs.readFile(notoBoldPath)
          
          regularFont = await pdfDoc.embedFont(regularFontBytes, { subset: false })
          boldFont = await pdfDoc.embedFont(boldFontBytes, { subset: false })
          italicFont = regularFont
          
          console.log('Noto Sans fonts embedded successfully')
        }
      } catch (fontError) {
        console.log('Custom font loading failed, falling back to standard fonts:', fontError.message)
        regularFont = await pdfDoc.embedFont(StandardFonts.TimesRoman)
        boldFont = await pdfDoc.embedFont(StandardFonts.TimesRomanBold)
        italicFont = await pdfDoc.embedFont(StandardFonts.TimesRomanItalic)
      }
    } else {
      // Use standard PDF fonts for Latin text
      regularFont = await pdfDoc.embedFont(StandardFonts.TimesRoman)
      boldFont = await pdfDoc.embedFont(StandardFonts.TimesRomanBold)
      italicFont = await pdfDoc.embedFont(StandardFonts.TimesRomanItalic)
    }
    
    const pageWidth = 612
    const pageHeight = 792
    const margin = 65
    const contentWidth = pageWidth - (margin * 2)
    const lineHeight = 20
    
    // Get colors - either from preset or generate custom
    let colors
    if (colorScheme === 'custom' && customColor) {
      colors = generateCustomColors(customColor)
    } else {
      colors = PDF_COLOR_SCHEMES[colorScheme] || PDF_COLOR_SCHEMES['ocean-blue']
    }
    const coverStyleObj = COVER_STYLES[coverStyle] || COVER_STYLES['elegant']
    
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
    
    // ===== TABLE OF CONTENTS =====
    page = pdfDoc.addPage([pageWidth, pageHeight])
    page.drawRectangle({ x: 0, y: 0, width: pageWidth, height: pageHeight, color: colors.background })
    
    page.drawText('Table of Contents', {
      x: margin,
      y: pageHeight - margin - 30,
      size: 26,
      font: boldFont,
      color: colors.primary
    })
    
    page.drawLine({
      start: { x: margin, y: pageHeight - margin - 45 },
      end: { x: pageWidth - margin, y: pageHeight - margin - 45 },
      thickness: 2,
      color: colors.secondary,
    })
    
    let y = pageHeight - margin - 80
    
    // Introduction
    if (introduction?.content) {
      page.drawCircle({ x: margin + 10, y: y + 4, size: 3, color: colors.primary })
      page.drawText('Introduction', { x: margin + 25, y, size: 13, font: regularFont, color: colors.text })
      y -= 35
    }
    
    // Chapters
    chapters.forEach((ch, idx) => {
      const chapterText = sanitizeText(`Chapter ${idx + 1}: ${ch.title}`)
      page.drawCircle({ x: margin + 10, y: y + 4, size: 3, color: colors.primary })
      page.drawText(chapterText, { x: margin + 25, y, size: 13, font: regularFont, color: colors.text })
      y -= 35
      
      if (y < margin + 50) {
        page = pdfDoc.addPage([pageWidth, pageHeight])
        page.drawRectangle({ x: 0, y: 0, width: pageWidth, height: pageHeight, color: colors.background })
        y = pageHeight - margin - 50
      }
    })
    
    // Conclusion
    if (conclusion?.content) {
      page.drawCircle({ x: margin + 10, y: y + 4, size: 3, color: colors.primary })
      page.drawText('Conclusion', { x: margin + 25, y, size: 13, font: regularFont, color: colors.text })
    }
    
    // ===== INTRODUCTION =====
    if (introduction?.content) {
      page = pdfDoc.addPage([pageWidth, pageHeight])
      page.drawRectangle({ x: 0, y: 0, width: pageWidth, height: pageHeight, color: colors.background })
      
      page.drawRectangle({ x: margin - 10, y: pageHeight - margin - 40, width: 4, height: 35, color: colors.primary })
      page.drawText('Introduction', {
        x: margin,
        y: pageHeight - margin - 30,
        size: 26,
        font: boldFont,
        color: colors.primary
      })
      
      page.drawLine({
        start: { x: margin, y: pageHeight - margin - 48 },
        end: { x: margin + 150, y: pageHeight - margin - 48 },
        thickness: 2,
        color: colors.secondary,
      })
      
      y = pageHeight - margin - 85
      const introLines = wrapText(introduction.content, regularFont, 11, contentWidth)
      for (const line of introLines) {
        if (y < margin + 60) {
          page = pdfDoc.addPage([pageWidth, pageHeight])
          page.drawRectangle({ x: 0, y: 0, width: pageWidth, height: pageHeight, color: colors.background })
          y = pageHeight - margin - 50
        }
        page.drawText(line, { x: margin, y, size: 11, font: regularFont, color: colors.text })
        y -= lineHeight
      }
    }
    
    // ===== CHAPTERS =====
    for (let chIdx = 0; chIdx < chapters.length; chIdx++) {
      const chapter = chapters[chIdx]
      
      page = pdfDoc.addPage([pageWidth, pageHeight])
      page.drawRectangle({ x: 0, y: 0, width: pageWidth, height: pageHeight, color: colors.background })
      
      // Chapter number badge
      page.drawRectangle({
        x: margin - 10,
        y: pageHeight - margin - 20,
        width: 80,
        height: 25,
        color: colors.primary,
      })
      page.drawText(`Chapter ${chIdx + 1}`, {
        x: margin - 5,
        y: pageHeight - margin - 14,
        size: 11,
        font: boldFont,
        color: colors.background,
      })
      
      // Chapter title
      const chapterTitleLines = wrapText(chapter.title, boldFont, 22, contentWidth)
      y = pageHeight - margin - 55
      chapterTitleLines.forEach(line => {
        page.drawText(line, { x: margin, y, size: 22, font: boldFont, color: colors.primary })
        y -= 28
      })
      
      page.drawLine({
        start: { x: margin, y: y + 8 },
        end: { x: margin + 180, y: y + 8 },
        thickness: 2,
        color: colors.secondary,
      })
      
      y -= 30
      
      // Chapter content (with sections if available)
      if (chapter.sections && chapter.sections.length > 0) {
        for (const section of chapter.sections) {
          // Section heading
          if (section.heading) {
            if (y < margin + 120) {
              page = pdfDoc.addPage([pageWidth, pageHeight])
              page.drawRectangle({ x: 0, y: 0, width: pageWidth, height: pageHeight, color: colors.background })
              y = pageHeight - margin - 50
            }
            
            y -= 18
            page.drawText(sanitizeText(section.heading), {
              x: margin,
              y,
              size: 14,
              font: boldFont,
              color: colors.secondary
            })
            y -= 22
          }
          
          // Section content - now with paragraph breaks
          if (section.content) {
            // Split content by paragraph breaks (newlines)
            const paragraphs = section.content.split(/\n+/).filter(p => p.trim())
            for (const paragraph of paragraphs) {
              const lines = wrapText(paragraph.trim(), regularFont, 11, contentWidth)
              for (const line of lines) {
                if (y < margin + 60) {
                  page = pdfDoc.addPage([pageWidth, pageHeight])
                  page.drawRectangle({ x: 0, y: 0, width: pageWidth, height: pageHeight, color: colors.background })
                  y = pageHeight - margin - 50
                }
                page.drawText(line, { x: margin, y, size: 11, font: regularFont, color: colors.text })
                y -= lineHeight
              }
              y -= 8 // Extra space between paragraphs
            }
          }
          
          // Section tips (Pro Tips / Quick Tips callout boxes)
          if (section.tips && section.tips.length > 0) {
            for (const tip of section.tips) {
              if (y < margin + 80) {
                page = pdfDoc.addPage([pageWidth, pageHeight])
                page.drawRectangle({ x: 0, y: 0, width: pageWidth, height: pageHeight, color: colors.background })
                y = pageHeight - margin - 50
              }
              
              y -= 10
              const tipLines = wrapText(tip, italicFont, 10, contentWidth - 40)
              const tipBoxHeight = 20 + (tipLines.length * 14)
              
              // Tip box background
              page.drawRectangle({
                x: margin + 10,
                y: y - tipBoxHeight + 15,
                width: contentWidth - 20,
                height: tipBoxHeight,
                color: colors.accent,
              })
              
              // Tip box left border
              page.drawRectangle({
                x: margin + 10,
                y: y - tipBoxHeight + 15,
                width: 4,
                height: tipBoxHeight,
                color: colors.primary,
              })
              
              // Tip label
              page.drawText('Pro Tip', { 
                x: margin + 22, 
                y: y, 
                size: 10, 
                font: boldFont, 
                color: colors.primary 
              })
              y -= 16
              
              // Tip content
              tipLines.forEach((line) => {
                page.drawText(line, { 
                  x: margin + 22, 
                  y, 
                  size: 10, 
                  font: italicFont, 
                  color: colors.text 
                })
                y -= 14
              })
              y -= 10
            }
          }
          
          // Section bullet points
          if (section.bullets && section.bullets.length > 0) {
            y -= 5
            for (const bullet of section.bullets) {
              if (y < margin + 60) {
                page = pdfDoc.addPage([pageWidth, pageHeight])
                page.drawRectangle({ x: 0, y: 0, width: pageWidth, height: pageHeight, color: colors.background })
                y = pageHeight - margin - 50
              }
              
              // Bullet point
              page.drawCircle({ x: margin + 12, y: y + 4, size: 3, color: colors.primary })
              
              const bulletLines = wrapText(bullet, regularFont, 11, contentWidth - 30)
              bulletLines.forEach((line, lineIdx) => {
                page.drawText(line, { 
                  x: margin + 22, 
                  y: y - (lineIdx * lineHeight), 
                  size: 11, 
                  font: regularFont, 
                  color: colors.text 
                })
              })
              y -= (bulletLines.length * lineHeight) + 5
            }
            y -= 10
          }
          
          y -= 10 // Space between sections
        }
      } else if (chapter.content) {
        // Plain content (fallback) - with paragraph support
        const paragraphs = chapter.content.split(/\n\n+/).filter(p => p.trim())
        for (const paragraph of paragraphs) {
          const lines = wrapText(paragraph, regularFont, 11, contentWidth)
          for (const line of lines) {
            if (y < margin + 60) {
              page = pdfDoc.addPage([pageWidth, pageHeight])
              page.drawRectangle({ x: 0, y: 0, width: pageWidth, height: pageHeight, color: colors.background })
              y = pageHeight - margin - 50
            }
            page.drawText(line, { x: margin, y, size: 11, font: regularFont, color: colors.text })
            y -= lineHeight
          }
          y -= 12
        }
      }
      
      // Key Takeaways
      if (chapter.keyTakeaways && chapter.keyTakeaways.length > 0) {
        const boxHeight = 30 + (chapter.keyTakeaways.length * 28)
        if (y < margin + boxHeight + 50) {
          page = pdfDoc.addPage([pageWidth, pageHeight])
          page.drawRectangle({ x: 0, y: 0, width: pageWidth, height: pageHeight, color: colors.background })
          y = pageHeight - margin - 50
        }
        
        y -= 25
        
        page.drawRectangle({
          x: margin,
          y: y - boxHeight + 25,
          width: contentWidth,
          height: boxHeight,
          color: colors.accent,
          borderColor: colors.secondary,
          borderWidth: 1,
        })
        
        page.drawRectangle({
          x: margin,
          y: y - boxHeight + 25,
          width: 5,
          height: boxHeight,
          color: colors.primary,
        })
        
        page.drawText('Key Takeaways', { 
          x: margin + 18, 
          y, 
          size: 13, 
          font: boldFont, 
          color: colors.primary 
        })
        
        y -= 28
        
        chapter.keyTakeaways.forEach((takeaway) => {
          page.drawCircle({ x: margin + 20, y: y + 4, size: 3, color: colors.primary })
          const takeawayLines = wrapText(takeaway, italicFont, 10, contentWidth - 50)
          takeawayLines.forEach((line, lineIdx) => {
            page.drawText(line, { 
              x: margin + 30, 
              y: y - (lineIdx * 14), 
              size: 10, 
              font: italicFont, 
              color: colors.text 
            })
          })
          y -= 24
        })
      }
    }
    
    // ===== CONCLUSION =====
    if (conclusion?.content) {
      page = pdfDoc.addPage([pageWidth, pageHeight])
      page.drawRectangle({ x: 0, y: 0, width: pageWidth, height: pageHeight, color: colors.background })
      
      page.drawRectangle({ x: margin - 10, y: pageHeight - margin - 40, width: 4, height: 35, color: colors.primary })
      page.drawText('Conclusion', {
        x: margin,
        y: pageHeight - margin - 30,
        size: 26,
        font: boldFont,
        color: colors.primary
      })
      
      page.drawLine({
        start: { x: margin, y: pageHeight - margin - 48 },
        end: { x: margin + 130, y: pageHeight - margin - 48 },
        thickness: 2,
        color: colors.secondary,
      })
      
      y = pageHeight - margin - 85
      const conclusionLines = wrapText(conclusion.content, regularFont, 11, contentWidth)
      for (const line of conclusionLines) {
        if (y < margin + 60) {
          page = pdfDoc.addPage([pageWidth, pageHeight])
          page.drawRectangle({ x: 0, y: 0, width: pageWidth, height: pageHeight, color: colors.background })
          y = pageHeight - margin - 50
        }
        page.drawText(line, { x: margin, y, size: 11, font: regularFont, color: colors.text })
        y -= lineHeight
      }
    }
    
    // ===== ABOUT AUTHOR =====
    if (cover.authorName && cover.authorBio) {
      page = pdfDoc.addPage([pageWidth, pageHeight])
      page.drawRectangle({ x: 0, y: 0, width: pageWidth, height: pageHeight, color: colors.background })
      
      page.drawRectangle({ x: margin - 10, y: pageHeight - margin - 40, width: 4, height: 35, color: colors.primary })
      page.drawText('About the Author', {
        x: margin,
        y: pageHeight - margin - 30,
        size: 26,
        font: boldFont,
        color: colors.primary
      })
      
      page.drawLine({
        start: { x: margin, y: pageHeight - margin - 48 },
        end: { x: margin + 180, y: pageHeight - margin - 48 },
        thickness: 2,
        color: colors.secondary,
      })
      
      y = pageHeight - margin - 85
      const aboutLines = wrapText(cover.authorBio, regularFont, 11, contentWidth)
      for (const line of aboutLines) {
        page.drawText(line, { x: margin, y, size: 11, font: regularFont, color: colors.text })
        y -= lineHeight
      }
    }
    
    // Save PDF
    const pdfBytes = await pdfDoc.save()
    
    const outputDir = '/app/public/ebooks'
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
      filePath: `/ebooks/${fileName}`,
      fileSize: pdfBytes.length,
      tool: 'ebook-maker',
      metadata: {
        authorName: cover.authorName,
        chapterCount: chapters.length,
        colorScheme,
        coverStyle
      },
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    })
    
    console.log(`Ebook PDF generated: ${filePath}`)
    
    return NextResponse.json({
      success: true,
      downloadUrl: `/ebooks/${fileName}`,
      pageCount: pdfDoc.getPageCount(),
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
