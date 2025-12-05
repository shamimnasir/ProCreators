import { NextResponse } from 'next/server'
import { generateText } from '@/lib/gemini-text'

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

    // Use AI to extract thematic English keywords for stock video search
    const systemMessage = `You are an expert at analyzing stories and extracting visual keywords for stock video search.

CRITICAL TASK:
1. Read the story/script (may be in English, Bengali, or any language)
2. Understand the THEME and VISUAL CONCEPTS
3. Extract EXACTLY ${segmentCount} English keywords
4. Keywords must be visually descriptive for stock video search
5. Keywords should represent different scenes/moments in the story

OUTPUT RULES:
- Return ONLY a JSON array of ${segmentCount} keywords
- Each keyword should be 1-3 words maximum
- Use simple, searchable terms (e.g., "sunset", "happy family", "city street", "ocean waves")
- Avoid abstract concepts - focus on VISUAL elements
- Keywords should be in ENGLISH regardless of script language
- No explanations, no additional text, ONLY the JSON array

EXAMPLE OUTPUT FORMAT:
["sunset beach", "happy family", "city skyline", "forest path", "smiling child"]`

    const userPrompt = `Analyze this story and extract EXACTLY ${segmentCount} English keywords for stock video search:

Story/Script:
"""
${script}
"""

Remember: Return ONLY a JSON array of ${segmentCount} English keywords that represent visual scenes for this story.`

    console.log('[Keyword Extraction] Calling AI for thematic analysis...')

    const result = await generateText(userPrompt, systemMessage)

    if (!result.success) {
      throw new Error(result.error || 'AI keyword extraction failed')
    }

    console.log('[Keyword Extraction] AI response:', result.content)

    // Parse AI response to extract keywords array
    let keywords = []
    try {
      // Try to parse as JSON array
      const cleanedResponse = result.content
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .replace(/^[^[]*/, '') // Remove text before first [
        .replace(/[^\]]*$/, '') // Remove text after last ]
        .trim()
      
      keywords = JSON.parse(cleanedResponse)
      
      if (!Array.isArray(keywords)) {
        throw new Error('Response is not an array')
      }

      // Clean and validate keywords
      keywords = keywords
        .map(k => String(k).trim().toLowerCase())
        .filter(k => k.length > 0 && k.length < 50)
        .slice(0, segmentCount)

    } catch (parseError) {
      console.error('[Keyword Extraction] Parse error:', parseError)
      console.log('[Keyword Extraction] Trying fallback extraction...')
      
      // Fallback: extract words that look like keywords from the response
      const matches = result.content.match(/"([^"]+)"/g)
      if (matches && matches.length > 0) {
        keywords = matches
          .map(m => m.replace(/"/g, '').trim().toLowerCase())
          .filter(k => k.length > 2 && k.length < 50)
          .slice(0, segmentCount)
      }
    }

    // If still not enough keywords, add generic visual keywords
    if (keywords.length < segmentCount) {
      console.log('[Keyword Extraction] Adding fallback keywords...')
      
      const genericKeywords = [
        'nature landscape', 'people walking', 'city street', 'blue sky', 
        'sunset', 'ocean waves', 'mountain view', 'forest trees', 
        'happy family', 'smiling person', 'business meeting', 'technology',
        'celebration', 'sunrise', 'beach', 'flowers blooming'
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
      message: `Extracted ${keywords.length} thematic keywords for ${segmentCount} video segments`
    })

  } catch (error) {
    console.error('[Keyword Extraction] Error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to extract keywords' },
      { status: 500 }
    )
  }
}
