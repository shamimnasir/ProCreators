import { NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { enforceRateLimit } from '@/lib/rate-limiter'

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
    // SECURITY: Rate limiting for content generation
    const rateLimitCheck = await enforceRateLimit(request, 'content_generate')
    if (rateLimitCheck.limited) {
      return rateLimitCheck.response
    }

    const { checklistType, purpose, context } = await request.json()
    
    if (!checklistType) {
      return NextResponse.json(
        { success: false, error: 'Checklist type is required' },
        { status: 400 }
      )
    }
    
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })
    
    const prompt = `You are an expert organizer. Create a comprehensive checklist for:

Checklist Type: ${checklistType}
Purpose: ${purpose || 'General organization'}
Context: ${context || 'Personal use'}

Generate a detailed checklist with:
1. An appropriate title
2. Subtitle or description
3. Categories/sections with items
4. Priority levels where appropriate
5. Notes or tips

Format your response as JSON:
{
  "title": "...",
  "subtitle": "...",
  "description": "Brief description of the checklist purpose...",
  "categories": [
    {
      "name": "Category Name",
      "description": "What this category covers",
      "items": [
        { "text": "Item to check off", "priority": "high|medium|low", "notes": "Optional helpful note" }
      ]
    }
  ],
  "tips": ["Helpful tip 1", "Helpful tip 2"],
  "totalItems": 30
}

Make the checklist comprehensive, practical, and well-organized.
IMPORTANT: Return ONLY valid JSON, no markdown code blocks. Use plain ASCII characters only.`

    const result = await model.generateContent(prompt)
    const response = await result.response
    let text = response.text().trim()
    
    text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    
    const checklist = JSON.parse(text)
    
    // Sanitize all fields
    checklist.title = sanitizeText(checklist.title)
    checklist.subtitle = sanitizeText(checklist.subtitle)
    checklist.description = sanitizeText(checklist.description)
    
    if (checklist.categories) {
      checklist.categories = checklist.categories.map(c => ({
        ...c,
        name: sanitizeText(c.name),
        description: sanitizeText(c.description),
        items: (c.items || []).map(item => ({
          text: sanitizeText(item.text),
          priority: item.priority || 'medium',
          notes: sanitizeText(item.notes)
        }))
      }))
    }
    
    if (checklist.tips) {
      checklist.tips = checklist.tips.map(t => sanitizeText(t))
    }
    
    return NextResponse.json({
      success: true,
      checklist
    })
    
  } catch (error) {
    console.error('Checklist generation error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to generate checklist' },
      { status: 500 }
    )
  }
}
