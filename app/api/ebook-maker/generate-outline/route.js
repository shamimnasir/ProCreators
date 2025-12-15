import { NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY)

// Helper to sanitize text - PRESERVES Unicode characters (Bengali, Hindi, Chinese, etc.)
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
    // Only remove control characters, NOT Unicode letters
    .replace(/[\x00-\x1F\x7F]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

// Detect language from text
function detectLanguage(text) {
  if (!text) return 'en'
  // Bengali
  if (/[\u0980-\u09FF]/.test(text)) return 'bn'
  // Hindi/Devanagari
  if (/[\u0900-\u097F]/.test(text)) return 'hi'
  // Chinese
  if (/[\u4E00-\u9FFF]/.test(text)) return 'zh'
  // Arabic
  if (/[\u0600-\u06FF]/.test(text)) return 'ar'
  // Japanese
  if (/[\u3040-\u309F\u30A0-\u30FF]/.test(text)) return 'ja'
  // Korean
  if (/[\uAC00-\uD7AF]/.test(text)) return 'ko'
  // Tamil
  if (/[\u0B80-\u0BFF]/.test(text)) return 'ta'
  // Telugu
  if (/[\u0C00-\u0C7F]/.test(text)) return 'te'
  return 'en'
}

export async function POST(request) {
  try {
    const { topic, genre, targetAudience, chapterCount, tone } = await request.json()
    
    if (!topic) {
      return NextResponse.json(
        { success: false, error: 'Topic is required' },
        { status: 400 }
      )
    }
    
    // Detect language from topic
    const detectedLang = detectLanguage(topic)
    const languageInstruction = detectedLang !== 'en' 
      ? `IMPORTANT: The topic is in a non-English language. Generate ALL content (title, subtitle, chapters, descriptions) in the SAME language as the topic. Do not translate to English.`
      : ''
    
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })
    
    const prompt = `You are an expert book author and content strategist. Create a detailed ebook outline for the following:

Topic: "${topic}"
Genre: ${genre || 'self-help/educational'}
Target Audience: ${targetAudience || 'general readers'}
Number of Chapters: ${chapterCount || 5}
Tone: ${tone || 'professional and engaging'}

${languageInstruction}

Generate a comprehensive outline with:
1. A compelling book title
2. A catchy subtitle
3. A brief book description (2-3 sentences)
4. An introduction summary
5. Detailed chapter outlines with:
   - Chapter title
   - Chapter summary (what this chapter covers)
   - 3-5 key points/sections within each chapter
   - Estimated word count
6. A conclusion summary

Format your response as JSON:
{
  "title": "...",
  "subtitle": "...",
  "description": "...",
  "targetAudience": "...",
  "introduction": {
    "title": "Introduction",
    "summary": "...",
    "keyPoints": ["...", "..."]
  },
  "chapters": [
    {
      "number": 1,
      "title": "...",
      "summary": "...",
      "keyPoints": ["...", "...", "..."],
      "estimatedWords": 1500
    }
  ],
  "conclusion": {
    "title": "Conclusion",
    "summary": "...",
    "keyPoints": ["...", "..."]
  }
}

Make the outline specific, actionable, and valuable. Each chapter should have clear, distinct content.
IMPORTANT: Return ONLY valid JSON, no markdown code blocks.`

    const result = await model.generateContent(prompt)
    const response = await result.response
    let text = response.text().trim()
    
    // Clean up response
    text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    
    const outline = JSON.parse(text)
    
    // Sanitize all fields (now preserves Unicode)
    outline.title = sanitizeText(outline.title)
    outline.subtitle = sanitizeText(outline.subtitle)
    outline.description = sanitizeText(outline.description)
    outline.targetAudience = sanitizeText(outline.targetAudience)
    
    if (outline.introduction) {
      outline.introduction.summary = sanitizeText(outline.introduction.summary)
      outline.introduction.keyPoints = (outline.introduction.keyPoints || []).map(p => sanitizeText(p))
    }
    
    if (outline.chapters) {
      outline.chapters = outline.chapters.map(ch => ({
        ...ch,
        title: sanitizeText(ch.title),
        summary: sanitizeText(ch.summary),
        keyPoints: (ch.keyPoints || []).map(p => sanitizeText(p))
      }))
    }
    
    if (outline.conclusion) {
      outline.conclusion.summary = sanitizeText(outline.conclusion.summary)
      outline.conclusion.keyPoints = (outline.conclusion.keyPoints || []).map(p => sanitizeText(p))
    }
    
    console.log('AI generated outline successfully')
    
    return NextResponse.json({
      success: true,
      outline
    })
    
  } catch (error) {
    console.error('Outline generation error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to generate outline' },
      { status: 500 }
    )
  }
}
