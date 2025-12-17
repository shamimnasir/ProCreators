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
import { generatePDFFromHTML } from '@/lib/html-pdf-generator'

// Check if text contains non-Latin characters (Bengali, Hindi, Arabic, Chinese, etc.)
function hasNonLatinCharacters(text) {
  if (!text) return false
  // Match characters outside basic Latin and Latin-1 Supplement
  const nonLatinPattern = /[^\u0000-\u024F\u1E00-\u1EFF]/
  return nonLatinPattern.test(text)
}

// Check if the worksheet contains non-Latin content
function worksheetRequiresUnicode(cover, sections, bonusQuestions) {
  // Check cover
  if (hasNonLatinCharacters(cover?.title)) return true
  if (hasNonLatinCharacters(cover?.subtitle)) return true
  if (hasNonLatinCharacters(cover?.instructions)) return true
  if (hasNonLatinCharacters(cover?.teacherName)) return true
  
  // Check sections
  for (const section of (sections || [])) {
    if (hasNonLatinCharacters(section?.name)) return true
    if (hasNonLatinCharacters(section?.instructions)) return true
    for (const q of (section?.questions || [])) {
      if (hasNonLatinCharacters(q?.question)) return true
      if (hasNonLatinCharacters(q?.answer)) return true
      for (const opt of (q?.options || [])) {
        if (hasNonLatinCharacters(opt)) return true
      }
    }
  }
  
  // Check bonus questions
  for (const q of (bonusQuestions || [])) {
    if (hasNonLatinCharacters(q?.question)) return true
    if (hasNonLatinCharacters(q?.answer)) return true
  }
  
  return false
}

