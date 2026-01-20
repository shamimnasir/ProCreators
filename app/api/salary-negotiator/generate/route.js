import { NextResponse } from 'next/server'
import { spawn } from 'child_process'
import path from 'path'
import fs from 'fs/promises'
import { v4 as uuidv4 } from 'uuid'

// Helper to run LLM using Python script
async function runLLM(prompt, systemPrompt = 'You are a salary negotiation expert.') {
  return new Promise(async (resolve, reject) => {
    try {
      const scriptPath = path.join(process.cwd(), 'scripts', 'llm_call.py')
      
      const inputData = JSON.stringify({
        prompt,
        system_prompt: systemPrompt
      })
      
      const tempDir = path.join(process.cwd(), 'tmp')
      await fs.mkdir(tempDir, { recursive: true })
      const tempFile = path.join(tempDir, `llm-input-${uuidv4()}.json`)
      await fs.writeFile(tempFile, inputData, 'utf-8')
      
      const pythonProcess = spawn('/root/.venv/bin/python3', [scriptPath, '--file', tempFile], {
        env: { ...process.env }
      })

      let stdout = ''
      let stderr = ''

      pythonProcess.stdout.on('data', (data) => {
        stdout += data.toString()
      })

      pythonProcess.stderr.on('data', (data) => {
        stderr += data.toString()
      })

      pythonProcess.on('close', async (code) => {
        try {
          await fs.unlink(tempFile)
        } catch (e) {
          // Ignore cleanup errors
        }
        
        if (code !== 0) {
          console.error('LLM stderr:', stderr)
          reject(new Error(`LLM process failed: ${stderr}`))
        } else {
          try {
            const result = JSON.parse(stdout)
            if (result.success) {
              resolve(result.content)
            } else {
              reject(new Error(result.error || 'LLM call failed'))
            }
          } catch {
            resolve(stdout.trim())
          }
        }
      })
    } catch (error) {
      reject(error)
    }
  })
}

