import { NextResponse } from 'next/server'
import { generateText } from '@/lib/gemini-text'
import { generateImage } from '@/lib/gemini-image'

export async function POST(request) {
  try {
    const { prompt, language, slideCount = 5 } = await request.json()
    
    if (!prompt) {
      return NextResponse.json(
        { success: false, error: 'Prompt is required' },
        { status: 400 }
      )
    }

    // Step 1: Generate carousel sequence with text for each slide
    const carouselSystemPrompt = `You are a social media carousel content expert. Create a ${slideCount}-slide carousel sequence.

For the topic provided, create ${slideCount} slides with:
1. A hook/title slide
2. Content slides explaining key points
3. A call-to-action or conclusion slide

For each slide, provide:
- Slide number
- Text content (15-25 words, punchy and engaging)
- Image description (detailed visual prompt for AI image generation)

Format your response as JSON array:
[
  {
    "slideNumber": 1,
    "text": "Hook or title text here",
    "imagePrompt": "Detailed description for image generation"
  },
  ...
]

Language: ${language === 'bengali' ? 'Bengali (বাংলা)' : 'English'}
Keep text concise and visual. Make each slide self-contained but part of a story.`

    console.log('Step 1: Generating carousel sequence...')
    const sequenceResult = await generateText(
      `Create a ${slideCount}-slide carousel about: ${prompt}`,
      carouselSystemPrompt
    )

    if (!sequenceResult.success) {
      throw new Error('Failed to generate carousel sequence')
    }

    // Parse the carousel sequence
    let carouselSequence
    try {
      // Try to extract JSON from the response
      const jsonMatch = sequenceResult.content.match(/\[[\s\S]*\]/)
      if (jsonMatch) {
        carouselSequence = JSON.parse(jsonMatch[0])
      } else {
        throw new Error('No JSON array found in response')
      }
    } catch (parseError) {
      console.error('Failed to parse carousel sequence:', parseError)
      return NextResponse.json(
        { success: false, error: 'Failed to parse carousel sequence. Please try again.' },
        { status: 500 }
      )
    }

    console.log(`Step 2: Generating ${carouselSequence.length} images...`)

    // Step 2: Generate images for each slide
    const slides = []
    for (let i = 0; i < carouselSequence.length; i++) {
      const slide = carouselSequence[i]
      
      console.log(`Generating image ${i + 1}/${carouselSequence.length}...`)
      
      // Generate image for this slide
      const imageResult = await generateImage(
        slide.imagePrompt,
        'gpt-image-1',
        'low' // Use low quality for faster generation
      )

      if (imageResult.success) {
        slides.push({
          slideNumber: slide.slideNumber || (i + 1),
          text: slide.text,
          imageUrl: imageResult.imageUrl,
          imagePrompt: slide.imagePrompt
        })
      } else {
        console.error(`Failed to generate image for slide ${i + 1}:`, imageResult.error)
        // Use placeholder if image generation fails
        slides.push({
          slideNumber: slide.slideNumber || (i + 1),
          text: slide.text,
          imageUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTAwIiBoZWlnaHQ9IjUwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNTAwIiBoZWlnaHQ9IjUwMCIgZmlsbD0iIzMzMzMzMyIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LXNpemU9IjI0IiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSI+SW1hZ2UgR2VuZXJhdGlvbiBGYWlsZWQ8L3RleHQ+PC9zdmc+',
          imagePrompt: slide.imagePrompt,
          error: imageResult.error
        })
      }
    }

    console.log(`Carousel generation complete! Generated ${slides.length} slides`)

    return NextResponse.json({
      success: true,
      slides,
      metadata: {
        prompt,
        language,
        slideCount: slides.length
      }
    })

  } catch (error) {
    console.error('Carousel generation error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to generate carousel' },
      { status: 500 }
    )
  }
}
