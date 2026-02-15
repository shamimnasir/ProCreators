import { NextResponse } from 'next/server'

export async function POST(request) {
  try {
    const { keywords, duration, maxClips } = await request.json()

    if (!keywords || !Array.isArray(keywords) || keywords.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Keywords array is required' },
        { status: 400 }
      )
    }

    // Calculate how many clips we need (3 seconds per clip)
    const requiredClips = maxClips || Math.ceil((duration || 30) / 3)
    console.log(`[Video Search] Need ${requiredClips} clips for ${duration || 30}s video, ${keywords.length} keywords provided`)

    // Check for API keys - Pexels is preferred for videos
    const pexelsKey = process.env.PEXELS_API_KEY
    const pixabayKey = process.env.PIXABAY_API_KEY
    
    if (!pexelsKey && !pixabayKey) {
      throw new Error('Neither PEXELS_API_KEY nor PIXABAY_API_KEY configured')
    }

    // Simple translation map for common Bengali words (faster than API calls)
    const bengaliToEnglish = {
      'প্রেম': 'love',
      'ভালোবাসা': 'love',
      'সম্পর্ক': 'relationship',
      'পরিবার': 'family',
      'বাড়ি': 'home',
      'শিশু': 'child',
      'মা': 'mother',
      'বাবা': 'father',
      'বন্ধু': 'friend',
      'স্কুল': 'school',
      'কাজ': 'work',
      'অফিস': 'office',
      'রাস্তা': 'road',
      'গাড়ি': 'car',
      'ট্রেন': 'train',
      'আকাশ': 'sky',
      'সমুদ্র': 'ocean',
      'পাহাড়': 'mountain',
      'ফুল': 'flower',
      'গাছ': 'tree',
      'পাখি': 'bird',
      'সূর্য': 'sun',
      'চাঁদ': 'moon',
      'তারা': 'star',
      'বৃষ্টি': 'rain',
      'মেঘ': 'cloud',
      'সবুজ': 'green',
      'লাল': 'red',
      'নীল': 'blue',
      'সাদা': 'white',
      'কালো': 'black',
      'খাবার': 'food',
      'পানি': 'water',
      'চা': 'tea',
      'কফি': 'coffee',
      'ফল': 'fruit',
      'সবজি': 'vegetables',
      'মাছ': 'fish',
      'মাংস': 'meat',
      'ভাত': 'rice',
      'রুটি': 'bread',
      'সুখ': 'happiness',
      'দুঃখ': 'sadness',
      'রাগ': 'anger',
      'ভয়': 'fear',
      'আনন্দ': 'joy',
      'কষ্ট': 'pain',
      'হাসি': 'smile',
      'কান্না': 'cry',
      'স্বপ্ন': 'dream',
      'আশা': 'hope',
      'সফলতা': 'success',
      'ব্যর্থতা': 'failure',
      'জীবন': 'life',
      'মৃত্যু': 'death',
      'সময়': 'time',
      'টাকা': 'money',
      'ব্যবসা': 'business',
      'চাকরি': 'job',
      'পড়াশোনা': 'study',
      'বই': 'book',
      'কম্পিউটার': 'computer',
      'ফোন': 'phone',
      'ইন্টারনেট': 'internet',
      'গান': 'music',
      'নাচ': 'dance',
      'খেলা': 'sports',
      'ক্রিকেট': 'cricket',
      'ফুটবল': 'football'
    }

    // Quick translate function using map (no API calls)
    const quickTranslate = (keyword) => {
      // Check if keyword contains Bengali characters
      const hasBengali = /[\u0980-\u09FF]/.test(keyword)
      
      if (!hasBengali) {
        return keyword // Already in English
      }

      // Check our translation map
      const lowerKeyword = keyword.toLowerCase().trim()
      if (bengaliToEnglish[lowerKeyword]) {
        return bengaliToEnglish[lowerKeyword]
      }

      // Try partial match
      for (const [bengali, english] of Object.entries(bengaliToEnglish)) {
        if (keyword.includes(bengali)) {
          return english
        }
      }

      // Fallback: return common search terms for Bengali keywords
      return 'people lifestyle'
    }

    // Search function for a single keyword
    const searchKeyword = async (keyword) => {
      const searchTerm = quickTranslate(keyword)
      // Priority 1: Try Pexels Videos first (best quality and relevance)
      if (pexelsKey) {
        try {
          const pexelsVideosUrl = `https://api.pexels.com/videos/search?query=${encodeURIComponent(searchTerm)}&per_page=3&orientation=portrait`
          const pexelsResponse = await fetch(pexelsVideosUrl, {
            headers: { 'Authorization': pexelsKey },
            signal: AbortSignal.timeout(5000) // 5 second timeout
          })
          const pexelsData = await pexelsResponse.json()
          
          if (pexelsData.videos && pexelsData.videos.length > 0) {
            const video = pexelsData.videos[0]
            // Get the best quality video file (HD or SD)
            const videoFile = video.video_files.find(f => f.quality === 'hd') || video.video_files[0]
            
            return {
              id: video.id,
              keyword,
              url: videoFile.link,
              thumbnail: video.image,
              duration: video.duration || 5,
              width: videoFile.width,
              height: videoFile.height,
              quality: videoFile.quality || 'hd',
              source: 'pexels'
            }
          } else {
            }
        } catch (error) {
          console.error(`[Pexels] Error for ${keyword}:`, error.message)
        }
      }
      
      // Priority 2: Fallback to Pixabay Videos
      if (pixabayKey) {
        try {
          const pixabayUrl = `https://pixabay.com/api/videos/?key=${pixabayKey}&q=${encodeURIComponent(searchTerm)}&per_page=3&orientation=vertical`
          const pixabayResponse = await fetch(pixabayUrl, { 
            signal: AbortSignal.timeout(5000) // 5 second timeout
          })
          const pixabayData = await pixabayResponse.json()
          
          if (pixabayData.hits && pixabayData.hits.length > 0) {
            const video = pixabayData.hits[0]
            const videoFile = video.videos.medium || video.videos.small || video.videos.large
            
            return {
              id: video.id,
              keyword,
              url: videoFile.url,
              thumbnail: video.userImageURL,
              duration: video.duration || 5,
              width: videoFile.width,
              height: videoFile.height,
              quality: 'medium',
              source: 'pixabay'
            }
          } else {
            }
        } catch (error) {
          console.error(`[Pixabay] Error for ${keyword}:`, error.message)
        }
      }
      
      return null // No video found for this keyword
    }

    // Search all keywords IN PARALLEL (much faster!)
    const startTime = Date.now()
    
    const searchPromises = keywords.map(keyword => searchKeyword(keyword))
    const results = await Promise.all(searchPromises)
    
    // Filter out null results
    const videos = results.filter(v => v !== null)
    
    const endTime = Date.now()
    if (videos.length === 0) {
      // Try generic fallback if no videos found
      const fallbackKeywords = ['nature', 'people', 'lifestyle', 'city', 'abstract']
      const fallbackPromises = fallbackKeywords.map(k => searchKeyword(k))
      const fallbackResults = await Promise.all(fallbackPromises)
      const fallbackVideos = fallbackResults.filter(v => v !== null)
      
      if (fallbackVideos.length > 0) {
        return NextResponse.json({
          success: true,
          videos: fallbackVideos,
          count: fallbackVideos.length,
          keywords,
          note: 'Using generic videos as fallback'
        })
      }
      
      return NextResponse.json(
        { success: false, error: 'No videos found for any keywords' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      videos,
      count: videos.length,
      keywords
    })

  } catch (error) {
    console.error('Video search error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to search videos' },
      { status: 500 }
    )
  }
}
