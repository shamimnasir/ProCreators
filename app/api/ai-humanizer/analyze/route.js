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

    const systemPrompt = `You are a fair and balanced AI content detector. Your job is to determine if content was written by AI or a human.

IMPORTANT CALIBRATION:
- Well-edited human content can appear polished - don't penalize good writing
- Human bloggers often write in a professional, structured manner
- The presence of personal opinions, humor, contractions, and varied sentences strongly indicates human writing
- If content has been rewritten or edited, it may show mixed signals - lean toward human in uncertain cases

AI writing indicators (require MULTIPLE to flag as AI):
- Unnaturally consistent paragraph lengths
- Every sentence has similar structure
- Overuse of transition words like "Furthermore", "Moreover", "Additionally"
- Complete absence of personal voice or opinions
- No contractions used at all
- Generic examples without specific details
- Robotic, encyclopedic tone throughout

Human writing indicators (ANY of these suggest human):
- Personal opinions or commentary ("I think", "In my experience")
- Humor, sarcasm, or wit
- Colloquial language or slang
- Varied sentence lengths (very short mixed with long)
- Contractions (don't, won't, it's, I've)
- Sentence fragments for emphasis
- Rhetorical questions
- Specific examples with names, numbers, or details
- Emotional language or enthusiasm
- Informal transitions ("Here's the thing", "So basically")

SCORING GUIDANCE:
- 0-30% AI: Clearly human-written with personality
- 30-50% AI: Likely human with some formal sections  
- 50-70% AI: Mixed signals, could be either
- 70-100% AI: Clearly AI-generated with robotic patterns

Be FAIR - if you see genuine human elements, weight them heavily.

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
