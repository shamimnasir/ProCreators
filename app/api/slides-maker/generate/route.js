import { NextResponse } from 'next/server'
import { generateText } from '@/lib/gemini-text'
import { generateImage } from '@/lib/gemini-image'

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

// Generate background image for a slide
async function generateSlideBackground(slideTitle, slideType, topic, themeColor) {
  const colorDescriptions = {
    'modern-blue': 'deep blue and cyan gradient',
    'corporate-dark': 'dark charcoal and subtle gold accents',
    'fresh-green': 'fresh green and nature-inspired',
    'elegant-purple': 'elegant purple and lavender gradient',
    'warm-orange': 'warm orange and sunset tones',
    'minimal-gray': 'minimal gray and white clean'
  }
  
  const colorDesc = colorDescriptions[themeColor] || 'professional blue gradient'
  
  const imagePrompts = {
    'title': `Professional presentation title slide background, ${colorDesc}, abstract geometric shapes, modern corporate design, cinematic lighting, 16:9 aspect ratio, no text, clean minimalist`,
    'content': `Professional presentation slide background, ${colorDesc}, subtle abstract patterns, modern business design, soft gradient, 16:9 aspect ratio, no text, leaves space for content`,
    'section': `Bold section divider slide background, ${colorDesc}, dramatic lighting, abstract shapes, modern design, 16:9 aspect ratio, no text`,
    'quote': `Inspirational quote slide background, ${colorDesc}, elegant abstract design, subtle textures, atmospheric lighting, 16:9 aspect ratio, no text`,
    'stats': `Data visualization slide background, ${colorDesc}, subtle grid patterns, modern tech aesthetic, clean design, 16:9 aspect ratio, no text`,
    'two-column': `Comparison slide background, ${colorDesc}, split design elements, modern corporate, balanced composition, 16:9 aspect ratio, no text`,
    'conclusion': `Professional conclusion slide background, ${colorDesc}, impactful design, celebratory yet professional, 16:9 aspect ratio, no text`,
    'cta': `Call to action slide background, ${colorDesc}, energetic yet professional, modern design, eye-catching, 16:9 aspect ratio, no text`
  }
  
  const basePrompt = imagePrompts[slideType] || imagePrompts['content']
  const contextPrompt = `${basePrompt}. Theme related to: ${topic}. Slide title: ${slideTitle}`
  
  try {
    const result = await generateImage(contextPrompt, 'gemini-3-pro-image-preview', 'standard', '1792x1024')
    if (result.success && result.imageUrl) {
      return result.imageUrl
    }
    return null
  } catch (error) {
    console.error('Failed to generate slide background:', error)
    return null
  }
}

