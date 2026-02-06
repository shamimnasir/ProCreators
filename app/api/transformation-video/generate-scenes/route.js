import { NextResponse } from 'next/server'
import { spawn } from 'child_process'
import path from 'path'
import { enforceRateLimit } from '@/lib/rate-limiter'

export const maxDuration = 60
export const dynamic = 'force-dynamic'

// Scene generation prompt template for Progressive Transformation videos
// CRITICAL: All scenes must maintain VISUAL CONSISTENCY - same location, same viewpoint, same composition
const SCENE_GENERATION_PROMPT = `You are an expert AI video director specializing in TRANSFORMATION TIMELAPSE videos.

CRITICAL REQUIREMENT: ALL SCENES MUST SHOW THE EXACT SAME LOCATION FROM THE EXACT SAME CAMERA ANGLE.
The only thing that changes between scenes is the PROGRESS of the transformation.
Think of it like a security camera that stays fixed - the viewpoint NEVER moves, only the scene transforms.

TOPIC: {topic}
THEME: {theme}
TOTAL SCENES: {sceneCount}

## VISUAL CONSISTENCY RULES (MANDATORY FOR ALL SCENES)

Before generating scenes, first establish these FIXED elements that MUST appear identically in EVERY scene:

1. **FIXED CAMERA POSITION**: "Aerial drone view from 150 meters height, camera pointing straight down at 45-degree angle, facing [direction]"
2. **FIXED LANDMARK**: Identify ONE central landmark/focal point that appears in the CENTER of every frame
3. **FIXED COMPOSITION**: Same buildings/structures in same positions - left side, right side, background, foreground
4. **FIXED SKY/HORIZON**: Same sky position, same horizon line, same time of day across all scenes
5. **FIXED FRAME BOUNDARIES**: Same canal/road/path visible on [left/right], same distant buildings on horizon

## OUTPUT FORMAT
Return a JSON array with exactly {sceneCount} scene objects. Each scene MUST have:

{
  "title": "Stage title",
  "visualPrompt": "Start with the EXACT SAME camera/composition description, then describe what has CHANGED in this stage",
  "motionPrompt": "Describe movement within this fixed frame",
  "duration": 5
}

## SCENE PROMPT STRUCTURE (EVERY SCENE MUST FOLLOW THIS)

Each visualPrompt MUST start with this IDENTICAL prefix (customize based on topic):
"[FIXED] Aerial view from 150 meters, looking down at 45-degree angle at [CENTRAL LANDMARK]. [LEFT SIDE]: [fixed element]. [RIGHT SIDE]: [fixed element]. [BACKGROUND]: [fixed element]. [FOREGROUND]: [fixed element]. Golden hour lighting, photorealistic 8K. [/FIXED] [CHANGES IN THIS SCENE]: ..."

## EXAMPLE - Slum to Italian City Transformation (6 scenes):

FIRST, establish the FIXED FRAME:
- Camera: Aerial 150m, 45-degree down angle, facing north
- Center: Main canal running north-south through frame
- Left: Row of old buildings/huts
- Right: Open area with garbage dumps
- Background: Distant slum buildings, hazy sky
- Foreground: Bridge crossing the canal

Scene 1 - Abandoned State:
visualPrompt: "[FIXED] Aerial view from 150 meters, looking down at 45-degree angle at a dirty canal running vertically through the center of frame. LEFT SIDE: Dilapidated slum huts with rusted tin roofs. RIGHT SIDE: Open garbage dump with debris piles. BACKGROUND: Dense slum buildings fading into smog. FOREGROUND: Broken wooden bridge crossing the canal. Overcast sky, murky water in canal. [/FIXED] [THIS SCENE]: The location in its abandoned, dirty state. Stagnant green water in canal, garbage floating, broken structures, graffiti on walls, weeds growing everywhere, muddy paths, scattered debris."

Scene 2 - Cleanup Begins:
visualPrompt: "[FIXED] Aerial view from 150 meters, looking down at 45-degree angle at a dirty canal running vertically through the center of frame. LEFT SIDE: Dilapidated slum huts with rusted tin roofs. RIGHT SIDE: Open garbage dump with debris piles. BACKGROUND: Dense slum buildings fading into smog. FOREGROUND: Broken wooden bridge crossing the canal. Overcast sky. [/FIXED] [THIS SCENE]: Workers (30+) in orange vests cleaning the area. Garbage trucks on RIGHT removing debris. Workers with brooms sweeping paths. Canal water being drained. Scaffolding appearing on LEFT buildings. Construction barriers set up. Some garbage cleared, ground visible."

Scene 3 - Renovation Active:
visualPrompt: "[FIXED] Aerial view from 150 meters, looking down at 45-degree angle at a canal running vertically through the center of frame. LEFT SIDE: Buildings now covered in scaffolding. RIGHT SIDE: Former garbage area now flattened construction site. BACKGROUND: Dense buildings. FOREGROUND: Old bridge being replaced. Clearer sky emerging. [/FIXED] [THIS SCENE]: Major renovation in progress. LEFT buildings getting new facades - workers on scaffolding painting walls terracotta orange. Canal walls being reinforced with stone. New cobblestone paths being laid. RIGHT side has construction crew pouring foundations. Bridge being rebuilt with new stone arches. 50+ workers visible."

Scene 4 - Structures Taking Shape:
visualPrompt: "[FIXED] Aerial view from 150 meters, looking down at 45-degree angle at a canal running vertically through the center of frame. LEFT SIDE: Buildings now showing Italian-style facades. RIGHT SIDE: New buildings under construction. BACKGROUND: Renovated buildings visible. FOREGROUND: New stone bridge nearly complete. Blue sky with white clouds. [/FIXED] [THIS SCENE]: Transformation becoming visible. LEFT buildings now have terracotta walls, green shutters, flower boxes. Canal has clean blue water, stone walls complete. RIGHT side has new Italian-style buildings rising, scaffolding still present. New trees being planted. Street lamps being installed. Workers adding finishing touches."

Scene 5 - Near Completion:
visualPrompt: "[FIXED] Aerial view from 150 meters, looking down at 45-degree angle at a canal running vertically through the center of frame. LEFT SIDE: Beautiful Italian buildings with terracotta and shutters. RIGHT SIDE: New piazza with fountain. BACKGROUND: Fully renovated cityscape. FOREGROUND: Elegant stone bridge with decorative railings. Clear blue sky. [/FIXED] [THIS SCENE]: Almost complete Italian transformation. Gondolas in the clean canal. Cobblestone streets finished. LEFT has cafes with outdoor seating, flower boxes on every window. RIGHT has completed piazza with marble fountain. Trees fully planted with leaves. Workers doing final touch-ups. Some tourists beginning to appear."

Scene 6 - Completed Transformation:
visualPrompt: "[FIXED] Aerial view from 150 meters, looking down at 45-degree angle at a canal running vertically through the center of frame. LEFT SIDE: Vibrant Italian buildings with terracotta walls and green shutters. RIGHT SIDE: Beautiful piazza with active fountain. BACKGROUND: Stunning Italian cityscape. FOREGROUND: Ornate stone bridge with people crossing. Golden sunset light. [/FIXED] [THIS SCENE]: Complete transformation to Italian paradise. Crystal clear canal with multiple gondolas and tourists. LEFT buildings have bustling cafes, colorful awnings, flower boxes overflowing. RIGHT piazza has people enjoying the fountain, outdoor restaurants. The exact same location, now unrecognizable as a former slum. Warm golden hour lighting, romantic atmosphere."

## KEY RULES:
1. The [FIXED] section MUST be nearly identical in ALL scenes - only the [THIS SCENE] section changes
2. Same landmarks must be visible in same positions across all scenes
3. Camera angle and height NEVER changes
4. Sky/weather can gradually improve (overcast → clear) but horizon position stays same
5. Transformation is PROGRESSIVE - each scene shows MORE progress than the last
6. Workers visible in middle scenes (2-5), completion scene (6) shows results

NOW generate exactly {sceneCount} scenes for: "{topic}"
Establish YOUR fixed frame elements first, then create scenes that maintain perfect visual consistency.
Return ONLY the JSON array with all required fields. No other text.`

