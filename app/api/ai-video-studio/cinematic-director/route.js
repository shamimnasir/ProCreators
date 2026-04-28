import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-middleware'
import { generateText } from '@/lib/gemini-text'
import { v4 as uuidv4 } from 'uuid'

// =====================================================
// CINEMATIC DIRECTOR API
// =====================================================
// POST: Generate a cinematic shot list from a story concept
// Input: { concept, style, numScenes, aspectRatio, characterDescription }
// Output: { scenes: [{ sceneNumber, shotType, cameraAngle, cameraMovement, lighting, action, prompt, duration }] }

const SHOT_TYPES = [
  'Extreme Wide Shot', 'Wide Shot', 'Full Shot', 'Medium Wide Shot',
  'Medium Shot', 'Medium Close-Up', 'Close-Up', 'Extreme Close-Up',
  'Over-the-Shoulder', 'Point of View', 'Low Angle', 'High Angle',
  'Dutch Angle', 'Bird\'s Eye View', 'Tracking Shot', 'Dolly Shot'
]

const CAMERA_MOVEMENTS = [
  'Static', 'Pan Left', 'Pan Right', 'Tilt Up', 'Tilt Down',
  'Dolly In', 'Dolly Out', 'Tracking', 'Crane Up', 'Crane Down',
  'Handheld', 'Steadicam', 'Zoom In', 'Zoom Out', 'Orbit',
  'Push In', 'Pull Back', 'Whip Pan', 'Slow Motion'
]

const STYLE_PRESETS = {
  cinematic: {
    name: 'Cinematic Film',
    prompt: 'cinematic film quality, anamorphic lens, shallow depth of field, dramatic lighting, 35mm film grain, color graded',
    palette: 'warm tones, rich contrast, deep shadows'
  },
  noir: {
    name: 'Film Noir',
    prompt: 'film noir style, high contrast black and white, dramatic shadows, venetian blinds lighting, moody atmosphere, mysterious',
    palette: 'black and white, high contrast, shadows'
  },
  scifi: {
    name: 'Sci-Fi Epic',
    prompt: 'science fiction, futuristic, neon lighting, holographic displays, cyberpunk atmosphere, volumetric fog, lens flares',
    palette: 'neon blue, purple, orange accents, dark backgrounds'
  },
  fantasy: {
    name: 'Fantasy Epic',
    prompt: 'epic fantasy, magical atmosphere, golden hour lighting, mystical fog, ethereal glow, enchanted environment',
    palette: 'warm gold, deep green, mystical purple'
  },
  documentary: {
    name: 'Documentary',
    prompt: 'documentary style, natural lighting, authentic feel, candid moments, real-world setting, observational',
    palette: 'natural tones, muted colors, authentic'
  },
  commercial: {
    name: 'Commercial/Ad',
    prompt: 'commercial quality, clean bright lighting, product-focused, modern aesthetic, premium feel, sharp focus',
    palette: 'clean whites, brand colors, bright and polished'
  },
  horror: {
    name: 'Horror/Thriller',
    prompt: 'horror atmosphere, low-key lighting, unsettling angles, fog, desaturated colors, tense mood, flickering lights',
    palette: 'desaturated, dark greens, sickly yellows, deep shadows'
  },
  anime: {
    name: 'Anime Style',
    prompt: 'anime style animation, vibrant colors, dynamic action lines, expressive characters, cel-shaded, Japanese animation quality',
    palette: 'vibrant, saturated, colorful, dynamic'
  }
}

