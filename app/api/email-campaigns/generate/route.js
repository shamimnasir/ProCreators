import { NextResponse } from 'next/server'
import { spawn } from 'child_process'
import path from 'path'
import { enforceRateLimit } from '@/lib/rate-limiter'

// Email Campaign Types
const CAMPAIGN_TYPES = {
  welcome: {
    name: 'Welcome Series',
    description: 'Onboard new subscribers with a warm welcome sequence',
    emails: 3,
    focus: 'Introduction, value proposition, first action'
  },
  newsletter: {
    name: 'Newsletter',
    description: 'Regular updates, tips, and content for your audience',
    emails: 1,
    focus: 'Value-packed content, engagement, brand building'
  },
  promotional: {
    name: 'Promotional Campaign',
    description: 'Drive sales with special offers and discounts',
    emails: 3,
    focus: 'Urgency, benefits, clear CTA, scarcity'
  },
  launch: {
    name: 'Product Launch',
    description: 'Build anticipation and drive purchases for new products',
    emails: 4,
    focus: 'Teaser, announcement, benefits, urgency'
  },
  nurture: {
    name: 'Lead Nurture',
    description: 'Guide prospects through the buyer journey',
    emails: 5,
    focus: 'Education, trust building, problem solving'
  },
  reengagement: {
    name: 'Re-engagement',
    description: 'Win back inactive subscribers',
    emails: 3,
    focus: 'Reminder of value, special offers, final chance'
  },
  abandoned: {
    name: 'Abandoned Cart',
    description: 'Recover lost sales from cart abandonment',
    emails: 3,
    focus: 'Reminder, urgency, incentive'
  },
  event: {
    name: 'Event/Webinar',
    description: 'Promote and follow up on events',
    emails: 4,
    focus: 'Registration, reminders, follow-up'
  }
}

// Industry verticals
const INDUSTRIES = {
  ecommerce: 'E-commerce / Retail',
  saas: 'SaaS / Software',
  coaching: 'Coaching / Consulting',
  agency: 'Agency / Services',
  education: 'Education / Courses',
  health: 'Health / Wellness',
  finance: 'Finance / Fintech',
  nonprofit: 'Non-profit / Charity',
  realestate: 'Real Estate',
  b2b: 'B2B / Enterprise'
}

