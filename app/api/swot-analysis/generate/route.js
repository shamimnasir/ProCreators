import { NextResponse } from 'next/server'
import { spawn } from 'child_process'
import path from 'path'
import { enforceRateLimit } from '@/lib/rate-limiter'

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
  nonprofit: 'Non-Profit / NGO',
  consulting: 'Consulting',
  hospitality: 'Hospitality / Tourism',
  other: 'Other'
}

// Analysis Types
const ANALYSIS_TYPES = {
  business: 'Business / Company',
  product: 'Product / Service',
  project: 'Project / Initiative',
  personal: 'Personal / Career',
  competitor: 'Competitor Analysis',
  market: 'Market Entry'
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
      // Subject Info
      subjectName,
      subjectDescription,
      analysisType,
      industry,
      
      // Context
      objectives,
      targetMarket,
      competitors,
      currentSituation,
      
      // Optional inputs for guidance
      knownStrengths,
      knownWeaknesses,
      potentialOpportunities,
      potentialThreats,
      
      // Analysis depth
      analysisDepth = 'comprehensive'
    } = body

    if (!subjectName) {
      return NextResponse.json(
        { success: false, error: 'Subject name is required' },
        { status: 400 }
      )
    }

    // Language detection
    const allText = `${subjectName} ${subjectDescription || ''} ${objectives || ''} ${currentSituation || ''}`
    const bengaliPattern = /[\u0980-\u09FF]/
    const hindiPattern = /[\u0900-\u097F]/
    
    let detectedLanguage = 'English'
    let languageInstruction = ''
    
    if (bengaliPattern.test(allText)) {
      detectedLanguage = 'Bengali (বাংলা)'
      languageInstruction = `\n**CRITICAL: Generate ALL SWOT analysis content in Bengali (বাংলা). Do not use English.**\n`
    } else if (hindiPattern.test(allText)) {
      detectedLanguage = 'Hindi (हिंदी)'
      languageInstruction = `\n**CRITICAL: Generate ALL SWOT analysis content in Hindi (हिंदी). Do not use English.**\n`
    }

    const industryInfo = INDUSTRIES[industry] || industry || 'Not specified'
    const analysisTypeInfo = ANALYSIS_TYPES[analysisType] || analysisType || 'Business'

    const systemPrompt = `You are a strategic business consultant with 20+ years of experience in corporate strategy, market analysis, and competitive intelligence. You have advised Fortune 500 companies, startups, and government organizations on strategic planning.

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
- disrupt, disruptive (unless specifically accurate)
- holistic, best-in-class, world-class
- state-of-the-art, next-generation

**SWOT ANALYSIS PRINCIPLES:**
1. **Strengths** - Internal positive attributes you control. Be specific and quantifiable where possible.
2. **Weaknesses** - Internal negative factors. Be honest and actionable.
3. **Opportunities** - External factors you can exploit. Consider market trends, technology, regulations.
4. **Threats** - External factors that could cause problems. Consider competition, market shifts, risks.

**ANALYSIS GUIDELINES:**
- Each point should be specific, not generic
- Include evidence or reasoning for each point
- Prioritize by impact (High/Medium/Low)
- Consider both short-term and long-term factors
- Provide actionable strategic recommendations

Always respond in valid JSON format.`

    const depthInstruction = analysisDepth === 'quick' 
      ? 'Provide 3-4 points for each category with brief explanations.'
      : analysisDepth === 'comprehensive'
      ? 'Provide 5-7 detailed points for each category with thorough analysis and strategic implications.'
      : 'Provide 4-5 points for each category with moderate detail.'

    const prompt = `Perform a comprehensive SWOT analysis for:
${languageInstruction}

**SUBJECT:** ${subjectName}
**TYPE:** ${analysisTypeInfo}
**INDUSTRY:** ${industryInfo}
**DESCRIPTION:** ${subjectDescription || 'Not provided'}

**OBJECTIVES:** ${objectives || 'General strategic assessment'}
**TARGET MARKET:** ${targetMarket || 'Not specified'}
**KEY COMPETITORS:** ${competitors || 'Not specified'}
**CURRENT SITUATION:** ${currentSituation || 'Not specified'}

**USER-PROVIDED CONTEXT (consider these if provided):**
- Known Strengths: ${knownStrengths || 'None provided'}
- Known Weaknesses: ${knownWeaknesses || 'None provided'}
- Potential Opportunities: ${potentialOpportunities || 'None provided'}
- Potential Threats: ${potentialThreats || 'None provided'}

**DEPTH:** ${depthInstruction}

Generate a complete SWOT analysis in this JSON format:
{
  "analysisType": "${analysisTypeInfo}",
  "subjectName": "${subjectName}",
  "industry": "${industryInfo}",
  "generatedDate": "Current date",
  "executiveSummary": "2-3 sentence overview of the strategic position",
  
  "strengths": {
    "title": "Strengths",
    "subtitle": "Internal Positive Factors",
    "items": [
      {
        "point": "Strength title",
        "description": "Detailed explanation of this strength",
        "evidence": "Supporting evidence or reasoning",
        "impact": "High/Medium/Low",
        "strategicImplication": "How to leverage this strength"
      }
    ]
  },
  
  "weaknesses": {
    "title": "Weaknesses", 
    "subtitle": "Internal Negative Factors",
    "items": [
      {
        "point": "Weakness title",
        "description": "Detailed explanation of this weakness",
        "rootCause": "Why this weakness exists",
        "impact": "High/Medium/Low",
        "mitigationStrategy": "How to address or minimize this weakness"
      }
    ]
  },
  
  "opportunities": {
    "title": "Opportunities",
    "subtitle": "External Positive Factors",
    "items": [
      {
        "point": "Opportunity title",
        "description": "Detailed explanation of this opportunity",
        "marketTrend": "Supporting market trend or data",
        "impact": "High/Medium/Low",
        "captureStrategy": "How to capitalize on this opportunity",
        "timeline": "Short-term/Medium-term/Long-term"
      }
    ]
  },
  
  "threats": {
    "title": "Threats",
    "subtitle": "External Negative Factors", 
    "items": [
      {
        "point": "Threat title",
        "description": "Detailed explanation of this threat",
        "likelihood": "High/Medium/Low",
        "impact": "High/Medium/Low",
        "contingencyPlan": "How to mitigate or respond to this threat"
      }
    ]
  },
  
  "strategicRecommendations": {
    "title": "Strategic Recommendations",
    "soStrategies": {
      "title": "SO Strategies (Strengths + Opportunities)",
      "description": "Use strengths to maximize opportunities",
      "strategies": ["Strategy 1", "Strategy 2", "Strategy 3"]
    },
    "woStrategies": {
      "title": "WO Strategies (Weaknesses + Opportunities)",
      "description": "Overcome weaknesses by pursuing opportunities",
      "strategies": ["Strategy 1", "Strategy 2", "Strategy 3"]
    },
    "stStrategies": {
      "title": "ST Strategies (Strengths + Threats)",
      "description": "Use strengths to avoid threats",
      "strategies": ["Strategy 1", "Strategy 2", "Strategy 3"]
    },
    "wtStrategies": {
      "title": "WT Strategies (Weaknesses + Threats)",
      "description": "Minimize weaknesses and avoid threats",
      "strategies": ["Strategy 1", "Strategy 2", "Strategy 3"]
    }
  },
  
  "priorityActions": [
    {
      "action": "Top priority action",
      "category": "Strength/Weakness/Opportunity/Threat",
      "urgency": "Immediate/Short-term/Medium-term",
      "resources": "What's needed to execute"
    }
  ],
  
  "keyInsights": [
    "Key insight about the analysis 1",
    "Key insight about the analysis 2",
    "Key insight about the analysis 3"
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
        analysisType: analysisTypeInfo,
        subjectName,
        generatedDate: new Date().toISOString(),
        error: 'Failed to generate complete analysis. Please try again.',
        rawContent: llmResponse
      }
    }

    return NextResponse.json({
      success: true,
      data: result,
      metadata: {
        analysisType: analysisTypeInfo,
        subjectName,
        industry: industryInfo,
        detectedLanguage,
        analysisDepth,
        generatedAt: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('SWOT Analysis Generator Error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to generate SWOT analysis' },
      { status: 500 }
    )
  }
}
