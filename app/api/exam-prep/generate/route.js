import { NextResponse } from 'next/server'
import { spawn } from 'child_process'
import path from 'path'
import fs from 'fs/promises'
import { v4 as uuidv4 } from 'uuid'
import { enforceRateLimit } from '@/lib/rate-limiter'
import { saveToLibraryDirect } from '@/lib/library-save-server'
import { getUserIdFromRequest, checkCredits, deductCredits, completeTransaction, refundCredits } from '@/lib/credits'
import { getChromePath } from '@/lib/html-pdf-generator'

const TOOL_ID = 'exam-prep'

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

// Helper function to delay execution
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms))

// Web search using DuckDuckGo (free, no API key required)
// Falls back gracefully if rate-limited - official source scraping still works
async function webSearch(query, numResults = 5, retryCount = 0) {
  try {
    // Add small delay between searches to avoid rate limiting
    if (retryCount > 0) {
      await delay(1000 * retryCount) // Exponential backoff
    }
    
    // Use DuckDuckGo Lite (lighter, less likely to be blocked)
    const searchUrl = `https://lite.duckduckgo.com/lite/?q=${encodeURIComponent(query)}`
    
    // Rotate user agents to reduce blocking
    const userAgents = [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:122.0) Gecko/20100101 Firefox/122.0',
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36'
    ]
    const randomUA = userAgents[Math.floor(Math.random() * userAgents.length)]
    
    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent': randomUA,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate',
        'Connection': 'keep-alive',
        'Cache-Control': 'no-cache'
      },
      signal: AbortSignal.timeout(8000)
    })
    
    if (!response.ok) {
      if (retryCount < 2) {
        return webSearch(query, numResults, retryCount + 1)
      }
      return []
    }
    
    const html = await response.text()
    
    // Extract search results from DuckDuckGo Lite HTML
    const results = []
    
    // DuckDuckGo Lite uses different HTML structure
    // Look for links in the results table
    const linkRegex = /<a[^>]*rel="nofollow"[^>]*href="([^"]+)"[^>]*>([^<]+)<\/a>/gi
    const altLinkRegex = /<a[^>]*class="result-link"[^>]*href="([^"]+)"[^>]*>([^<]*)<\/a>/gi
    const resultARegex = /<a[^>]*class="result__a"[^>]*href="([^"]*)"[^>]*>([^<]*)<\/a>/gi
    
    // Try multiple patterns
    for (const regex of [linkRegex, altLinkRegex, resultARegex]) {
      let match
      regex.lastIndex = 0 // Reset regex state
      while ((match = regex.exec(html)) !== null && results.length < numResults) {
        let url = match[1]
        const title = match[2].replace(/<[^>]*>/g, '').trim()
        
        // Decode URL if needed (DuckDuckGo sometimes wraps URLs)
        if (url.includes('uddg=')) {
          const uddgMatch = url.match(/uddg=([^&]+)/)
          if (uddgMatch) {
            url = decodeURIComponent(uddgMatch[1])
          }
        }
        
        // Filter out DuckDuckGo internal links and duplicates
        if (url && title && 
            !url.includes('duckduckgo.com') && 
            !url.includes('duck.co') &&
            url.startsWith('http') &&
            !results.some(r => r.url === url)) {
          results.push({ url, title, snippet: '' })
        }
      }
      if (results.length >= numResults) break
    }
    
    return results
  } catch (error) {
    if (error.name === 'AbortError') {
      } else {
      console.error('Web search error:', error.message)
    }
    // Graceful degradation - official sources still work
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
    // Refund credits on error
    if (transactionId && userId) {
      await refundCredits(userId, transactionId, error.message)
    }
    console.error(`Scrape error for ${url}:`, error.message)
    return null
  }
}