// Tone options
const TONES = {
  professional: 'Professional - Business appropriate',
  friendly: 'Friendly - Warm and approachable',
  casual: 'Casual - Relaxed and conversational',
  urgent: 'Urgent - Time-sensitive and action-oriented',
  inspirational: 'Inspirational - Motivating and uplifting',
  educational: 'Educational - Informative and helpful'
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
    // SECURITY: Rate limiting for content generation
    const rateLimitCheck = await enforceRateLimit(request, 'content_generate')
    if (rateLimitCheck.limited) {
      return rateLimitCheck.response
    }

    const body = await request.json()
    const {
      // Campaign basics
      campaignType,
      campaignGoal,
      industry,
      
      // Brand info
      brandName,
      brandDescription,
      brandVoice,
      
      // Audience
      targetAudience,
      audiencePainPoints,
      audienceDesires,
      
      // Content details
      mainOffer,
      keyBenefits,
      uniqueValue,
      callToAction,
      
      // Settings
      tone,
      emailCount,
      includeSubjectVariants,
      includePreviewText,
      
      // Optional
      productName,
      price,
      deadline,
      socialProof
    } = body

    if (!campaignType || !brandName) {
      return NextResponse.json(
        { success: false, error: 'Campaign type and brand name are required' },
        { status: 400 }
      )
    }

    // Language detection
    const allText = `${brandName} ${brandDescription || ''} ${campaignGoal || ''} ${targetAudience || ''}`
    const bengaliPattern = /[\u0980-\u09FF]/
    const hindiPattern = /[\u0900-\u097F]/
    const arabicPattern = /[\u0600-\u06FF]/
    
    let detectedLanguage = 'English'
    let languageInstruction = ''
    
    if (bengaliPattern.test(allText)) {
      detectedLanguage = 'Bengali (বাংলা)'
      languageInstruction = `\n**CRITICAL: Generate ALL email content in Bengali (বাংলা). Do not use English.**\n`
    } else if (hindiPattern.test(allText)) {
      detectedLanguage = 'Hindi (हिंदी)'
      languageInstruction = `\n**CRITICAL: Generate ALL email content in Hindi (हिंदी). Do not use English.**\n`
    } else if (arabicPattern.test(allText)) {
      detectedLanguage = 'Arabic (العربية)'
      languageInstruction = `\n**CRITICAL: Generate ALL email content in Arabic (العربية). Do not use English.**\n`
    }

    const campaignInfo = CAMPAIGN_TYPES[campaignType] || CAMPAIGN_TYPES.newsletter
    const industryInfo = INDUSTRIES[industry] || industry
    const toneInfo = TONES[tone] || TONES.friendly
    const numEmails = parseInt(emailCount) || campaignInfo.emails

    const systemPrompt = `You are an expert email marketing copywriter with 15+ years of experience writing high-converting email campaigns and newsletters. You understand email psychology, deliverability best practices, and what makes subscribers open, read, and click.

${languageInstruction}

**BANNED WORDS - DO NOT USE THESE AI-SOUNDING WORDS:**
NEVER use these overused, cliché words that make copy sound AI-generated:
- unlock, unleash, unveil
- revolutionize, revolutionary
- game-changer, game-changing
- cutting-edge, groundbreaking
- supercharge, turbocharge
- skyrocket
- seamless, seamlessly
- harness, leverage (as verbs)
- elevate, elevating
- empower, empowering
- transform, transformative (overused)
- dive into, dive deep, deep dive
- journey (when referring to customer experience)
- robust, scalable
- synergy, synergistic
- paradigm shift
- disrupt, disruptive
- holistic
- streamline
- optimize (overused)
- maximize, maximize potential
- take it to the next level
- innovative, innovation (overused)

Instead, use simple, direct, human language. Write like a real person having a conversation.

YOUR EXPERTISE:
- Email marketing frameworks: AIDA, PAS, BAB, storytelling
- Conversion optimization and CTA psychology
- Subject line formulas that get 40%+ open rates
- Email sequence design and automation flows
- Mobile-first email copywriting
- Spam filter avoidance and deliverability

KEY EMAIL MARKETING PRINCIPLES:

1. SUBJECT LINES (Most Critical):
   - Keep under 50 characters (6-10 words)
   - Create curiosity gap or promise specific benefit
   - Use simple, direct words: You, Free, New, Quick, Easy, Today
   - Avoid spam triggers: ALL CAPS, excessive punctuation, "free money"
   - Personalization boosts opens by 26%
   - Test emojis sparingly (1 max, at start or end)

2. PREVIEW TEXT:
   - Extend the subject line promise
   - 40-90 characters visible on mobile
   - Don't repeat the subject line
   - Include a hook or benefit

3. EMAIL BODY:
   - Hook in first line (no "I hope this email finds you well")
   - Short paragraphs (1-3 sentences max)
   - One main CTA per email
   - Mobile-optimized (50% read on mobile)
   - Use bullet points for scannability
   - Include social proof when relevant
   - Clear, action-oriented CTA button text
   - Sound human, not robotic or salesy

4. EMAIL SEQUENCE PSYCHOLOGY:
   - Welcome: Build relationship, deliver promised value
   - Nurture: Educate, build trust, share stories
   - Promotional: Create urgency, stack value, overcome objections
   - Follow-up: Different angles, address objections

Always respond in valid JSON format.`

    const prompt = `Create a complete ${campaignInfo.name} email campaign with the following specifications:
${languageInstruction}
**CAMPAIGN TYPE:** ${campaignInfo.name}
- Description: ${campaignInfo.description}
- Focus: ${campaignInfo.focus}

**CAMPAIGN GOAL:** ${campaignGoal || 'Not specified'}

**BRAND INFORMATION:**
- Brand Name: ${brandName}
- Brand Description: ${brandDescription || 'Not specified'}
- Brand Voice: ${brandVoice || 'Professional yet friendly'}
- Industry: ${industryInfo}

**TARGET AUDIENCE:**
- Who: ${targetAudience || 'Not specified'}
- Pain Points: ${audiencePainPoints || 'Not specified'}
- Desires/Goals: ${audienceDesires || 'Not specified'}

**OFFER/CONTENT:**
- Main Offer: ${mainOffer || 'Not specified'}
- Product Name: ${productName || 'Not specified'}
- Price: ${price || 'Not specified'}
- Key Benefits: ${keyBenefits || 'Not specified'}
- Unique Value: ${uniqueValue || 'Not specified'}
- CTA: ${callToAction || 'Not specified'}
- Deadline: ${deadline || 'None'}
- Social Proof: ${socialProof || 'Not specified'}

**SETTINGS:**
- Tone: ${toneInfo}
- Number of Emails: ${numEmails}
- Include Subject Variants: ${includeSubjectVariants ? 'Yes (3 variants per email)' : 'No'}
- Include Preview Text: ${includePreviewText !== false ? 'Yes' : 'No'}

Generate a complete email campaign response in this exact JSON format:
{
  "campaignName": "Name for this email campaign",
  "campaignOverview": "Brief description of the campaign strategy and goals",
  "totalEmails": ${numEmails},
  "recommendedSchedule": "Suggested sending schedule (e.g., Day 0, Day 2, Day 4)",
  
  "emails": [
    {
      "emailNumber": 1,
      "emailName": "Name/Purpose of this email (e.g., 'Welcome Email', 'The Big Reveal')",
      "sendTiming": "When to send (e.g., 'Immediately', 'Day 2', '24 hours after signup')",
      "goal": "Primary goal of this specific email",
      
      "subjectLine": "Main subject line (under 50 chars, compelling)",
      "subjectVariants": ["Alternative subject 1", "Alternative subject 2"],
      "previewText": "Preview text that complements subject (40-90 chars)",
      
      "emailBody": "Complete email body with proper greeting, paragraphs, and CTA. Use line breaks for readability. Include placeholder for personalization like [FIRST_NAME].",
      
      "ctaButton": "CTA button text (action-oriented, 2-5 words)",
      "ctaUrl": "Suggested link destination description",
      
      "tipsForThisEmail": ["Tip 1 for this specific email", "Tip 2"]
    }
  ],
  
  "campaignTips": [
    "Overall campaign tip 1",
    "Overall campaign tip 2",
    "Overall campaign tip 3"
  ],
  
  "segmentationSuggestions": [
    "Segment suggestion 1 for better targeting",
    "Segment suggestion 2"
  ],
  
  "abTestIdeas": [
    "A/B test idea 1",
    "A/B test idea 2"
  ],
  
  "metrics": {
    "expectedOpenRate": "Industry benchmark open rate",
    "expectedClickRate": "Industry benchmark click rate",
    "keyMetricsToTrack": ["Metric 1", "Metric 2", "Metric 3"]
  }
}`

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
      // Create fallback structure
      result = {
        campaignName: `${brandName} ${campaignInfo.name}`,
        campaignOverview: `A ${campaignInfo.name.toLowerCase()} campaign for ${brandName}`,
        totalEmails: numEmails,
        recommendedSchedule: 'Day 0, Day 2, Day 5',
        emails: [{
          emailNumber: 1,
          emailName: 'Campaign Email',
          sendTiming: 'Day 0',
          goal: campaignGoal || 'Engage subscribers',
          subjectLine: `${brandName}: ${mainOffer || 'Something special for you'}`,
          subjectVariants: [],
          previewText: 'Open to discover more...',
          emailBody: llmResponse || 'Email content generation failed. Please try again.',
          ctaButton: callToAction || 'Learn More',
          ctaUrl: 'Main landing page',
          tipsForThisEmail: ['Personalize the greeting', 'Test send time']
        }],
        campaignTips: [
          'Segment your audience for better targeting',
          'A/B test subject lines for best results',
          'Monitor open and click rates closely'
        ],
        segmentationSuggestions: ['New vs returning subscribers', 'Engagement level'],
        abTestIdeas: ['Test different subject line approaches', 'Test CTA button colors'],
        metrics: {
          expectedOpenRate: '20-25%',
          expectedClickRate: '2-5%',
          keyMetricsToTrack: ['Open rate', 'Click rate', 'Conversion rate']
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: result,
      metadata: {
        campaignType: campaignInfo.name,
        brandName,
        industry: industryInfo,
        tone,
        emailCount: numEmails,
        detectedLanguage,
        generatedAt: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('Email Campaign Generator Error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to generate email campaign' },
      { status: 500 }
    )
  }
}
