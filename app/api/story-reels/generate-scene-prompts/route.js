import { NextResponse } from 'next/server'
import { generateText } from '@/lib/gemini-text'

export async function POST(request) {
  try {
    const { script, duration } = await request.json()

    if (!script || !script.trim()) {
      return NextResponse.json(
        { success: false, error: 'Script is required' },
        { status: 400 }
      )
    }

    // Calculate how many 5-8 second AI video clips we need
    // AI video models typically generate 5-8 second clips
    const clipDuration = 6 // Average clip duration in seconds
    const numClips = Math.ceil(duration / clipDuration)
    
    // Use AI to generate detailed visual scene prompts for AI video generation
    const systemMessage = `You are an expert AI video director and prompt engineer. Your task is to analyze a script and create detailed visual scene prompts for AI video generation.

CRITICAL REQUIREMENTS:
1. Read the script (may be in any language) and understand the narrative flow
2. Generate EXACTLY ${numClips} scene prompts for AI video generation
3. Each scene should represent a 5-8 second video clip
4. Prompts must be in ENGLISH regardless of script language
5. Each prompt should be a detailed visual description (not the script text itself)

CONSISTENCY GUIDELINES (VERY IMPORTANT):
- If the video needs a human character, use the SAME character description in ALL scenes
- Define a "main character" with specific features: age, gender, clothing, hair style
- Example: "30-year-old man with short dark hair, blue business suit" - use this EXACT description in every scene with a person
- For abstract/conceptual videos, maintain consistent visual style (colors, mood, lighting)
- Use the same visual style throughout: if scene 1 is "modern minimalist", ALL scenes should be "modern minimalist"

PROMPT WRITING GUIDELINES:
- Describe the VISUAL scene, not the narration
- Include: subject, action, setting, lighting, camera angle, mood
- Be specific about visual elements (colors, textures, movements)
- Use cinematic language (wide shot, close-up, tracking shot, etc.)
- Avoid text/dialogue in the scene - AI video models can't generate text well
- Keep each prompt under 200 characters for best results
- ADD a consistent visual style tag to each prompt

EXAMPLE TRANSFORMATIONS:
Script: "Reduce risk more than you increase excitement. Guarantees and social proof beat hype."
Scene Prompt: "30-year-old businessman in navy suit, confidently shaking hands in modern glass office, warm golden lighting, medium shot, professional corporate style"

Script: "Make the next step obvious and easy. Confusion kills sales."
Scene Prompt: "Same 30-year-old businessman in navy suit pointing at clean minimalist interface with glowing button, bright white office, close-up on hands, professional corporate style"

OUTPUT FORMAT:
Return a JSON array with:
- "characterDescription": A consistent character description to use (if human needed)
- "visualStyle": The consistent visual style for all scenes
- "scenes": Array of scene objects

[
  {
    "characterDescription": "30-year-old professional man with short dark hair wearing navy blue suit",
    "visualStyle": "modern corporate, warm lighting, professional",
    "scenes": [
      {
        "sceneNumber": 1,
        "prompt": "Detailed visual description including character description and visual style",
        "mood": "confident/exciting/calm/dramatic/etc",
        "cameraStyle": "wide shot/close-up/tracking/aerial/etc"
      }
    ]
  }
]`

    const userPrompt = `Analyze this script and create EXACTLY ${numClips} visual scene prompts for AI video generation.

Script/Narration:
"""
${script}
"""

Video Duration: ${duration} seconds
Number of scenes needed: ${numClips}

IMPORTANT: Generate detailed visual prompts that an AI video model can turn into cinematic footage. Each scene should flow naturally into the next.

Return ONLY a valid JSON array of ${numClips} scene objects.`

    const result = await generateText(userPrompt, systemMessage)

    if (!result.success) {
      throw new Error(result.error || 'AI scene prompt generation failed')
    }

    // Parse AI response to extract scene prompts array
    let scenePrompts = []
    try {
      // Clean up the response to extract JSON
      let cleanedResponse = result.content
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim()
      
      // Find the JSON array
      const jsonMatch = cleanedResponse.match(/\[[\s\S]*\]/)
      if (jsonMatch) {
        cleanedResponse = jsonMatch[0]
      }
      
      scenePrompts = JSON.parse(cleanedResponse)
      
      if (!Array.isArray(scenePrompts)) {
        throw new Error('Response is not an array')
      }

      // Validate and clean each scene prompt
      scenePrompts = scenePrompts.map((scene, idx) => ({
        sceneNumber: scene.sceneNumber || idx + 1,
        prompt: (scene.prompt || scene.description || '').trim().substring(0, 300),
        mood: scene.mood || 'cinematic',
        cameraStyle: scene.cameraStyle || scene.camera_style || 'medium shot'
      })).filter(s => s.prompt.length > 10)

    } catch (parseError) {
      console.error('[Scene Prompts] Parse error:', parseError)
      
      // Fallback: try to extract prompts from the response text
      const promptMatches = result.content.match(/"prompt"\s*:\s*"([^"]+)"/g)
      if (promptMatches && promptMatches.length > 0) {
        scenePrompts = promptMatches.map((match, idx) => {
          const promptText = match.replace(/"prompt"\s*:\s*"/, '').replace(/"$/, '')
          return {
            sceneNumber: idx + 1,
            prompt: promptText.substring(0, 300),
            mood: 'cinematic',
            cameraStyle: 'medium shot'
          }
        })
      }
    }

    // If still not enough prompts, generate fallback prompts
    if (scenePrompts.length < numClips) {
      console.log(`[Scene Prompts] Only got ${scenePrompts.length} prompts, generating fallbacks for remaining ${numClips - scenePrompts.length}`)
      
      // Generate contextual fallback prompts based on the script
      const fallbackPrompts = generateFallbackPrompts(script, numClips - scenePrompts.length)
      scenePrompts = [...scenePrompts, ...fallbackPrompts]
    }

    // Ensure we have exactly the right number
    scenePrompts = scenePrompts.slice(0, numClips)

    // Add enhanced cinematic suffix to each prompt
    const enhancedPrompts = scenePrompts.map(scene => ({
      ...scene,
      fullPrompt: `${scene.prompt}, ${scene.cameraStyle}, ${scene.mood} mood, cinematic lighting, professional quality, 4K resolution`
    }))

    return NextResponse.json({
      success: true,
      scenePrompts: enhancedPrompts,
      totalClips: numClips,
      clipDuration: clipDuration,
      estimatedDuration: numClips * clipDuration,
      message: `Generated ${enhancedPrompts.length} scene prompts for ${numClips} AI video clips`
    })

  } catch (error) {
    console.error('[Scene Prompts] Error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to generate scene prompts' },
      { status: 500 }
    )
  }
}

