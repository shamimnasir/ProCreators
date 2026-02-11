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
import { generatePDFFromHTML, generateEbookHTML } from '@/lib/html-pdf-generator'
import { enforceRateLimit } from '@/lib/rate-limiter'

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

// ===== SAFE TEXT UTILITIES FOR COMPLEX SCRIPTS (Bengali, Hindi, etc.) =====

// Safe text width calculation that handles Unicode/complex scripts
function safeGetTextWidth(text, font, fontSize) {
  if (!text) return 0
  try {
    return font.widthOfTextAtSize(text, fontSize)
  } catch (e) {
    // Fallback for complex scripts where glyph lookup fails
    return text.length * fontSize * 0.55
  }
}

// Safe text drawing that handles Unicode/complex scripts
function safeDrawText(page, text, options) {
  if (!text) return true
  try {
    page.drawText(text, options)
    return true
  } catch (e) {
    // For complex scripts, the font may not support all glyphs
    // Try to draw what we can
    try {
      // Attempt to draw character by character, skipping problematic ones
      let xPos = options.x
      for (let i = 0; i < text.length; i++) {
        const char = text[i]
        try {
          page.drawText(char, { ...options, x: xPos })
          xPos += safeGetTextWidth(char, options.font, options.size)
        } catch (charError) {
          // Skip this character, add estimated space
          xPos += options.size * 0.5
        }
      }
      return true
    } catch (fallbackError) {
      // Complete failure - skip this text
      return false
    }
  }
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
    // Use safe width calculation
    const width = safeGetTextWidth(testLine, font, fontSize)
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

// Parse and render rich formatted content
// Supports: ## Headings, **bold**, *italic*, > quotes, - bullets, [HIGHLIGHT] boxes
function parseRichContent(content) {
  if (!content) return []
  
  const blocks = []
  const lines = content.split('\n')
  let i = 0
  
  while (i < lines.length) {
    const line = lines[i].trim()
    
    // Skip empty lines
    if (!line) {
      i++
      continue
    }
    
    // Heading (## or ###)
    if (line.startsWith('## ')) {
      blocks.push({ type: 'heading', level: 2, text: line.substring(3).trim() })
      i++
      continue
    }
    if (line.startsWith('### ')) {
      blocks.push({ type: 'heading', level: 3, text: line.substring(4).trim() })
      i++
      continue
    }
    if (line.startsWith('# ')) {
      blocks.push({ type: 'heading', level: 1, text: line.substring(2).trim() })
      i++
      continue
    }
    
    // Quote block (> at start)
    if (line.startsWith('>')) {
      const quoteLines = [line.substring(1).trim()]
      i++
      while (i < lines.length && lines[i].trim().startsWith('>')) {
        quoteLines.push(lines[i].trim().substring(1).trim())
        i++
      }
      blocks.push({ type: 'quote', text: quoteLines.join(' ') })
      continue
    }
    
    // Highlight box [HIGHLIGHT] or [NOTE] or [TIP]
    if (line.match(/^\[(HIGHLIGHT|NOTE|TIP|IMPORTANT|WARNING)\]/i)) {
      const match = line.match(/^\[(HIGHLIGHT|NOTE|TIP|IMPORTANT|WARNING)\]\s*(.*)/i)
      const boxType = match[1].toUpperCase()
      const boxLines = [match[2] || '']
      i++
      // Continue until next block indicator or empty line
      while (i < lines.length && lines[i].trim() && 
             !lines[i].trim().startsWith('#') && 
             !lines[i].trim().startsWith('[') &&
             !lines[i].trim().startsWith('>') &&
             !lines[i].trim().match(/^[-*]\s/)) {
        boxLines.push(lines[i].trim())
        i++
      }
      blocks.push({ type: 'box', boxType, text: boxLines.join(' ').trim() })
      continue
    }
    
    // Bullet list (- or * at start)
    if (line.match(/^[-*]\s/)) {
      const bullets = [line.substring(2).trim()]
      i++
      while (i < lines.length && lines[i].trim().match(/^[-*]\s/)) {
        bullets.push(lines[i].trim().substring(2).trim())
        i++
      }
      blocks.push({ type: 'bullets', items: bullets })
      continue
    }
    
    // Numbered list (1. 2. etc)
    if (line.match(/^\d+\.\s/)) {
      const items = [line.replace(/^\d+\.\s/, '').trim()]
      i++
      while (i < lines.length && lines[i].trim().match(/^\d+\.\s/)) {
        items.push(lines[i].trim().replace(/^\d+\.\s/, '').trim())
        i++
      }
      blocks.push({ type: 'numbered', items })
      continue
    }
    
    // Regular paragraph - collect consecutive non-special lines
    const paraLines = [line]
    i++
    while (i < lines.length && lines[i].trim() && 
           !lines[i].trim().startsWith('#') && 
           !lines[i].trim().startsWith('>') &&
           !lines[i].trim().startsWith('[') &&
           !lines[i].trim().match(/^[-*]\s/) &&
           !lines[i].trim().match(/^\d+\.\s/)) {
      paraLines.push(lines[i].trim())
      i++
    }
    blocks.push({ type: 'paragraph', text: paraLines.join(' ') })
  }
  
  return blocks
}

// Render rich content blocks to PDF
function renderRichContent(pdfDoc, page, blocks, options) {
  const { 
    margin, pageWidth, pageHeight, contentWidth, 
    regularFont, boldFont, italicFont, colors, lineHeight,
    safeDrawText, safeGetTextWidth 
  } = options
  
  let currentPage = page
  let y = options.startY
  
  const newPage = () => {
    currentPage = pdfDoc.addPage([pageWidth, pageHeight])
    currentPage.drawRectangle({ x: 0, y: 0, width: pageWidth, height: pageHeight, color: colors.background })
    y = pageHeight - margin - 50
    return currentPage
  }
  
  for (const block of blocks) {
    // Check if need new page
    if (y < margin + 80) {
      currentPage = newPage()
    }
    
    switch (block.type) {
      case 'heading':
        y -= 15 // Space before heading
        const headingSize = block.level === 1 ? 18 : (block.level === 2 ? 15 : 13)
        safeDrawText(currentPage, block.text, {
          x: margin,
          y,
          size: headingSize,
          font: boldFont,
          color: colors.primary
        })
        y -= headingSize + 12
        break
        
      case 'quote':
        y -= 8
        // Draw quote background
        const quoteLines = wrapText(block.text, italicFont, 10, contentWidth - 40)
        const quoteHeight = quoteLines.length * 14 + 16
        
        if (y - quoteHeight < margin + 50) currentPage = newPage()
        
        currentPage.drawRectangle({
          x: margin + 10,
          y: y - quoteHeight + 10,
          width: contentWidth - 20,
          height: quoteHeight,
          color: colors.accent,
        })
        currentPage.drawRectangle({
          x: margin + 10,
          y: y - quoteHeight + 10,
          width: 4,
          height: quoteHeight,
          color: colors.secondary,
        })
        
        // Draw quote mark
        safeDrawText(currentPage, '"', {
          x: margin + 20,
          y: y - 4,
          size: 20,
          font: boldFont,
          color: colors.secondary
        })
        
        let quoteY = y - 12
        for (const line of quoteLines) {
          safeDrawText(currentPage, line, {
            x: margin + 35,
            y: quoteY,
            size: 10,
            font: italicFont,
            color: colors.text
          })
          quoteY -= 14
        }
        y -= quoteHeight + 10
        break
        
      case 'box':
        y -= 10
        const boxLines = wrapText(block.text, regularFont, 11, contentWidth - 30)
        const boxHeight = boxLines.length * 15 + 20
        
        if (y - boxHeight < margin + 50) currentPage = newPage()
        
        // Box colors based on type - clean design without labels
        let boxBorderColor = colors.primary
        let boxBgColor = colors.accent
        if (block.boxType === 'WARNING') {
          boxBorderColor = rgb(0.9, 0.4, 0.2)
          boxBgColor = rgb(1, 0.95, 0.9) // Light orange/cream
        } else if (block.boxType === 'TIP') {
          boxBorderColor = rgb(0.2, 0.7, 0.4)
          boxBgColor = rgb(0.93, 0.98, 0.93) // Light green
        } else if (block.boxType === 'NOTE') {
          boxBorderColor = rgb(0.3, 0.5, 0.8)
          boxBgColor = rgb(0.93, 0.96, 1) // Light blue
        } else if (block.boxType === 'HIGHLIGHT' || block.boxType === 'IMPORTANT') {
          boxBorderColor = rgb(0.6, 0.4, 0.8)
          boxBgColor = rgb(0.97, 0.95, 1) // Light purple
        }
        
        // Draw box background
        currentPage.drawRectangle({
          x: margin,
          y: y - boxHeight + 10,
          width: contentWidth,
          height: boxHeight,
          color: boxBgColor,
        })
        // Left accent border
        currentPage.drawRectangle({
          x: margin,
          y: y - boxHeight + 10,
          width: 4,
          height: boxHeight,
          color: boxBorderColor,
        })
        
        // Content only - no label, clean design
        let boxY = y - 8
        for (const line of boxLines) {
          safeDrawText(currentPage, line, {
            x: margin + 15,
            y: boxY,
            size: 11,
            font: regularFont,
            color: colors.text
          })
          boxY -= 15
        }
        y -= boxHeight + 12
        break
        
      case 'bullets':
        y -= 5
        for (const item of block.items) {
          if (y < margin + 60) currentPage = newPage()
          
          currentPage.drawCircle({ 
            x: margin + 10, 
            y: y + 4, 
            size: 3, 
            color: colors.primary 
          })
          
          const bulletLines = wrapText(item, regularFont, 11, contentWidth - 25)
          for (let li = 0; li < bulletLines.length; li++) {
            safeDrawText(currentPage, bulletLines[li], {
              x: margin + 20,
              y: y - (li * lineHeight),
              size: 11,
              font: regularFont,
              color: colors.text
            })
          }
          y -= bulletLines.length * lineHeight + 5
        }
        y -= 10
        break
        
      case 'numbered':
        y -= 5
        for (let ni = 0; ni < block.items.length; ni++) {
          if (y < margin + 60) currentPage = newPage()
          
          safeDrawText(currentPage, `${ni + 1}.`, {
            x: margin + 5,
            y,
            size: 11,
            font: boldFont,
            color: colors.primary
          })
          
          const numLines = wrapText(block.items[ni], regularFont, 11, contentWidth - 25)
          for (let li = 0; li < numLines.length; li++) {
            safeDrawText(currentPage, numLines[li], {
              x: margin + 22,
              y: y - (li * lineHeight),
              size: 11,
              font: regularFont,
              color: colors.text
            })
          }
          y -= numLines.length * lineHeight + 5
        }
        y -= 10
        break
        
      case 'paragraph':
      default:
        // Handle **bold** and *italic* inline formatting
        const paraText = block.text || block
        // Remove markdown formatting for line wrapping calculation, but keep for rendering
        const cleanParaText = paraText.replace(/\*\*([^*]+)\*\*/g, '$1').replace(/\*([^*]+)\*/g, '$1')
        const paraLines = wrapText(cleanParaText, regularFont, 11, contentWidth)
        
        // Render with inline formatting support
        for (const line of paraLines) {
          if (y < margin + 60) currentPage = newPage()
          
          // Check if original text has formatting and render appropriately
          // For simplicity, render the plain line (full inline formatting would need complex parsing)
          safeDrawText(currentPage, line, {
            x: margin,
            y,
            size: 11,
            font: regularFont,
            color: colors.text
          })
          y -= lineHeight
        }
        y -= 8 // Extra space between paragraphs
        break
    }
  }
  
  return { page: currentPage, y }
}

export async function POST(request) {
  try {
    // SECURITY: Rate limiting for content generation
    const rateLimitCheck = await enforceRateLimit(request, 'content_generate')
    if (rateLimitCheck.limited) {
      return rateLimitCheck.response
    }

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
    
    const colorScheme = settings?.colorScheme || 'ocean-blue'
    const customColor = settings?.customColor || null
    const coverStyle = settings?.coverStyle || 'elegant'
    const genre = settings?.genre || 'non-fiction'
    
    // Detect if content contains non-Latin characters (Bengali, Hindi, etc.)
    const contentSample = `${cover.title} ${cover.subtitle || ''} ${chapters.map(c => c.title).join(' ')}`
    const needsUnicodeFont = hasNonLatinChars(contentSample)
    
    // For complex scripts (Bengali, Hindi, Arabic, etc.), use HTML-to-PDF approach
    // which properly handles ligatures, conjuncts, and RTL text
    if (needsUnicodeFont) {
      try {
        // Generate HTML content
        const htmlContent = generateEbookHTML({
          cover,
          introduction,
          chapters,
          conclusion,
          settings: {
            ...settings,
            customColor: customColor || (colorScheme === 'custom' ? settings?.customColor : 
              PDF_COLOR_SCHEMES[colorScheme]?.coverGradient?.[0] || '#3b82f6')
          }
        })
        
        // Generate PDF from HTML
        const pdfBuffer = await generatePDFFromHTML(htmlContent)
        
        // Save PDF
        const ebooksDir = path.join(process.cwd(), 'public', 'ebooks')
        await fs.mkdir(ebooksDir, { recursive: true })
        
        const filename = `${randomUUID()}.pdf`
        const filePath = path.join(ebooksDir, filename)
        await fs.writeFile(filePath, pdfBuffer)
        
        // Save to library
        const library = await getCollection('library')
        const libraryEntry = {
          id: randomUUID(),
          url: `/ebooks/${filename}`,
          filePath: `/ebooks/${filename}`,
          title: cover.title,
          type: 'document',
          tool: 'ebook-maker',
          metadata: {
            subtitle: cover.subtitle,
            authorName: cover.authorName,
            chaptersCount: chapters.length,
            colorScheme,
            renderMethod: 'html-to-pdf'
          },
          createdAt: new Date().toISOString()
        }
        
        await library.insertOne(libraryEntry)
        
        :', filePath)
        
        return NextResponse.json({
          success: true,
          url: `/ebooks/${filename}`,
          downloadUrl: `/ebooks/${filename}`,
          title: cover.title,
          pageCount: chapters.length * 3 + 5, // Estimated pages
          message: 'Ebook PDF generated with proper complex script support'
        })
      } catch (htmlError) {
        console.error('HTML-to-PDF generation failed:', htmlError.message)
        // Fall through to pdf-lib method
      }
    }
    
    // For Latin scripts OR as fallback, use pdf-lib method
    
    // Generate cover image if requested
    let coverImageUrl = null
    if (settings?.generateCoverImage !== false) {
      try {
        const coverImageStyle = settings?.coverImageStyle || 'abstract'
        const customImagePrompt = settings?.customImagePrompt || ''
        
        // For custom prompts, use the user's description directly
        if (coverImageStyle === 'custom' && customImagePrompt) {
          }...`)
          const imageResult = await generateCoverImage('default-elegant', customImagePrompt)
          if (imageResult.success && imageResult.imageUrl) {
            coverImageUrl = imageResult.imageUrl
            }
        } else {
          // Use theme-based prompt
          const themeKey = getEbookTheme(genre)
          const imageResult = await generateCoverImage(themeKey)
          if (imageResult.success && imageResult.imageUrl) {
            coverImageUrl = imageResult.imageUrl
            }
        }
      } catch (imgError) {
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
          
          if (!regularFont || !boldFont) {
            throw new Error('Font embedding returned null')
          }
          
          } else {
          // Fallback to standard Noto Sans for other scripts
          const notoRegularPath = path.join(process.cwd(), 'public/fonts/NotoSans-Regular.ttf')
          const notoBoldPath = path.join(process.cwd(), 'public/fonts/NotoSans-Bold.ttf')
          
          const regularFontBytes = await fs.readFile(notoRegularPath)
          const boldFontBytes = await fs.readFile(notoBoldPath)
          
          regularFont = await pdfDoc.embedFont(regularFontBytes, { subset: false })
          boldFont = await pdfDoc.embedFont(boldFontBytes, { subset: false })
          italicFont = regularFont
          
          }
      } catch (fontError) {
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
    
    // Final validation - ensure fonts are not null
    if (!regularFont || !boldFont) {
      regularFont = await pdfDoc.embedFont(StandardFonts.TimesRoman)
      boldFont = await pdfDoc.embedFont(StandardFonts.TimesRomanBold)
      italicFont = await pdfDoc.embedFont(StandardFonts.TimesRomanItalic)
    }
    
    // Page setup - use 6x9 (most popular) by default, with proper margins
    // Import dynamic margins based on page count for proper KDP compliance
    const { getMargins } = await import('@/lib/paper-sizes')
    
    const pageWidth = 432   // 6 inches * 72 points
    const pageHeight = 648  // 9 inches * 72 points
    
    // Calculate page count for margin determination
    const estimatedPageCount = Math.max(chapters.length * 5, 24) // Rough estimate
    const margins = getMargins(estimatedPageCount, false) // No bleed for ebooks typically
    
    // Use inside margin (gutter) as base - accounts for binding
    const margin = margins.inside.points // Dynamic based on page count
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
    
    safeDrawText(page, 'Table of Contents', {
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
      safeDrawText(page, 'Introduction', { x: margin + 25, y, size: 13, font: regularFont, color: colors.text })
      y -= 35
    }
    
    // Chapters
    chapters.forEach((ch, idx) => {
      const chapterText = sanitizeText(`Chapter ${idx + 1}: ${ch.title}`)
      page.drawCircle({ x: margin + 10, y: y + 4, size: 3, color: colors.primary })
      safeDrawText(page, chapterText, { x: margin + 25, y, size: 13, font: regularFont, color: colors.text })
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
      safeDrawText(page, 'Conclusion', { x: margin + 25, y, size: 13, font: regularFont, color: colors.text })
    }
    
    // ===== INTRODUCTION =====
    if (introduction?.content) {
      page = pdfDoc.addPage([pageWidth, pageHeight])
      page.drawRectangle({ x: 0, y: 0, width: pageWidth, height: pageHeight, color: colors.background })
      
      page.drawRectangle({ x: margin - 10, y: pageHeight - margin - 40, width: 4, height: 35, color: colors.primary })
      safeDrawText(page, 'Introduction', {
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
      
      // Parse and render rich content (supports headings, quotes, bullets, highlight boxes)
      const introBlocks = parseRichContent(introduction.content)
      const introResult = renderRichContent(pdfDoc, page, introBlocks, {
        margin, pageWidth, pageHeight, contentWidth,
        regularFont, boldFont, italicFont, colors, lineHeight,
        safeDrawText, safeGetTextWidth,
        startY: pageHeight - margin - 85
      })
      page = introResult.page
      y = introResult.y
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
      safeDrawText(page, `Chapter ${chIdx + 1}`, {
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
        safeDrawText(page, line, { x: margin, y, size: 22, font: boldFont, color: colors.primary })
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
            safeDrawText(page, sanitizeText(section.heading), {
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
                safeDrawText(page, line, { x: margin, y, size: 11, font: regularFont, color: colors.text })
                y -= lineHeight
              }
              y -= 8 // Extra space between paragraphs
            }
          }
          
          // Section tips (Pro Tips / Quick Tips callout boxes) - clean design without duplicate labels
          if (section.tips && section.tips.length > 0) {
            for (const tip of section.tips) {
              if (y < margin + 80) {
                page = pdfDoc.addPage([pageWidth, pageHeight])
                page.drawRectangle({ x: 0, y: 0, width: pageWidth, height: pageHeight, color: colors.background })
                y = pageHeight - margin - 50
              }
              
              // Clean the tip text - remove any "Pro Tip:" or "Tip:" prefix to avoid duplication
              const cleanTip = tip.replace(/^(Pro\s*Tip|Tip|Quick\s*Tip)\s*[:：]\s*/i, '').trim()
              
              y -= 10
              const tipLines = wrapText(cleanTip, regularFont, 11, contentWidth - 30)
              const tipBoxHeight = 12 + (tipLines.length * 15)
              
              // Tip box background - light green tint
              page.drawRectangle({
                x: margin + 10,
                y: y - tipBoxHeight + 10,
                width: contentWidth - 20,
                height: tipBoxHeight,
                color: rgb(0.93, 0.98, 0.93),
              })
              
              // Tip box left border - green accent
              page.drawRectangle({
                x: margin + 10,
                y: y - tipBoxHeight + 10,
                width: 4,
                height: tipBoxHeight,
                color: rgb(0.2, 0.7, 0.4),
              })
              
              // Tip content only - no separate label
              let tipY = y - 5
              tipLines.forEach((line) => {
                safeDrawText(page, line, { 
                  x: margin + 22, 
                  y: tipY, 
                  size: 11, 
                  font: regularFont, 
                  color: colors.text 
                })
                tipY -= 15
              })
              y -= tipBoxHeight + 8
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
                safeDrawText(page, line, { 
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
        // Parse and render rich content (supports headings, quotes, bullets, highlight boxes)
        const chapterBlocks = parseRichContent(chapter.content)
        const chapterResult = renderRichContent(pdfDoc, page, chapterBlocks, {
          margin, pageWidth, pageHeight, contentWidth,
          regularFont, boldFont, italicFont, colors, lineHeight,
          safeDrawText, safeGetTextWidth,
          startY: y
        })
        page = chapterResult.page
        y = chapterResult.y
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
        
        safeDrawText(page, 'Key Takeaways', { 
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
            safeDrawText(page, line, { 
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
      safeDrawText(page, 'Conclusion', {
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
      
      // Parse and render rich content
      const conclusionBlocks = parseRichContent(conclusion.content)
      const conclusionResult = renderRichContent(pdfDoc, page, conclusionBlocks, {
        margin, pageWidth, pageHeight, contentWidth,
        regularFont, boldFont, italicFont, colors, lineHeight,
        safeDrawText, safeGetTextWidth,
        startY: pageHeight - margin - 85
      })
      page = conclusionResult.page
      y = conclusionResult.y
    }
    
    // ===== ABOUT AUTHOR =====
    if (cover.authorName && cover.authorBio) {
      page = pdfDoc.addPage([pageWidth, pageHeight])
      page.drawRectangle({ x: 0, y: 0, width: pageWidth, height: pageHeight, color: colors.background })
      
      page.drawRectangle({ x: margin - 10, y: pageHeight - margin - 40, width: 4, height: 35, color: colors.primary })
      safeDrawText(page, 'About the Author', {
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
        safeDrawText(page, line, { x: margin, y, size: 11, font: regularFont, color: colors.text })
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
