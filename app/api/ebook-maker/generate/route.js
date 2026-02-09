import { NextResponse } from 'next/server'
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { getCollection } from '@/lib/mongodb'
import { randomUUID } from 'crypto'
import fs from 'fs/promises'
import path from 'path'
import { 
  PDF_COLOR_SCHEMES, 
  COVER_STYLES, 
  PAPER_SIZES,
  drawCoverPageWithImage,
  drawCoverPage,
  getCurrentYear
} from '@/lib/pdf-design'
import { generateCoverImage, getEbookTheme } from '@/lib/cover-image-generator'
import { enforceRateLimit } from '@/lib/rate-limiter'
import { getUserIdFromRequest, checkCredits, deductCredits, completeTransaction, refundCredits } from '@/lib/credits'

// Use Google Generative AI with the proper Google API key
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY)

// Ebook genres with prompts
const EBOOK_GENRES = {
  'self-help': 'motivational and actionable self-improvement content',
  'business': 'professional business strategies and insights',
  'fiction': 'engaging narrative with compelling characters',
  'non-fiction': 'informative and well-researched content',
  'how-to': 'step-by-step practical instructions',
  'cookbook': 'detailed recipes with cooking tips',
  'health': 'wellness and health-related guidance',
  'finance': 'financial advice and money management',
  'travel': 'travel guides and destination information',
  'children': 'age-appropriate content for young readers'
}

// Helper function to sanitize text for PDF (remove problematic characters)
function sanitizeText(text) {
  if (!text) return ''
  // Replace problematic characters with safe alternatives
  return String(text)
    .replace(/[\r\n\t]/g, ' ')         // Replace newlines and tabs with space
    .replace(/[\u2018\u2019]/g, "'")   // Smart single quotes
    .replace(/[\u201C\u201D]/g, '"')   // Smart double quotes
    .replace(/\u2026/g, '...')          // Ellipsis
    .replace(/\u2013/g, '-')            // En dash
    .replace(/\u2014/g, '--')           // Em dash
    .replace(/\u00A0/g, ' ')            // Non-breaking space
    .replace(/[^\x20-\x7E]/g, '')       // Remove any non-printable ASCII
    .replace(/\s+/g, ' ')               // Collapse multiple spaces
    .trim()
}

// Generate ebook content with AI
async function generateEbookContent(title, outline, genre, chapterCount, language, authorName) {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })
    
    const genreContext = EBOOK_GENRES[genre] || EBOOK_GENRES['non-fiction']
    const languageInstruction = language === 'bengali' ? 'Write the entire content in Bengali language.' : 'Write in English.'
    
    const prompt = `You are an expert ebook author. Create a comprehensive ebook with the following details:

Title: "${title}"
Genre: ${genre} - ${genreContext}
Number of Chapters: ${chapterCount}
Outline/Topics to cover: ${outline}
Author: ${authorName || 'Anonymous'}

${languageInstruction}

Generate a complete ebook with:
1. An engaging introduction (200-300 words)
2. ${chapterCount} detailed chapters (300-500 words each)
3. Key takeaways at the end of each chapter (3 bullet points)
4. A conclusion summarizing the main points

IMPORTANT RULES:
- Use only plain ASCII characters
- No special quotes or symbols
- No emojis
- Keep text simple and clean

Format your response as JSON with this structure:
{
  "title": "...",
  "subtitle": "...",
  "introduction": "...",
  "chapters": [
    {
      "number": 1,
      "title": "...",
      "content": "...",
      "keyTakeaways": ["...", "...", "..."]
    }
  ],
  "conclusion": "...",
  "aboutAuthor": "..."
}

IMPORTANT: Return ONLY valid JSON, no markdown code blocks.`

    const result = await model.generateContent(prompt)
    const response = await result.response
    let text = response.text().trim()
    
    // Clean up response
    text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    
    const content = JSON.parse(text)
    
    // Sanitize all text fields
    content.title = sanitizeText(content.title) || title
    content.subtitle = sanitizeText(content.subtitle)
    content.introduction = sanitizeText(content.introduction)
    content.conclusion = sanitizeText(content.conclusion)
    content.aboutAuthor = sanitizeText(content.aboutAuthor)
    
    if (content.chapters) {
      content.chapters = content.chapters.map(ch => ({
        ...ch,
        title: sanitizeText(ch.title),
        content: sanitizeText(ch.content),
        keyTakeaways: (ch.keyTakeaways || []).map(t => sanitizeText(t))
      }))
    }
    
    return content
  } catch (error) {
    console.error('AI content generation error:', error.message || error)
    // Return default structure
    return {
      title: sanitizeText(title),
      subtitle: `A ${genre} guide`,
      introduction: 'This ebook provides valuable insights and practical knowledge on the topics covered. Each chapter is designed to help you understand and apply the concepts effectively.',
      chapters: Array.from({ length: chapterCount }, (_, i) => ({
        number: i + 1,
        title: `Chapter ${i + 1}`,
        content: `This chapter covers important aspects of ${sanitizeText(outline)}. The content provides actionable insights and practical guidance.`,
        keyTakeaways: ['Key insight from this chapter', 'Practical application', 'Remember this point']
      })),
      conclusion: 'Thank you for reading this ebook. Apply these insights to achieve your goals.',
      aboutAuthor: authorName ? `Written by ${sanitizeText(authorName)}.` : 'Created with AI assistance.'
    }
  }
}

