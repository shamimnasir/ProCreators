import { NextResponse } from 'next/server'
import textToSpeech from '@google-cloud/text-to-speech'

export const dynamic = 'force-dynamic'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const language = searchParams.get('language') || 'bn' // Default to Bengali
    
    // Initialize Google Cloud TTS client with service account
    const client = new textToSpeech.TextToSpeechClient({
      keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS
    })

    // List all voices
    const [result] = await client.listVoices({})
    const voices = result.voices
    
    // Filter voices by language code
    // For Bengali, Google uses 'bn-IN' (Indian Bengali) - no 'bn-BD' yet
    const languageCodes = language === 'bn' ? ['bn-IN'] : [`${language}-US`, `${language}-GB`, `${language}-AU`, `${language}-IN`]
    
    let filteredVoices = voices.filter(voice => 
      languageCodes.some(code => voice.languageCodes.includes(code))
    )
    
    // IMPORTANT: Filter out simple star name voices (like "Iapetus", "Rasalgethi")
    // These voices fail with Google TTS API even with model parameter
    // Only keep voices that have the language code in their name (e.g., "en-US-Chirp3-HD-Iapetus")
    // or traditional format voices (e.g., "en-US-Neural2-A", "en-US-Wavenet-B")
    filteredVoices = filteredVoices.filter(voice => {
      const name = voice.name
      // Keep voices that have language code pattern (e.g., "en-US-", "bn-IN-")
      const hasLanguagePrefix = /^[a-z]{2}-[A-Z]{2}-/.test(name)
      // Or keep if it's a simple name but NOT a star name (star names are typically capitalized single words)
      const isStarName = /^[A-Z][a-z]+$/.test(name) && !name.includes('-')
      
      return hasLanguagePrefix && !isStarName
    })
    
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
