import { NextResponse } from 'next/server'
import { spawn } from 'child_process'
import path from 'path'
import fs from 'fs/promises'
import { v4 as uuidv4 } from 'uuid'
import { enforceRateLimit } from '@/lib/rate-limiter'

// Helper to run LLM
async function runLLM(prompt, systemPrompt = 'You are an expert academic writing assistant.') {
  return new Promise(async (resolve, reject) => {
    try {
      const scriptPath = path.join(process.cwd(), 'scripts', 'llm_call.py')
      
      const inputData = JSON.stringify({
        prompt,
        system_prompt: systemPrompt
      })
      
      const tempDir = path.join(process.cwd(), 'tmp')
      await fs.mkdir(tempDir, { recursive: true })
      const tempFile = path.join(tempDir, `llm-input-${uuidv4()}.json`)
      await fs.writeFile(tempFile, inputData, 'utf-8')
      
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
        try {
          await fs.unlink(tempFile)
        } catch (e) {}
        
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
        try {
          await fs.unlink(tempFile)
        } catch (e) {}
        reject(new Error(`Failed to start LLM process: ${err.message}`))
      })
    } catch (error) {
      reject(error)
    }
  })
}

// Essay type descriptions
const ESSAY_TYPE_INFO = {
  'argumentative': 'Take a clear stance on a debatable topic and defend it with evidence and logical reasoning.',
  'persuasive': 'Convince the reader to accept your viewpoint or take action using emotional and logical appeals.',
  'expository': 'Explain or inform about a topic objectively, using facts and examples without personal opinion.',
  'narrative': 'Tell a story with a clear beginning, middle, and end, often with a personal reflection or lesson.',
  'compare-contrast': 'Analyze two or more subjects by examining their similarities and differences.',
  'research': 'Present in-depth analysis of a topic with evidence from multiple sources and proper citations.',
  'descriptive': 'Create a vivid picture using sensory details and figurative language.'
}

// Academic level guidelines
const ACADEMIC_GUIDELINES = {
  'high-school': 'Use clear, straightforward language. Avoid overly complex vocabulary. Focus on 5-paragraph structure.',
  'undergraduate': 'Use academic vocabulary and formal tone. Include topic sentences and transitions. Demonstrate critical thinking.',
  'graduate': 'Use sophisticated academic language. Include nuanced analysis, multiple perspectives, and scholarly discourse.',
  'professional': 'Use industry-appropriate terminology. Be concise yet comprehensive. Focus on practical applications.'
}

