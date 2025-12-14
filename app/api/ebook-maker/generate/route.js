import { NextResponse } from 'next/server'
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { getCollection } from '@/lib/mongodb'
import { randomUUID } from 'crypto'
import fs from 'fs/promises'
import path from 'path'

// Initialize Google Generative AI with Emergent LLM key
const genAI = new GoogleGenerativeAI(process.env.EMERGENT_LLM_KEY)

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

// Generate ebook content with AI
async function generateEbookContent(title, outline, genre, chapterCount, language) {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })
    
    const genreContext = EBOOK_GENRES[genre] || EBOOK_GENRES['non-fiction']
    const languageInstruction = language === 'bengali' ? 'Write the entire content in Bengali (বাংলা) language.' : 'Write in English.'
    
    const prompt = `You are an expert ebook author. Create a comprehensive ebook with the following details:

Title: "${title}"
Genre: ${genre} - ${genreContext}
Number of Chapters: ${chapterCount}
Outline/Topics to cover: ${outline}

${languageInstruction}

Generate a complete ebook with:
1. An engaging introduction (300-400 words)
2. ${chapterCount} detailed chapters (500-800 words each)
3. Key takeaways at the end of each chapter
4. A conclusion summarizing the main points

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
  "aboutAuthor": "A brief author bio placeholder"
}

IMPORTANT: Return ONLY valid JSON, no markdown code blocks.`

    const result = await model.generateContent(prompt)
    const response = await result.response
    let text = response.text().trim()
    
    // Clean up response
    text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    
    const content = JSON.parse(text)
    return content
  } catch (error) {
    console.error('AI content generation error:', error)
    // Return default structure
    return {
      title: title,
      subtitle: `A ${genre} guide`,
      introduction: 'This ebook provides valuable insights and practical knowledge on the topics covered. Each chapter is designed to help you understand and apply the concepts effectively.',
      chapters: Array.from({ length: chapterCount }, (_, i) => ({
        number: i + 1,
        title: `Chapter ${i + 1}`,
        content: `This chapter covers important aspects of ${outline}. The content provides actionable insights and practical guidance.`,
        keyTakeaways: ['Key insight from this chapter', 'Practical application', 'Remember this point']
      })),
      conclusion: 'Thank you for reading this ebook. Apply these insights to achieve your goals.',
      aboutAuthor: 'Created with AI assistance.'
    }
  }
}

