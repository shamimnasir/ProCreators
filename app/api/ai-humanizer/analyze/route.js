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
    const { text } = body

    if (!text) {
      return NextResponse.json({ success: false, error: 'Text is required' }, { status: 400 })
    }

    const systemPrompt = `You are an expert at detecting AI-generated content. Analyze text patterns, vocabulary choices, sentence structures, and writing characteristics to determine if content was likely written by AI or a human.

Consider these AI writing indicators:
- Overly formal or consistently neutral tone
- Repetitive sentence structures
- Excessive use of transition words
- Perfect grammar with no colloquialisms
- Lack of personal anecdotes or opinions
- Generic examples without specific details
- Predictable paragraph structures

Human writing indicators:
- Varied sentence lengths and structures
- Colloquial language and contractions
- Personal experiences and opinions
- Minor imperfections that feel natural
- Unique voice and personality
- Specific, detailed examples
- Emotional undertones

IMPORTANT: Return ONLY valid JSON, no markdown or extra text.`

    const userPrompt = `Analyze this text to determine if it was written by AI or a human:

"""${text.substring(0, 5000)}"""

Return a JSON object with this EXACT structure:
{
  "aiProbability": <0-100 percentage that text is AI-generated>,
  "humanProbability": <0-100 percentage that text is human-written>,
  "confidence": <"high"|"medium"|"low">,
  "indicators": {
    "ai": [
      "Indicator 1 suggesting AI writing",
      "Indicator 2 suggesting AI writing"
    ],
    "human": [
      "Indicator 1 suggesting human writing",
      "Indicator 2 suggesting human writing"
    ]
  },
  "analysis": "Brief explanation of the assessment",
  "suggestions": [
    "Suggestion 1 to make text more human-like",
    "Suggestion 2 to make text more human-like"
  ]
}

Return ONLY the JSON object.`

    const response = await runLLM(userPrompt, systemPrompt)
    
    let analysis
    try {
      let cleanResponse = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      analysis = JSON.parse(cleanResponse)
    } catch (parseError) {
      const jsonMatch = response.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[0])
      } else {
        // Fallback
        analysis = {
          aiProbability: 50,
          humanProbability: 50,
          confidence: 'low',
          indicators: {
            ai: ['Unable to fully analyze'],
            human: ['Some natural elements detected']
          },
          analysis: 'Analysis completed with limited confidence',
          suggestions: ['Consider adding personal anecdotes', 'Vary sentence structures']
        }
      }
    }

    return NextResponse.json({
      success: true,
      analysis
    })

  } catch (error) {
    console.error('AI detection error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
