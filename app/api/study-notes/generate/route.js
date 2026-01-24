import { NextResponse } from 'next/server'
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import fontkit from '@pdf-lib/fontkit'
import { spawn } from 'child_process'
import path from 'path'
import fs from 'fs/promises'
import { v4 as uuidv4 } from 'uuid'

// Check if text contains Bangla characters
function containsBangla(text) {
  if (!text) return false
  return /[\u0980-\u09FF]/.test(text)
}

// Check if any notes content has Bangla
function notesHaveBangla(notes) {
  if (!notes) return false
  return containsBangla(notes.title) || 
         containsBangla(notes.content) || 
         containsBangla(notes.keyTerms) ||
         containsBangla(notes.examples) ||
         containsBangla(notes.questions) ||
         containsBangla(notes.summary)
}

// Sanitize text - keeps Unicode/Bangla characters
function sanitizeText(text) {
  if (!text) return ''
  return String(text)
    .replace(/[\r\t]/g, ' ')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/\u2026/g, '...')
    .replace(/\u2013/g, '-')
    .replace(/\u2014/g, '--')
    .replace(/\u00A0/g, ' ')
    .trim()
}

// Helper to extract text from PDF
async function extractTextFromPDF(buffer) {
  try {
    const pdfParse = (await import('pdf-parse')).default
    const data = await pdfParse(buffer)
    return data.text || ''
  } catch (error) {
    console.error('PDF extraction error:', error)
    return ''
  }
}

// Helper to run LLM - using temp file to avoid E2BIG error with large content
async function runLLM(prompt, systemPrompt = 'You are an expert educator and study guide creator.') {
  return new Promise(async (resolve, reject) => {
    try {
      const scriptPath = path.join(process.cwd(), 'scripts', 'llm_call.py')
      
      const inputData = JSON.stringify({
        prompt,
        system_prompt: systemPrompt
      })
      
      // Write input to temp file to avoid command line argument size limit
      const tempDir = path.join(process.cwd(), 'tmp')
      await fs.mkdir(tempDir, { recursive: true })
      const tempFile = path.join(tempDir, `llm-input-${uuidv4()}.json`)
      await fs.writeFile(tempFile, inputData, 'utf-8')
      
      // Pass temp file path instead of data directly
      const pythonProcess = spawn('/root/.venv/bin/python3', [scriptPath, '--file', tempFile], {
        env: { ...process.env }
      })

      let stdout = ''
      let stderr = ''

      pythonProcess.stdout.on('data', (data) => {
        stdout += data.toString()
      })

      pythonProcess.stderr.on('data', (data) => {
        stderr += data.toString()
      })

      pythonProcess.on('close', async (code) => {
        // Clean up temp file
        try {
          await fs.unlink(tempFile)
        } catch (e) {
          // Ignore cleanup errors
        }
        
        if (code !== 0) {
          console.error('LLM stderr:', stderr)
          reject(new Error(`LLM process failed: ${stderr}`))
        } else {
          try {
            const result = JSON.parse(stdout)
            resolve(result.response || result.content || result)
          } catch {
            resolve(stdout.trim())
          }
        }
      })
      
      pythonProcess.on('error', async (err) => {
        // Clean up temp file on error
        try {
          await fs.unlink(tempFile)
        } catch (e) {
          // Ignore cleanup errors
        }
        reject(new Error(`Failed to start LLM process: ${err.message}`))
      })
    } catch (error) {
      reject(error)
    }
  })
}

// Helper to convert hex to RGB
function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result ? {
    r: parseInt(result[1], 16) / 255,
    g: parseInt(result[2], 16) / 255,
    b: parseInt(result[3], 16) / 255
  } : { r: 0.1, g: 0.25, b: 0.7 }
}

// Text wrapping helper - safe for custom fonts
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
    } catch {
      // If width calculation fails, add current line and start new
      if (currentLine) lines.push(currentLine)
      currentLine = word
    }
  }
  if (currentLine) {
    lines.push(currentLine)
  }
  return lines
}

// Safe text drawing - handles font errors gracefully, tries Bangla font first
function drawText(page, text, options, banglaFont = null, fallbackFont = null) {
  const cleanText = sanitizeText(text)
  if (!cleanText) return
  
  // Try with the provided font first
  try {
    page.drawText(cleanText, options)
    return
  } catch (e) {
    // Font failed, try alternatives
  }
  
  // If we have a Bangla font and text has Bangla, try Bangla font
  if (banglaFont && containsBangla(cleanText)) {
    try {
      page.drawText(cleanText, { ...options, font: banglaFont })
      return
    } catch (e) {
      // Bangla font also failed
    }
  }
  
  // Try fallback font
  if (fallbackFont) {
    try {
      page.drawText(cleanText, { ...options, font: fallbackFont })
      return
    } catch (e) {
      // Fallback also failed
    }
  }
  
  // Last resort - skip the text
  console.warn('Could not render text:', cleanText.substring(0, 50))
}

// Draw a rounded rectangle
function drawRoundedRect(page, x, y, width, height, radius, options) {
  // For pdf-lib, we draw a simple rectangle (rounded corners require complex paths)
  page.drawRectangle({
    x,
    y,
    width,
    height,
    ...options
  })
}

// Draw Mind Map Node
function drawMindMapNode(page, x, y, text, font, fontSize, nodeColor, textColor, maxWidth = 150) {
  const padding = 10
  const lines = wrapText(text, font, fontSize, maxWidth - padding * 2)
  const lineHeight = fontSize + 4
  const boxHeight = lines.length * lineHeight + padding * 2
  const boxWidth = maxWidth
  
  // Draw node background
  page.drawRectangle({
    x: x - boxWidth / 2,
    y: y - boxHeight / 2,
    width: boxWidth,
    height: boxHeight,
    color: nodeColor,
    borderColor: rgb(nodeColor.red * 0.7, nodeColor.green * 0.7, nodeColor.blue * 0.7),
    borderWidth: 1.5
  })
  
  // Draw text
  let textY = y + boxHeight / 2 - padding - fontSize
  for (const line of lines) {
    const textWidth = font.widthOfTextAtSize(line, fontSize)
    drawText(page, line, {
      x: x - textWidth / 2,
      y: textY,
      size: fontSize,
      font,
      color: textColor
    })
    textY -= lineHeight
  }
  
  return { width: boxWidth, height: boxHeight }
}

