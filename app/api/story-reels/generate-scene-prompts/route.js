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

    // Calculate how many 10 second AI video clips we need
    // Kling AI generates 10-second clips for cost efficiency
    const clipDuration = 10 // Each AI clip is 10 seconds
    const numClips = Math.ceil(duration / clipDuration)
    
    // Use AI to generate detailed visual scene prompts for Kling AI video generation
    const systemMessage = `You are an elite Hollywood cinematographer and Kling AI prompt engineer with 20+ years of experience. Your task is to transform a script into VISUALLY STUNNING, PHYSICALLY ACCURATE scene prompts for AI video generation.

## YOUR MISSION ##
Create ${numClips} CINEMATIC scene prompts that are:
- Visually detailed and immersive
- Physically accurate (correct spatial relationships, realistic movements)
- Cinematically composed (proper framing, lighting, depth)
- Emotionally engaging

## CRITICAL PHYSICS & SPATIAL RULES ##
⚠️ ALWAYS maintain LOGICAL spatial relationships:
- If character A is CHASING character B, A must be BEHIND B in the frame
- If character is SHOOTING at something, the TARGET must be IN FRONT of them
- If character is RUNNING AWAY from danger, the danger is BEHIND them
- If two characters are FACING each other, use OVER-THE-SHOULDER or TWO-SHOT
- NEVER place the threat BEHIND the hero if hero is attacking
- Objects falling = top to bottom motion
- Characters approaching camera = getting larger in frame

## MOVEMENT DIRECTION RULES ##
- Running TOWARD camera: character grows larger, background recedes
- Running AWAY from camera: character shrinks, we see their back
- Chasing scene: pursuer BEHIND the one being chased
- Attack scene: attacker faces the direction of their target
- Explosion/danger: character runs AWAY from it (it's behind them)

## CINEMATIC COMPOSITION ##
Use professional cinematography terms:
- WIDE/ESTABLISHING SHOT: Shows full environment, character small in frame
- MEDIUM SHOT: Waist up, good for dialogue and action
- CLOSE-UP: Face/detail, emotional moments
- EXTREME CLOSE-UP: Eyes, hands, critical objects
- OVER-THE-SHOULDER (OTS): Conversation between two people
- LOW ANGLE: Makes subject look powerful/heroic
- HIGH ANGLE: Makes subject look vulnerable/small
- TRACKING SHOT: Camera follows moving subject
- DOLLY IN/OUT: Camera moves toward/away from subject
- CRANE SHOT: Camera rises or descends

## LIGHTING & ATMOSPHERE ##
Include specific lighting:
- Golden hour: Warm, orange/yellow tones
- Blue hour: Cool, twilight blue tones
- High key: Bright, minimal shadows (happy scenes)
- Low key: Dark, dramatic shadows (tense scenes)
- Rim lighting: Silhouette with light edge
- Volumetric light: God rays, dust particles in light

## PROMPT STRUCTURE (MANDATORY) ##
Each prompt MUST include in this order:
1. SUBJECT: Detailed character description (age, clothing, expression, pose)
2. ACTION: Specific movement with DIRECTION (toward/away, left/right)
3. ENVIRONMENT: Detailed setting with depth (foreground, midground, background)
4. CAMERA: Shot type + angle + movement
5. LIGHTING: Specific lighting setup
6. ATMOSPHERE: Mood, particles, weather effects

## PROMPT TEMPLATE ##
"[Subject with details], [specific action with direction], [environment with depth layers], [camera angle and movement], [lighting type], [atmospheric effects]"

## EXCELLENT EXAMPLES ##

❌ BAD: "A boy running from aliens in space"
✅ GOOD: "10-year-old boy in torn silver spacesuit, sprinting TOWARD camera with terrified expression, laser fire reflecting off his helmet visor, alien creatures visible in BACKGROUND pursuing him through metallic spaceship corridor, debris floating past, tracking shot pulling backward, emergency red lights flashing, smoke and sparks filling the air"

❌ BAD: "Hero fighting villain"  
✅ GOOD: "Muscular warrior in bronze armor, sword raised high, lunging FORWARD at armored enemy in FOREGROUND, ancient stone arena with torch-lit pillars in BACKGROUND, crowd silhouettes visible, low angle shot emphasizing hero's power, golden sunset backlighting creating dramatic rim light, dust particles swirling from their footsteps"

❌ BAD: "Woman walking in city"
✅ GOOD: "30-year-old woman in crimson trench coat and black heels, walking confidently toward camera down rain-soaked Tokyo street, neon signs reflecting in puddles, blurred pedestrians with umbrellas in background, medium tracking shot at eye level, cyan and magenta neon glow illuminating her face, rain droplets visible, cinematic shallow depth of field"

## DIALOGUE SYNTAX ##
When character speaks: "[character], [action], saying '[2-5 words]', [setting], [camera], FRONT-FACING for lip sync"

## SCENE FLOW ##
Ensure scenes connect naturally:
- Scene 1 establishes setting/character (wide shot)
- Middle scenes develop action (varied shots)
- Final scene provides resolution/impact (emotional close-up or powerful wide)

## OUTPUT FORMAT ##
Return JSON:
{
  "characterDescription": "Consistent character description used in ALL scenes",
  "visualStyle": "Overall visual style (lighting, color palette, atmosphere)",
  "scenes": [
    {
      "sceneNumber": 1,
      "prompt": "DETAILED 150-250 character prompt following template above",
      "mood": "emotional tone",
      "cameraStyle": "specific camera setup",
      "spatialNote": "brief note on spatial arrangement"
    }
  ]
}`

    const userPrompt = `Transform this script into ${numClips} CINEMATIC, PHYSICALLY ACCURATE scene prompts for Kling AI.

SCRIPT:
"""
${script}
"""

REQUIREMENTS:
- Video Duration: ${duration} seconds (${numClips} scenes × 10 seconds each)
- Each prompt: 150-250 characters, highly detailed
- Maintain CONSISTENT character appearance across ALL scenes
- Ensure CORRECT physics and spatial relationships
- Use PROFESSIONAL cinematography language
- Include specific LIGHTING and ATMOSPHERE details

⚠️ CRITICAL: If there's action/combat, ensure the THREAT is positioned correctly relative to the HERO (enemies in front if attacking, behind if being chased).

Return ONLY valid JSON with exactly ${numClips} scenes.`

    const result = await generateText(userPrompt, systemMessage)

    if (!result.success) {
      throw new Error(result.error || 'AI scene prompt generation failed')
    }

    // Parse AI response to extract scene prompts array
    let scenePrompts = []
    let characterDescription = ''
    let visualStyle = ''
    
    try {
      // Clean up the response to extract JSON
      let cleanedResponse = result.content
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim()
      
      // Find the JSON array or object
      const jsonMatch = cleanedResponse.match(/[\[{][\s\S]*[\]}]/)
      if (jsonMatch) {
        cleanedResponse = jsonMatch[0]
      }
      
      const parsed = JSON.parse(cleanedResponse)
      
      // Handle new format with characterDescription and visualStyle
      if (parsed.scenes && Array.isArray(parsed.scenes)) {
        characterDescription = parsed.characterDescription || ''
        visualStyle = parsed.visualStyle || ''
        scenePrompts = parsed.scenes
      } else if (Array.isArray(parsed)) {
        // Handle old format (direct array)
        // Check if first item has nested structure
        if (parsed[0]?.scenes) {
          characterDescription = parsed[0].characterDescription || ''
          visualStyle = parsed[0].visualStyle || ''
          scenePrompts = parsed[0].scenes
        } else {
          scenePrompts = parsed
        }
      } else {
        throw new Error('Response is not in expected format')
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
      
      // Generate contextual fallback prompts based on the script
      const fallbackPrompts = generateFallbackPrompts(script, numClips - scenePrompts.length)
      scenePrompts = [...scenePrompts, ...fallbackPrompts]
    }

    // Ensure we have exactly the right number
    scenePrompts = scenePrompts.slice(0, numClips)

    // Add enhanced cinematic suffix to each prompt, including consistency info
    const consistencyPrefix = characterDescription ? `${characterDescription}, ` : ''
    const stylePrefix = visualStyle ? `${visualStyle} style, ` : ''
    
    const enhancedPrompts = scenePrompts.map(scene => ({
      ...scene,
      characterDescription,
      visualStyle,
      fullPrompt: `${consistencyPrefix}${scene.prompt}, ${scene.cameraStyle}, ${scene.mood} mood, ${stylePrefix}cinematic lighting, professional quality, 4K resolution`
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
