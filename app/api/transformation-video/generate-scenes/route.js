import { NextResponse } from 'next/server'
import { spawn } from 'child_process'
import path from 'path'

export const maxDuration = 60
export const dynamic = 'force-dynamic'

// Scene generation prompt template for Progressive Construction/Transformation videos
// Inspired by viral transformation videos like Mecca/Kaaba evolution
const SCENE_GENERATION_PROMPT = `You are an expert AI video director specializing in PROGRESSIVE CONSTRUCTION and TRANSFORMATION videos.

Your goal is to create scene prompts that show realistic BUILDING/CONSTRUCTION PROCESS - where each stage shows:
- Workers, laborers, builders actively constructing
- Equipment, tools, scaffolding, cranes, materials
- The structure progressively being built from ground up
- People interacting with the construction (architects, workers, visitors)

TOPIC: {topic}
THEME: {theme}
TOTAL SCENES: {sceneCount}

## OUTPUT FORMAT
Return a JSON array with exactly {sceneCount} scene objects. Each scene MUST have:

{
  "title": "Stage title (e.g., 'Foundation Work', 'Frame Construction', 'Final Completion')",
  "visualPrompt": "EXTREMELY DETAILED visual description showing ACTIVE CONSTRUCTION IN PROGRESS. Include specific details about: workers in period-appropriate clothing performing tasks, construction equipment/tools being used, materials (stone, wood, bricks, steel, concrete), scaffolding/supports, weather/lighting, aerial bird's-eye view angle. Make it look like a realistic construction time-lapse moment.",
  "motionPrompt": "Describe the MOVEMENT in this scene: workers moving, cranes operating, materials being lifted, people walking, dust/particles moving, shadows shifting. This will be used to generate realistic video motion.",
  "duration": 5
}

## CRITICAL CONSTRUCTION SCENE REQUIREMENTS

### Scene Flow for {sceneCount} scenes (MORE SCENES = MORE DETAILED PROGRESSION):
Distribute scenes evenly across these construction phases:

**Phase 1 - Site Preparation (1-2 scenes):**
- Empty land with surveyors marking ground
- First workers arriving with basic tools
- Ground breaking and excavation beginning

**Phase 2 - Foundation (1-2 scenes):**
- Foundation trenches being dug
- Concrete/stone being poured/laid
- Underground structures taking shape

**Phase 3 - Early Structure (2-3 scenes):**
- First walls/columns rising
- Scaffolding being erected
- Basic frame/skeleton visible

**Phase 4 - Main Construction (2-3 scenes):**
- Major structures reaching height
- Multiple work crews on different levels
- Features becoming recognizable

**Phase 5 - Detail Work (1-2 scenes):**
- Fine details being added
- Surface finishing and decoration
- Near-completion state

**Phase 6 - Completion (1 scene):**
- Final touches being made
- Visitors/users arriving
- Modern day glory (if historical)

### MANDATORY Visual Elements for EACH Scene:
- **WORKERS/PEOPLE**: Always show 10-50+ small human figures actively working. Describe their specific actions (laying bricks, carrying materials, supervising, climbing scaffolding)
- **CONSTRUCTION ACTIVITY**: Show ongoing building work - NOT static structures. Describe equipment operating, materials being moved
- **AERIAL PERSPECTIVE**: Always use bird's-eye or high-angle drone view looking DOWN at the construction site
- **TIME PERIOD ACCURACY**: Match construction methods to era (ancient = manual labor, modern = machinery)
- **PROGRESSIVE CHANGE**: Each scene should show VISIBLE PROGRESS from the previous scene

### Motion Prompt Guidelines:
- Always include: "workers moving across the site", "construction activity in progress"
- Add scene-specific motion: "cranes rotating", "materials being lifted", "cement mixers churning"
- Include ambient motion: "dust particles in sunlight", "shadows shifting", "birds flying overhead"

## EXAMPLE for 8-scene "Holy Kaaba Construction":

Scene 1: "Empty desert with surveyors marking the sacred foundation, small camp being set up"
Scene 2: "Workers digging foundation trenches in the sand, stone blocks arriving on wooden sleds"
Scene 3: "Foundation stones being laid carefully, first courses of the walls visible"
Scene 4: "Walls rising to waist height, scaffolding going up, more workers arriving"
Scene 5: "Structure taking recognizable cubic shape, black cloth draped over parts"
Scene 6: "Main structure complete, workers adding gold details and inscriptions"
Scene 7: "Early courtyard being paved, first pilgrims arriving to witness completion"
Scene 8: "Modern massive complex with millions of pilgrims, aerial view of illuminated Masjid al-Haram"

NOW generate exactly {sceneCount} scenes for: "{topic}"
Return ONLY the JSON array with all required fields. No other text.`

