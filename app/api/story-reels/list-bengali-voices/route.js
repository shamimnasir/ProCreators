import { NextResponse } from 'next/server'
import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js'

export const dynamic = 'force-dynamic'

export async function GET(request) {
  try {
    const elevenlabs = new ElevenLabsClient({
      apiKey: process.env.ELEVENLABS_API_KEY
    })

    console.log('Fetching all available voices from ElevenLabs...')
    
    // Get all available voices
    const voicesResponse = await elevenlabs.voices.getAll()
    const allVoices = voicesResponse.voices || []
    
    console.log(`Total voices fetched: ${allVoices.length}`)

    // Filter for voices that support Bengali or are multilingual
    // Look for voices with language tags, descriptions, or multilingual support
    const bengaliVoices = allVoices.filter(voice => {
      const name = voice.name?.toLowerCase() || ''
      const description = voice.description?.toLowerCase() || ''
      const labels = voice.labels || {}
      
      // Check if voice explicitly supports Bengali
      const hasBengaliLabel = Object.values(labels).some(val => 
        String(val).toLowerCase().includes('bengali') ||
        String(val).toLowerCase().includes('bangla') ||
        String(val).toLowerCase().includes('multilingual')
      )
      
      // Check name and description
      const hasBengaliInText = 
        name.includes('bengali') || 
        name.includes('bangla') ||
        description.includes('bengali') ||
        description.includes('bangla')
      
      // Include all pre-made voices from Voice Library (these are usually multilingual)
      const isPreMade = voice.category === 'premade'
      
      return hasBengaliLabel || hasBengaliInText || isPreMade
    })

    console.log(`Bengali/Multilingual voices found: ${bengaliVoices.length}`)

    // Format response with relevant voice information
    const formattedVoices = bengaliVoices.map(voice => ({
      voice_id: voice.voice_id,
      name: voice.name,
      description: voice.description,
      preview_url: voice.preview_url,
      category: voice.category,
      labels: voice.labels,
      samples: voice.samples?.map(s => ({
        sample_id: s.sample_id,
        file_name: s.file_name,
        audio_url: s.audio
      })) || []
    }))

    // Sort by category (premade first) and then by name
    formattedVoices.sort((a, b) => {
      if (a.category === 'premade' && b.category !== 'premade') return -1
      if (a.category !== 'premade' && b.category === 'premade') return 1
      return a.name.localeCompare(b.name)
    })

    return NextResponse.json({
      success: true,
      voices: formattedVoices,
      total: formattedVoices.length,
      message: 'Successfully fetched Bengali/Multilingual voices'
    })

  } catch (error) {
    console.error('Error fetching Bengali voices:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to fetch voices',
        voices: []
      },
      { status: 500 }
    )
  }
}
