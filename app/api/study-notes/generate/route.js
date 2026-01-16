import { NextResponse } from 'next/server'
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import fontkit from '@pdf-lib/fontkit'
import { spawn } from 'child_process'
import path from 'path'
import fs from 'fs/promises'
import { v4 as uuidv4 } from 'uuid'

// Helper to run LLM
async function runLLM(prompt, systemPrompt = 'You are an expert educator and study guide creator.') {
  return new Promise((resolve, reject) => {
    try {
      const scriptPath = path.join(process.cwd(), 'scripts', 'llm_call.py')
      
      const inputData = JSON.stringify({
        prompt,
        system_prompt: systemPrompt
      })
      
      const pythonProcess = spawn('/root/.venv/bin/python3', [scriptPath, inputData], {
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

      pythonProcess.on('close', (code) => {
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
      
      pythonProcess.on('error', (err) => {
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
      // If width calculation fails, just add the word
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
    // Clean text of problematic characters
    const cleanText = text
      .replace(/[\u0000-\u001F\u007F-\u009F]/g, '') // Control characters
      .replace(/[^\x00-\x7F]/g, char => {
        // Try to keep the character, replace if needed
        return char
      })
    
    page.drawText(cleanText, options)
  } catch (e) {
    // Fallback: draw with ASCII-only version
    const asciiText = text.replace(/[^\x20-\x7E]/g, '?')
    try {
      page.drawText(asciiText, options)
    } catch (e2) {
      console.log('Text draw failed:', e2.message)
    }
  }
}

// Generate PDF using pdf-lib
async function generatePDF(notes, config) {
  const { topic, noteStyle, colorTheme, paperSize } = config
  
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
  
  let currentPage = pdfDoc.addPage([width, height])
  let y = height - margin
  
  // Helper to add new page if needed
  const ensureSpace = (needed) => {
    if (y - needed < margin) {
      currentPage = pdfDoc.addPage([width, height])
      y = height - margin
      return true
    }
    return false
  }
  
  // Helper to draw section header
  const drawSectionHeader = (title, icon, bgColor = accent) => {
    ensureSpace(50)
    
    // Background
    currentPage.drawRectangle({
      x: margin,
      y: y - 30,
      width: width - 2 * margin,
      height: 35,
      color: rgb(bgColor.r, bgColor.g, bgColor.b),
      borderColor: rgb(primary.r, primary.g, primary.b),
      borderWidth: 1
    })
    
    // Title
    safeDrawText(currentPage, `${icon} ${title}`, {
      x: margin + 10,
      y: y - 22,
      size: 14,
      font: boldFont,
      color: rgb(primary.r, primary.g, primary.b)
    })
    
    y -= 50
  }
  
  // Helper to draw text content
  const drawContent = (content, indent = 0) => {
    if (!content) return
    
    const lines = content.split('\n')
    const contentWidth = width - 2 * margin - indent - 20
    
    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed) {
        y -= 8
        continue
      }
      
      // Handle markdown-like formatting
      let fontSize = 11
      let font = regularFont
      let textColor = rgb(0.1, 0.1, 0.1)
      let lineIndent = indent
      let prefix = ''
      
      if (trimmed.startsWith('### ')) {
        fontSize = 12
        font = boldFont
        textColor = rgb(secondary.r, secondary.g, secondary.b)
        const text = trimmed.substring(4)
        ensureSpace(20)
        y -= 5
        const wrapped = wrapText(text, font, fontSize, contentWidth)
        for (const wl of wrapped) {
          safeDrawText(currentPage, wl, {
            x: margin + lineIndent + 10,
            y,
            size: fontSize,
            font,
            color: textColor
          })
          y -= fontSize + 4
        }
        y -= 3
        continue
      }
      
      if (trimmed.startsWith('## ')) {
        fontSize = 13
        font = boldFont
        textColor = rgb(primary.r, primary.g, primary.b)
        const text = trimmed.substring(3)
        ensureSpace(25)
        y -= 8
        const wrapped = wrapText(text, font, fontSize, contentWidth)
        for (const wl of wrapped) {
          safeDrawText(currentPage, wl, {
            x: margin + lineIndent + 10,
            y,
            size: fontSize,
            font,
            color: textColor
          })
          y -= fontSize + 4
        }
        y -= 5
        continue
      }
      
      if (trimmed.startsWith('# ')) {
        fontSize = 15
        font = boldFont
        textColor = rgb(primary.r, primary.g, primary.b)
        const text = trimmed.substring(2)
        ensureSpace(30)
        y -= 10
        const wrapped = wrapText(text, font, fontSize, contentWidth)
        for (const wl of wrapped) {
          safeDrawText(currentPage, wl, {
            x: margin + lineIndent + 10,
            y,
            size: fontSize,
            font,
            color: textColor
          })
          y -= fontSize + 5
        }
        y -= 8
        continue
      }
      
      // Bullet points
      if (trimmed.startsWith('- ') || trimmed.startsWith('• ')) {
        lineIndent += 15
        prefix = '• '
        const text = trimmed.substring(2)
        ensureSpace(16)
        const wrapped = wrapText(text, font, fontSize, contentWidth - 15)
        for (let i = 0; i < wrapped.length; i++) {
          safeDrawText(currentPage, i === 0 ? prefix + wrapped[i] : '  ' + wrapped[i], {
            x: margin + lineIndent,
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
        lineIndent += 15
        const match = trimmed.match(/^(\d+\.)\s(.*)/)
        if (match) {
          ensureSpace(16)
          const wrapped = wrapText(match[2], font, fontSize, contentWidth - 25)
          for (let i = 0; i < wrapped.length; i++) {
            safeDrawText(currentPage, i === 0 ? match[1] + ' ' + wrapped[i] : '    ' + wrapped[i], {
              x: margin + lineIndent,
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
      
      // Handle bold text markers
      let processedText = trimmed.replace(/\*\*(.+?)\*\*/g, '$1')
      
      // Regular paragraph
      ensureSpace(16)
      const wrapped = wrapText(processedText, font, fontSize, contentWidth)
      for (const wl of wrapped) {
        safeDrawText(currentPage, wl, {
          x: margin + lineIndent + 10,
          y,
          size: fontSize,
          font,
          color: textColor
        })
        y -= fontSize + 4
      }
      y -= 2
    }
  }
  
  // === HEADER ===
  // Draw header background
  currentPage.drawRectangle({
    x: margin,
    y: height - margin - 80,
    width: width - 2 * margin,
    height: 80,
    color: rgb(primary.r, primary.g, primary.b)
  })
  
  // Title
  const titleText = notes.title || topic || 'Study Notes'
  const titleLines = wrapText(titleText, boldFont, 22, width - 2 * margin - 40)
  let titleY = height - margin - 35
  for (const line of titleLines) {
    safeDrawText(currentPage, line, {
      x: margin + 20,
      y: titleY,
      size: 22,
      font: boldFont,
      color: rgb(1, 1, 1)
    })
    titleY -= 28
  }
  
  // Meta info
  const metaText = `Style: ${noteStyle || 'Outline'} • Date: ${new Date().toLocaleDateString()}`
  safeDrawText(currentPage, metaText, {
    x: margin + 20,
    y: height - margin - 70,
    size: 10,
    font: regularFont,
    color: rgb(0.9, 0.9, 0.9)
  })
  
  y = height - margin - 100
  
  // === MAIN CONTENT ===
  if (notes.content) {
    drawSectionHeader('Notes', '📚')
    drawContent(notes.content)
    y -= 15
  }
  
  // === KEY TERMS ===
  if (notes.keyTerms) {
    drawSectionHeader('Key Terms & Definitions', '#️⃣', { r: accent.r, g: accent.g, b: accent.b })
    drawContent(notes.keyTerms, 5)
    y -= 15
  }
  
  // === EXAMPLES ===
  if (notes.examples) {
    drawSectionHeader('Examples', '💡', { r: 0.99, g: 0.96, b: 0.76 })
    drawContent(notes.examples, 5)
    y -= 15
  }
  
  // === REVIEW QUESTIONS ===
  if (notes.questions) {
    drawSectionHeader('Review Questions', '❓', { r: 0.95, g: 0.91, b: 1 })
    drawContent(notes.questions, 5)
    y -= 15
  }
  
  // === SUMMARY ===
  if (notes.summary) {
    drawSectionHeader('Summary', '📝', { r: 0.86, g: 0.99, b: 0.88 })
    drawContent(notes.summary, 5)
  }
  
  // === FOOTER ===
  const pages = pdfDoc.getPages()
  for (let i = 0; i < pages.length; i++) {
    const pg = pages[i]
    safeDrawText(pg, `Page ${i + 1} of ${pages.length}`, {
      x: width / 2 - 30,
      y: 25,
      size: 9,
      font: regularFont,
      color: rgb(0.6, 0.6, 0.6)
    })
    safeDrawText(pg, 'Created with ProCreators Study Notes Generator', {
      x: margin,
      y: 25,
      size: 8,
      font: italicFont,
      color: rgb(0.7, 0.7, 0.7)
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
          
          // For text files, read directly
          if (file.type === 'text/plain' || file.name.endsWith('.txt') || file.name.endsWith('.md')) {
            sourceContent = buffer.toString('utf-8')
          } else {
            // For other files, we'd need additional processing
            // For now, treat as text
            sourceContent = buffer.toString('utf-8')
          }
        } else if (customNotes) {
          sourceContent = customNotes
        }
        
        // Build the prompt based on input mode
        let prompt = ''
        const systemPrompt = `You are an expert educator and study notes creator. You specialize in creating clear, well-organized study materials that help students learn effectively. Create notes in the student's language if the topic is given in a non-English language.`
        
        const detailInstructions = {
          brief: 'Keep the notes concise and focused on the most essential points only. Aim for brevity.',
          medium: 'Provide a balanced level of detail covering all important concepts with some explanation.',
          detailed: 'Create comprehensive, in-depth notes with thorough explanations and extensive coverage.'
        }
        
        const styleInstructions = {
          cornell: 'Structure the notes using the Cornell Method with a main notes section, cue column for questions/keywords, and a summary section.',
          outline: 'Structure the notes using the Outline Method with hierarchical bullet points: main topics, sub-topics, and supporting details.',
          mindmap: 'Structure the notes with a central concept and connected branches showing relationships between ideas. Use indentation to show hierarchy. Format as an outline showing connections.',
          summary: 'Create condensed summary notes focusing on key takeaways, important facts, and quick review points.',
          flashcard: 'Structure the content as question and answer pairs that are suitable for self-testing and active recall.'
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
  "content": "Main notes content with clear sections, bullet points, and organized information. Use markdown formatting like **bold** for key terms, ## for section headers, and - for bullet points.",
  ${includeKeyTerms ? '"keyTerms": "List of key terms with their definitions. Format each as: **Term**: Definition",' : ''}
  ${includeExamples ? '"examples": "Real-world examples and illustrations to help understand the concepts",' : ''}
  ${includeQuestions ? '"questions": "Review questions for self-testing. Include a mix of recall and application questions",' : ''}
  ${includeSummary ? '"summary": "A concise summary of the main points covered in these notes"' : ''}
}

Make the notes educational, clear, and well-organized. Use the appropriate language based on the topic.`
        } else {
          prompt = `Transform the following content into well-organized study notes:

---
${sourceContent}
---

Subject Area: ${subject}
Academic Level: ${gradeLevel}
Detail Level: ${detailInstructions[detailLevel] || detailInstructions.medium}
Note Style: ${styleInstructions[noteStyle] || styleInstructions.outline}

Please reorganize and enhance this content into the following JSON format:
{
  "title": "A clear, descriptive title for these notes",
  "content": "Reorganized main notes content with clear sections, bullet points, and improved structure. Use markdown formatting like **bold** for key terms, ## for section headers, and - for bullet points.",
  ${includeKeyTerms ? '"keyTerms": "Key terms and definitions extracted from the content. Format each as: **Term**: Definition",' : ''}
  ${includeExamples ? '"examples": "Examples from the content or additional ones to help understanding",' : ''}
  ${includeQuestions ? '"questions": "Review questions based on the content for self-testing",' : ''}
  ${includeSummary ? '"summary": "A concise summary of the main points"' : ''}
}

Improve the organization, add structure, and make it easier to study from. Maintain the original language of the content.`
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
          // Create structured response from text
          notes = {
            title: topic || 'Study Notes',
            content: response,
            summary: 'See notes above for summary.'
          }
        }
        
        return NextResponse.json({
          success: true,
          notes
        })
      }
    }
    
    // Handle JSON requests (for PDF generation)
    const body = await request.json()
    const { action } = body
    
    if (action === 'generate-pdf') {
      const { notes, topic, noteStyle, colorTheme, paperSize } = body
      
      // Create output directory
      const outputDir = path.join(process.cwd(), 'public', 'generated', 'study-notes')
      await fs.mkdir(outputDir, { recursive: true })
      
      // Generate unique filename
      const filename = `study-notes-${uuidv4()}.pdf`
      const outputPath = path.join(outputDir, filename)
      
      // Generate PDF using pdf-lib
      const pdfBuffer = await generatePDF(notes, {
        topic,
        noteStyle,
        colorTheme,
        paperSize
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
            data: { notes, topic, noteStyle, pdfUrl },
            thumbnailUrl: null
          })
        })
      } catch (e) {
        console.log('Library save skipped:', e.message)
      }
      
      return NextResponse.json({
        success: true,
        pdfUrl,
        filename
      })
    }
    
    return NextResponse.json(
      { success: false, error: 'Invalid action' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Study notes generation error:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
