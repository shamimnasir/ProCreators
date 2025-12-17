import { NextResponse } from 'next/server'
import { PDFDocument, rgb } from 'pdf-lib'
import { getCollection } from '@/lib/mongodb'
import { randomUUID } from 'crypto'
import fs from 'fs/promises'
import path from 'path'
import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.EMERGENT_LLM_KEY || process.env.GOOGLE_API_KEY)

// Generate coloring page descriptions with AI
async function generatePageDescriptions(theme, customTheme, difficulty, pageCount) {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })
    
    const themeDescription = customTheme || theme
    const difficultyGuide = {
      easy: 'Simple, large shapes with minimal details. Suitable for young children ages 3-6.',
      medium: 'Moderate detail with some smaller areas. Suitable for children ages 7-12.',
      hard: 'Intricate details and finer lines. Suitable for teens and adults.',
      expert: 'Highly detailed and complex designs like mandalas. For experienced colorers.'
    }
    
    const prompt = `Generate ${pageCount} unique coloring page descriptions for a "${themeDescription}" themed coloring book.

Difficulty Level: ${difficulty} - ${difficultyGuide[difficulty]}

For each page, provide:
1. A title for the page
2. A detailed description of what should be drawn (for an artist to create)
3. Key elements to include

Format as JSON array:
[
  {
    "title": "Page title",
    "description": "Detailed description of the scene/design",
    "elements": ["element1", "element2", "element3"]
  }
]

Make each page unique and varied. Include a mix of simple and slightly more complex designs within the difficulty level.
IMPORTANT: Return ONLY valid JSON array, no markdown.`

    const result = await model.generateContent(prompt)
    const response = await result.response
    let text = response.text().trim()
    text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    
    return JSON.parse(text)
  } catch (error) {
    console.error('AI generation error:', error)
    // Return fallback pages
    return Array.from({ length: pageCount }, (_, i) => ({
      title: `${theme} Page ${i + 1}`,
      description: `A ${difficulty} difficulty coloring page featuring ${theme}`,
      elements: [theme, 'decorative elements', 'background details']
    }))
  }
}

