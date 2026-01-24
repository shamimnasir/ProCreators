import { NextResponse } from 'next/server'
import { spawn } from 'child_process'
import path from 'path'

// Marketing Frameworks
const FRAMEWORKS = {
  '7ps': {
    name: 'Marketing Mix (7 Ps)',
    description: 'Comprehensive framework covering Product, Price, Promotion, Place, People, Process, Physical Evidence',
    components: ['Product', 'Price', 'Promotion', 'Place', 'People', 'Process', 'Physical Evidence']
  },
  'stp': {
    name: 'STP Model',
    description: 'Segmentation, Targeting, and Positioning strategy',
    components: ['Market Segmentation', 'Target Market Selection', 'Brand Positioning']
  },
  'ansoff': {
    name: 'Ansoff Growth Matrix',
    description: 'Strategic growth options: Market Penetration, Market Development, Product Development, Diversification',
    components: ['Market Penetration', 'Market Development', 'Product Development', 'Diversification']
  },
  'funnel': {
    name: 'Full-Funnel Marketing',
    description: 'Customer journey stages from awareness to retention',
    components: ['Awareness', 'Consideration', 'Decision', 'Retention', 'Advocacy']
  },
  'complete': {
    name: 'Complete Marketing Plan',
    description: 'Full 12-month marketing plan with all components',
    components: ['Executive Summary', 'Situation Analysis', 'Target Audience', 'SMART Goals', 'Tactics', 'Budget', 'Timeline', 'KPIs']
  }
}

// Industry Types
const INDUSTRIES = {
  'saas': 'SaaS / Software',
  'ecommerce': 'E-commerce / Retail',
  'service': 'Professional Services',
  'health': 'Healthcare / Wellness',
  'finance': 'Finance / Fintech',
  'education': 'Education / EdTech',
  'food': 'Food & Beverage',
  'real-estate': 'Real Estate',
  'travel': 'Travel & Hospitality',
  'manufacturing': 'Manufacturing / B2B',
  'nonprofit': 'Nonprofit / NGO',
  'other': 'Other'
}

// Business Stages
const BUSINESS_STAGES = {
  'startup': 'Startup (0-2 years)',
  'growth': 'Growth Stage (2-5 years)',
  'established': 'Established (5+ years)',
  'enterprise': 'Enterprise / Corporation'
}

