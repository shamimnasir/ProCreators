import { NextResponse } from 'next/server'
import { writeFile, unlink } from 'fs/promises'
import { join } from 'path'
import { randomUUID } from 'crypto'

export const maxDuration = 60
export const dynamic = 'force-dynamic'

export async function POST(request) {
  try {
    const formData = await request.formData()
    const voiceName = formData.get('voiceName')
    const voiceFile = formData.get('voiceFile')
    const description = formData.get('description') || 'Cloned voice for Bengali TTS'

    if (!voiceName || !voiceFile) {
      return NextResponse.json(
        { success: false, error: 'Voice name and audio file are required' },
        { status: 400 }
      )
    }

    console.log(`[Voice Clone] Creating voice clone: ${voiceName}`)

    // Convert the uploaded file to buffer
    const buffer = Buffer.from(await voiceFile.arrayBuffer())
    console.log(`[Voice Clone] Voice sample received, size: ${buffer.length} bytes`)

    try {
      // Create new FormData for ElevenLabs API
      const elevenLabsFormData = new FormData()
      elevenLabsFormData.append('name', voiceName)
      elevenLabsFormData.append('description', description)
      
      // Create a new Blob from the buffer and append it as 'files'
      const audioBlob = new Blob([buffer], { type: voiceFile.type || 'audio/mpeg' })
      elevenLabsFormData.append('files', audioBlob, voiceFile.name || 'voice_sample.mp3')

      console.log(`[Voice Clone] Calling ElevenLabs Voice Clone API with data:`, {
        name: voiceName,
        description: description,
        fileSize: buffer.length,
        fileName: voiceFile.name || 'voice_sample.mp3'
      })

      // Make direct API call to ElevenLabs
      const response = await fetch('https://api.elevenlabs.io/v1/voices/add', {
        method: 'POST',
        headers: {
          'xi-api-key': process.env.ELEVENLABS_API_KEY
          // Don't set Content-Type, let the browser set it for FormData
        },
        body: elevenLabsFormData
      })

      console.log(`[Voice Clone] API Response status: ${response.status}`)

      if (!response.ok) {
        const errorText = await response.text()
        console.error(`[Voice Clone] ElevenLabs API error: ${response.status} - ${errorText}`)
        throw new Error(`ElevenLabs API error: ${response.status} - ${errorText}`)
      }

      const result = await response.json()
      console.log(`[Voice Clone] Voice cloned successfully! Voice ID: ${result.voice_id}`)

      return NextResponse.json({
        success: true,
        voiceId: result.voice_id,
        voiceName: voiceName,
        message: 'Voice cloned successfully! You can now use it for text-to-speech.'
      })

    } catch (cloneError) {
      console.error(`[Voice Clone] ElevenLabs API error:`, cloneError)
      throw new Error(cloneError.message || 'Failed to clone voice')
    }

  } catch (error) {
    console.error('[Voice Clone] Error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to clone voice' },
      { status: 500 }
    )
  }
}
