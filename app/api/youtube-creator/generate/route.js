import { NextResponse } from 'next/server'
import { spawn } from 'child_process'
import path from 'path'

// Hook type templates for script generation
const HOOK_TEMPLATES = {
  curiosity: '"I thought I knew [topic], until I found out [surprising twist]."',
  action: '"It\'s [time]. I\'m [in the middle of problem]. Here\'s what I did next."',
  audience: '"You\'re doing [common mistake], and it\'s costing you [pain]. Let\'s fix it."',
  'time-promise': '"In the next [X] minutes, you\'ll learn [specific outcome] so you can [benefit]."',
  stakes: '"If you don\'t fix [problem], you\'ll keep [bad outcome]. Here\'s the workaround."',
  contrarian: '"Stop doing [popular advice]. Do this instead, and here\'s why."',
  'conflict-tease': '"Everything was going perfectly... until [unexpected turn]. What happened next changed everything."',
  transformation: '"[X time] ago, I was [bad state]. Today, I\'m [transformed state]. Here\'s the moment that changed it all."'
}

// Script structure definitions
const SCRIPT_STRUCTURES = {
  bens: {
    name: 'BENS Structure',
    sections: ['Hook (0-15s)', 'Re-hook (15-30s)', 'Main Content with pattern interrupts', 'Mid-video Loop', 'Payoff + CTA'],
    prompt: `Use the BENS high-retention structure:
1. HOOK (0-15 seconds): Immediately grab attention with the promised value
2. RE-HOOK (15-30 seconds): Explain why they should keep watching - what they'll learn
3. STORY/BODY: Deliver content with pattern interrupts every 5-10 seconds. Use [SCENE], [TEXT], [SOUND] markers
4. LOOP (mid-video): Tease upcoming climax to prevent drop-off. Create an open loop.
5. PAYOFF & CTA: Close the loop and call to action. Deliver on the hook's promise.`
  },
  'conflict-arc': {
    name: 'Conflict Arc (Storytelling)',
    sections: ['Hook', 'Rising Action', 'Conflict (Peak)', 'Comeback (Valley)', 'Rising Action 2', 'Payoff (Climax)'],
    prompt: `Use the CONFLICT ARC storytelling structure for maximum emotional engagement:

1. HOOK (Start with tension): Open at a moment of tension or tease the central conflict. Make viewers NEED to know what happens. Don't give context yet.

2. RISING ACTION (Build the stakes): 
   - Introduce the context/backstory
   - Build up what's at stake
   - Create emotional investment
   - Show what could be lost or gained
   - Intensity should gradually increase

3. CONFLICT (The Peak - Highest Intensity):
   - The main problem/challenge/crisis hits
   - This is the darkest moment or biggest obstacle
   - Make it feel impossible to overcome
   - Maximum emotional tension
   - Use dramatic language and pacing

4. COMEBACK (The Valley - Turning Point):
   - The moment of realization or discovery
   - Finding unexpected hope or solution
   - The pivot that changes everything
   - Intensity dips but hope emerges
   - This should feel like a breakthrough

5. RISING ACTION 2 (Building to Resolution):
   - Apply the solution/lesson
   - Show the journey toward resolution
   - Build anticipation for the payoff
   - Intensity rises again but with hope

6. PAYOFF (The Climax + CTA):
   - Resolution and transformation revealed
   - Emotional peak - satisfaction of completing the journey
   - Share the lesson learned
   - Strong call to action tied to the story's message
   - Leave them inspired/motivated

Key Storytelling Principles:
- Every section should have emotional stakes
- Use "But then..." and "And that's when..." transitions
- Include specific details that make it real
- Vary sentence length for rhythm
- Use present tense for dramatic moments`
  },
  'hero-journey': {
    name: 'Mini Hero Journey',
    sections: ['The Call', 'Refusal/Doubt', 'The Challenge', 'Transformation', 'The Return'],
    prompt: `Use the MINI HERO JOURNEY structure for transformation/success stories:

1. THE CALL (Opening):
   - Start with the problem that demanded action
   - What was the inciting incident?
   - Why couldn't you ignore it anymore?
   - Set up what was at stake

2. REFUSAL/DOUBT (Act 1):
   - Initial hesitation, fear, or first failure
   - Why it seemed impossible
   - What others said/thought
   - Build relatability through vulnerability

3. THE CHALLENGE (Mid-point):
   - The main obstacle or test
   - Facing the fear head-on
   - The struggle that defined the journey
   - Make it visceral and specific

4. TRANSFORMATION (Climax):
   - The breakthrough moment
   - What clicked/changed
   - The skill/mindset/discovery that made the difference
   - Show the internal shift

5. THE RETURN (Resolution + CTA):
   - Sharing the wisdom gained
   - What life looks like now
   - How they can start their journey
   - Inspiring call to action`
  }
}

