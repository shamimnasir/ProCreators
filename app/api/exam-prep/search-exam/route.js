import { NextResponse } from 'next/server'
import { spawn } from 'child_process'
import path from 'path'
import fs from 'fs/promises'
import { v4 as uuidv4 } from 'uuid'

// Helper to run LLM with web search context
async function runLLM(prompt, systemPrompt) {
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
        try { await fs.unlink(tempFile) } catch (e) {}
        reject(err)
      })
    } catch (error) {
      reject(error)
    }
  })
}

export async function POST(request) {
  try {
    const { examName } = await request.json()
    
    if (!examName) {
      return NextResponse.json({ success: false, error: 'Exam name required' }, { status: 400 })
    }
    
    // Use LLM with grounded knowledge about exams
    const prompt = `You are a comprehensive exam information database. Provide detailed, accurate information about the exam: "${examName}"

Search your knowledge for:
1. The official exam pattern and structure
2. Number and types of questions
3. Subjects/sections covered
4. Time duration
5. Marking scheme (including negative marking if any)
6. Important topics frequently asked
7. Recent changes or updates to the exam pattern
8. Tips for preparation

Provide the information in this JSON format:
{
  "found": true,
  "examName": "Official exam name",
  "shortName": "Common abbreviation",
  "country": "Country where conducted",
  "conductedBy": "Conducting authority",
  "pattern": "Brief pattern description",
  "sections": "Sections/subjects covered",
  "questionTypes": "MCQ, Descriptive, etc.",
  "totalQuestions": "Number of questions",
  "duration": "Time limit",
  "totalMarks": "Maximum marks",
  "negativeMarking": "Yes/No and scheme",
  "passingMarks": "Cutoff or passing criteria",
  "frequency": "Annual, Semi-annual, etc.",
  "eligibility": "Basic eligibility",
  "importantTopics": ["Topic 1", "Topic 2", "Topic 3"],
  "preparationTips": ["Tip 1", "Tip 2", "Tip 3"],
  "officialWebsite": "URL if known",
  "lastUpdated": "When pattern was last changed"
}

If this is a less common exam, provide your best estimate of the pattern based on similar exams in that category.

Return ONLY valid JSON.`

    const response = await runLLM(prompt, `You are an expert on competitive examinations, standardized tests, and certification exams worldwide. You have extensive knowledge about:
- Board exams (SSC, HSC, CBSE, ICSE, State Boards)
- Civil service exams (BCS Bangladesh, UPSC India, etc.)
- Language tests (IELTS, TOEFL, GRE, GMAT)
- Professional certifications (AWS, PMP, CFA, etc.)
- Medical and Engineering entrance exams
- Banking and government job exams

Provide accurate, detailed, and up-to-date information.`)
    
    // Parse JSON from response
    let examInfo = null
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        examInfo = JSON.parse(jsonMatch[0])
      }
    } catch (e) {
      console.error('Failed to parse exam info:', e)
    }
    
    return NextResponse.json({
      success: true,
      examInfo,
      examName
    })
    
  } catch (error) {
    console.error('Exam search error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
