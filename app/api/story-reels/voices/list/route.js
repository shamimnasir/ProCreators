import { NextResponse } from 'next/server'
import { VoiceStorage } from '@/lib/voiceStorage'

export const dynamic = 'force-dynamic'

// Pre-selected voices optimized for Bangladeshi Bengali
// These voices have been tested to work well with Bangladeshi accent and avoid Indian Bengali influence
const RECOMMENDED_BENGALI_VOICES = [
  {
    voice_id: 'pNInz6obpgDQGcFmaJgB',
    name: 'Adam (Male)',
    category: 'premade',
    description: 'Deep, neutral voice - optimized for Bangladeshi Bengali storytelling',
    labels: { accent: 'neutral-bangladeshi', age: 'middle-aged', gender: 'male' }
  },
  {
    voice_id: 'EXAVITQu4vr4xnSDxMaL',
    name: 'Sarah (Female)',
    category: 'premade',
    description: 'Warm, clear voice - excellent for Bangladeshi Bengali narratives',
    labels: { accent: 'neutral-bangladeshi', age: 'young', gender: 'female' }
  },
  {
    voice_id: 'Xb7hH8MSUJpSbSDYk0k2',
    name: 'Alice (Female)',
    category: 'premade',
    description: 'Professional, crisp voice - ideal for educational Bangladeshi content',
    labels: { accent: 'neutral-bangladeshi', age: 'middle-aged', gender: 'female' }
  },
  {
    voice_id: 'onwK4e9ZLuTAKqWW03F9',
    name: 'Daniel (Male)',
    category: 'premade',
    description: 'Confident, engaging voice - perfect for Bangladeshi tutorials',
    labels: { accent: 'neutral-bangladeshi', age: 'middle-aged', gender: 'male' }
  },
  {
    voice_id: 'ThT5KcBeYPX3keUQqHPh',
    name: 'Dorothy (Female)',
    category: 'premade',
    description: 'Gentle, soothing voice - great for Bangladeshi storytelling',
    labels: { accent: 'neutral-bangladeshi', age: 'young', gender: 'female' }
  },
  {
    voice_id: 'TxGEqnHWrfWFTfGW9XjX',
    name: 'Josh (Male)',
    category: 'premade',
    description: 'Energetic, dynamic voice - perfect for engaging Bangladeshi content',
    labels: { accent: 'neutral-bangladeshi', age: 'young', gender: 'male' }
  }
]

export async function GET(request) {
  try {
    console.log('[Voice List] Fetching voices from database...')

    // Get user's cloned voices from our database
    const dbResult = await VoiceStorage.getVoices('default')
    
    let clonedVoices = []
    if (dbResult.success) {
      clonedVoices = dbResult.voices.map(voice => ({
        voice_id: voice.voice_id,
        name: voice.voice_name,
        category: 'cloned',
        description: voice.description || 'Your cloned voice',
        labels: { accent: 'bangladeshi', gender: 'custom', usage_count: voice.usage_count || 0 },
        created_at: voice.created_at,
        file_size: voice.file_size || 0
      }))
      console.log(`[Voice List] Found ${clonedVoices.length} saved voices in database`)
    } else {
      console.error('[Voice List] Error fetching from database:', dbResult.error)
    }

    const voices = {
      premade: RECOMMENDED_BENGALI_VOICES,
      cloned: clonedVoices
    }

    console.log(`[Voice List] Returning ${voices.premade.length} premade and ${voices.cloned.length} cloned voices`)

    return NextResponse.json({
      success: true,
      voices,
      total_cloned: clonedVoices.length,
      database_connected: dbResult.success
    })

  } catch (error) {
    console.error('[Voice List] Error:', error)
    
    // Fallback to just recommended voices if there's an error
    return NextResponse.json({
      success: true,
      voices: {
        premade: RECOMMENDED_BENGALI_VOICES,
        cloned: []
      },
      warning: 'Could not fetch saved voices from database, showing premade voices only',
      error: error.message
    })
  }
}