// Video length word counts
const LENGTH_WORDS = {
  short: { min: 150, max: 450, duration: '1-3 minutes' },
  medium: { min: 750, max: 1200, duration: '5-8 minutes' },
  long: { min: 1500, max: 2250, duration: '10-15 minutes' },
  extended: { min: 3000, max: 4000, duration: '20+ minutes' }
}

async function callLLM(prompt, systemPrompt) {
  return new Promise((resolve, reject) => {
    const scriptPath = path.join(process.cwd(), 'scripts', 'llm_call.py')
    const inputData = JSON.stringify({
      prompt,
      system_prompt: systemPrompt
    })
    
    // Use the virtual environment python and pass input as command line argument
    const pythonProcess = spawn('/root/.venv/bin/python3', [scriptPath, inputData])
    
    let stdout = ''
    let stderr = ''
    
    pythonProcess.stdout.on('data', (data) => { stdout += data.toString() })
    pythonProcess.stderr.on('data', (data) => { stderr += data.toString() })
    
    pythonProcess.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(stderr || stdout || 'LLM call failed'))
      } else {
        try {
          const result = JSON.parse(stdout)
          if (result.success) {
            resolve(result.content || result.response || stdout)
          } else {
            reject(new Error(result.error || 'LLM call failed'))
          }
        } catch {
          resolve(stdout.trim())
        }
      }
    })
  })
}