export async function POST(request) {
  const authResult = await requireAuth(request)
  if (!authResult.authenticated) {
    return authResult.response
  }

  try {
    const body = await request.json()
    const {
      concept,
      style = 'cinematic',
      numScenes = 6,
      aspectRatio = '9:16',
      characterDescription = '',
      mood = '',
      setting = ''
    } = body

    if (!concept || concept.trim().length < 10) {
      return NextResponse.json({ success: false, error: 'Please provide a story concept (at least 10 characters)' }, { status: 400 })
    }

    const stylePreset = STYLE_PRESETS[style] || STYLE_PRESETS.cinematic
    const clampedScenes = Math.max(3, Math.min(20, parseInt(numScenes)))
    const orientation = aspectRatio === '16:9' ? 'landscape' : aspectRatio === '1:1' ? 'square' : 'portrait'

    // Generate cinematic shot list using Gemini
    const shotListPrompt = `You are an expert film director and cinematographer. Create a detailed shot-by-shot breakdown for a ${clampedScenes}-scene short film.

STORY CONCEPT: ${concept}
VISUAL STYLE: ${stylePreset.name} — ${stylePreset.prompt}
COLOR PALETTE: ${stylePreset.palette}
${characterDescription ? `MAIN CHARACTER: ${characterDescription}` : ''}
${mood ? `MOOD/TONE: ${mood}` : ''}
${setting ? `SETTING: ${setting}` : ''}
ORIENTATION: ${orientation} (${aspectRatio})
DURATION: Each scene is 6-10 seconds

For each scene, provide:
1. sceneNumber (1-${clampedScenes})
2. shotType: One of ${SHOT_TYPES.slice(0, 8).join(', ')}
3. cameraAngle: Describe the specific camera angle
4. cameraMovement: One of ${CAMERA_MOVEMENTS.slice(0, 12).join(', ')}
5. lighting: Specific lighting description
6. action: What happens in this scene (2-3 sentences)
7. visualPrompt: A detailed AI video generation prompt for this scene (include character details if any, environment, lighting, motion, style. Be very specific and visual. Max 200 words)
8. duration: Recommended duration in seconds (6-10)
9. transition: How this transitions to the next scene (cut, dissolve, match cut, whip pan, etc.)

IMPORTANT RULES:
- Each visualPrompt must be self-contained — describe the character fully every time (don't say "the same character", describe their appearance)
- Build dramatic tension: establish → develop → climax → resolve
- Use varied shot types for visual interest
- Camera movements should serve the story
- Include the style keywords: "${stylePreset.prompt}" in each prompt
${characterDescription ? `- Always include this exact character description in every scene prompt: "${characterDescription}"` : ''}

Return ONLY a JSON array of scene objects. No explanation, no markdown, just the array.`

    console.log('[CinematicDirector] Generating shot list for:', concept.slice(0, 80))
    const result = await generateText(shotListPrompt, 'You are an expert film director and cinematographer creating shot lists for cinematic AI video generation.')

    // Check if generateText succeeded
    if (!result || (result.success === false)) {
      const errorMsg = result?.error || 'AI text generation failed'
      console.error('[CinematicDirector] generateText failed:', errorMsg)
      return NextResponse.json({ success: false, error: `Failed to generate shot list: ${errorMsg}` }, { status: 500 })
    }

    // Parse the response - extract the text content
    let scenes = []
    try {
      const content = typeof result === 'string' ? result : (result.content || result.text || '')
      
      if (!content || content.length < 10) {
        console.error('[CinematicDirector] Empty or too short response from AI')
        return NextResponse.json({ success: false, error: 'AI returned empty response. Please try again.' }, { status: 500 })
      }

      // Extract JSON from potential markdown code blocks
      const jsonMatch = content.match(/\[[\s\S]*\]/)
      if (jsonMatch) {
        scenes = JSON.parse(jsonMatch[0])
      } else {
        scenes = JSON.parse(content)
      }
      
      if (!Array.isArray(scenes) || scenes.length === 0) {
        throw new Error('Response is not a valid scene array')
      }
    } catch (parseError) {
      console.error('[CinematicDirector] Failed to parse shot list:', parseError.message)
      return NextResponse.json({ success: false, error: 'Failed to parse shot list from AI. Please try again.' }, { status: 500 })
    }

    // Validate and enhance scenes
    const enhancedScenes = scenes.map((scene, idx) => ({
      id: uuidv4(),
      sceneNumber: idx + 1,
      shotType: scene.shotType || 'Medium Shot',
      cameraAngle: scene.cameraAngle || 'Eye level',
      cameraMovement: scene.cameraMovement || 'Static',
      lighting: scene.lighting || stylePreset.prompt,
      action: scene.action || '',
      visualPrompt: `${scene.visualPrompt || scene.action || concept}, ${stylePreset.prompt}`,
      duration: Math.max(4, Math.min(12, parseInt(scene.duration) || 8)),
      transition: scene.transition || 'cut',
      status: 'pending', // pending, generating, complete, error
      videoUrl: null,
      thumbnailUrl: null
    }))

    // Calculate estimated credits
    const totalDuration = enhancedScenes.reduce((sum, s) => sum + s.duration, 0)
    const estimatedCredits = Math.ceil((totalDuration / 30) * 110) // Seedance rate

    return NextResponse.json({
      success: true,
      shotList: {
        id: uuidv4(),
        concept,
        style,
        stylePreset: stylePreset.name,
        aspectRatio,
        characterDescription,
        scenes: enhancedScenes,
        totalScenes: enhancedScenes.length,
        totalDuration,
        estimatedCredits,
        model: 'seedance-1.5-pro'
      },
      stylePresets: STYLE_PRESETS
    })

  } catch (error) {
    console.error('Cinematic Director error:', error)
    return NextResponse.json({ success: false, error: 'Failed to create cinematic plan' }, { status: 500 })
  }
}

// GET: Return available style presets and configuration
export async function GET() {
  return NextResponse.json({
    success: true,
    stylePresets: STYLE_PRESETS,
    shotTypes: SHOT_TYPES,
    cameraMovements: CAMERA_MOVEMENTS,
    config: {
      minScenes: 3,
      maxScenes: 20,
      defaultScenes: 6,
      aspectRatios: ['16:9', '9:16', '1:1'],
      defaultModel: 'seedance-1.5-pro'
    }
  })
}
