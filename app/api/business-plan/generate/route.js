import { NextResponse } from 'next/server'
import { spawn } from 'child_process'
import path from 'path'

// Business Plan Types
const PLAN_TYPES = {
  traditional: {
    name: 'Traditional Business Plan',
    description: 'Comprehensive 20-50 page plan for banks and investors',
    sections: ['executive', 'company', 'products', 'market', 'operations', 'management', 'financial']
  },
  lean: {
    name: 'Lean Startup Plan',
    description: 'One-page business model canvas for quick iteration',
    sections: ['value', 'customers', 'channels', 'revenue', 'resources', 'activities', 'partners', 'costs']
  },
  pitch: {
    name: 'Investor Pitch Deck',
    description: 'Visual 10-15 slide presentation for pitching',
    sections: ['problem', 'solution', 'market', 'product', 'traction', 'team', 'financials', 'ask']
  }
}

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
  nonprofit: 'Non-profit',
  other: 'Other'
}

// Business Stages
const STAGES = {
  idea: 'Idea Stage - Just starting with a concept',
  mvp: 'MVP Stage - Building or testing initial product',
  launch: 'Launch Stage - Ready to go to market',
  growth: 'Growth Stage - Scaling an existing business',
  expansion: 'Expansion Stage - Entering new markets'
}