export async function POST(request) {
  try {
    const { 
      topic, 
      presentationType = 'business',
      slideCount = 8,
      language = 'english',
      audience = 'general',
      additionalContext = '',
      theme = 'modern-blue',
      generateImages = true
    } = await request.json()
    
    if (!topic) {
      return NextResponse.json(
        { success: false, error: 'Topic is required' },
        { status: 400 }
      )
    }

    console.log(`Generating ${slideCount} slides for: "${topic}" (${presentationType})`)

    const typeContext = PRESENTATION_TYPES[presentationType] || PRESENTATION_TYPES['business']
    
    // Detect if topic contains non-ASCII characters (likely non-English)
    const containsBengali = /[\u0980-\u09FF]/.test(topic)
    const containsHindi = /[\u0900-\u097F]/.test(topic)
    const containsArabic = /[\u0600-\u06FF]/.test(topic)
    const containsChinese = /[\u4E00-\u9FFF]/.test(topic)
    const containsJapanese = /[\u3040-\u30FF]/.test(topic)
    const containsKorean = /[\uAC00-\uD7AF]/.test(topic)
    
    let detectedLanguage = 'English'
    let languageScript = 'Latin'
    
    if (containsBengali) {
      detectedLanguage = 'Bengali (বাংলা)'
      languageScript = 'Bengali script'
    } else if (containsHindi) {
      detectedLanguage = 'Hindi (हिन्दी)'
      languageScript = 'Devanagari script'
    } else if (containsArabic) {
      detectedLanguage = 'Arabic (العربية)'
      languageScript = 'Arabic script'
    } else if (containsChinese) {
      detectedLanguage = 'Chinese (中文)'
      languageScript = 'Chinese characters'
    } else if (containsJapanese) {
      detectedLanguage = 'Japanese (日本語)'
      languageScript = 'Japanese script'
    } else if (containsKorean) {
      detectedLanguage = 'Korean (한국어)'
      languageScript = 'Korean script'
    }
    
    console.log(`Detected language: ${detectedLanguage}`)

    // For non-English, use a much more directive prompt
    const isNonEnglish = detectedLanguage !== 'English'
    
    const systemPrompt = isNonEnglish 
      ? `You are a presentation designer who writes ONLY in ${detectedLanguage}.
RULE 1: All text content must be in ${detectedLanguage} using ${languageScript}.
RULE 2: Never write English except for the "imagePrompt" field.
RULE 3: If the user's topic is "${topic}", respond in the same language.`
      : `You are an expert presentation designer. Create compelling, professional presentation slides.
Rules:
- Each slide should have a clear purpose
- Use concise, impactful text
- Bullet points should be 5-8 words each
- Include speaker notes for each slide`

    const languageDirective = isNonEnglish 
      ? `

🚨 LANGUAGE: ${detectedLanguage} 🚨
The input topic "${topic}" is in ${detectedLanguage}.
YOU MUST WRITE ALL OUTPUT IN ${detectedLanguage}.
- title: MUST be ${detectedLanguage}
- subtitle: MUST be ${detectedLanguage}
- bullets: MUST be ${detectedLanguage}
- quote: MUST be ${detectedLanguage}
- stats labels: MUST be ${detectedLanguage}
- speakerNotes: MUST be ${detectedLanguage}
- ONLY "imagePrompt" is in English

DO NOT translate to English. Keep everything in ${detectedLanguage}.

`
      : ''

    const userPrompt = `${languageDirective}Create a ${slideCount}-slide ${typeContext} about: "${topic}"

Target Audience: ${audience}
${additionalContext ? `Additional Context: ${additionalContext}` : ''}

Generate a JSON presentation. ${isNonEnglish ? `ALL text content in ${detectedLanguage}, except imagePrompt which is English.` : ''}
{
  "title": "[TITLE IN ${detectedLanguage}]",
  "subtitle": "[SUBTITLE IN ${detectedLanguage}]",
  "slides": [
    {
      "slideNumber": 1,
      "type": "title",
      "title": "[TITLE IN ${detectedLanguage}]",
      "subtitle": "[SUBTITLE IN ${detectedLanguage}]",
      "speakerNotes": "[NOTES IN ${detectedLanguage}]",
      "imagePrompt": "Description in English for image generation"
    },
    {
      "slideNumber": 2,
      "type": "content",
      "title": "[TITLE IN ${detectedLanguage}]",
      "bullets": ["[POINT IN ${detectedLanguage}]", "[POINT IN ${detectedLanguage}]"],
      "speakerNotes": "[NOTES IN ${detectedLanguage}]",
      "imagePrompt": "Description in English for image generation"
    },
    {
      "slideNumber": 3,
      "type": "two-column",
      "title": "[TITLE IN ${detectedLanguage}]",
      "leftColumn": { "heading": "[HEADING IN ${detectedLanguage}]", "points": ["[POINT]", "[POINT]"] },
      "rightColumn": { "heading": "[HEADING IN ${detectedLanguage}]", "points": ["[POINT]", "[POINT]"] },
      "speakerNotes": "[NOTES IN ${detectedLanguage}]",
      "imagePrompt": "Description in English"
    },
    {
      "slideNumber": 4,
      "type": "quote",
      "quote": "[QUOTE IN ${detectedLanguage}]",
      "attribution": "[AUTHOR NAME]",
      "speakerNotes": "[NOTES IN ${detectedLanguage}]",
      "imagePrompt": "Description in English"
    },
    {
      "slideNumber": 5,
      "type": "stats",
      "title": "[TITLE IN ${detectedLanguage}]",
      "stats": [
        { "value": "85%", "label": "[LABEL IN ${detectedLanguage}]" },
        { "value": "2.5x", "label": "[LABEL IN ${detectedLanguage}]" }
      ],
      "speakerNotes": "[NOTES IN ${detectedLanguage}]",
      "imagePrompt": "Description in English"
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

For imagePrompt: Describe a professional, modern background that fits the slide content. Be specific about colors, mood, and visual elements. The image should complement the text content.

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

    // Generate background images for all slides if requested
    if (generateImages) {
      console.log('Generating background images for slides...')
      
      // Generate images in parallel for speed
      const imagePromises = presentation.slides.map(async (slide, index) => {
        try {
          console.log(`Generating image for slide ${index + 1}...`)
          const imageUrl = await generateSlideBackground(
            slide.title || slide.quote || `Slide ${index + 1}`,
            slide.type,
            topic,
            theme
          )
          return { index, imageUrl }
        } catch (error) {
          console.error(`Failed to generate image for slide ${index + 1}:`, error)
          return { index, imageUrl: null }
        }
      })

      const imageResults = await Promise.all(imagePromises)
      
      // Update slides with generated images
      imageResults.forEach(({ index, imageUrl }) => {
        if (imageUrl) {
          presentation.slides[index].backgroundImage = imageUrl
        }
      })
      
      console.log('Background images generated')
    }

    // Add default styling to each slide
    presentation.slides = presentation.slides.map((slide, index) => ({
      ...slide,
      id: `slide-${index + 1}-${Date.now()}`,
      style: {
        backgroundColor: '#1e40af',
        textColor: '#ffffff',
        fontSize: 'normal',
        textAlign: 'left'
      }
    }))

    return NextResponse.json({
      success: true,
      presentation: {
        id: `pres-${Date.now()}`,
        title: presentation.title || topic,
        subtitle: presentation.subtitle || '',
        slides: presentation.slides,
        metadata: {
          topic,
          presentationType,
          slideCount: presentation.slides.length,
          language,
          audience,
          theme,
          createdAt: new Date().toISOString()
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