// Helper to wrap text for PDF
function wrapText(text, font, fontSize, maxWidth) {
  // First sanitize the text
  const cleanText = sanitizeText(text || '')
  if (!cleanText) return []
  
  const words = cleanText.split(/\s+/).filter(w => w.length > 0)
  const lines = []
  let currentLine = ''
  
  for (const word of words) {
    // Skip empty words
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
      // If word causes encoding error, skip it
      continue
    }
  }
  if (currentLine) lines.push(currentLine)
  
  return lines
}

// Create PDF from ebook content with professional formatting
async function createEbookPDF(content, designStyle, colorScheme, coverStyle, authorName, coverImageUrl) {
  const pdfDoc = await PDFDocument.create()
  const regularFont = await pdfDoc.embedFont(StandardFonts.TimesRoman)
  const boldFont = await pdfDoc.embedFont(StandardFonts.TimesRomanBold)
  const italicFont = await pdfDoc.embedFont(StandardFonts.TimesRomanItalic)
  
  const pageWidth = 612
  const pageHeight = 792
  const margin = 65
  const contentWidth = pageWidth - (margin * 2)
  const lineHeight = 20  // Increased line spacing
  const paragraphSpacing = 28  // Space between paragraphs
  
  // Get colors from scheme
  const colors = PDF_COLOR_SCHEMES[colorScheme] || PDF_COLOR_SCHEMES['ocean-blue']
  const cover = COVER_STYLES[coverStyle] || COVER_STYLES['elegant']
  
  // Helper function to draw a colored note box
  const drawNoteBox = (page, x, y, width, height, text, font, fontSize) => {
    // Light accent background
    page.drawRectangle({
      x: x,
      y: y - height + 10,
      width: width,
      height: height,
      color: colors.accent,
      borderColor: colors.secondary,
      borderWidth: 1,
    })
    
    // Left accent bar
    page.drawRectangle({
      x: x,
      y: y - height + 10,
      width: 4,
      height: height,
      color: colors.primary,
    })
    
    // Text inside box
    const lines = wrapText(text, font, fontSize, width - 30)
    let textY = y - 8
    lines.forEach(line => {
      page.drawText(line, {
        x: x + 15,
        y: textY,
        size: fontSize,
        font: font,
        color: colors.text,
      })
      textY -= fontSize + 4
    })
    
    return height + 15
  }
  
  // Title Page with AI-generated cover image
  let page = pdfDoc.addPage([pageWidth, pageHeight])
  
  if (coverImageUrl) {
    await drawCoverPageWithImage(page, pdfDoc, {
      width: pageWidth,
      height: pageHeight,
      title: content.title,
      subtitle: content.subtitle,
      authorName: authorName,
      year: getCurrentYear(),
      colors,
      coverStyle: cover,
      boldFont,
      regularFont,
      coverImageUrl
    })
  } else {
    drawCoverPage(page, {
      width: pageWidth,
      height: pageHeight,
      title: content.title,
      subtitle: content.subtitle,
      authorName: authorName,
      year: getCurrentYear(),
      colors,
      coverStyle: cover,
      boldFont,
      regularFont
    })
  }
  
  // Table of Contents
  page = pdfDoc.addPage([pageWidth, pageHeight])
  page.drawRectangle({ x: 0, y: 0, width: pageWidth, height: pageHeight, color: colors.background })
  
  // TOC Header
  page.drawText('Table of Contents', {
    x: margin,
    y: pageHeight - margin - 30,
    size: 26,
    font: boldFont,
    color: colors.primary
  })
  
  // Decorative line under TOC header
  page.drawLine({
    start: { x: margin, y: pageHeight - margin - 45 },
    end: { x: pageWidth - margin, y: pageHeight - margin - 45 },
    thickness: 2,
    color: colors.secondary,
  })
  
  let y = pageHeight - margin - 80
  
  // Introduction entry
  page.drawCircle({ x: margin + 10, y: y + 4, size: 3, color: colors.primary })
  page.drawText('Introduction', { x: margin + 25, y, size: 13, font: regularFont, color: colors.text })
  y -= 35
  
  // Chapter entries
  content.chapters.forEach((chapter) => {
    const chapterText = sanitizeText(`Chapter ${chapter.number}: ${chapter.title}`)
    page.drawCircle({ x: margin + 10, y: y + 4, size: 3, color: colors.primary })
    page.drawText(chapterText, {
      x: margin + 25,
      y: y,
      size: 13,
      font: regularFont,
      color: colors.text
    })
    y -= 35
    if (y < margin + 50) {
      page = pdfDoc.addPage([pageWidth, pageHeight])
      page.drawRectangle({ x: 0, y: 0, width: pageWidth, height: pageHeight, color: colors.background })
      y = pageHeight - margin - 50
    }
  })
  
  // Conclusion entry
  page.drawCircle({ x: margin + 10, y: y + 4, size: 3, color: colors.primary })
  page.drawText('Conclusion', { x: margin + 25, y, size: 13, font: regularFont, color: colors.text })
  
  // Introduction Page
  page = pdfDoc.addPage([pageWidth, pageHeight])
  page.drawRectangle({ x: 0, y: 0, width: pageWidth, height: pageHeight, color: colors.background })
  
  // Section header with accent bar
  page.drawRectangle({ x: margin - 10, y: pageHeight - margin - 40, width: 4, height: 35, color: colors.primary })
  page.drawText('Introduction', {
    x: margin,
    y: pageHeight - margin - 30,
    size: 26,
    font: boldFont,
    color: colors.primary
  })
  
  // Decorative line
  page.drawLine({
    start: { x: margin, y: pageHeight - margin - 48 },
    end: { x: margin + 150, y: pageHeight - margin - 48 },
    thickness: 2,
    color: colors.secondary,
  })
  
  y = pageHeight - margin - 85
  const introLines = wrapText(content.introduction, regularFont, 11, contentWidth)
  for (const line of introLines) {
    if (y < margin + 60) {
      page = pdfDoc.addPage([pageWidth, pageHeight])
      page.drawRectangle({ x: 0, y: 0, width: pageWidth, height: pageHeight, color: colors.background })
      y = pageHeight - margin - 50
    }
    page.drawText(line, { x: margin, y, size: 11, font: regularFont, color: colors.text })
    y -= lineHeight
  }
  
  // Chapters
  for (const chapter of content.chapters) {
    // New page for each chapter
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
    page.drawText(`Chapter ${chapter.number}`, {
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
    
    // Decorative line under title
    page.drawLine({
      start: { x: margin, y: y + 8 },
      end: { x: margin + 180, y: y + 8 },
      thickness: 2,
      color: colors.secondary,
    })
    
    y -= 30  // Extra space after title
    
    // Chapter content - split into paragraphs with better spacing
    const paragraphs = chapter.content.split(/\n\n|(?<=\. )(?=[A-Z])/).filter(p => p.trim())
    
    for (let pIdx = 0; pIdx < paragraphs.length; pIdx++) {
      const paragraph = paragraphs[pIdx].trim()
      if (!paragraph) continue
      
      const lines = wrapText(paragraph, regularFont, 11, contentWidth)
      
      for (let i = 0; i < lines.length; i++) {
        if (y < margin + 100) {
          page = pdfDoc.addPage([pageWidth, pageHeight])
          page.drawRectangle({ x: 0, y: 0, width: pageWidth, height: pageHeight, color: colors.background })
          y = pageHeight - margin - 50
        }
        
        // First line of paragraph gets indent
        const indent = (i === 0 && pIdx > 0) ? 20 : 0
        page.drawText(lines[i], { 
          x: margin + indent, 
          y, 
          size: 11, 
          font: regularFont, 
          color: colors.text 
        })
        y -= lineHeight
      }
      y -= 12  // Paragraph spacing
    }
    
    // Key Takeaways Box
    if (chapter.keyTakeaways && chapter.keyTakeaways.length > 0) {
      // Ensure space for takeaways box
      const boxHeight = 30 + (chapter.keyTakeaways.length * 28)
      if (y < margin + boxHeight + 50) {
        page = pdfDoc.addPage([pageWidth, pageHeight])
        page.drawRectangle({ x: 0, y: 0, width: pageWidth, height: pageHeight, color: colors.background })
        y = pageHeight - margin - 50
      }
      
      y -= 25  // Space before box
      
      // Takeaway box background
      page.drawRectangle({
        x: margin,
        y: y - boxHeight + 25,
        width: contentWidth,
        height: boxHeight,
        color: colors.accent,
        borderColor: colors.secondary,
        borderWidth: 1,
      })
      
      // Left accent bar
      page.drawRectangle({
        x: margin,
        y: y - boxHeight + 25,
        width: 5,
        height: boxHeight,
        color: colors.primary,
      })
      
      // Header inside box
      page.drawText('Key Takeaways', { 
        x: margin + 18, 
        y: y, 
        size: 13, 
        font: boldFont, 
        color: colors.primary 
      })
      
      y -= 28
      
      // Takeaway items with bullet points
      chapter.keyTakeaways.forEach((takeaway, idx) => {
        const cleanTakeaway = sanitizeText(takeaway)
        
        // Bullet point
        page.drawCircle({ 
          x: margin + 20, 
          y: y + 4, 
          size: 3, 
          color: colors.primary 
        })
        
        // Takeaway text
        const takeawayLines = wrapText(cleanTakeaway, italicFont, 10, contentWidth - 50)
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
      
      y -= 20  // Space after box
    }
  }
  
  // Conclusion Page
  page = pdfDoc.addPage([pageWidth, pageHeight])
  page.drawRectangle({ x: 0, y: 0, width: pageWidth, height: pageHeight, color: colors.background })
  
  // Section header with accent bar
  page.drawRectangle({ x: margin - 10, y: pageHeight - margin - 40, width: 4, height: 35, color: colors.primary })
  page.drawText('Conclusion', {
    x: margin,
    y: pageHeight - margin - 30,
    size: 26,
    font: boldFont,
    color: colors.primary
  })
  
  // Decorative line
  page.drawLine({
    start: { x: margin, y: pageHeight - margin - 48 },
    end: { x: margin + 130, y: pageHeight - margin - 48 },
    thickness: 2,
    color: colors.secondary,
  })
  
  y = pageHeight - margin - 85
  const conclusionLines = wrapText(content.conclusion, regularFont, 11, contentWidth)
  for (const line of conclusionLines) {
    if (y < margin + 60) {
      page = pdfDoc.addPage([pageWidth, pageHeight])
      page.drawRectangle({ x: 0, y: 0, width: pageWidth, height: pageHeight, color: colors.background })
      y = pageHeight - margin - 50
    }
    page.drawText(line, { x: margin, y, size: 11, font: regularFont, color: colors.text })
    y -= lineHeight
  }
  
  // About Author page
  if (authorName) {
    page = pdfDoc.addPage([pageWidth, pageHeight])
    page.drawRectangle({ x: 0, y: 0, width: pageWidth, height: pageHeight, color: colors.background })
    
    // Section header with accent bar
    page.drawRectangle({ x: margin - 10, y: pageHeight - margin - 40, width: 4, height: 35, color: colors.primary })
    page.drawText('About the Author', {
      x: margin,
      y: pageHeight - margin - 30,
      size: 26,
      font: boldFont,
      color: colors.primary
    })
    
    // Decorative line
    page.drawLine({
      start: { x: margin, y: pageHeight - margin - 48 },
      end: { x: margin + 180, y: pageHeight - margin - 48 },
      thickness: 2,
      color: colors.secondary,
    })
    
    y = pageHeight - margin - 85
    const aboutLines = wrapText(content.aboutAuthor || `${authorName} is the author of this ebook.`, regularFont, 11, contentWidth)
    for (const line of aboutLines) {
      page.drawText(line, { x: margin, y, size: 11, font: regularFont, color: colors.text })
      y -= lineHeight
    }
  }
  
  return pdfDoc
}

export async function POST(request) {
  try {
    // SECURITY: Rate limiting for ebook generation
    const rateLimitCheck = await enforceRateLimit(request, 'content_generate')
    if (rateLimitCheck.limited) {
      return rateLimitCheck.response
    }
    
    const { 
      title, 
      outline, 
      genre, 
      chapterCount, 
      language, 
      designStyle,
      colorScheme,
      coverStyle,
      authorName 
    } = await request.json()
    
    if (!title || !outline) {
      return NextResponse.json(
        { success: false, error: 'Title and outline are required' },
        { status: 400 }
      )
    }
    
    // Generate content with AI
    const ebookContent = await generateEbookContent(
      title,
      outline,
      genre || 'non-fiction',
      chapterCount || 5,
      language || 'english',
      authorName
    )
    
    // Generate cover image
    let coverImageUrl = null
    try {
      const themeKey = getEbookTheme(genre || 'non-fiction')
      const imageResult = await generateCoverImage(themeKey)
      if (imageResult.success && imageResult.imageUrl) {
        coverImageUrl = imageResult.imageUrl
        } else {
        }
    } catch (imgError) {
      }
    
    // Create PDF
    const pdfDoc = await createEbookPDF(
      ebookContent, 
      designStyle || 'modern',
      colorScheme || 'ocean-blue',
      coverStyle || 'elegant',
      authorName,
      coverImageUrl
    )
    const pdfBytes = await pdfDoc.save()
    
    // Save file
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
      title: ebookContent.title,
      description: `${genre} ebook with ${chapterCount} chapters`,
      filePath: `/ebooks/${fileName}`,
      fileSize: pdfBytes.length,
      tool: 'ebook-maker',
      metadata: {
        genre,
        chapterCount,
        language,
        designStyle,
        colorScheme,
        coverStyle,
        authorName,
        chapters: ebookContent.chapters.map(c => c.title)
      },
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    })
    
    return NextResponse.json({
      success: true,
      title: ebookContent.title,
      subtitle: ebookContent.subtitle,
      downloadUrl: `/ebooks/${fileName}`,
      pageCount: pdfDoc.getPageCount(),
      chapterCount: ebookContent.chapters.length,
      libraryId: documentId
    })
    
  } catch (error) {
    console.error('Ebook generation error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to generate ebook' },
      { status: 500 }
    )
  }
}
