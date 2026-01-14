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

### Scene Flow (from {sceneCount} total scenes):
1. **Scene 1 - Site Preparation**: Empty land/desert/forest with surveyors marking ground, small teams arriving with basic tools, minimal structures
2. **Middle Scenes - Progressive Construction**: 
   - Foundation work with workers digging, laying stones/concrete
   - Frame/structure rising with scaffolding, workers climbing, materials being hoisted
   - Walls/features being built with teams of workers, period-appropriate construction methods
   - Details being added, more workers, structures becoming recognizable
3. **Final Scene - Completion/Modern Day**: Finished structure with maintenance workers, visitors, fully operational

### MANDATORY Visual Elements for EACH Scene:
- **WORKERS/PEOPLE**: Always show 5-20+ small human figures actively working or walking. Describe their actions (laying bricks, carrying materials, supervising, climbing scaffolding)
- **CONSTRUCTION ACTIVITY**: Show ongoing building work - not just static structures. Describe cranes lifting, cement being poured, stones being placed
- **AERIAL PERSPECTIVE**: Bird's-eye or high-angle view looking down at the construction site
- **TIME PERIOD ACCURACY**: If showing historical evolution, use period-appropriate construction methods (ancient = manual labor, modern = machinery)
- **ENVIRONMENTAL CONTEXT**: Show surroundings changing too - roads forming, auxiliary buildings appearing, landscaping

### Motion Prompt Guidelines:
- Describe 2-3 specific movements: "workers walking between structures", "crane arm slowly rotating", "dust particles floating in morning light"
- Include natural motion: shadows moving, clouds drifting, birds flying
- Describe morphing/growth: "building progressively rising", "walls expanding outward"

## EXAMPLE for "Pyramids of Giza Construction":

Scene 1 (Site Preparation):
- visualPrompt: "Aerial bird's-eye view of golden Egyptian desert at dawn. Workers in white linen garments marking the ground with stakes and ropes in a perfect square pattern. Small groups of laborers arriving with wooden sleds carrying limestone blocks. Supervisors with scrolls directing teams. Ox carts bringing supplies on dusty paths. Dramatic morning light casting long shadows. Photorealistic, cinematic, 8K quality."
- motionPrompt: "Workers walking across the sand carrying tools, ox carts slowly moving along paths, supervisors pointing and directing, dust clouds rising from the ground, morning shadows slowly shifting."

Scene 3 (Construction Progress):
- visualPrompt: "Aerial view of partially built pyramid, approximately 30% complete. Massive stone blocks being hauled up wooden ramps by teams of 50+ workers pulling ropes. Scaffolding and wooden support structures around the base. Workers on different levels positioning stones. Camps and workshops surrounding the construction site. Desert sun creating sharp shadows. Thousands of workers like ants on the structure. Ultra-realistic architectural construction scene."
- motionPrompt: "Teams of workers slowly pulling stone blocks up ramps, workers on scaffolding positioning stones, people moving between camps and construction site, dust swirling around active work areas."

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
  const count = parseInt(sceneCount) || 4
  const scenes = []
  
  // Construction stages with realistic progression
  const stages = [
    {
      title: 'Site Preparation',
      suffix: 'empty land being surveyed, workers marking ground with stakes, small teams arriving with basic tools and equipment, surveyors with measuring instruments',
      motion: 'workers walking across the terrain, surveyors moving equipment, dust rising from ground disturbance'
    },
    {
      title: 'Foundation Work',
      suffix: 'foundation being laid, workers digging and placing stones/concrete, scaffolding being erected, building materials stacked around site, teams of laborers at work',
      motion: 'workers lifting and placing materials, people walking between supply areas and construction zone, shadows moving across the site'
    },
    {
      title: 'Structure Rising',
      suffix: 'walls and frame rising up, scaffolding covering the structure, workers on multiple levels, cranes or pulleys lifting materials, progressive construction visible',
      motion: 'construction equipment operating, workers climbing scaffolding, materials being hoisted upward, activity across the entire site'
    },
    {
      title: 'Detailed Construction',
      suffix: 'detailed features being added, more refined work, artisans and craftsmen at work, structure becoming recognizable, surrounding infrastructure developing',
      motion: 'skilled workers adding details, people moving around the nearly complete structure, finishing touches being applied'
    },
    {
      title: 'Final Completion',
      suffix: 'completed magnificent structure, workers doing final touches, visitors and pilgrims arriving, fully operational and populated, surrounding city/area developed',
      motion: 'people walking around completed structure, final construction elements being placed, celebratory atmosphere, normal activity resuming'
    },
    {
      title: 'Modern Day Glory',
      suffix: 'modern fully developed state, massive crowds or modern infrastructure, nighttime illumination, aerial view showing full scale and surrounding development',
      motion: 'thousands of people moving like waves, modern vehicles, city lights twinkling, dramatic time-lapse effect'
    }
  ]
  
  for (let i = 0; i < count; i++) {
    const stageIndex = Math.floor(i / count * stages.length)
    const stage = stages[Math.min(stageIndex, stages.length - 1)]
    const isFirst = i === 0
    const isLast = i === count - 1
    
    scenes.push({
      title: stage.title,
      visualPrompt: `Aerial bird's-eye view of ${topic}. ${isFirst ? 'Beginning stage:' : isLast ? 'Final completed stage:' : `Construction stage ${i + 1}:`} ${stage.suffix}. Ultra-realistic, cinematic golden hour lighting, photorealistic 8K quality, drone perspective looking down at the construction site, atmospheric dust particles in air, dramatic shadows.`,
      motionPrompt: `${stage.motion}, natural environmental movement like wind effects and shifting light`,
      duration: 5
    })
  }
  
  return scenes
}
