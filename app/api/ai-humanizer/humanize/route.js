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

const HUMANIZATION_INSTRUCTIONS = {
  light: `Apply LIGHT humanization:
- Make subtle word replacements (use everyday alternatives)
- Add natural transitions between ideas
- Use contractions where appropriate (don't, won't, it's)
- Keep the original structure mostly intact
- Preserve all factual information`,
  
  medium: `Apply MEDIUM humanization:
- Vary sentence lengths significantly (mix short punchy sentences with longer ones)
- Add personal touches and asides (e.g., "Here's the thing...", "Trust me on this...")
- Include rhetorical questions to engage readers
- Use more colloquial vocabulary
- Add specific examples or analogies
- Break up long paragraphs
- Maintain core message but make it conversational`,
  
  heavy: `Apply HEAVY humanization:
- Completely restructure the content while preserving meaning
- Write as if explaining to a friend
- Add personal opinions and commentary
- Use humor or wit where appropriate
- Include real-world examples and scenarios
- Create a unique voice throughout
- Add emotional undertones
- Use fragments and informal punctuation when it feels natural
- Make it impossible to detect as AI-written`
}

const TECHNIQUE_PROMPTS = {
  vary_sentences: 'Mix very short sentences (3-5 words) with longer, complex ones. Create rhythm.',
  add_transitions: "Use natural connectors like 'Here's the thing', 'Look', 'So basically', 'The reality is'.",
  use_contractions: "Always use contractions: don't, won't, it's, you're, we're, etc.",
  add_personality: 'Add personal opinions, asides, and commentary. Show your perspective.',
  simplify_vocab: 'Replace fancy words with simple, everyday alternatives.',
  add_examples: 'Include relatable, specific real-world examples and analogies.',
  rhetorical_questions: 'Add questions that make readers think: "Ever wondered...?", "Sound familiar?"'
}

export async function POST(request) {
  try {
    const body = await request.json()
    const { text, level = 'medium', tone = 'conversational', techniques = [] } = body

    if (!text) {
      return NextResponse.json({ success: false, error: 'Text is required' }, { status: 400 })
    }

    // Build technique instructions
    let techniqueInstructions = ''
    if (techniques.length > 0) {
      techniqueInstructions = '\n\nSPECIFIC TECHNIQUES TO APPLY:\n'
      techniques.forEach(tech => {
        if (TECHNIQUE_PROMPTS[tech]) {
          techniqueInstructions += `- ${TECHNIQUE_PROMPTS[tech]}\n`
        }
      })
    }

    const systemPrompt = `You are an expert content editor who specializes in making AI-generated text sound naturally human. Your rewrites should pass AI detection tools while maintaining the original meaning and quality.

Your goal: Transform robotic, AI-sounding text into engaging, human-written content.

${HUMANIZATION_INSTRUCTIONS[level] || HUMANIZATION_INSTRUCTIONS.medium}
${techniqueInstructions}

Tone for this rewrite: ${tone}

CRITICAL RULES:
1. PRESERVE all factual information and key points
2. MAINTAIN the same general structure (headings, sections)
3. KEEP the same approximate length
4. DO NOT add false information
5. Return ONLY the rewritten text, no explanations or metadata`

    const userPrompt = `Rewrite this text to sound naturally human-written. Apply ${level} humanization with a ${tone} tone.

Original text:
"""${text}"""

Rewrite the text now. Return ONLY the humanized text, nothing else.`

    const response = await runLLM(userPrompt, systemPrompt)
    
    // Clean up response - remove any markdown code blocks or extra formatting
    let humanizedText = response
      .replace(/```[a-z]*\n?/g, '')
      .replace(/```/g, '')
      .trim()

    // If response looks like JSON, try to extract text
    if (humanizedText.startsWith('{')) {
      try {
        const parsed = JSON.parse(humanizedText)
        humanizedText = parsed.text || parsed.content || parsed.humanizedText || humanizedText
      } catch (e) {
        // Not JSON, use as is
      }
    }

    return NextResponse.json({
      success: true,
      humanizedText,
      level,
      tone,
      techniquesApplied: techniques
    })

  } catch (error) {
    console.error('Humanization error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