// Budget Ranges
const BUDGET_RANGES = {
  'micro': '$0 - $5K/month',
  'small': '$5K - $20K/month',
  'medium': '$20K - $100K/month',
  'large': '$100K+/month'
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
      businessName,
      businessDescription,
      industry,
      businessStage,
      targetAudience,
      competitors,
      currentChallenges,
      goals,
      budget,
      timeline,
      framework,
      existingChannels,
      uniqueValue
    } = body

    if (!businessName || !businessDescription) {
      return NextResponse.json(
        { success: false, error: 'Business name and description are required' },
        { status: 400 }
      )
    }

    // Language detection
    const allText = `${businessName} ${businessDescription} ${targetAudience || ''} ${goals || ''}`
    const bengaliPattern = /[\u0980-\u09FF]/
    const hindiPattern = /[\u0900-\u097F]/
    const arabicPattern = /[\u0600-\u06FF]/
    const chinesePattern = /[\u4E00-\u9FFF]/
    
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
    }

    const frameworkInfo = FRAMEWORKS[framework] || FRAMEWORKS.complete
    const industryInfo = INDUSTRIES[industry] || 'General'
    const stageInfo = BUSINESS_STAGES[businessStage] || 'Growth Stage'
    const budgetInfo = BUDGET_RANGES[budget] || 'Not specified'

    const languageInstruction = isNonEnglish 
      ? `\n\n**CRITICAL: Generate ALL content in ${detectedLanguage}. Do not use English.**`
      : ''

    const systemPrompt = `You are an elite marketing strategist and consultant with 20+ years of experience working with Fortune 500 companies and high-growth startups. You specialize in creating data-driven, actionable marketing strategies that deliver measurable ROI.

${isNonEnglish ? `**IMPORTANT: The user is writing in ${detectedLanguage}. Generate ALL content in ${detectedLanguage}.**\n` : ''}

**BANNED WORDS - DO NOT USE THESE AI-SOUNDING WORDS:**
NEVER use these overused, cliché words that make content sound AI-generated:
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
- robust, scalable (when used generically)
- synergy, synergistic
- paradigm shift
- disrupt, disruptive
- holistic
- streamline
- maximize potential
- take it to the next level
- innovative, innovation (overused)
- world-class
- state-of-the-art
- next-generation
- best-in-class

Instead, use clear, direct, practical language. Write like an experienced consultant giving real advice.

YOUR EXPERTISE:
- Strategic marketing planning and execution
- Brand positioning and differentiation
- Customer acquisition and retention strategies
- Digital marketing and omnichannel integration
- Marketing analytics and ROI optimization
- Competitive analysis and market research
- Budget allocation and resource optimization

KEY PRINCIPLES FOR 2026:
1. AI-first marketing automation and personalization
2. Privacy-compliant data strategies (cookieless tracking)
3. Video-first content across all platforms
4. Community-led growth and brand advocacy
5. Sustainability and purpose-driven messaging
6. Hyper-personalization at scale
7. Voice search and conversational marketing
8. Influencer and creator economy integration

**CRITICAL OUTPUT REQUIREMENTS:**
1. BE EXTREMELY DETAILED AND COMPREHENSIVE - Each section should have 3-5 paragraphs of content minimum
2. Include SPECIFIC numbers, percentages, timelines, and KPIs wherever possible
3. Provide ACTIONABLE tactics with step-by-step implementation guidance
4. Include REAL-WORLD examples and industry benchmarks
5. Each strategy must include WHY it works, HOW to implement, and WHAT results to expect
6. For recommendations, provide at least 5-7 detailed items per section
7. Include specific tool/platform recommendations with alternatives
8. Add budget estimates and resource requirements for each tactic
9. Include risk factors and mitigation strategies
10. Provide monthly/quarterly breakdown of activities

DO NOT give generic or surface-level advice. The user needs a COMPLETE, EXECUTABLE strategy document they can immediately act upon. Sound practical and human, not like AI.

Respond in valid JSON format.`

    let prompt = ''
    
    if (framework === 'complete') {
      prompt = `Create a comprehensive 12-month marketing plan for:

**BUSINESS OVERVIEW:**
- Business Name: ${businessName}
- Description: ${businessDescription}
- Industry: ${industryInfo}
- Stage: ${stageInfo}
- Unique Value Proposition: ${uniqueValue || 'To be defined'}

**CURRENT SITUATION:**
- Target Audience: ${targetAudience || 'To be defined'}
- Main Competitors: ${competitors || 'Not specified'}
- Current Challenges: ${currentChallenges || 'Not specified'}
- Existing Channels: ${existingChannels || 'None specified'}

**OBJECTIVES:**
- Business Goals: ${goals || 'Increase revenue and brand awareness'}
- Budget: ${budgetInfo}
- Timeline: ${timeline || '12 months'}
${languageInstruction}

Generate a complete marketing plan in this JSON format:
{
  "executiveSummary": {
    "mission": "Company mission statement",
    "vision": "Where you want to be in 3-5 years",
    "marketingObjective": "Primary marketing objective",
    "keyStrategies": ["Strategy 1", "Strategy 2", "Strategy 3"]
  },
  "situationAnalysis": {
    "swot": {
      "strengths": ["Strength 1", "Strength 2", "Strength 3"],
      "weaknesses": ["Weakness 1", "Weakness 2", "Weakness 3"],
      "opportunities": ["Opportunity 1", "Opportunity 2", "Opportunity 3"],
      "threats": ["Threat 1", "Threat 2", "Threat 3"]
    },
    "competitorAnalysis": [
      {"name": "Competitor 1", "strengths": "Their strengths", "weaknesses": "Their weaknesses", "differentiator": "How to beat them"}
    ],
    "marketTrends": ["Trend 1", "Trend 2", "Trend 3"]
  },
  "targetAudience": {
    "primaryPersona": {
      "name": "Persona name (e.g., 'Tech-Savvy Sarah')",
      "demographics": "Age, location, income, education",
      "psychographics": "Values, interests, lifestyle",
      "painPoints": ["Pain point 1", "Pain point 2"],
      "goals": ["Goal 1", "Goal 2"],
      "preferredChannels": ["Channel 1", "Channel 2"],
      "buyingBehavior": "How they make purchasing decisions"
    },
    "secondaryPersona": {
      "name": "Secondary persona name",
      "demographics": "Demographics",
      "psychographics": "Psychographics",
      "painPoints": ["Pain point 1"],
      "goals": ["Goal 1"]
    }
  },
  "positioning": {
    "positioningStatement": "For [target audience] who [need/want], [brand] is the [category] that [key benefit] because [reason to believe].",
    "uniqueValueProposition": "Clear UVP statement",
    "brandVoice": "Tone and personality description",
    "keyMessages": ["Message 1", "Message 2", "Message 3"]
  },
  "smartGoals": [
    {
      "goal": "Specific goal description",
      "metric": "How it will be measured",
      "target": "Specific number/percentage",
      "deadline": "Timeline",
      "owner": "Responsible team/person"
    }
  ],
  "marketingMix": {
    "product": {
      "coreOffering": "Main product/service",
      "valueAdditions": ["Value add 1", "Value add 2"],
      "productStrategy": "Product positioning strategy"
    },
    "price": {
      "pricingStrategy": "Premium/Value/Penetration/etc.",
      "pricePoints": "Specific pricing tiers or ranges",
      "promotionalPricing": "Discount strategies"
    },
    "place": {
      "distributionChannels": ["Channel 1", "Channel 2"],
      "geographicFocus": "Target regions/markets",
      "channelStrategy": "How to optimize distribution"
    },
    "promotion": {
      "advertisingChannels": ["Channel 1 with budget %", "Channel 2 with budget %"],
      "contentStrategy": "Content approach",
      "prStrategy": "PR and earned media approach"
    },
    "people": {
      "teamStructure": "Marketing team needs",
      "training": "Skills development areas",
      "customerService": "Customer experience strategy"
    },
    "process": {
      "customerJourney": "Key touchpoints optimization",
      "automation": "Marketing automation opportunities",
      "workflows": "Key marketing workflows"
    },
    "physicalEvidence": {
      "brandAssets": "Visual identity elements",
      "socialProof": "Testimonials, reviews strategy",
      "credentials": "Trust signals to highlight"
    }
  },
  "channelStrategy": {
    "paid": {
      "channels": ["Google Ads", "Meta Ads", "LinkedIn Ads"],
      "budgetAllocation": "% split across channels",
      "tactics": ["Tactic 1", "Tactic 2"]
    },
    "owned": {
      "channels": ["Website", "Email", "Blog"],
      "strategy": "Owned media approach",
      "contentCalendar": "Content frequency and themes"
    },
    "earned": {
      "channels": ["PR", "Reviews", "Influencers"],
      "strategy": "Earned media approach",
      "tactics": ["Tactic 1", "Tactic 2"]
    }
  },
  "funnelStrategy": {
    "awareness": {
      "objective": "Top-of-funnel goal",
      "tactics": ["Tactic 1", "Tactic 2"],
      "kpis": ["KPI 1", "KPI 2"]
    },
    "consideration": {
      "objective": "Mid-funnel goal",
      "tactics": ["Tactic 1", "Tactic 2"],
      "kpis": ["KPI 1", "KPI 2"]
    },
    "decision": {
      "objective": "Bottom-funnel goal",
      "tactics": ["Tactic 1", "Tactic 2"],
      "kpis": ["KPI 1", "KPI 2"]
    },
    "retention": {
      "objective": "Post-purchase goal",
      "tactics": ["Tactic 1", "Tactic 2"],
      "kpis": ["KPI 1", "KPI 2"]
    }
  },
  "budgetAllocation": {
    "totalBudget": "${budgetInfo}",
    "breakdown": [
      {"category": "Paid Advertising", "percentage": 40, "amount": "Estimated amount", "notes": "Focus areas"},
      {"category": "Content Marketing", "percentage": 20, "amount": "Estimated amount", "notes": "Focus areas"},
      {"category": "Marketing Technology", "percentage": 15, "amount": "Estimated amount", "notes": "Tools needed"},
      {"category": "Events & Sponsorships", "percentage": 10, "amount": "Estimated amount", "notes": "Key events"},
      {"category": "PR & Influencers", "percentage": 10, "amount": "Estimated amount", "notes": "Approach"},
      {"category": "Contingency", "percentage": 5, "amount": "Estimated amount", "notes": "Buffer"}
    ]
  },
  "implementationTimeline": {
    "quarter1": {
      "theme": "Quarter theme (e.g., Foundation Building)",
      "priorities": ["Priority 1", "Priority 2", "Priority 3"],
      "milestones": ["Milestone 1", "Milestone 2"]
    },
    "quarter2": {
      "theme": "Quarter theme",
      "priorities": ["Priority 1", "Priority 2"],
      "milestones": ["Milestone 1", "Milestone 2"]
    },
    "quarter3": {
      "theme": "Quarter theme",
      "priorities": ["Priority 1", "Priority 2"],
      "milestones": ["Milestone 1", "Milestone 2"]
    },
    "quarter4": {
      "theme": "Quarter theme",
      "priorities": ["Priority 1", "Priority 2"],
      "milestones": ["Milestone 1", "Milestone 2"]
    }
  },
  "kpis": {
    "primary": [
      {"metric": "Customer Acquisition Cost (CAC)", "target": "Target value", "frequency": "How often measured"},
      {"metric": "Customer Lifetime Value (LTV)", "target": "Target value", "frequency": "How often measured"},
      {"metric": "Marketing ROI", "target": "Target value", "frequency": "How often measured"}
    ],
    "secondary": [
      {"metric": "Website Traffic", "target": "Target", "frequency": "Monthly"},
      {"metric": "Conversion Rate", "target": "Target", "frequency": "Monthly"},
      {"metric": "Email Open Rate", "target": "Target", "frequency": "Monthly"}
    ]
  },
  "risksMitigation": [
    {"risk": "Potential risk 1", "impact": "High/Medium/Low", "mitigation": "How to address it"},
    {"risk": "Potential risk 2", "impact": "High/Medium/Low", "mitigation": "How to address it"}
  ],
  "nextSteps": [
    {"action": "Immediate action 1", "deadline": "This week", "owner": "Who"},
    {"action": "Immediate action 2", "deadline": "This month", "owner": "Who"},
    {"action": "Immediate action 3", "deadline": "This quarter", "owner": "Who"}
  ]
}`
    } else if (framework === '7ps') {
      prompt = `Create a detailed Marketing Mix (7 Ps) analysis for:

**BUSINESS:** ${businessName}
**DESCRIPTION:** ${businessDescription}
**INDUSTRY:** ${industryInfo}
**TARGET AUDIENCE:** ${targetAudience || 'General market'}
**UNIQUE VALUE:** ${uniqueValue || 'To be defined'}
${languageInstruction}

Generate a comprehensive 7 Ps analysis in JSON format:
{
  "framework": "Marketing Mix (7 Ps)",
  "businessContext": "Brief context of the business",
  "product": {
    "coreProduct": "The fundamental need being met",
    "actualProduct": "Features, quality, design, branding",
    "augmentedProduct": "Additional services, warranties, support",
    "productLineStrategy": "Product mix recommendations",
    "recommendations": ["Recommendation 1", "Recommendation 2", "Recommendation 3"]
  },
  "price": {
    "pricingObjective": "Profit maximization/Market penetration/etc.",
    "pricingStrategy": "Premium/Value/Competitive/etc.",
    "pricingTactics": ["Tactic 1", "Tactic 2"],
    "pricePositioning": "Where you sit in the market",
    "recommendations": ["Recommendation 1", "Recommendation 2"]
  },
  "place": {
    "distributionStrategy": "Direct/Indirect/Hybrid",
    "channels": ["Channel 1", "Channel 2"],
    "geographicStrategy": "Market coverage approach",
    "digitalPresence": "Online distribution strategy",
    "recommendations": ["Recommendation 1", "Recommendation 2"]
  },
  "promotion": {
    "advertisingStrategy": "Paid media approach",
    "contentMarketing": "Content strategy",
    "socialMedia": "Social media approach",
    "publicRelations": "PR strategy",
    "salesPromotion": "Promotional tactics",
    "recommendations": ["Recommendation 1", "Recommendation 2"]
  },
  "people": {
    "customerFacingTeam": "Front-line staff strategy",
    "brandAmbassadors": "Employee advocacy",
    "customerService": "Service excellence approach",
    "training": "Development needs",
    "recommendations": ["Recommendation 1", "Recommendation 2"]
  },
  "process": {
    "customerJourney": "Key touchpoint optimization",
    "serviceDelivery": "How service is delivered",
    "automation": "Automation opportunities",
    "qualityControl": "Quality assurance approach",
    "recommendations": ["Recommendation 1", "Recommendation 2"]
  },
  "physicalEvidence": {
    "brandIdentity": "Visual and verbal identity",
    "environment": "Physical/digital environment",
    "socialProof": "Testimonials, reviews, case studies",
    "credentials": "Trust signals and certifications",
    "recommendations": ["Recommendation 1", "Recommendation 2"]
  },
  "actionPlan": [
    {"p": "Product", "action": "Specific action", "priority": "High/Medium/Low", "timeline": "When"},
    {"p": "Price", "action": "Specific action", "priority": "High/Medium/Low", "timeline": "When"},
    {"p": "Place", "action": "Specific action", "priority": "High/Medium/Low", "timeline": "When"},
    {"p": "Promotion", "action": "Specific action", "priority": "High/Medium/Low", "timeline": "When"},
    {"p": "People", "action": "Specific action", "priority": "High/Medium/Low", "timeline": "When"},
    {"p": "Process", "action": "Specific action", "priority": "High/Medium/Low", "timeline": "When"},
    {"p": "Physical Evidence", "action": "Specific action", "priority": "High/Medium/Low", "timeline": "When"}
  ]
}`
    } else if (framework === 'stp') {
      prompt = `Create a comprehensive STP (Segmentation, Targeting, Positioning) analysis for:

**BUSINESS:** ${businessName}
**DESCRIPTION:** ${businessDescription}
**INDUSTRY:** ${industryInfo}
**CURRENT AUDIENCE:** ${targetAudience || 'To be defined'}
**COMPETITORS:** ${competitors || 'Not specified'}
${languageInstruction}

Generate STP analysis in JSON format:
{
  "framework": "STP Model",
  "segmentation": {
    "demographic": [
      {"segment": "Segment name", "characteristics": "Age, income, education, etc.", "size": "Estimated size", "potential": "High/Medium/Low"}
    ],
    "geographic": [
      {"segment": "Geographic segment", "characteristics": "Location details", "size": "Size", "potential": "Potential"}
    ],
    "psychographic": [
      {"segment": "Lifestyle/values segment", "characteristics": "Values, interests, lifestyle", "size": "Size", "potential": "Potential"}
    ],
    "behavioral": [
      {"segment": "Behavioral segment", "characteristics": "Usage, benefits sought, loyalty", "size": "Size", "potential": "Potential"}
    ]
  },
  "targeting": {
    "strategy": "Undifferentiated/Differentiated/Concentrated/Micromarketing",
    "primarySegment": {
      "name": "Primary target segment",
      "why": "Reasons for selection",
      "size": "Market size",
      "growthPotential": "Growth rate",
      "accessibility": "How to reach them",
      "profitability": "Revenue potential"
    },
    "secondarySegment": {
      "name": "Secondary target segment",
      "why": "Reasons for selection",
      "approach": "How to target differently"
    },
    "segmentsToAvoid": ["Segment to avoid 1", "Segment to avoid 2"]
  },
  "positioning": {
    "positioningStatement": "For [target] who [need], [brand] is the [category] that [benefit] because [reason].",
    "competitiveFrame": "Category/competitive set",
    "pointsOfDifference": ["POD 1", "POD 2", "POD 3"],
    "pointsOfParity": ["POP 1", "POP 2"],
    "positioningMap": {
      "xAxis": "Attribute 1 (e.g., Price)",
      "yAxis": "Attribute 2 (e.g., Quality)",
      "yourPosition": "Where you are",
      "competitorPositions": ["Competitor A position", "Competitor B position"]
    },
    "brandEssence": "One-word or phrase brand essence",
    "brandPersonality": ["Trait 1", "Trait 2", "Trait 3"],
    "valueProposition": "Clear value proposition"
  },
  "implementation": [
    {"phase": "Phase 1", "action": "Action", "timeline": "When", "kpi": "Success metric"}
  ]
}`
    } else if (framework === 'ansoff') {
      prompt = `Create an Ansoff Growth Matrix strategy for:

**BUSINESS:** ${businessName}
**DESCRIPTION:** ${businessDescription}
**INDUSTRY:** ${industryInfo}
**STAGE:** ${stageInfo}
**GOALS:** ${goals || 'Growth and expansion'}
${languageInstruction}

Generate Ansoff Matrix analysis in JSON format:
{
  "framework": "Ansoff Growth Matrix",
  "currentState": {
    "products": "Current product/service portfolio",
    "markets": "Current markets served",
    "revenue": "Current revenue model"
  },
  "marketPenetration": {
    "description": "Selling more of existing products to existing customers",
    "strategies": [
      {"strategy": "Strategy name", "tactics": ["Tactic 1", "Tactic 2"], "expectedGrowth": "X%", "risk": "Low", "investment": "Investment needed"}
    ],
    "quickWins": ["Quick win 1", "Quick win 2"],
    "kpis": ["KPI 1", "KPI 2"]
  },
  "marketDevelopment": {
    "description": "Selling existing products to new markets",
    "newMarkets": [
      {"market": "New market", "opportunity": "Why this market", "entryStrategy": "How to enter", "risk": "Medium", "timeline": "When"}
    ],
    "geographicExpansion": "Geographic opportunities",
    "newSegments": "New customer segments",
    "kpis": ["KPI 1", "KPI 2"]
  },
  "productDevelopment": {
    "description": "Creating new products for existing markets",
    "opportunities": [
      {"product": "New product idea", "targetNeed": "Need it addresses", "differentiation": "How it's different", "development": "Development approach", "timeline": "Launch timeline"}
    ],
    "innovationAreas": ["Area 1", "Area 2"],
    "kpis": ["KPI 1", "KPI 2"]
  },
  "diversification": {
    "description": "New products for new markets (highest risk)",
    "related": {
      "opportunities": ["Related diversification opportunity 1"],
      "synergies": "How it leverages existing capabilities"
    },
    "unrelated": {
      "opportunities": ["Unrelated diversification if applicable"],
      "rationale": "Why consider this"
    },
    "recommendation": "Whether to pursue and why",
    "kpis": ["KPI 1", "KPI 2"]
  },
  "recommendedPath": {
    "primaryStrategy": "Which quadrant to focus on",
    "rationale": "Why this strategy",
    "sequencing": ["Step 1", "Step 2", "Step 3"],
    "resourceAllocation": {
      "marketPenetration": "X%",
      "marketDevelopment": "X%",
      "productDevelopment": "X%",
      "diversification": "X%"
    }
  },
  "riskAssessment": [
    {"strategy": "Strategy", "risk": "Risk level", "mitigation": "How to mitigate"}
  ],
  "timeline": {
    "shortTerm": {"focus": "0-6 months focus", "goals": ["Goal 1"]},
    "mediumTerm": {"focus": "6-18 months focus", "goals": ["Goal 1"]},
    "longTerm": {"focus": "18+ months focus", "goals": ["Goal 1"]}
  }
}`
    } else if (framework === 'funnel') {
      prompt = `Create a Full-Funnel Marketing Strategy for:

**BUSINESS:** ${businessName}
**DESCRIPTION:** ${businessDescription}
**INDUSTRY:** ${industryInfo}
**TARGET AUDIENCE:** ${targetAudience || 'To be defined'}
**BUDGET:** ${budgetInfo}
**EXISTING CHANNELS:** ${existingChannels || 'Not specified'}
${languageInstruction}

Generate Full-Funnel strategy in JSON format:
{
  "framework": "Full-Funnel Marketing",
  "funnelOverview": {
    "totalAddressableMarket": "Estimated TAM",
    "currentFunnelHealth": "Assessment of current state",
    "biggestLeaks": ["Where leads are lost 1", "Where leads are lost 2"]
  },
  "awareness": {
    "stage": "Top of Funnel (TOFU)",
    "goal": "Primary awareness goal",
    "audienceSize": "Target reach",
    "channels": [
      {"channel": "Channel name", "tactic": "Specific tactic", "budget": "Budget allocation", "kpi": "Success metric", "expectedReach": "Reach estimate"}
    ],
    "content": {
      "types": ["Content type 1", "Content type 2"],
      "themes": ["Theme 1", "Theme 2"],
      "frequency": "Publishing frequency"
    },
    "metrics": {
      "primary": ["Impressions", "Reach", "Brand awareness"],
      "targets": {"impressions": "Target", "reach": "Target"}
    }
  },
  "consideration": {
    "stage": "Middle of Funnel (MOFU)",
    "goal": "Primary consideration goal",
    "channels": [
      {"channel": "Channel name", "tactic": "Specific tactic", "budget": "Budget", "kpi": "KPI"}
    ],
    "content": {
      "types": ["Content type 1", "Content type 2"],
      "leadMagnets": ["Lead magnet 1", "Lead magnet 2"],
      "nurturing": "Email/nurture sequence approach"
    },
    "metrics": {
      "primary": ["Leads", "Engagement rate", "Email subscribers"],
      "targets": {"leads": "Target", "engagementRate": "Target"}
    }
  },
  "decision": {
    "stage": "Bottom of Funnel (BOFU)",
    "goal": "Primary conversion goal",
    "channels": [
      {"channel": "Channel name", "tactic": "Specific tactic", "budget": "Budget", "kpi": "KPI"}
    ],
    "content": {
      "types": ["Content type 1", "Content type 2"],
      "socialProof": ["Case studies", "Testimonials", "Reviews"],
      "offers": "Conversion offers"
    },
    "salesEnablement": "Sales support materials",
    "metrics": {
      "primary": ["Conversions", "Revenue", "CAC"],
      "targets": {"conversions": "Target", "revenue": "Target", "cac": "Target"}
    }
  },
  "retention": {
    "stage": "Post-Purchase",
    "goal": "Retention and LTV goal",
    "tactics": [
      {"tactic": "Retention tactic", "description": "How it works", "expectedImpact": "Expected result"}
    ],
    "loyaltyProgram": "Loyalty approach",
    "upsellCrossSell": "Expansion revenue strategy",
    "metrics": {
      "primary": ["Retention rate", "LTV", "NPS"],
      "targets": {"retentionRate": "Target", "ltv": "Target"}
    }
  },
  "advocacy": {
    "stage": "Advocacy & Referral",
    "goal": "Turn customers into advocates",
    "tactics": [
      {"tactic": "Advocacy tactic", "description": "How it works", "expectedImpact": "Expected result"}
    ],
    "referralProgram": "Referral program design",
    "ugc": "User-generated content strategy",
    "metrics": {
      "primary": ["Referrals", "Reviews", "Social mentions"],
      "targets": {"referrals": "Target", "reviews": "Target"}
    }
  },
  "budgetAllocation": {
    "awareness": {"percentage": 30, "rationale": "Why"},
    "consideration": {"percentage": 25, "rationale": "Why"},
    "decision": {"percentage": 30, "rationale": "Why"},
    "retention": {"percentage": 15, "rationale": "Why"}
  },
  "techStack": [
    {"tool": "Tool name", "purpose": "What it does", "funnelStage": "Which stage"}
  ],
  "optimizationPlan": {
    "testing": ["A/B test idea 1", "A/B test idea 2"],
    "reviewCadence": "How often to review",
    "optimizationPriorities": ["Priority 1", "Priority 2"]
  }
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
        error: false,
        rawContent: llmResponse,
        framework: frameworkInfo.name
      }
    }

    return NextResponse.json({
      success: true,
      data: result,
      metadata: {
        framework: frameworkInfo.name,
        frameworkDescription: frameworkInfo.description,
        businessName,
        industry: industryInfo,
        businessStage: stageInfo,
        budget: budgetInfo,
        generatedAt: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('Marketing Strategy Generator Error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to generate marketing strategy' },
      { status: 500 }
    )
  }
}