// Helper to wrap text for PDF
function wrapText(text, font, fontSize, maxWidth) {
  const words = text.split(' ')
  const lines = []
  let currentLine = ''
  
  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word
    const width = font.widthOfTextAtSize(testLine, fontSize)
    
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

// Create PDF from ebook content
async function createEbookPDF(content, designStyle) {
  const pdfDoc = await PDFDocument.create()
  const regularFont = await pdfDoc.embedFont(StandardFonts.TimesRoman)
  const boldFont = await pdfDoc.embedFont(StandardFonts.TimesRomanBold)
  const italicFont = await pdfDoc.embedFont(StandardFonts.TimesRomanItalic)
  
  const pageWidth = 612
  const pageHeight = 792
  const margin = 72 // 1 inch
  const contentWidth = pageWidth - (margin * 2)
  
  // Colors based on design style
  const colors = {
    modern: { primary: rgb(0.1, 0.1, 0.3), accent: rgb(0.3, 0.5, 0.7) },
    classic: { primary: rgb(0.2, 0.15, 0.1), accent: rgb(0.5, 0.4, 0.3) },
    minimal: { primary: rgb(0, 0, 0), accent: rgb(0.5, 0.5, 0.5) },
    vibrant: { primary: rgb(0.2, 0.2, 0.5), accent: rgb(0.8, 0.3, 0.4) }
  }
  const { primary, accent } = colors[designStyle] || colors.modern
  
  // Title Page
  let page = pdfDoc.addPage([pageWidth, pageHeight])
  
  // Title
  const titleLines = wrapText(content.title, boldFont, 32, contentWidth)
  let y = pageHeight - 250
  titleLines.forEach(line => {
    const titleWidth = boldFont.widthOfTextAtSize(line, 32)
    page.drawText(line, {
      x: (pageWidth - titleWidth) / 2,
      y: y,
      size: 32,
      font: boldFont,
      color: primary
    })
    y -= 45
  })
  
  // Subtitle
  if (content.subtitle) {
    const subtitleWidth = italicFont.widthOfTextAtSize(content.subtitle, 16)
    page.drawText(content.subtitle, {
      x: (pageWidth - subtitleWidth) / 2,
      y: y - 30,
      size: 16,
      font: italicFont,
      color: accent
    })
  }
  
  // Decorative line
  page.drawLine({
    start: { x: pageWidth / 2 - 100, y: y - 70 },
    end: { x: pageWidth / 2 + 100, y: y - 70 },
    thickness: 2,
    color: accent
  })
  
  // Created with text
  page.drawText('Created with ProCreators AI', {
    x: (pageWidth - regularFont.widthOfTextAtSize('Created with ProCreators AI', 12)) / 2,
    y: 100,
    size: 12,
    font: regularFont,
    color: accent
  })
  
  // Table of Contents
  page = pdfDoc.addPage([pageWidth, pageHeight])
  page.drawText('Table of Contents', {
    x: margin,
    y: pageHeight - margin - 30,
    size: 24,
    font: boldFont,
    color: primary
  })
  
  y = pageHeight - margin - 80
  page.drawText('Introduction', { x: margin + 20, y, size: 14, font: regularFont, color: primary })
  y -= 30
  
  content.chapters.forEach((chapter, idx) => {
    page.drawText(`Chapter ${chapter.number}: ${chapter.title}`, {
      x: margin + 20,
      y: y,
      size: 14,
      font: regularFont,
      color: primary
    })
    y -= 30
    if (y < margin + 50) {
      page = pdfDoc.addPage([pageWidth, pageHeight])
      y = pageHeight - margin - 50
    }
  })
  
  page.drawText('Conclusion', { x: margin + 20, y: y, size: 14, font: regularFont, color: primary })
  
  // Introduction
  page = pdfDoc.addPage([pageWidth, pageHeight])
  page.drawText('Introduction', {
    x: margin,
    y: pageHeight - margin - 30,
    size: 24,
    font: boldFont,
    color: primary
  })
  
  y = pageHeight - margin - 80
  const introLines = wrapText(content.introduction, regularFont, 12, contentWidth)
  for (const line of introLines) {
    if (y < margin + 50) {
      page = pdfDoc.addPage([pageWidth, pageHeight])
      y = pageHeight - margin - 50
    }
    page.drawText(line, { x: margin, y, size: 12, font: regularFont, color: primary })
    y -= 18
  }
  
  // Chapters
  for (const chapter of content.chapters) {
    page = pdfDoc.addPage([pageWidth, pageHeight])
    
    // Chapter title
    page.drawText(`Chapter ${chapter.number}`, {
      x: margin,
      y: pageHeight - margin - 20,
      size: 14,
      font: regularFont,
      color: accent
    })
    
    const chapterTitleLines = wrapText(chapter.title, boldFont, 22, contentWidth)
    y = pageHeight - margin - 50
    chapterTitleLines.forEach(line => {
      page.drawText(line, { x: margin, y, size: 22, font: boldFont, color: primary })
      y -= 30
    })
    
    y -= 20
    
    // Chapter content
    const paragraphs = chapter.content.split('\n\n')
    for (const paragraph of paragraphs) {
      const lines = wrapText(paragraph, regularFont, 12, contentWidth)
      for (const line of lines) {
        if (y < margin + 80) {
          page = pdfDoc.addPage([pageWidth, pageHeight])
          y = pageHeight - margin - 50
        }
        page.drawText(line, { x: margin, y, size: 12, font: regularFont, color: primary })
        y -= 18
      }
      y -= 10 // Paragraph spacing
    }
    
    // Key Takeaways
    if (chapter.keyTakeaways && chapter.keyTakeaways.length > 0) {
      if (y < margin + 150) {
        page = pdfDoc.addPage([pageWidth, pageHeight])
        y = pageHeight - margin - 50
      }
      
      y -= 30
      page.drawText('Key Takeaways:', { x: margin, y, size: 14, font: boldFont, color: accent })
      y -= 25
      
      chapter.keyTakeaways.forEach((takeaway, idx) => {
        if (y < margin + 50) {
          page = pdfDoc.addPage([pageWidth, pageHeight])
          y = pageHeight - margin - 50
        }
        const bullet = `• ${takeaway}`
        const takeawayLines = wrapText(bullet, italicFont, 11, contentWidth - 20)
        takeawayLines.forEach(line => {
          page.drawText(line, { x: margin + 20, y, size: 11, font: italicFont, color: primary })
          y -= 16
        })
      })
    }
  }
  
  // Conclusion
  page = pdfDoc.addPage([pageWidth, pageHeight])
  page.drawText('Conclusion', {
    x: margin,
    y: pageHeight - margin - 30,
    size: 24,
    font: boldFont,
    color: primary
  })
  
  y = pageHeight - margin - 80
  const conclusionLines = wrapText(content.conclusion, regularFont, 12, contentWidth)
  for (const line of conclusionLines) {
    if (y < margin + 50) {
      page = pdfDoc.addPage([pageWidth, pageHeight])
      y = pageHeight - margin - 50
    }
    page.drawText(line, { x: margin, y, size: 12, font: regularFont, color: primary })
    y -= 18
  }
  
  return pdfDoc
}

export async function POST(request) {
  try {
    const { title, outline, genre, chapterCount, language, designStyle } = await request.json()
    
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
      language || 'english'
    )
    
    console.log('Ebook content generated, creating PDF...')
    
    // Create PDF
    const pdfDoc = await createEbookPDF(ebookContent, designStyle || 'modern')
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
      type: 'ebook',
      category: 'document',
      title: ebookContent.title,
      description: `${genre} ebook with ${chapterCount} chapters`,
      filePath: `/ebooks/${fileName}`,
      fileSize: pdfBytes.length,
      metadata: {
        genre,
        chapterCount,
        language,
        designStyle,
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
