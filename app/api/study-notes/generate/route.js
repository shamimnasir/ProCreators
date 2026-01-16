import { NextResponse } from 'next/server'
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import fontkit from '@pdf-lib/fontkit'
import { spawn } from 'child_process'
import path from 'path'
import fs from 'fs/promises'
import { v4 as uuidv4 } from 'uuid'

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

// Text wrapping helper
function wrapText(text, font, fontSize, maxWidth) {
  if (!text) return []
  const words = text.split(' ')
  const lines = []
  let currentLine = ''

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word
    try {
      const width = font.widthOfTextAtSize(testLine, fontSize)
      if (width > maxWidth && currentLine) {
        lines.push(currentLine)
        currentLine = word
      } else {
        currentLine = testLine
      }
    } catch {
      if (currentLine.length > 60) {
        lines.push(currentLine)
        currentLine = word
      } else {
        currentLine = testLine
      }
    }
  }
  if (currentLine) {
    lines.push(currentLine)
  }
  return lines
}

// Safe text drawing (handles special characters)
function safeDrawText(page, text, options) {
  try {
    const cleanText = text.replace(/[\u0000-\u001F\u007F-\u009F]/g, '')
    page.drawText(cleanText, options)
  } catch (e) {
    const asciiText = text.replace(/[^\x20-\x7E]/g, '?')
    try {
      page.drawText(asciiText, options)
    } catch (e2) {
      console.log('Text draw failed:', e2.message)
    }
  }
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
    safeDrawText(page, line, {
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
    safeDrawText(page, line, {
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
    safeDrawText(page, authorText, {
      x: margin,
      y: height - 85,
      size: 11,
      font: regularFont,
      color: rgb(0.9, 0.9, 0.9)
    })
  }
  
  // Style badge
  safeDrawText(page, 'Mind Map Style', {
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
    safeDrawText(page, line, {
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
      safeDrawText(page, line, {
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
      safeDrawText(page, subText, {
        x: subX - subWidth / 2,
        y: subY - 3,
        size: 8,
        font: regularFont,
        color: rgb(0.1, 0.1, 0.1)
      })
    })
  })
  
  // Footer
  safeDrawText(page, 'Created with ProCreators Study Notes Generator', {
    x: margin,
    y: 20,
    size: 8,
    font: regularFont,
    color: rgb(0.5, 0.5, 0.5)
  })
  
  safeDrawText(page, `Page 1`, {
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
  
  // Embed fonts
  const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
  const italicFont = await pdfDoc.embedFont(StandardFonts.HelveticaOblique)
  
  const fonts = { regularFont, boldFont, italicFont }
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
    
    safeDrawText(currentPage, 'Detailed Notes', {
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
      
      safeDrawText(currentPage, `${icon}  ${title}`, {
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
            safeDrawText(currentPage, wl, { x: margin + indent, y, size: fontSize, font, color: textColor })
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
            safeDrawText(currentPage, wl, { x: margin + indent, y, size: fontSize, font, color: textColor })
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
            safeDrawText(currentPage, wrapped[i], {
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
          safeDrawText(currentPage, wl, { x: margin + indent, y, size: fontSize, font, color: textColor })
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
      safeDrawText(pg, `Page ${i + 1} of ${pages.length}`, {
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
  const titleLines = wrapText(titleText, boldFont, 22, width - margin * 2 - 40)
  let titleY = height - 35
  for (const line of titleLines) {
    safeDrawText(currentPage, line, {
      x: margin + 10,
      y: titleY,
      size: 22,
      font: boldFont,
      color: rgb(1, 1, 1)
    })
    titleY -= 28
  }
  
  // Author & Institute info (if provided)
  if (authorName || instituteName) {
    const authorLine = [authorName, instituteName].filter(Boolean).join(' | ')
    safeDrawText(currentPage, authorLine, {
      x: margin + 10,
      y: height - 75,
      size: 10,
      font: regularFont,
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
  safeDrawText(currentPage, styleName, {
    x: width - margin - badgeWidth - 2,
    y: height - 40,
    size: 9,
    font: regularFont,
    color: rgb(1, 1, 1)
  })
  
  // Date
  safeDrawText(currentPage, new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }), {
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
    
    safeDrawText(currentPage, `${iconEmoji}  ${title}`, {
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
      let font = regularFont
      let textColor = rgb(0.15, 0.15, 0.15)
      let indent = 25
      
      // Headers
      if (trimmed.startsWith('### ')) {
        fontSize = 11
        font = boldFont
        textColor = rgb(secondary.r, secondary.g, secondary.b)
        const text = trimmed.substring(4)
        ensureSpace(18)
        y -= 4
        const wrapped = wrapText(text, font, fontSize, contentWidth)
        for (const wl of wrapped) {
          safeDrawText(currentPage, wl, { x: margin + indent, y, size: fontSize, font, color: textColor })
          y -= fontSize + 4
        }
        continue
      }
      
      if (trimmed.startsWith('## ')) {
        fontSize = 12
        font = boldFont
        textColor = rgb(primary.r, primary.g, primary.b)
        const text = trimmed.substring(3)
        ensureSpace(22)
        y -= 8
        const wrapped = wrapText(text, font, fontSize, contentWidth)
        for (const wl of wrapped) {
          safeDrawText(currentPage, wl, { x: margin + indent, y, size: fontSize, font, color: textColor })
          y -= fontSize + 4
        }
        y -= 4
        continue
      }
      
      if (trimmed.startsWith('# ')) {
        fontSize = 14
        font = boldFont
        textColor = rgb(primary.r, primary.g, primary.b)
        const text = trimmed.substring(2)
        ensureSpace(28)
        y -= 10
        const wrapped = wrapText(text, font, fontSize, contentWidth)
        for (const wl of wrapped) {
          safeDrawText(currentPage, wl, { x: margin + indent, y, size: fontSize, font, color: textColor })
          y -= fontSize + 5
        }
        y -= 6
        continue
      }
      
      // Bullet points - styled
      if (trimmed.startsWith('- ') || trimmed.startsWith('• ')) {
        const text = trimmed.substring(2).replace(/\*\*/g, '')
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
          safeDrawText(currentPage, wrapped[i], {
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
          safeDrawText(currentPage, match[1].replace('.', ''), {
            x: numBadgeX + 5,
            y: y,
            size: 9,
            font: boldFont,
            color: rgb(1, 1, 1)
          })
          
          const text = match[2].replace(/\*\*/g, '')
          const wrapped = wrapText(text, font, fontSize, contentWidth - 30)
          for (let i = 0; i < wrapped.length; i++) {
            safeDrawText(currentPage, wrapped[i], {
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
      ensureSpace(14)
      const wrapped = wrapText(processedText, font, fontSize, contentWidth)
      for (const wl of wrapped) {
        safeDrawText(currentPage, wl, { x: margin + indent, y, size: fontSize, font, color: textColor })
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
    
    safeDrawText(pg, `Page ${i + 1} of ${pages.length}`, {
      x: width / 2 - 25,
      y: 20,
      size: 8,
      font: regularFont,
      color: rgb(0.5, 0.5, 0.5)
    })
    
    safeDrawText(pg, 'Created with ProCreators Study Notes Generator', {
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
        
        // Validate we have content to work with
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
        
        // Build the prompt
        let prompt = ''
        const systemPrompt = `You are an expert educator and study notes creator. You specialize in creating clear, well-organized study materials that help students learn effectively. Create notes in the student's language if the topic is given in a non-English language.`
        
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
          prompt = `Transform the following content into well-organized study notes:

---
${sourceContent}
---

Subject Area: ${subject}
Academic Level: ${gradeLevel}
Detail Level: ${detailInstructions[detailLevel] || detailInstructions.medium}
Note Style: ${styleInstructions[noteStyle] || styleInstructions.outline}

Please reorganize into the following JSON format:
{
  "title": "A clear title for these notes",
  "content": "Reorganized notes with clear sections using ## for headers and - for bullet points.",
  ${includeKeyTerms ? '"keyTerms": "Key terms and definitions from the content",' : ''}
  ${includeExamples ? '"examples": "Examples from the content",' : ''}
  ${includeQuestions ? '"questions": "Review questions based on the content",' : ''}
  ${includeSummary ? '"summary": "A concise summary"' : ''}
}

Improve the organization and make it easier to study from.`
        }
        
        // Generate notes using LLM
        const response = await runLLM(prompt, systemPrompt)
        
        // Parse JSON from response
        let notes
        try {
          const jsonMatch = response.match(/\{[\s\S]*\}/)
          if (jsonMatch) {
            notes = JSON.parse(jsonMatch[0])
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
      
      // Generate PDF
      const pdfBuffer = await generatePDF(notes, {
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
