import { NextResponse } from 'next/server'
import { spawn } from 'child_process'
import path from 'path'
import fs from 'fs/promises'
import { v4 as uuidv4 } from 'uuid'

// Helper to run LLM using Python script
async function runLLM(prompt, systemPrompt = 'You are an expert job matching analyst.') {
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
      resumeText,
      jobDescription,
      jobTitle,
      companyName
    } = body

    // Validate required fields
    if (!resumeText || !jobDescription) {
      return NextResponse.json({ 
        success: false, 
        error: 'Please provide both your resume and the job description' 
      }, { status: 400 })
    }

    const systemPrompt = `You are an expert ATS (Applicant Tracking System) analyst and career coach with deep knowledge of hiring practices.

Your task is to analyze a candidate's resume against a job description and provide:
1. An overall match score (0-100%)
2. Matching skills and keywords found
3. Missing skills and keywords that should be added
4. Specific, actionable recommendations to improve the resume
5. ATS optimization tips

OUTPUT FORMAT - Return ONLY valid JSON with this exact structure:
{
  "matchScore": 75,
  "matchLevel": "Good Match",
  "summary": "Brief 2-3 sentence summary of the analysis",
  "matchingKeywords": [
    {
      "keyword": "Python",
      "category": "Technical Skill",
      "importance": "Required",
      "foundIn": "Resume mentions 5 years Python experience"
    }
  ],
  "missingKeywords": [
    {
      "keyword": "AWS",
      "category": "Technical Skill", 
      "importance": "Required",
      "suggestion": "Add AWS experience if you have it, or consider getting AWS certification"
    }
  ],
  "skillsAnalysis": {
    "technical": {
      "matched": ["Python", "JavaScript"],
      "missing": ["AWS", "Docker"],
      "score": 70
    },
    "soft": {
      "matched": ["Leadership", "Communication"],
      "missing": ["Agile methodology"],
      "score": 80
    },
    "experience": {
      "matched": ["5+ years software development"],
      "missing": ["Team lead experience"],
      "score": 65
    },
    "education": {
      "matched": ["Bachelor's degree"],
      "missing": [],
      "score": 100
    }
  },
  "recommendations": [
    {
      "priority": "High",
      "area": "Technical Skills",
      "issue": "Missing cloud experience",
      "action": "Add any AWS, GCP, or Azure experience you have. If none, consider getting a certification.",
      "impact": "Could increase match by 10-15%"
    }
  ],
  "atsOptimization": {
    "score": 70,
    "issues": [
      {
        "issue": "Missing exact keyword match for 'Machine Learning'",
        "fix": "Add 'Machine Learning' to your skills section"
      }
    ],
    "tips": [
      "Use the exact job title in your resume header",
      "Mirror the language used in the job description"
    ]
  },
  "competitiveAnalysis": {
    "strongPoints": ["5+ years experience", "Strong Python background"],
    "weakPoints": ["No cloud experience", "Missing leadership examples"],
    "standoutOpportunities": ["Add quantified achievements", "Highlight any AWS projects"]
  }
}

IMPORTANT:
- Be specific and actionable in recommendations
- Score honestly - don't inflate scores
- Focus on what's actually missing vs what's there
- Consider both hard requirements and nice-to-haves
- Return ONLY the JSON, no markdown code blocks`

    const userPrompt = `Analyze this resume against the job description:

## JOB DETAILS
${jobTitle ? `Job Title: ${jobTitle}` : ''}
${companyName ? `Company: ${companyName}` : ''}

## JOB DESCRIPTION:
${jobDescription}

## CANDIDATE'S RESUME:
${resumeText}

Provide a thorough analysis with:
1. Overall match score (be realistic)
2. All matching keywords/skills found
3. All missing keywords/skills
4. Specific recommendations to improve the match
5. ATS optimization suggestions

Return ONLY the JSON object - no markdown formatting.`

    // Generate the analysis
    const response = await runLLM(userPrompt, systemPrompt)
    
    // Parse the JSON response
    let analysisData
    try {
      let cleanResponse = response
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim()
      
      analysisData = JSON.parse(cleanResponse)
    } catch (parseError) {
      console.error('Failed to parse analysis JSON:', parseError)
      const jsonMatch = response.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        analysisData = JSON.parse(jsonMatch[0])
      } else {
        throw new Error('Failed to generate analysis data')
      }
    }

    // Ensure all required fields exist
    if (!analysisData.matchScore) analysisData.matchScore = 50
    if (!analysisData.matchLevel) {
      if (analysisData.matchScore >= 80) analysisData.matchLevel = 'Excellent Match'
      else if (analysisData.matchScore >= 60) analysisData.matchLevel = 'Good Match'
      else if (analysisData.matchScore >= 40) analysisData.matchLevel = 'Moderate Match'
      else analysisData.matchLevel = 'Needs Improvement'
    }

    return NextResponse.json({
      success: true,
      data: analysisData,
      metadata: {
        jobTitle: jobTitle || 'Not specified',
        companyName: companyName || 'Not specified',
        analyzedAt: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('Job analysis error:', error)
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Failed to analyze job match' 
    }, { status: 500 })
  }
}
