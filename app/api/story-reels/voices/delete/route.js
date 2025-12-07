import { NextResponse } from 'next/server'
import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js'

export const dynamic = 'force-dynamic'

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url)
    const voiceId = searchParams.get('voiceId')

    if (!voiceId) {
      return NextResponse.json(
        { success: false, error: 'Voice ID is required' },
        { status: 400 }
      )
    }

    console.log(`[Voice Delete] Deleting voice: ${voiceId}`)

    const elevenlabs = new ElevenLabsClient({
      apiKey: process.env.ELEVENLABS_API_KEY
    })

    // Delete the voice
    await elevenlabs.voices.delete(voiceId)

    console.log(`[Voice Delete] Voice deleted successfully`)

    return NextResponse.json({
      success: true,
      message: 'Voice deleted successfully'
    })

  } catch (error) {
    console.error('[Voice Delete] Error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete voice' },
      { status: 500 }
    )
  }
}