// Generate content based on mode
async function generateContent(config) {
  const { 
    essayType, writingMode, academicLevel, essayLength, 
    citationStyle, topic, thesis, existingContent,
    additionalInstructions, outlinePoints 
  } = config

  const essayInfo = ESSAY_TYPE_INFO[essayType] || 'Standard essay format'
  const levelGuide = ACADEMIC_GUIDELINES[academicLevel] || ACADEMIC_GUIDELINES['undergraduate']
  
  const lengthGuide = {
    'short': '500-700 words, 4-5 paragraphs',
    'medium': '1000-1200 words, 6-8 paragraphs',
    'long': '1500-2000 words, 8-12 paragraphs',
    'extended': '2500+ words, 12+ paragraphs'
  }[essayLength] || '1000-1200 words'

  let prompt = ''
  let systemPrompt = 'You are an expert academic writing assistant with extensive experience in essay writing across all academic levels. Provide high-quality, original content that matches the requested style and level.'

  switch (writingMode) {
    case 'brainstorm':
      prompt = `Generate 6 creative and thought-provoking essay topic ideas${topic ? ` related to "${topic}"` : ''}.

Essay Type: ${essayType} (${essayInfo})
Academic Level: ${academicLevel}
${additionalInstructions ? `Additional context: ${additionalInstructions}` : ''}

For each topic, provide:
1. A clear, specific topic title
2. A brief description (1-2 sentences)
3. A unique angle or perspective to explore

Return as JSON:
{
  "topics": [
    {
      "title": "Specific topic title",
      "description": "Brief description of the topic",
      "angle": "Unique perspective or approach"
    }
  ]
}

Return ONLY valid JSON.`
      break

    case 'thesis':
      prompt = `Generate 3 strong thesis statements for an essay on:

Topic: ${topic}
Essay Type: ${essayType} (${essayInfo})
Academic Level: ${academicLevel}
${additionalInstructions ? `Additional requirements: ${additionalInstructions}` : ''}

Each thesis should:
- Be specific and arguable (not a fact)
- Present a clear position or main idea
- Be appropriate for the essay type and academic level
- Be 1-2 sentences long

Return as JSON:
{
  "thesis": [
    {
      "statement": "The thesis statement",
      "explanation": "Brief explanation of why this thesis works and what angle it takes"
    }
  ]
}

Return ONLY valid JSON.`
      break

    case 'outline':
      prompt = `Create a detailed essay outline for:

Topic: ${topic}
${thesis ? `Thesis: ${thesis}` : 'Generate an appropriate thesis statement.'}
Essay Type: ${essayType} (${essayInfo})
Academic Level: ${academicLevel}
Target Length: ${lengthGuide}
${citationStyle !== 'none' ? `Citation Style: ${citationStyle}` : ''}
${additionalInstructions ? `Additional requirements: ${additionalInstructions}` : ''}

Create a comprehensive outline with:
1. Introduction with hook, context, and thesis
2. Body paragraphs with topic sentences and supporting points
3. Conclusion with summary and final thoughts

Return as JSON:
{
  "thesis": "The thesis statement",
  "outline": [
    {
      "title": "Section title (e.g., Introduction, Body Paragraph 1, etc.)",
      "points": ["Bullet point 1", "Bullet point 2", "Bullet point 3"]
    }
  ]
}

Return ONLY valid JSON.`
      break

    case 'introduction':
      prompt = `Write a compelling introduction for:

Topic: ${topic}
${thesis ? `Thesis: ${thesis}` : 'Generate and include an appropriate thesis statement.'}
Essay Type: ${essayType}
Academic Level: ${academicLevel} (${levelGuide})
${additionalInstructions ? `Additional requirements: ${additionalInstructions}` : ''}

The introduction should:
1. Start with an engaging hook (question, quote, statistic, or anecdote)
2. Provide necessary background/context
3. Lead smoothly to the thesis statement
4. Be approximately 100-150 words

Return as JSON:
{
  "content": "The full introduction paragraph text"
}

Return ONLY valid JSON.`
      break

    case 'body':
      const pointsList = outlinePoints?.length ? outlinePoints.join('\n- ') : 'Generate appropriate supporting arguments'
      prompt = `Write body paragraphs expanding on these points:

Topic: ${topic}
${thesis ? `Thesis: ${thesis}` : ''}
Points to expand:
- ${pointsList}

Essay Type: ${essayType}
Academic Level: ${academicLevel} (${levelGuide})
${citationStyle !== 'none' ? `Include placeholder citations in ${citationStyle} style` : ''}
${additionalInstructions ? `Additional requirements: ${additionalInstructions}` : ''}

Each paragraph should:
1. Start with a clear topic sentence
2. Include evidence, examples, or explanations
3. Provide analysis connecting to the thesis
4. End with a transition to the next point
5. Be 150-200 words each

Return as JSON:
{
  "content": "All body paragraphs separated by double newlines"
}

Return ONLY valid JSON.`
      break

    case 'conclusion':
      prompt = `Write a strong conclusion for:

Topic: ${topic}
${thesis ? `Thesis: ${thesis}` : ''}
Essay Type: ${essayType}
Academic Level: ${academicLevel} (${levelGuide})
${additionalInstructions ? `Additional requirements: ${additionalInstructions}` : ''}

The conclusion should:
1. Restate the thesis in fresh words
2. Summarize main points without repeating exact phrases
3. End with a thought-provoking final statement, call to action, or broader implication
4. Be approximately 100-150 words
5. NOT introduce new arguments

Return as JSON:
{
  "content": "The full conclusion paragraph text"
}

Return ONLY valid JSON.`
      break

    case 'full-essay':
      prompt = `Write a complete ${essayType} essay on:

Topic: ${topic}
${thesis ? `Thesis: ${thesis}` : 'Generate an appropriate thesis statement.'}
Academic Level: ${academicLevel} (${levelGuide})
Target Length: ${lengthGuide}
${citationStyle !== 'none' ? `Include placeholder citations in ${citationStyle} style` : ''}
${additionalInstructions ? `Additional requirements: ${additionalInstructions}` : ''}

Essay Type Guidelines: ${essayInfo}

Structure:
1. Introduction with hook, context, and thesis
2. Well-developed body paragraphs with topic sentences, evidence, and analysis
3. Strong conclusion with synthesis and final thoughts

The essay should:
- Have clear paragraph structure
- Use appropriate transitions between paragraphs
- Maintain consistent tone and style
- Be original and engaging

Return as JSON:
{
  "title": "Essay title",
  "essay": "The complete essay text with paragraphs separated by double newlines",
  "wordCount": approximate_word_count_number
}

Return ONLY valid JSON.`
      break

    case 'improve':
      prompt = `Analyze and improve this essay:

---BEGIN ESSAY---
${existingContent}
---END ESSAY---

Essay Type: ${essayType}
Academic Level: ${academicLevel}
${additionalInstructions ? `Focus areas: ${additionalInstructions}` : ''}

Provide:
1. An overall score (0-100)
2. List of strengths (3-5 points)
3. List of suggested improvements (3-5 points)
4. A revised version of the essay with improvements applied

Return as JSON:
{
  "score": number_between_0_and_100,
  "analysis": {
    "strengths": ["strength 1", "strength 2", "strength 3"],
    "improvements": ["improvement 1", "improvement 2", "improvement 3"]
  },
  "revisedEssay": "The improved essay text"
}

Return ONLY valid JSON.`
      break

    default:
      throw new Error('Invalid writing mode')
  }

  const response = await runLLM(prompt, systemPrompt)
  
  // Parse JSON from response
  let jsonMatch = response.match(/\{[\s\S]*\}/)
  if (jsonMatch) {
    return JSON.parse(jsonMatch[0])
  }
  
  throw new Error('Failed to parse response')
}

