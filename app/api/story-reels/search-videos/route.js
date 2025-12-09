import { NextResponse } from 'next/server'
import { createClient } from 'pexels'

export async function POST(request) {
  try {
    const { keywords } = await request.json()

    if (!keywords || !Array.isArray(keywords) || keywords.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Keywords array is required' },
        { status: 400 }
      )
    }

    const apiKey = process.env.PEXELS_API_KEY
    if (!apiKey) {
      throw new Error('PEXELS_API_KEY not configured')
    }

    const client = createClient(apiKey)
    const videos = []

    console.log('[Pexels] Searching for', keywords.length, 'keywords:', keywords)

    // Helper function to translate Bengali keywords to English for better search results
    const translateKeywordToEnglish = async (keyword) => {
      // Check if keyword contains Bengali characters
      const hasBengali = /[\u0980-\u09FF]/.test(keyword)
      
      if (!hasBengali) {
        return keyword // Already in English or Roman script
      }

      // Use Google Translate via Gemini API (lightweight translation)
      try {
        const translateResponse = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash-exp:generateContent?key=${process.env.GEMINI_API_KEY}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: `Translate this Bengali word/phrase to English (single word or short phrase only, no explanation): ${keyword}`
              }]
            }]
          })
        })

        const translateData = await translateResponse.json()
        const translation = translateData.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || keyword
        
        console.log(`[Translation] ${keyword} → ${translation}`)
        return translation
      } catch (error) {
        console.error('[Translation] Error:', error.message)
        return keyword // Fallback to original
      }
    }

    // Search for videos for each keyword
    for (const keyword of keywords) {
      try {
        // Translate Bengali keywords to English for better Pexels search
        const searchKeyword = await translateKeywordToEnglish(keyword)
        
        console.log('[Pexels] Searching keyword:', keyword, '→', searchKeyword)
        
        const response = await client.videos.search({
          query: keyword,
          per_page: 3,
          orientation: 'portrait', // Vertical videos for 9:16
          size: 'medium'
        })

        if (response.videos && response.videos.length > 0) {
          // Get the first video result
          const video = response.videos[0]
          
          // Find the best quality video file (prefer HD or medium)
          const videoFile = video.video_files.find(file => 
            file.quality === 'hd' && file.width <= 1080
          ) || video.video_files.find(file =>
            file.quality === 'sd' && file.width <= 720
          ) || video.video_files[0]

          videos.push({
            id: video.id,
            keyword,
            url: videoFile.link,
            thumbnail: video.image,
            duration: video.duration || 3,
            width: videoFile.width,
            height: videoFile.height,
            quality: videoFile.quality
          })

          console.log('[Pexels] Found video for', keyword, '-', videoFile.quality, videoFile.width + 'x' + videoFile.height)
        } else {
          console.log('[Pexels] No videos found for', keyword, ', using fallback')
          
          // Fallback: search for generic content
          const fallbackResponse = await client.videos.search({
            query: 'abstract background',
            per_page: 1,
            orientation: 'portrait'
          })

          if (fallbackResponse.videos && fallbackResponse.videos.length > 0) {
            const video = fallbackResponse.videos[0]
            const videoFile = video.video_files[0]

            videos.push({
              id: video.id,
              keyword: keyword + ' (fallback)',
              url: videoFile.link,
              thumbnail: video.image,
              duration: video.duration || 3,
              width: videoFile.width,
              height: videoFile.height,
              quality: videoFile.quality
            })
          }
        }

        // Rate limiting: wait 200ms between requests
        await new Promise(resolve => setTimeout(resolve, 200))

      } catch (error) {
        console.error('[Pexels] Error searching keyword', keyword, ':', error.message)
        // Continue with next keyword
      }
    }

    if (videos.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No videos found for any keywords' },
        { status: 404 }
      )
    }

    console.log('[Pexels] Total videos found:', videos.length)

    return NextResponse.json({
      success: true,
      videos,
      count: videos.length,
      keywords
    })

  } catch (error) {
    console.error('Pexels search error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to search videos' },
      { status: 500 }
    )
  }
}