// HYBRID APPROACH: Search web for official exam info, then use LLM to structure it
async function searchExamInfo(examName, examId = null) {
  let webContent = []
  let officialSources = []
  let searchSources = []
  
  // Step 1: Check if we have known official sources
  const knownSource = examId ? OFFICIAL_EXAM_SOURCES[examId] : null
  
  // Step 2: Try to scrape official sources first
  if (knownSource) {
    for (const url of knownSource.urls) {
      try {
        const content = await scrapeUrl(url)
        if (content && content.length > 200) {
          webContent.push(content)
          officialSources.push({ url, authority: knownSource.authority })
          }
      } catch (e) {
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
          }
      } catch (e) {
        // Skip failed scrapes
      }
    }
  }
  
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
      
      // Normalize all fields to be strings (not objects or arrays for display fields)
      const normalizeField = (field) => {
        if (field === null || field === undefined) return null
        if (typeof field === 'string') return field
        if (Array.isArray(field)) return field.join(', ')
        if (typeof field === 'object') {
          // Convert object to readable string
          return Object.entries(field).map(([k, v]) => `${k}: ${v}`).join('; ')
        }
        return String(field)
      }
      
      // Normalize display fields
      examInfo.pattern = normalizeField(examInfo.pattern)
      examInfo.sections = normalizeField(examInfo.sections)
      examInfo.questionTypes = normalizeField(examInfo.questionTypes)
      examInfo.duration = normalizeField(examInfo.duration)
      examInfo.totalMarks = normalizeField(examInfo.totalMarks)
      examInfo.passingCriteria = normalizeField(examInfo.passingCriteria)
      examInfo.frequency = normalizeField(examInfo.frequency)
      examInfo.eligibility = normalizeField(examInfo.eligibility)
      examInfo.recentChanges = normalizeField(examInfo.recentChanges)
      
      // Keep arrays as arrays for these fields
      if (examInfo.importantTopics && !Array.isArray(examInfo.importantTopics)) {
        examInfo.importantTopics = [examInfo.importantTopics]
      }
      if (examInfo.tips && !Array.isArray(examInfo.tips)) {
        examInfo.tips = [examInfo.tips]
      }
      if (examInfo.sampleQuestionTypes && !Array.isArray(examInfo.sampleQuestionTypes)) {
        examInfo.sampleQuestionTypes = [examInfo.sampleQuestionTypes]
      }
      
      // Add source information
      examInfo.sources = {
        officialSources: officialSources.map(s => ({ url: s.url, authority: s.authority })),
        webSearchSources: searchSources.map(s => ({ url: s.url, title: s.title })),
        dataFreshness: webContent.length > 0 ? 'Web-enhanced (searched official and web sources)' : 'AI knowledge base only',
        searchedAt: new Date().toISOString()
      }
      
      return examInfo
    }
    return null
  } catch (error) {
    // Refund credits on error
    if (transactionId && userId) {
      await refundCredits(userId, transactionId, error.message)
    }
    console.error('Exam search error:', error)
    return null
  }
}

