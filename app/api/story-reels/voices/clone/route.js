import { NextResponse } from 'next/server'
import { writeFile, unlink } from 'fs/promises'
import { join } from 'path'
import { randomUUID } from 'crypto'
import FormData from 'form-data'
import fs from 'fs'

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

    // Save voice sample temporarily
    const tempId = randomUUID()
    const tempPath = join('/tmp', `voice-sample-${tempId}.mp3`)
    const buffer = Buffer.from(await voiceFile.arrayBuffer())
    await writeFile(tempPath, buffer)

    console.log(`[Voice Clone] Voice sample saved, size: ${buffer.length} bytes`)

    try {
      // Create form data for ElevenLabs API
      const elevenLabsFormData = new FormData()
      elevenLabsFormData.append('name', voiceName)
      elevenLabsFormData.append('description', description)
      elevenLabsFormData.append('consent', 'true')
      elevenLabsFormData.append('files', fs.createReadStream(tempPath))

      console.log(`[Voice Clone] Calling ElevenLabs Voice Clone API...`)

      // Make direct API call to ElevenLabs
      const response = await fetch('https://api.elevenlabs.io/v1/voices/add', {
        method: 'POST',
        headers: {
          'xi-api-key': process.env.ELEVENLABS_API_KEY,
          ...elevenLabsFormData.getHeaders()
        },
        body: elevenLabsFormData
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error(`[Voice Clone] ElevenLabs API error: ${response.status} - ${errorText}`)
        throw new Error(`ElevenLabs API error: ${response.status} - ${errorText}`)
      }

      const result = await response.json()
      console.log(`[Voice Clone] Voice cloned successfully! Voice ID: ${result.voice_id}`)

      // Cleanup temp file
      await unlink(tempPath).catch(() => {})

      return NextResponse.json({
        success: true,
        voiceId: result.voice_id,
        voiceName: voiceName,
        message: 'Voice cloned successfully! You can now use it for text-to-speech.'
      })

    } catch (cloneError) {
      console.error(`[Voice Clone] ElevenLabs API error:`, cloneError)
      
      // Cleanup temp file
      await unlink(tempPath).catch(() => {})
      
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
