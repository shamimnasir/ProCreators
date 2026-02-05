import { NextResponse } from 'next/server'
import { spawn } from 'child_process'
import path from 'path'
import fs from 'fs/promises'
import { v4 as uuidv4 } from 'uuid'

// Helper to run LLM
async function runLLM(prompt, systemPrompt = 'You are an expert curriculum designer and experienced teacher.') {
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

// Generate lesson plan HTML
function generateLessonPlanHTML(lessonPlan, config) {
  const { lessonTitle, subject, gradeLevel, duration, colors, paperSize } = config
  
  const pageWidth = paperSize === 'a4' ? '210mm' : '8.5in'
  const pageHeight = paperSize === 'a4' ? '297mm' : '11in'
  
  const primaryColor = colors?.primary || '#1e40af'
  const secondaryColor = colors?.secondary || '#3b82f6'

  const formatContent = (content) => {
    if (!content) return ''
    
    // Handle arrays
    if (Array.isArray(content)) {
      return content.map(item => `<li>${String(item)}</li>`).join('')
    }
    
    // Ensure content is a string
    const contentStr = String(content)
    
    // Convert bullet points and numbered lists
    return contentStr
      .split('\n')
      .map(line => {
        const trimmed = line.trim()
        if (trimmed.startsWith('- ') || trimmed.startsWith('• ')) {
          return `<li>${trimmed.substring(2)}</li>`
        } else if (/^\d+\.\s/.test(trimmed)) {
          return `<li>${trimmed.replace(/^\d+\.\s/, '')}</li>`
        }
        return trimmed ? `<p>${trimmed}</p>` : ''
      })
      .join('')
  }

  const sections = []
  
  // Helper to add section
  const addSection = (title, content, icon) => {
    if (content) {
      const formattedContent = formatContent(content)
      const hasListItems = formattedContent.includes('<li>')
      sections.push(`
        <div class="section">
          <h2><span class="section-icon">${icon}</span> ${title}</h2>
          ${hasListItems ? `<ul>${formattedContent}</ul>` : formattedContent}
        </div>
      `)
    }
  }

  // Build objectives section
  let objectivesHTML = ''
  if (lessonPlan.objectives && lessonPlan.objectives.length > 0) {
    objectivesHTML = `
      <div class="section objectives-section">
        <h2><span class="section-icon">🎯</span> Learning Objectives</h2>
        <ul class="objectives-list">
          ${lessonPlan.objectives.map((obj, i) => `
            <li><span class="obj-number">${i + 1}</span> ${obj}</li>
          `).join('')}
        </ul>
      </div>
    `
  }

  // Add all sections
  addSection('Materials Needed', lessonPlan.materials, '📋')
  addSection('Introduction / Hook', lessonPlan.introduction, '💡')
  addSection('Direct Instruction', lessonPlan.instruction, '📖')
  addSection('Guided Practice', lessonPlan.guidedPractice, '👥')
  addSection('Independent Practice', lessonPlan.independentPractice, '✏️')
  addSection('Closure', lessonPlan.closure, '✓')
  addSection('Assessment', lessonPlan.assessment, '📊')
  addSection('Differentiation', lessonPlan.differentiation, '🔄')
  addSection('Accommodations', lessonPlan.accommodations, '♿')
  addSection('Extensions', lessonPlan.extensions, '⭐')
  addSection('Homework / Follow-up', lessonPlan.homework, '📝')
  addSection('Teacher Reflection Notes', lessonPlan.reflection, '💭')

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Noto+Sans:wght@400;500;600;700&family=Noto+Sans+Bengali:wght@400;500;600;700&family=Noto+Sans+Devanagari:wght@400;500;600;700&family=Noto+Sans+Arabic:wght@400;500;600;700&family=Noto+Sans+Tamil:wght@400;500;600;700&family=Noto+Sans+Telugu:wght@400;500;600;700&family=Noto+Sans+Thai:wght@400;500;600;700&family=Noto+Sans+SC:wght@400;500;700&family=Noto+Sans+JP:wght@400;500;700&family=Noto+Sans+KR:wght@400;500;700&display=swap" rel="stylesheet">
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
      font-family: 'Inter', 'Noto Sans', 'Noto Sans Bengali', 'Noto Sans Devanagari', 'Noto Sans Arabic', 'Noto Sans Tamil', 'Noto Sans Telugu', 'Noto Sans Thai', 'Noto Sans SC', 'Noto Sans JP', 'Noto Sans KR', sans-serif;
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
      margin-bottom: 12px;
    }
    
    .meta-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;
    }
    
    .meta-item {
      background: rgba(255,255,255,0.15);
      padding: 10px 14px;
      border-radius: 8px;
    }
    
    .meta-label {
      font-size: 9pt;
      opacity: 0.8;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    .meta-value {
      font-size: 12pt;
      font-weight: 600;
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
      font-size: 13pt;
      font-weight: 600;
      color: ${primaryColor};
      margin-bottom: 12px;
      display: flex;
      align-items: center;
      gap: 8px;
      border-bottom: 2px solid ${secondaryColor}20;
      padding-bottom: 8px;
    }
    
    .section-icon {
      font-size: 16pt;
    }
    
    .section p {
      margin-bottom: 8px;
    }
    
    .section ul, .section ol {
      margin-left: 20px;
      margin-top: 8px;
    }
    
    .section li {
      margin-bottom: 6px;
    }
    
    .objectives-section {
      background: linear-gradient(135deg, ${primaryColor}08, ${secondaryColor}08);
      border: 2px solid ${primaryColor}30;
    }
    
    .objectives-list {
      list-style: none;
      margin-left: 0;
    }
    
    .objectives-list li {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 10px 0;
      border-bottom: 1px dashed ${primaryColor}20;
    }
    
    .objectives-list li:last-child {
      border-bottom: none;
    }
    
    .obj-number {
      background: ${primaryColor};
      color: white;
      width: 24px;
      height: 24px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 11pt;
      font-weight: 600;
      flex-shrink: 0;
    }
    
    .time-marker {
      background: ${secondaryColor};
      color: white;
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 9pt;
      font-weight: 600;
    }
    
    .footer {
      text-align: center;
      font-size: 9pt;
      color: #9ca3af;
      margin-top: 24px;
      padding-top: 16px;
      border-top: 1px solid #e5e7eb;
    }
  </style>
</head>
<body>
  <div class="page">
    <div class="header">
      <h1>${lessonTitle || lessonPlan.title || 'Lesson Plan'}</h1>
      <div class="meta-grid">
        <div class="meta-item">
          <div class="meta-label">Subject</div>
          <div class="meta-value">${subject || 'General'}</div>
        </div>
        <div class="meta-item">
          <div class="meta-label">Grade Level</div>
          <div class="meta-value">${gradeLevel || 'All Grades'}</div>
        </div>
        <div class="meta-item">
          <div class="meta-label">Duration</div>
          <div class="meta-value">${duration || '50 minutes'}</div>
        </div>
      </div>
    </div>
    
    ${objectivesHTML}
    ${sections.join('')}
    
    <div class="footer">
      Created with ProCreators Lesson Plan Generator
    </div>
  </div>
</body>
</html>
  `
}

// PDF generation is handled inline using @/lib/html-pdf-generator

export async function POST(request) {
  try {
    const body = await request.json()
    const { action } = body

    if (action === 'generate-content') {
      const {
        lessonTitle,
        subject,
        gradeLevel,
        duration,
        unitName,
        lessonNumber,
        topic,
        customPrompt,
        standardsType,
        customStandards,
        priorKnowledge,
        vocabularyTerms,
        strategies,
        assessments,
        includeDifferentiation,
        includeAccommodations,
        includeExtensions,
        includeMaterials,
        includeHomework
      } = body

      const systemPrompt = `You are an expert curriculum designer and experienced teacher. Create detailed, practical, and engaging lesson plans that follow best practices in education. Your lesson plans should be comprehensive yet easy to follow, with clear time allocations and actionable activities.

**BANNED WORDS - DO NOT USE THESE AI-SOUNDING WORDS:**
Avoid these overused words in lesson plans:
- unlock, unleash, unveil (e.g., "unlock learning")
- game-changer, cutting-edge
- supercharge, seamless
- harness, leverage (overused)
- elevate, empower, transform (overused)
- dive into, dive deep, delve
- synergy, paradigm shift
- holistic (except clinical contexts)
- journey (metaphorical)
- innovative, innovation (overused)

Use clear, practical language that teachers can easily follow.`

      let prompt = `Create a comprehensive lesson plan with the following details:

LESSON INFORMATION:
- Subject: ${subject}
- Grade Level: ${gradeLevel}
- Topic: ${topic}
- Duration: ${duration}
${lessonTitle ? `- Lesson Title: ${lessonTitle}` : ''}
${unitName ? `- Unit: ${unitName}` : ''}
${lessonNumber ? `- Lesson Number: ${lessonNumber}` : ''}

${standardsType !== 'none' ? `STANDARDS: ${standardsType === 'custom' ? customStandards : `Align with ${standardsType} standards`}` : ''}

${priorKnowledge ? `PRIOR KNOWLEDGE REQUIRED: ${priorKnowledge}` : ''}

${vocabularyTerms ? `KEY VOCABULARY: ${vocabularyTerms}` : ''}

TEACHING STRATEGIES TO USE: ${strategies.join(', ')}

ASSESSMENT METHODS: ${assessments.join(', ')}

${customPrompt ? `ADDITIONAL REQUIREMENTS: ${customPrompt}` : ''}

Please provide the lesson plan in the following JSON format:
{
  "title": "Lesson title",
  "objectives": ["Objective 1 - Students will be able to...", "Objective 2...", "Objective 3..."],
  ${includeMaterials ? '"materials": "List of all materials needed with quantities",' : ''}
  "introduction": "5-10 minute hook/warm-up activity with specific instructions",
  "instruction": "Detailed direct instruction section with step-by-step teaching points and time estimates",
  "guidedPractice": "Collaborative practice activities with clear instructions",
  "independentPractice": "Individual practice activities",
  "closure": "Review and wrap-up activities",
  "assessment": "Specific assessment activities aligned with objectives"${includeDifferentiation ? ',\n  "differentiation": "Strategies for struggling learners, on-level students, and advanced learners"' : ''}${includeAccommodations ? ',\n  "accommodations": "Specific accommodations for ELL, IEP, and 504 students"' : ''}${includeExtensions ? ',\n  "extensions": "Enrichment activities for students who finish early or want extra challenge"' : ''}${includeHomework ? ',\n  "homework": "Follow-up assignment or practice for home"' : ''},
  "reflection": "Guiding questions for teacher reflection after the lesson"
}

Make each section detailed with specific activities, time allocations, and practical instructions a teacher can follow. Use bullet points within sections for clarity. Include estimated time for each major activity.`

      const response = await runLLM(prompt, systemPrompt)
      
      // Parse JSON from response
      let lessonPlan
      try {
        // Try to extract JSON from the response
        const jsonMatch = response.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          lessonPlan = JSON.parse(jsonMatch[0])
        } else {
          throw new Error('No JSON found in response')
        }
      } catch (parseError) {
        console.error('JSON parse error:', parseError)
        // Create a structured response from the text
        lessonPlan = {
          title: lessonTitle || `${topic} Lesson Plan`,
          objectives: ['Students will understand the key concepts', 'Students will apply their learning', 'Students will demonstrate mastery'],
          materials: 'Generated lesson materials',
          introduction: response.substring(0, 500),
          instruction: 'See generated content',
          guidedPractice: 'Group practice activities',
          independentPractice: 'Individual practice',
          closure: 'Review and assessment',
          assessment: 'Formative assessment throughout'
        }
      }

      return NextResponse.json({
        success: true,
        lessonPlan
      })
    }

    if (action === 'generate-pdf') {
      const { lessonPlan, lessonTitle, subject, gradeLevel, duration, paperSize, colors } = body

      // Generate HTML
      const html = generateLessonPlanHTML(lessonPlan, {
        lessonTitle,
        subject,
        gradeLevel,
        duration,
        colors,
        paperSize
      })

      // Create output directory
      const outputDir = path.join(process.cwd(), 'public', 'generated', 'lesson-plans')
      await fs.mkdir(outputDir, { recursive: true })

      // Generate unique filename
      const filename = `lesson-plan-${uuidv4()}.pdf`
      const outputPath = path.join(outputDir, filename)

      // Generate PDF using Puppeteer
      const { generatePDFFromHTML: puppeteerGenerate } = await import('@/lib/html-pdf-generator')
      const pdfBuffer = await puppeteerGenerate(html)
      
      // Save the PDF file
      await fs.writeFile(outputPath, pdfBuffer)

      const pdfUrl = `/generated/lesson-plans/${filename}`

      // Save to library
      try {
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
        await fetch(`${baseUrl}/api/library/save`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'lesson-planner',
            title: lessonPlan.title || 'Lesson Plan',
            content: pdfUrl,
            filePath: pdfUrl,
            description: `${subject} - ${gradeLevel} - ${duration}`,
            metadata: {
              subject,
              gradeLevel,
              duration,
              topic,
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

    return NextResponse.json(
      { success: false, error: 'Invalid action' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Lesson plan generation error:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