export async function POST(request) {
  try {
    const { topic, theme, sceneCount } = await request.json()
    
    if (!topic) {
      return NextResponse.json({ success: false, error: 'Topic is required' }, { status: 400 })
    }
    
    console.log(`[Transformation] Generating ${sceneCount} progressive construction scenes for: ${topic.substring(0, 50)}...`)
    
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
      
      console.log(`[Transformation] Generated ${scenes.length} scenes`)
    } catch (parseError) {
      console.error('[Transformation] Failed to parse LLM response:', parseError)
      console.log('[Transformation] Raw response:', result.substring(0, 500))
      
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

// Fallback scene generator for Progressive Construction videos
function generateFallbackScenes(topic, sceneCount, language) {
  const count = parseInt(sceneCount) || 8
  const scenes = []
  
  // Extended construction stages for 8-10+ scenes - more detailed progression
  const stages = [
    {
      title: 'Site Survey & Planning',
      suffix: 'empty land being surveyed, engineers with blueprints and surveying equipment, ground markers being placed, small camp being set up in the distance',
      motion: 'surveyors walking with equipment, flags being planted, workers pointing and planning, dust blowing across empty ground'
    },
    {
      title: 'Ground Breaking',
      suffix: 'excavation beginning, workers digging first trenches with picks and shovels, wheelbarrows carrying dirt away, foundation outline visible in the earth',
      motion: 'workers swinging tools, dirt being thrown, wheelbarrows rolling, supervisors watching and directing'
    },
    {
      title: 'Foundation Work',
      suffix: 'deep foundation trenches visible, workers laying first stones or pouring concrete, reinforcement materials being positioned, foundation taking shape',
      motion: 'workers placing stones carefully, concrete being poured, people walking along trenches, materials being lowered down'
    },
    {
      title: 'Base Structure Rising',
      suffix: 'first walls and columns rising from foundation, basic scaffolding being erected around the structure, building materials stacked nearby, work crews busy',
      motion: 'scaffolding being assembled, workers climbing ladders, blocks being lifted and placed, shadows lengthening'
    },
    {
      title: 'Walls Taking Shape',
      suffix: 'walls reaching waist height, multiple work crews on different sections, scaffolding surrounding the structure, clear outline of the building visible',
      motion: 'masons laying bricks/stones, mortar being applied, workers moving materials along scaffolding, dust particles in sunlight'
    },
    {
      title: 'Main Structure Rising',
      suffix: 'structure now at significant height, extensive scaffolding network, workers on multiple levels, cranes or pulleys lifting heavy materials, recognizable form emerging',
      motion: 'crane arms rotating, heavy loads being hoisted, workers on high scaffolds, construction activity across all levels'
    },
    {
      title: 'Reaching Full Height',
      suffix: 'structure approaching final height, top sections being built, workers at great heights, detailed features starting to appear, surrounding infrastructure developing',
      motion: 'workers placing final height materials, people looking up at progress, scaffolding crews adjusting supports, birds flying around structure'
    },
    {
      title: 'Exterior Finishing',
      suffix: 'exterior surfaces being finished, decorative elements being added, some scaffolding being removed, structure clearly recognizable, artisans adding details',
      motion: 'skilled craftsmen working on details, scaffolding sections being lowered, finishing materials being applied, cleanup crews working'
    },
    {
      title: 'Final Touches',
      suffix: 'nearly complete structure with workers doing final details, most scaffolding removed, landscaping beginning around the site, first visitors appearing',
      motion: 'final detail work, gardeners planting, visitors walking and admiring, ceremonial preparations'
    },
    {
      title: 'Grand Completion',
      suffix: 'magnificent completed structure in full glory, crowds gathering, maintenance workers present, fully operational, stunning aerial view of the finished masterpiece',
      motion: 'crowds moving like waves, celebration activity, normal operations beginning, dramatic lighting effects'
    },
    {
      title: 'Modern Era Splendor',
      suffix: 'modern day view with full surrounding development, thousands of visitors, modern infrastructure, nighttime illumination showing the structure in its full contemporary glory',
      motion: 'massive crowds flowing, modern vehicles moving, city lights twinkling, time-lapse of day to night'
    }
  ]
  
  // Distribute stages evenly across requested scene count
  for (let i = 0; i < count; i++) {
    // Map scene index to stage index proportionally
    const stageIndex = Math.min(
      Math.floor((i / count) * stages.length),
      stages.length - 1
    )
    const stage = stages[stageIndex]
    const isFirst = i === 0
    const isLast = i === count - 1
    const sceneNum = i + 1
    
    // Create a unique description for each scene
    const progressPercent = Math.round((i / (count - 1)) * 100)
    
    scenes.push({
      title: isLast ? 'Magnificent Completion' : isFirst ? 'The Beginning' : stage.title,
      visualPrompt: `Aerial bird's-eye view of ${topic}. ${
        isFirst ? 'Day 1 - Site preparation beginning:' : 
        isLast ? 'Final completed masterpiece:' : 
        `Construction progress ${progressPercent}% - ${stage.title}:`
      } ${stage.suffix}. Ultra-realistic, cinematic golden hour lighting, photorealistic 8K quality, drone perspective looking down at the construction site, 50+ workers visible as small figures, atmospheric dust particles in warm sunlight, dramatic long shadows, epic scale.`,
      motionPrompt: `${stage.motion}, natural environmental movement, dust particles floating in golden light, shadows slowly shifting across the scene, birds flying overhead`,
      duration: 5
    })
  }
  
  return scenes
}
