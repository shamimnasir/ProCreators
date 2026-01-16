import { NextResponse } from 'next/server'
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

// Generate PDF HTML
function generateStudyNotesHTML(notes, config) {
  const { topic, noteStyle, colorTheme, paperSize } = config
  
  const pageWidth = paperSize === 'a4' ? '210mm' : '8.5in'
  const pageHeight = paperSize === 'a4' ? '297mm' : '11in'
  
  const primaryColor = colorTheme?.primary || '#1e40af'
  const secondaryColor = colorTheme?.secondary || '#3b82f6'
  const accentColor = colorTheme?.accent || '#dbeafe'

  // Format markdown-like content to HTML
  const formatContent = (content) => {
    if (!content) return ''
    
    return content
      .split('\n')
      .map(line => {
        const trimmed = line.trim()
        
        // Headers
        if (trimmed.startsWith('### ')) {
          return `<h4 class="sub-heading">${trimmed.substring(4)}</h4>`
        }
        if (trimmed.startsWith('## ')) {
          return `<h3 class="section-heading">${trimmed.substring(3)}</h3>`
        }
        if (trimmed.startsWith('# ')) {
          return `<h2 class="main-heading">${trimmed.substring(2)}</h2>`
        }
        
        // Bullet points
        if (trimmed.startsWith('- ') || trimmed.startsWith('• ')) {
          return `<li>${trimmed.substring(2)}</li>`
        }
        
        // Numbered lists
        if (/^\d+\.\s/.test(trimmed)) {
          return `<li>${trimmed.replace(/^\d+\.\s/, '')}</li>`
        }
        
        // Bold text
        let processed = trimmed.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        
        // Italic text
        processed = processed.replace(/\*(.+?)\*/g, '<em>$1</em>')
        
        return processed ? `<p>${processed}</p>` : ''
      })
      .join('')
  }

  const styleSpecificCSS = noteStyle === 'cornell' ? `
    .cornell-container {
      display: grid;
      grid-template-columns: 2.5in 1fr;
      gap: 16px;
      min-height: 400px;
    }
    .cue-column {
      background: ${accentColor};
      padding: 16px;
      border-radius: 8px;
      border-right: 3px solid ${primaryColor};
    }
    .notes-column {
      padding: 16px;
    }
    .summary-section {
      margin-top: 20px;
      padding: 16px;
      background: ${accentColor};
      border-top: 3px solid ${primaryColor};
      border-radius: 8px;
    }
  ` : ''

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Noto+Sans:wght@400;500;600;700&family=Noto+Sans+Bengali:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    @page {
      size: ${pageWidth} ${pageHeight};
      margin: 0;
    }
    
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Inter', 'Noto Sans', 'Noto Sans Bengali', sans-serif;
      font-size: 11pt;
      line-height: 1.6;
      color: #1f2937;
      background: white;
    }
    
    .page {
      width: ${pageWidth};
      min-height: ${pageHeight};
      padding: 0.6in;
      page-break-after: always;
      background: white;
    }
    
    .header {
      background: linear-gradient(135deg, ${primaryColor}, ${secondaryColor});
      color: white;
      padding: 24px;
      border-radius: 12px;
      margin-bottom: 24px;
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
    
    .section {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 16px 20px;
      margin-bottom: 16px;
      page-break-inside: avoid;
    }
    
    .section h2 {
      font-size: 14pt;
      font-weight: 600;
      color: ${primaryColor};
      margin-bottom: 12px;
      display: flex;
      align-items: center;
      gap: 8px;
      border-bottom: 2px solid ${accentColor};
      padding-bottom: 8px;
    }
    
    .section-icon {
      font-size: 18pt;
    }
    
    .content {
      line-height: 1.8;
    }
    
    .content p {
      margin-bottom: 10px;
    }
    
    .content li {
      margin-bottom: 6px;
      margin-left: 20px;
    }
    
    .content ul, .content ol {
      margin-top: 8px;
      margin-bottom: 12px;
    }
    
    .main-heading {
      font-size: 14pt;
      font-weight: 600;
      color: ${primaryColor};
      margin: 16px 0 8px 0;
    }
    
    .section-heading {
      font-size: 12pt;
      font-weight: 600;
      color: ${secondaryColor};
      margin: 12px 0 6px 0;
    }
    
    .sub-heading {
      font-size: 11pt;
      font-weight: 600;
      margin: 10px 0 4px 0;
    }
    
    .key-terms {
      background: ${accentColor};
      border-left: 4px solid ${primaryColor};
    }
    
    .examples {
      background: #fef9c3;
      border-left: 4px solid #eab308;
    }
    
    .questions {
      background: #f3e8ff;
      border-left: 4px solid #9333ea;
    }
    
    .summary {
      background: #dcfce7;
      border-left: 4px solid #22c55e;
    }
    
    .footer {
      text-align: center;
      font-size: 9pt;
      color: #9ca3af;
      margin-top: 24px;
      padding-top: 16px;
      border-top: 1px solid #e5e7eb;
    }
    
    ${styleSpecificCSS}
  </style>
</head>
<body>
  <div class="page">
    <div class="header">
      <h1>${notes.title || topic || 'Study Notes'}</h1>
      <div class="meta">
        ${noteStyle ? `Style: ${noteStyle.charAt(0).toUpperCase() + noteStyle.slice(1)} Method` : ''}
        ${notes.subject ? ` • Subject: ${notes.subject}` : ''}
        ${notes.date ? ` • Date: ${notes.date}` : ` • Date: ${new Date().toLocaleDateString()}`}
      </div>
    </div>
    
    ${noteStyle === 'cornell' ? `
    <div class="cornell-container">
      <div class="cue-column">
        <h3 style="color: ${primaryColor}; margin-bottom: 12px;">📝 Cue Column</h3>
        <p style="font-size: 10pt; color: #666; margin-bottom: 12px;">Questions & Keywords</p>
        ${notes.questions ? formatContent(notes.questions) : '<p>Write your review questions here...</p>'}
      </div>
      <div class="notes-column">
        <div class="content">
          ${formatContent(notes.content)}
        </div>
      </div>
    </div>
    <div class="summary-section">
      <h3 style="color: ${primaryColor}; margin-bottom: 12px;">📋 Summary</h3>
      ${notes.summary ? formatContent(notes.summary) : '<p>Write your summary here after reviewing...</p>'}
    </div>
    ` : `
    <div class="section">
      <h2><span class="section-icon">📚</span> Notes</h2>
      <div class="content">
        ${formatContent(notes.content)}
      </div>
    </div>
    `}
    
    ${notes.keyTerms ? `
    <div class="section key-terms">
      <h2><span class="section-icon">#️⃣</span> Key Terms & Definitions</h2>
      <div class="content">
        ${formatContent(notes.keyTerms)}
      </div>
    </div>
    ` : ''}
    
    ${notes.examples && noteStyle !== 'cornell' ? `
    <div class="section examples">
      <h2><span class="section-icon">💡</span> Examples</h2>
      <div class="content">
        ${formatContent(notes.examples)}
      </div>
    </div>
    ` : ''}
    
    ${notes.questions && noteStyle !== 'cornell' ? `
    <div class="section questions">
      <h2><span class="section-icon">❓</span> Review Questions</h2>
      <div class="content">
        ${formatContent(notes.questions)}
      </div>
    </div>
    ` : ''}
    
    ${notes.summary && noteStyle !== 'cornell' ? `
    <div class="section summary">
      <h2><span class="section-icon">📝</span> Summary</h2>
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
          mindmap: 'Structure the notes with a central concept and connected branches showing relationships between ideas. Use indentation to show hierarchy.',
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
      
      // Generate HTML
      const html = generateStudyNotesHTML(notes, {
        topic,
        noteStyle,
        colorTheme,
        paperSize
      })
      
      // Create output directory
      const outputDir = path.join(process.cwd(), 'public', 'generated', 'study-notes')
      await fs.mkdir(outputDir, { recursive: true })
      
      // Generate unique filename
      const filename = `study-notes-${uuidv4()}.pdf`
      const outputPath = path.join(outputDir, filename)
      
      // Generate PDF using Puppeteer
      const { generatePDFFromHTML: puppeteerGenerate } = await import('@/lib/html-pdf-generator')
      const pdfBuffer = await puppeteerGenerate(html)
      
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
