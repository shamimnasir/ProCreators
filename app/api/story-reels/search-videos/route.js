import { NextResponse } from 'next/server'

export async function POST(request) {
  try {
    const { keywords } = await request.json()

    if (!keywords || !Array.isArray(keywords) || keywords.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Keywords array is required' },
        { status: 400 }
      )
    }

    // Check for Pixabay API key first (preferred for videos)
    const pixabayKey = process.env.PIXABAY_API_KEY
    const pexelsKey = process.env.PEXELS_API_KEY
    
    if (!pixabayKey && !pexelsKey) {
      throw new Error('Neither PIXABAY_API_KEY nor PEXELS_API_KEY configured')
    }

    const videos = []
    const usePixabay = !!pixabayKey

    console.log('[Stock Videos] Using provider:', usePixabay ? 'Pixabay' : 'Pexels Photos')
    console.log('[Stock Videos] Searching for', keywords.length, 'keywords:', keywords)

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
        // Translate Bengali keywords to English for better search
        const searchKeyword = await translateKeywordToEnglish(keyword)
        
        console.log('[Search] Keyword:', keyword, '→', searchKeyword)
        
        let videoFound = false
        
        // Try Pixabay first if available
        if (usePixabay) {
          const pixabayUrl = `https://pixabay.com/api/videos/?key=${pixabayKey}&q=${encodeURIComponent(searchKeyword)}&per_page=3`
          const pixabayResponse = await fetch(pixabayUrl)
          const pixabayData = await pixabayResponse.json()
          
          console.log('[Pixabay] Videos found:', pixabayData?.hits?.length || 0)
          
          if (pixabayData.hits && pixabayData.hits.length > 0) {
            const video = pixabayData.hits[0]
            const videoFile = video.videos.medium || video.videos.small || video.videos.large
            
            videos.push({
              id: video.id,
              keyword,
              url: videoFile.url,
              thumbnail: video.userImageURL,
              duration: video.duration || 3,
              width: videoFile.width,
              height: videoFile.height,
              quality: 'medium'
            })
            
            videoFound = true
            console.log('[Pixabay] Added video for:', keyword)
          }
        }
        
        // Fallback to Pexels PHOTOS (not videos) - will be used as static images with motion
        if (!videoFound && pexelsKey) {
          console.log('[Pexels Photos] Searching as fallback...')
          const photosUrl = `https://api.pexels.com/v1/search?query=${encodeURIComponent(searchKeyword)}&per_page=3&orientation=portrait`
          const photosResponse = await fetch(photosUrl, {
            headers: { 'Authorization': pexelsKey }
          })
          const photosData = await photosResponse.json()
          
          console.log('[Pexels Photos] Images found:', photosData?.photos?.length || 0)
          
          if (photosData.photos && photosData.photos.length > 0) {
            const photo = photosData.photos[0]
            
            // Use photo as a video clip (frontend will handle motion effects)
            videos.push({
              id: photo.id,
              keyword,
              url: photo.src.large || photo.src.original,
              thumbnail: photo.src.medium,
              duration: 3, // Default 3 seconds per image
              width: photo.width,
              height: photo.height,
              quality: 'photo', // Special flag indicating this is a photo, not video
              isPhoto: true
            })
            
            videoFound = true
            console.log('[Pexels Photos] Added photo for:', keyword)
          }
        }
        
        // Ultimate fallback: generic nature image
        if (!videoFound && pexelsKey) {
          console.log('[Fallback] Using generic image...')
          const fallbackUrl = `https://api.pexels.com/v1/search?query=nature&per_page=1`
          const fallbackResponse = await fetch(fallbackUrl, {
            headers: { 'Authorization': pexelsKey }
          })
          const fallbackData = await fallbackResponse.json()
          
          if (fallbackData.photos && fallbackData.photos.length > 0) {
            const photo = fallbackData.photos[0]
            videos.push({
              id: photo.id,
              keyword: keyword + ' (generic)',
              url: photo.src.large,
              thumbnail: photo.src.medium,
              duration: 3,
              width: photo.width,
              height: photo.height,
              quality: 'photo',
              isPhoto: true
            })
            console.log('[Fallback] Added generic image')
          }
        }

        // Rate limiting: wait 200ms between requests
        await new Promise(resolve => setTimeout(resolve, 200))

      } catch (error) {
        console.error('[Search] Error searching keyword', keyword, ':', error.message)
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
