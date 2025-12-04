import { NextResponse } from 'next/server'
import { generateText } from '@/lib/gemini-text'

export async function POST(request) {
  try {
    const { topic, hasObjectImage, language } = await request.json()

    if (!topic && !hasObjectImage) {
      return NextResponse.json(
        { success: false, error: 'Please provide at least a topic or upload an image' },
        { status: 400 }
      )
    }

    const languageText = language === 'bengali' ? 'in Bengali language' : 'in English language'
    
    // Determine script type based on inputs
    let scriptType = 'Text-to-Video'
    let scriptInstructions = ''
    
    if (hasObjectImage && topic) {
      scriptType = 'Image-to-Video'
      scriptInstructions = `
SCRIPT TYPE: IMAGE-TO-VIDEO (Object/Product Showcase)
- The video animates from a starting image
- Topic: "${topic}"
- Use voiceover narration style
- Focus on visual storytelling and motion
- Describe camera movements (zoom in, pan, rotate)
- Professional cinematic feel
- The image should come to life through animation
`
    } else if (topic) {
      scriptType = 'Text-to-Video'
      scriptInstructions = `
SCRIPT TYPE: TEXT-TO-VIDEO (Pure Concept)
- AI-generated visual content based on the topic
- Topic: "${topic}"
- Use voiceover or text overlays
- Describe ideal visuals and scenes
- Visual storytelling through descriptions
- Cinematic and engaging animations
`
    }
    
    const systemMessage = `You are a viral video script writer specializing in TikTok, Instagram Reels, and YouTube Shorts.

CRITICAL INSTRUCTION: You MUST create a script about the EXACT topic provided. DO NOT create content about any other topic.

Language: ${languageText}
${scriptInstructions}

CREATE A VIRAL REEL/SHORT SCRIPT following this structure:

**VIRAL HOOK FORMAT (First 3 seconds - CRITICAL):**
- Line 1: Shocking statement, question, or pattern interrupt
- Line 2: Promise or intrigue that makes viewers want to watch more

**MAIN CONTENT (Next 12-22 seconds):**
- Quick value delivery about the EXACT topic provided
- 3-5 key points maximum
- Fast-paced, no fluff
- Use numbers and specific details
- Clear visual descriptions for AI video generation
${hasObjectImage ? '- Describe how the starting image should animate and transform\n' : ''}
${hasObjectImage ? '- Suggest camera movements and visual effects\n' : ''}

**CALL-TO-ACTION (Last 3-5 seconds):**
- Clear next step (Follow, Like, Share, Comment)
- Create FOMO or urgency

**VISUAL SUGGESTIONS FOR VIDEO GENERATION:**
- Describe key visual elements for each scene
- Suggest smooth transitions and camera movements
- Recommend text overlays and graphics
${hasObjectImage ? '- Describe how the image should be brought to life\n' : '- Describe the ideal AI-generated visuals\n'}

**DURATION:** 15-30 seconds total
**FORMAT:** Vertical 9:16 (1080x1920)

Generate a complete viral reel script with scene-by-scene breakdown including voiceover narration, visual descriptions for AI video generation, and text overlay suggestions.`

    const userPrompt = `Create a viral reel/short video script about this EXACT topic: "${topic}"

IMPORTANT: The script MUST be about "${topic}" and NOTHING ELSE. Do not create content about any other subject. Stay 100% focused on: ${topic}

${hasObjectImage ? 'REMEMBER: Describe how the starting image should animate and transform into a dynamic video. Include camera movements, zoom effects, and visual transformations.\n' : 'REMEMBER: Describe vivid visual scenes that AI can generate for this topic.\n'}`

    const result = await generateText(userPrompt, systemMessage)

    if (result.success) {
      return NextResponse.json({
        success: true,
        script: result.content,
        scriptType: `${scriptType} script generated successfully!`,
        language
      })
    } else {
      throw new Error(result.error || 'Failed to generate script')
    }

  } catch (error) {
    console.error('Script generation error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to generate script' },
      { status: 500 }
    )
  }
}
