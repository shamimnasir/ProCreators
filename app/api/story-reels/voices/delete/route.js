import { NextResponse } from 'next/server'
import { VoiceStorage } from '@/lib/voiceStorage'

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

    let elevenLabsSuccess = false
    let databaseSuccess = false

    // Try to delete from ElevenLabs first
    try {
      const response = await fetch(`https://api.elevenlabs.io/v1/voices/${voiceId}`, {
        method: 'DELETE',
        headers: {
          'xi-api-key': process.env.ELEVENLABS_API_KEY,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        console.log(`[Voice Delete] Successfully deleted from ElevenLabs`)
        elevenLabsSuccess = true
      } else {
        const errorText = await response.text()
        console.error(`[Voice Delete] ElevenLabs API error: ${response.status} - ${errorText}`)
        // Continue to database deletion even if ElevenLabs fails
      }
    } catch (elevenLabsError) {
      console.error(`[Voice Delete] ElevenLabs deletion failed:`, elevenLabsError.message)
      // Continue to database deletion
    }

    // Delete from our database (soft delete)
    try {
      const dbResult = await VoiceStorage.deleteVoice(voiceId)
      if (dbResult.success) {
        console.log(`[Voice Delete] Successfully removed from database`)
        databaseSuccess = true
      } else {
        console.error(`[Voice Delete] Database deletion failed:`, dbResult.error)
      }
    } catch (dbError) {
      console.error(`[Voice Delete] Database deletion error:`, dbError.message)
    }

    // Return success if either deletion succeeded
    if (elevenLabsSuccess || databaseSuccess) {
      return NextResponse.json({
        success: true,
        message: 'Voice deleted successfully',
        details: {
          elevenlabs: elevenLabsSuccess,
          database: databaseSuccess
        }
      })
    } else {
      throw new Error('Failed to delete voice from both ElevenLabs and database')
    }

  } catch (error) {
    console.error('[Voice Delete] Error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete voice' },
      { status: 500 }
    )
  }
}