// Sanitize text for Latin-only PDF (pdf-lib)
function sanitizeTextLatin(text) {
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

// Escape HTML for Puppeteer path
function escapeHTML(text) {
  if (!text) return ''
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

function wrapText(text, font, fontSize, maxWidth) {
  const cleanText = sanitizeTextLatin(text || '')
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

// Generate HTML for Puppeteer (multi-language support)
function generateWorksheetHTML(data) {
  const { cover, sections, bonusQuestions, includeAnswerKey, settings } = data
  const primaryColor = settings?.customPrimaryColor || '#1e40af'
  const secondaryColor = settings?.customSecondaryColor || '#3b82f6'
  
  // Generate questions HTML
  let questionNum = 1
  const sectionsHTML = sections.map(section => {
    const questionsHTML = (section.questions || []).map(q => {
      const num = questionNum++
      let optionsHTML = ''
      if (section.type === 'multiple-choice' && q.options) {
        optionsHTML = `<div class="options">${q.options.map(opt => 
          `<div class="option">${escapeHTML(opt)}</div>`
        ).join('')}</div>`
      }
      const answerLines = section.type === 'short-answer' || section.type === 'fill-blank'
        ? '<div class="answer-lines"><div class="line"></div><div class="line"></div></div>'
        : ''
      
      return `
        <div class="question">
          <div class="question-header">
            <span class="q-num">${num}</span>
            <span class="q-text">${escapeHTML(q.question)}</span>
          </div>
          ${optionsHTML}
          ${answerLines}
        </div>
      `
    }).join('')
    
    return `
      <div class="section">
        <div class="section-header">${escapeHTML(section.name)}</div>
        ${section.instructions ? `<div class="section-instructions">${escapeHTML(section.instructions)}</div>` : ''}
        <div class="questions">${questionsHTML}</div>
      </div>
    `
  }).join('')
  
  // Bonus questions
  const bonusHTML = bonusQuestions?.length ? `
    <div class="section bonus-section">
      <div class="section-header bonus-header">BONUS QUESTIONS</div>
      ${bonusQuestions.map((q, idx) => `
        <div class="bonus-question">
          <strong>Bonus ${idx + 1}:</strong> ${escapeHTML(q.question)}
          <div class="answer-lines">
            <div class="line"></div>
            <div class="line"></div>
            <div class="line"></div>
          </div>
        </div>
      `).join('')}
    </div>
  ` : ''
  
  // Answer key
  const answerKeyHTML = includeAnswerKey !== false ? `
    <div class="answer-key-page">
      <h2 class="answer-key-title">ANSWER KEY</h2>
      <div class="answer-key-subtitle">${escapeHTML(cover.title)}</div>
      ${sections.map(section => {
        let num = 1
        return `
          <div class="answer-section">
            <div class="answer-section-name">${escapeHTML(section.name)}</div>
            ${(section.questions || []).map(q => {
              const currentNum = num++
              return `<div class="answer-item">${currentNum}. ${escapeHTML(q.answer)}</div>`
            }).join('')}
          </div>
        `
      }).join('')}
      ${bonusQuestions?.length ? `
        <div class="answer-section">
          <div class="answer-section-name">Bonus Answers</div>
          ${bonusQuestions.map((q, idx) => `
            <div class="answer-item">Bonus ${idx + 1}: ${escapeHTML(q.answer)}</div>
          `).join('')}
        </div>
      ` : ''}
    </div>
  ` : ''
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <link href="https://fonts.googleapis.com/css2?family=Noto+Sans:wght@400;600;700&family=Noto+Sans+Bengali:wght@400;600;700&family=Noto+Sans+Devanagari:wght@400;600;700&family=Noto+Sans+Arabic:wght@400;600;700&family=Noto+Sans+SC:wght@400;600;700&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Noto Sans', 'Noto Sans Bengali', 'Noto Sans Devanagari', 'Noto Sans Arabic', 'Noto Sans SC', Arial, sans-serif;
      font-size: 11pt;
      line-height: 1.5;
      color: #333;
    }
    
    /* Cover Page */
    .cover-page {
      height: 100vh;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      background: linear-gradient(135deg, ${primaryColor}22 0%, ${secondaryColor}11 100%);
      text-align: center;
      padding: 60px;
      page-break-after: always;
    }
    .cover-title {
      font-size: 32pt;
      font-weight: 700;
      color: ${primaryColor};
      margin-bottom: 20px;
      line-height: 1.3;
    }
    .cover-subtitle {
      font-size: 14pt;
      color: #666;
      margin-bottom: 30px;
    }
    .cover-teacher {
      font-size: 12pt;
      color: ${primaryColor};
      font-weight: 600;
      margin-top: 40px;
    }
    
    /* Student Info Page */
    .info-page {
      padding: 40px 50px;
      page-break-after: always;
    }
    .info-header {
      background: ${primaryColor};
      color: white;
      padding: 15px 20px;
      margin: -40px -50px 30px -50px;
      font-size: 16pt;
      font-weight: 600;
    }
    .info-fields {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin-bottom: 30px;
    }
    .info-field {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .info-field label {
      font-weight: 600;
      min-width: 60px;
    }
    .info-field .field-line {
      flex: 1;
      border-bottom: 1px solid #999;
      height: 20px;
    }
    .instructions-box {
      background: ${primaryColor}10;
      border-left: 4px solid ${primaryColor};
      padding: 15px 20px;
      margin-top: 20px;
    }
    .instructions-label {
      font-weight: 700;
      color: ${primaryColor};
      margin-bottom: 8px;
    }
    
    /* Sections */
    .section {
      margin-bottom: 30px;
      page-break-inside: avoid;
    }
    .section-header {
      background: ${primaryColor};
      color: white;
      padding: 10px 15px;
      font-weight: 600;
      font-size: 12pt;
      margin-bottom: 15px;
    }
    .bonus-header {
      background: ${secondaryColor};
    }
    .section-instructions {
      font-style: italic;
      color: #666;
      margin-bottom: 15px;
      font-size: 10pt;
    }
    
    /* Questions */
    .question {
      margin-bottom: 20px;
      page-break-inside: avoid;
    }
    .question-header {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      margin-bottom: 8px;
    }
    .q-num {
      background: ${primaryColor}20;
      color: ${primaryColor};
      font-weight: 700;
      width: 24px;
      height: 24px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 10pt;
      flex-shrink: 0;
    }
    .q-text {
      flex: 1;
    }
    .options {
      margin-left: 34px;
      margin-top: 8px;
    }
    .option {
      margin-bottom: 6px;
      padding-left: 10px;
    }
    .answer-lines {
      margin-left: 34px;
      margin-top: 10px;
    }
    .answer-lines .line {
      border-bottom: 1px solid #ccc;
      height: 25px;
      margin-bottom: 5px;
    }
    
    /* Bonus */
    .bonus-question {
      margin-bottom: 20px;
      padding: 10px;
      background: ${secondaryColor}10;
      border-radius: 8px;
    }
    
    /* Answer Key */
    .answer-key-page {
      page-break-before: always;
      padding: 40px 50px;
    }
    .answer-key-title {
      background: ${primaryColor};
      color: white;
      padding: 15px 20px;
      margin: -40px -50px 20px -50px;
      font-size: 18pt;
    }
    .answer-key-subtitle {
      font-size: 14pt;
      font-weight: 600;
      color: ${primaryColor};
      margin-bottom: 20px;
    }
    .answer-section {
      margin-bottom: 20px;
    }
    .answer-section-name {
      font-weight: 600;
      color: ${secondaryColor};
      margin-bottom: 8px;
      font-size: 11pt;
    }
    .answer-item {
      margin-bottom: 5px;
      margin-left: 10px;
    }
    
    /* Questions page */
    .questions-page {
      padding: 40px 50px;
    }
  </style>
</head>
<body>
  <!-- Cover Page -->
  <div class="cover-page">
    <h1 class="cover-title">${escapeHTML(cover.title)}</h1>
    <p class="cover-subtitle">${escapeHTML(cover.subtitle || `${cover.subject} - ${cover.gradeLevel}`)}</p>
    ${cover.teacherName ? `<p class="cover-teacher">${escapeHTML(cover.teacherName)}</p>` : ''}
  </div>
  
  <!-- Student Info Page -->
  <div class="info-page">
    <div class="info-header">${escapeHTML(cover.title)}</div>
    <div class="info-fields">
      <div class="info-field"><label>Name:</label><div class="field-line"></div></div>
      <div class="info-field"><label>Date:</label><div class="field-line"></div></div>
      <div class="info-field"><label>Class:</label><div class="field-line"></div></div>
      <div class="info-field"><label>Score:</label><div class="field-line"></div></div>
    </div>
    ${cover.instructions ? `
      <div class="instructions-box">
        <div class="instructions-label">Instructions:</div>
        <p>${escapeHTML(cover.instructions)}</p>
      </div>
    ` : ''}
  </div>
  
  <!-- Questions -->
  <div class="questions-page">
    ${sectionsHTML}
    ${bonusHTML}
  </div>
  
  <!-- Answer Key -->
  ${answerKeyHTML}
</body>
</html>
  `
}

export async function POST(request) {
  try {
    const { cover, sections, bonusQuestions, settings, includeAnswerKey, language } = await request.json()
    
    if (!cover?.title || !sections?.length) {
      return NextResponse.json(
        { success: false, error: 'Title and sections are required' },
        { status: 400 }
      )
    }
    
    console.log(`Generating worksheet PDF: "${cover.title}"...`)
    console.log(`Language: ${language || 'English'}`)
    
    const colorScheme = settings?.colorScheme || 'ocean-blue'
    const coverStyle = settings?.coverStyle || 'modern'
    const subject = settings?.subject || 'general'
    const customPrimaryColor = settings?.customPrimaryColor || '#1e40af'
    const customSecondaryColor = settings?.customSecondaryColor || '#3b82f6'
    
    // Determine if we need Puppeteer (for non-Latin scripts)
    const requiresUnicode = worksheetRequiresUnicode(cover, sections, bonusQuestions)
    console.log(`Requires Unicode (Puppeteer): ${requiresUnicode}`)
    
    let pdfBytes
    let pageCount = 0
    
    if (requiresUnicode) {
      // ===== PUPPETEER PATH (Multi-language) =====
      console.log('Using Puppeteer for multi-language support...')
      
      const htmlContent = generateWorksheetHTML({
        cover,
        sections,
        bonusQuestions,
        includeAnswerKey,
        settings: {
          customPrimaryColor,
          customSecondaryColor
        }
      })
      
      pdfBytes = await generatePDFFromHTML(htmlContent)
      
      // Count pages (approximate based on content)
      pageCount = 2 + Math.ceil(sections.reduce((sum, s) => sum + (s.questions?.length || 0), 0) / 8)
      if (includeAnswerKey !== false) pageCount++
      
    } else {
      // ===== PDF-LIB PATH (Latin scripts) =====
      console.log('Using pdf-lib for Latin script...')
      
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
      
      // Create custom color scheme from settings
      const colors = {
        primary: hexToRgb(customPrimaryColor),
        secondary: hexToRgb(customSecondaryColor),
        accent: hexToRgb(customPrimaryColor, 0.1),
        text: rgb(0.2, 0.2, 0.2),
        background: rgb(1, 1, 1)
      }
      
      const coverStyleObj = COVER_STYLES[coverStyle] || COVER_STYLES['modern']
      
      // ===== COVER PAGE =====
      let page = pdfDoc.addPage([pageWidth, pageHeight])
      
      if (coverImageUrl) {
        await drawCoverPageWithImage(page, pdfDoc, {
          width: pageWidth,
          height: pageHeight,
          title: sanitizeTextLatin(cover.title),
          subtitle: sanitizeTextLatin(cover.subtitle || `${cover.subject} - ${cover.gradeLevel}`),
          authorName: sanitizeTextLatin(cover.teacherName),
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
          title: sanitizeTextLatin(cover.title),
          subtitle: sanitizeTextLatin(cover.subtitle || `${cover.subject} - ${cover.gradeLevel}`),
          authorName: sanitizeTextLatin(cover.teacherName),
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
      page.drawText(sanitizeTextLatin(cover.title), {
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
        page.drawText(sanitizeTextLatin(section.name), {
          x: margin,
          y: y,
          size: 12,
          font: boldFont,
          color: colors.background,
        })
        
        if (section.instructions) {
          y -= 35
          page.drawText(sanitizeTextLatin(section.instructions), {
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
              page.drawText(sanitizeTextLatin(opt), {
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
          page.drawText(sanitizeTextLatin(section.name), {
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
            
            page.drawText(`${questionNum}. ${sanitizeTextLatin(q.answer)}`, {
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
            page.drawText(`Bonus ${idx + 1}: ${sanitizeTextLatin(q.answer)}`, {
              x: margin + 10, y, size: 10, font: regularFont, color: colors.text
            })
            y -= 18
          })
        }
      }
      
      pdfBytes = await pdfDoc.save()
      pageCount = pdfDoc.getPageCount()
    }
    
    // Save PDF
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
      title: cover.title,
      description: `${cover.subject} worksheet for ${cover.gradeLevel}`,
      filePath: `/worksheets/${fileName}`,
      fileSize: pdfBytes.length,
      tool: 'worksheet-maker',
      metadata: { 
        subject, 
        gradeLevel: cover.gradeLevel, 
        colorScheme, 
        coverStyle,
        language: language || 'English',
        customColors: { primary: customPrimaryColor, secondary: customSecondaryColor }
      },
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    })
    
    console.log(`Worksheet PDF generated: ${filePath}`)
    
    return NextResponse.json({
      success: true,
      downloadUrl: `/worksheets/${fileName}`,
      pageCount,
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

// Helper: Convert hex color to rgb for pdf-lib
function hexToRgb(hex, alpha = 1) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  if (!result) return rgb(0.1, 0.25, 0.7) // default blue
  return rgb(
    parseInt(result[1], 16) / 255 * alpha,
    parseInt(result[2], 16) / 255 * alpha,
    parseInt(result[3], 16) / 255 * alpha
  )
}
