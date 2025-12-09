import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// Freesound API key - User needs to add this to .env as FREESOUND_API_KEY
const FREESOUND_API_KEY = process.env.FREESOUND_API_KEY || ''

export async function POST(request) {
  try {
    const { query, duration } = await request.json()
    
    console.log(`[Music Search] Query: "${query}", duration: ${duration}s`)
    
    let tracks = []
    let serviceName = 'Unknown'
    
    // Try Freesound first (primary)
    if (FREESOUND_API_KEY) {
      try {
        console.log('[Freesound] Attempting primary music search...')
        const freesoundTracks = await searchFreesound(query, duration)
        if (freesoundTracks && freesoundTracks.length > 0) {
          tracks = freesoundTracks
          serviceName = 'Freesound'
          console.log(`[Freesound] Success: ${tracks.length} tracks found`)
        }
      } catch (error) {
        console.log('[Freesound] Failed, trying fallback...', error.message)
      }
    }
    
    // Fallback to TheAudioDB if Freesound fails
    if (tracks.length === 0) {
      try {
        console.log('[TheAudioDB] Attempting fallback music search...')
        const audioDbTracks = await searchTheAudioDB(query, duration)
        if (audioDbTracks && audioDbTracks.length > 0) {
          tracks = audioDbTracks
          serviceName = 'TheAudioDB'
          console.log(`[TheAudioDB] Success: ${tracks.length} tracks found`)
        }
      } catch (error) {
        console.log('[TheAudioDB] Failed:', error.message)
      }
    }
    
    // If both fail, return informative error
    if (tracks.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Both music services are temporarily unavailable. You can proceed without music.',
        canProceedWithoutMusic: true,
        temporaryIssue: true
      }, { status: 200 })
    }
    
    return NextResponse.json({
      success: true,
      tracks,
      count: tracks.length,
      service: serviceName
    })

  } catch (error) {
    console.error('[Music Search] Error:', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to search music',
      canProceedWithoutMusic: true
    }, { status: 200 })
  }
}

// Freesound search function
async function searchFreesound(query, duration) {
  if (!FREESOUND_API_KEY) return null

  const searchUrl = new URL('https://freesound.org/apiv2/search/text/')
  searchUrl.searchParams.append('query', query)
  searchUrl.searchParams.append('filter', `tag:music duration:[${duration - 5} TO ${duration + 30}]`)
  searchUrl.searchParams.append('sort', 'rating_desc')
  searchUrl.searchParams.append('fields', 'id,name,duration,previews,username,license,tags')
  searchUrl.searchParams.append('page_size', '20')
  searchUrl.searchParams.append('token', FREESOUND_API_KEY)

  const response = await fetch(searchUrl.toString(), {
    signal: AbortSignal.timeout(10000) // 10 second timeout
  })
  
  if (!response.ok) {
    throw new Error(`Freesound API error: ${response.status}`)
  }

  const data = await response.json()
  
  if (!data.results || data.results.length === 0) {
    return null
  }

  // Format results for frontend
  return data.results.map(sound => ({
    id: sound.id,
    name: sound.name,
    duration: sound.duration,
    username: sound.username,
    license: sound.license,
    tags: sound.tags,
    previewUrl: sound.previews['preview-hq-mp3'] || sound.previews['preview-lq-mp3'],
    downloadUrl: `https://freesound.org/apiv2/sounds/${sound.id}/download/?token=${FREESOUND_API_KEY}`,
    service: 'Freesound'
  }))
}

// TheAudioDB search function (fallback)
async function searchTheAudioDB(query, duration) {
  // TheAudioDB doesn't have direct search by keyword, so we use genre/mood mapping
  const genreMapping = {
    'upbeat': 'pop',
    'calm': 'ambient',
    'relaxing': 'classical',
    'energetic': 'rock',
    'happy': 'pop',
    'sad': 'blues',
    'dramatic': 'classical',
    'background': 'ambient',
    'motivational': 'rock',
    'chill': 'electronic'
  }
  
  // Extract genre from query
  let genre = 'pop' // default
  for (const [keyword, mappedGenre] of Object.entries(genreMapping)) {
    if (query.toLowerCase().includes(keyword)) {
      genre = mappedGenre
      break
    }
  }
  
  console.log(`[TheAudioDB] Mapped query "${query}" to genre: ${genre}`)
  
  // Search for trending tracks (TheAudioDB free tier limitation)
  const response = await fetch(`https://www.theaudiodb.com/api/v1/json/2/trending.php?country=us&type=itunes&format=singles`, {
    signal: AbortSignal.timeout(5000)
  })
  
  if (!response.ok) {
    throw new Error(`TheAudioDB API error: ${response.status}`)
  }

  const data = await response.json()
  
  if (!data.trending || data.trending.length === 0) {
    return null
  }

  // Format results - TheAudioDB provides iTunes preview links
  return data.trending.slice(0, 10).map(track => ({
    id: track.idTrack || `audiodb-${Math.random().toString(36).substr(2, 9)}`,
    name: track.strTrack || 'Untitled',
    duration: 30, // Default duration as TheAudioDB doesn't provide it
    username: track.strArtist || 'Various Artists',
    license: 'Preview Only',
    tags: [genre],
    previewUrl: track.strMusicVid || null, // Preview URL if available
    downloadUrl: null, // TheAudioDB doesn't provide downloads
    service: 'TheAudioDB',
    note: 'Preview from TheAudioDB - for demo purposes'
  })).filter(track => track.previewUrl) // Only return tracks with preview URLs
}
