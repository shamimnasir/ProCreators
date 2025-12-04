import { NextResponse } from 'next/server'
import { generateText } from '@/lib/gemini-text'
import { generateImage } from '@/lib/gemini-image'

export async function POST(request) {
  try {
    const { prompt, language, slideCount = 5, width = 1080, height = 1080, platform = 'instagram-square', generationMode = 'auto', manualSlides = [], logo = null, logoSize = 80, logoPosition = 'top-right' } = await request.json()
    
    // Validation based on mode
    if (generationMode === 'auto' && !prompt) {
      return NextResponse.json(
        { success: false, error: 'Prompt is required for auto-generation mode' },
        { status: 400 }
      )
    }
    
    if (generationMode === 'manual' && (!manualSlides || manualSlides.length === 0)) {
      return NextResponse.json(
        { success: false, error: 'At least one slide text is required for manual mode' },
        { status: 400 }
      )
    }

    let carouselSequence = []

    // Step 1: Get carousel text content (either generate or use manual input)
    if (generationMode === 'manual') {
      // Manual mode - use user-provided text
      console.log('Manual mode: Using user-provided slide text')
      carouselSequence = manualSlides.map((slide, index) => ({
        slideNumber: slide.slideNumber || (index + 1),
        text: slide.text,
        imagePrompt: `modern professional social media background for ${platform.includes('instagram') ? 'Instagram' : platform.includes('facebook') ? 'Facebook' : 'LinkedIn'} carousel slide`
      }))
    } else {
      // Auto mode - generate text with AI
      console.log('Auto mode: Generating carousel text content with AI')
      const carouselSystemPrompt = `You are a social media carousel content expert. Create a ${slideCount}-slide carousel sequence.

For the topic provided, create ${slideCount} slides with:
1. A hook/title slide
2. Content slides explaining key points
3. A call-to-action or conclusion slide

For each slide, provide:
- Slide number
- Text content (15-25 words, punchy and engaging) in ${language === 'bengali' ? 'Bengali (বাংলা)' : 'English'}
- Image description (background scene/visual elements for the image - the text will be overlaid automatically)

IMPORTANT for Image Prompts:
- Describe the background visual: colors, gradients, objects, scenes, mood
- Keep it suitable for text overlay (not too busy or cluttered)
- Examples: "vibrant purple gradient background", "minimalist workspace scene", "colorful abstract shapes"
- The text content will be added as overlay automatically using DALL-E 3

Format your response as JSON array:
[
  {
    "slideNumber": 1,
    "text": "Hook or title text here (in ${language === 'bengali' ? 'Bengali' : 'English'})",
    "imagePrompt": "Pure visual description with NO TEXT AT ALL"
  },
  ...
]

Language for text content: ${language === 'bengali' ? 'Bengali (বাংলা)' : 'English'}
Keep text concise and impactful. Images should be text-free visuals that support the text.`

      console.log('Step 1: Generating carousel sequence...')
      const sequenceResult = await generateText(
        `Create a ${slideCount}-slide carousel about: ${prompt}`,
        carouselSystemPrompt
      )

      if (!sequenceResult.success) {
        throw new Error('Failed to generate carousel sequence')
      }

      // Parse the carousel sequence
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
    }

    console.log(`Step 2: Generating ${carouselSequence.length} images...`)

    // Step 2: Generate images for each slide
    const slides = []
    for (let i = 0; i < carouselSequence.length; i++) {
      const slide = carouselSequence[i]
      
      console.log(`Generating image ${i + 1}/${carouselSequence.length} for ${platform} (${width}x${height})...`)
      
      // Determine aspect ratio description
      const aspectRatio = width / height
      let aspectDesc = 'square'
      if (aspectRatio > 1.5) aspectDesc = 'wide landscape'
      else if (aspectRatio > 1.1) aspectDesc = 'landscape'
      else if (aspectRatio < 0.9) aspectDesc = 'portrait'
      else if (aspectRatio < 0.7) aspectDesc = 'tall portrait'
      
      // Use Gemini 3 Pro Image Preview - best for Bengali text rendering
      // Include the exact text to be displayed with size optimization
      const textOverlayPrompt = `Create a professional ${platform.includes('instagram') ? 'Instagram' : platform.includes('facebook') ? 'Facebook' : 'LinkedIn'} carousel image in ${aspectDesc} ${width}x${height} format. Background: ${slide.imagePrompt}. TEXT TO DISPLAY (render EXACTLY as written): "${slide.text}". Use large, bold typography optimized for ${aspectDesc} format. Make the text clearly readable with high contrast. Modern social media design.`
      
      // Generate image - will use Gemini 3 Pro if Google API key available, otherwise DALL-E 3
      const imageResult = await generateImage(
        textOverlayPrompt,
        'gemini-3-pro-image-preview',
        'standard',
        `${width}x${height}`
      )

      if (imageResult.success) {
        let finalImageUrl = imageResult.imageUrl
        
        // Add logo if provided
        if (logo) {
          console.log(`Adding logo to slide ${i + 1}...`)
          try {
            const logoResult = await new Promise((resolve, reject) => {
              const pythonProcess = spawn('/root/.venv/bin/python3', [
                '/app/scripts/add_logo_to_image.py'
              ])

              let stdout = ''
              let stderr = ''

              pythonProcess.stdout.on('data', (data) => {
                stdout += data.toString()
              })

              pythonProcess.stderr.on('data', (data) => {
                stderr += data.toString()
              })

              pythonProcess.on('close', (code) => {
                if (code !== 0) {
                  reject(new Error(`Logo script exited with code ${code}: ${stderr}`))
                  return
                }

                try {
                  const result = JSON.parse(stdout)
                  resolve(result)
                } catch (e) {
                  reject(new Error(`Failed to parse logo script output: ${e.message}`))
                }
              })

              // Send input data
              pythonProcess.stdin.write(JSON.stringify({
                image: finalImageUrl,
                logo: logo,
                logoSize: logoSize,
                logoPosition: logoPosition
              }))
              pythonProcess.stdin.end()
            })

            if (logoResult.success) {
              finalImageUrl = logoResult.image
              console.log(`Logo added successfully to slide ${i + 1}`)
            }
          } catch (logoError) {
            console.error(`Failed to add logo to slide ${i + 1}:`, logoError.message)
            // Continue with original image if logo fails
          }
        }
        
        slides.push({
          slideNumber: slide.slideNumber || (i + 1),
          text: slide.text,
          imageUrl: finalImageUrl,
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
