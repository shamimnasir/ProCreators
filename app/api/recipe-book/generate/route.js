import { NextResponse } from 'next/server'
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import { getCollection } from '@/lib/mongodb'
import { randomUUID } from 'crypto'
import fs from 'fs/promises'
import path from 'path'
import { drawCoverPageWithImage, PDF_COLOR_SCHEMES } from '@/lib/pdf-design'
import { generateCoverImage } from '@/lib/cover-image-generator'

// Color schemes for recipe books
const RECIPE_COLOR_SCHEMES = {
  'warm': {
    primary: rgb(0.8, 0.4, 0.2),
    secondary: rgb(0.9, 0.6, 0.3),
    accent: rgb(0.95, 0.9, 0.85),
    background: rgb(1, 0.98, 0.95),
    text: rgb(0.2, 0.15, 0.1)
  },
  'fresh': {
    primary: rgb(0.2, 0.5, 0.3),
    secondary: rgb(0.4, 0.7, 0.4),
    accent: rgb(0.85, 0.95, 0.85),
    background: rgb(0.97, 1, 0.97),
    text: rgb(0.15, 0.25, 0.15)
  },
  'elegant': {
    primary: rgb(0.55, 0.35, 0.15),
    secondary: rgb(0.75, 0.6, 0.35),
    accent: rgb(0.95, 0.92, 0.85),
    background: rgb(1, 0.99, 0.96),
    text: rgb(0.25, 0.2, 0.1)
  },
  'modern': {
    primary: rgb(0.25, 0.25, 0.3),
    secondary: rgb(0.5, 0.5, 0.55),
    accent: rgb(0.9, 0.9, 0.92),
    background: rgb(0.98, 0.98, 0.99),
    text: rgb(0.15, 0.15, 0.2)
  },
  'rustic': {
    primary: rgb(0.5, 0.35, 0.2),
    secondary: rgb(0.7, 0.55, 0.35),
    accent: rgb(0.92, 0.88, 0.8),
    background: rgb(0.98, 0.96, 0.92),
    text: rgb(0.25, 0.2, 0.15)
  },
  'pastel': {
    primary: rgb(0.8, 0.5, 0.6),
    secondary: rgb(0.9, 0.7, 0.75),
    accent: rgb(0.98, 0.92, 0.95),
    background: rgb(1, 0.98, 0.99),
    text: rgb(0.35, 0.25, 0.3)
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
      bookType,
      title,
      subtitle,
      authorName,
      introduction,
      categories,
      recipeCount,
      includeNutrition,
      includePhotos,
      colorScheme,
      coverStyle,
      coverImageStyle,
      customImagePrompt,
      paperSize
    } = await request.json()
    
    // Get paper dimensions
    const width = paperSize?.width || 612
    const height = paperSize?.height || 792
    const margin = 54 // 0.75 inch margins for KDP
    const contentWidth = width - (margin * 2)
    
    // Get color scheme
    const colors = RECIPE_COLOR_SCHEMES[colorScheme] || RECIPE_COLOR_SCHEMES['warm']
    
    // Generate cover image
    let coverImageUrl = null
    if (coverImageStyle && coverImageStyle !== 'gradient') {
      try {
        const themePrompt = customImagePrompt || `beautiful food photography, ${bookType} cookbook, professional culinary photography, appetizing dishes`
        }...`)
        const imageResult = await generateCoverImage('default-elegant', themePrompt)
        if (imageResult.success && imageResult.imageUrl) {
          coverImageUrl = imageResult.imageUrl
          }
      } catch (imgError) {
        }
    }
    
    // Create PDF
    const pdfDoc = await PDFDocument.create()
    const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica)
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
    const italicFont = await pdfDoc.embedFont(StandardFonts.HelveticaOblique)
    
    // ===== COVER PAGE =====
    const coverPage = pdfDoc.addPage([width, height])
    
    if (coverImageUrl) {
      await drawCoverPageWithImage(coverPage, pdfDoc, {
        width,
        height,
        title: title || 'My Recipe Book',
        subtitle: subtitle || 'A Collection of Delicious Recipes',
        authorName: authorName || '',
        year: new Date().getFullYear(),
        colors,
        coverStyle: { hasFrame: false },
        boldFont,
        regularFont,
        coverImageUrl
      })
    } else {
      // Simple cover without image
      coverPage.drawRectangle({
        x: 0, y: 0, width, height,
        color: colors.background
      })
      
      // Title
      const titleLines = wrapText(title || 'My Recipe Book', boldFont, 36, contentWidth)
      let y = height / 2 + 100
      titleLines.forEach(line => {
        const lineWidth = boldFont.widthOfTextAtSize(line, 36)
        coverPage.drawText(line, {
          x: (width - lineWidth) / 2,
          y,
          size: 36,
          font: boldFont,
          color: colors.primary
        })
        y -= 45
      })
      
      // Subtitle
      if (subtitle) {
        const subWidth = regularFont.widthOfTextAtSize(sanitizeText(subtitle), 18)
        coverPage.drawText(sanitizeText(subtitle), {
          x: (width - subWidth) / 2,
          y: y - 20,
          size: 18,
          font: regularFont,
          color: colors.secondary
        })
      }
      
      // Author
      if (authorName) {
        const authorWidth = regularFont.widthOfTextAtSize(sanitizeText(authorName), 14)
        coverPage.drawText(sanitizeText(authorName), {
          x: (width - authorWidth) / 2,
          y: 100,
          size: 14,
          font: regularFont,
          color: colors.text
        })
      }
    }
    
    // ===== TABLE OF CONTENTS =====
    let tocPage = pdfDoc.addPage([width, height])
    let y = height - margin
    
    tocPage.drawText('Table of Contents', {
      x: margin,
      y,
      size: 28,
      font: boldFont,
      color: colors.primary
    })
    y -= 50
    
    let pageNum = 3 // After cover and TOC
    categories?.forEach((category, catIdx) => {
      if (y < margin + 50) {
        tocPage = pdfDoc.addPage([width, height])
        y = height - margin
      }
      
      tocPage.drawText(category.name, {
        x: margin,
        y,
        size: 14,
        font: boldFont,
        color: colors.primary
      })
      
      tocPage.drawText(`${pageNum}`, {
        x: width - margin - 30,
        y,
        size: 12,
        font: regularFont,
        color: colors.secondary
      })
      y -= 25
      
      category.recipes?.forEach((recipe, recIdx) => {
        if (y < margin + 30) {
          tocPage = pdfDoc.addPage([width, height])
          y = height - margin
        }
        
        const recipeName = sanitizeText(recipe.name).substring(0, 40) + (recipe.name?.length > 40 ? '...' : '')
        tocPage.drawText(`    ${recipeName}`, {
          x: margin + 20,
          y,
          size: 11,
          font: regularFont,
          color: colors.text
        })
        y -= 18
        pageNum++
      })
      
      y -= 15
    })
    
    // ===== INTRODUCTION PAGE =====
    if (introduction) {
      const introPage = pdfDoc.addPage([width, height])
      y = height - margin
      
      introPage.drawText('Introduction', {
        x: margin,
        y,
        size: 24,
        font: boldFont,
        color: colors.primary
      })
      y -= 40
      
      const introLines = wrapText(introduction, regularFont, 12, contentWidth)
      introLines.forEach(line => {
        if (y < margin) return
        introPage.drawText(line, {
          x: margin,
          y,
          size: 12,
          font: regularFont,
          color: colors.text
        })
        y -= 20
      })
    }
    
    // ===== RECIPE PAGES =====
    for (const category of (categories || [])) {
      // Category divider page
      const catPage = pdfDoc.addPage([width, height])
      catPage.drawRectangle({
        x: 0, y: 0, width, height,
        color: colors.accent
      })
      
      const catNameWidth = boldFont.widthOfTextAtSize(sanitizeText(category.name), 32)
      catPage.drawText(sanitizeText(category.name), {
        x: (width - catNameWidth) / 2,
        y: height / 2,
        size: 32,
        font: boldFont,
        color: colors.primary
      })
      
      // Decorative line
      catPage.drawLine({
        start: { x: width / 2 - 80, y: height / 2 - 30 },
        end: { x: width / 2 + 80, y: height / 2 - 30 },
        thickness: 2,
        color: colors.secondary
      })
      
      // Recipe count
      const countText = `${category.recipes?.length || 0} Recipes`
      const countWidth = regularFont.widthOfTextAtSize(countText, 14)
      catPage.drawText(countText, {
        x: (width - countWidth) / 2,
        y: height / 2 - 60,
        size: 14,
        font: regularFont,
        color: colors.secondary
      })
      
      // Individual recipe pages
      for (const recipe of (category.recipes || [])) {
        let recipePage = pdfDoc.addPage([width, height])
        y = height - margin
        
        // Recipe name
        const recipeNameLines = wrapText(recipe.name, boldFont, 22, contentWidth)
        recipeNameLines.forEach(line => {
          recipePage.drawText(line, {
            x: margin,
            y,
            size: 22,
            font: boldFont,
            color: colors.primary
          })
          y -= 30
        })
        
        // Meta info (servings, time)
        y -= 10
        const metaText = `Serves: ${recipe.servings || 4}  |  Prep: ${recipe.prepTime || '15 mins'}  |  Cook: ${recipe.cookTime || '30 mins'}`
        recipePage.drawText(sanitizeText(metaText), {
          x: margin,
          y,
          size: 10,
          font: italicFont,
          color: colors.secondary
        })
        y -= 30
        
        // Ingredients section
        recipePage.drawText('Ingredients', {
          x: margin,
          y,
          size: 14,
          font: boldFont,
          color: colors.primary
        })
        y -= 22
        
        for (const ingredient of (recipe.ingredients || [])) {
          if (y < margin + 100) {
            recipePage = pdfDoc.addPage([width, height])
            y = height - margin
          }
          
          recipePage.drawCircle({
            x: margin + 5,
            y: y + 3,
            size: 3,
            color: colors.secondary
          })
          
          const ingLines = wrapText(ingredient, regularFont, 11, contentWidth - 20)
          ingLines.forEach((line, i) => {
            recipePage.drawText(line, {
              x: margin + 15,
              y,
              size: 11,
              font: regularFont,
              color: colors.text
            })
            y -= 16
          })
        }
        
        y -= 20
        
        // Instructions section
        if (y < margin + 150) {
          recipePage = pdfDoc.addPage([width, height])
          y = height - margin
        }
        
        recipePage.drawText('Instructions', {
          x: margin,
          y,
          size: 14,
          font: boldFont,
          color: colors.primary
        })
        y -= 22
        
        for (let i = 0; i < (recipe.instructions || []).length; i++) {
          if (y < margin + 60) {
            recipePage = pdfDoc.addPage([width, height])
            y = height - margin
          }
          
          // Step number
          recipePage.drawText(`${i + 1}.`, {
            x: margin,
            y,
            size: 11,
            font: boldFont,
            color: colors.secondary
          })
          
          const instLines = wrapText(recipe.instructions[i], regularFont, 11, contentWidth - 25)
          instLines.forEach((line, idx) => {
            recipePage.drawText(line, {
              x: margin + 25,
              y: y - (idx * 16),
              size: 11,
              font: regularFont,
              color: colors.text
            })
          })
          y -= (instLines.length * 16) + 8
        }
        
        // Tips if available
        if (recipe.tips) {
          y -= 15
          if (y < margin + 60) {
            recipePage = pdfDoc.addPage([width, height])
            y = height - margin
          }
          
          recipePage.drawRectangle({
            x: margin,
            y: y - 35,
            width: contentWidth,
            height: 45,
            color: colors.accent,
            borderColor: colors.secondary,
            borderWidth: 1
          })
          
          recipePage.drawText('Tip:', {
            x: margin + 10,
            y: y - 10,
            size: 10,
            font: boldFont,
            color: colors.primary
          })
          
          const tipLines = wrapText(recipe.tips, italicFont, 10, contentWidth - 50)
          tipLines.slice(0, 2).forEach((line, i) => {
            recipePage.drawText(line, {
              x: margin + 35,
              y: y - 10 - (i * 14),
              size: 10,
              font: italicFont,
              color: colors.text
            })
          })
        }
      }
    }
    
    // ===== NOTES PAGES (2 pages for personal notes) =====
    for (let n = 0; n < 2; n++) {
      const notesPage = pdfDoc.addPage([width, height])
      y = height - margin
      
      notesPage.drawText(n === 0 ? 'Notes' : '', {
        x: margin,
        y,
        size: 24,
        font: boldFont,
        color: colors.primary
      })
      
      y -= 50
      while (y > margin + 20) {
        notesPage.drawLine({
          start: { x: margin, y },
          end: { x: width - margin, y },
          thickness: 0.5,
          color: colors.accent
        })
        y -= 28
      }
    }
    
    // Save PDF
    const pdfBytes = await pdfDoc.save()
    
    const outputDir = '/app/public/recipe-books'
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
      type: 'recipe-book',
      category: 'document',
      title: title || 'My Recipe Book',
      description: `${bookType} cookbook with ${categories?.length || 0} categories`,
      filePath: `/recipe-books/${fileName}`,
      fileSize: pdfBytes.length,
      metadata: { bookType, colorScheme, recipeCount },
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    })
    
    } pages`)
    
    return NextResponse.json({
      success: true,
      title: title || 'My Recipe Book',
      downloadUrl: `/recipe-books/${fileName}`,
      pageCount: pdfDoc.getPageCount(),
      libraryId: documentId
    })
    
  } catch (error) {
    console.error('Recipe book generation error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to generate recipe book' },
      { status: 500 }
    )
  }
}
