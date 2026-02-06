import { NextResponse } from 'next/server'
import { spawn } from 'child_process'
import path from 'path'
import { enforceRateLimit } from '@/lib/rate-limiter'
import { z } from 'zod'
import { validateRequest } from '@/lib/validation'

// Pitch Deck input schema
const pitchDeckSchema = z.object({
  companyName: z.string().min(1, 'Company name is required').max(200),
  tagline: z.string().max(500).optional(),
  companyDescription: z.string().max(2000).optional(),
  industry: z.string().max(100).optional(),
  problemStatement: z.string().max(2000).optional(),
  solution: z.string().max(2000).optional(),
  keyFeatures: z.string().max(1000).optional(),
  uniqueValue: z.string().max(1000).optional(),
  targetMarket: z.string().max(1000).optional(),
  marketSize: z.string().max(500).optional(),
  competitors: z.string().max(1000).optional(),
  competitiveAdvantage: z.string().max(1000).optional(),
  revenueModel: z.string().max(1000).optional(),
  pricing: z.string().max(500).optional(),
  unitEconomics: z.string().max(500).optional(),
  currentTraction: z.string().max(1000).optional(),
  milestones: z.string().max(1000).optional(),
  customerTestimonials: z.string().max(1000).optional(),
  founders: z.string().max(1000).optional(),
  keyTeam: z.string().max(1000).optional(),
  advisors: z.string().max(500).optional(),
  fundingStage: z.string().max(50).optional(),
  fundingAmount: z.string().max(100).optional(),
  useOfFunds: z.string().max(1000).optional(),
  financialProjections: z.string().max(1000).optional(),
  deckStyle: z.enum(['classic', 'storytelling', 'datadriven', 'vision']).default('classic'),
  presenterName: z.string().max(100).optional(),
  presenterTitle: z.string().max(100).optional(),
  contactEmail: z.string().email().max(200).optional().or(z.literal(''))
})

// Industries
const INDUSTRIES = {
  technology: 'Technology / SaaS',
  ecommerce: 'E-commerce / Retail',
  food: 'Food & Beverage',
  health: 'Healthcare / Wellness',
  finance: 'Finance / Fintech',
  education: 'Education / EdTech',
  manufacturing: 'Manufacturing',
  services: 'Professional Services',
  realestate: 'Real Estate',
  media: 'Media / Entertainment',
  ai: 'AI / Machine Learning',
  cleantech: 'Clean Tech / Sustainability',
  other: 'Other'
}

// Funding Stages
const FUNDING_STAGES = {
  preseed: 'Pre-Seed ($50K - $500K)',
  seed: 'Seed ($500K - $2M)',
  seriesA: 'Series A ($2M - $15M)',
  seriesB: 'Series B ($15M - $50M)',
  seriesC: 'Series C+ ($50M+)'
}

