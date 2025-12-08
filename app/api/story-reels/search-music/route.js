import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// Freesound API key - User needs to add this to .env as FREESOUND_API_KEY
const FREESOUND_API_KEY = process.env.FREESOUND_API_KEY || ''

export async function POST(request) {
  try {
    const { query, duration } = await request.json()
    
    if (!FREESOUND_API_KEY) {
      return NextResponse.json({
        success: false,
        error: 'Freesound API key not configured. Please add FREESOUND_API_KEY to your .env file.',
        needsApiKey: true
      }, { status: 400 })
    }

    console.log(`[Freesound] Searching for music: "${query}", duration: ${duration}s`)

    // Search Freesound for music/background tracks
    // Filter by: music tag, duration (15-120s), high quality
    const searchUrl = new URL('https://freesound.org/apiv2/search/text/')
    searchUrl.searchParams.append('query', query)
    searchUrl.searchParams.append('filter', `tag:music duration:[${duration - 5} TO ${duration + 30}]`) // Get tracks slightly longer than needed
    searchUrl.searchParams.append('sort', 'rating_desc') // Best rated first
    searchUrl.searchParams.append('fields', 'id,name,duration,previews,username,license,tags')
    searchUrl.searchParams.append('page_size', '20') // Get 20 results
    searchUrl.searchParams.append('token', FREESOUND_API_KEY)

    const response = await fetch(searchUrl.toString())
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('[Freesound] Search error:', response.status, errorText)
      return NextResponse.json({
        success: false,
        error: `Freesound API error: ${response.status}`
      }, { status: response.status })
    }

    const data = await response.json()
    
    console.log(`[Freesound] Found ${data.results.length} tracks`)

    // Format results for frontend
    const tracks = data.results.map(sound => ({
      id: sound.id,
      name: sound.name,
      duration: sound.duration,
      username: sound.username,
      license: sound.license,
      tags: sound.tags,
      previewUrl: sound.previews['preview-hq-mp3'] || sound.previews['preview-lq-mp3'],
      downloadUrl: `https://freesound.org/apiv2/sounds/${sound.id}/download/?token=${FREESOUND_API_KEY}`
    }))

    return NextResponse.json({
      success: true,
      tracks,
      count: data.count
    })

  } catch (error) {
    console.error('[Freesound] Error:', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to search music'
    }, { status: 500 })
  }
}
