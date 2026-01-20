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
        try { await fs.unlink(tempFile) } catch (e) {}
        
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
        reject(new Error(`Failed to start LLM process: ${err.message}`))
      })
    } catch (error) {
      reject(error)
    }
  })
}

// Analyze text for AI patterns
export async function POST(request) {
  try {
    const body = await request.json()
    const { text } = body
    
    if (!text || text.trim().length < 20) {
      return NextResponse.json({ 
        success: false, 
        error: 'Please provide at least 20 characters of text' 
      }, { status: 400 })
    }

    const prompt = `Analyze the following text and estimate the probability that it was written by AI.

TEXT TO ANALYZE:
"""${text}"""

Look for these AI patterns:
1. Perfect parallel structure and balanced sentences
2. Overuse of transitional words (Furthermore, Moreover, Additionally, In conclusion)
3. Formal, hedging language ("It is important to note that...")
4. Lack of personal voice or opinions
5. Generic, non-specific examples
6. Perfectly organized structure (intro → body → conclusion)
7. Repetitive sentence patterns
8. Overly polished, error-free writing
9. Use of phrases like "In today's world," "It's worth noting," "This comprehensive guide"
10. Lack of contractions and casual language

Return your analysis as JSON:
{
  "aiProbability": <number_0_to_100>,
  "confidence": "high|medium|low",
  "patterns": [
    "Pattern detected 1",
    "Pattern detected 2"
  ],
  "humanIndicators": [
    "Human-like element found 1"
  ],
  "verdict": "Likely AI|Possibly AI|Likely Human|Definitely Human"
}

Return ONLY valid JSON.`

    const systemPrompt = `You are an expert AI content detector. You can identify patterns that distinguish AI-generated text from human-written content. Analyze text objectively and provide probability estimates based on linguistic patterns, not content quality.`

    const response = await runLLM(prompt, systemPrompt)
    
    // Parse JSON from response
    let jsonMatch = response.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const analysis = JSON.parse(jsonMatch[0])
      return NextResponse.json({
        success: true,
        analysis
      })
    }
    
    // Fallback estimation based on simple heuristics
    const text_lower = text.toLowerCase()
    let score = 50
    
    // AI indicators
    if (text_lower.includes('furthermore')) score += 10
    if (text_lower.includes('moreover')) score += 10
    if (text_lower.includes('additionally')) score += 8
    if (text_lower.includes('in conclusion')) score += 8
    if (text_lower.includes('it is important to note')) score += 12
    if (text_lower.includes('in today\'s world')) score += 10
    if (text_lower.includes('comprehensive guide')) score += 8
    if (!text.includes("'")) score += 5 // no contractions
    
    // Human indicators
    if (text.includes("I think") || text.includes("I believe")) score -= 15
    if (text.includes("!")) score -= 5
    if (text.includes("?")) score -= 3
    if (text_lower.includes("honestly")) score -= 10
    if (text_lower.includes("actually")) score -= 8
    if (text_lower.includes("kind of") || text_lower.includes("sort of")) score -= 10
    
    score = Math.max(5, Math.min(98, score))
    
    return NextResponse.json({
      success: true,
      analysis: {
        aiProbability: score,
        confidence: 'medium',
        patterns: [],
        verdict: score > 70 ? 'Likely AI' : score > 40 ? 'Possibly AI' : 'Likely Human'
      }
    })
    
  } catch (error) {
    console.error('Analysis error:', error)
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 })
  }
}
