import { NextResponse } from 'next/server'
import { VoiceStorage } from '@/lib/voiceStorage'

export const dynamic = 'force-dynamic'

// GET - Search voices
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('query')
    const userId = searchParams.get('userId') || 'default'

    if (!query) {
      return NextResponse.json(
        { success: false, error: 'Search query is required' },
        { status: 400 }
      )
    }

    console.log(`[Voice Search] Searching for: "${query}"`)

    const result = await VoiceStorage.searchVoices(query, userId)

    if (result.success) {
      const voices = result.voices.map(voice => ({
        voice_id: voice.voice_id,
        name: voice.voice_name,
        category: 'cloned',
        description: voice.description || 'Your cloned voice',
        labels: { 
          accent: 'bangladeshi', 
          gender: 'custom', 
          usage_count: voice.usage_count || 0 
        },
        created_at: voice.created_at,
        file_size: voice.file_size || 0
      }))

      return NextResponse.json({
        success: true,
        voices,
        total: voices.length,
        query
      })
    } else {
      throw new Error(result.error)
    }

  } catch (error) {
    console.error('[Voice Search] Error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to search voices' },
      { status: 500 }
    )
  }
}

// PUT - Update voice metadata
export async function PUT(request) {
  try {
    const { voiceId, voiceName, description, tags } = await request.json()

    if (!voiceId) {
      return NextResponse.json(
        { success: false, error: 'Voice ID is required' },
        { status: 400 }
      )
    }

    console.log(`[Voice Update] Updating voice: ${voiceId}`)

    const updateData = {}
    if (voiceName) updateData.voice_name = voiceName
    if (description !== undefined) updateData.description = description
    if (tags) updateData.tags = tags

    const result = await VoiceStorage.updateVoice(voiceId, updateData)

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Voice updated successfully',
        modifiedCount: result.modifiedCount
      })
    } else {
      throw new Error(result.error)
    }

  } catch (error) {
    console.error('[Voice Update] Error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update voice' },
      { status: 500 }
    )
  }
}

// POST - Import existing ElevenLabs voices to database
export async function POST(request) {
  try {
    const { voices } = await request.json()

    if (!voices || !Array.isArray(voices)) {
      return NextResponse.json(
        { success: false, error: 'Voices array is required' },
        { status: 400 }
      )
    }

    console.log(`[Voice Import] Importing ${voices.length} voices to database`)

    const imported = []
    const failed = []

    for (const voice of voices) {
      try {
        const result = await VoiceStorage.saveVoice({
          voice_id: voice.voice_id,
          voice_name: voice.name,
          description: voice.description || 'Imported voice',
          language: voice.language || 'bn',
          user_id: 'default'
        })

        if (result.success) {
          imported.push(voice.voice_id)
        } else {
          failed.push({ voice_id: voice.voice_id, error: result.error })
        }
      } catch (error) {
        failed.push({ voice_id: voice.voice_id, error: error.message })
      }
    }

    return NextResponse.json({
      success: true,
      message: `Successfully imported ${imported.length} voices`,
      imported: imported.length,
      failed: failed.length,
      details: { imported, failed }
    })

  } catch (error) {
    console.error('[Voice Import] Error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to import voices' },
      { status: 500 }
    )
  }
}