import { NextResponse } from 'next/server'
import { spawn } from 'child_process'
import path from 'path'
import { enforceRateLimit } from '@/lib/rate-limiter'
import { z } from 'zod'
import { validateRequest } from '@/lib/validation'

// Landing Page Copy input schema
const landingPageCopySchema = z.object({
  productName: z.string().min(1, 'Product name is required').max(200),
  productDescription: z.string().max(2000).optional(),
  industry: z.enum(['saas', 'ecommerce', 'coaching', 'agency', 'finance', 'health', 'education', 'realestate', 'b2b', 'startup']).optional(),
  targetAudience: z.string().max(1000).optional(),
  framework: z.enum(['pas', 'hso', 'bab', 'quest', 'spin', 'acfunnel']).default('pas'),
  tone: z.enum(['professional', 'conversational', 'urgent', 'empathetic', 'bold', 'luxurious']).default('professional'),
  painPoints: z.string().max(2000).optional(),
  desiredOutcome: z.string().max(1000).optional(),
  uniqueSellingPoints: z.string().max(2000).optional(),
  competitorWeaknesses: z.string().max(1000).optional(),
  socialProof: z.string().max(2000).optional(),
  specificResults: z.string().max(1000).optional(),
  pricing: z.string().max(500).optional(),
  guarantee: z.string().max(500).optional(),
  urgencyElement: z.string().max(500).optional(),
  generateFullPage: z.boolean().default(false),
  sectionsToGenerate: z.array(z.enum(['hero', 'problem', 'solution', 'features', 'benefits', 'testimonials', 'faq', 'comparison', 'guarantee', 'cta'])).max(10).default(['hero', 'problem', 'solution', 'cta'])
})

