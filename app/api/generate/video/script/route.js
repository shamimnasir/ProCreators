import { NextResponse } from 'next/server'
import { generateText } from '@/lib/gemini-text'

export async function POST(request) {
  try {
    const { topic, hasObjectImage, hasTalkingHead, language } = await request.json()

    if (!topic && !hasObjectImage && !hasTalkingHead) {
      return NextResponse.json(
        { success: false, error: 'Please provide at least a topic or upload an image' },
        { status: 400 }
      )
    }

    const languageText = language === 'bengali' ? 'in Bengali language' : 'in English language'
    
    // Determine script type based on inputs
    let scriptType = 'Text-Based'
    let scriptInstructions = ''
    
    if (hasTalkingHead && hasObjectImage && topic) {
      scriptType = 'Talking Head + Object + Topic'
      scriptInstructions = `
SCRIPT TYPE: TALKING HEAD WITH OBJECT
- The video features a PERSON (talking head) explaining/showcasing an object
- Person narrates and demonstrates about: "${topic}"
- Include direct-to-camera dialogue
- Show the object being discussed
- Use personal pronouns (I, we, you)
- Engaging presentation style
- Person-object interaction moments
`
    } else if (hasTalkingHead && topic) {
      scriptType = 'Talking Head'
      scriptInstructions = `
SCRIPT TYPE: TALKING HEAD (PERSON NARRATION)
- The video features a PERSON speaking directly to camera
- Person talks about: "${topic}"
- Include direct-to-camera dialogue
- Use personal pronouns (I, we, you)
- Conversational and engaging tone
- Person's expressions and gestures are key
`
    } else if (hasObjectImage && topic) {
      scriptType = 'Object-Based'
      scriptInstructions = `
SCRIPT TYPE: OBJECT-FOCUSED VIDEO
- The video focuses on showcasing an object/product
- Topic: "${topic}"
- Use voiceover narration (no person on camera)
- Focus on object details, features, benefits
- Close-up shots and demonstrations
- Professional product showcase style
`
    } else if (topic) {
      scriptType = 'Topic-Based'
      scriptInstructions = `
SCRIPT TYPE: TEXT/TOPIC-BASED VIDEO
- Pure topic explanation: "${topic}"
- Use voiceover or text overlays
- Stock footage and animations
- Visual storytelling through b-roll
- No specific person or object
`
    }
    
    const systemMessage = `You are a viral video script writer specializing in TikTok, Instagram Reels, and YouTube Shorts.

CRITICAL INSTRUCTION: You MUST create a script about the EXACT topic provided. DO NOT create content about any other topic.

Language: ${languageText}
${scriptInstructions}

CREATE A VIRAL REEL/SHORT SCRIPT following this structure:

**VIRAL HOOK FORMAT (First 3 seconds - CRITICAL):**
- Line 1: Shocking statement, question, or pattern interrupt (e.g., "Stop scrolling! This changed my life...")
- Line 2: Promise or intrigue (e.g., "Watch until the end for the secret")

**MAIN CONTENT (Next 12-22 seconds):**
- Quick value delivery about the EXACT topic provided
- 3-5 key points maximum
- Fast-paced, no fluff
- Use numbers and specific details
- Visual cues for each point
${hasTalkingHead ? '- Include what the person says on camera\n' : ''}
${hasObjectImage ? '- Describe how the object is shown/used\n' : ''}

**CALL-TO-ACTION (Last 3-5 seconds):**
- Clear next step (Follow, Like, Share, Comment)
- Create FOMO or urgency

**VISUAL SUGGESTIONS:**
- Describe key visual elements for each scene
- Suggest transitions and effects
- Recommend text overlays
${hasTalkingHead ? '- Describe person\'s actions and expressions\n' : ''}
${hasObjectImage ? '- Describe object shots and angles\n' : ''}

**DURATION:** 15-30 seconds total
**FORMAT:** Vertical 9:16 (1080x1920)

Generate a complete viral reel script with scene-by-scene breakdown including dialogue, visual descriptions, and text overlay suggestions.`

    const userPrompt = `Create a viral reel/short video script about this EXACT topic: "${topic}"

IMPORTANT: The script MUST be about "${topic}" and NOTHING ELSE. Do not create content about any other subject. Stay 100% focused on: ${topic}

${hasTalkingHead ? 'REMEMBER: Include dialogue for the person speaking on camera.\n' : ''}
${hasObjectImage ? 'REMEMBER: Include visual descriptions of the object being shown.\n' : ''}
${hasTalkingHead && hasObjectImage ? 'REMEMBER: Show interaction between the person and the object.\n' : ''}`

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
