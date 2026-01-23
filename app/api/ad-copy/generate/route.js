import { NextResponse } from 'next/server'
import { spawn } from 'child_process'
import path from 'path'

// Copywriting Frameworks
const FRAMEWORKS = {
  aida: {
    name: 'AIDA',
    full: 'Attention, Interest, Desire, Action',
    description: 'Classic funnel that grabs attention, builds interest, creates desire, and ends with call to action',
    structure: '1. ATTENTION: Bold hook about problem\n2. INTEREST: Build with facts/features\n3. DESIRE: Show benefits/transformation\n4. ACTION: Clear CTA'
  },
  pas: {
    name: 'PAS',
    full: 'Problem, Agitation, Solution',
    description: 'Identifies pain point, intensifies emotional impact, presents product as solution',
    structure: '1. PROBLEM: Identify specific pain\n2. AGITATION: Highlight cost of inaction\n3. SOLUTION: Present product as answer'
  },
  bab: {
    name: 'BAB',
    full: 'Before, After, Bridge',
    description: 'Paints life with problem, contrasts with solved state, positions product as the bridge',
    structure: '1. BEFORE: Life with the problem\n2. AFTER: Life after solution\n3. BRIDGE: Product connects them'
  },
  fourps: {
    name: '4Ps',
    full: 'Picture, Promise, Proof, Push',
    description: 'Visualizes outcome, promises result, provides evidence, gives final nudge',
    structure: '1. PICTURE: Ideal outcome visualization\n2. PROMISE: Specific result guarantee\n3. PROOF: Testimonials/data evidence\n4. PUSH: Final nudge to act'
  },
  fab: {
    name: 'FAB',
    full: 'Features, Advantages, Benefits',
    description: 'Lists product features, explains advantages over others, shows life improvement',
    structure: '1. FEATURES: What product has\n2. ADVANTAGES: What it does better\n3. BENEFITS: How it improves user life'
  }
}

// Platform specifications
const PLATFORMS = {
  facebook: {
    name: 'Facebook/Instagram Feed',
    limits: 'Primary text: 125 chars ideal, headline: 40 chars, link desc: 30 chars',
    tips: 'Visual-first, emotional hooks, conversational tone'
  },
  google: {
    name: 'Google Ads',
    limits: 'Headlines: 30 chars each (x3), Descriptions: 90 chars each (x2)',
    tips: 'Keyword-rich, benefit-focused, strong CTAs'
  },
  tiktok: {
    name: 'TikTok Ads',
    limits: 'Hook in 2 seconds, short punchy copy',
    tips: 'Trending language, casual, stop-the-scroll hook'
  },
  linkedin: {
    name: 'LinkedIn Ads',
    limits: 'Intro text: 150 chars ideal, headline: 70 chars',
    tips: 'Professional, B2B focus, data-driven claims'
  },
  instagram: {
    name: 'Instagram Stories/Reels',
    limits: 'Very short, 1-2 lines max',
    tips: 'Visual-first, emoji-friendly, casual energy'
  },
  youtube: {
    name: 'YouTube Ads',
    limits: 'Hook in 5 seconds, concise message',
    tips: 'Strong opening, value prop fast, clear CTA'
  },
  email: {
    name: 'Email Subject Lines',
    limits: 'Under 50 chars ideal, preview text: 35-90 chars',
    tips: 'Curiosity gap, personalization, urgency'
  }
}

// Ad Goals
const GOALS = {
  awareness: 'Brand Awareness - Introduce brand to new audiences',
  traffic: 'Website Traffic - Drive clicks and visits',
  leads: 'Lead Generation - Collect emails, signups, inquiries',
  sales: 'Direct Sales/Conversions - Immediate purchase action',
  engagement: 'Engagement - Likes, comments, shares, saves',
  app: 'App Installs - Download and install app'
}

// Tones
const TONES = {
  professional: 'Professional and authoritative',
  casual: 'Casual, friendly, and approachable',
  urgent: 'Urgent with FOMO elements',
  funny: 'Funny, witty, and playful',
  emotional: 'Emotional and heartfelt',
  luxurious: 'Luxurious, premium, and exclusive'
}

async function callLLM(prompt, systemPrompt) {
  return new Promise((resolve, reject) => {
    const scriptPath = path.join(process.cwd(), 'scripts', 'llm_call.py')
    const inputData = JSON.stringify({
      prompt,
      system_prompt: systemPrompt
    })
    
    const pythonProcess = spawn('/root/.venv/bin/python3', [scriptPath, inputData])
    
    let stdout = ''
    let stderr = ''
    
    pythonProcess.stdout.on('data', (data) => { stdout += data.toString() })
    pythonProcess.stderr.on('data', (data) => { stderr += data.toString() })
    
    pythonProcess.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(stderr || stdout || 'LLM call failed'))
      } else {
        try {
          const result = JSON.parse(stdout)
          if (result.success) {
            resolve(result.content || result.response || stdout)
          } else {
            reject(new Error(result.error || 'LLM call failed'))
          }
        } catch {
          resolve(stdout.trim())
        }
      }
    })
  })
}

