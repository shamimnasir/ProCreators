import { NextResponse } from 'next/server'
import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js'
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

    const elevenlabs = new ElevenLabsClient({
      apiKey: process.env.ELEVENLABS_API_KEY
    })

    // Save voice sample temporarily
    const tempId = randomUUID()
    const tempPath = join('/tmp', `voice-sample-${tempId}.mp3`)
    const buffer = Buffer.from(await voiceFile.arrayBuffer())
    await writeFile(tempPath, buffer)

    console.log(`[Voice Clone] Voice sample saved, size: ${buffer.length} bytes`)

    try {
      // Create voice clone using ElevenLabs Instant Voice Cloning
      console.log(`[Voice Clone] Calling ElevenLabs Clone API...`)

      // Clone voice using the correct ElevenLabs SDK method
      const voice = await elevenlabs.clone({
        name: voiceName,
        description: description,
        files: [tempPath] // Pass file path directly
      })

      console.log(`[Voice Clone] Voice cloned successfully! Voice ID: ${voice.voice_id}`)

      // Cleanup temp file
      await unlink(tempPath).catch(() => {})

      return NextResponse.json({
        success: true,
        voiceId: voice.voice_id,
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
