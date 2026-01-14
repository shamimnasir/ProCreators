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
    const { topic, theme, sceneCount, language } = await request.json()
    
    if (!topic) {
      return NextResponse.json({ success: false, error: 'Topic is required' }, { status: 400 })
    }
    
    console.log(`[Transformation] Generating ${sceneCount} scenes for: ${topic.substring(0, 50)}...`)
    
    // Build the prompt
    const prompt = SCENE_GENERATION_PROMPT
      .replace(/{topic}/g, topic)
      .replace(/{theme}/g, theme || 'custom')
      .replace(/{sceneCount}/g, sceneCount || 4)
      .replace(/{language}/g, language === 'bn' ? 'Bengali' : language === 'hi' ? 'Hindi' : language === 'es' ? 'Spanish' : language === 'ar' ? 'Arabic' : 'English')
    
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

// Fallback scene generator
function generateFallbackScenes(topic, sceneCount, language) {
  const count = parseInt(sceneCount) || 4
  const scenes = []
  
  const transitions = ['Hard Cut', 'Timelapse Morph', 'Match Cut', 'Dissolve', 'Zoom Transition']
  const durations = [4, 5, 6, 5, 6, 4]
  
  for (let i = 0; i < count; i++) {
    const isFirst = i === 0
    const isLast = i === count - 1
    
    scenes.push({
      title: isFirst ? 'The Beginning' : isLast ? 'The Transformation Complete' : `Stage ${i + 1}`,
      visualPrompt: isFirst 
        ? `Opening shot of ${topic}. Establish the original state. Cinematic wide shot, dramatic lighting, atmospheric fog, early morning golden hour light.`
        : isLast
        ? `Final reveal of transformed ${topic}. Triumphant wide shot, brilliant lighting, modern and magnificent, aerial view pulling back to reveal full scale.`
        : `${topic} in transition stage ${i}. Show progressive change, medium shot with dramatic lighting, time passing effect, atmospheric particles.`,
      narration: isFirst 
        ? (language === 'bn' ? 'এখানেই সব শুরু হয়েছিল...' : language === 'hi' ? 'यहीं से सब शुरू हुआ...' : 'This is where it all began...')
        : isLast
        ? (language === 'bn' ? 'এবং এখন, রূপান্তর সম্পূর্ণ।' : language === 'hi' ? 'और अब, परिवर्तन पूर्ण है।' : 'And now, the transformation is complete.')
        : (language === 'bn' ? 'সময়ের সাথে পরিবর্তন আসে...' : language === 'hi' ? 'समय के साथ बदलाव आता है...' : 'Change comes with time...'),
      transition: transitions[i % transitions.length],
      duration: durations[i % durations.length]
    })
  }
  
  return scenes
}