export async function POST(request) {
  try {
    const body = await request.json()
    const {
      productName,
      productDescription,
      targetAudience,
      uniqueSellingPoints,
      platform,
      goal,
      tone,
      framework,
      painPoints,
      benefits,
      socialProof,
      offer,
      variationCount = 3
    } = body

    if (!productName) {
      return NextResponse.json(
        { success: false, error: 'Product/Service name is required' },
        { status: 400 }
      )
    }

    // Language detection - combine all text inputs
    const allText = `${productName} ${productDescription || ''} ${targetAudience || ''} ${painPoints || ''} ${benefits || ''}`
    
    // Detect non-Latin scripts
    const bengaliPattern = /[\u0980-\u09FF]/
    const hindiPattern = /[\u0900-\u097F]/
    const arabicPattern = /[\u0600-\u06FF]/
    const chinesePattern = /[\u4E00-\u9FFF]/
    const japanesePattern = /[\u3040-\u309F\u30A0-\u30FF]/
    const koreanPattern = /[\uAC00-\uD7AF]/
    const thaiPattern = /[\u0E00-\u0E7F]/
    const tamilPattern = /[\u0B80-\u0BFF]/
    const teluguPattern = /[\u0C00-\u0C7F]/
    
    let detectedLanguage = 'English'
    let isNonEnglish = false
    
    if (bengaliPattern.test(allText)) {
      detectedLanguage = 'Bengali (বাংলা)'
      isNonEnglish = true
    } else if (hindiPattern.test(allText)) {
      detectedLanguage = 'Hindi (हिंदी)'
      isNonEnglish = true
    } else if (arabicPattern.test(allText)) {
      detectedLanguage = 'Arabic (العربية)'
      isNonEnglish = true
    } else if (chinesePattern.test(allText)) {
      detectedLanguage = 'Chinese (中文)'
      isNonEnglish = true
    } else if (japanesePattern.test(allText)) {
      detectedLanguage = 'Japanese (日本語)'
      isNonEnglish = true
    } else if (koreanPattern.test(allText)) {
      detectedLanguage = 'Korean (한국어)'
      isNonEnglish = true
    } else if (thaiPattern.test(allText)) {
      detectedLanguage = 'Thai (ไทย)'
      isNonEnglish = true
    } else if (tamilPattern.test(allText)) {
      detectedLanguage = 'Tamil (தமிழ்)'
      isNonEnglish = true
    } else if (teluguPattern.test(allText)) {
      detectedLanguage = 'Telugu (తెలుగు)'
      isNonEnglish = true
    }

    const frameworkInfo = FRAMEWORKS[framework] || FRAMEWORKS.aida
    const platformInfo = PLATFORMS[platform] || PLATFORMS.facebook
    const goalInfo = GOALS[goal] || GOALS.sales
    const toneInfo = TONES[tone] || TONES.casual

    // Language instruction for the prompt
    const languageInstruction = isNonEnglish 
      ? `\n\n**CRITICAL LANGUAGE REQUIREMENT:**
You MUST generate ALL ad copy content in ${detectedLanguage}. This is extremely important.
- All hooks MUST be in ${detectedLanguage}
- All headlines MUST be in ${detectedLanguage}
- All primary text MUST be in ${detectedLanguage}
- All descriptions MUST be in ${detectedLanguage}
- All CTAs MUST be in ${detectedLanguage}
- All tips and recommendations should be in ${detectedLanguage}
DO NOT translate to English. Write naturally and fluently in ${detectedLanguage}.
The user's input language is ${detectedLanguage}, so respond entirely in that language.`
      : ''

    const systemPrompt = `You are an elite performance marketer and ad copywriter with expertise in conversion optimization. You specialize in creating high-converting ad copy using proven frameworks.
${isNonEnglish ? `\n**IMPORTANT: The user is writing in ${detectedLanguage}. You MUST respond entirely in ${detectedLanguage}. Do not use English.**\n` : ''}
YOUR EXPERTISE:
- Deep understanding of copywriting frameworks (AIDA, PAS, BAB, 4Ps, FAB)
- Platform-specific best practices for Facebook, Google, TikTok, LinkedIn, Instagram, YouTube
- Consumer psychology and emotional triggers
- A/B testing hooks and headlines
- Conversion rate optimization

KEY PRINCIPLES:
1. Hook in first 3 words - stop the scroll
2. Speak to pain points before solutions
3. Benefits over features always
4. Social proof increases trust
5. Clear, single CTA per ad
6. Use power words: "You", "Free", "New", "Because", "Instantly" ${isNonEnglish ? `(use equivalent words in ${detectedLanguage})` : ''}
7. Create urgency without being spammy
8. Match tone to target audience

Always respond in valid JSON format.${isNonEnglish ? ` All text content must be in ${detectedLanguage}.` : ''}`

    const prompt = `Create ${variationCount} high-converting ad copy variations using the ${frameworkInfo.name} framework.
${languageInstruction}

**FRAMEWORK: ${frameworkInfo.name} (${frameworkInfo.full})**
${frameworkInfo.description}
Structure:
${frameworkInfo.structure}

**PRODUCT/SERVICE:**
- Name: ${productName}
- Description: ${productDescription || 'Not specified'}
- Unique Selling Points: ${uniqueSellingPoints || 'Not specified'}
- Special Offer: ${offer || 'None specified'}

**TARGET AUDIENCE:**
- Persona: ${targetAudience || 'General audience'}
- Pain Points: ${painPoints || 'Not specified'}
- Desired Benefits: ${benefits || 'Not specified'}

**SOCIAL PROOF:**
${socialProof || 'None provided - you may create realistic placeholder stats'}

**AD SETTINGS:**
- Platform: ${platformInfo.name}
- Platform Limits: ${platformInfo.limits}
- Platform Tips: ${platformInfo.tips}
- Goal: ${goalInfo}
- Tone: ${toneInfo}

Generate the response in this exact JSON format${isNonEnglish ? ` (ALL text content MUST be in ${detectedLanguage})` : ''}:
{
  "framework": "${frameworkInfo.name}",
  "platform": "${platform}",
  "ads": [
    {
      "version": 1,
      "hook": "${isNonEnglish ? `The attention-grabbing opening line in ${detectedLanguage}` : 'The attention-grabbing opening line (most important - test multiple)'}",
      "headline": "${isNonEnglish ? `Concise headline in ${detectedLanguage}` : 'Concise headline for the ad'}",
      "primaryText": "${isNonEnglish ? `The main ad copy in ${detectedLanguage} following ${frameworkInfo.name} structure` : `The main ad copy following ${frameworkInfo.name} structure. Mark each section: [ATTENTION/PROBLEM/BEFORE/PICTURE/FEATURES] etc.`}",
      "description": "${isNonEnglish ? `Short supporting description in ${detectedLanguage}` : 'Short supporting description'}",
      "cta": "${isNonEnglish ? `Call to action text in ${detectedLanguage}` : 'Call to action text'}",
      "ctaButton": "${isNonEnglish ? `Button text in ${detectedLanguage}` : 'Button text (Shop Now, Learn More, etc.)'}",
      "hookAlternatives": ["${isNonEnglish ? `Alt hook 1 in ${detectedLanguage}` : 'Alt hook 1 for A/B testing'}", "${isNonEnglish ? `Alt hook 2 in ${detectedLanguage}` : 'Alt hook 2'}"],
      "emotionalTrigger": "Primary emotion this ad targets"
    }
  ],
  "platformSpecificTips": ["Tip 1 for ${platform}", "Tip 2", "Tip 3"],
  "abTestSuggestions": [
    "What to A/B test suggestion 1",
    "What to A/B test suggestion 2"
  ],
  "targetingRecommendations": ["Audience targeting tip 1", "Tip 2"],
  "bestPerformingElements": {
    "hook": "Which hook style typically performs best",
    "cta": "Recommended CTA approach",
    "length": "Ideal copy length for this platform"
  }
}

Generate ${variationCount} distinctly different ad variations. Each should have unique hooks, angles, and emotional appeals while maintaining the ${frameworkInfo.name} framework structure.`

    const llmResponse = await callLLM(prompt, systemPrompt)
    
    let result
    try {
      let jsonStr = llmResponse
      if (jsonStr.includes('```json')) {
        jsonStr = jsonStr.split('```json')[1].split('```')[0]
      } else if (jsonStr.includes('```')) {
        jsonStr = jsonStr.split('```')[1].split('```')[0]
      }
      jsonStr = jsonStr.trim()
      result = JSON.parse(jsonStr)
    } catch (parseError) {
      console.error('JSON parse error:', parseError)
      // Fallback structure
      result = {
        framework: frameworkInfo.name,
        platform: platform,
        ads: [{
          version: 1,
          hook: `Discover ${productName} Today!`,
          headline: productName,
          primaryText: llmResponse,
          description: productDescription || '',
          cta: 'Learn more',
          ctaButton: 'Shop Now',
          hookAlternatives: [],
          emotionalTrigger: 'curiosity'
        }],
        platformSpecificTips: ['Focus on visual content', 'Use clear CTAs', 'Test different hooks'],
        abTestSuggestions: ['Test different hooks', 'Try various CTAs'],
        targetingRecommendations: ['Target based on interests', 'Use lookalike audiences'],
        bestPerformingElements: {
          hook: 'Question-based hooks',
          cta: 'Action-oriented',
          length: 'Short and punchy'
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: result,
      metadata: {
        framework: frameworkInfo.name,
        frameworkFull: frameworkInfo.full,
        platform: platformInfo.name,
        goal,
        tone,
        variationCount,
        productName
      }
    })

  } catch (error) {
    console.error('Ad Copy Generator Error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to generate ad copy' },
      { status: 500 }
    )
  }
}