// Legal Structures
const LEGAL_STRUCTURES = {
  sole: 'Sole Proprietorship',
  llc: 'Limited Liability Company (LLC)',
  partnership: 'Partnership',
  scorp: 'S Corporation',
  ccorp: 'C Corporation',
  nonprofit: 'Non-profit Organization'
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
      // Plan Type
      planType = 'traditional',
      
      // Company Basics
      companyName,
      companyDescription,
      industry,
      businessStage,
      legalStructure,
      foundingDate,
      location,
      
      // Mission & Vision
      missionStatement,
      visionStatement,
      coreValues,
      
      // Products/Services
      productsServices,
      problemSolved,
      uniqueValue,
      pricingModel,
      
      // Market
      targetMarket,
      marketSize,
      competitors,
      competitiveAdvantage,
      
      // Team
      founders,
      keyTeam,
      advisors,
      hiringPlan,
      
      // Operations
      operationsDescription,
      suppliers,
      technologyStack,
      
      // Financials
      revenueModel,
      startupCosts,
      fundingNeeded,
      fundingUse,
      projectedRevenue,
      breakEvenTimeline,
      
      // Goals
      shortTermGoals,
      longTermGoals,
      milestones
    } = body

    if (!companyName) {
      return NextResponse.json(
        { success: false, error: 'Company name is required' },
        { status: 400 }
      )
    }

    // Language detection
    const allText = `${companyName} ${companyDescription || ''} ${targetMarket || ''} ${productsServices || ''}`
    const bengaliPattern = /[\u0980-\u09FF]/
    const hindiPattern = /[\u0900-\u097F]/
    
    let detectedLanguage = 'English'
    let languageInstruction = ''
    
    if (bengaliPattern.test(allText)) {
      detectedLanguage = 'Bengali (বাংলা)'
      languageInstruction = `\n**CRITICAL: Generate ALL business plan content in Bengali (বাংলা). Do not use English.**\n`
    } else if (hindiPattern.test(allText)) {
      detectedLanguage = 'Hindi (हिंदी)'
      languageInstruction = `\n**CRITICAL: Generate ALL business plan content in Hindi (हिंदी). Do not use English.**\n`
    }

    const planTypeInfo = PLAN_TYPES[planType] || PLAN_TYPES.traditional
    const industryInfo = INDUSTRIES[industry] || industry
    const stageInfo = STAGES[businessStage] || businessStage
    const legalInfo = LEGAL_STRUCTURES[legalStructure] || legalStructure

    const systemPrompt = `You are an elite business plan consultant with 25+ years of experience helping startups and established companies create winning business plans. You have helped secure over $500M in funding for your clients. You understand what investors, banks, and stakeholders look for in a business plan.

${languageInstruction}

**BANNED WORDS - DO NOT USE THESE AI-SOUNDING WORDS:**
NEVER use these overused, cliché words that make business plans sound generic or AI-generated:
- unlock, unleash, unveil
- revolutionize, revolutionary
- game-changer, game-changing
- cutting-edge, groundbreaking
- supercharge, turbocharge, skyrocket
- seamless, seamlessly
- harness, leverage (as verbs)
- elevate, empower, transform (overused)
- dive into, dive deep, delve
- synergy, synergistic
- paradigm shift
- disrupt, disruptive (unless specifically about business model)
- holistic
- best-in-class, world-class
- innovative, innovation (overused)
- state-of-the-art, next-generation

Use clear, direct, professional language. Write like an experienced business consultant giving practical advice.

YOUR EXPERTISE:
- Traditional business plans for bank loans and SBA financing
- Investor pitch decks for seed, Series A, B funding
- Lean startup methodology and business model canvas
- Financial modeling and projections
- Market analysis and competitive positioning
- Go-to-market strategy development

BUSINESS PLAN PRINCIPLES:
1. Be specific and data-driven - use numbers, percentages, timelines
2. Show deep market understanding with real research
3. Demonstrate clear competitive advantage
4. Present realistic, achievable financial projections
5. Address risks and how you'll mitigate them
6. Show a capable team that can execute
7. Make the path to profitability clear

Always respond in valid JSON format.`

    let prompt = ''
    
    if (planType === 'traditional') {
      prompt = `Create a comprehensive Traditional Business Plan for the following company:
${languageInstruction}

**COMPANY INFORMATION:**
- Company Name: ${companyName}
- Description: ${companyDescription || 'Not specified'}
- Industry: ${industryInfo}
- Business Stage: ${stageInfo}
- Legal Structure: ${legalInfo}
- Founded: ${foundingDate || 'Not specified'}
- Location: ${location || 'Not specified'}

**MISSION & VISION:**
- Mission: ${missionStatement || 'Not specified'}
- Vision: ${visionStatement || 'Not specified'}
- Core Values: ${coreValues || 'Not specified'}

**PRODUCTS/SERVICES:**
- Offerings: ${productsServices || 'Not specified'}
- Problem Solved: ${problemSolved || 'Not specified'}
- Unique Value Proposition: ${uniqueValue || 'Not specified'}
- Pricing Model: ${pricingModel || 'Not specified'}

**TARGET MARKET:**
- Target Audience: ${targetMarket || 'Not specified'}
- Market Size: ${marketSize || 'Not specified'}

**COMPETITION:**
- Main Competitors: ${competitors || 'Not specified'}
- Competitive Advantage: ${competitiveAdvantage || 'Not specified'}

**TEAM:**
- Founders: ${founders || 'Not specified'}
- Key Team Members: ${keyTeam || 'Not specified'}
- Advisors: ${advisors || 'Not specified'}
- Hiring Plan: ${hiringPlan || 'Not specified'}

**OPERATIONS:**
- Operations: ${operationsDescription || 'Not specified'}
- Key Suppliers: ${suppliers || 'Not specified'}
- Technology: ${technologyStack || 'Not specified'}

**FINANCIALS:**
- Revenue Model: ${revenueModel || 'Not specified'}
- Startup Costs: ${startupCosts || 'Not specified'}
- Funding Needed: ${fundingNeeded || 'Not specified'}
- Use of Funds: ${fundingUse || 'Not specified'}
- Projected Revenue: ${projectedRevenue || 'Not specified'}
- Break-even Timeline: ${breakEvenTimeline || 'Not specified'}

**GOALS:**
- Short-term Goals (1 year): ${shortTermGoals || 'Not specified'}
- Long-term Goals (3-5 years): ${longTermGoals || 'Not specified'}
- Key Milestones: ${milestones || 'Not specified'}

Generate a complete Traditional Business Plan in this JSON format:
{
  "planType": "Traditional Business Plan",
  "companyName": "${companyName}",
  "generatedDate": "Current date",
  
  "executiveSummary": {
    "title": "Executive Summary",
    "overview": "2-3 paragraph compelling overview of the entire business",
    "businessDescription": "What the company does and its value proposition",
    "missionStatement": "Company mission",
    "productsServices": "Brief description of offerings",
    "targetMarket": "Who the customers are",
    "competitiveAdvantage": "What sets the company apart",
    "financialHighlights": "Key financial projections and funding needs",
    "teamHighlights": "Key team credentials",
    "fundingRequest": "Amount needed and use of funds (if applicable)"
  },
  
  "companyDescription": {
    "title": "Company Description",
    "overview": "Detailed company description",
    "missionStatement": "Full mission statement",
    "visionStatement": "Full vision statement",
    "coreValues": ["Value 1", "Value 2", "Value 3"],
    "companyHistory": "Brief history or founding story",
    "legalStructure": "Legal structure and ownership details",
    "location": "Location and facilities",
    "industryOverview": "Industry context and trends",
    "goalsObjectives": {
      "shortTerm": ["Goal 1", "Goal 2", "Goal 3"],
      "longTerm": ["Goal 1", "Goal 2", "Goal 3"]
    }
  },
  
  "productsAndServices": {
    "title": "Products & Services",
    "overview": "Overview of all offerings",
    "productsList": [
      {
        "name": "Product/Service name",
        "description": "What it is",
        "features": ["Feature 1", "Feature 2"],
        "benefits": ["Benefit 1", "Benefit 2"],
        "pricing": "Pricing details",
        "status": "Development stage"
      }
    ],
    "problemSolution": "Problem being solved and how",
    "uniqueValueProposition": "What makes the offerings unique",
    "intellectualProperty": "Patents, trademarks, proprietary tech",
    "futureProducts": "Planned future offerings",
    "productionDelivery": "How products are made/services delivered"
  },
  
  "marketAnalysis": {
    "title": "Market Analysis",
    "industryOverview": {
      "description": "Industry description and context",
      "size": "Total industry size",
      "growthRate": "Industry growth rate",
      "trends": ["Trend 1", "Trend 2", "Trend 3"],
      "outlook": "Industry outlook"
    },
    "targetMarket": {
      "description": "Target customer description",
      "demographics": "Key demographics",
      "psychographics": "Customer behaviors and preferences",
      "size": "Target market size (TAM, SAM, SOM)",
      "needs": ["Need 1", "Need 2", "Need 3"]
    },
    "competitiveAnalysis": {
      "overview": "Competitive landscape overview",
      "directCompetitors": [
        {
          "name": "Competitor name",
          "description": "What they do",
          "strengths": ["Strength 1"],
          "weaknesses": ["Weakness 1"],
          "marketShare": "Estimated share"
        }
      ],
      "indirectCompetitors": ["Competitor 1", "Competitor 2"],
      "competitiveAdvantage": "How you will win",
      "barriersToEntry": ["Barrier 1", "Barrier 2"]
    },
    "swotAnalysis": {
      "strengths": ["Strength 1", "Strength 2", "Strength 3"],
      "weaknesses": ["Weakness 1", "Weakness 2"],
      "opportunities": ["Opportunity 1", "Opportunity 2", "Opportunity 3"],
      "threats": ["Threat 1", "Threat 2"]
    }
  },
  
  "marketingPlan": {
    "title": "Marketing & Sales Strategy",
    "overview": "Marketing strategy overview",
    "positioning": "Market positioning statement",
    "branding": "Brand strategy",
    "pricingStrategy": {
      "model": "Pricing model",
      "justification": "Why this pricing",
      "comparison": "How it compares to competitors"
    },
    "promotionStrategy": {
      "channels": ["Channel 1", "Channel 2", "Channel 3"],
      "tactics": ["Tactic 1", "Tactic 2", "Tactic 3"],
      "budget": "Marketing budget allocation"
    },
    "salesStrategy": {
      "process": "Sales process description",
      "channels": ["Sales channel 1", "Sales channel 2"],
      "team": "Sales team structure"
    },
    "customerAcquisition": {
      "strategy": "How you'll acquire customers",
      "cac": "Estimated customer acquisition cost",
      "ltv": "Estimated lifetime value"
    },
    "distributionChannels": ["Channel 1", "Channel 2"]
  },
  
  "operationsPlan": {
    "title": "Operations Plan",
    "overview": "Operations overview",
    "location": {
      "description": "Location details",
      "facilities": "Facility requirements",
      "equipment": ["Equipment 1", "Equipment 2"]
    },
    "productionProcess": "How products are made/services delivered",
    "qualityControl": "Quality assurance processes",
    "supplyChain": {
      "suppliers": ["Supplier 1", "Supplier 2"],
      "inventory": "Inventory management approach",
      "logistics": "Distribution and logistics"
    },
    "technology": {
      "systems": ["System 1", "System 2"],
      "infrastructure": "Tech infrastructure"
    },
    "milestones": [
      {"milestone": "Milestone 1", "timeline": "Q1 2026", "status": "In Progress"},
      {"milestone": "Milestone 2", "timeline": "Q2 2026", "status": "Planned"}
    ]
  },
  
  "managementTeam": {
    "title": "Management & Organization",
    "overview": "Team overview and why they're qualified",
    "founders": [
      {
        "name": "Founder name",
        "title": "Title",
        "bio": "Brief biography",
        "experience": "Relevant experience",
        "responsibilities": "Key responsibilities"
      }
    ],
    "keyTeam": [
      {
        "name": "Team member name",
        "title": "Title",
        "bio": "Brief bio",
        "responsibilities": "Key responsibilities"
      }
    ],
    "advisors": [
      {
        "name": "Advisor name",
        "expertise": "Area of expertise",
        "contribution": "How they help"
      }
    ],
    "organizationalStructure": "Description of org structure",
    "hiringPlan": {
      "currentTeamSize": "Current number",
      "plannedHires": [
        {"role": "Role 1", "timeline": "When", "priority": "High/Medium/Low"}
      ]
    },
    "compensation": "Compensation philosophy"
  },
  
  "financialPlan": {
    "title": "Financial Plan",
    "overview": "Financial strategy overview",
    "revenueModel": {
      "description": "How the business makes money",
      "streams": ["Revenue stream 1", "Revenue stream 2"],
      "pricing": "Pricing summary"
    },
    "startupCosts": {
      "total": "Total startup costs",
      "breakdown": [
        {"category": "Category 1", "amount": "$X", "description": "Details"},
        {"category": "Category 2", "amount": "$X", "description": "Details"}
      ]
    },
    "fundingRequirements": {
      "amount": "Total funding needed",
      "use": [
        {"category": "Use 1", "amount": "$X", "percentage": "X%"},
        {"category": "Use 2", "amount": "$X", "percentage": "X%"}
      ],
      "timeline": "When funding is needed"
    },
    "financialProjections": {
      "year1": {"revenue": "$X", "expenses": "$X", "netIncome": "$X"},
      "year2": {"revenue": "$X", "expenses": "$X", "netIncome": "$X"},
      "year3": {"revenue": "$X", "expenses": "$X", "netIncome": "$X"},
      "assumptions": ["Assumption 1", "Assumption 2", "Assumption 3"]
    },
    "breakEvenAnalysis": {
      "timeline": "When break-even expected",
      "units": "Units needed to break even",
      "revenue": "Revenue needed to break even"
    },
    "keyMetrics": {
      "grossMargin": "X%",
      "netMargin": "X%",
      "cac": "$X",
      "ltv": "$X",
      "burnRate": "$X/month"
    }
  },
  
  "appendix": {
    "title": "Appendix",
    "suggestedDocuments": [
      "Detailed financial statements",
      "Market research data",
      "Product specifications",
      "Team resumes",
      "Legal documents",
      "Letters of intent",
      "Customer testimonials"
    ]
  },
  
  "tips": [
    "Tip 1 for improving this business plan",
    "Tip 2",
    "Tip 3"
  ]
}`
    } else if (planType === 'lean') {
      prompt = `Create a Lean Startup Business Model Canvas for:
${languageInstruction}

**COMPANY:** ${companyName}
**DESCRIPTION:** ${companyDescription || 'Not specified'}
**INDUSTRY:** ${industryInfo}
**PRODUCTS/SERVICES:** ${productsServices || 'Not specified'}
**TARGET MARKET:** ${targetMarket || 'Not specified'}
**UNIQUE VALUE:** ${uniqueValue || 'Not specified'}
**REVENUE MODEL:** ${revenueModel || 'Not specified'}

Generate a complete Lean Canvas in this JSON format:
{
  "planType": "Lean Startup Canvas",
  "companyName": "${companyName}",
  "generatedDate": "Current date",
  
  "canvas": {
    "problem": {
      "title": "Problem",
      "topProblems": ["Problem 1", "Problem 2", "Problem 3"],
      "existingAlternatives": ["Alternative 1", "Alternative 2"]
    },
    "solution": {
      "title": "Solution",
      "topFeatures": ["Feature 1", "Feature 2", "Feature 3"]
    },
    "uniqueValueProposition": {
      "title": "Unique Value Proposition",
      "statement": "Single clear compelling message",
      "highLevelConcept": "X for Y analogy"
    },
    "unfairAdvantage": {
      "title": "Unfair Advantage",
      "advantages": ["Can't be easily copied or bought"]
    },
    "customerSegments": {
      "title": "Customer Segments",
      "targetCustomers": ["Segment 1", "Segment 2"],
      "earlyAdopters": "Who are early adopters"
    },
    "keyMetrics": {
      "title": "Key Metrics",
      "metrics": ["Metric 1", "Metric 2", "Metric 3"]
    },
    "channels": {
      "title": "Channels",
      "pathToCustomers": ["Channel 1", "Channel 2", "Channel 3"]
    },
    "costStructure": {
      "title": "Cost Structure",
      "fixedCosts": ["Cost 1", "Cost 2"],
      "variableCosts": ["Cost 1", "Cost 2"],
      "customerAcquisitionCost": "$X",
      "monthlyBurnRate": "$X"
    },
    "revenueStreams": {
      "title": "Revenue Streams",
      "streams": ["Stream 1", "Stream 2"],
      "pricing": "Pricing model",
      "lifetimeValue": "$X",
      "grossMargin": "X%"
    }
  },
  
  "hypotheses": [
    {"hypothesis": "Hypothesis 1", "test": "How to test"},
    {"hypothesis": "Hypothesis 2", "test": "How to test"}
  ],
  
  "mvpPlan": {
    "description": "Minimum viable product description",
    "features": ["Core feature 1", "Core feature 2"],
    "timeline": "X weeks/months",
    "budget": "$X"
  },
  
  "tips": ["Tip 1", "Tip 2", "Tip 3"]
}`
    } else {
      // Pitch deck
      prompt = `Create an Investor Pitch Deck outline for:
${languageInstruction}

**COMPANY:** ${companyName}
**DESCRIPTION:** ${companyDescription || 'Not specified'}
**INDUSTRY:** ${industryInfo}
**STAGE:** ${stageInfo}
**PRODUCTS/SERVICES:** ${productsServices || 'Not specified'}
**TARGET MARKET:** ${targetMarket || 'Not specified'}
**MARKET SIZE:** ${marketSize || 'Not specified'}
**TEAM:** ${founders || 'Not specified'}
**FUNDING NEEDED:** ${fundingNeeded || 'Not specified'}
**USE OF FUNDS:** ${fundingUse || 'Not specified'}

Generate a complete Pitch Deck in this JSON format:
{
  "planType": "Investor Pitch Deck",
  "companyName": "${companyName}",
  "generatedDate": "Current date",
  
  "slides": [
    {
      "slideNumber": 1,
      "title": "Title Slide",
      "content": {
        "companyName": "${companyName}",
        "tagline": "One-liner that explains the business",
        "presenter": "Presenter name and title",
        "contact": "Contact info"
      },
      "speakerNotes": "Introduction talking points"
    },
    {
      "slideNumber": 2,
      "title": "The Problem",
      "content": {
        "headline": "Problem headline",
        "problemStatements": ["Problem 1", "Problem 2", "Problem 3"],
        "impact": "Why this problem matters",
        "whoFeelsIt": "Who experiences this pain"
      },
      "speakerNotes": "How to present the problem"
    },
    {
      "slideNumber": 3,
      "title": "The Solution",
      "content": {
        "headline": "Solution headline",
        "howItWorks": "Brief explanation",
        "keyFeatures": ["Feature 1", "Feature 2", "Feature 3"],
        "demo": "Product demo suggestion"
      },
      "speakerNotes": "How to present solution"
    },
    {
      "slideNumber": 4,
      "title": "Market Opportunity",
      "content": {
        "tam": "Total Addressable Market",
        "sam": "Serviceable Addressable Market",
        "som": "Serviceable Obtainable Market",
        "growthRate": "Market growth rate",
        "trends": ["Trend 1", "Trend 2"]
      },
      "speakerNotes": "Market size talking points"
    },
    {
      "slideNumber": 5,
      "title": "Business Model",
      "content": {
        "revenueModel": "How you make money",
        "pricing": "Pricing structure",
        "unitEconomics": "Key unit economics",
        "margins": "Gross/net margins"
      },
      "speakerNotes": "Revenue model explanation"
    },
    {
      "slideNumber": 6,
      "title": "Traction",
      "content": {
        "headline": "Traction headline",
        "metrics": [
          {"metric": "Users/Customers", "value": "X"},
          {"metric": "Revenue", "value": "$X"},
          {"metric": "Growth", "value": "X%"}
        ],
        "milestones": ["Milestone 1", "Milestone 2"],
        "testimonials": "Customer validation"
      },
      "speakerNotes": "Traction talking points"
    },
    {
      "slideNumber": 7,
      "title": "Competition",
      "content": {
        "landscape": "Competitive landscape",
        "competitors": ["Competitor 1", "Competitor 2"],
        "differentiation": "How you're different",
        "competitiveAdvantages": ["Advantage 1", "Advantage 2"]
      },
      "speakerNotes": "Competition talking points"
    },
    {
      "slideNumber": 8,
      "title": "Go-to-Market Strategy",
      "content": {
        "strategy": "GTM strategy overview",
        "channels": ["Channel 1", "Channel 2"],
        "partnerships": "Key partnerships",
        "timeline": "GTM timeline"
      },
      "speakerNotes": "GTM talking points"
    },
    {
      "slideNumber": 9,
      "title": "The Team",
      "content": {
        "founders": [
          {"name": "Name", "title": "Title", "background": "Key credentials"}
        ],
        "advisors": ["Advisor 1"],
        "whyThisTeam": "Why this team will win"
      },
      "speakerNotes": "Team talking points"
    },
    {
      "slideNumber": 10,
      "title": "Financials",
      "content": {
        "projections": {
          "year1": "$X revenue",
          "year2": "$X revenue",
          "year3": "$X revenue"
        },
        "keyAssumptions": ["Assumption 1", "Assumption 2"],
        "pathToProfitability": "When and how"
      },
      "speakerNotes": "Financial talking points"
    },
    {
      "slideNumber": 11,
      "title": "The Ask",
      "content": {
        "amount": "Funding amount",
        "useOfFunds": [
          {"category": "Category 1", "percentage": "X%"},
          {"category": "Category 2", "percentage": "X%"}
        ],
        "milestones": "What this funding will achieve",
        "timeline": "Runway this provides"
      },
      "speakerNotes": "Ask talking points"
    },
    {
      "slideNumber": 12,
      "title": "Thank You",
      "content": {
        "callToAction": "Next steps",
        "contactInfo": "How to reach you",
        "closing": "Memorable closing statement"
      },
      "speakerNotes": "Closing talking points"
    }
  ],
  
  "tips": [
    "Pitch deck tip 1",
    "Pitch deck tip 2",
    "Pitch deck tip 3"
  ]
}`
    }

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
        planType: planTypeInfo.name,
        companyName,
        generatedDate: new Date().toISOString(),
        error: 'Failed to generate complete business plan. Please try again.',
        rawContent: llmResponse
      }
    }

    return NextResponse.json({
      success: true,
      data: result,
      metadata: {
        planType: planTypeInfo.name,
        companyName,
        industry: industryInfo,
        stage: stageInfo,
        detectedLanguage,
        generatedAt: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('Business Plan Generator Error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to generate business plan' },
      { status: 500 }
    )
  }
}
