import { NextResponse } from 'next/server'

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

    // Make direct API call to ElevenLabs
    const response = await fetch(`https://api.elevenlabs.io/v1/voices/${voiceId}`, {
      method: 'DELETE',
      headers: {
        'xi-api-key': process.env.ELEVENLABS_API_KEY,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`[Voice Delete] ElevenLabs API error: ${response.status} - ${errorText}`)
      throw new Error(`Failed to delete voice: ${response.status} - ${errorText}`)
    }

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
