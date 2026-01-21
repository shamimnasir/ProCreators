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
  contrarian: '"Stop doing [popular advice]. Do this instead, and here\'s why."'
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
      targetAudience,
      mainKeyword,
      keyPoints
    } = body

    if (!videoTopic) {
      return NextResponse.json({ success: false, error: 'Video topic is required' }, { status: 400 })
    }

    const lengthConfig = LENGTH_WORDS[videoLength] || LENGTH_WORDS.medium
    const hookTemplate = HOOK_TEMPLATES[hookType] || HOOK_TEMPLATES.curiosity

    // System prompt for YouTube content generation
    const systemPrompt = `You are an expert YouTube content creator and scriptwriter who specializes in creating high-retention video content. You understand the YouTube algorithm, viewer psychology, and what makes videos go viral.

Your scripts follow the BENS (Big, Easy, New, Safe) high-retention structure:
1. Hook (0-15 seconds): Immediately grab attention with the promised value
2. Re-hook (15-30 seconds): Explain why they should keep watching
3. Story/Body: Deliver content with pattern interrupts every 5-10 seconds
4. Loop (mid-video): Tease upcoming climax to prevent drop-off
5. Payoff & CTA: Close the loop and call to action

Key rules:
- NO filler intros like "Hey guys, welcome back"
- Start immediately with the topic
- Use conversational, simple language
- Every sentence must provide value or bridge to the next point
- Include [SCENE], [TEXT], [SOUND] markers for editing cues
- Create open loops to maintain engagement

For titles:
- Front-load keywords in first 5 words
- Keep 40-60 characters
- Use curiosity words: Secret, Mistake, Hack, Instantly
- Promise clear outcomes
- Use numbers when applicable

Always respond in valid JSON format.`

    // Generate the full script
    const scriptPrompt = `Create a complete YouTube video script for:

Topic: ${videoTopic}
Video Type: ${videoCategory}
Target Duration: ${lengthConfig.duration} (${lengthConfig.min}-${lengthConfig.max} words)
Tone: ${contentTone}
Hook Style: ${hookType} - Template: ${hookTemplate}
Target Audience: ${targetAudience || 'general audience'}
Main Keyword: ${mainKeyword || videoTopic.split(' ').slice(0, 3).join(' ')}
${keyPoints ? `Key Points to Cover:\n${keyPoints}` : ''}

Generate a complete response in this exact JSON format:
{
  "script": "Full video script with [SCENE], [TEXT], [SOUND] markers. Structure: Hook (0-15s), Re-hook (15-30s), Main Content with pattern interrupts, Mid-video Loop, Payoff, CTA. Write ${lengthConfig.min}-${lengthConfig.max} words.",
  "titles": [
    "Title 1 - Front-loaded keyword, 40-60 chars, curiosity-driven",
    "Title 2 - Different angle, uses numbers if applicable",
    "Title 3 - Contrarian or question-based",
    "Title 4 - Benefit-focused",
    "Title 5 - Urgency/scarcity angle"
  ],
  "hooks": [
    "Curiosity hook variation for first 15 seconds",
    "Action hook variation - drop into the middle",
    "Audience-centric hook - call out their problem",
    "Time-promise hook - what they'll learn",
    "Stakes hook - consequences of not watching",
    "Contrarian hook - challenge common belief"
  ],
  "description": "Full YouTube description with:\n- Compelling first 2 lines (shown in search)\n- Summary of video\n- Timestamps for key sections\n- Links placeholders\n- Social media links placeholders\n- Relevant hashtags\n- Call to action",
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