// Draw connection line between nodes
function drawConnection(page, x1, y1, x2, y2, color) {
  page.drawLine({
    start: { x: x1, y: y1 },
    end: { x: x2, y: y2 },
    thickness: 2,
    color,
    opacity: 0.6
  })
}

// Generate Mind Map PDF
async function generateMindMapPDF(notes, config, pdfDoc, fonts) {
  const { width, height, margin, primary, secondary, accent, authorName, instituteName } = config
  const { regularFont, boldFont } = fonts
  
  let page = pdfDoc.addPage([width, height])
  
  // Header
  page.drawRectangle({
    x: 0,
    y: height - 100,
    width,
    height: 100,
    color: rgb(primary.r, primary.g, primary.b)
  })
  
  // Title
  const titleText = notes.title || 'Study Notes Mind Map'
  const titleLines = wrapText(titleText, boldFont, 24, width - 100)
  let titleY = height - 40
  for (const line of titleLines) {
    drawText(page, line, {
      x: margin,
      y: titleY,
      size: 24,
      font: boldFont,
      color: rgb(1, 1, 1)
    })
    titleY -= 30
  }
  
  // Author/Institute info
  if (authorName || instituteName) {
    const authorText = [authorName, instituteName].filter(Boolean).join(' • ')
    drawText(page, authorText, {
      x: margin,
      y: height - 85,
      size: 11,
      font: regularFont,
      color: rgb(0.9, 0.9, 0.9)
    })
  }
  
  // Style badge
  drawText(page, 'Mind Map Style', {
    x: width - margin - 100,
    y: height - 40,
    size: 10,
    font: regularFont,
    color: rgb(0.9, 0.9, 0.9)
  })
  
  // Mind Map Area
  const mapCenterX = width / 2
  const mapCenterY = (height - 100) / 2 + 30
  
  // Central node
  const centralColor = rgb(primary.r, primary.g, primary.b)
  const centralText = notes.title || 'Main Topic'
  
  // Draw central node (larger)
  page.drawEllipse({
    x: mapCenterX,
    y: mapCenterY,
    xScale: 80,
    yScale: 40,
    color: centralColor,
    borderColor: rgb(primary.r * 0.6, primary.g * 0.6, primary.b * 0.6),
    borderWidth: 3
  })
  
  const centralLines = wrapText(centralText, boldFont, 11, 140)
  let cY = mapCenterY + (centralLines.length * 7)
  for (const line of centralLines) {
    const cWidth = boldFont.widthOfTextAtSize(line, 11)
    drawText(page, line, {
      x: mapCenterX - cWidth / 2,
      y: cY,
      size: 11,
      font: boldFont,
      color: rgb(1, 1, 1)
    })
    cY -= 14
  }
  
  // Parse content into branches
  const branches = []
  if (notes.content) {
    const sections = notes.content.split(/(?=##\s|(?:^|\n)[IVX]+\.\s)/g).filter(s => s.trim())
    sections.forEach((section, i) => {
      const lines = section.trim().split('\n')
      const title = lines[0].replace(/^#+\s*|^[IVX]+\.\s*/g, '').trim()
      const points = lines.slice(1)
        .filter(l => l.trim().startsWith('-') || l.trim().startsWith('•'))
        .map(l => l.replace(/^[-•]\s*/, '').replace(/\*\*/g, '').trim())
        .slice(0, 3) // Max 3 sub-points
      if (title) {
        branches.push({ title, points })
      }
    })
  }
  
  // Draw branches around the center
  const branchColors = [
    rgb(0.2, 0.5, 0.8),
    rgb(0.3, 0.7, 0.4),
    rgb(0.8, 0.4, 0.2),
    rgb(0.6, 0.3, 0.7),
    rgb(0.8, 0.6, 0.2),
    rgb(0.4, 0.6, 0.8)
  ]
  
  const numBranches = Math.min(branches.length, 6)
  const angleStep = (Math.PI * 2) / Math.max(numBranches, 1)
  const branchRadius = 180
  
  branches.slice(0, 6).forEach((branch, i) => {
    const angle = -Math.PI / 2 + i * angleStep
    const branchX = mapCenterX + Math.cos(angle) * branchRadius
    const branchY = mapCenterY + Math.sin(angle) * (branchRadius * 0.7)
    const branchColor = branchColors[i % branchColors.length]
    
    // Draw connection to center
    drawConnection(page, mapCenterX, mapCenterY, branchX, branchY, branchColor)
    
    // Draw branch node
    page.drawRectangle({
      x: branchX - 70,
      y: branchY - 20,
      width: 140,
      height: 40,
      color: branchColor,
      borderWidth: 0
    })
    
    const branchLines = wrapText(branch.title, boldFont, 10, 130)
    let bY = branchY + 10
    branchLines.slice(0, 2).forEach(line => {
      const bWidth = boldFont.widthOfTextAtSize(line, 10)
      drawText(page, line, {
        x: branchX - bWidth / 2,
        y: bY,
        size: 10,
        font: boldFont,
        color: rgb(1, 1, 1)
      })
      bY -= 12
    })
    
    // Draw sub-points
    branch.points.slice(0, 2).forEach((point, j) => {
      const subAngle = angle + (j - 0.5) * 0.3
      const subX = branchX + Math.cos(subAngle) * 100
      const subY = branchY + Math.sin(subAngle) * 60
      
      // Connection line
      page.drawLine({
        start: { x: branchX, y: branchY },
        end: { x: subX, y: subY },
        thickness: 1,
        color: branchColor,
        opacity: 0.4
      })
      
      // Sub-node
      page.drawRectangle({
        x: subX - 50,
        y: subY - 12,
        width: 100,
        height: 24,
        color: rgb(
          Math.min(branchColor.red + 0.3, 1), 
          Math.min(branchColor.green + 0.3, 1), 
          Math.min(branchColor.blue + 0.3, 1)
        ),
        borderWidth: 0
      })
      
      const subText = point.length > 20 ? point.substring(0, 18) + '...' : point
      const subWidth = regularFont.widthOfTextAtSize(subText, 8)
      drawText(page, subText, {
        x: subX - subWidth / 2,
        y: subY - 3,
        size: 8,
        font: regularFont,
        color: rgb(0.1, 0.1, 0.1)
      })
    })
  })
  
  // Footer
  drawText(page, 'Created with ProCreators Study Notes Generator', {
    x: margin,
    y: 20,
    size: 8,
    font: regularFont,
    color: rgb(0.5, 0.5, 0.5)
  })
  
  drawText(page, `Page 1`, {
    x: width - margin - 30,
    y: 20,
    size: 8,
    font: regularFont,
    color: rgb(0.5, 0.5, 0.5)
  })
  
  return page
}

// Generate visually appealing standard PDF
async function generatePDF(notes, config) {
  const { topic, noteStyle, colorTheme, paperSize, authorName, instituteName } = config
  
  // Paper sizes
  const sizes = {
    'letter': { width: 612, height: 792 },
    'a4': { width: 595, height: 842 }
  }
  const { width, height } = sizes[paperSize] || sizes['letter']
  const margin = 50
  
  // Colors
  const primary = hexToRgb(colorTheme?.primary || '#1e40af')
  const secondary = hexToRgb(colorTheme?.secondary || '#3b82f6')
  const accent = hexToRgb(colorTheme?.accent || '#dbeafe')
  
  // Create PDF
  const pdfDoc = await PDFDocument.create()
  pdfDoc.registerFontkit(fontkit)
  
  // Check if notes contain Bangla text
  const hasBangla = notesHaveBangla(notes)
  console.log('Notes contain Bangla:', hasBangla)
  
  // Embed fonts - keep BOTH standard and Bangla fonts
  let regularFont, boldFont, italicFont, banglaFont, banglaBoldFont
  
  try {
    // Load standard fonts first
    const notoRegularBytes = await fs.readFile('/app/public/fonts/NotoSans-Regular.ttf')
    const notoBoldBytes = await fs.readFile('/app/public/fonts/NotoSans-Bold.ttf')
    regularFont = await pdfDoc.embedFont(notoRegularBytes)
    boldFont = await pdfDoc.embedFont(notoBoldBytes)
    italicFont = regularFont
    
    // Load Bangla fonts if content has Bangla
    if (hasBangla) {
      try {
        const banglaRegularBytes = await fs.readFile('/app/public/fonts/NotoSansBengali-Regular.ttf')
        const banglaBoldBytes = await fs.readFile('/app/public/fonts/NotoSansBengali-Bold.ttf')
        banglaFont = await pdfDoc.embedFont(banglaRegularBytes)
        banglaBoldFont = await pdfDoc.embedFont(banglaBoldBytes)
        console.log('Bangla fonts loaded successfully for study notes')
      } catch (banglaErr) {
        console.warn('Could not load Bangla fonts:', banglaErr.message)
      }
    }
  } catch (fontError) {
    console.warn('Custom fonts not available, using standard fonts:', fontError.message)
    regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica)
    boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
    italicFont = await pdfDoc.embedFont(StandardFonts.HelveticaOblique)
  }
  
  // Create fonts object with all fonts available
  const fonts = { regularFont, boldFont, italicFont, banglaFont, banglaBoldFont }
  
  // Helper to get the right font based on text content
  const getFont = (text, useBold = false) => {
    if (hasBangla && containsBangla(text)) {
      return useBold ? (banglaBoldFont || boldFont) : (banglaFont || regularFont)
    }
    return useBold ? boldFont : regularFont
  }
  
  // Create a bound safeDrawText that includes font fallbacks
  const drawText = (page, text, options) => {
    const cleanText = sanitizeText(text)
    if (!cleanText) return
    
    // Determine which font to use based on content
    const textHasBangla = containsBangla(cleanText)
    const primaryFont = options.font
    const fallbackFont = textHasBangla ? (banglaFont || regularFont) : regularFont
    
    // Try primary font first
    try {
      page.drawText(cleanText, options)
      return
    } catch (e) {
      // Primary font failed
    }
    
    // If text has Bangla and we have Bangla font, try it
    if (textHasBangla && banglaFont && options.font !== banglaFont) {
      try {
        page.drawText(cleanText, { ...options, font: banglaFont })
        return
      } catch (e) {
        // Bangla font also failed
      }
    }
    
    // Try with bold Bangla if we have it
    if (textHasBangla && banglaBoldFont && options.font !== banglaBoldFont) {
      try {
        page.drawText(cleanText, { ...options, font: banglaBoldFont })
        return
      } catch (e) {
        // Bold Bangla also failed
      }
    }
    
    // Try regular font as last resort
    if (options.font !== regularFont) {
      try {
        page.drawText(cleanText, { ...options, font: regularFont })
        return
      } catch (e) {
        // Everything failed
      }
    }
  }
  const configWithDimensions = { 
    width, height, margin, primary, secondary, accent,
    authorName, instituteName
  }
  
  // For Mind Map style, generate a visual mind map
  if (noteStyle === 'mindmap') {
    await generateMindMapPDF(notes, configWithDimensions, pdfDoc, fonts)
    
    // Add a second page with detailed content
    let currentPage = pdfDoc.addPage([width, height])
    let y = height - margin
    
    // Second page header
    currentPage.drawRectangle({
      x: 0,
      y: height - 60,
      width,
      height: 60,
      color: rgb(primary.r, primary.g, primary.b)
    })
    
    drawText(currentPage, 'Detailed Notes', {
      x: margin,
      y: height - 40,
      size: 18,
      font: boldFont,
      color: rgb(1, 1, 1)
    })
    
    y = height - 80
    
    // Helper to add page
    const ensureSpace = (needed) => {
      if (y - needed < margin + 30) {
        currentPage = pdfDoc.addPage([width, height])
        y = height - margin
        return true
      }
      return false
    }
    
    // Draw content sections
    const drawSection = (title, content, icon, bgColor) => {
      if (!content) return
      
      ensureSpace(80)
      
      // Section header with icon
      currentPage.drawRectangle({
        x: margin,
        y: y - 28,
        width: width - 2 * margin,
        height: 32,
        color: bgColor
      })
      
      // Decorative left border
      currentPage.drawRectangle({
        x: margin,
        y: y - 28,
        width: 5,
        height: 32,
        color: rgb(primary.r, primary.g, primary.b)
      })
      
      drawText(currentPage, `${icon}  ${title}`, {
        x: margin + 15,
        y: y - 20,
        size: 13,
        font: boldFont,
        color: rgb(primary.r, primary.g, primary.b)
      })
      
      y -= 45
      
      // Content
      const lines = content.split('\n')
      const contentWidth = width - 2 * margin - 30
      
      for (const line of lines) {
        const trimmed = line.trim()
        if (!trimmed) {
          y -= 8
          continue
        }
        
        let fontSize = 10
        let font = regularFont
        let textColor = rgb(0.15, 0.15, 0.15)
        let indent = 20
        
        // Handle markdown formatting
        if (trimmed.startsWith('### ')) {
          fontSize = 11
          font = boldFont
          textColor = rgb(secondary.r, secondary.g, secondary.b)
          const text = trimmed.substring(4)
          ensureSpace(20)
          y -= 5
          const wrapped = wrapText(text, font, fontSize, contentWidth)
          for (const wl of wrapped) {
            drawText(currentPage, wl, { x: margin + indent, y, size: fontSize, font, color: textColor })
            y -= fontSize + 5
          }
          continue
        }
        
        if (trimmed.startsWith('## ')) {
          fontSize = 12
          font = boldFont
          textColor = rgb(primary.r, primary.g, primary.b)
          const text = trimmed.substring(3)
          ensureSpace(25)
          y -= 8
          const wrapped = wrapText(text, font, fontSize, contentWidth)
          for (const wl of wrapped) {
            drawText(currentPage, wl, { x: margin + indent, y, size: fontSize, font, color: textColor })
            y -= fontSize + 5
          }
          y -= 3
          continue
        }
        
        // Bullet points with visual styling
        if (trimmed.startsWith('- ') || trimmed.startsWith('• ')) {
          const text = trimmed.substring(2).replace(/\*\*/g, '')
          ensureSpace(18)
          
          // Draw bullet circle
          currentPage.drawEllipse({
            x: margin + indent + 5,
            y: y + 3,
            xScale: 3,
            yScale: 3,
            color: rgb(secondary.r, secondary.g, secondary.b)
          })
          
          const wrapped = wrapText(text, font, fontSize, contentWidth - 20)
          for (let i = 0; i < wrapped.length; i++) {
            drawText(currentPage, wrapped[i], {
              x: margin + indent + 15,
              y,
              size: fontSize,
              font,
              color: textColor
            })
            y -= fontSize + 5
          }
          continue
        }
        
        // Regular text
        const processedText = trimmed.replace(/\*\*/g, '')
        ensureSpace(16)
        const wrapped = wrapText(processedText, font, fontSize, contentWidth)
        for (const wl of wrapped) {
          drawText(currentPage, wl, { x: margin + indent, y, size: fontSize, font, color: textColor })
          y -= fontSize + 5
        }
      }
      
      y -= 15
    }
    
    // Main content
    if (notes.content) {
      drawSection('Notes', notes.content, '📚', rgb(accent.r, accent.g, accent.b))
    }
    
    // Key Terms
    if (notes.keyTerms) {
      drawSection('Key Terms & Definitions', notes.keyTerms, '🔑', rgb(0.93, 0.95, 1))
    }
    
    // Examples
    if (notes.examples) {
      drawSection('Examples', notes.examples, '💡', rgb(1, 0.98, 0.9))
    }
    
    // Questions
    if (notes.questions) {
      drawSection('Review Questions', notes.questions, '❓', rgb(0.97, 0.93, 1))
    }
    
    // Summary
    if (notes.summary) {
      drawSection('Summary', notes.summary, '📝', rgb(0.92, 1, 0.95))
    }
    
    // Add footers to all pages
    const pages = pdfDoc.getPages()
    pages.forEach((pg, i) => {
      drawText(pg, `Page ${i + 1} of ${pages.length}`, {
        x: width / 2 - 25,
        y: 15,
        size: 8,
        font: regularFont,
        color: rgb(0.5, 0.5, 0.5)
      })
    })
    
    return await pdfDoc.save()
  }
  
  // Standard styles (Outline, Cornell, Summary, Q&A)
  let currentPage = pdfDoc.addPage([width, height])
  let y = height - margin
  
  // Helper to add new page
  const ensureSpace = (needed) => {
    if (y - needed < margin + 30) {
      currentPage = pdfDoc.addPage([width, height])
      y = height - margin
      return true
    }
    return false
  }
  
  // === HEADER ===
  // Gradient-like header with two colors
  currentPage.drawRectangle({
    x: 0,
    y: height - 95,
    width,
    height: 95,
    color: rgb(primary.r, primary.g, primary.b)
  })
  
  // Decorative accent bar
  currentPage.drawRectangle({
    x: 0,
    y: height - 100,
    width,
    height: 5,
    color: rgb(secondary.r, secondary.g, secondary.b)
  })
  
  // Title
  const titleText = notes.title || topic || 'Study Notes'
  const titleFont = getFont(titleText, true)
  const titleLines = wrapText(titleText, titleFont, 22, width - margin * 2 - 40)
  let titleY = height - 35
  for (const line of titleLines) {
    drawText(currentPage, line, {
      x: margin + 10,
      y: titleY,
      size: 22,
      font: titleFont,
      color: rgb(1, 1, 1)
    })
    titleY -= 28
  }
  
  // Author & Institute info (if provided)
  if (authorName || instituteName) {
    const authorLine = [authorName, instituteName].filter(Boolean).join(' | ')
    drawText(currentPage, authorLine, {
      x: margin + 10,
      y: height - 75,
      size: 10,
      font: getFont(authorLine, false),
      color: rgb(0.9, 0.9, 0.9)
    })
  }
  
  // Style badge
  const styleName = {
    'cornell': 'Cornell Method',
    'outline': 'Outline Style',
    'summary': 'Summary Notes',
    'flashcard': 'Q&A Format',
    'mindmap': 'Mind Map'
  }[noteStyle] || 'Study Notes'
  
  // Draw badge
  const badgeWidth = regularFont.widthOfTextAtSize(styleName, 9) + 16
  currentPage.drawRectangle({
    x: width - margin - badgeWidth - 10,
    y: height - 45,
    width: badgeWidth,
    height: 20,
    color: rgb(1, 1, 1),
    opacity: 0.2
  })
  drawText(currentPage, styleName, {
    x: width - margin - badgeWidth - 2,
    y: height - 40,
    size: 9,
    font: regularFont,
    color: rgb(1, 1, 1)
  })
  
  // Date
  drawText(currentPage, new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }), {
    x: width - margin - 100,
    y: height - 75,
    size: 9,
    font: regularFont,
    color: rgb(0.85, 0.85, 0.85)
  })
  
  y = height - 120
  
  // Helper to draw section
  const drawSection = (title, content, iconEmoji, bgColor) => {
    if (!content) return
    
    ensureSpace(70)
    
    // Section card background
    const sectionStartY = y
    
    // Section header
    currentPage.drawRectangle({
      x: margin,
      y: y - 30,
      width: width - 2 * margin,
      height: 35,
      color: bgColor
    })
    
    // Left accent bar
    currentPage.drawRectangle({
      x: margin,
      y: y - 30,
      width: 4,
      height: 35,
      color: rgb(primary.r, primary.g, primary.b)
    })
    
    drawText(currentPage, `${iconEmoji}  ${title}`, {
      x: margin + 15,
      y: y - 20,
      size: 13,
      font: boldFont,
      color: rgb(primary.r, primary.g, primary.b)
    })
    
    y -= 50
    
    // Content
    const lines = content.split('\n')
    const contentWidth = width - 2 * margin - 40
    
    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed) {
        y -= 6
        continue
      }
      
      let fontSize = 10
      let textColor = rgb(0.15, 0.15, 0.15)
      let indent = 25
      
      // Headers
      if (trimmed.startsWith('### ')) {
        fontSize = 11
        const font = getFont(trimmed, true)
        textColor = rgb(secondary.r, secondary.g, secondary.b)
        const text = trimmed.substring(4)
        ensureSpace(18)
        y -= 4
        const wrapped = wrapText(text, font, fontSize, contentWidth)
        for (const wl of wrapped) {
          drawText(currentPage, wl, { x: margin + indent, y, size: fontSize, font, color: textColor })
          y -= fontSize + 4
        }
        continue
      }
      
      if (trimmed.startsWith('## ')) {
        fontSize = 12
        const font = getFont(trimmed, true)
        textColor = rgb(primary.r, primary.g, primary.b)
        const text = trimmed.substring(3)
        ensureSpace(22)
        y -= 8
        const wrapped = wrapText(text, font, fontSize, contentWidth)
        for (const wl of wrapped) {
          drawText(currentPage, wl, { x: margin + indent, y, size: fontSize, font, color: textColor })
          y -= fontSize + 4
        }
        y -= 4
        continue
      }
      
      if (trimmed.startsWith('# ')) {
        fontSize = 14
        const font = getFont(trimmed, true)
        textColor = rgb(primary.r, primary.g, primary.b)
        const text = trimmed.substring(2)
        ensureSpace(28)
        y -= 10
        const wrapped = wrapText(text, font, fontSize, contentWidth)
        for (const wl of wrapped) {
          drawText(currentPage, wl, { x: margin + indent, y, size: fontSize, font, color: textColor })
          y -= fontSize + 5
        }
        y -= 6
        continue
      }
      
      // Bullet points - styled
      if (trimmed.startsWith('- ') || trimmed.startsWith('• ')) {
        const text = trimmed.substring(2).replace(/\*\*/g, '')
        const font = getFont(text, false)
        ensureSpace(16)
        
        // Draw bullet dot
        currentPage.drawEllipse({
          x: margin + indent + 3,
          y: y + 3,
          xScale: 2.5,
          yScale: 2.5,
          color: rgb(secondary.r, secondary.g, secondary.b)
        })
        
        const wrapped = wrapText(text, font, fontSize, contentWidth - 15)
        for (let i = 0; i < wrapped.length; i++) {
          drawText(currentPage, wrapped[i], {
            x: margin + indent + 12,
            y,
            size: fontSize,
            font,
            color: textColor
          })
          y -= fontSize + 4
        }
        continue
      }
      
      // Numbered items
      if (/^\d+\.\s/.test(trimmed)) {
        const match = trimmed.match(/^(\d+\.)\s(.*)/)
        if (match) {
          ensureSpace(16)
          
          // Number badge
          const numBadgeX = margin + indent
          currentPage.drawRectangle({
            x: numBadgeX,
            y: y - 3,
            width: 18,
            height: 15,
            color: rgb(secondary.r, secondary.g, secondary.b)
          })
          drawText(currentPage, match[1].replace('.', ''), {
            x: numBadgeX + 5,
            y: y,
            size: 9,
            font: boldFont,
            color: rgb(1, 1, 1)
          })
          
          const text = match[2].replace(/\*\*/g, '')
          const font = getFont(text, false)
          const wrapped = wrapText(text, font, fontSize, contentWidth - 30)
          for (let i = 0; i < wrapped.length; i++) {
            drawText(currentPage, wrapped[i], {
              x: margin + indent + 25,
              y,
              size: fontSize,
              font,
              color: textColor
            })
            y -= fontSize + 4
          }
        }
        continue
      }
      
      // Regular paragraph
      const processedText = trimmed.replace(/\*\*/g, '')
      const font = getFont(processedText, false)
      ensureSpace(14)
      const wrapped = wrapText(processedText, font, fontSize, contentWidth)
      for (const wl of wrapped) {
        drawText(currentPage, wl, { x: margin + indent, y, size: fontSize, font, color: textColor })
        y -= fontSize + 4
      }
    }
    
    y -= 18
  }
  
  // === MAIN CONTENT ===
  if (notes.content) {
    drawSection('Notes', notes.content, '📚', rgb(accent.r, accent.g, accent.b))
  }
  
  // === KEY TERMS ===
  if (notes.keyTerms) {
    drawSection('Key Terms & Definitions', notes.keyTerms, '🔑', rgb(0.93, 0.95, 1))
  }
  
  // === EXAMPLES ===
  if (notes.examples) {
    drawSection('Examples', notes.examples, '💡', rgb(1, 0.98, 0.9))
  }
  
  // === REVIEW QUESTIONS ===
  if (notes.questions) {
    drawSection('Review Questions', notes.questions, '❓', rgb(0.97, 0.93, 1))
  }
  
  // === SUMMARY ===
  if (notes.summary) {
    drawSection('Summary', notes.summary, '📝', rgb(0.92, 1, 0.95))
  }
  
  // === FOOTERS ===
  const pages = pdfDoc.getPages()
  for (let i = 0; i < pages.length; i++) {
    const pg = pages[i]
    
    // Bottom border
    pg.drawRectangle({
      x: margin,
      y: 35,
      width: width - 2 * margin,
      height: 1,
      color: rgb(0.85, 0.85, 0.85)
    })
    
    drawText(pg, `Page ${i + 1} of ${pages.length}`, {
      x: width / 2 - 25,
      y: 20,
      size: 8,
      font: regularFont,
      color: rgb(0.5, 0.5, 0.5)
    })
    
    drawText(pg, 'Created with ProCreators Study Notes Generator', {
      x: margin,
      y: 20,
      size: 8,
      font: italicFont,
      color: rgb(0.6, 0.6, 0.6)
    })
  }
  
  return await pdfDoc.save()
}

