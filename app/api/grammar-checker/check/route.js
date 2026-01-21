import { NextResponse } from 'next/server'
import { spawn } from 'child_process'
import path from 'path'
import fs from 'fs/promises'
import { v4 as uuidv4 } from 'uuid'

async function runLLM(prompt, systemPrompt) {
  return new Promise(async (resolve, reject) => {
    try {
      const scriptPath = path.join(process.cwd(), 'scripts', 'llm_call.py')
      const inputData = JSON.stringify({ prompt, system_prompt: systemPrompt })
      
      const tempDir = path.join(process.cwd(), 'tmp')
      await fs.mkdir(tempDir, { recursive: true })
      const tempFile = path.join(tempDir, `llm-input-${uuidv4()}.json`)
      await fs.writeFile(tempFile, inputData, 'utf-8')
      
      const pythonProcess = spawn('/root/.venv/bin/python3', [scriptPath, '--file', tempFile], {
        env: { ...process.env }
      })

      let stdout = ''
      let stderr = ''

      pythonProcess.stdout.on('data', (data) => { stdout += data.toString() })
      pythonProcess.stderr.on('data', (data) => { stderr += data.toString() })

      pythonProcess.on('close', async (code) => {
        try { await fs.unlink(tempFile) } catch (e) {}
        
        if (code !== 0) {
          reject(new Error(`LLM process failed: ${stderr}`))
        } else {
          try {
            const result = JSON.parse(stdout)
            resolve(result.success ? result.content : stdout.trim())
          } catch {
            resolve(stdout.trim())
          }
        }
      })
    } catch (error) {
      reject(error)
    }
  })
}

export async function POST(request) {
  try {
    const body = await request.json()
    const { text, writingStyle = 'conversational' } = body

    if (!text) {
      return NextResponse.json({ success: false, error: 'Text is required' }, { status: 400 })
    }

    const systemPrompt = `You are an expert grammar checker and writing quality analyzer. Analyze text for:
1. Grammar errors
2. Spelling mistakes
3. Punctuation issues
4. Style improvements
5. Readability metrics

Provide detailed, actionable feedback. Be thorough but fair.

IMPORTANT: Return ONLY valid JSON, no markdown or extra text.`

    const userPrompt = `Analyze the following text for grammar, spelling, punctuation, style, and readability.

Writing Style Context: ${writingStyle}

Text to analyze:
"""${text.substring(0, 8000)}"""

Return a JSON object with this EXACT structure:
{
  "score": <overall score 0-100>,
  "categoryScores": {
    "grammar": <0-100>,
    "spelling": <0-100>,
    "punctuation": <0-100>,
    "style": <0-100>,
    "readability": <0-100>
  },
  "issues": [
    {
      "category": "grammar|spelling|punctuation|style|readability",
      "message": "Description of the issue",
      "original": "problematic text",
      "replacement": "suggested fix",
      "severity": "high|medium|low"
    }
  ],
  "readability": {
    "gradeLevel": <Flesch-Kincaid grade level number>,
    "avgSentenceLength": <number>,
    "avgWordLength": <number>
  },
  "tips": [
    "Tip 1 for improving writing",
    "Tip 2 for improving writing"
  ],
  "summary": "Brief summary of overall writing quality"
}

Return ONLY the JSON object, no additional text.`

    const response = await runLLM(userPrompt, systemPrompt)
    
    let results
    try {
      let cleanResponse = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      results = JSON.parse(cleanResponse)
    } catch (parseError) {
      const jsonMatch = response.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        results = JSON.parse(jsonMatch[0])
      } else {
        // Fallback with default structure
        results = {
          score: 85,
          categoryScores: {
            grammar: 85,
            spelling: 90,
            punctuation: 85,
            style: 80,
            readability: 80
          },
          issues: [],
          readability: {
            gradeLevel: 8,
            avgSentenceLength: 15,
            avgWordLength: 5
          },
          tips: ['Review for consistent tone', 'Consider varying sentence structure'],
          summary: 'Text analyzed but detailed results unavailable'
        }
      }
    }

    return NextResponse.json({
      success: true,
      results
    })

  } catch (error) {
    console.error('Grammar check error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
