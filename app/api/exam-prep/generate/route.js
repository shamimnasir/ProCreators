import { NextResponse } from 'next/server'
import { spawn } from 'child_process'
import path from 'path'
import fs from 'fs/promises'
import { v4 as uuidv4 } from 'uuid'

// Helper to run LLM
async function runLLM(prompt, systemPrompt = 'You are an expert exam preparation assistant.') {
  return new Promise(async (resolve, reject) => {
    try {
      const scriptPath = path.join(process.cwd(), 'scripts', 'llm_call.py')
      
      const inputData = JSON.stringify({
        prompt,
        system_prompt: systemPrompt
      })
      
      // Write to temp file to avoid command line size limits
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

// Search for exam information using web search simulation via LLM
async function searchExamInfo(examName) {
  const prompt = `You are an expert on competitive exams and standardized tests worldwide. 

Provide detailed information about the exam: "${examName}"

Include the following in your response as JSON:
{
  "examName": "Full official name of the exam",
  "country": "Country/Region where this exam is conducted",
  "authority": "Conducting authority/organization",
  "pattern": "Brief description of exam pattern (e.g., 'Multiple choice questions with negative marking')",
  "sections": "List of sections/subjects covered",
  "questionTypes": "Types of questions (MCQ, descriptive, etc.)",
  "duration": "Total exam duration",
  "totalMarks": "Total marks",
  "passingCriteria": "Minimum passing marks or criteria",
  "frequency": "How often the exam is conducted (yearly, twice a year, etc.)",
  "eligibility": "Basic eligibility criteria",
  "importantTopics": ["List of important topics to focus on"],
  "tips": ["Preparation tips"]
}

If you don't have accurate information about this specific exam, provide a reasonable exam structure that would be typical for this type of examination.

Return ONLY valid JSON.`

  try {
    const response = await runLLM(prompt, 'You are an expert on competitive examinations worldwide. Provide accurate exam information in JSON format only.')
    
    // Parse JSON from response
    let jsonMatch = response.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0])
    }
    return null
  } catch (error) {
    console.error('Exam search error:', error)
    return null
  }
}

// Generate practice questions
async function generateQuestions(config) {
  const { examName, examInfo, practiceMode, difficulty, subject, questionCount, includeExplanations } = config
  
  const difficultyInstructions = {
    easy: 'Basic level questions testing fundamental concepts',
    medium: 'Intermediate level questions requiring good understanding',
    hard: 'Advanced level questions that test deep knowledge and analytical skills',
    mixed: 'Mix of easy (30%), medium (50%), and hard (20%) questions'
  }
  
  let examContext = ''
  if (examInfo) {
    examContext = `
Exam Details:
- Pattern: ${examInfo.pattern || 'Standard competitive exam'}
- Sections: ${examInfo.sections || 'General'}
- Question Types: ${examInfo.questionTypes || 'Multiple Choice'}
- Important Topics: ${examInfo.importantTopics?.join(', ') || 'Various topics'}
`
  }
  
  const prompt = `Generate ${questionCount} practice questions for the "${examName}" exam.

${examContext}

Configuration:
- Difficulty: ${difficulty} - ${difficultyInstructions[difficulty]}
- Subject/Topic Focus: ${subject || 'General/Mixed subjects'}
- Include explanations: ${includeExplanations ? 'Yes, detailed explanations for each answer' : 'Brief or no explanations'}

Generate questions in this JSON format:
{
  "questions": [
    {
      "number": 1,
      "type": "multiple-choice",
      "question": "Question text here",
      "options": ["A) Option 1", "B) Option 2", "C) Option 3", "D) Option 4"],
      "correctAnswer": "A",
      "explanation": "Explanation of why this is correct",
      "difficulty": "easy|medium|hard",
      "topic": "Topic category"
    }
  ]
}

Rules:
1. Questions should be realistic and match actual exam patterns
2. All questions should have exactly 4 options (A, B, C, D)
3. Include a mix of conceptual, analytical, and application-based questions
4. Explanations should be educational and help understand the concept
5. Topics should be relevant to the exam syllabus
6. For language exams (IELTS, TOEFL), include reading comprehension, grammar, and vocabulary questions
7. For competitive exams (BCS, UPSC), include current affairs, reasoning, and subject-specific questions
8. Generate questions in the appropriate language (English for international exams, may include local language for regional exams)

Return ONLY valid JSON.`

  try {
    const response = await runLLM(prompt, `You are an expert question paper setter for ${examName}. Generate high-quality practice questions that accurately reflect the exam pattern and difficulty.`)
    
    // Parse JSON from response
    let jsonStr = response
    const jsonMatch = response.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      jsonStr = jsonMatch[0]
    }
    
    const data = JSON.parse(jsonStr)
    return data.questions || []
  } catch (error) {
    console.error('Question generation error:', error)
    throw new Error('Failed to generate questions')
  }
}

