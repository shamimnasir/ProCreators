import { NextResponse } from 'next/server'
import { generateText } from '@/lib/gemini-text'
import { enforceRateLimit } from '@/lib/rate-limiter'

export async function POST(request) {
  try {
    // SECURITY: Rate limiting for content generation
    const rateLimitCheck = await enforceRateLimit(request, 'content_generate')
    if (rateLimitCheck.limited) {
      return rateLimitCheck.response
    }

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

**VISUAL SUGGESTIONS FOR AI VIDEO (KLING-OPTIMIZED):**
Each scene description should follow this formula:
[Subject Description] + [Subject Action] + [Environment] + [Camera Shot] + [Lighting]

Examples of good scene prompts:
- "A young professional woman with brown hair, wearing a navy blazer, smiles confidently while presenting at a modern office, medium shot, soft natural light"
- "Close-up of hands typing on a sleek laptop keyboard, minimal desk setup, shallow depth of field, warm ambient lighting"
- "Wide establishing shot of a city skyline at golden hour, smooth camera pan, cinematic atmosphere"

For each scene, describe:
- SUBJECT: Who/what is in the frame (specific details)
- ACTION: What movement or change occurs (simple, 5-second action)
- ENVIRONMENT: Where is this happening (specific location details)
- CAMERA: Shot type and any movement (close-up, wide shot, tracking shot, etc.)
- LIGHTING: Type of light (natural, dramatic, warm, etc.)
${hasObjectImage ? '- Describe how the image should be animated and brought to life\n' : '- Describe ideal AI-generated visuals with specific details\n'}

**DURATION:** 15-30 seconds total
**FORMAT:** Vertical 9:16 (1080x1920)

Generate a complete viral reel script with scene-by-scene breakdown. For EACH scene, include:
1. Voiceover/narration text
2. KLING-OPTIMIZED visual prompt (following the formula above)
3. Text overlay suggestion (if any)
4. Duration estimate for that scene`

    const userPrompt = `Create a viral reel/short video script about this EXACT topic: "${topic}"

IMPORTANT: The script MUST be about "${topic}" and NOTHING ELSE. Stay 100% focused.

For the visual descriptions, write them as if they're prompts for Kling AI video generation:
- Be specific about subject appearance (age, clothing, features)
- Describe simple, achievable motions (not complex actions)
- Include camera angles (close-up, medium shot, wide shot)
- Mention lighting conditions
- Keep each visual prompt under 80 words

${hasObjectImage ? 'REMEMBER: Describe how the starting image animates into a dynamic video with camera movements and transitions.\n' : 'REMEMBER: Describe vivid, specific visual scenes optimized for AI video generation.\n'}`

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
