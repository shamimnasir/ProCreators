import { NextResponse } from 'next/server'
import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js'
import { writeFile, readFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import { join } from 'path'

export const maxDuration = 60

// Path to store user's saved voices metadata
const VOICES_DB_PATH = '/app/data/user-voices.json'

export async function POST(request) {
  try {
    const formData = await request.formData()
    const voiceName = formData.get('voiceName')
    const voiceFile = formData.get('voiceFile')
    const language = formData.get('language') || 'bn'

    if (!voiceName || !voiceFile) {
      return NextResponse.json(
        { success: false, error: 'Voice name and audio file are required' },
        { status: 400 }
      )
    }

    console.log('Creating permanent voice clone:', voiceName)

    const elevenlabs = new ElevenLabsClient({
      apiKey: process.env.ELEVENLABS_API_KEY
    })

    // Convert file to buffer
    const audioBuffer = Buffer.from(await voiceFile.arrayBuffer())
    
    // Create voice in ElevenLabs
    console.log('Uploading voice to ElevenLabs...')
    
    // Use the voice addition API
    const voice = await elevenlabs.voices.add({
      name: voiceName,
      files: [new Blob([audioBuffer], { type: voiceFile.type })],
      description: `Bengali voice - ${voiceName}`,
      labels: {
        language: language === 'bn' ? 'Bengali' : 'English',
        accent: 'Bangladeshi',
        use_case: 'storytelling'
      }
    })

    console.log('Voice created successfully:', voice.voice_id)

    // Save voice metadata to local database
    await saveVoiceMetadata({
      voice_id: voice.voice_id,
      name: voiceName,
      language: language,
      created_at: new Date().toISOString(),
      category: 'user_created'
    })

    return NextResponse.json({
      success: true,
      voice_id: voice.voice_id,
      name: voiceName,
      message: 'Voice saved successfully! You can now use it for all future videos.'
    })

  } catch (error) {
    console.error('Error saving voice:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to save voice'
      },
      { status: 500 }
    )
  }
}

export async function GET(request) {
  try {
    // Get saved voices from local database
    const voices = await getSavedVoices()
    
    return NextResponse.json({
      success: true,
      voices: voices
    })

  } catch (error) {
    console.error('Error fetching saved voices:', error)
    return NextResponse.json(
      { success: false, error: error.message, voices: [] },
      { status: 500 }
    )
  }
}

// Helper function to save voice metadata
async function saveVoiceMetadata(voiceData) {
  try {
    // Ensure data directory exists
    const dataDir = '/app/data'
    if (!existsSync(dataDir)) {
      await mkdir(dataDir, { recursive: true })
    }

    let voices = []
    
    // Read existing voices if file exists
    if (existsSync(VOICES_DB_PATH)) {
      const content = await readFile(VOICES_DB_PATH, 'utf-8')
      voices = JSON.parse(content)
    }

    // Add new voice
    voices.push(voiceData)

    // Write back to file
    await writeFile(VOICES_DB_PATH, JSON.stringify(voices, null, 2))
    
    console.log('Voice metadata saved to local database')
  } catch (error) {
    console.error('Error saving voice metadata:', error)
    throw error
  }
}

// Helper function to get saved voices
async function getSavedVoices() {
  try {
    if (!existsSync(VOICES_DB_PATH)) {
      return []
    }

    const content = await readFile(VOICES_DB_PATH, 'utf-8')
    return JSON.parse(content)
  } catch (error) {
    console.error('Error reading saved voices:', error)
    return []
  }
}
