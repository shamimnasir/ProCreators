import { NextResponse } from 'next/server'
import { spawn } from 'child_process'
import path from 'path'

// Tool-specific prompts and configurations
const TOOL_CONFIGS = {
  'joke': {
    systemPrompt: `You are a professional comedian and joke writer. You create hilarious, clever jokes that are clean and appropriate for all audiences. Your jokes are witty, unexpected, and always get a laugh.`,
    generatePrompt: (data) => `Generate ${data.count || 3} unique ${data.style || 'general'} jokes about "${data.topic}".
${data.audience ? `Target audience: ${data.audience}` : ''}

Style preferences:
- Type: ${data.jokeType || 'any'} (one-liner, pun, knock-knock, observational, dad joke)
- Tone: ${data.tone || 'funny'} (funny, clever, silly, dark humor, wholesome)

Return JSON format:
{
  "jokes": [
    {
      "setup": "The setup/question part",
      "punchline": "The punchline/answer",
      "type": "joke type",
      "rating": "family-friendly/teen/adult"
    }
  ],
  "bonusJoke": "One extra bonus joke as a single string"
}`
  },
  'fortune': {
    systemPrompt: `You are a mystical fortune teller with a flair for the dramatic yet insightful. You provide entertaining predictions that are positive, inspiring, and thought-provoking. Mix wisdom with whimsy.`,
    generatePrompt: (data) => `Provide a mystical fortune reading for someone interested in ${data.category || 'general life'}.

Their question/focus: "${data.question || 'What does the future hold?'}"
Reading style: ${data.style || 'mystical'} (mystical, zodiac, tarot-inspired, crystal ball, tea leaves)
${data.zodiacSign ? `Zodiac sign: ${data.zodiacSign}` : ''}

Return JSON format:
{
  "mainPrediction": "The main fortune/prediction (2-3 sentences)",
  "luckyElements": {
    "number": "lucky number",
    "color": "lucky color",
    "day": "lucky day of the week"
  },
  "advice": "Mystical advice for the seeker",
  "warning": "A gentle mystical warning or caution",
  "affirmation": "A positive affirmation for the day",
  "mysticalMessage": "A cryptic but inspiring message from the cosmos"
}`
  },
  'love-letter': {
    systemPrompt: `You are a romantic poet and love letter writer. You craft heartfelt, sincere, and beautifully worded love letters that capture deep emotions. Your writing is elegant, passionate, and deeply moving.`,
    generatePrompt: (data) => `Write a romantic love letter with these details:

Recipient's name: ${data.recipientName || 'My Love'}
Relationship: ${data.relationship || 'romantic partner'}
Occasion: ${data.occasion || 'just because'}
Tone: ${data.tone || 'romantic'} (romantic, playful, passionate, sweet, poetic)
Special memories/details to include: ${data.details || 'none specified'}
Length: ${data.length || 'medium'} (short, medium, long)

Return JSON format:
{
  "greeting": "The opening greeting",
  "body": "The main letter content (multiple paragraphs)",
  "closing": "The romantic closing",
  "signature": "Suggested signature",
  "ps": "An optional sweet P.S. message",
  "alternateVersions": [
    {
      "tone": "playful",
      "snippet": "A shorter playful version of the letter"
    }
  ]
}`
  },
  'story': {
    systemPrompt: `You are a master storyteller who creates captivating, imaginative stories. Your tales are engaging, well-structured, and full of vivid descriptions and memorable characters.`,
    generatePrompt: (data) => `Create a ${data.length || 'medium'} length story with these elements:

Genre: ${data.genre || 'fantasy'}
Main character: ${data.character || 'a brave adventurer'}
Setting: ${data.setting || 'a magical kingdom'}
Theme: ${data.theme || 'friendship and courage'}
Target audience: ${data.audience || 'general'}
Special elements to include: ${data.elements || 'none'}

Return JSON format:
{
  "title": "Story title",
  "opening": "The hook/opening paragraph",
  "chapters": [
    {
      "title": "Chapter title",
      "content": "Chapter content"
    }
  ],
  "climax": "The exciting climax",
  "resolution": "The satisfying ending",
  "moral": "The story's moral or message (if applicable)"
}`
  },
  'meme-text': {
    systemPrompt: `You are a meme lord who understands internet culture and creates viral-worthy meme text. Your captions are relatable, funny, and perfectly capture the meme format spirit.`,
    generatePrompt: (data) => `Generate meme text for the "${data.template || 'general'}" meme format.

Topic: ${data.topic || 'life situations'}
Style: ${data.style || 'relatable'} (relatable, sarcastic, wholesome, absurd, dark humor)
${data.context ? `Context/situation: ${data.context}` : ''}

Return JSON format:
{
  "variations": [
    {
      "topText": "Top text for the meme",
      "bottomText": "Bottom text for the meme",
      "explanation": "Why this is funny"
    }
  ],
  "hashtags": ["relevant", "hashtags"],
  "bestFor": "Which social platform this works best on"
}`
  },
  'avatar': {
    systemPrompt: `You are a creative character designer who creates unique avatar descriptions. You provide detailed, imaginative descriptions that can guide visual creation.`,
    generatePrompt: (data) => `Create an avatar/character description with these preferences:

Style: ${data.style || 'anime'} (anime, realistic, cartoon, pixel art, fantasy, cyberpunk)
Gender/Type: ${data.gender || 'neutral'}
Mood/Expression: ${data.mood || 'confident'}
Color scheme: ${data.colors || 'vibrant'}
Accessories: ${data.accessories || 'none specified'}
Special features: ${data.features || 'none'}

Return JSON format:
{
  "description": "Detailed visual description of the avatar",
  "prompt": "An optimized prompt for AI image generation",
  "colorPalette": ["#hex1", "#hex2", "#hex3"],
  "keyFeatures": ["feature1", "feature2"],
  "variations": [
    {
      "name": "Variation name",
      "changes": "What's different"
    }
  ],
  "styleNotes": "Additional styling recommendations"
}`
  }
}

async function callLLM(prompt, systemPrompt) {
  return new Promise((resolve, reject) => {
    const scriptPath = path.join(process.cwd(), 'scripts', 'llm_call.py')
    const inputData = JSON.stringify({
      prompt,
      system_prompt: systemPrompt
    })
    
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
    const { toolType, ...data } = body

    if (!toolType || !TOOL_CONFIGS[toolType]) {
      return NextResponse.json(
        { success: false, error: 'Invalid tool type. Valid types: ' + Object.keys(TOOL_CONFIGS).join(', ') },
        { status: 400 }
      )
    }

    const config = TOOL_CONFIGS[toolType]
    const prompt = config.generatePrompt(data)
    
    const llmResponse = await callLLM(prompt, config.systemPrompt)
    
    let result
    try {
      let jsonStr = llmResponse
      if (jsonStr.includes('```json')) {
        jsonStr = jsonStr.split('```json')[1].split('```')[0]
      } else if (jsonStr.includes('```')) {
        jsonStr = jsonStr.split('```')[1].split('```')[0]
      }
      jsonStr = jsonStr.trim()
      result = JSON.parse(jsonStr)
    } catch (parseError) {
      console.error('JSON parse error:', parseError)
      result = { rawContent: llmResponse }
    }

    return NextResponse.json({
      success: true,
      data: result,
      toolType
    })

  } catch (error) {
    console.error('Fun Tools API Error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to generate content' },
      { status: 500 }
    )
  }
}
