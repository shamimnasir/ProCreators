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
  light: `Apply LIGHT humanization to bypass AI detection:
- Make subtle word replacements (use everyday alternatives)
- Add natural transitions between ideas
- Use contractions where appropriate (don't, won't, it's)
- Add occasional filler words (actually, basically, honestly)
- Include 1-2 personal asides
- Keep the original structure mostly intact
- Preserve all factual information`,
  
  medium: `Apply MEDIUM humanization to bypass AI detection:
- Vary sentence lengths dramatically (2-5 word sentences mixed with 20+ word sentences)
- Add personal touches and asides ("Here's the thing...", "Trust me on this...", "I've seen this firsthand...")
- Include rhetorical questions every 2-3 paragraphs
- Use colloquial vocabulary and slang where appropriate
- Add specific, detailed examples with names, places, numbers
- Break up long paragraphs randomly
- Start some sentences with "And", "But", "So"
- Add occasional typo-like informality (gonna, wanna, kinda)
- Include parenthetical thoughts (like this one)
- Maintain core message but make it sound like a blog written by a passionate expert`,
  
  heavy: `Apply HEAVY humanization - make this COMPLETELY undetectable as AI:
- Completely restructure every paragraph
- Write exactly as a human expert would - with all their quirks
- Add strong personal opinions ("I absolutely love...", "Honestly, I think...")
- Use humor, sarcasm, and wit throughout
- Include very specific real-world anecdotes with details
- Create a distinctive, memorable voice
- Add emotional reactions ("This blew my mind!", "Game changer!")
- Use intentional sentence fragments. Like this. For emphasis.
- Start paragraphs with casual openers ("So here's the deal...", "Okay, real talk...")
- Mix formal and informal language unpredictably
- Add self-deprecating humor or admitted uncertainties
- Include dated references or pop culture mentions
- Make it read like a passionate blogger, NOT like an AI`
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