// Generate practice questions with enhanced context
async function generateQuestions(config) {
  const { examName, examInfo, practiceMode, difficulty, subject, questionCount, includeExplanations } = config
  
  const difficultyInstructions = {
    easy: 'Basic level questions testing fundamental concepts. These should be straightforward recall or simple application questions.',
    medium: 'Intermediate level questions requiring good understanding. Include some analysis and application of concepts.',
    hard: 'Advanced level questions that test deep knowledge, critical thinking, and analytical skills. Include complex scenarios.',
    mixed: 'Mix of easy (30%), medium (50%), and hard (20%) questions for balanced practice.'
  }
  
  // Build comprehensive exam context from web-enhanced info
  let examContext = ''
  let sourceInfo = ''
  
  if (examInfo) {
    examContext = `
=== EXAM DETAILS (from official sources and web search) ===
- Full Name: ${examInfo.examName || examName}
- Conducting Authority: ${examInfo.authority || 'Not specified'}
- Country/Region: ${examInfo.country || 'Global'}
- Exam Pattern: ${examInfo.pattern || 'Standard competitive exam format'}
- Sections/Subjects: ${examInfo.sections || 'General subjects'}
- Question Types: ${examInfo.questionTypes || 'Multiple Choice Questions'}
- Duration: ${examInfo.duration || 'Standard duration'}
- Total Marks: ${examInfo.totalMarks || 'As per standard format'}
- Recent Changes: ${examInfo.recentChanges || 'No major recent changes'}
- Important Topics: ${examInfo.importantTopics?.join(', ') || 'Various topics'}
- Sample Question Formats: ${examInfo.sampleQuestionTypes?.join(', ') || 'MCQ format'}
`
    
    // Add source attribution
    if (examInfo.sources) {
      const officialCount = examInfo.sources.officialSources?.length || 0
      const webCount = examInfo.sources.webSearchSources?.length || 0
      sourceInfo = `\n[Data sourced from ${officialCount} official sources and ${webCount} web sources]`
    }
  }
  
  const prompt = `You are an expert question paper setter for "${examName}".

${examContext}

TASK: Generate ${questionCount} HIGH-QUALITY practice questions that EXACTLY match the exam pattern and style.

CONFIGURATION:
- Difficulty Level: ${difficulty} - ${difficultyInstructions[difficulty]}
- Subject/Topic Focus: ${subject || 'Mixed subjects covering all major areas'}
- Include Detailed Explanations: ${includeExplanations ? 'YES - provide thorough explanations with concepts' : 'Brief explanations only'}

CRITICAL REQUIREMENTS:
1. Questions MUST match the actual exam pattern (${examInfo?.pattern || 'standard MCQ format'})
2. Cover topics from: ${examInfo?.importantTopics?.slice(0, 5).join(', ') || 'the official syllabus'}
3. Use the EXACT question style used in this exam
4. For ${examName}, ensure questions reflect the ${examInfo?.authority || 'official'} examination standards
5. Include current affairs (2024-2025) for relevant exams
6. Make distractors (wrong options) plausible but clearly incorrect
7. Each explanation should teach the underlying concept

Generate questions in this EXACT JSON format:
{
  "questions": [
    {
      "number": 1,
      "type": "multiple-choice",
      "question": "Clear, well-formatted question text",
      "options": ["A) First option", "B) Second option", "C) Third option", "D) Fourth option"],
      "correctAnswer": "A",
      "explanation": "Detailed explanation of why A is correct and why other options are wrong",
      "difficulty": "easy",
      "topic": "Specific topic category",
      "source": "Based on ${examInfo?.authority || 'official'} exam pattern"
    }
  ]
}

QUESTION TYPE GUIDELINES:
- For IELTS/TOEFL: Include reading passages, sentence completion, vocabulary in context
- For BCS/UPSC: Include current affairs, constitutional knowledge, general science, reasoning
- For JEE/NEET: Include numerical problems with calculations
- For CFA/CA: Include case-based scenarios
- For Google Certs: Include practical scenario-based questions

Return ONLY valid JSON with ${questionCount} questions.`

  try {
    const systemPrompt = `You are an expert question paper setter specializing in ${examName}. 
You have deep knowledge of the exam pattern from ${examInfo?.authority || 'the official examining body'}.
Generate questions that are indistinguishable from actual exam questions.
Always return valid JSON only.`
    
    const response = await runLLM(prompt, systemPrompt)
    
    // Parse JSON from response
    let jsonStr = response
    const jsonMatch = response.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      jsonStr = jsonMatch[0]
    }
    
    const data = JSON.parse(jsonStr)
    return data.questions || []
  } catch (error) {
    // Refund credits on error
    if (transactionId && userId) {
      await refundCredits(userId, transactionId, error.message)
    }
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
    executablePath: getChromePath(),
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
  let transactionId = null
  let userId = null
  
  try {
    // SECURITY: Get user ID and check credits
    userId = await getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json({
        success: false,
        error: 'Authentication required. Please log in to use this tool.'
      }, { status: 401 })
    }
    
    const creditCheck = await checkCredits(userId, TOOL_ID)
    if (!creditCheck.hasEnough) {
      return NextResponse.json({
        success: false,
        error: `Insufficient credits. This tool costs ${creditCheck.cost} credits, but you have ${creditCheck.currentBalance}.`,
        creditInfo: creditCheck
      }, { status: 402 })
    }
    
    // Deduct credits before generation
    const deductResult = await deductCredits(userId, TOOL_ID)
    if (!deductResult.success) {
      return NextResponse.json({
        success: false,
        error: 'Failed to process credits. Please try again.'
      }, { status: 500 })
    }
    transactionId = deductResult.transactionId

    // SECURITY: Rate limiting for content generation
    const rateLimitCheck = await enforceRateLimit(request, 'content_generate')
    if (rateLimitCheck.limited) {
      return rateLimitCheck.response
    }

    const body = await request.json()
    const { action } = body
    
    // Search for exam information (HYBRID APPROACH)
    if (action === 'search-exam') {
      const { examName, examId } = body
      
      if (!examName) {
        return NextResponse.json({ success: false, error: 'Exam name required' }, { status: 400 })
      }
      
      // Use hybrid approach: web search + LLM
      const examInfo = await searchExamInfo(examName, examId)
      
      // Complete transaction on success

      
      if (transactionId) await completeTransaction(transactionId)

      
      return NextResponse.json({
        success: true,
        examInfo,
        searchMethod: 'hybrid', // Indicates we used web + AI
        message: examInfo?.sources?.officialSources?.length > 0 
          ? `Found information from ${examInfo.sources.officialSources.length} official sources`
          : 'Generated from AI knowledge base with web search enhancement'
      })
    }
    
    // Generate practice questions
    if (action === 'generate-questions') {
      const questions = await generateQuestions(body)
      
      // Complete transaction on success

      
      if (transactionId) await completeTransaction(transactionId)

      
      return NextResponse.json({
        success: true,
        questions,
        disclaimer: 'These questions are AI-generated for practice purposes based on official exam patterns. They may not represent actual exam questions.'
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
      
      // Save to library (direct database save)
      try {
        await saveToLibraryDirect(userId, {
          type: 'exam-prep',
          category: 'document',
          title: `${body.examName || 'Exam'} Practice Test`,
          content: pdfUrl,
          filePath: pdfUrl,
          description: `${body.questions?.length || 0} questions - ${body.difficulty || 'Mixed'} difficulty`,
          metadata: {
            examName: body.examName,
            questionCount: body.questions?.length,
            difficulty: body.difficulty,
            subject: body.subject,
            pdfUrl
          }
        })
      } catch (e) {
        console.error('Failed to save to library:', e)
      }
      
      // Complete transaction on success

      
      if (transactionId) await completeTransaction(transactionId)

      
      return NextResponse.json({
        success: true,
        pdfUrl,
        filename
      })
    }
    
    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 })
    
  } catch (error) {
    // Refund credits on error
    if (transactionId && userId) {
      await refundCredits(userId, transactionId, error.message)
    }
    console.error('Exam prep error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
