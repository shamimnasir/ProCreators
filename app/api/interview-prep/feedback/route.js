import { NextResponse } from 'next/server'
import { spawn } from 'child_process'
import path from 'path'
import fs from 'fs/promises'
import { v4 as uuidv4 } from 'uuid'

// Helper to run LLM
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
        try { await fs.unlink(tempFile) } catch (e) { /* ignore */ }
        
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
    const { question, answer, jobTitle, category } = body

    if (!question || !answer) {
      return NextResponse.json({ 
        success: false, 
        error: 'Please provide both the question and your answer' 
      }, { status: 400 })
    }

    const systemPrompt = `You are an expert interview coach providing constructive feedback on interview answers.

Evaluate the answer based on:
1. STAR Method (for behavioral questions): Does it include Situation, Task, Action, Result?
2. Relevance: Does it answer the question directly?
3. Specificity: Are there concrete examples and metrics?
4. Length: Is it appropriate (2-3 minutes spoken)?
5. Impact: Does it showcase skills and achievements?
6. Professionalism: Is the tone appropriate?

OUTPUT FORMAT - Return ONLY valid JSON:
{
  "overallScore": 75,
  "scoreBreakdown": {
    "relevance": 80,
    "structure": 70,
    "specificity": 75,
    "impact": 80,
    "delivery": 70
  },
  "strengths": [
    "What the candidate did well"
  ],
  "improvements": [
    {
      "issue": "What needs improvement",
      "suggestion": "How to improve it",
      "priority": "High|Medium|Low"
    }
  ],
  "starAnalysis": {
    "situation": { "present": true, "feedback": "Feedback on situation description" },
    "task": { "present": true, "feedback": "Feedback on task description" },
    "action": { "present": true, "feedback": "Feedback on actions taken" },
    "result": { "present": false, "feedback": "Missing quantifiable results" }
  },
  "improvedAnswer": "A rewritten, improved version of the answer",
  "keyTakeaways": [
    "Key point to remember for next time"
  ]
}

Be constructive and encouraging while being honest about areas for improvement.
Return ONLY valid JSON.`

    const userPrompt = `Evaluate this interview answer:

## CONTEXT
Job Title: ${jobTitle || 'Not specified'}
Question Category: ${category || 'General'}

## QUESTION
${question}

## CANDIDATE'S ANSWER
${answer}

Provide detailed, constructive feedback to help the candidate improve.
Return ONLY the JSON object.`

    const response = await runLLM(userPrompt, systemPrompt)
    
    let feedbackData
    try {
      let cleanResponse = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      feedbackData = JSON.parse(cleanResponse)
    } catch (parseError) {
      const jsonMatch = response.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        feedbackData = JSON.parse(jsonMatch[0])
      } else {
        throw new Error('Failed to generate feedback')
      }
    }

    return NextResponse.json({
      success: true,
      data: feedbackData
    })

  } catch (error) {
    console.error('Feedback generation error:', error)
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Failed to generate feedback' 
    }, { status: 500 })
  }
}
