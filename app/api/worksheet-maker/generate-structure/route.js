import { NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY)

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
    const { subject, topic, gradeLevel, worksheetType, questionCount, language } = await request.json()
    
    if (!subject || !topic) {
      return NextResponse.json(
        { success: false, error: 'Subject and topic are required' },
        { status: 400 }
      )
    }
    
    // Determine target language
    const targetLanguage = language && language.trim() && language.toLowerCase() !== 'english' 
      ? language.trim() 
      : 'English'
    
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })
    
    // Build language instruction
    const languageInstruction = targetLanguage !== 'English'
      ? `\n\nIMPORTANT LANGUAGE REQUIREMENT: Generate ALL content (title, instructions, questions, answers, everything) in ${targetLanguage}. The entire worksheet must be written in ${targetLanguage} language. Do NOT translate - write naturally in ${targetLanguage}.`
      : '\n\nGenerate all content in English.'
    
    const prompt = `You are an expert educator. Create a comprehensive worksheet for:

Subject: ${subject}
Topic: ${topic}
Grade Level: ${gradeLevel || 'Middle School'}
Worksheet Type: ${worksheetType || 'Practice'}
Number of Questions: ${questionCount || 10}
Target Language: ${targetLanguage}

Generate a detailed worksheet with:
1. An engaging title
2. Clear instructions
3. Various question types (multiple choice, fill-in-blank, short answer, matching)
4. An answer key
5. Bonus/challenge questions

Format your response as JSON:
{
  "title": "...",
  "subject": "...",
  "topic": "...",
  "gradeLevel": "...",
  "instructions": "...",
  "sections": [
    {
      "name": "Section Name",
      "type": "multiple-choice|fill-blank|short-answer|matching|true-false",
      "instructions": "Section-specific instructions...",
      "questions": [
        {
          "question": "...",
          "options": ["A) ...", "B) ...", "C) ...", "D) ..."],
          "answer": "...",
          "points": 1
        }
      ]
    }
  ],
  "bonusQuestions": [
    { "question": "...", "answer": "...", "points": 5 }
  ],
  "totalPoints": 100
}

Make questions educational, age-appropriate, and progressively challenging.${languageInstruction}
IMPORTANT: Return ONLY valid JSON, no markdown code blocks.`

    const result = await model.generateContent(prompt)
    const response = await result.response
    let text = response.text().trim()
    
    text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    
    const worksheet = JSON.parse(text)
    
    // Sanitize all fields
    worksheet.title = sanitizeText(worksheet.title)
    worksheet.instructions = sanitizeText(worksheet.instructions)
    
    if (worksheet.sections) {
      worksheet.sections = worksheet.sections.map(s => ({
        ...s,
        name: sanitizeText(s.name),
        instructions: sanitizeText(s.instructions),
        questions: (s.questions || []).map(q => ({
          ...q,
          question: sanitizeText(q.question),
          options: (q.options || []).map(o => sanitizeText(o)),
          answer: sanitizeText(q.answer)
        }))
      }))
    }
    
    if (worksheet.bonusQuestions) {
      worksheet.bonusQuestions = worksheet.bonusQuestions.map(q => ({
        ...q,
        question: sanitizeText(q.question),
        answer: sanitizeText(q.answer)
      }))
    }
    
    console.log('AI generated worksheet structure successfully')
    
    return NextResponse.json({
      success: true,
      worksheet
    })
    
  } catch (error) {
    console.error('Worksheet generation error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to generate worksheet' },
      { status: 500 }
    )
  }
}
