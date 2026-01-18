import { NextResponse } from 'next/server'
import { spawn } from 'child_process'
import path from 'path'
import fs from 'fs/promises'
import { v4 as uuidv4 } from 'uuid'

// Official exam website mappings for better search results
const OFFICIAL_EXAM_SOURCES = {
  // Study Abroad
  'ielts': { urls: ['https://www.ielts.org', 'https://takeielts.britishcouncil.org'], authority: 'British Council / IDP' },
  'toefl': { urls: ['https://www.ets.org/toefl'], authority: 'ETS' },
  'gre': { urls: ['https://www.ets.org/gre'], authority: 'ETS' },
  'gmat': { urls: ['https://www.mba.com/exams/gmat-exam'], authority: 'GMAC' },
  'sat': { urls: ['https://collegereadiness.collegeboard.org/sat'], authority: 'College Board' },
  'pte': { urls: ['https://www.pearsonpte.com'], authority: 'Pearson' },
  
  // India Exams
  'upsc-cse': { urls: ['https://www.upsc.gov.in'], authority: 'UPSC India' },
  'upsc-prelims': { urls: ['https://www.upsc.gov.in'], authority: 'UPSC India' },
  'jee-main': { urls: ['https://jeemain.nta.nic.in'], authority: 'NTA India' },
  'jee-advanced': { urls: ['https://jeeadv.ac.in'], authority: 'IIT' },
  'neet': { urls: ['https://neet.nta.nic.in'], authority: 'NTA India' },
  'ssc-cgl': { urls: ['https://ssc.nic.in'], authority: 'SSC India' },
  
  // Bangladesh Exams
  'bcs-bangladesh': { urls: ['https://bpsc.gov.bd'], authority: 'BPSC Bangladesh' },
  
  // Professional
  'cfa': { urls: ['https://www.cfainstitute.org'], authority: 'CFA Institute' },
  'cpa': { urls: ['https://www.aicpa.org'], authority: 'AICPA' },
  'usmle': { urls: ['https://www.usmle.org'], authority: 'NBME/FSMB' },
  
  // Tech
  'aws-saa': { urls: ['https://aws.amazon.com/certification'], authority: 'Amazon Web Services' },
  'azure': { urls: ['https://learn.microsoft.com/certifications'], authority: 'Microsoft' },
  'pmp': { urls: ['https://www.pmi.org/certifications/project-management-pmp'], authority: 'PMI' },
  
  // Google
  'google-data-analytics': { urls: ['https://grow.google/certificates/data-analytics'], authority: 'Google' },
  'google-cybersecurity': { urls: ['https://grow.google/certificates/cybersecurity'], authority: 'Google' },
  'google-project-management': { urls: ['https://grow.google/certificates/project-management'], authority: 'Google' },
  'google-ux-design': { urls: ['https://grow.google/certificates/ux-design'], authority: 'Google' },
  'google-cloud-associate': { urls: ['https://cloud.google.com/certification'], authority: 'Google Cloud' },
}

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

