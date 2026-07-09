import { NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { enforceRateLimit } from '@/lib/rate-limiter'

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
    // SECURITY: Rate limiting for content generation
    const rateLimitCheck = await enforceRateLimit(request, 'content_generate')
    if (rateLimitCheck.limited) {
      return rateLimitCheck.response
    }

    const { journalType, purpose, duration, targetAudience } = await request.json()
    
    if (!journalType) {
      return NextResponse.json(
        { success: false, error: 'Journal type is required' },
        { status: 400 }
      )
    }
    
    // Sprint 3 — therapeutic modes get extra clinical scaffolding
    const THERAPEUTIC_MODES = {
      'adhd': 'Executive-function scaffolding for adults with ADHD. Use short chunked prompts (never long paragraphs). Include Distraction Log, Dopamine Deposits (small wins), Time-Blocked Focus Sprints, medication check-in, and non-judgmental language.',
      'cbt': 'Standard CBT thought-record structure (Beck / Padesky). Include the classic 5–7 column thought record on every daily page, a reference page listing 10 core cognitive distortions with brief examples, and a Behavioral Activation tracker. Include a plain-English wellness disclaimer that this is not a substitute for therapy.',
      'postpartum': 'Compassionate postpartum mental-wellness journal for new mothers. Include gentle daily mood, sleep, feeding and body-recovery prompts, a weekly Edinburgh Postnatal Depression Scale (EPDS)-style self check-in, and a "When to Reach Out" page listing warning signs. Warm, non-judgmental language that affirms asking for help is a strength.'
    }
    const isTherapeutic = !!THERAPEUTIC_MODES[journalType]
    const modeGuidance = THERAPEUTIC_MODES[journalType] || ''
    
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })
    
    const prompt = `You are an expert journal designer. Create a comprehensive journal template structure for:

Journal Type: ${journalType}
Purpose: ${purpose || 'Personal growth and reflection'}
Duration: ${duration || '90 days'}
Target Audience: ${targetAudience || 'Adults seeking self-improvement'}
${isTherapeutic ? `\nCLINICAL MODE CONTEXT (strictly follow): ${modeGuidance}\nInclude a plain-English wellness disclaimer as a "disclaimer" field. Do NOT diagnose, prescribe, or use clinical jargon without plain-English explanation.\n` : ''}
Generate a detailed journal structure with:
1. An inspiring journal title
2. A motivating subtitle
3. A welcome message/introduction for the user
4. Daily/Weekly prompts organized by section
5. Reflection questions
6. Affirmations or quotes

Format your response as JSON:
{
  "title": "...",
  "subtitle": "...",
  "introduction": "Welcome message explaining how to use this journal...",${isTherapeutic ? '\n  "disclaimer": "Plain-English self-help disclaimer",' : ''}
  "sections": [
    {
      "name": "Section Name",
      "description": "What this section is for",
      "frequency": "daily|weekly|monthly",
      "prompts": [
        { "question": "...", "lines": 3 },
        { "question": "...", "lines": 5 }
      ]
    }
  ],
  "weeklyReflection": {
    "title": "Weekly Reflection",
    "questions": ["...", "...", "..."]
  },
  "monthlyReview": {
    "title": "Monthly Review", 
    "questions": ["...", "...", "..."]
  },
  "affirmations": ["...", "...", "...", "...", "..."],
  "quotes": [
    { "text": "...", "author": "..." },
    { "text": "...", "author": "..." }
  ]
}

Make the prompts thoughtful and specific to the journal type.
IMPORTANT: Return ONLY valid JSON, no markdown code blocks. Use plain ASCII characters only.`

    const result = await model.generateContent(prompt)
    const response = await result.response
    let text = response.text().trim()
    
    text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    
    const structure = JSON.parse(text)
    
    // Sanitize all fields
    structure.title = sanitizeText(structure.title)
    structure.subtitle = sanitizeText(structure.subtitle)
    structure.introduction = sanitizeText(structure.introduction)
    
    if (structure.sections) {
      structure.sections = structure.sections.map(s => ({
        ...s,
        name: sanitizeText(s.name),
        description: sanitizeText(s.description),
        prompts: (s.prompts || []).map(p => ({
          question: sanitizeText(p.question),
          lines: p.lines || 3
        }))
      }))
    }
    
    if (structure.weeklyReflection) {
      structure.weeklyReflection.questions = (structure.weeklyReflection.questions || []).map(q => sanitizeText(q))
    }
    
    if (structure.monthlyReview) {
      structure.monthlyReview.questions = (structure.monthlyReview.questions || []).map(q => sanitizeText(q))
    }
    
    if (structure.affirmations) {
      structure.affirmations = structure.affirmations.map(a => sanitizeText(a))
    }
    
    if (structure.quotes) {
      structure.quotes = structure.quotes.map(q => ({
        text: sanitizeText(q.text),
        author: sanitizeText(q.author)
      }))
    }
    
    return NextResponse.json({
      success: true,
      structure
    })
    
  } catch (error) {
    console.error('Journal structure generation error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to generate structure' },
      { status: 500 }
    )
  }
}
