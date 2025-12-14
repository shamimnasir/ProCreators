import { NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY)

// Helper to sanitize text
function sanitizeText(text) {
  if (!text) return ''
  return String(text)
    .replace(/[\r\n\t]/g, ' ')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/\u2026/g, '...')
    .replace(/\u2013/g, '-')
    .replace(/\u2014/g, '--')
    .replace(/\u00A0/g, ' ')
    .replace(/[^\x20-\x7E]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

export async function POST(request) {
  try {
    const { 
      chapterTitle, 
      chapterSummary, 
      keyPoints, 
      bookTitle, 
      bookContext,
      targetAudience,
      tone,
      wordCount 
    } = await request.json()
    
    if (!chapterTitle) {
      return NextResponse.json(
        { success: false, error: 'Chapter title is required' },
        { status: 400 }
      )
    }
    
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })
    
    const prompt = `You are an expert author writing a chapter for an ebook.

Book Title: "${bookTitle || 'Untitled'}"
Book Context: ${bookContext || 'Educational/informative book'}
Target Audience: ${targetAudience || 'general readers'}
Tone: ${tone || 'professional and engaging'}

Write Chapter: "${chapterTitle}"
Chapter Summary: ${chapterSummary || 'Cover the main topic'}
Key Points to Cover:
${(keyPoints || []).map((p, i) => `${i + 1}. ${p}`).join('\n')}

Target Word Count: ${wordCount || 1500} words

Write comprehensive, well-structured chapter content that:
1. Opens with an engaging introduction paragraph
2. Covers each key point in depth with examples and practical advice
3. Uses clear subheadings for each major section
4. Includes actionable tips and real-world applications
5. Ends with a summary and transition to the next topic

Format your response as JSON:
{
  "title": "...",
  "content": "Full chapter content with multiple paragraphs. Use clear paragraph breaks. Include practical examples and actionable advice.",
  "sections": [
    {
      "heading": "Section heading",
      "content": "Section content..."
    }
  ],
  "keyTakeaways": ["...", "...", "..."],
  "callToAction": "What the reader should do next..."
}

Write substantive, valuable content that provides real insights. Avoid fluff.
IMPORTANT: Return ONLY valid JSON, no markdown code blocks. Use plain ASCII characters only.`

    const result = await model.generateContent(prompt)
    const response = await result.response
    let text = response.text().trim()
    
    // Clean up response
    text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    
    const chapter = JSON.parse(text)
    
    // Sanitize all fields
    chapter.title = sanitizeText(chapter.title)
    chapter.content = sanitizeText(chapter.content)
    chapter.callToAction = sanitizeText(chapter.callToAction)
    
    if (chapter.sections) {
      chapter.sections = chapter.sections.map(s => ({
        heading: sanitizeText(s.heading),
        content: sanitizeText(s.content)
      }))
    }
    
    if (chapter.keyTakeaways) {
      chapter.keyTakeaways = chapter.keyTakeaways.map(t => sanitizeText(t))
    }
    
    console.log(`AI generated chapter content: ${chapter.title}`)
    
    return NextResponse.json({
      success: true,
      chapter
    })
    
  } catch (error) {
    console.error('Chapter generation error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to generate chapter' },
      { status: 500 }
    )
  }
}
