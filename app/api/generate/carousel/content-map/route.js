import { NextResponse } from 'next/server'
import { generateText } from '@/lib/gemini-text'

export async function POST(request) {
  try {
    const { prompt, language, slideCount = 5 } = await request.json()
    
    if (!prompt) {
      return NextResponse.json(
        { success: false, error: 'Prompt is required' },
        { status: 400 }
      )
    }

    // Generate structured content map
    const systemPrompt = `You are an expert content strategist for social media carousels.

Your task is to create a structured content map for a ${slideCount}-slide carousel.

STRICT FORMAT REQUIREMENTS:
- Return ONLY a JSON array with exactly ${slideCount} objects
- Each object must have: "slideNumber", "title", and "description"
- Follow this structure pattern:
  Slide 1: Introduction/Title/Hook
  Slides 2-4: Main points/steps
  Slide 5: Conclusion/Call-to-action

Example format for "5 productivity tips":
[
  {
    "slideNumber": 1,
    "title": "5 Productivity Tips",
    "description": "Hook: Transform your workday in 5 simple steps"
  },
  {
    "slideNumber": 2,
    "title": "Tip 1: Time Blocking",
    "description": "Schedule your day in dedicated time blocks"
  },
  {
    "slideNumber": 3,
    "title": "Tip 2: Remove Distractions",
    "description": "Turn off notifications and create focus zones"
  },
  {
    "slideNumber": 4,
    "title": "Tip 3 & 4: Take Breaks + Stay Organized",
    "description": "Regular breaks and clean workspace boost productivity"
  },
  {
    "slideNumber": 5,
    "title": "Tip 5: Review Daily",
    "description": "Reflect on what worked and plan tomorrow"
  }
]

Language: ${language === 'bengali' ? 'Bengali (বাংলা)' : 'English'}
Keep titles concise (3-7 words). Descriptions should be brief (10-15 words).`

    console.log('Generating content map for:', prompt)
    
    const result = await generateText(
      `Create a content map for a carousel about: ${prompt}`,
      systemPrompt
    )

    if (!result.success) {
      throw new Error('Failed to generate content map')
    }

    // Parse the content map
    let contentMap
    try {
      // Try to extract JSON from the response
      const jsonMatch = result.content.match(/\[[\s\S]*\]/)
      if (jsonMatch) {
        contentMap = JSON.parse(jsonMatch[0])
      } else {
        throw new Error('No JSON array found in response')
      }

      // Validate structure
      if (!Array.isArray(contentMap) || contentMap.length === 0) {
        throw new Error('Invalid content map structure')
      }

      // Ensure all required fields exist
      contentMap = contentMap.map((slide, index) => ({
        slideNumber: slide.slideNumber || (index + 1),
        title: slide.title || `Slide ${index + 1}`,
        description: slide.description || ''
      }))

    } catch (parseError) {
      console.error('Failed to parse content map:', result.content)
      return NextResponse.json(
        { success: false, error: 'Failed to parse content map. Please try again.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      contentMap: contentMap
    })

  } catch (error) {
    console.error('Content map generation error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to generate content map' },
      { status: 500 }
    )
  }
}