// Generate PDF
async function generatePDF(config) {
  const { content, topic, essayType, academicLevel, citationStyle } = config

  const escapeHTML = (text) => {
    if (!text) return ''
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
  }

  // Get the main content text
  let mainContent = ''
  let title = topic || 'Essay'
  
  if (content.essay) {
    mainContent = content.essay
    title = content.title || topic
  } else if (content.content) {
    mainContent = content.content
  } else if (content.revisedEssay) {
    mainContent = content.revisedEssay
  } else if (content.outline) {
    // Format outline as content
    mainContent = content.outline.map((section, idx) => {
      let text = `${idx + 1}. ${section.title}\n`
      if (section.points) {
        text += section.points.map(p => `   • ${p}`).join('\n')
      }
      return text
    }).join('\n\n')
  }

  const paragraphs = mainContent.split('\n\n').map(p => 
    `<p class="paragraph">${escapeHTML(p.trim())}</p>`
  ).join('')

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <link href="https://fonts.googleapis.com/css2?family=Merriweather:wght@400;700&family=Open+Sans:wght@400;600&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    
    body {
      font-family: 'Merriweather', Georgia, serif;
      line-height: 1.8;
      color: #333;
      font-size: 12pt;
    }
    
    .page {
      padding: 60px 70px;
      max-width: 800px;
      margin: 0 auto;
    }
    
    .header {
      text-align: center;
      margin-bottom: 40px;
      padding-bottom: 20px;
      border-bottom: 2px solid #2563eb;
    }
    
    .header h1 {
      font-size: 24pt;
      color: #1e3a5f;
      margin-bottom: 10px;
      font-weight: 700;
    }
    
    .header .meta {
      font-family: 'Open Sans', sans-serif;
      font-size: 10pt;
      color: #666;
    }
    
    .content {
      text-align: justify;
    }
    
    .paragraph {
      margin-bottom: 20px;
      text-indent: 40px;
    }
    
    .paragraph:first-child {
      text-indent: 0;
    }
    
    .thesis-box {
      background: #f0f7ff;
      border-left: 4px solid #2563eb;
      padding: 15px 20px;
      margin: 20px 0;
      font-style: italic;
    }
    
    .section-title {
      font-family: 'Open Sans', sans-serif;
      font-size: 14pt;
      font-weight: 600;
      color: #2563eb;
      margin: 30px 0 15px 0;
    }
    
    .analysis-box {
      background: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 20px;
      margin: 20px 0;
    }
    
    .analysis-box h3 {
      font-family: 'Open Sans', sans-serif;
      font-size: 12pt;
      margin-bottom: 10px;
    }
    
    .analysis-box.strengths {
      background: #f0fdf4;
      border-color: #22c55e;
    }
    
    .analysis-box.improvements {
      background: #fefce8;
      border-color: #eab308;
    }
    
    .analysis-box ul {
      margin-left: 20px;
    }
    
    .analysis-box li {
      margin-bottom: 5px;
      font-size: 11pt;
    }
    
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
      text-align: center;
      font-family: 'Open Sans', sans-serif;
      font-size: 9pt;
      color: #999;
    }
    
    .word-count {
      text-align: right;
      font-family: 'Open Sans', sans-serif;
      font-size: 10pt;
      color: #666;
      margin-top: 20px;
    }
  </style>
