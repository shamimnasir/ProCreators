import { NextResponse } from 'next/server'
import textToSpeech from '@google-cloud/text-to-speech'

export const dynamic = 'force-dynamic'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const language = searchParams.get('language') || 'bn' // Default to Bengali
    
    console.log(`[List Voices] Fetching voices for language: ${language}`)
    
    // Initialize Google Cloud TTS client with service account
    const client = new textToSpeech.TextToSpeechClient({
      keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS
    })

    // List all voices
    const [result] = await client.listVoices({})
    const voices = result.voices
    
    console.log(`[List Voices] Total voices available: ${voices.length}`)
    
    // Filter voices by language code
    // For Bengali, Google uses 'bn-IN' (Indian Bengali) - no 'bn-BD' yet
    const languageCodes = language === 'bn' ? ['bn-IN'] : [`${language}-US`, `${language}-GB`]
    
    const filteredVoices = voices.filter(voice => 
      languageCodes.some(code => voice.languageCodes.includes(code))
    )
    
    console.log(`[List Voices] Filtered voices for ${language}: ${filteredVoices.length}`)
    
    // Format voices for frontend
    const formattedVoices = filteredVoices.map(voice => ({
      name: voice.name,
      languageCodes: voice.languageCodes,
      ssmlGender: voice.ssmlGender,
      naturalSampleRateHertz: voice.naturalSampleRateHertz,
      displayName: `${voice.name.split('-').pop().toUpperCase()} (${voice.ssmlGender})`
    }))
    
    // If no voices found for the language, provide fallback info
    if (formattedVoices.length === 0) {
      console.log(`[List Voices] No voices found for ${language}, using defaults`)
      return NextResponse.json({
        success: true,
        voices: [],
        message: `No voices available for language code: ${language}. Using system default.`,
        fallbackAvailable: true
      })
    }

    return NextResponse.json({
      success: true,
      voices: formattedVoices,
      language,
      count: formattedVoices.length
    })

  } catch (error) {
    console.error('[List Voices] Error:', error.message)
    
    return NextResponse.json(
      { 
        success: false, 
        error: error.message,
        voices: [],
        fallbackAvailable: true
      },
      { status: 500 }
    )
  }
}
