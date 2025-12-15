import { NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY)

// Helper to sanitize text - PRESERVES Unicode characters (Bengali, Hindi, Chinese, etc.)
function sanitizeText(text, preserveNewlines = false) {
  if (!text) return ''
  let result = String(text)
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/\u2026/g, '...')
    .replace(/\u2013/g, '-')
    .replace(/\u2014/g, '--')
    .replace(/\u00A0/g, ' ')
    // Only remove control characters, NOT Unicode letters
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
  
  if (preserveNewlines) {
    result = result.replace(/\n{3,}/g, '\n\n').replace(/[ \t]+/g, ' ')
  } else {
    result = result.replace(/[\r\n\t]/g, ' ').replace(/\s+/g, ' ')
  }
  
  return result.trim()
}

// Detect language from text
function detectLanguage(text) {
  if (!text) return 'en'
  if (/[\u0980-\u09FF]/.test(text)) return 'bn' // Bengali
  if (/[\u0900-\u097F]/.test(text)) return 'hi' // Hindi
  if (/[\u4E00-\u9FFF]/.test(text)) return 'zh' // Chinese
  if (/[\u0600-\u06FF]/.test(text)) return 'ar' // Arabic
  if (/[\u3040-\u309F\u30A0-\u30FF]/.test(text)) return 'ja' // Japanese
  if (/[\uAC00-\uD7AF]/.test(text)) return 'ko' // Korean
  return 'en'
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
    
    // Detect language from chapter title or book title
    const detectedLang = detectLanguage(chapterTitle) || detectLanguage(bookTitle)
    const languageInstruction = detectedLang !== 'en' 
      ? `CRITICAL: The content is in a non-English language. Write ALL content in the SAME language as the chapter title. Do NOT translate to English.`
      : ''
    
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })
    
    const prompt = `You are a bestselling author writing an engaging chapter for a popular non-fiction ebook.

BOOK: "${bookTitle || 'Untitled'}"
AUDIENCE: ${targetAudience || 'general readers looking for practical advice'}
CHAPTER: "${chapterTitle}"
ABOUT: ${chapterSummary || 'Cover the main topic in an engaging way'}

${languageInstruction}

CRITICAL WRITING STYLE RULES:
1. Write like a FRIEND giving advice, NOT like a textbook or research paper
2. Use SHORT paragraphs (2-4 sentences MAX per paragraph)
3. Break up content with clear SUBHEADINGS every 150-200 words
4. Include BULLET POINTS and numbered lists frequently
5. Add "Pro Tip:" or "Quick Tip:" callouts for practical advice
6. Use conversational language ("you'll find", "here's the thing", "let's be honest")
7. Include brief EXAMPLES or mini-stories to illustrate points
8. Vary sentence length - mix short punchy sentences with longer ones
9. End sections with a clear transition or question

DO NOT:
- Write long academic paragraphs
- Use formal/stiff language
- Create walls of text without breaks
- Be preachy or lecture-y

Key Points to weave in naturally:
${(keyPoints || ['Main concepts', 'Practical applications']).map((p, i) => `• ${p}`).join('\n')}

Target length: ${wordCount || 1200} words (quality over quantity)

FORMAT YOUR RESPONSE AS JSON:
{
  "title": "${chapterTitle}",
  "sections": [
    {
      "heading": "Opening Hook",
      "content": "2-3 short paragraphs that grab attention. Start with a relatable scenario or question.",
      "tips": ["Optional tip or callout"],
      "bullets": ["Optional bullet points"]
    },
    {
      "heading": "Section Subheading",
      "content": "Content broken into short paragraphs...",
      "tips": ["Pro Tip: practical advice here"],
      "bullets": ["Key point 1", "Key point 2"]
    }
  ],
  "keyTakeaways": [
    "One clear actionable takeaway",
    "Another practical insight",
    "Something they can do TODAY"
  ],
  "closingThought": "An inspiring or thought-provoking final sentence"
}

Create 4-6 sections. Each section should have a clear heading, short paragraphs in content, and optionally tips or bullets.
IMPORTANT: Return ONLY valid JSON, no markdown. Use plain ASCII.`

    const result = await model.generateContent(prompt)
    const response = await result.response
    let text = response.text().trim()
    
    // Clean up response
    text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    
    const chapter = JSON.parse(text)
    
    // Sanitize all fields
    chapter.title = sanitizeText(chapter.title)
    chapter.closingThought = sanitizeText(chapter.closingThought)
    
    if (chapter.sections) {
      chapter.sections = chapter.sections.map(s => ({
        heading: sanitizeText(s.heading),
        content: sanitizeText(s.content),
        tips: (s.tips || []).map(t => sanitizeText(t)),
        bullets: (s.bullets || []).map(b => sanitizeText(b))
      }))
    }
    
    if (chapter.keyTakeaways) {
      chapter.keyTakeaways = chapter.keyTakeaways.map(t => sanitizeText(t))
    }
    
    // Build combined content for simple display
    let combinedContent = ''
    if (chapter.sections) {
      chapter.sections.forEach(section => {
        if (section.content) {
          combinedContent += section.content + '\n\n'
        }
      })
    }
    chapter.content = combinedContent.trim()
    
    console.log(`AI generated chapter content: ${chapter.title} (${chapter.sections?.length || 0} sections)`)
    
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
