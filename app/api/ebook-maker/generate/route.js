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
  return text
    .replace(/[\u2018\u2019]/g, "'")  // Smart single quotes
    .replace(/[\u201C\u201D]/g, '"')  // Smart double quotes
    .replace(/\u2026/g, '...')         // Ellipsis
    .replace(/\u2013/g, '-')           // En dash
    .replace(/\u2014/g, '--')          // Em dash
    .replace(/\u00A0/g, ' ')           // Non-breaking space
    .replace(/[\u000A\u000D]/g, ' ')   // Newlines to spaces
    .replace(/[^\x00-\x7F]/g, '')      // Remove any remaining non-ASCII
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
    
    console.log('AI generated ebook content successfully via Gemini')
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
      console.log('Skipping problematic word:', word)
      continue
    }
  }
  if (currentLine) lines.push(currentLine)
  
  return lines
}

// Create PDF from ebook content
async function createEbookPDF(content, designStyle, colorScheme, coverStyle, authorName, coverImageUrl) {
  const pdfDoc = await PDFDocument.create()
  const regularFont = await pdfDoc.embedFont(StandardFonts.TimesRoman)
  const boldFont = await pdfDoc.embedFont(StandardFonts.TimesRomanBold)
  const italicFont = await pdfDoc.embedFont(StandardFonts.TimesRomanItalic)
  
  const pageWidth = 612
  const pageHeight = 792
  const margin = 72 // 1 inch
  const contentWidth = pageWidth - (margin * 2)
  
  // Get colors from scheme
  const colors = PDF_COLOR_SCHEMES[colorScheme] || PDF_COLOR_SCHEMES['ocean-blue']
  const cover = COVER_STYLES[coverStyle] || COVER_STYLES['elegant']
  
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
  
  page.drawText('Table of Contents', {
    x: margin,
    y: pageHeight - margin - 30,
    size: 24,
    font: boldFont,
    color: colors.primary
  })
  
  let y = pageHeight - margin - 80
  page.drawText('Introduction', { x: margin + 20, y, size: 14, font: regularFont, color: colors.text })
  y -= 30
  
  content.chapters.forEach((chapter) => {
    const chapterText = sanitizeText(`Chapter ${chapter.number}: ${chapter.title}`)
    page.drawText(chapterText, {
      x: margin + 20,
      y: y,
      size: 14,
      font: regularFont,
      color: colors.text
    })
    y -= 30
    if (y < margin + 50) {
      page = pdfDoc.addPage([pageWidth, pageHeight])
      page.drawRectangle({ x: 0, y: 0, width: pageWidth, height: pageHeight, color: colors.background })
      y = pageHeight - margin - 50
    }
  })
  
  page.drawText('Conclusion', { x: margin + 20, y: y, size: 14, font: regularFont, color: colors.text })
  
  // Introduction
  page = pdfDoc.addPage([pageWidth, pageHeight])
  page.drawRectangle({ x: 0, y: 0, width: pageWidth, height: pageHeight, color: colors.background })
  
  page.drawText('Introduction', {
    x: margin,
    y: pageHeight - margin - 30,
    size: 24,
    font: boldFont,
    color: colors.primary
  })
  
  y = pageHeight - margin - 80
  const introLines = wrapText(content.introduction, regularFont, 12, contentWidth)
  for (const line of introLines) {
    if (y < margin + 50) {
      page = pdfDoc.addPage([pageWidth, pageHeight])
      page.drawRectangle({ x: 0, y: 0, width: pageWidth, height: pageHeight, color: colors.background })
      y = pageHeight - margin - 50
    }
    page.drawText(line, { x: margin, y, size: 12, font: regularFont, color: colors.text })
    y -= 18
  }
  
  // Chapters
  for (const chapter of content.chapters) {
    page = pdfDoc.addPage([pageWidth, pageHeight])
    page.drawRectangle({ x: 0, y: 0, width: pageWidth, height: pageHeight, color: colors.background })
    
    // Chapter number
    page.drawText(`Chapter ${chapter.number}`, {
      x: margin,
      y: pageHeight - margin - 20,
      size: 14,
      font: regularFont,
      color: colors.secondary
    })
    
    // Chapter title
    const chapterTitleLines = wrapText(chapter.title, boldFont, 22, contentWidth)
    y = pageHeight - margin - 50
    chapterTitleLines.forEach(line => {
      page.drawText(line, { x: margin, y, size: 22, font: boldFont, color: colors.primary })
      y -= 30
    })
    
    y -= 20
    
    // Chapter content
    const contentLines = wrapText(chapter.content, regularFont, 12, contentWidth)
    for (const line of contentLines) {
      if (y < margin + 80) {
        page = pdfDoc.addPage([pageWidth, pageHeight])
        page.drawRectangle({ x: 0, y: 0, width: pageWidth, height: pageHeight, color: colors.background })
        y = pageHeight - margin - 50
      }
      page.drawText(line, { x: margin, y, size: 12, font: regularFont, color: colors.text })
      y -= 18
    }
    
    // Key Takeaways
    if (chapter.keyTakeaways && chapter.keyTakeaways.length > 0) {
      if (y < margin + 150) {
        page = pdfDoc.addPage([pageWidth, pageHeight])
        page.drawRectangle({ x: 0, y: 0, width: pageWidth, height: pageHeight, color: colors.background })
        y = pageHeight - margin - 50
      }
      
      y -= 30
      page.drawText('Key Takeaways:', { x: margin, y, size: 14, font: boldFont, color: colors.secondary })
      y -= 25
      
      chapter.keyTakeaways.forEach((takeaway) => {
        if (y < margin + 50) {
          page = pdfDoc.addPage([pageWidth, pageHeight])
          page.drawRectangle({ x: 0, y: 0, width: pageWidth, height: pageHeight, color: colors.background })
          y = pageHeight - margin - 50
        }
        const bullet = `- ${sanitizeText(takeaway)}`
        const takeawayLines = wrapText(bullet, italicFont, 11, contentWidth - 20)
        takeawayLines.forEach(line => {
          page.drawText(line, { x: margin + 20, y, size: 11, font: italicFont, color: colors.text })
          y -= 16
        })
      })
    }
  }
  
  // Conclusion
  page = pdfDoc.addPage([pageWidth, pageHeight])
  page.drawRectangle({ x: 0, y: 0, width: pageWidth, height: pageHeight, color: colors.background })
  
  page.drawText('Conclusion', {
    x: margin,
    y: pageHeight - margin - 30,
    size: 24,
    font: boldFont,
    color: colors.primary
  })
  
  y = pageHeight - margin - 80
  const conclusionLines = wrapText(content.conclusion, regularFont, 12, contentWidth)
  for (const line of conclusionLines) {
    if (y < margin + 50) {
      page = pdfDoc.addPage([pageWidth, pageHeight])
      page.drawRectangle({ x: 0, y: 0, width: pageWidth, height: pageHeight, color: colors.background })
      y = pageHeight - margin - 50
    }
    page.drawText(line, { x: margin, y, size: 12, font: regularFont, color: colors.text })
    y -= 18
  }
  
  // About Author page
  if (authorName) {
    page = pdfDoc.addPage([pageWidth, pageHeight])
    page.drawRectangle({ x: 0, y: 0, width: pageWidth, height: pageHeight, color: colors.background })
    
    page.drawText('About the Author', {
      x: margin,
      y: pageHeight - margin - 30,
      size: 24,
      font: boldFont,
      color: colors.primary
    })
    
    y = pageHeight - margin - 80
    const aboutLines = wrapText(content.aboutAuthor || `${authorName} is the author of this ebook.`, regularFont, 12, contentWidth)
    for (const line of aboutLines) {
      page.drawText(line, { x: margin, y, size: 12, font: regularFont, color: colors.text })
      y -= 18
    }
  }
  
  return pdfDoc
}

export async function POST(request) {
  try {
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
    
    console.log(`Generating ebook: "${title}" with ${chapterCount} chapters...`)
    
    // Generate content with AI
    const ebookContent = await generateEbookContent(
      title,
      outline,
      genre || 'non-fiction',
      chapterCount || 5,
      language || 'english',
      authorName
    )
    
    console.log('Ebook content generated, creating cover image...')
    
    // Generate cover image
    let coverImageUrl = null
    try {
      const themeKey = getEbookTheme(genre || 'non-fiction')
      console.log(`Generating cover image for theme: ${themeKey}`)
      const imageResult = await generateCoverImage(themeKey)
      if (imageResult.success && imageResult.imageUrl) {
        coverImageUrl = imageResult.imageUrl
        console.log('Cover image generated successfully')
      } else {
        console.log('Cover image generation failed, using fallback design:', imageResult.error)
      }
    } catch (imgError) {
      console.log('Error generating cover image:', imgError.message)
    }
    
    console.log('Creating PDF...')
    
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
    
    console.log(`Ebook generated: ${filePath}`)
    
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