export async function POST(request) {
  try {
    const body = await request.json()
    const {
      negotiationType,
      jobTitle,
      companyName,
      industry,
      experienceLevel,
      yearsExperience,
      location,
      currentSalary,
      offeredSalary,
      targetSalary,
      marketRate,
      hasCompetingOffer,
      competingOfferAmount,
      competingCompany,
      selectedBenefits,
      keyAchievements,
      uniqueValue,
      concerns,
      negotiatorStyle
    } = body

    if (!jobTitle) {
      return NextResponse.json({
        success: false,
        error: 'Please provide the job title'
      }, { status: 400 })
    }

    // Build context
    let context = `## Negotiation Scenario:\n`
    context += `Type: ${negotiationType || 'initial-offer'}\n`
    context += `Job Title: ${jobTitle}\n`
    if (companyName) context += `Company: ${companyName}\n`
    if (industry) context += `Industry: ${industry}\n`
    if (location) context += `Location: ${location}\n`
    if (experienceLevel) context += `Experience Level: ${experienceLevel}\n`
    if (yearsExperience) context += `Years of Experience: ${yearsExperience}\n`
    
    context += `\n## Salary Information:\n`
    if (currentSalary) context += `Current Salary: $${parseInt(currentSalary).toLocaleString()}\n`
    if (offeredSalary) context += `Offered Salary: $${parseInt(offeredSalary).toLocaleString()}\n`
    if (targetSalary) context += `Target Salary: $${parseInt(targetSalary).toLocaleString()}\n`
    if (marketRate) context += `Market Rate: ${marketRate}\n`
    
    if (hasCompetingOffer) {
      context += `\n## Competing Offer:\n`
      if (competingOfferAmount) context += `Amount: $${parseInt(competingOfferAmount).toLocaleString()}\n`
      if (competingCompany) context += `Company: ${competingCompany}\n`
    }
    
    if (keyAchievements) {
      context += `\n## Key Achievements:\n${keyAchievements}\n`
    }
    
    if (uniqueValue) {
      context += `\n## Unique Value Proposition:\n${uniqueValue}\n`
    }
    
    if (selectedBenefits && selectedBenefits.length > 0) {
      context += `\n## Benefits to Negotiate:\n${selectedBenefits.join(', ')}\n`
    }
    
    if (concerns) {
      context += `\n## Concerns/Constraints:\n${concerns}\n`
    }
    
    context += `\n## Negotiation Style Preference: ${negotiatorStyle || 'collaborative'}\n`

    const systemPrompt = `You are a world-class salary negotiation coach who has helped thousands of professionals increase their compensation by an average of 15-20%. You combine psychological insights with practical, research-backed strategies.

## YOUR EXPERTISE:
- Deep understanding of compensation psychology
- Expertise in various industries' salary norms
- Knowledge of negotiation tactics from Harvard Business School
- Experience with both corporate and startup compensation packages

## NEGOTIATION BEST PRACTICES YOU INCORPORATE:

### Research-Backed Principles:
1. **Anchoring Effect**: The first number mentioned heavily influences the final outcome
2. **Specific Numbers**: Asking for $103,500 appears more researched than $100,000
3. **BATNA (Best Alternative to Negotiated Agreement)**: Always know your alternatives
4. **Silence is Powerful**: After stating your number, wait for them to respond
5. **Focus on Value, Not Need**: Emphasize what you bring, not what you need
6. **Never Accept the First Offer**: There's almost always room to negotiate
7. **Get It In Writing**: Verbal agreements should be documented

### Timing Tactics:
- Best time to negotiate: After offer, before acceptance
- Ask for time to consider (24-48 hours is reasonable)
- Friday afternoon offers often leave room for Monday negotiations

### Psychological Techniques:
- Mirror their language and energy
- Use "we" to create partnership feeling
- Express enthusiasm for the role while negotiating
- Never apologize for negotiating
- Practice your scripts out loud

## OUTPUT FORMAT:
Return a JSON object with this structure:
{
  "overview": {
    "recommendedRange": "$XX,XXX - $XX,XXX",
    "walkAwayNumber": "$XX,XXX",
    "anchorNumber": "$XX,XXX",
    "strategyStatement": "1-2 sentence overall strategy"
  },
  "scripts": {
    "opening": "Word-for-word script for opening the negotiation",
    "askingForMore": "Script for asking for higher compensation",
    "valueProposition": "Script highlighting your value",
    "closingTheNegotiation": "Script for closing successfully"
  },
  "emailTemplates": {
    "counterOffer": "Full email template for counter-offering in writing",
    "followUp": "Email template for following up",
    "acceptance": "Email template for accepting the negotiated offer"
  },
  "objectionHandling": [
    {
      "objection": "Common objection they might say",
      "response": "Your response script",
      "followUp": "What to say/do next"
    }
  ],
  "tactics": [
    {
      "name": "Tactic name",
      "icon": "emoji icon",
      "description": "How to use this tactic",
      "example": "Example phrase to use"
    }
  ],
  "benefitsNegotiation": [
    {
      "benefit": "Benefit name",
      "icon": "emoji",
      "script": "How to ask for this benefit",
      "estimatedValue": "$X,XXX/year"
    }
  ],
  "dosAndDonts": {
    "dos": ["List of things to do"],
    "donts": ["List of things to avoid"]
  }
}

IMPORTANT: 
- Return ONLY valid JSON, no markdown code blocks
- Make scripts conversational and natural, not robotic
- Include specific dollar amounts based on the provided information
- Tailor advice to the specific negotiation type and industry
- Include at least 5 common objections with responses
- Include at least 4 negotiation tactics
- If competing offer exists, leverage it strategically
- Match the negotiation style preference (collaborative/assertive/analytical)`

    const userPrompt = `Create a comprehensive salary negotiation strategy based on this situation:

${context}

## Requirements:
1. Calculate realistic recommended numbers based on provided data
2. Create natural, conversational scripts that don't sound rehearsed
3. Include industry-specific advice for ${industry || 'the industry'}
4. Prepare for at least 5 common objections
5. Provide both verbal scripts and email templates
6. Include tactics suited to ${negotiatorStyle || 'collaborative'} style
7. If competing offer exists, include scripts that leverage it professionally
8. Include specific benefit negotiation scripts for: ${selectedBenefits?.join(', ') || 'signing bonus, extra PTO, remote work'}

Generate the complete negotiation toolkit. Return ONLY the JSON object - no markdown formatting.`

    const response = await runLLM(userPrompt, systemPrompt)
    
    // Parse the JSON response
    let negotiationData
    try {
      let cleanResponse = response
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim()
      
      negotiationData = JSON.parse(cleanResponse)
    } catch (parseError) {
      console.error('Failed to parse negotiation JSON:', parseError)
      const jsonMatch = response.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        negotiationData = JSON.parse(jsonMatch[0])
      } else {
        throw new Error('Failed to generate structured negotiation data')
      }
    }

    return NextResponse.json({
      success: true,
      data: negotiationData,
      metadata: {
        negotiationType,
        jobTitle,
        companyName,
        targetSalary
      }
    })

  } catch (error) {
    console.error('Salary negotiation generation error:', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to generate negotiation strategy'
    }, { status: 500 })
  }
}