</head>
<body>
  <div class="page">
    <div class="header">
      <h1>${escapeHTML(title)}</h1>
      <div class="meta">
        ${essayType ? `Essay Type: ${escapeHTML(essayType)} | ` : ''}
        ${academicLevel ? `Level: ${escapeHTML(academicLevel)} | ` : ''}
        ${citationStyle && citationStyle !== 'none' ? `Citations: ${escapeHTML(citationStyle)}` : ''}
      </div>
    </div>
    
    ${content.thesis ? `<div class="thesis-box"><strong>Thesis:</strong> ${escapeHTML(content.thesis)}</div>` : ''}
    
    ${content.analysis ? `
      <div class="analysis-box">
        <h3>Score: ${content.score}/100</h3>
      </div>
      <div class="analysis-box strengths">
        <h3>✓ Strengths</h3>
        <ul>${content.analysis.strengths?.map(s => `<li>${escapeHTML(s)}</li>`).join('') || ''}</ul>
      </div>
      <div class="analysis-box improvements">
        <h3>⚡ Suggested Improvements</h3>
        <ul>${content.analysis.improvements?.map(s => `<li>${escapeHTML(s)}</li>`).join('') || ''}</ul>
      </div>
      <div class="section-title">Revised Essay</div>
    ` : ''}
    
    <div class="content">
      ${paragraphs}
    </div>
    
    ${content.wordCount ? `<div class="word-count">Word Count: ~${content.wordCount}</div>` : ''}
    
    <div class="footer">
      Generated by ProCreators Essay Helper • ${new Date().toLocaleDateString()}
    </div>
  </div>
</body>
</html>`

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
      format: 'A4',
      printBackground: true,
      margin: { top: '20mm', right: '20mm', bottom: '20mm', left: '20mm' }
    })
    
    return pdfBuffer
  } finally {
    await browser.close()
  }
}

export async function POST(request) {
  try {
    // SECURITY: Rate limiting for content generation
    const rateLimitCheck = await enforceRateLimit(request, 'content_generate')
    if (rateLimitCheck.limited) {
      return rateLimitCheck.response
    }

    const body = await request.json()
    const { action } = body
    
    if (action === 'generate') {
      const content = await generateContent(body)
      
      return NextResponse.json({
        success: true,
        content
      })
    }
    
    if (action === 'generate-pdf') {
      const pdfBuffer = await generatePDF(body)
      
      // Save PDF
      const outputDir = path.join(process.cwd(), 'public', 'generated', 'essay-helper')
      await fs.mkdir(outputDir, { recursive: true })
      
      const filename = `essay-${uuidv4()}.pdf`
      const outputPath = path.join(outputDir, filename)
      await fs.writeFile(outputPath, pdfBuffer)
      
      const pdfUrl = `/generated/essay-helper/${filename}`
      
      // Save to library
      try {
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
        await fetch(`${baseUrl}/api/library/save`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'essay-helper',
            title: body.topic || body.content?.title || 'Essay',
            content: pdfUrl,
            filePath: pdfUrl,
            description: `${body.essayType || 'Essay'} - ${body.writingMode || 'Generated'}`,
            metadata: {
              essayType: body.essayType,
              writingMode: body.writingMode,
              academicLevel: body.academicLevel,
              citationStyle: body.citationStyle,
              pdfUrl
            }
          })
        })
        } catch (e) {
        }
      
      return NextResponse.json({
        success: true,
        pdfUrl,
        filename
      })
    }
    
    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 })
    
  } catch (error) {
    console.error('Essay helper error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