// Generate PDF with questions and answers
async function generatePDF(config) {
  const { examName, questions, userAnswers, results, difficulty, subject } = config
  
  // Escape HTML
  const escapeHTML = (text) => {
    if (!text) return ''
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
  }
  
  // Generate questions HTML
  const questionsHTML = questions.map((q, idx) => {
    const userAnswer = userAnswers?.[idx]
    const isCorrect = userAnswer === q.correctAnswer || userAnswer === q.answer
    
    return `
      <div class="question">
        <div class="question-header">
          <span class="question-number">${idx + 1}</span>
          <span class="question-text">${escapeHTML(q.question)}</span>
        </div>
        <div class="options">
          ${(q.options || []).map((opt, oIdx) => {
            const letter = String.fromCharCode(65 + oIdx)
            const isCorrectOpt = letter === q.correctAnswer || letter === q.answer
            const isUserAnswer = letter === userAnswer
            
            return `
              <div class="option ${isCorrectOpt ? 'correct' : ''} ${isUserAnswer && !isCorrectOpt ? 'incorrect' : ''}">
                <span class="option-letter">${letter}</span>
                <span>${escapeHTML(opt.replace(/^[A-D]\)\s*/, ''))}</span>
                ${isCorrectOpt ? '<span class="check">✓</span>' : ''}
                ${isUserAnswer && !isCorrectOpt ? '<span class="cross">✗</span>' : ''}
              </div>
            `
          }).join('')}
        </div>
        ${q.explanation ? `
          <div class="explanation">
            <strong>Explanation:</strong> ${escapeHTML(q.explanation)}
          </div>
        ` : ''}
      </div>
    `
  }).join('')
  
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Bengali:wght@400;600;700&family=Noto+Sans:wght@400;600;700&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    
    body {
      font-family: 'Noto Sans Bengali', 'Noto Sans', Arial, sans-serif;
      line-height: 1.6;
      color: #1f2937;
      font-size: 11pt;
    }
    
    .page {
      padding: 40px;
      min-height: 100vh;
    }
    
    .header {
      background: linear-gradient(135deg, #4f46e5, #7c3aed);
      color: white;
      padding: 25px 30px;
      border-radius: 12px;
      margin-bottom: 25px;
      text-align: center;
    }
    
    .header h1 {
      font-size: 24pt;
      margin-bottom: 8px;
    }
    
    .header .meta {
      font-size: 11pt;
      opacity: 0.9;
    }
    
    .results-box {
      display: flex;
      justify-content: space-around;
      background: #f3f4f6;
      padding: 20px;
      border-radius: 10px;
      margin-bottom: 25px;
    }
    
    .result-item {
      text-align: center;
    }
    
    .result-item .value {
      font-size: 24pt;
      font-weight: 700;
    }
    
    .result-item.correct .value { color: #22c55e; }
    .result-item.incorrect .value { color: #ef4444; }
    .result-item.score .value { color: #4f46e5; }
    
    .question {
      background: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 10px;
      padding: 18px;
      margin-bottom: 18px;
      page-break-inside: avoid;
    }
    
    .question-header {
      display: flex;
      gap: 12px;
      margin-bottom: 12px;
    }
    
    .question-number {
      background: #4f46e5;
      color: white;
      width: 28px;
      height: 28px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 12pt;
      flex-shrink: 0;
    }
    
    .question-text {
      font-weight: 500;
      flex: 1;
    }
    
    .options {
      margin-left: 40px;
      margin-top: 10px;
    }
    
    .option {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 8px 12px;
      margin-bottom: 6px;
      border-radius: 6px;
      background: white;
      border: 1px solid #e5e7eb;
    }
    
    .option.correct {
      background: #dcfce7;
      border-color: #22c55e;
    }
    
    .option.incorrect {
      background: #fee2e2;
      border-color: #ef4444;
    }
    
    .option-letter {
      width: 24px;
      height: 24px;
      border-radius: 50%;
      background: #e5e7eb;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      font-size: 11pt;
    }
    
    .option.correct .option-letter {
      background: #22c55e;
      color: white;
    }
    
    .check { color: #22c55e; margin-left: auto; }
    .cross { color: #ef4444; margin-left: auto; }
    
    .explanation {
      margin-top: 12px;
      padding: 12px;
      background: #eff6ff;
      border-radius: 6px;
      font-size: 10pt;
      color: #1e40af;
    }
    
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
      <h1>${escapeHTML(examName)} Practice Test</h1>
      <div class="meta">
        ${questions.length} Questions • ${escapeHTML(difficulty)} Difficulty${subject ? ` • ${escapeHTML(subject)}` : ''}
      </div>
    </div>
    
    ${results ? `
      <div class="results-box">
        <div class="result-item correct">
          <div class="value">${results.correct}</div>
          <div>Correct</div>
        </div>
        <div class="result-item incorrect">
          <div class="value">${results.incorrect}</div>
          <div>Incorrect</div>
        </div>
        <div class="result-item score">
          <div class="value">${results.score}%</div>
          <div>Score</div>
        </div>
      </div>
    ` : ''}
    
    ${questionsHTML}
    
    <div class="footer">
      Generated by ProCreators Exam Prep Assistant • ${new Date().toLocaleDateString()}
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
      margin: { top: '15mm', right: '15mm', bottom: '15mm', left: '15mm' }
    })
    
    return pdfBuffer
  } finally {
    await browser.close()
  }
}

export async function POST(request) {
  try {
    const body = await request.json()
    const { action } = body
    
    // Search for exam information
    if (action === 'search-exam') {
      const { examName } = body
      
      if (!examName) {
        return NextResponse.json({ success: false, error: 'Exam name required' }, { status: 400 })
      }
      
      const examInfo = await searchExamInfo(examName)
      
      return NextResponse.json({
        success: true,
        examInfo
      })
    }
    
    // Generate practice questions
    if (action === 'generate-questions') {
      const questions = await generateQuestions(body)
      
      return NextResponse.json({
        success: true,
        questions
      })
    }
    
    // Generate PDF
    if (action === 'generate-pdf') {
      const pdfBuffer = await generatePDF(body)
      
      // Save PDF
      const outputDir = path.join(process.cwd(), 'public', 'generated', 'exam-prep')
      await fs.mkdir(outputDir, { recursive: true })
      
      const filename = `exam-prep-${uuidv4()}.pdf`
      const outputPath = path.join(outputDir, filename)
      await fs.writeFile(outputPath, pdfBuffer)
      
      const pdfUrl = `/generated/exam-prep/${filename}`
      
      return NextResponse.json({
        success: true,
        pdfUrl,
        filename
      })
    }
    
    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 })
    
  } catch (error) {
    console.error('Exam prep error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
