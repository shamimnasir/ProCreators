import { NextResponse } from 'next/server'
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import { getCollection } from '@/lib/mongodb'
import { randomUUID } from 'crypto'
import fs from 'fs/promises'
import path from 'path'
import { drawCoverPageWithImage, PDF_COLOR_SCHEMES } from '@/lib/pdf-design'
import { generateCoverImage } from '@/lib/cover-image-generator'

// Color schemes for how-to guides
const GUIDE_COLOR_SCHEMES = {
  'professional': {
    primary: rgb(0.2, 0.35, 0.55),
    secondary: rgb(0.35, 0.5, 0.7),
    accent: rgb(0.9, 0.93, 0.97),
    background: rgb(0.98, 0.99, 1),
    text: rgb(0.15, 0.15, 0.2)
  },
  'modern': {
    primary: rgb(0.3, 0.35, 0.7),
    secondary: rgb(0.5, 0.55, 0.85),
    accent: rgb(0.92, 0.93, 0.98),
    background: rgb(0.98, 0.98, 1),
    text: rgb(0.15, 0.15, 0.25)
  },
  'warm': {
    primary: rgb(0.8, 0.45, 0.15),
    secondary: rgb(0.9, 0.6, 0.3),
    accent: rgb(0.98, 0.95, 0.9),
    background: rgb(1, 0.99, 0.97),
    text: rgb(0.25, 0.2, 0.15)
  },
  'fresh': {
    primary: rgb(0.15, 0.55, 0.4),
    secondary: rgb(0.3, 0.7, 0.55),
    accent: rgb(0.9, 0.98, 0.95),
    background: rgb(0.97, 1, 0.98),
    text: rgb(0.1, 0.2, 0.15)
  },
  'creative': {
    primary: rgb(0.55, 0.3, 0.65),
    secondary: rgb(0.7, 0.5, 0.8),
    accent: rgb(0.95, 0.92, 0.98),
    background: rgb(0.99, 0.98, 1),
    text: rgb(0.25, 0.15, 0.3)
  },
  'minimal': {
    primary: rgb(0.15, 0.15, 0.15),
    secondary: rgb(0.4, 0.4, 0.4),
    accent: rgb(0.95, 0.95, 0.95),
    background: rgb(1, 1, 1),
    text: rgb(0.1, 0.1, 0.1)
  }
}

