import { NextResponse } from 'next/server'
import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js'

export const dynamic = 'force-dynamic'

// Pre-selected voices that work well for Bangladeshi Bengali
// These are ElevenLabs multilingual voices that support Bengali language
const RECOMMENDED_BENGALI_VOICES = [
  {
    voice_id: 'pNInz6obpgDQGcFmaJgB',
    name: 'Adam (Male)',
    category: 'premade',
    description: 'Deep, authoritative male voice - great for storytelling',
    labels: { accent: 'neutral', age: 'middle-aged', gender: 'male' }
  },
  {
    voice_id: 'EXAVITQu4vr4xnSDxMaL',
    name: 'Sarah (Female)',
    category: 'premade',
    description: 'Warm, friendly female voice - perfect for narratives',
    labels: { accent: 'neutral', age: 'young', gender: 'female' }
  },
  {
    voice_id: 'Xb7hH8MSUJpSbSDYk0k2',
    name: 'Alice (Female)',
    category: 'premade',
    description: 'Clear, professional female voice - excellent for educational content',
    labels: { accent: 'neutral', age: 'middle-aged', gender: 'female' }
  },
  {
    voice_id: 'onwK4e9ZLuTAKqWW03F9',
    name: 'Daniel (Male)',
    category: 'premade',
    description: 'Confident, engaging male voice - ideal for tutorials',
    labels: { accent: 'neutral', age: 'middle-aged', gender: 'male' }
  },
  {
    voice_id: 'ThT5KcBeYPX3keUQqHPh',
    name: 'Dorothy (Female)',
    category: 'premade',
    description: 'Gentle, soothing female voice - great for storytelling',
    labels: { accent: 'neutral', age: 'young', gender: 'female' }
  },
  {
    voice_id: 'TxGEqnHWrfWFTfGW9XjX',
    name: 'Josh (Male)',
    category: 'premade',
    description: 'Energetic, youthful male voice - perfect for dynamic content',
    labels: { accent: 'neutral', age: 'young', gender: 'male' }
  }
]

export async function GET(request) {
  try {
    console.log('[Voice List] Fetching voices...')

    const elevenlabs = new ElevenLabsClient({
      apiKey: process.env.ELEVENLABS_API_KEY
    })

    // Get all voices from ElevenLabs (includes pre-made and cloned voices)
    const allVoices = await elevenlabs.voices.getAll()

    // Separate pre-made recommended voices and user's cloned voices
    const premadeVoiceIds = RECOMMENDED_BENGALI_VOICES.map(v => v.voice_id)
    
    const voices = {
      premade: RECOMMENDED_BENGALI_VOICES,
      cloned: allVoices.voices
        .filter(v => !premadeVoiceIds.includes(v.voice_id))
        .map(v => ({
          voice_id: v.voice_id,
          name: v.name,
          category: v.category || 'cloned',
          description: v.description || 'Your cloned voice',
          labels: v.labels || {}
        }))
    }

    console.log(`[Voice List] Found ${voices.premade.length} premade and ${voices.cloned.length} cloned voices`)

    return NextResponse.json({
      success: true,
      voices
    })

  } catch (error) {
    console.error('[Voice List] Error:', error)
    
    // Fallback to just recommended voices if API fails
    return NextResponse.json({
      success: true,
      voices: {
        premade: RECOMMENDED_BENGALI_VOICES,
        cloned: []
      },
      warning: 'Could not fetch custom voices, showing premade voices only'
    })
  }
}