// Landing Page Copywriting Frameworks for 2026
const FRAMEWORKS = {
  pas: {
    name: 'PAS (Problem-Agitation-Solution)',
    full: 'Problem → Agitation → Solution',
    description: 'Identify specific pain, highlight the cost of inaction, present product as the answer. Perfect for pain-point targeting.',
    sections: ['Problem', 'Agitation', 'Solution'],
    structure: `1. PROBLEM: Identify the specific struggle (e.g., "You're spending $5k/month on ads but your conversion rate is stuck at 1%")
2. AGITATION: Highlight the cost of inaction (e.g., "Every day you wait, you're handing market share to competitors")
3. SOLUTION: Introduce your product as the bridge from their "Hell" to their "Heaven"`,
    bestFor: 'Pain-point targeting, service businesses, B2B solutions'
  },
  hso: {
    name: 'HSO (Hook-Story-Offer)',
    full: 'Hook → Story → Offer',
    description: 'Catch attention with a counter-intuitive truth, share a relatable journey, transition to your product. Ideal for personal brands.',
    sections: ['Hook', 'Story', 'Offer'],
    structure: `1. HOOK: Counter-intuitive truth that grabs attention (e.g., "Everything you've been told about 'hustle culture' is the reason your business is plateauing")
2. STORY: Relatable journey of struggle and "aha!" moment (your origin story)
3. OFFER: Transition the "system" into your product`,
    bestFor: 'Personal brands, coaching, high-ticket services, courses'
  },
  bab: {
    name: 'BAB (Before-After-Bridge)',
    full: 'Before → After → Bridge',
    description: 'Show current frustrating reality, paint the solved future, your product is the bridge. Perfect for transformation products.',
    sections: ['Before', 'After', 'Bridge'],
    structure: `1. BEFORE: Describe the current, frustrating reality (e.g., "Your team is drowning in Slack notifications, missed deadlines, and lost spreadsheets")
2. AFTER: Paint a picture where the problem is completely gone (e.g., "Imagine a Monday morning where every project is on track...")
3. BRIDGE: Show how your product gets them from Before to After`,
    bestFor: 'SaaS, productivity tools, fitness, transformation products'
  },
  quest: {
    name: 'QUEST Framework',
    full: 'Qualify → Understand → Educate → Stimulate → Transition',
    description: 'For complex B2B solutions requiring buyer education before purchase. Systematic approach to qualify and convert.',
    sections: ['Qualify', 'Understand', 'Educate', 'Stimulate', 'Transition'],
    structure: `1. QUALIFY: Identify who this is for (and who it isn't) (e.g., "If you are an e-commerce brand doing over $1M in annual revenue, this is for you")
2. UNDERSTAND: Prove you know their specific industry hurdles
3. EDUCATE: Provide a new perspective or "secret" insight
4. STIMULATE: Create intense desire through benefits and social proof
5. TRANSITION: Move them toward the final action`,
    bestFor: 'Complex B2B solutions, expensive physical products, high-ticket items'
  },
  spin: {
    name: 'SPIN Selling (Adapted)',
    full: 'Situation → Problem → Implication → Need-Payoff',
    description: 'Originally a sales questioning technique, adapted for landing pages where you need readers to "self-diagnose" their need.',
    sections: ['Situation', 'Problem', 'Implication', 'Need-Payoff'],
    structure: `1. SITUATION: Establish the current facts to ground the reader (e.g., "You are currently running three separate marketing platforms")
2. PROBLEM: Identify the pain points arising from that situation
3. IMPLICATION: Highlight long-term consequences of not fixing the problem (The "Cost of Inaction")
4. NEED-PAYOFF: Pivot to the value of the solution`,
    bestFor: 'Complex B2B, High-Ticket SaaS, enterprise solutions'
  },
  acfunnel: {
    name: 'AC Funnel (Allen Sultanic)',
    full: 'Hook → Counterintuitive Approach → Story → Proof → Offer',
    description: 'Challenge conventional wisdom with a counterintuitive approach. Break rules, create intrigue, and stand out from competitors.',
    sections: ['Hook/Intrigue', 'Counterintuitive Approach', 'Origin Story', 'Proof/Validation', 'The Offer'],
    structure: `1. HOOK/INTRIGUE: Grab attention with counterintuitive promise (e.g., "New Template Reveals A Counterintuitive Approach That [RESULT] Without [PAIN]")
2. COUNTERINTUITIVE APPROACH: Challenge conventional wisdom, break established rules
3. ORIGIN STORY: Share personal struggle and the "aha!" moment discovery
4. PROOF/VALIDATION: Testimonials, results, community proof
5. THE OFFER: Product, pricing, bonuses, guarantee, urgency`,
    bestFor: 'Info products, ebooks, coaching programs, digital courses'
  }
}

// Page Section Types
const PAGE_SECTIONS = {
  hero: 'Hero Section (Above the Fold)',
  problem: 'Problem/Pain Section',
  solution: 'Solution Section',
  features: 'Features/Benefits Section',
  socialProof: 'Social Proof/Testimonials',
  faq: 'FAQ Section',
  cta: 'Call to Action Section',
  objections: 'Objection Handling',
  comparison: 'Us vs Them Comparison',
  guarantee: 'Risk Reversal/Guarantee'
}

// Tone options
const TONES = {
  professional: 'Professional and authoritative - B2B, enterprise, high-trust required',
  conversational: 'Conversational and friendly - approachable, relatable',
  urgent: 'Urgent with FOMO - limited time, scarcity elements',
  empathetic: 'Empathetic and understanding - coaching, personal development',
  bold: 'Bold and confident - disruptor brands, challenge status quo',
  luxurious: 'Luxurious and exclusive - premium positioning'
}