// Helper to sanitize text for PDF
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
      guideType,
      title,
      subtitle,
      authorName,
      introduction,
      chapters = [],
      chapterCount,
      difficulty,
      colorScheme,
      coverStyle,
      coverImageStyle,
      customImagePrompt,
      includeImages,
      includeTips,
      paperSize
    } = await request.json()
    
    // Validate required fields
    if (!title) {
      return NextResponse.json({
        success: false,
        error: 'Title is required'
      }, { status: 400 })
    }
    
    // Ensure chapters is an array
    const validChapters = Array.isArray(chapters) ? chapters : []
    
    console.log(`Generating How-To Guide: "${title}"...`)
    
    // Get paper dimensions
    const width = paperSize?.width || 612
    const height = paperSize?.height || 792
    const margin = 54 // 0.75 inch margins for KDP
    const contentWidth = width - (margin * 2)
    
    // Get color scheme
    const colors = GUIDE_COLOR_SCHEMES[colorScheme] || GUIDE_COLOR_SCHEMES['professional']
    
    // Generate cover image
    let coverImageUrl = null
    if (coverImageStyle && coverImageStyle !== 'gradient') {
      try {
        const themePrompt = customImagePrompt || `professional ${guideType} guide cover, educational, step-by-step tutorial, knowledge sharing, modern design`
        console.log(`Generating cover image: ${themePrompt.substring(0, 50)}...`)
        const imageResult = await generateCoverImage('default-elegant', themePrompt)
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
    
    // ========== COVER PAGE ==========
    const coverPage = pdfDoc.addPage([width, height])
    await drawCoverPageWithImage(coverPage, pdfDoc, {
      width,
      height,
      title: sanitizeText(title) || 'How-To Guide',
      subtitle: sanitizeText(subtitle) || '',
      authorName: sanitizeText(authorName) || '',
      year: new Date().getFullYear(),
      colors,
      coverStyle,
      boldFont,
      regularFont,
      coverImageUrl
    })
    
    // ========== TITLE PAGE ==========
    const titlePage = pdfDoc.addPage([width, height])
    titlePage.drawRectangle({ x: 0, y: 0, width, height, color: colors.background })
    
    const cleanTitle = sanitizeText(title) || 'How-To Guide'
    const titleWidth = boldFont.widthOfTextAtSize(cleanTitle, 24)
    titlePage.drawText(cleanTitle, {
      x: (width - titleWidth) / 2,
      y: height - margin - 100,
      size: 24,
      font: boldFont,
      color: colors.primary
    })
    
    if (subtitle) {
      const cleanSubtitle = sanitizeText(subtitle)
      const subWidth = regularFont.widthOfTextAtSize(cleanSubtitle, 14)
      titlePage.drawText(cleanSubtitle, {
        x: (width - subWidth) / 2,
        y: height - margin - 135,
        size: 14,
        font: regularFont,
        color: colors.secondary
      })
    }
    
    // Decorative line
    titlePage.drawLine({
      start: { x: width * 0.3, y: height - margin - 160 },
      end: { x: width * 0.7, y: height - margin - 160 },
      thickness: 1,
      color: colors.secondary
    })
    
    if (authorName) {
      const cleanAuthor = sanitizeText(authorName)
      const authorWidth = regularFont.widthOfTextAtSize(`by ${cleanAuthor}`, 12)
      titlePage.drawText(`by ${cleanAuthor}`, {
        x: (width - authorWidth) / 2,
        y: height - margin - 200,
        size: 12,
        font: regularFont,
        color: colors.text
      })
    }
    
    // Difficulty badge
    if (difficulty) {
      const difficultyLabel = `Level: ${difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}`
      const diffWidth = regularFont.widthOfTextAtSize(difficultyLabel, 11)
      titlePage.drawText(difficultyLabel, {
        x: (width - diffWidth) / 2,
        y: height - margin - 240,
        size: 11,
        font: italicFont,
        color: colors.secondary
      })
    }
    
    // ========== TABLE OF CONTENTS ==========
    const tocPage = pdfDoc.addPage([width, height])
    tocPage.drawRectangle({ x: 0, y: 0, width, height, color: colors.background })
    
    tocPage.drawText('Table of Contents', {
      x: margin,
      y: height - margin - 40,
      size: 20,
      font: boldFont,
      color: colors.primary
    })
    
    tocPage.drawLine({
      start: { x: margin, y: height - margin - 55 },
      end: { x: width - margin, y: height - margin - 55 },
      thickness: 1,
      color: colors.secondary
    })
    
    let tocY = height - margin - 90
    let pageNum = 4 // Start after cover, title, and toc
    
    // Introduction entry
    if (introduction) {
      tocPage.drawText('Introduction', {
        x: margin,
        y: tocY,
        size: 12,
        font: regularFont,
        color: colors.text
      })
      const pageStr = String(pageNum)
      const pageWidth = regularFont.widthOfTextAtSize(pageStr, 12)
      tocPage.drawText(pageStr, {
        x: width - margin - pageWidth,
        y: tocY,
        size: 12,
        font: regularFont,
        color: colors.text
      })
      tocY -= 25
      pageNum++
    }
    
    // Chapter entries
    for (let i = 0; i < validChapters.length; i++) {
      const chapter = validChapters[i]
      const cleanChapterTitle = sanitizeText(chapter.title)
      
      tocPage.drawText(`Chapter ${i + 1}: ${cleanChapterTitle}`, {
        x: margin,
        y: tocY,
        size: 12,
        font: boldFont,
        color: colors.primary
      })
      const pageStr = String(pageNum)
      const pageWidth = regularFont.widthOfTextAtSize(pageStr, 12)
      tocPage.drawText(pageStr, {
        x: width - margin - pageWidth,
        y: tocY,
        size: 12,
        font: regularFont,
        color: colors.text
      })
      tocY -= 22
      pageNum++
      
      // Section entries
      if (chapter.sections) {
        for (const section of chapter.sections) {
          const cleanSectionTitle = sanitizeText(section.title)
          tocPage.drawText(`  ${cleanSectionTitle}`, {
            x: margin + 20,
            y: tocY,
            size: 10,
            font: regularFont,
            color: colors.text
          })
          tocY -= 18
          pageNum++
          
          if (tocY < margin + 50) break
        }
      }
      
      if (tocY < margin + 50) break
    }
    
    // ========== INTRODUCTION PAGE ==========
    if (introduction) {
      const introPage = pdfDoc.addPage([width, height])
      introPage.drawRectangle({ x: 0, y: 0, width, height, color: colors.background })
      
      introPage.drawText('Introduction', {
        x: margin,
        y: height - margin - 40,
        size: 18,
        font: boldFont,
        color: colors.primary
      })
      
      introPage.drawLine({
        start: { x: margin, y: height - margin - 55 },
        end: { x: margin + 100, y: height - margin - 55 },
        thickness: 2,
        color: colors.secondary
      })
      
      const introLines = wrapText(introduction, regularFont, 11, contentWidth)
      let introY = height - margin - 90
      for (const line of introLines) {
        if (introY < margin) break
        introPage.drawText(line, {
          x: margin,
          y: introY,
          size: 11,
          font: regularFont,
          color: colors.text
        })
        introY -= 18
      }
    }
    
    // ========== CHAPTER PAGES ==========
    for (let chapterIdx = 0; chapterIdx < chapters.length; chapterIdx++) {
      const chapter = chapters[chapterIdx]
      const cleanChapterTitle = sanitizeText(chapter.title)
      
      // Chapter title page
      const chapterTitlePage = pdfDoc.addPage([width, height])
      chapterTitlePage.drawRectangle({ x: 0, y: 0, width, height, color: colors.background })
      
      // Chapter number
      const chapterNum = `CHAPTER ${chapterIdx + 1}`
      const numWidth = regularFont.widthOfTextAtSize(chapterNum, 12)
      chapterTitlePage.drawText(chapterNum, {
        x: (width - numWidth) / 2,
        y: height / 2 + 60,
        size: 12,
        font: boldFont,
        color: colors.secondary
      })
      
      // Chapter title - wrap if too long
      const maxTitleWidth = width - (margin * 2) - 40 // Leave some padding
      let titleFontSize = 24
      
      // Check if title fits, reduce font size if needed
      let chTitleWidth = boldFont.widthOfTextAtSize(cleanChapterTitle, titleFontSize)
      if (chTitleWidth > maxTitleWidth) {
        titleFontSize = 20
        chTitleWidth = boldFont.widthOfTextAtSize(cleanChapterTitle, titleFontSize)
      }
      if (chTitleWidth > maxTitleWidth) {
        titleFontSize = 18
        chTitleWidth = boldFont.widthOfTextAtSize(cleanChapterTitle, titleFontSize)
      }
      
      // If still too long, wrap the title
      if (chTitleWidth > maxTitleWidth) {
        const titleLines = wrapText(cleanChapterTitle, boldFont, titleFontSize, maxTitleWidth)
        let titleY = height / 2 + 20 + ((titleLines.length - 1) * 14) // Center vertically
        for (const line of titleLines) {
          const lineWidth = boldFont.widthOfTextAtSize(line, titleFontSize)
          chapterTitlePage.drawText(line, {
            x: (width - lineWidth) / 2,
            y: titleY,
            size: titleFontSize,
            font: boldFont,
            color: colors.primary
          })
          titleY -= titleFontSize + 6
        }
      } else {
        // Single line - center it
        chapterTitlePage.drawText(cleanChapterTitle, {
          x: (width - chTitleWidth) / 2,
          y: height / 2 + 20,
          size: titleFontSize,
          font: boldFont,
          color: colors.primary
        })
      }
      
      // Decorative line - positioned below the title
      chapterTitlePage.drawLine({
        start: { x: width * 0.35, y: height / 2 - 30 },
        end: { x: width * 0.65, y: height / 2 - 30 },
        thickness: 2,
        color: colors.secondary
      })
      
      // ========== SECTION PAGES ==========
      if (chapter.sections) {
        for (let sectionIdx = 0; sectionIdx < chapter.sections.length; sectionIdx++) {
          const section = chapter.sections[sectionIdx]
          const cleanSectionTitle = sanitizeText(section.title)
          
          let page = pdfDoc.addPage([width, height])
          page.drawRectangle({ x: 0, y: 0, width, height, color: colors.background })
          
          // Header with chapter reference
          page.drawText(`Chapter ${chapterIdx + 1} | ${cleanChapterTitle.substring(0, 30)}`, {
            x: margin,
            y: height - 30,
            size: 8,
            font: italicFont,
            color: colors.secondary
          })
          
          // Section title
          let yPos = height - margin - 40
          page.drawText(cleanSectionTitle, {
            x: margin,
            y: yPos,
            size: 16,
            font: boldFont,
            color: colors.primary
          })
          
          // Accent underline
          page.drawLine({
            start: { x: margin, y: yPos - 8 },
            end: { x: margin + 80, y: yPos - 8 },
            thickness: 2,
            color: colors.secondary
          })
          
          yPos -= 35
          
          // Content
          if (section.content) {
            const contentLines = wrapText(section.content, regularFont, 11, contentWidth)
            for (const line of contentLines) {
              if (yPos < margin + 30) {
                page = pdfDoc.addPage([width, height])
                page.drawRectangle({ x: 0, y: 0, width, height, color: colors.background })
                yPos = height - margin - 40
              }
              page.drawText(line, {
                x: margin,
                y: yPos,
                size: 11,
                font: regularFont,
                color: colors.text
              })
              yPos -= 18
            }
            yPos -= 15
          }
          
          // Steps
          if (section.steps && section.steps.length > 0) {
            // Steps heading
            if (yPos < margin + 100) {
              page = pdfDoc.addPage([width, height])
              page.drawRectangle({ x: 0, y: 0, width, height, color: colors.background })
              yPos = height - margin - 40
            }
            
            page.drawText('Steps:', {
              x: margin,
              y: yPos,
              size: 12,
              font: boldFont,
              color: colors.primary
            })
            yPos -= 22
            
            for (let stepIdx = 0; stepIdx < section.steps.length; stepIdx++) {
              const step = sanitizeText(section.steps[stepIdx])
              if (!step) continue
              
              if (yPos < margin + 50) {
                page = pdfDoc.addPage([width, height])
                page.drawRectangle({ x: 0, y: 0, width, height, color: colors.background })
                yPos = height - margin - 40
              }
              
              // Step number circle
              const circleX = margin + 12
              page.drawCircle({
                x: circleX,
                y: yPos + 4,
                size: 10,
                color: colors.secondary
              })
              
              // Step number
              const stepNumStr = String(stepIdx + 1)
              const stepNumWidth = boldFont.widthOfTextAtSize(stepNumStr, 9)
              page.drawText(stepNumStr, {
                x: circleX - stepNumWidth / 2,
                y: yPos + 1,
                size: 9,
                font: boldFont,
                color: rgb(1, 1, 1)
              })
              
              // Step text
              const stepLines = wrapText(step, regularFont, 10, contentWidth - 35)
              for (let lineIdx = 0; lineIdx < stepLines.length; lineIdx++) {
                page.drawText(stepLines[lineIdx], {
                  x: margin + 30,
                  y: yPos - (lineIdx * 14),
                  size: 10,
                  font: regularFont,
                  color: colors.text
                })
              }
              yPos -= Math.max(20, stepLines.length * 14 + 8)
            }
            yPos -= 15
          }
          
          // Tips box
          if (includeTips && section.tips) {
            const cleanTips = sanitizeText(section.tips)
            if (cleanTips) {
              if (yPos < margin + 80) {
                page = pdfDoc.addPage([width, height])
                page.drawRectangle({ x: 0, y: 0, width, height, color: colors.background })
                yPos = height - margin - 40
              }
              
              // Tip box background
              const tipLines = wrapText(cleanTips, italicFont, 10, contentWidth - 30)
              const tipBoxHeight = tipLines.length * 15 + 35
              
              page.drawRectangle({
                x: margin,
                y: yPos - tipBoxHeight + 15,
                width: contentWidth,
                height: tipBoxHeight,
                color: colors.accent
              })
              
              // Tip header
              page.drawText('Pro Tip', {
                x: margin + 12,
                y: yPos,
                size: 11,
                font: boldFont,
                color: colors.primary
              })
              yPos -= 20
              
              // Tip content
              for (const line of tipLines) {
                page.drawText(line, {
                  x: margin + 12,
                  y: yPos,
                  size: 10,
                  font: italicFont,
                  color: colors.text
                })
                yPos -= 15
              }
            }
          }
        }
      }
    }
    
    // ========== NOTES PAGES ==========
    for (let i = 0; i < 2; i++) {
      const notesPage = pdfDoc.addPage([width, height])
      notesPage.drawRectangle({ x: 0, y: 0, width, height, color: colors.background })
      
      notesPage.drawText('Notes', {
        x: margin,
        y: height - margin - 30,
        size: 16,
        font: boldFont,
        color: colors.primary
      })
      
      // Draw lines for notes
      for (let lineY = height - margin - 70; lineY > margin; lineY -= 28) {
        notesPage.drawLine({
          start: { x: margin, y: lineY },
          end: { x: width - margin, y: lineY },
          thickness: 0.5,
          color: rgb(0.85, 0.85, 0.85)
        })
      }
    }
    
    // Save PDF
    const pdfBytes = await pdfDoc.save()
    
    // Ensure output directory exists
    const outputDir = path.join(process.cwd(), 'public', 'guides')
    await fs.mkdir(outputDir, { recursive: true })
    
    // Save file
    const fileName = `guide-${randomUUID()}.pdf`
    const filePath = path.join(outputDir, fileName)
    await fs.writeFile(filePath, pdfBytes)
    
    const pageCount = pdfDoc.getPageCount()
    console.log(`Guide generated: ${pageCount} pages`)
    
    return NextResponse.json({
      success: true,
      title: sanitizeText(title) || 'How-To Guide',
      pageCount,
      downloadUrl: `/guides/${fileName}`
    })
    
  } catch (error) {
    console.error('Error generating guide:', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to generate guide'
    }, { status: 500 })
  }
}
