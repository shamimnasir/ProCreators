import { NextResponse } from 'next/server'
import { generateText } from '@/lib/gemini-text'

// Presentation types with specific prompts
const PRESENTATION_TYPES = {
  'business': 'professional business presentation with data-driven insights',
  'educational': 'educational presentation with clear learning objectives',
  'pitch': 'startup pitch deck with compelling storytelling',
  'creative': 'creative presentation with engaging visuals and storytelling',
  'report': 'formal report presentation with structured analysis',
  'training': 'training presentation with step-by-step instructions',
  'marketing': 'marketing presentation with persuasive messaging',
  'research': 'research presentation with methodology and findings'
}

export async function POST(request) {
  try {
    const { 
      topic, 
      presentationType = 'business',
      slideCount = 8,
      language = 'english',
      audience = 'general',
      additionalContext = ''
    } = await request.json()
    
    if (!topic) {
      return NextResponse.json(
        { success: false, error: 'Topic is required' },
        { status: 400 }
      )
    }

    console.log(`Generating ${slideCount} slides for: "${topic}" (${presentationType})`)

    const typeContext = PRESENTATION_TYPES[presentationType] || PRESENTATION_TYPES['business']
    const languageInstruction = language === 'bengali' ? 'Write ALL content in Bengali (বাংলা) language.' : 'Write in English.'

    const systemPrompt = `You are an expert presentation designer and content strategist. Create compelling, professional presentation slides.

${languageInstruction}

Rules:
- Each slide should have a clear purpose
- Use concise, impactful text (not too wordy)
- Bullet points should be 5-8 words each
- Include speaker notes for each slide
- Make content engaging and memorable
- Use only plain ASCII characters, no special symbols or emojis`

    const userPrompt = `Create a ${slideCount}-slide ${typeContext} about: "${topic}"

Target Audience: ${audience}
${additionalContext ? `Additional Context: ${additionalContext}` : ''}

Generate a complete presentation with this exact JSON structure:
{
  "title": "Main presentation title",
  "subtitle": "Subtitle or tagline",
  "slides": [
    {
      "slideNumber": 1,
      "type": "title",
      "title": "Presentation Title",
      "subtitle": "Subtitle here",
      "speakerNotes": "Notes for the presenter"
    },
    {
      "slideNumber": 2,
      "type": "content",
      "title": "Slide Title",
      "bullets": ["Point 1", "Point 2", "Point 3", "Point 4"],
      "speakerNotes": "Notes for this slide"
    },
    {
      "slideNumber": 3,
      "type": "two-column",
      "title": "Comparison Title",
      "leftColumn": { "heading": "Left", "points": ["Point 1", "Point 2"] },
      "rightColumn": { "heading": "Right", "points": ["Point 1", "Point 2"] },
      "speakerNotes": "Notes"
    },
    {
      "slideNumber": 4,
      "type": "quote",
      "quote": "Impactful quote here",
      "attribution": "Author Name",
      "speakerNotes": "Notes"
    },
    {
      "slideNumber": 5,
      "type": "stats",
      "title": "Key Statistics",
      "stats": [
        { "value": "85%", "label": "Description" },
        { "value": "2.5x", "label": "Description" },
        { "value": "$1M+", "label": "Description" }
      ],
      "speakerNotes": "Notes"
    }
  ]
}

Slide Types to use:
- "title" - Opening slide (slide 1)
- "content" - Standard bullet points
- "two-column" - Side by side comparison
- "quote" - Impactful quote
- "stats" - Key numbers/statistics
- "section" - Section divider
- "conclusion" - Final slide with key takeaways
- "cta" - Call to action (last slide)

Mix different slide types for variety. End with either "conclusion" or "cta" type.

IMPORTANT: Return ONLY valid JSON, no markdown code blocks.`

    const result = await generateText(userPrompt, systemPrompt)

    if (!result.success) {
      throw new Error(result.error || 'Failed to generate presentation content')
    }

    // Parse the response
    let presentation
    try {
      let content = result.content.trim()
      // Remove markdown code blocks if present
      content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      presentation = JSON.parse(content)
    } catch (parseError) {
      console.error('Failed to parse presentation JSON:', parseError)
      console.error('Raw content:', result.content)
      throw new Error('Failed to parse presentation structure')
    }

    // Validate structure
    if (!presentation.slides || !Array.isArray(presentation.slides)) {
      throw new Error('Invalid presentation structure')
    }

    console.log(`Generated ${presentation.slides.length} slides successfully`)

    return NextResponse.json({
      success: true,
      presentation: {
        title: presentation.title || topic,
        subtitle: presentation.subtitle || '',
        slides: presentation.slides,
        metadata: {
          topic,
          presentationType,
          slideCount: presentation.slides.length,
          language,
          audience
        }
      }
    })

  } catch (error) {
    console.error('Presentation generation error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to generate presentation' },
      { status: 500 }
    )
  }
}
