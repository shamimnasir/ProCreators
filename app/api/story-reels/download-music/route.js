import { NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import { join } from 'path'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

const FREESOUND_API_KEY = process.env.FREESOUND_API_KEY || ''

export async function POST(request) {
  try {
    const { soundId, name, duration: videoDuration, previewUrl } = await request.json()
    
    if (!FREESOUND_API_KEY) {
      return NextResponse.json({
        success: false,
        error: 'Freesound API key not configured'
      }, { status: 400 })
    }

    console.log(`[Freesound Download] Downloading sound ID: ${soundId}`)

    // Create music cache directory
    const musicDir = '/app/public/music-cache'
    if (!existsSync(musicDir)) {
      await mkdir(musicDir, { recursive: true })
    }

    // Check if already cached
    const cachedPath = join(musicDir, `${soundId}.mp3`)
    const cachedPublicPath = `/music-cache/${soundId}.mp3`
    
    if (existsSync(cachedPath)) {
      console.log(`[Freesound Download] Using cached file: ${soundId}`)
      return NextResponse.json({
        success: true,
        filePath: cachedPath,
        publicUrl: cachedPublicPath,
        name,
        cached: true
      })
    }

    // Use preview URL (HQ MP3) instead of download endpoint
    // Download endpoint requires OAuth2, but preview URLs work with API key
    const downloadUrl = previewUrl || `https://freesound.org/apiv2/sounds/${soundId}/?token=${FREESOUND_API_KEY}`
    
    console.log(`[Freesound Download] Fetching preview from Freesound...`)
    
    // If we don't have previewUrl, fetch sound details first
    let audioUrl = previewUrl
    if (!audioUrl) {
      const detailsResponse = await fetch(downloadUrl)
      if (detailsResponse.ok) {
        const details = await detailsResponse.json()
        audioUrl = details.previews['preview-hq-mp3'] || details.previews['preview-lq-mp3']
      }
    }
    
    if (!audioUrl) {
      throw new Error('No preview URL available')
    }
    
    const response = await fetch(audioUrl)
    
    if (!response.ok) {
      throw new Error(`Failed to download preview: ${response.status}`)
    }

    // Save to cache
    const arrayBuffer = await response.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    await writeFile(cachedPath, buffer)
    
    console.log(`[Freesound Download] Downloaded and cached: ${soundId} (${buffer.length} bytes)`)

    return NextResponse.json({
      success: true,
      filePath: cachedPath,
      publicUrl: cachedPublicPath,
      name,
      cached: false
    })

  } catch (error) {
    console.error('[Freesound Download] Error:', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to download music'
    }, { status: 500 })
  }
}