export async function POST(request) {
  try {
    const { theme, customTheme, difficulty, pageCount, pages, title, authorName } = await request.json()
    
    console.log(`Generating coloring book: ${customTheme || theme}, ${pageCount} pages`)
    
    // If pages are provided (from editor), use them. Otherwise generate new ones.
    let coloringPages = pages
    if (!coloringPages || coloringPages.length === 0) {
      coloringPages = await generatePageDescriptions(theme, customTheme, difficulty, pageCount || 10)
    }
    
    // Create PDF
    const pdfDoc = await PDFDocument.create()
    const pageWidth = 612
    const pageHeight = 792
    
    // Title colors based on theme
    const themeColors = {
      animals: rgb(0.6, 0.4, 0.2),
      nature: rgb(0.2, 0.6, 0.3),
      mandala: rgb(0.5, 0.3, 0.6),
      fantasy: rgb(0.6, 0.3, 0.5),
      ocean: rgb(0.2, 0.4, 0.7),
      space: rgb(0.3, 0.2, 0.5),
      holiday: rgb(0.7, 0.2, 0.2),
      patterns: rgb(0.4, 0.4, 0.4),
      characters: rgb(0.8, 0.5, 0.3),
      vehicles: rgb(0.3, 0.4, 0.5),
      custom: rgb(0.4, 0.3, 0.6)
    }
    const themeColor = themeColors[theme] || themeColors.custom
    
    // ===== COVER PAGE =====
    let page = pdfDoc.addPage([pageWidth, pageHeight])
    
    // Cover background
    page.drawRectangle({
      x: 0, y: 0,
      width: pageWidth, height: pageHeight,
      color: rgb(0.98, 0.98, 0.95)
    })
    
    // Decorative border
    page.drawRectangle({
      x: 30, y: 30,
      width: pageWidth - 60, height: pageHeight - 60,
      borderColor: themeColor,
      borderWidth: 3
    })
    
    // Title
    const bookTitle = title || `${customTheme || theme} Coloring Book`
    page.drawText(bookTitle.toUpperCase(), {
      x: pageWidth / 2 - (bookTitle.length * 8),
      y: pageHeight - 200,
      size: 28,
      color: themeColor
    })
    
    // Subtitle
    const subtitle = `${coloringPages.length} Beautiful Pages to Color`
    page.drawText(subtitle, {
      x: pageWidth / 2 - (subtitle.length * 4),
      y: pageHeight - 250,
      size: 14,
      color: rgb(0.4, 0.4, 0.4)
    })
    
    // Difficulty badge
    const diffLabel = `Difficulty: ${difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}`
    page.drawText(diffLabel, {
      x: pageWidth / 2 - (diffLabel.length * 4),
      y: pageHeight - 290,
      size: 12,
      color: rgb(0.5, 0.5, 0.5)
    })
    
    // Author if provided
    if (authorName) {
      page.drawText(`By ${authorName}`, {
        x: pageWidth / 2 - (authorName.length * 3),
        y: 150,
        size: 14,
        color: themeColor
      })
    }
    
    // ===== COLORING PAGES =====
    for (let i = 0; i < coloringPages.length; i++) {
      const pageData = coloringPages[i]
      page = pdfDoc.addPage([pageWidth, pageHeight])
      
      // Light background
      page.drawRectangle({
        x: 0, y: 0,
        width: pageWidth, height: pageHeight,
        color: rgb(1, 1, 1)
      })
      
      // Page border (for coloring)
      page.drawRectangle({
        x: 40, y: 40,
        width: pageWidth - 80, height: pageHeight - 120,
        borderColor: rgb(0.85, 0.85, 0.85),
        borderWidth: 1
      })
      
      // Page title at top
      const pageTitle = pageData.title || `Page ${i + 1}`
      page.drawText(pageTitle, {
        x: pageWidth / 2 - (pageTitle.length * 5),
        y: pageHeight - 50,
        size: 16,
        color: rgb(0.3, 0.3, 0.3)
      })
      
      // Placeholder text (in a real implementation, this would be actual line art)
      page.drawText('🎨', {
        x: pageWidth / 2 - 20,
        y: pageHeight / 2,
        size: 80,
        color: rgb(0.9, 0.9, 0.9)
      })
      
      // Description at bottom (small, for reference)
      const desc = pageData.description?.substring(0, 80) || ''
      page.drawText(desc, {
        x: 50,
        y: 60,
        size: 8,
        color: rgb(0.7, 0.7, 0.7)
      })
      
      // Page number
      page.drawText(`${i + 1}`, {
        x: pageWidth / 2 - 5,
        y: 25,
        size: 10,
        color: rgb(0.5, 0.5, 0.5)
      })
    }
    
    // Save PDF
    const pdfBytes = await pdfDoc.save()
    
    const outputDir = '/app/public/coloring-books'
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
      type: 'coloring-book',
      category: 'document',
      title: bookTitle,
      description: `${coloringPages.length} page coloring book - ${difficulty} difficulty`,
      filePath: `/coloring-books/${fileName}`,
      fileSize: pdfBytes.length,
      tool: 'coloring-book',
      metadata: { 
        theme: customTheme || theme, 
        difficulty, 
        pageCount: coloringPages.length,
        pages: coloringPages 
      },
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    })
    
    console.log(`Coloring book generated: ${filePath}`)
    
    return NextResponse.json({
      success: true,
      title: bookTitle,
      downloadUrl: `/coloring-books/${fileName}`,
      pageCount: coloringPages.length,
      pages: coloringPages,
      libraryId: documentId
    })
    
  } catch (error) {
    console.error('Coloring book generation error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to generate coloring book' },
      { status: 500 }
    )
  }
}
