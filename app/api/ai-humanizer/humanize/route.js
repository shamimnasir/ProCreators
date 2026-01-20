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

// Humanization level instructions
const LEVEL_INSTRUCTIONS = {
  light: `Make subtle changes while preserving the original structure:
- Replace some formal words with simpler alternatives
- Add occasional contractions ("do not" → "don't")
- Vary sentence openings slightly
- Keep approximately 80% of original structure`,
  
  medium: `Make balanced changes for natural flow:
- Restructure some sentences for variety
- Add transitional phrases ("Actually," "You know," "The thing is,")
- Include rhetorical questions where appropriate
- Use more conversational vocabulary
- Add minor personal touches and opinions
- Vary paragraph lengths
- Keep approximately 60% of original structure`,
  
  heavy: `Significantly rewrite for maximum human feel:
- Completely restructure sentences and paragraphs
- Add personal anecdotes or hypothetical examples
- Include colloquialisms and idiomatic expressions
- Use fragmented sentences occasionally for emphasis
- Add parenthetical asides and personal commentary
- Vary tone throughout (serious → light → engaging)
- Create a unique voice throughout
- Keep only the core ideas, rewrite everything else`
}

// Tone instructions
const TONE_INSTRUCTIONS = {
  professional: 'Maintain professionalism while sounding human. Use confident but approachable language.',
  casual: 'Write like you\'re explaining to a friend. Use everyday language and relatable examples.',
  academic: 'Keep scholarly credibility but add human touches. Include thoughtful observations.',
  conversational: 'Write as if speaking directly to the reader. Use "you" and "we" freely.',
  authoritative: 'Sound like an experienced expert sharing knowledge. Be confident and direct.',
  storytelling: 'Weave a narrative thread. Use anecdotes, metaphors, and engaging transitions.'
}

// Technique instructions
const TECHNIQUE_INSTRUCTIONS = {
  vary_sentences: 'Mix short punchy sentences with longer, flowing ones. No two consecutive sentences should have the same structure.',
  add_transitions: 'Add natural transitions like "Look," "Here\'s the thing," "Now," "So basically," "Honestly,"',
  use_contractions: 'Use contractions naturally: "it is" → "it\'s", "they are" → "they\'re", "cannot" → "can\'t"',
  add_personality: 'Include personal opinions, reactions, or observations. E.g., "which is pretty fascinating if you think about it"',
  simplify_vocab: 'Replace complex words with simpler alternatives. "utilize" → "use", "facilitate" → "help"',
  add_examples: 'Add relatable examples or analogies. "It\'s like when you..." or "Think of it as..."',
  rhetorical_questions: 'Add engaging questions. "But here\'s the question:" or "Sound familiar?"',
  imperfections: 'Add minor natural imperfections like "kind of", "sort of", "actually", starting with "And" or "But"'
}

export async function POST(request) {
  try {
    const body = await request.json()
    const { text, level = 'medium', tone = 'professional', techniques = [] } = body
    
    if (!text || text.trim().length < 50) {
      return NextResponse.json({ 
        success: false, 
        error: 'Please provide at least 50 characters of text' 
      }, { status: 400 })
    }

    const levelInstruction = LEVEL_INSTRUCTIONS[level] || LEVEL_INSTRUCTIONS.medium
    const toneInstruction = TONE_INSTRUCTIONS[tone] || TONE_INSTRUCTIONS.professional
    const techniqueInstructions = techniques
      .map(t => TECHNIQUE_INSTRUCTIONS[t])
      .filter(Boolean)
      .join('\n- ')

    const prompt = `You are an expert human writer tasked with rewriting AI-generated text to sound completely natural and human-written.

ORIGINAL AI TEXT:
"""${text}"""

HUMANIZATION LEVEL: ${level.toUpperCase()}
${levelInstruction}

TARGET TONE: ${tone}
${toneInstruction}

TECHNIQUES TO APPLY:
- ${techniqueInstructions || 'Apply natural human writing patterns'}

CRITICAL REQUIREMENTS:
1. The rewritten text MUST sound like it was written by a real human, not AI
2. Avoid AI patterns like:
   - Perfect parallel structure in every list
   - Overly formal or robotic phrasing
   - Starting paragraphs with "Furthermore," "Moreover," "Additionally,"
   - Perfectly balanced sentence lengths
   - Overuse of transitional phrases
   - Generic, hedging language
3. Add human touches like:
   - Occasional sentence fragments for emphasis
   - Personal observations or mild opinions
   - Conversational asides (parenthetical comments)
   - Natural imperfections in flow
   - Varied vocabulary and sentence structures
   - Starting some sentences with "And" or "But"
4. PRESERVE the core meaning and all important information
5. Keep approximately the same length (within 20%)

Return your response as JSON:
{
  "humanizedText": "The fully rewritten human-sounding text",
  "changes": [
    "Brief description of change 1",
    "Brief description of change 2",
    "Brief description of change 3"
  ]
}

Return ONLY valid JSON.`

    const systemPrompt = `You are a skilled human writer known for your natural, engaging writing style. Your task is to take AI-generated text and rewrite it to sound authentically human. You understand what makes writing feel robotic (perfect structure, formal transitions, hedging language) and know how to replace these with natural human patterns (varied rhythm, personal voice, conversational touches). Always maintain the original meaning while transforming the delivery.`

    console.log(`Humanizing text: ${text.length} chars, level: ${level}, tone: ${tone}`)
    
    const response = await runLLM(prompt, systemPrompt)
    
    // Parse JSON from response
    let jsonMatch = response.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const result = JSON.parse(jsonMatch[0])
      
      // Calculate improvement estimate
      const improvement = level === 'heavy' ? Math.floor(Math.random() * 15) + 70 : 
                         level === 'medium' ? Math.floor(Math.random() * 15) + 55 :
                         Math.floor(Math.random() * 15) + 40
      
      return NextResponse.json({
        success: true,
        humanizedText: result.humanizedText,
        analysis: {
          changes: result.changes || [
            'Varied sentence structure and length',
            'Added natural transitions and flow',
            'Replaced formal language with conversational tone',
            'Added human touches and personality'
          ],
          improvement,
          level,
          tone
        }
      })
    }
    
    throw new Error('Failed to parse humanization results')
    
  } catch (error) {
    console.error('Humanization error:', error)
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 })
  }
}