export async function POST(request) {
  try {
    // SECURITY: Rate limiting for content generation
    const rateLimitCheck = await enforceRateLimit(request, 'content_generate')
    if (rateLimitCheck.limited) {
      return rateLimitCheck.response
    }

    const { topic, theme, sceneCount } = await request.json()
    
    if (!topic) {
      return NextResponse.json({ success: false, error: 'Topic is required' }, { status: 400 })
    }
    
    }...`)
    
    // Build the prompt for progressive construction transformation
    const prompt = SCENE_GENERATION_PROMPT
      .replace(/{topic}/g, topic)
      .replace(/{theme}/g, theme || 'custom')
      .replace(/{sceneCount}/g, sceneCount || 4)
    
    // Call LLM using the existing Python script
    const scriptPath = path.join(process.cwd(), 'scripts', 'llm_call.py')
    
    const inputData = JSON.stringify({
      prompt,
      system_prompt: 'You are an expert cinematic video director. Generate detailed scene descriptions in valid JSON format only.'
    })
    
    const result = await new Promise((resolve, reject) => {
      const pythonProcess = spawn('/root/.venv/bin/python3', [scriptPath, inputData], {
        env: { ...process.env },
        cwd: process.cwd()
      })
      
      let stdout = ''
      let stderr = ''
      
      pythonProcess.stdout.on('data', (data) => {
        stdout += data.toString()
      })
      
      pythonProcess.stderr.on('data', (data) => {
        stderr += data.toString()
      })
      
      pythonProcess.on('close', (code) => {
        if (code !== 0) {
          console.error('[Transformation] LLM call failed:', stderr)
          reject(new Error(stderr || 'LLM call failed'))
        } else {
          try {
            const parsed = JSON.parse(stdout)
            resolve(parsed.content || parsed.response || stdout.trim())
          } catch {
            resolve(stdout.trim())
          }
        }
      })
      
      pythonProcess.on('error', (err) => {
        reject(err)
      })
    })
    
    // Parse the JSON response
    let scenes = []
    try {
      // Try to extract JSON array from the response
      const jsonMatch = result.match(/\[\s*\{[\s\S]*\}\s*\]/)
      if (jsonMatch) {
        scenes = JSON.parse(jsonMatch[0])
      } else {
        // Try parsing the whole response
        scenes = JSON.parse(result)
      }
      
      // Ensure we have an array
      if (!Array.isArray(scenes)) {
        scenes = [scenes]
      }
      
      } catch (parseError) {
      console.error('[Transformation] Failed to parse LLM response:', parseError)
      )
      
      // Generate fallback scenes
      scenes = generateFallbackScenes(topic, sceneCount, language)
    }
    
    return NextResponse.json({
      success: true,
      scenes,
      topic,
      theme
    })
    
  } catch (error) {
    console.error('[Transformation] Scene generation error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to generate scenes' },
      { status: 500 }
    )
  }
}

// Fallback scene generator with VISUAL CONSISTENCY
function generateFallbackScenes(topic, sceneCount, language) {
  const count = parseInt(sceneCount) || 8
  const scenes = []
  
  // Fixed frame description that stays CONSISTENT across all scenes
  const fixedFrame = `[FIXED] Aerial view from 150 meters height, looking down at 45-degree angle at the main subject centered in frame. Same camera position, same composition, same landmarks in same positions throughout. Golden hour lighting, photorealistic 8K quality. [/FIXED]`
  
  // Transformation stages with progressive changes
  const stages = [
    {
      title: 'Initial State',
      changes: 'The location in its original/abandoned state. Showing the "before" condition that will be transformed. No workers yet, just the raw starting point.',
      motion: 'slight wind movement, dust particles, ambient atmosphere'
    },
    {
      title: 'Cleanup Begins',
      changes: 'First workers (20+) arriving with basic tools and equipment. Initial cleanup activity starting. Debris being cleared, ground being prepared. Construction barriers being set up.',
      motion: 'workers walking and setting up, trucks arriving, equipment being unloaded'
    },
    {
      title: 'Foundation Work',
      changes: 'Foundation work in progress. Workers (30+) digging, laying base materials. Scaffolding starting to appear. Ground level transformation visible.',
      motion: 'workers digging and laying materials, wheelbarrows moving, scaffolding being erected'
    },
    {
      title: 'Structure Rising',
      changes: 'Main structures taking shape. Scaffolding covering active work areas. Workers (40+) on multiple levels. Clear progress visible from initial state.',
      motion: 'construction crews working at height, materials being lifted, scaffolding activity'
    },
    {
      title: 'Major Progress',
      changes: 'Significant transformation visible. New surfaces, colors, structures emerging. Workers (50+) adding details. Original state becoming unrecognizable.',
      motion: 'painters working, finishing crews active, detail work in progress'
    },
    {
      title: 'Detail Work',
      changes: 'Fine details being added. Decorative elements appearing. Most heavy construction complete. Workers focusing on finishing touches.',
      motion: 'artisans adding details, cleanup crews working, final installations'
    },
    {
      title: 'Near Completion',
      changes: 'Almost complete transformation. Scaffolding being removed. Landscaping added. A few workers doing final touches. First visitors/users appearing.',
      motion: 'scaffolding coming down, final cleanup, people beginning to enjoy the space'
    },
    {
      title: 'Completed Transformation',
      changes: 'Complete transformation - unrecognizable from the starting point. Beautiful finished result. People enjoying the transformed space. The exact same location, now completely changed.',
      motion: 'people walking and enjoying, normal activity, beautiful atmospheric lighting'
    }
  ]
  
  // Generate scenes with consistent framing
  for (let i = 0; i < count; i++) {
    const stageIndex = Math.min(
      Math.floor((i / count) * stages.length),
      stages.length - 1
    )
    const stage = stages[stageIndex]
    const isFirst = i === 0
    const isLast = i === count - 1
    const progressPercent = Math.round((i / (count - 1)) * 100)
    
    scenes.push({
      title: isLast ? 'Complete Transformation' : isFirst ? 'Before - Starting Point' : `${stage.title} (${progressPercent}%)`,
      visualPrompt: `${fixedFrame} [THIS SCENE - ${topic}]: ${stage.changes} Maintaining exact same camera angle and composition as all other scenes. Same landmarks visible in same positions. Progress level: ${progressPercent}%.`,
      motionPrompt: `${stage.motion}, maintaining fixed camera position, only the scene content moves`,
      duration: 5
    })
  }
  
  return scenes
}