// Pitch Deck Styles
const DECK_STYLES = {
  classic: 'Classic Investor Deck - Traditional 12-slide format',
  storytelling: 'Storytelling Deck - Narrative-driven approach',
  datadriven: 'Data-Driven Deck - Heavy on metrics and charts',
  vision: 'Vision Deck - Big picture, moonshot focus'
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
      // Company Info
      companyName,
      tagline,
      companyDescription,
      industry,
      
      // Problem & Solution
      problemStatement,
      solution,
      keyFeatures,
      uniqueValue,
      
      // Market
      targetMarket,
      marketSize,
      competitors,
      competitiveAdvantage,
      
      // Business Model
      revenueModel,
      pricing,
      unitEconomics,
      
      // Traction
      currentTraction,
      milestones,
      customerTestimonials,
      
      // Team
      founders,
      keyTeam,
      advisors,
      
      // Financials & Ask
      fundingStage,
      fundingAmount,
      useOfFunds,
      financialProjections,
      
      // Style
      deckStyle = 'classic',
      
      // Contact
      presenterName,
      presenterTitle,
      contactEmail
    } = body

    if (!companyName) {
      return NextResponse.json(
        { success: false, error: 'Company name is required' },
        { status: 400 }
      )
    }

    // Language detection
    const allText = `${companyName} ${companyDescription || ''} ${problemStatement || ''} ${solution || ''}`
    const bengaliPattern = /[\u0980-\u09FF]/
    const hindiPattern = /[\u0900-\u097F]/
    
    let detectedLanguage = 'English'
    let languageInstruction = ''
    
    if (bengaliPattern.test(allText)) {
      detectedLanguage = 'Bengali (বাংলা)'
      languageInstruction = `\n**CRITICAL: Generate ALL pitch deck content in Bengali (বাংলা). Do not use English.**\n`
    } else if (hindiPattern.test(allText)) {
      detectedLanguage = 'Hindi (हिंदी)'
      languageInstruction = `\n**CRITICAL: Generate ALL pitch deck content in Hindi (हिंदी). Do not use English.**\n`
    }

    const industryInfo = INDUSTRIES[industry] || industry
    const fundingStageInfo = FUNDING_STAGES[fundingStage] || fundingStage
    const deckStyleInfo = DECK_STYLES[deckStyle] || deckStyle

    const systemPrompt = `You are a world-class pitch deck consultant who has helped startups raise over $2 billion in funding. You've worked with Y Combinator, Sequoia Capital, and Andreessen Horowitz portfolio companies. You understand exactly what investors look for in a pitch.

${languageInstruction}

**BANNED WORDS - NEVER USE THESE AI-SOUNDING PHRASES:**
- unlock, unleash, unveil
- revolutionize, revolutionary, game-changer
- cutting-edge, groundbreaking, paradigm shift
- supercharge, turbocharge, skyrocket
- seamless, seamlessly, synergy
- leverage, harness (as verbs)
- elevate, empower, transform (overused)
- dive into, dive deep, delve
- disrupt, disruptive (unless specifically about business model)
- holistic, best-in-class, world-class
- innovative, innovation (overused)
- state-of-the-art, next-generation

Use clear, confident, direct language. Write like a seasoned founder who knows their business inside out.

**PITCH DECK PRINCIPLES:**
1. Lead with a compelling hook that grabs attention in 10 seconds
2. Problem must feel urgent and relatable - make investors feel the pain
3. Solution should be simple to understand in one sentence
4. Show don't tell - use specific numbers, not vague claims
5. Market size must be credible with clear TAM/SAM/SOM logic
6. Traction is king - show momentum, growth, and validation
7. Team slide should highlight relevant experience and unfair advantages
8. The Ask should be specific with clear use of funds
9. Include speaker notes that help deliver the pitch confidently

**DECK STYLE: ${deckStyleInfo}**

Always respond in valid JSON format with 12 investor-ready slides.`

    const prompt = `Create a compelling ${deckStyleInfo} for:
${languageInstruction}

**COMPANY INFORMATION:**
- Company Name: ${companyName}
- Tagline: ${tagline || 'Not specified'}
- Description: ${companyDescription || 'Not specified'}
- Industry: ${industryInfo}

**THE PROBLEM:**
${problemStatement || 'Not specified'}

**THE SOLUTION:**
- Solution: ${solution || 'Not specified'}
- Key Features: ${keyFeatures || 'Not specified'}
- Unique Value: ${uniqueValue || 'Not specified'}

**MARKET OPPORTUNITY:**
- Target Market: ${targetMarket || 'Not specified'}
- Market Size: ${marketSize || 'Not specified'}
- Competitors: ${competitors || 'Not specified'}
- Competitive Advantage: ${competitiveAdvantage || 'Not specified'}

**BUSINESS MODEL:**
- Revenue Model: ${revenueModel || 'Not specified'}
- Pricing: ${pricing || 'Not specified'}
- Unit Economics: ${unitEconomics || 'Not specified'}

**TRACTION:**
- Current Metrics: ${currentTraction || 'Not specified'}
- Key Milestones: ${milestones || 'Not specified'}
- Customer Validation: ${customerTestimonials || 'Not specified'}

**TEAM:**
- Founders: ${founders || 'Not specified'}
- Key Team: ${keyTeam || 'Not specified'}
- Advisors: ${advisors || 'Not specified'}

**THE ASK:**
- Funding Stage: ${fundingStageInfo}
- Amount: ${fundingAmount || 'Not specified'}
- Use of Funds: ${useOfFunds || 'Not specified'}
- Financial Projections: ${financialProjections || 'Not specified'}

**PRESENTER:**
- Name: ${presenterName || 'Founder'}
- Title: ${presenterTitle || 'CEO'}
- Contact: ${contactEmail || 'Not specified'}

Generate a complete investor pitch deck with 12 slides in this JSON format:
{
  "deckType": "Investor Pitch Deck",
  "deckStyle": "${deckStyle}",
  "companyName": "${companyName}",
  "tagline": "Compelling one-liner",
  "generatedDate": "Current date",
  
  "slides": [
    {
      "slideNumber": 1,
      "slideType": "title",
      "title": "Title Slide",
      "content": {
        "companyName": "${companyName}",
        "tagline": "Compelling tagline that captures the essence",
        "presenter": "${presenterName || 'Founder'}, ${presenterTitle || 'CEO'}",
        "contact": "${contactEmail || 'contact@company.com'}",
        "logoSuggestion": "Suggest simple logo concept"
      },
      "speakerNotes": "Opening hook and introduction script",
      "designTips": "Clean, professional, company colors"
    },
    {
      "slideNumber": 2,
      "slideType": "problem",
      "title": "The Problem",
      "content": {
        "headline": "Problem headline that creates urgency",
        "problems": [
          {"problem": "Problem 1", "impact": "Why it matters"},
          {"problem": "Problem 2", "impact": "Why it matters"},
          {"problem": "Problem 3", "impact": "Why it matters"}
        ],
        "marketPain": "Who experiences this and how much it costs them",
        "currentSolutions": "Why existing solutions fail"
      },
      "speakerNotes": "How to emotionally connect with the problem",
      "designTips": "Use visuals that illustrate the pain point"
    },
    {
      "slideNumber": 3,
      "slideType": "solution",
      "title": "Our Solution",
      "content": {
        "headline": "Solution headline",
        "oneLiner": "What we do in one sentence",
        "howItWorks": "Simple explanation of the solution",
        "keyFeatures": ["Feature 1 + benefit", "Feature 2 + benefit", "Feature 3 + benefit"],
        "demoNotes": "What to show in product demo"
      },
      "speakerNotes": "Keep it simple, focus on value not features",
      "designTips": "Product screenshot or simple diagram"
    },
    {
      "slideNumber": 4,
      "slideType": "demo",
      "title": "Product Demo",
      "content": {
        "headline": "See it in action",
        "demoFlow": ["Step 1: User does X", "Step 2: System does Y", "Step 3: User gets Z"],
        "keyMoment": "The 'aha' moment to highlight",
        "beforeAfter": "Show the transformation"
      },
      "speakerNotes": "Keep demo to 2 minutes max, focus on the wow moment",
      "designTips": "Live demo or high-quality screenshots"
    },
    {
      "slideNumber": 5,
      "slideType": "market",
      "title": "Market Opportunity",
      "content": {
        "headline": "Market headline",
        "tam": {"value": "Total Addressable Market", "description": "Everyone who could use this"},
        "sam": {"value": "Serviceable Addressable Market", "description": "Our realistic target segment"},
        "som": {"value": "Serviceable Obtainable Market", "description": "What we can capture in 3 years"},
        "growthRate": "Market growth rate with source",
        "trends": ["Trend driving growth 1", "Trend driving growth 2"]
      },
      "speakerNotes": "Be credible, show your math, cite sources",
      "designTips": "TAM/SAM/SOM circles or market size visualization"
    },
    {
      "slideNumber": 6,
      "slideType": "business",
      "title": "Business Model",
      "content": {
        "headline": "How we make money",
        "revenueModel": "Primary revenue model",
        "pricingTiers": [
          {"tier": "Tier 1", "price": "$X/mo", "features": "What's included"},
          {"tier": "Tier 2", "price": "$X/mo", "features": "What's included"}
        ],
        "unitEconomics": {"ltv": "$X", "cac": "$X", "ltvCacRatio": "X:1", "paybackPeriod": "X months"},
        "margins": "Gross margin and path to profitability"
      },
      "speakerNotes": "Focus on unit economics and scalability",
      "designTips": "Pricing table or simple financial diagram"
    },
    {
      "slideNumber": 7,
      "slideType": "traction",
      "title": "Traction",
      "content": {
        "headline": "Momentum headline with key metric",
        "keyMetrics": [
          {"metric": "Revenue/ARR", "value": "$X", "growth": "X% MoM"},
          {"metric": "Customers/Users", "value": "X", "growth": "X% MoM"},
          {"metric": "Key Engagement Metric", "value": "X", "benchmark": "vs industry"}
        ],
        "milestones": [
          {"date": "Month Year", "milestone": "What was achieved"},
          {"date": "Month Year", "milestone": "What was achieved"}
        ],
        "logos": "Notable customer logos to display",
        "testimonial": {"quote": "Customer quote", "name": "Customer Name", "company": "Company"}
      },
      "speakerNotes": "Lead with your strongest metric, show growth trajectory",
      "designTips": "Growth chart going up and to the right"
    },
    {
      "slideNumber": 8,
      "slideType": "competition",
      "title": "Competitive Landscape",
      "content": {
        "headline": "Why we win",
        "positioning": "Our unique position in the market",
        "competitors": [
          {"name": "Competitor 1", "weakness": "Why we beat them"},
          {"name": "Competitor 2", "weakness": "Why we beat them"}
        ],
        "advantages": ["Unfair advantage 1", "Unfair advantage 2", "Unfair advantage 3"],
        "moat": "What protects us from competition"
      },
      "speakerNotes": "Acknowledge competition, focus on differentiation",
      "designTips": "2x2 matrix or comparison table"
    },
    {
      "slideNumber": 9,
      "slideType": "gtm",
      "title": "Go-to-Market Strategy",
      "content": {
        "headline": "How we'll grow",
        "strategy": "Primary GTM approach",
        "channels": [
          {"channel": "Channel 1", "tactic": "How we'll use it", "cost": "CAC estimate"},
          {"channel": "Channel 2", "tactic": "How we'll use it", "cost": "CAC estimate"}
        ],
        "partnerships": "Strategic partnerships",
        "timeline": {"phase1": "0-6 months: Focus", "phase2": "6-12 months: Expand", "phase3": "12-24 months: Scale"}
      },
      "speakerNotes": "Show you understand your customer acquisition strategy",
      "designTips": "Timeline or funnel visualization"
    },
    {
      "slideNumber": 10,
      "slideType": "team",
      "title": "The Team",
      "content": {
        "headline": "Why we're the team to do this",
        "founders": [
          {"name": "Founder 1", "title": "Role", "background": "Relevant credentials", "linkedin": "URL"}
        ],
        "keyHires": ["Key hire 1 and background", "Key hire 2 and background"],
        "advisors": [
          {"name": "Advisor Name", "background": "Why they matter"}
        ],
        "culture": "What makes this team special"
      },
      "speakerNotes": "Highlight relevant experience and founder-market fit",
      "designTips": "Professional headshots and credentials"
    },
    {
      "slideNumber": 11,
      "slideType": "financials",
      "title": "Financial Projections",
      "content": {
        "headline": "Path to $XM ARR",
        "projections": {
          "year1": {"revenue": "$X", "customers": "X", "team": "X people"},
          "year2": {"revenue": "$X", "customers": "X", "team": "X people"},
          "year3": {"revenue": "$X", "customers": "X", "team": "X people"}
        },
        "keyAssumptions": ["Assumption 1", "Assumption 2", "Assumption 3"],
        "profitability": "When and how we become profitable",
        "exitPotential": "Comparable exits and potential acquirers"
      },
      "speakerNotes": "Be conservative, explain your assumptions",
      "designTips": "Revenue growth chart with key milestones"
    },
    {
      "slideNumber": 12,
      "slideType": "ask",
      "title": "The Ask",
      "content": {
        "headline": "Join us on this journey",
        "amount": "${fundingAmount || 'Funding amount'}",
        "stage": "${fundingStageInfo}",
        "useOfFunds": [
          {"category": "Product/Engineering", "percentage": "X%", "detail": "What we'll build"},
          {"category": "Sales/Marketing", "percentage": "X%", "detail": "How we'll grow"},
          {"category": "Operations/Hiring", "percentage": "X%", "detail": "Who we'll hire"}
        ],
        "runway": "X months runway",
        "milestones": ["Milestone 1 this will achieve", "Milestone 2 this will achieve"],
        "nextRound": "What the next round looks like"
      },
      "speakerNotes": "Be specific, show you've thought through capital allocation",
      "designTips": "Pie chart for use of funds, milestone timeline"
    }
  ],
  
  "appendix": {
    "title": "Appendix Slides (if needed)",
    "suggestions": [
      "Detailed financials",
      "Product roadmap",
      "Technical architecture",
      "Case studies",
      "Market research data"
    ]
  },
  
  "pitchTips": [
    "Specific tip for this pitch 1",
    "Specific tip for this pitch 2", 
    "Specific tip for this pitch 3"
  ],
  
  "commonQuestions": [
    {"question": "Expected investor question 1", "suggestedAnswer": "How to answer"},
    {"question": "Expected investor question 2", "suggestedAnswer": "How to answer"},
    {"question": "Expected investor question 3", "suggestedAnswer": "How to answer"}
  ]
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
      result = {
        deckType: 'Investor Pitch Deck',
        companyName,
        generatedDate: new Date().toISOString(),
        error: 'Failed to generate complete pitch deck. Please try again.',
        rawContent: llmResponse
      }
    }

    return NextResponse.json({
      success: true,
      data: result,
      metadata: {
        deckType: 'Investor Pitch Deck',
        deckStyle,
        companyName,
        industry: industryInfo,
        fundingStage: fundingStageInfo,
        detectedLanguage,
        generatedAt: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('Pitch Deck Generator Error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to generate pitch deck' },
      { status: 500 }
    )
  }
}
