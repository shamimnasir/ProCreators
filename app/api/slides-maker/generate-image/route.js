import { NextResponse } from 'next/server'
import { generateImage } from '@/lib/gemini-image'

export async function POST(request) {
  try {
    const { 
      slideTitle,
      slideType = 'content',
      topic,
      theme = 'modern-blue',
      customPrompt
    } = await request.json()
    
    const colorDescriptions = {
      'modern-blue': 'deep blue and cyan gradient',
      'corporate-dark': 'dark charcoal and subtle gold accents',
      'fresh-green': 'fresh green and nature-inspired',
      'elegant-purple': 'elegant purple and lavender gradient',
      'warm-orange': 'warm orange and sunset tones',
      'minimal-gray': 'minimal gray and white clean'
    }
    
    const colorDesc = colorDescriptions[theme] || 'professional blue gradient'
    
    // Use custom prompt if provided, otherwise generate based on slide type
    let imagePrompt
    if (customPrompt) {
      imagePrompt = `Professional presentation slide background: ${customPrompt}. ${colorDesc} color scheme. 16:9 aspect ratio, no text, modern design.`
    } else {
      const typePrompts = {
        'title': `Professional presentation title slide background, ${colorDesc}, abstract geometric shapes, modern corporate design, cinematic lighting, 16:9 aspect ratio, no text, clean minimalist`,
        'content': `Professional presentation slide background, ${colorDesc}, subtle abstract patterns, modern business design, soft gradient, 16:9 aspect ratio, no text, leaves space for content`,
        'section': `Bold section divider slide background, ${colorDesc}, dramatic lighting, abstract shapes, modern design, 16:9 aspect ratio, no text`,
        'quote': `Inspirational quote slide background, ${colorDesc}, elegant abstract design, subtle textures, atmospheric lighting, 16:9 aspect ratio, no text`,
        'stats': `Data visualization slide background, ${colorDesc}, subtle grid patterns, modern tech aesthetic, clean design, 16:9 aspect ratio, no text`,
        'two-column': `Comparison slide background, ${colorDesc}, split design elements, modern corporate, balanced composition, 16:9 aspect ratio, no text`,
        'conclusion': `Professional conclusion slide background, ${colorDesc}, impactful design, celebratory yet professional, 16:9 aspect ratio, no text`,
        'cta': `Call to action slide background, ${colorDesc}, energetic yet professional, modern design, eye-catching, 16:9 aspect ratio, no text`
      }
      
      imagePrompt = typePrompts[slideType] || typePrompts['content']
      if (topic) {
        imagePrompt += `. Theme related to: ${topic}`
      }
      if (slideTitle) {
        imagePrompt += `. Slide concept: ${slideTitle}`
      }
    }
    
    console.log('Generating slide background with prompt:', imagePrompt.substring(0, 100) + '...')
    
    const result = await generateImage(imagePrompt, 'gemini-3-pro-image-preview', 'standard', '1792x1024')
    
    if (result.success && result.imageUrl) {
      return NextResponse.json({
        success: true,
        imageUrl: result.imageUrl
      })
    } else {
      throw new Error(result.error || 'Failed to generate image')
    }
    
  } catch (error) {
    console.error('Slide image generation error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to generate slide image' },
      { status: 500 }
    )
  }
}