export async function POST(request) {
  try {
    const contentType = request.headers.get('content-type') || ''
    
    // Handle FormData (for file uploads)
    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData()
      const action = formData.get('action')
      
      if (action === 'generate') {
        const inputMode = formData.get('inputMode')
        const topic = formData.get('topic')
        const customNotes = formData.get('customNotes')
        const noteStyle = formData.get('noteStyle')
        const subject = formData.get('subject')
        const gradeLevel = formData.get('gradeLevel')
        const detailLevel = formData.get('detailLevel')
        const includeKeyTerms = formData.get('includeKeyTerms') === 'true'
        const includeExamples = formData.get('includeExamples') === 'true'
        const includeQuestions = formData.get('includeQuestions') === 'true'
        const includeSummary = formData.get('includeSummary') === 'true'
        const file = formData.get('file')
        
        let sourceContent = ''
        
        // Handle file upload
        if (file && file.size > 0) {
          const bytes = await file.arrayBuffer()
          const buffer = Buffer.from(bytes)
          const fileName = file.name.toLowerCase()
          
          if (file.type === 'text/plain' || fileName.endsWith('.txt') || fileName.endsWith('.md')) {
            // Plain text files
            sourceContent = buffer.toString('utf-8')
          } else if (file.type === 'application/pdf' || fileName.endsWith('.pdf')) {
            // PDF files - extract text
            console.log('Extracting text from PDF:', file.name)
            sourceContent = await extractTextFromPDF(buffer)
            if (!sourceContent || sourceContent.trim().length < 50) {
              return NextResponse.json({
                success: false,
                error: 'Could not extract text from PDF. The PDF might be image-based or protected. Please try copying the text manually.'
              }, { status: 400 })
            }
            console.log('Extracted PDF text length:', sourceContent.length)
          } else {
            // Try to read as text for other files
            sourceContent = buffer.toString('utf-8')
          }
        } else if (customNotes) {
          sourceContent = customNotes
        }
        
        // Validate we have content to work with (only for upload mode)
        if (inputMode === 'upload' || inputMode !== 'topic') {
          if (!sourceContent || sourceContent.trim().length < 20) {
            return NextResponse.json({
              success: false,
              error: 'No valid content found. Please paste your notes or upload a text-based file.'
            }, { status: 400 })
          }
          
          // Truncate very long content to avoid token limits (keep first ~15000 chars)
          if (sourceContent.length > 15000) {
            console.log('Truncating content from', sourceContent.length, 'to 15000 chars')
            sourceContent = sourceContent.substring(0, 15000) + '\n\n[Content truncated for processing...]'
          }
        }
        
        // For topic mode, validate that topic is provided
        if (inputMode === 'topic' && (!topic || topic.trim().length < 2)) {
          return NextResponse.json({
            success: false,
            error: 'Please enter a topic to generate study notes.'
          }, { status: 400 })
        }
        
        // Build the prompt
        let prompt = ''
        const systemPrompt = `You are an expert educator and study notes creator. You specialize in creating clear, well-organized study materials that help students learn effectively. Create notes in the student's language if the topic is given in a non-English language.

**BANNED WORDS - DO NOT USE THESE AI-SOUNDING WORDS:**
Avoid these overused, cliché words that make content sound AI-generated:
- unlock, unleash, unveil, uncover
- revolutionize, revolutionary
- game-changer, cutting-edge
- supercharge, turbocharge
- seamless, seamlessly
- harness, leverage (as verbs)
- elevate, empower, transform (overused)
- dive into, dive deep, delve
- synergy, paradigm shift
- holistic, streamline
- maximize potential
- take it to the next level
- innovative, innovation (overused)
- journey (metaphorical)

Use clear, simple, educational language that students can easily understand.`
        
        const detailInstructions = {
          brief: 'Keep the notes concise and focused on the most essential points only.',
          medium: 'Provide a balanced level of detail covering all important concepts.',
          detailed: 'Create comprehensive, in-depth notes with thorough explanations.'
        }
        
        const styleInstructions = {
          cornell: 'Structure the notes using the Cornell Method with main notes, cue questions, and summary.',
          outline: 'Structure the notes using the Outline Method with hierarchical bullet points.',
          mindmap: 'Structure the notes as a mind map with a central concept and connected branches. Use clear section headers (## Section Name) for main branches and bullet points for sub-topics.',
          summary: 'Create condensed summary notes focusing on key takeaways and important facts.',
          flashcard: 'Structure the content as question and answer pairs for self-testing.'
        }
        
        if (inputMode === 'topic') {
          prompt = `Create comprehensive study notes on the topic: "${topic}"

Subject Area: ${subject}
Academic Level: ${gradeLevel}
Detail Level: ${detailInstructions[detailLevel] || detailInstructions.medium}
Note Style: ${styleInstructions[noteStyle] || styleInstructions.outline}

Please provide the notes in the following JSON format:
{
  "title": "Title of the notes",
  "content": "Main notes content with clear sections using ## for headers and - for bullet points. Make it well-organized.",
  ${includeKeyTerms ? '"keyTerms": "List of key terms with definitions. Format: **Term**: Definition",' : ''}
  ${includeExamples ? '"examples": "Real-world examples to help understand the concepts",' : ''}
  ${includeQuestions ? '"questions": "Review questions for self-testing",' : ''}
  ${includeSummary ? '"summary": "A concise summary of the main points"' : ''}
}

Make the notes educational, clear, and well-organized.`
        } else {
          // For user-uploaded content, be very explicit about using ONLY that content
          prompt = `IMPORTANT: You MUST create study notes ONLY from the content provided below. Do NOT add any information that is not in the source material. The notes should be a reorganization of THIS specific content.

=== SOURCE CONTENT START ===
${sourceContent}
=== SOURCE CONTENT END ===

Your task: Transform the above content into well-organized study notes.

Subject Area: ${subject}
Academic Level: ${gradeLevel}
Detail Level: ${detailInstructions[detailLevel] || detailInstructions.medium}
Note Style: ${styleInstructions[noteStyle] || styleInstructions.outline}

CRITICAL RULES:
1. The title MUST reflect what the source content is actually about
2. ALL information in the notes must come from the source content above
3. Do NOT invent or add topics not present in the source
4. If the source is about KDP/Amazon publishing, the notes must be about KDP/Amazon publishing
5. If the source is about a specific business/topic, focus on that exact topic

Please provide the notes in this JSON format:
{
  "title": "A title that accurately describes the source content",
  "content": "Reorganized notes with clear sections using ## for headers and - for bullet points. ONLY use information from the source content.",
  ${includeKeyTerms ? '"keyTerms": "Key terms and definitions extracted FROM the source content",' : ''}
  ${includeExamples ? '"examples": "Examples mentioned IN the source content",' : ''}
  ${includeQuestions ? '"questions": "Review questions based on the source content",' : ''}
  ${includeSummary ? '"summary": "A summary of the main points from the source content"' : ''}
}

Remember: ONLY use information from the source content. Do not add external information.`
        }
        
        // Generate notes using LLM
        const response = await runLLM(prompt, systemPrompt)
        
        // Parse JSON from response
        let notes
        try {
          // Find JSON in response
          let jsonMatch = response.match(/\{[\s\S]*\}/)
          if (jsonMatch) {
            let jsonStr = jsonMatch[0]
            
            // Clean up common JSON issues from LLM responses
            // Fix unescaped newlines inside strings
            jsonStr = jsonStr.replace(/:\s*"([^"]*?)(?<!\\)\n([^"]*?)"/g, (match, p1, p2) => {
              return `: "${p1}\\n${p2}"`
            })
            
            try {
              notes = JSON.parse(jsonStr)
            } catch (e) {
              // If parsing fails, try to extract key fields manually
              console.log('First JSON parse failed, trying manual extraction')
              
              const titleMatch = jsonStr.match(/"title"\s*:\s*"([^"]+)"/)
              const contentMatch = jsonStr.match(/"content"\s*:\s*"([\s\S]*?)(?:"\s*,\s*"|"\s*\}|\",\s*\")/)
              const summaryMatch = jsonStr.match(/"summary"\s*:\s*"([^"]*)"/)
              
              notes = {
                title: titleMatch ? titleMatch[1] : (topic || 'Study Notes'),
                content: contentMatch ? contentMatch[1].replace(/\\n/g, '\n').replace(/\\"/g, '"') : response,
                summary: summaryMatch ? summaryMatch[1].replace(/\\n/g, '\n') : ''
              }
            }
            
            // Ensure content fields have proper newlines
            if (notes && typeof notes.content === 'string') {
              notes.content = notes.content.replace(/\\n/g, '\n')
            }
            if (notes && typeof notes.keyTerms === 'string') {
              notes.keyTerms = notes.keyTerms.replace(/\\n/g, '\n')
            }
            if (notes && typeof notes.examples === 'string') {
              notes.examples = notes.examples.replace(/\\n/g, '\n')
            }
            if (notes && typeof notes.questions === 'string') {
              notes.questions = notes.questions.replace(/\\n/g, '\n')
            }
            if (notes && typeof notes.summary === 'string') {
              notes.summary = notes.summary.replace(/\\n/g, '\n')
            }
          } else {
            throw new Error('No JSON found')
          }
        } catch (parseError) {
          console.error('JSON parse error:', parseError)
          notes = {
            title: topic || 'Study Notes',
            content: response,
            summary: 'See notes above for summary.'
          }
        }
        
        return NextResponse.json({ success: true, notes })
      }
    }
    
    // Handle JSON requests (for PDF generation)
    const body = await request.json()
    const { action } = body
    
    if (action === 'generate-pdf') {
      const { notes, topic, noteStyle, colorTheme, paperSize, authorName, instituteName } = body
      
      // Create output directory
      const outputDir = path.join(process.cwd(), 'public', 'generated', 'study-notes')
      await fs.mkdir(outputDir, { recursive: true })
      
      // Generate unique filename
      const filename = `study-notes-${uuidv4()}.pdf`
      const outputPath = path.join(outputDir, filename)
      
      // Generate PDF using HTML-to-PDF (Puppeteer) for proper Bangla font rendering
      const pdfBuffer = await generatePDFWithHTML(notes, {
        topic,
        noteStyle,
        colorTheme,
        paperSize,
        authorName,
        instituteName
      })
      
      // Save the PDF file
      await fs.writeFile(outputPath, pdfBuffer)
      
      const pdfUrl = `/generated/study-notes/${filename}`
      
      // Save to library
      try {
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
        await fetch(`${baseUrl}/api/library/save`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            toolId: 'study-notes',
            title: notes.title || topic || 'Study Notes',
            data: { notes, topic, noteStyle, pdfUrl, authorName, instituteName },
            thumbnailUrl: null
          })
        })
      } catch (e) {
        console.log('Library save skipped:', e.message)
      }
      
      return NextResponse.json({ success: true, pdfUrl, filename })
    }
    
    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Study notes generation error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