// Web search using DuckDuckGo (no API key required)
async function webSearch(query, numResults = 5) {
  try {
    // Use DuckDuckGo HTML search (no API key needed)
    const searchUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`
    
    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'en-US,en;q=0.9'
      }
    })
    
    if (!response.ok) {
      console.log('DuckDuckGo search failed, status:', response.status)
      return []
    }
    
    const html = await response.text()
    
    // Extract search results from DuckDuckGo HTML
    const results = []
    const resultRegex = /<a[^>]*class="result__a"[^>]*href="([^"]*)"[^>]*>([^<]*)<\/a>/gi
    const snippetRegex = /<a[^>]*class="result__snippet"[^>]*>([^<]*(?:<[^>]*>[^<]*)*)<\/a>/gi
    
    let match
    while ((match = resultRegex.exec(html)) !== null && results.length < numResults) {
      const url = match[1]
      const title = match[2].replace(/<[^>]*>/g, '').trim()
      
      if (url && title && !url.includes('duckduckgo.com')) {
        results.push({ url, title, snippet: '' })
      }
    }
    
    console.log(`Web search for "${query}" found ${results.length} results`)
    return results
  } catch (error) {
    console.error('Web search error:', error.message)
    return []
  }
}

// Scrape content from a URL
async function scrapeUrl(url) {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml'
      },
      signal: AbortSignal.timeout(10000) // 10 second timeout
    })
    
    if (!response.ok) return null
    
    const html = await response.text()
    
    // Extract text content from HTML
    let text = html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
      .replace(/<nav\b[^<]*(?:(?!<\/nav>)<[^<]*)*<\/nav>/gi, '')
      .replace(/<footer\b[^<]*(?:(?!<\/footer>)<[^<]*)*<\/footer>/gi, '')
      .replace(/<header\b[^<]*(?:(?!<\/header>)<[^<]*)*<\/header>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
    
    // Limit content
    return text.substring(0, 5000)
  } catch (error) {
    console.error(`Scrape error for ${url}:`, error.message)
    return null
  }
}

// HYBRID APPROACH: Search web for official exam info, then use LLM to structure it
async function searchExamInfo(examName, examId = null) {
  console.log(`\n=== HYBRID EXAM SEARCH: ${examName} ===`)
  
  let webContent = []
  let officialSources = []
  let searchSources = []
  
  // Step 1: Check if we have known official sources
  const knownSource = examId ? OFFICIAL_EXAM_SOURCES[examId] : null
  
  // Step 2: Try to scrape official sources first
  if (knownSource) {
    console.log(`Found official source config for ${examId}`)
    for (const url of knownSource.urls) {
      try {
        const content = await scrapeUrl(url)
        if (content && content.length > 200) {
          webContent.push(content)
          officialSources.push({ url, authority: knownSource.authority })
          console.log(`✓ Scraped official source: ${url}`)
        }
      } catch (e) {
        console.log(`✗ Failed to scrape ${url}`)
      }
    }
  }
  
  // Step 3: Web search for additional information
  const searchQueries = [
    `${examName} exam pattern syllabus official`,
    `${examName} exam structure questions format 2024 2025`,
    `${examName} exam preparation guide topics`
  ]
  
  for (const query of searchQueries) {
    if (webContent.length >= 3) break // Enough content
    
    const searchResults = await webSearch(query, 3)
    
    for (const result of searchResults) {
      if (webContent.length >= 5) break
      
      // Skip already scraped URLs
      if (officialSources.some(s => result.url.includes(s.url))) continue
      
      try {
        const content = await scrapeUrl(result.url)
        if (content && content.length > 300) {
          webContent.push(content)
          searchSources.push({ url: result.url, title: result.title })
          console.log(`✓ Scraped search result: ${result.url}`)
        }
      } catch (e) {
        // Skip failed scrapes
      }
    }
  }
  
  console.log(`Total web content pieces: ${webContent.length}`)
  
  // Step 4: Use LLM to analyze and structure the information
  const webDataSummary = webContent.length > 0 
    ? `\n\nWEB SEARCH DATA (use this as primary source):\n${webContent.slice(0, 3).join('\n\n---\n\n')}`
    : ''
  
  const prompt = `You are an expert on competitive exams and standardized tests worldwide.

Analyze the following information about the exam: "${examName}"
${webDataSummary}

Based on the web data above (if available) AND your knowledge, provide ACCURATE and UP-TO-DATE information about this exam.

IMPORTANT: 
- Prioritize information from the web data if available
- If web data conflicts with your knowledge, prefer web data (it's more recent)
- Be specific about question patterns, marking schemes, and time limits
- Include the exact number of questions if known

Return your response as JSON:
{
  "examName": "Full official name of the exam",
  "country": "Country/Region where this exam is conducted",
  "authority": "Conducting authority/organization",
  "officialWebsite": "Official website URL if known",
  "pattern": "Detailed exam pattern (e.g., 'Paper 1: 100 MCQs, 2 hours, negative marking -0.33')",
  "sections": "List all sections/subjects covered with question distribution",
  "questionTypes": "Types of questions (MCQ, descriptive, case study, etc.)",
  "duration": "Total exam duration with breakdown if applicable",
  "totalMarks": "Total marks with section-wise breakdown",
  "passingCriteria": "Minimum passing marks or criteria",
  "frequency": "How often the exam is conducted",
  "eligibility": "Basic eligibility criteria",
  "importantTopics": ["List of 8-10 most important topics to focus on"],
  "recentChanges": "Any recent changes to exam pattern (2023-2025)",
  "tips": ["5 specific preparation tips for this exam"],
  "sampleQuestionTypes": ["Examples of question formats used in this exam"]
}

Return ONLY valid JSON.`

  try {
    const response = await runLLM(prompt, 'You are an expert on competitive examinations worldwide. Analyze web data and provide accurate, structured exam information in JSON format only.')
    
    // Parse JSON from response
    let jsonMatch = response.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const examInfo = JSON.parse(jsonMatch[0])
      
      // Add source information
      examInfo.sources = {
        officialSources: officialSources.map(s => ({ url: s.url, authority: s.authority })),
        webSearchSources: searchSources.map(s => ({ url: s.url, title: s.title })),
        dataFreshness: webContent.length > 0 ? 'Web-enhanced (searched official and web sources)' : 'AI knowledge base only',
        searchedAt: new Date().toISOString()
      }
      
      console.log(`=== EXAM INFO READY (${webContent.length} web sources used) ===\n`)
      return examInfo
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