export async function POST(request) {
  try {
    const body = await request.json()
    const {
      videoTopic,
      videoCategory,
      videoLength,
      contentTone,
      hookType,
      scriptStructure = 'bens',
      targetAudience,
      mainKeyword,
      keyPoints
    } = body

    if (!videoTopic) {
      return NextResponse.json({ success: false, error: 'Video topic is required' }, { status: 400 })
    }

    const lengthConfig = LENGTH_WORDS[videoLength] || LENGTH_WORDS.medium
    const hookTemplate = HOOK_TEMPLATES[hookType] || HOOK_TEMPLATES.curiosity
    const structureConfig = SCRIPT_STRUCTURES[scriptStructure] || SCRIPT_STRUCTURES.bens

    // Detect input language - check for non-ASCII characters that indicate Bengali/Hindi/etc.
    const detectLanguage = (text) => {
      // Bengali Unicode range: \u0980-\u09FF
      if (/[\u0980-\u09FF]/.test(text)) return 'Bengali (বাংলা)'
      // Hindi/Devanagari Unicode range: \u0900-\u097F
      if (/[\u0900-\u097F]/.test(text)) return 'Hindi (हिंदी)'
      // Tamil Unicode range: \u0B80-\u0BFF
      if (/[\u0B80-\u0BFF]/.test(text)) return 'Tamil (தமிழ்)'
      // Telugu Unicode range: \u0C00-\u0C7F
      if (/[\u0C00-\u0C7F]/.test(text)) return 'Telugu (తెలుగు)'
      // Arabic Unicode range: \u0600-\u06FF
      if (/[\u0600-\u06FF]/.test(text)) return 'Arabic (العربية)'
      // Chinese Unicode range
      if (/[\u4E00-\u9FFF]/.test(text)) return 'Chinese (中文)'
      // Japanese (Hiragana/Katakana)
      if (/[\u3040-\u309F\u30A0-\u30FF]/.test(text)) return 'Japanese (日本語)'
      // Korean
      if (/[\uAC00-\uD7AF]/.test(text)) return 'Korean (한국어)'
      // Spanish special chars
      if (/[ñáéíóúü¿¡]/i.test(text)) return 'Spanish (Español)'
      // French special chars
      if (/[àâäéèêëïîôùûüÿœæç]/i.test(text)) return 'French (Français)'
      return 'English'
    }

    const detectedLanguage = detectLanguage(videoTopic)
    const isNonEnglish = detectedLanguage !== 'English'

    // System prompt for YouTube content generation
    const systemPrompt = `You are an expert YouTube content creator and scriptwriter who specializes in creating high-retention video content. You understand the YouTube algorithm, viewer psychology, and what makes videos go viral.

${isNonEnglish ? `**CRITICAL INSTRUCTION - LANGUAGE REQUIREMENT:**
The user has provided input in ${detectedLanguage}. You MUST generate ALL content (script, titles, hooks, description, tags) in ${detectedLanguage}. 
- The script MUST be written entirely in ${detectedLanguage}
- All titles MUST be in ${detectedLanguage}
- All hooks MUST be in ${detectedLanguage}
- The description MUST be in ${detectedLanguage}
- Tags should be in ${detectedLanguage} (with some English keywords for SEO if appropriate)
DO NOT translate to English. Write naturally in ${detectedLanguage}.` : ''}

**SCRIPT STRUCTURE TO USE: ${structureConfig.name}**
${structureConfig.prompt}

Key rules:
- NO filler intros like "Hey guys, welcome back"
- Start immediately with the topic or tension
- Use conversational, simple language
- Every sentence must provide value or emotional engagement
- Include [SCENE], [TEXT], [SOUND] markers for editing cues
- Create open loops to maintain engagement
- For storytelling: use specific details, vary pacing, build emotional stakes

For titles:
- Front-load keywords in first 5 words
- Keep 40-60 characters
- Use curiosity words: Secret, Mistake, Hack, Instantly (or equivalent in target language)
- Promise clear outcomes
- Use numbers when applicable

Always respond in valid JSON format.`

    // Generate the full script
    const languageInstruction = isNonEnglish 
      ? `\n\n**IMPORTANT: Generate ALL content in ${detectedLanguage}. The topic is in ${detectedLanguage}, so the script, titles, hooks, description, and tags MUST all be written in ${detectedLanguage}. Do NOT translate to English.**\n`
      : ''

    const scriptPrompt = `Create a complete YouTube video script for:

Topic: ${videoTopic}
Video Type: ${videoCategory}
Target Duration: ${lengthConfig.duration} (${lengthConfig.min}-${lengthConfig.max} words)
Tone: ${contentTone}
Hook Style: ${hookType} - Template: ${hookTemplate}
Target Audience: ${targetAudience || 'general audience'}
Main Keyword: ${mainKeyword || videoTopic.split(' ').slice(0, 3).join(' ')}
${keyPoints ? `Key Points to Cover:\n${keyPoints}` : ''}
${languageInstruction}
Generate a complete response in this exact JSON format. ${isNonEnglish ? `Write everything in ${detectedLanguage}:` : ''}
{
  "script": "Full video script ${isNonEnglish ? `in ${detectedLanguage} ` : ''}with [SCENE], [TEXT], [SOUND] markers. Structure: Hook (0-15s), Re-hook (15-30s), Main Content with pattern interrupts, Mid-video Loop, Payoff, CTA. Write ${lengthConfig.min}-${lengthConfig.max} words.",
  "titles": [
    "Title 1 ${isNonEnglish ? `in ${detectedLanguage} ` : ''}- Front-loaded keyword, 40-60 chars, curiosity-driven",
    "Title 2 ${isNonEnglish ? `in ${detectedLanguage} ` : ''}- Different angle, uses numbers if applicable",
    "Title 3 ${isNonEnglish ? `in ${detectedLanguage} ` : ''}- Contrarian or question-based",
    "Title 4 ${isNonEnglish ? `in ${detectedLanguage} ` : ''}- Benefit-focused",
    "Title 5 ${isNonEnglish ? `in ${detectedLanguage} ` : ''}- Urgency/scarcity angle"
  ],
  "hooks": [
    "Curiosity hook ${isNonEnglish ? `in ${detectedLanguage} ` : ''}- variation for first 15 seconds",
    "Action hook ${isNonEnglish ? `in ${detectedLanguage} ` : ''}- drop into the middle",
    "Audience-centric hook ${isNonEnglish ? `in ${detectedLanguage} ` : ''}- call out their problem",
    "Time-promise hook ${isNonEnglish ? `in ${detectedLanguage} ` : ''}- what they'll learn",
    "Stakes hook ${isNonEnglish ? `in ${detectedLanguage} ` : ''}- consequences of not watching",
    "Contrarian hook ${isNonEnglish ? `in ${detectedLanguage} ` : ''}- challenge common belief"
  ],
  "description": "Full YouTube description ${isNonEnglish ? `in ${detectedLanguage} ` : ''}with:\n- Compelling first 2 lines (shown in search)\n- Summary of video\n- Timestamps for key sections\n- Links placeholders\n- Social media links placeholders\n- Relevant hashtags\n- Call to action",
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5", "tag6", "tag7", "tag8", "tag9", "tag10"]
}

Make the script engaging, valuable, and optimized for retention. Include specific [SCENE], [TEXT], and [SOUND] markers throughout.`

    const llmResponse = await callLLM(scriptPrompt, systemPrompt)
    
    // Parse the response
    let result
    try {
      // Try to extract JSON from the response
      let jsonStr = llmResponse
      
      // Handle markdown code blocks
      if (jsonStr.includes('```json')) {
        jsonStr = jsonStr.split('```json')[1].split('```')[0]
      } else if (jsonStr.includes('```')) {
        jsonStr = jsonStr.split('```')[1].split('```')[0]
      }
      
      // Clean up the string
      jsonStr = jsonStr.trim()
      
      result = JSON.parse(jsonStr)
    } catch (parseError) {
      console.error('JSON parse error, creating structured response:', parseError)
      
      // Fallback: create structured response from raw text
      result = {
        script: llmResponse,
        titles: [
          `${videoTopic} - Complete Guide`,
          `How to ${videoTopic} (Step by Step)`,
          `${videoTopic}: What No One Tells You`,
          `The Truth About ${videoTopic}`,
          `${videoTopic} in ${lengthConfig.duration}`
        ],
        hooks: [
          `What if everything you knew about ${videoTopic} was wrong?`,
          `Right now, I'm about to show you something that changed everything for me.`,
          `You're probably making this mistake with ${videoTopic}, and it's costing you.`,
          `In the next few minutes, you'll learn exactly how to master ${videoTopic}.`,
          `If you don't fix this, you'll keep struggling with ${videoTopic}.`,
          `Stop doing what everyone says about ${videoTopic}. Here's what actually works.`
        ],
        description: `${videoTopic}\n\nIn this video, I'll show you everything you need to know about ${videoTopic}.\n\n⏱️ TIMESTAMPS:\n0:00 - Introduction\n0:30 - Main Content\n\n🔔 Subscribe for more content!\n\n#${mainKeyword?.replace(/\s+/g, '') || 'YouTube'} #Tutorial #HowTo`,
        tags: [mainKeyword || videoTopic, videoCategory, 'tutorial', 'how to', 'guide', 'tips', '2024', 'best', 'top', 'learn']
      }
    }

    return NextResponse.json({
      success: true,
      data: result
    })

  } catch (error) {
    console.error('YouTube Creator Error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to generate YouTube content' },
      { status: 500 }
    )
  }
}
