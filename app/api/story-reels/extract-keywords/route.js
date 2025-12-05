import { NextResponse } from 'next/server'

export async function POST(request) {
  try {
    const { script, duration } = await request.json()

    if (!script || !script.trim()) {
      return NextResponse.json(
        { success: false, error: 'Script is required' },
        { status: 400 }
      )
    }

    // Calculate how many 3-second segments we need
    const segmentCount = Math.ceil(duration / 3)
    
    console.log('[Keyword Extraction] Script length:', script.length)
    console.log('[Keyword Extraction] Duration:', duration, 'seconds')
    console.log('[Keyword Extraction] Target segments:', segmentCount)

    // Simple keyword extraction without heavy NLP libraries
    const stopWords = new Set([
      // English stop words
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
      'of', 'with', 'by', 'from', 'up', 'about', 'into', 'through', 'during',
      'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had',
      'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might',
      'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they',
      'what', 'when', 'where', 'who', 'why', 'how', 'can', 'if', 'then', 'than',
      // Bengali stop words (common ones)
      'এবং', 'বা', 'কিন্তু', 'তবে', 'যে', 'যা', 'যেটি', 'এটা', 'এটি', 'সে', 'তার',
      'আমি', 'তুমি', 'তোমার', 'আমার', 'আমরা', 'তারা', 'হয়', 'ছিল', 'থাকা', 'করা',
      'একটি', 'একজন', 'কিছু', 'সব', 'অনেক', 'কয়েক', 'প্রতি', 'সাথে', 'মধ্যে'
    ])

    // Simple tokenization: split by whitespace and punctuation
    const tokens = script
      .toLowerCase()
      .replace(/[।!?।\n.,;:""''()[\]{}]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 3 && !stopWords.has(word) && !/^\d+$/.test(word))

    // Count word frequency
    const wordFreq = {}
    tokens.forEach(token => {
      wordFreq[token] = (wordFreq[token] || 0) + 1
    })

    // Sort by frequency and get top keywords
    let keywords = Object.entries(wordFreq)
      .sort((a, b) => b[1] - a[1])
      .map(([word]) => word)
      .slice(0, segmentCount)

    console.log('[Keyword Extraction] Keywords from frequency:', keywords.length)

    // If we don't have enough keywords, add generic visual keywords
    if (keywords.length < segmentCount) {
      console.log('[Keyword Extraction] Adding generic keywords...')
      
      const genericKeywords = [
        'nature', 'landscape', 'people', 'city', 'sky', 'hands', 'face', 'smile',
        'sunset', 'ocean', 'mountain', 'forest', 'river', 'beach', 'flowers',
        'technology', 'business', 'success', 'happiness', 'love', 'family',
        'প্রকৃতি', 'মানুষ', 'শহর', 'আকাশ', 'সূর্যাস্ত', 'নদী', 'পরিবার', 'ভালোবাসা'
      ]
      
      for (const word of genericKeywords) {
        if (keywords.length >= segmentCount) break
        if (!keywords.includes(word)) {
          keywords.push(word)
        }
      }
    }

    // Ensure we have exactly the right number
    keywords = keywords.slice(0, segmentCount)

    console.log('[Keyword Extraction] Final keywords:', keywords)

    return NextResponse.json({
      success: true,
      keywords,
      segmentCount,
      message: `Extracted ${keywords.length} keywords for ${segmentCount} video segments`
    })

  } catch (error) {
    console.error('Keyword extraction error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to extract keywords' },
      { status: 500 }
    )
  }
}
