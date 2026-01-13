import { NextResponse } from 'next/server'
import { spawn } from 'child_process'
import path from 'path'

export const maxDuration = 60
export const dynamic = 'force-dynamic'

// Scene generation prompt template
const SCENE_GENERATION_PROMPT = `You are an expert cinematic video director specializing in transformation and evolution videos.

Your task is to create {sceneCount} sequential scenes that show a compelling transformation story.

TOPIC: {topic}
THEME: {theme}
LANGUAGE: {language}

## OUTPUT FORMAT
Return a JSON array with exactly {sceneCount} scene objects. Each scene should have:

{
  "title": "Short scene title",
  "visualPrompt": "Detailed visual description for AI image/video generation. Include: camera angle, lighting, mood, specific visual elements, time of day, atmosphere. Be cinematic and specific.",
  "narration": "Brief narration text for this scene (1-2 sentences in {language})",
  "transition": "Transition type to next scene (Hard Cut, Match Cut, Timelapse Morph, Dissolve, Zoom Transition)",
  "duration": "Suggested duration in seconds (2-8)"
}

## SCENE STRUCTURE GUIDELINES
1. Scene 1: Opening - Establish the "before" state dramatically
2. Middle Scenes: Show progressive transformation stages
3. Final Scene: Reveal the "after" state with impact

## VISUAL STYLE REQUIREMENTS
- Ultra-realistic, cinematic lighting
- Consistent visual style across all scenes
- Dramatic camera angles (aerial, low angle, tracking)
- Atmospheric elements (fog, particles, light rays)
- Smooth transition logic between scenes

## EXAMPLE TRANSITIONS
- Hard Cut: Dramatic scene change
- Match Cut: Visual element carries between scenes (stone → stone)
- Timelapse Morph: Time acceleration effect
- Dissolve: Soft blend between eras
- Zoom Transition: Camera pushes into detail, emerges in new scene

Generate exactly {sceneCount} scenes now. Return ONLY the JSON array, no other text.`

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
    const envVars = {
      ...process.env,
      PATH: `/usr/local/bin:/usr/bin:/bin:${process.env.PATH || ''}`,
      EMERGENT_LLM_KEY: process.env.EMERGENT_LLM_KEY
    }
    
    const result = await new Promise((resolve, reject) => {
      const pythonProcess = spawn('python3', [scriptPath, prompt], {
        env: envVars,
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
          resolve(stdout.trim())
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
