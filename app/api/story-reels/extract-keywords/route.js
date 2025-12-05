import { NextResponse } from 'next/server'
import natural from 'natural'

const TfIdf = natural.TfIdf
const tokenizer = new natural.WordTokenizer()

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

    // Split script into sentences
    const sentences = script
      .replace(/[।!?।\n]+/g, '.')
      .split('.')
      .map(s => s.trim())
      .filter(s => s.length > 0)

    console.log('[Keyword Extraction] Sentences found:', sentences.length)

    // Use TF-IDF to extract important terms
    const tfidf = new TfIdf()
    
    // Add each sentence as a document
    sentences.forEach(sentence => {
      tfidf.addDocument(sentence)
    })

    // Extract keywords with high TF-IDF scores
    const allKeywords = new Set()
    const stopWords = new Set([
      // English stop words
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
      'of', 'with', 'by', 'from', 'up', 'about', 'into', 'through', 'during',
      'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had',
      'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might',
      'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they',
      // Bengali stop words (common ones)
      'এবং', 'বা', 'কিন্তু', 'তবে', 'যে', 'যা', 'যেটি', 'এটা', 'এটি', 'সে', 'তার',
      'আমি', 'তুমি', 'তোমার', 'আমার', 'আমরা', 'তারা', 'হয়', 'ছিল', 'থাকা', 'করা',
      'একটি', 'একজন', 'কিছু', 'সব', 'অনেক', 'কয়েক', 'প্রতি', 'সাথে', 'মধ্যে'
    ])

    sentences.forEach((sentence, docIndex) => {
      const terms = tfidf.listTerms(docIndex)
      
      // Get top 3 terms per sentence
      terms
        .slice(0, 3)
        .forEach(item => {
          const term = item.term.toLowerCase()
          // Filter out stop words and short words
          if (term.length > 2 && !stopWords.has(term) && !/^\d+$/.test(term)) {
            allKeywords.add(term)
          }
        })
    })

    // Convert to array and take the needed number
    let keywords = Array.from(allKeywords).slice(0, segmentCount)

    // If we don't have enough keywords, extract more using simple tokenization
    if (keywords.length < segmentCount) {
      console.log('[Keyword Extraction] Not enough keywords, using fallback method')
      
      const tokens = tokenizer.tokenize(script.toLowerCase())
      const wordFreq = {}
      
      tokens.forEach(token => {
        if (token.length > 3 && !stopWords.has(token) && !/^\d+$/.test(token)) {
          wordFreq[token] = (wordFreq[token] || 0) + 1
        }
      })

      // Sort by frequency
      const sortedWords = Object.entries(wordFreq)
        .sort((a, b) => b[1] - a[1])
        .map(([word]) => word)

      // Add more keywords
      for (const word of sortedWords) {
        if (keywords.length >= segmentCount) break
        if (!keywords.includes(word)) {
          keywords.push(word)
        }
      }
    }

    // If still not enough, add generic visual keywords
    if (keywords.length < segmentCount) {
      const genericKeywords = [
        'nature', 'people', 'city', 'sky', 'hands', 'face',
        'sunset', 'ocean', 'mountain', 'forest', 'river',
        'প্রকৃতি', 'মানুষ', 'শহর', 'আকাশ', 'সূর্যাস্ত', 'নদী'
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
