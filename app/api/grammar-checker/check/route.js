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

// Writing style guidelines
const STYLE_GUIDELINES = {
  academic: {
    name: 'Academic',
    rules: [
      'Use formal language and avoid contractions',
      'Write in third person (avoid "I", "you")',
      'Use precise and specific vocabulary',
      'Avoid colloquialisms and slang',
      'Use hedging language appropriately ("may", "might", "suggests")',
      'Cite sources and avoid unsupported claims',
      'Maintain objective tone'
    ]
  },
  business: {
    name: 'Business',
    rules: [
      'Be clear and concise',
      'Use active voice',
      'Avoid jargon unless necessary',
      'Be professional but approachable',
      'Use bullet points for lists',
      'Include clear calls to action',
      'Keep sentences short and direct'
    ]
  },
  casual: {
    name: 'Casual',
    rules: [
      'Conversational tone is acceptable',
      'Contractions are fine',
      'First and second person pronouns are okay',
      'Some informal expressions allowed',
      'Focus on readability and engagement',
      'Avoid overly complex sentences'
    ]
  },
  creative: {
    name: 'Creative',
    rules: [
      'Expressive and varied sentence structure',
      'Use of literary devices encouraged',
      'Emotional and sensory language',
      'Voice and style consistency',
      'Show don\'t tell',
      'Creative word choices welcomed'
    ]
  },
  technical: {
    name: 'Technical',
    rules: [
      'Precise and unambiguous language',
      'Define technical terms on first use',
      'Use consistent terminology',
      'Step-by-step instructions when needed',
      'Include examples for clarity',
      'Avoid unnecessary complexity'
    ]
  },
  journalistic: {
    name: 'Journalistic',
    rules: [
      'Lead with the most important information',
      'Use inverted pyramid structure',
      'Short paragraphs (1-3 sentences)',
      'Active voice preferred',
      'Attribute quotes and facts',
      'Objective and balanced reporting'
    ]
  }
}

// Calculate readability scores
function calculateReadability(text) {
  const words = text.split(/\s+/).filter(w => w)
  const sentences = text.split(/[.!?]+/).filter(s => s.trim())
  const syllables = words.reduce((count, word) => {
    return count + countSyllables(word)
  }, 0)
  
  const wordCount = words.length
  const sentenceCount = Math.max(sentences.length, 1)
  const avgWordsPerSentence = wordCount / sentenceCount
  const avgSyllablesPerWord = syllables / Math.max(wordCount, 1)
  
  // Flesch-Kincaid Grade Level
  const gradeLevel = Math.round(
    0.39 * avgWordsPerSentence + 11.8 * avgSyllablesPerWord - 15.59
  )
  
  // Flesch Reading Ease
  const readingEase = Math.round(
    206.835 - 1.015 * avgWordsPerSentence - 84.6 * avgSyllablesPerWord
  )
  
  return {
    gradeLevel: Math.max(1, Math.min(gradeLevel, 18)),
    readingEase: Math.max(0, Math.min(readingEase, 100)),
    avgWordsPerSentence: Math.round(avgWordsPerSentence * 10) / 10,
    avgSyllablesPerWord: Math.round(avgSyllablesPerWord * 10) / 10,
    wordCount,
    sentenceCount
  }
}

// Count syllables in a word
function countSyllables(word) {
  word = word.toLowerCase().replace(/[^a-z]/g, '')
  if (word.length <= 3) return 1
  
  word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '')
  word = word.replace(/^y/, '')
  
  const matches = word.match(/[aeiouy]{1,2}/g)
  return matches ? matches.length : 1
}

// Analyze grammar and style
async function analyzeText(text, writingStyle) {
  const styleGuide = STYLE_GUIDELINES[writingStyle] || STYLE_GUIDELINES.academic
  const readability = calculateReadability(text)
  
  const prompt = `You are an expert editor and grammar checker. Analyze the following text for grammar, spelling, punctuation, style, and readability issues.

TEXT TO ANALYZE:
"""${text}"""

WRITING STYLE: ${styleGuide.name}
STYLE GUIDELINES:
${styleGuide.rules.map((r, i) => `${i + 1}. ${r}`).join('\n')}

Provide a comprehensive analysis in JSON format:
{
  "score": <overall_score_0_to_100>,
  "categoryScores": {
    "grammar": <score_0_to_100>,
    "spelling": <score_0_to_100>,
    "punctuation": <score_0_to_100>,
    "style": <score_0_to_100>,
    "readability": <score_0_to_100>,
    "tone": <score_0_to_100>
  },
  "issues": [
    {
      "id": "<unique_id>",
      "category": "grammar|spelling|punctuation|style|readability|tone",
      "severity": "error|warning|suggestion|style",
      "message": "Clear explanation of the issue",
      "context": "<the problematic text snippet>",
      "offset": <character_position_in_text>,
      "length": <length_of_problematic_text>,
      "replacement": "<suggested_correction_or_null>"
    }
  ],
  "correctedText": "<full_corrected_version_of_the_text>",
  "tips": [
    "Specific tip for improving writing based on ${styleGuide.name} style",
    "Another helpful suggestion"
  ],
  "summary": "Brief overall assessment of the writing quality"
}

IMPORTANT:
- Find ALL grammar, spelling, and punctuation errors
- Check for style issues based on the ${styleGuide.name} writing style
- Provide specific, actionable suggestions
- Include character offsets for each issue when possible
- The correctedText should fix all identified issues
- Return 3-5 personalized tips for this specific text
- Be thorough but fair in scoring

Return ONLY valid JSON.`

  const systemPrompt = `You are an expert English language editor specializing in ${styleGuide.name} writing. You have extensive experience in grammar, style, and clarity. Analyze text thoroughly and provide constructive, specific feedback. Always return valid JSON.`
  
  const response = await runLLM(prompt, systemPrompt)
  
  // Parse JSON from response
  let jsonMatch = response.match(/\{[\s\S]*\}/)
  if (jsonMatch) {
    const results = JSON.parse(jsonMatch[0])
    
    // Add readability info
    results.readability = readability
    
    // Ensure issues have IDs
    if (results.issues) {
      results.issues = results.issues.map((issue, idx) => ({
        ...issue,
        id: issue.id || `issue-${idx}`
      }))
    }
    
    return results
  }
  
  throw new Error('Failed to parse analysis results')
}

export async function POST(request) {
  try {
    const body = await request.json()
    const { text, writingStyle = 'academic' } = body
    
    if (!text || text.trim().length < 20) {
      return NextResponse.json({ 
        success: false, 
        error: 'Please provide at least 20 characters of text' 
      }, { status: 400 })
    }
    
    console.log(`Grammar check: ${text.length} chars, style: ${writingStyle}`)
    
    const results = await analyzeText(text, writingStyle)
    
    return NextResponse.json({
      success: true,
      results,
      correctedText: results.correctedText
    })
    
  } catch (error) {
    console.error('Grammar checker error:', error)
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 })
  }
}