// Generate contextual fallback prompts when AI doesn't provide enough
function generateFallbackPrompts(script, count) {
  const fallbacks = []
  
  // Analyze script for context clues
  const scriptLower = script.toLowerCase()
  
  // Determine general theme
  let theme = 'professional'
  if (scriptLower.includes('story') || scriptLower.includes('once upon')) {
    theme = 'storytelling'
  } else if (scriptLower.includes('tip') || scriptLower.includes('learn') || scriptLower.includes('how to')) {
    theme = 'educational'
  } else if (scriptLower.includes('business') || scriptLower.includes('sale') || scriptLower.includes('customer')) {
    theme = 'business'
  } else if (scriptLower.includes('motivat') || scriptLower.includes('success') || scriptLower.includes('achiev')) {
    theme = 'motivational'
  }
  
  const themePrompts = {
    professional: [
      'Modern office interior with warm lighting, professionals working at computers, medium shot',
      'Business meeting with confident executives around glass table, soft focus background',
      'Person confidently presenting on large screen, dynamic camera movement, professional setting',
      'Handshake between two professionals, close-up, golden hour lighting through window',
      'Team collaboration moment, diverse group smiling, bright modern workspace',
      'Success celebration with subtle confetti, happy professional, cinematic lighting'
    ],
    storytelling: [
      'Cinematic wide shot of beautiful landscape at golden hour, sweeping camera movement',
      'Person walking through atmospheric setting, mysterious lighting, tracking shot',
      'Dramatic close-up of expressive face, emotional lighting, shallow depth of field',
      'Beautiful nature scene with gentle movement, peaceful atmosphere, wide angle',
      'Silhouette against sunset sky, inspirational mood, slow motion',
      'Final triumphant moment, warm lighting, uplifting atmosphere'
    ],
    educational: [
      'Clean modern desk with organized items, soft lighting, educational atmosphere',
      'Animated diagram coming to life, bright colors, engaging visual style',
      'Person having lightbulb moment, bright background, eureka expression',
      'Step-by-step process visualization, clean graphics, professional look',
      'Knowledge being shared, warm interaction, comfortable setting',
      'Achievement and learning moment, satisfied expression, bright environment'
    ],
    business: [
      'Growing chart visualization, green positive indicators, professional presentation',
      'Customer service interaction, friendly smile, modern store or office',
      'Product showcase with premium lighting, elegant presentation, close-up',
      'Transaction completion moment, satisfaction, clean business environment',
      'Team success celebration, professional yet warm atmosphere',
      'Business growth visualization, upward movement, optimistic mood'
    ],
    motivational: [
      'Person overcoming challenge, dramatic lighting, powerful pose',
      'Sunrise over mountains, new beginnings, inspiring wide shot',
      'Athlete or professional achieving goal, slow motion triumph',
      'Transformation journey visualization, before to after, emotional',
      'Community support moment, diverse group, warm connections',
      'Peak achievement celebration, confetti or success symbols, cinematic'
    ]
  }
  
  const prompts = themePrompts[theme] || themePrompts.professional
  
  for (let i = 0; i < count; i++) {
    const promptIdx = i % prompts.length
    fallbacks.push({
      sceneNumber: i + 1,
      prompt: prompts[promptIdx],
      mood: 'cinematic',
      cameraStyle: 'medium shot'
    })
  }
  
  return fallbacks
}