// Generate PDF using HTML and Puppeteer for proper Unicode/Bangla support
async function generatePDFWithHTML(notes, config) {
  const { topic, noteStyle, colorTheme, paperSize, authorName, instituteName } = config
  
  const primaryColor = colorTheme?.primary || '#1e40af'
  const secondaryColor = colorTheme?.secondary || '#3b82f6'
  const accentColor = colorTheme?.accent || '#dbeafe'
  
  // Helper to convert markdown-like content to HTML
  const formatContent = (content) => {
    if (!content) return ''
    
    return content
      .split('\n')
      .map(line => {
        const trimmed = line.trim()
        if (!trimmed) return '<br/>'
        
        // Headers
        if (trimmed.startsWith('### ')) {
          return `<h4 class="sub-heading">${escapeHTML(trimmed.substring(4))}</h4>`
        }
        if (trimmed.startsWith('## ')) {
          return `<h3 class="section-heading">${escapeHTML(trimmed.substring(3))}</h3>`
        }
        if (trimmed.startsWith('# ')) {
          return `<h2 class="main-heading">${escapeHTML(trimmed.substring(2))}</h2>`
        }
        
        // Bullet points
        if (trimmed.startsWith('- ') || trimmed.startsWith('• ')) {
          return `<li>${formatInlineText(trimmed.substring(2))}</li>`
        }
        
        // Numbered items
        if (/^\d+\.\s/.test(trimmed)) {
          return `<li class="numbered">${formatInlineText(trimmed.replace(/^\d+\.\s/, ''))}</li>`
        }
        
        return `<p>${formatInlineText(trimmed)}</p>`
      })
      .join('\n')
  }
  
  // Format inline text (bold, etc)
  const formatInlineText = (text) => {
    return escapeHTML(text)
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
  }
  
  // Escape HTML
  const escapeHTML = (text) => {
    if (!text) return ''
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
  }
  
  const styleName = {
    'cornell': 'Cornell Method',
    'outline': 'Outline Style',
    'summary': 'Summary Notes',
    'flashcard': 'Q&A Format',
    'mindmap': 'Mind Map'
  }[noteStyle] || 'Study Notes'
  
  const html = `
<!DOCTYPE html>
<html lang="bn">
<head>
  <meta charset="UTF-8">
  <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Bengali:wght@400;500;600;700&family=Noto+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    
    body {
      font-family: 'Noto Sans Bengali', 'Noto Sans', sans-serif;
      font-size: 11pt;
      line-height: 1.7;
      color: #1f2937;
      background: white;
    }
    
    .page {
      padding: 40px;
      min-height: 100vh;
    }
    
    /* Header */
    .header {
      background: linear-gradient(135deg, ${primaryColor}, ${secondaryColor});
      color: white;
      padding: 25px 30px;
      border-radius: 12px;
      margin-bottom: 25px;
    }
    
    .header h1 {
      font-size: 22pt;
      font-weight: 700;
      margin-bottom: 8px;
    }
    
    .header .meta {
      font-size: 10pt;
      opacity: 0.9;
    }
    
    .header .badge {
      display: inline-block;
      background: rgba(255,255,255,0.2);
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 9pt;
      margin-top: 10px;
    }
    
    /* Sections */
    .section {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-left: 4px solid ${primaryColor};
      border-radius: 10px;
      padding: 18px 22px;
      margin-bottom: 18px;
      page-break-inside: avoid;
    }
    
    .section h2 {
      font-size: 14pt;
      font-weight: 600;
      color: ${primaryColor};
      margin-bottom: 12px;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    
    .section.key-terms { background: ${accentColor}; border-left-color: ${primaryColor}; }
    .section.examples { background: #fef9c3; border-left-color: #eab308; }
    .section.questions { background: #f3e8ff; border-left-color: #9333ea; }
    .section.summary { background: #dcfce7; border-left-color: #22c55e; }
    
    /* Content */
    .content { line-height: 1.8; }
    .content p { margin-bottom: 10px; }
    .content li { margin-bottom: 8px; margin-left: 25px; }
    .content ul, .content ol { margin: 10px 0; }
    
    .main-heading {
      font-size: 14pt;
      font-weight: 600;
      color: ${primaryColor};
      margin: 18px 0 10px 0;
    }
    
    .section-heading {
      font-size: 12pt;
      font-weight: 600;
      color: ${secondaryColor};
      margin: 14px 0 8px 0;
    }
    
    .sub-heading {
      font-size: 11pt;
      font-weight: 600;
      margin: 10px 0 6px 0;
    }
    
    strong { color: ${primaryColor}; }
    
    /* Footer */
    .footer {
      text-align: center;
      font-size: 9pt;
      color: #9ca3af;
      margin-top: 30px;
      padding-top: 15px;
      border-top: 1px solid #e5e7eb;
    }
  </style>
</head>
<body>
  <div class="page">
    <div class="header">
      <h1>${escapeHTML(notes.title || topic || 'Study Notes')}</h1>
      <div class="meta">
        ${authorName || instituteName ? `${escapeHTML(authorName || '')}${authorName && instituteName ? ' | ' : ''}${escapeHTML(instituteName || '')} • ` : ''}
        ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
      </div>
      <span class="badge">${styleName}</span>
    </div>
    
    ${notes.content ? `
    <div class="section">
      <h2>📚 Notes</h2>
      <div class="content">
        ${formatContent(notes.content)}
      </div>
    </div>
    ` : ''}
    
    ${notes.keyTerms ? `
    <div class="section key-terms">
      <h2>🔑 Key Terms & Definitions</h2>
      <div class="content">
        ${formatContent(notes.keyTerms)}
      </div>
    </div>
    ` : ''}
    
    ${notes.examples ? `
    <div class="section examples">
      <h2>💡 Examples</h2>
      <div class="content">
        ${formatContent(notes.examples)}
      </div>
    </div>
    ` : ''}
    
    ${notes.questions ? `
    <div class="section questions">
      <h2>❓ Review Questions</h2>
      <div class="content">
        ${formatContent(notes.questions)}
      </div>
    </div>
    ` : ''}
    
    ${notes.summary ? `
    <div class="section summary">
      <h2>📝 Summary</h2>
      <div class="content">
        ${formatContent(notes.summary)}
      </div>
    </div>
    ` : ''}
    
    <div class="footer">
      Created with ProCreators Study Notes Generator
    </div>
  </div>
</body>
</html>
  `
  
  // Generate PDF using Puppeteer
  const puppeteer = (await import('puppeteer-core')).default
  
  const browser = await puppeteer.launch({
    executablePath: '/usr/bin/chromium',
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
    ]
  })
  
  try {
    const page = await browser.newPage()
    await page.setContent(html, { waitUntil: 'networkidle0' })
    
    const pdfBuffer = await page.pdf({
      format: paperSize === 'a4' ? 'A4' : 'Letter',
      printBackground: true,
      margin: { top: '15mm', right: '15mm', bottom: '15mm', left: '15mm' }
    })
    
    return pdfBuffer
  } finally {
    await browser.close()
  }
}