// Industry categories
const INDUSTRIES = {
  saas: 'SaaS / Software',
  ecommerce: 'E-commerce / Retail',
  coaching: 'Coaching / Consulting',
  agency: 'Agency / Services',
  finance: 'Finance / Fintech',
  health: 'Health / Wellness',
  education: 'Education / Courses',
  realestate: 'Real Estate',
  b2b: 'B2B / Enterprise',
  startup: 'Startup / Tech'
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
    
    // SECURITY: Validate input with Zod schema
    const validation = validateRequest(landingPageCopySchema, body)
    if (!validation.success) {
      return NextResponse.json({
        success: false,
        error: 'Validation failed',
        errors: validation.errors
      }, { status: 400 })
    }
    
    const {
      // Basic Info
      productName,
      productDescription,
      industry,
      targetAudience,
      
      // Framework & Style
      framework,
      tone,
      
      // Detailed Info (Pro Mode)
      painPoints,
      desiredOutcome,
      uniqueSellingPoints,
      competitorWeaknesses,
      
      // Social Proof
      socialProof,
      specificResults,
      
      // Offer Details
      pricing,
      guarantee,
      urgencyElement,
      
      // Output Control
      generateFullPage,
      sectionsToGenerate
    } = validation.data

    // Language detection - check for Bengali and other non-English scripts
    const allText = `${productName} ${productDescription || ''} ${targetAudience || ''} ${painPoints || ''}`
    const bengaliPattern = /[\u0980-\u09FF]/
    const hindiPattern = /[\u0900-\u097F]/
    const arabicPattern = /[\u0600-\u06FF]/
    
    let detectedLanguage = 'English'
    let isNonEnglish = false
    let languageInstruction = ''
    
    if (bengaliPattern.test(allText)) {
      detectedLanguage = 'Bengali (বাংলা)'
      isNonEnglish = true
    } else if (hindiPattern.test(allText)) {
      detectedLanguage = 'Hindi (हिंदी)'
      isNonEnglish = true
    } else if (arabicPattern.test(allText)) {
      detectedLanguage = 'Arabic (العربية)'
      isNonEnglish = true
    }
    
    if (isNonEnglish) {
      languageInstruction = `

**CRITICAL LANGUAGE REQUIREMENT:**
The user has provided input in ${detectedLanguage}. You MUST generate ALL landing page copy content in ${detectedLanguage}.
- ALL headlines, subheadlines, and body text MUST be in ${detectedLanguage}
- ALL CTAs, button text, and micro-copy MUST be in ${detectedLanguage}
- ALL FAQ questions and answers MUST be in ${detectedLanguage}
- ALL testimonials and social proof MUST be in ${detectedLanguage}
- ALL comparison table content MUST be in ${detectedLanguage}
Write naturally and fluently in ${detectedLanguage}. Do NOT translate to English.`
    }

    const frameworkInfo = FRAMEWORKS[framework] || FRAMEWORKS.pas
    const toneInfo = TONES[tone] || TONES.conversational
    const industryInfo = INDUSTRIES[industry] || 'General'

    const systemPrompt = `You are an elite landing page copywriter specializing in high-conversion copy for 2026. You combine the psychology of direct response copywriting with modern digital marketing best practices.
${isNonEnglish ? `\n**IMPORTANT: The user is writing in ${detectedLanguage}. You MUST respond entirely in ${detectedLanguage}. Do not use English for the actual copy content.**\n` : ''}

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
- unleash your potential
- world-class
- state-of-the-art
- next-generation

Instead, use simple, direct, human language. Write like a real person talking to a friend about something helpful.

YOUR EXPERTISE:
- Master of copywriting frameworks: PAS, HSO, BAB, QUEST, SPIN, AC Funnel
- Deep understanding of consumer psychology and emotional triggers
- Conversion rate optimization and A/B testing principles
- 2026 best practices: radical transparency, friction reduction, immediate relevance

KEY 2026 PRINCIPLES:
1. "Above the Fold" Hook: Answer in 3 seconds: What is it? Who is it for? Why should they care right now?
2. Headline focuses on OUTCOME, not features (e.g., "Close 30% More Deals" not "CRM Software")
3. Sub-headline explains the HOW
4. Primary CTA uses high-intent, low-friction language ("Get My Free Strategy Map" not "Submit")
5. Social proof must be specific and verifiable ("Helped [Company X] reduce churn by 22% in 90 days")
6. Address objections directly in copy
7. Risk reversal clearly stated (guarantees, no credit card required, etc.)
8. Click triggers under CTAs reduce anxiety ("Join 10,000+ creators", "Setup takes 2 minutes")

WRITING RULES:
- Speak directly to the reader using "you" and "your"
- Benefits over features ALWAYS
- Use specific numbers and results
- Create vivid mental imagery
- Write at 8th-grade reading level for clarity
- Short paragraphs, plenty of white space
- Use simple, direct words instead of fancy jargon
- Sound human, not like a robot or AI

**CRITICAL: You MUST generate ALL sections completely. Do not skip or leave any section empty. Every section must have meaningful content.**

Always respond in valid JSON format.${isNonEnglish ? ` All text content must be in ${detectedLanguage}.` : ''}`

    const prompt = `Create high-converting landing page copy using the ${frameworkInfo.name} framework.
${languageInstruction}

**FRAMEWORK: ${frameworkInfo.name}**
${frameworkInfo.description}

Structure:
${frameworkInfo.structure}

Best For: ${frameworkInfo.bestFor}

**PRODUCT/SERVICE:**
- Name: ${productName}
- Description: ${productDescription || 'Not specified'}
- Industry: ${industryInfo}
- Unique Selling Points: ${uniqueSellingPoints || 'Not specified'}
- Competitor Weaknesses: ${competitorWeaknesses || 'Not specified'}

**TARGET AUDIENCE:**
- Who: ${targetAudience || 'Not specified'}
- Pain Points: ${painPoints || 'Not specified'}
- Desired Outcome: ${desiredOutcome || 'Not specified'}

**SOCIAL PROOF:**
${socialProof || 'Create realistic placeholder examples'}
Specific Results: ${specificResults || 'Not specified'}

**OFFER DETAILS:**
- Pricing: ${pricing || 'Not specified'}
- Guarantee: ${guarantee || 'Standard money-back guarantee'}
- Urgency Element: ${urgencyElement || 'None specified'}

**TONE:** ${toneInfo}

**SECTIONS TO GENERATE:** ${sectionsToGenerate.join(', ')}
${generateFullPage ? 'Generate a COMPLETE landing page with all sections.' : ''}

Generate the response in this exact JSON format:
{
  "framework": "${frameworkInfo.name}",
  "industry": "${industryInfo}",
  
  "heroSection": {
    "headline": "Outcome-focused headline that answers 'what's in it for me?' in under 10 words",
    "subheadline": "Supporting line that explains HOW - the mechanism or unique approach",
    "bulletPoints": ["Quick win 1", "Quick win 2", "Quick win 3"],
    "primaryCTA": "High-intent, low-friction CTA text (e.g., 'Get My Free Strategy Map')",
    "ctaTrigger": "Anxiety-reducing text under CTA (e.g., 'Join 10,000+ marketers • No credit card required')",
    "visualSuggestion": "Description of ideal hero image or video"
  },
  
  "problemSection": {
    "sectionTitle": "Attention-grabbing section title",
    "problemStatement": "The specific problem your audience faces, written with empathy",
    "agitation": "The cost of inaction - what happens if they don't solve this",
    "relateableStruggles": ["Struggle 1", "Struggle 2", "Struggle 3"],
    "bridgeToSolution": "Transition sentence that hints at the solution"
  },
  
  "solutionSection": {
    "sectionTitle": "Solution-focused section title",
    "introduction": "Introduce your product/solution",
    "howItWorks": [
      {"step": 1, "title": "Step title", "description": "What happens in this step"},
      {"step": 2, "title": "Step title", "description": "What happens in this step"},
      {"step": 3, "title": "Step title", "description": "What happens in this step"}
    ],
    "keyBenefits": [
      {"title": "Benefit headline", "description": "Benefit explanation with emotional appeal"},
      {"title": "Benefit headline", "description": "Benefit explanation with emotional appeal"},
      {"title": "Benefit headline", "description": "Benefit explanation with emotional appeal"}
    ],
    "differentiators": ["What makes you different 1", "What makes you different 2"]
  },
  
  "socialProofSection": {
    "sectionTitle": "Trust-building section title",
    "headline": "Social proof headline",
    "statistics": [
      {"number": "10,000+", "label": "Happy Customers"},
      {"number": "4.9/5", "label": "Average Rating"},
      {"number": "22%", "label": "Average ROI Increase"}
    ],
    "testimonials": [
      {
        "quote": "Specific testimonial with concrete results",
        "author": "Name, Title at Company",
        "result": "Specific result achieved"
      },
      {
        "quote": "Another testimonial focusing on transformation",
        "author": "Name, Title at Company",
        "result": "Specific result achieved"
      }
    ],
    "logos": ["Suggested logo type 1", "Suggested logo type 2", "Suggested logo type 3"],
    "trustBadges": ["Badge suggestion 1", "Badge suggestion 2"]
  },
  
  "faqSection": {
    "sectionTitle": "FAQ section title",
    "headline": "Common questions headline",
    "faqs": [
      {"question": "Objection-handling question 1", "answer": "Persuasive answer that overcomes objection"},
      {"question": "Pricing-related question", "answer": "Value-focused answer"},
      {"question": "Time-to-value question", "answer": "Reassuring answer"},
      {"question": "Risk-related question", "answer": "Guarantee-focused answer"},
      {"question": "Integration/setup question", "answer": "Ease-of-use focused answer"}
    ]
  },
  
  "comparisonSection": {
    "sectionTitle": "Us vs Them section title",
    "headline": "Comparison headline",
    "yourProduct": ["Your advantage 1", "Your advantage 2", "Your advantage 3", "Your advantage 4"],
    "competitors": ["Their disadvantage 1", "Their disadvantage 2", "Their disadvantage 3", "Their disadvantage 4"],
    "categories": ["Category 1", "Category 2", "Category 3", "Category 4"],
    "bottomLine": "Summary statement why you're the better choice"
  },
  
  "ctaSection": {
    "headline": "Final CTA headline with urgency",
    "subheadline": "Supporting value proposition",
    "primaryCTA": "Main CTA button text",
    "secondaryCTA": "Alternative lower-commitment CTA",
    "riskReversal": "Guarantee statement (e.g., '100% Money-Back Guarantee - No Questions Asked')",
    "urgencyElement": "Urgency/scarcity text if applicable",
    "ctaTriggers": ["Trigger 1 under button", "Trigger 2", "Trigger 3"]
  },
  
  "microCopy": {
    "aboveFold": ["Anxiety-reducing micro-copy for hero section"],
    "formLabels": {
      "email": "Your best email",
      "name": "Your name",
      "submit": "CTA button text"
    },
    "errorMessages": ["Friendly error message examples"],
    "successMessage": "Post-conversion celebration message"
  },
  
  "seoElements": {
    "metaTitle": "SEO-optimized page title (under 60 chars)",
    "metaDescription": "Compelling meta description (under 160 chars)",
    "h1": "Primary H1 heading",
    "suggestedKeywords": ["keyword 1", "keyword 2", "keyword 3"]
  },
  
  "conversionTips": [
    "Specific tip 1 for improving conversion on this page",
    "Specific tip 2 for A/B testing",
    "Specific tip 3 for optimization"
  ],
  
  "frameworkBreakdown": {
    "section1": {"name": "${frameworkInfo.sections[0] || 'Section 1'}", "content": "How this section follows the framework"},
    "section2": {"name": "${frameworkInfo.sections[1] || 'Section 2'}", "content": "How this section follows the framework"},
    "section3": {"name": "${frameworkInfo.sections[2] || 'Section 3'}", "content": "How this section follows the framework"}
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
        framework: frameworkInfo.name,
        industry: industryInfo,
        heroSection: {
          headline: `Transform Your ${industryInfo} Results with ${productName}`,
          subheadline: productDescription || 'The smart way to achieve your goals',
          bulletPoints: ['Quick results', 'Easy to use', 'Proven system'],
          primaryCTA: 'Get Started Free',
          ctaTrigger: 'No credit card required',
          visualSuggestion: 'Hero image showing transformation'
        },
        problemSection: {
          sectionTitle: 'Sound Familiar?',
          problemStatement: painPoints || 'You\'re working hard but not seeing results',
          agitation: 'Every day you wait, you\'re falling behind',
          relateableStruggles: ['Struggle 1', 'Struggle 2', 'Struggle 3'],
          bridgeToSolution: 'There\'s a better way.'
        },
        solutionSection: {
          sectionTitle: 'Introducing ' + productName,
          introduction: productDescription || 'A better solution for your needs',
          howItWorks: [
            { step: 1, title: 'Sign Up', description: 'Create your account in seconds' },
            { step: 2, title: 'Configure', description: 'Set up your preferences' },
            { step: 3, title: 'Succeed', description: 'Watch your results improve' }
          ],
          keyBenefits: [
            { title: 'Save Time', description: 'Automate repetitive tasks' },
            { title: 'Increase Revenue', description: 'Drive more conversions' },
            { title: 'Scale Easily', description: 'Grow without limits' }
          ],
          differentiators: uniqueSellingPoints ? uniqueSellingPoints.split(',') : ['Unique approach', 'Proven results']
        },
        ctaSection: {
          headline: 'Ready to Transform Your Results?',
          subheadline: 'Join thousands of successful users',
          primaryCTA: 'Start Your Free Trial',
          secondaryCTA: 'Schedule a Demo',
          riskReversal: guarantee || '30-Day Money-Back Guarantee',
          urgencyElement: urgencyElement || '',
          ctaTriggers: ['No credit card required', 'Setup takes 2 minutes', 'Cancel anytime']
        },
        conversionTips: [
          'Test different headlines with A/B testing',
          'Add video testimonials for higher trust',
          'Reduce form fields to increase conversions'
        ],
        socialProofSection: {
          sectionTitle: 'Trusted by Industry Leaders',
          headline: 'See what our customers are saying',
          statistics: [
            { number: '10,000+', label: 'Happy Customers' },
            { number: '4.9/5', label: 'Average Rating' },
            { number: '35%', label: 'Average ROI Increase' }
          ],
          testimonials: [
            { quote: 'This product transformed our workflow', author: 'John D., CEO', result: '35% productivity increase' },
            { quote: 'Best investment we made this year', author: 'Sarah M., Marketing Director', result: '2x revenue growth' }
          ],
          trustBadges: ['ISO Certified', 'SOC2 Compliant', 'GDPR Ready']
        },
        faqSection: {
          sectionTitle: 'Frequently Asked Questions',
          headline: 'Got questions? We\'ve got answers',
          faqs: [
            { question: 'How quickly can I get started?', answer: 'You can be up and running in less than 5 minutes with our easy setup wizard.' },
            { question: 'Is there a free trial?', answer: 'Yes! We offer a 14-day free trial with full access to all features.' },
            { question: 'What kind of support do you offer?', answer: 'We provide 24/7 email support and live chat during business hours.' },
            { question: 'Can I cancel anytime?', answer: 'Absolutely. No contracts, no cancellation fees. Cancel with one click.' }
          ]
        },
        comparisonSection: {
          sectionTitle: 'Why Choose Us?',
          headline: 'See how we compare to alternatives',
          categories: ['Ease of Use', 'Customer Support', 'Pricing', 'Features'],
          yourProduct: ['Intuitive UI', '24/7 Support', 'Flexible Plans', 'All-in-One'],
          competitors: ['Complex Setup', 'Email Only', 'Expensive', 'Limited'],
          bottomLine: 'Choose ' + productName + ' for a better experience at a better price.'
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: result,
      metadata: {
        framework: frameworkInfo.name,
        frameworkFull: frameworkInfo.full,
        frameworkSections: frameworkInfo.sections,
        industry: industryInfo,
        tone,
        productName,
        generatedAt: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('Landing Page Copy Generator Error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to generate landing page copy' },
      { status: 500 }
    )
  }
}
