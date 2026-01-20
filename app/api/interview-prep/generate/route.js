import { NextResponse } from 'next/server'
import { spawn } from 'child_process'
import path from 'path'
import fs from 'fs/promises'
import { v4 as uuidv4 } from 'uuid'

// Helper to run LLM using Python script
async function runLLM(prompt, systemPrompt) {
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

      pythonProcess.stdout.on('data', (data) => { stdout += data.toString() })
      pythonProcess.stderr.on('data', (data) => { stderr += data.toString() })

      pythonProcess.on('close', async (code) => {
        try { await fs.unlink(tempFile) } catch (e) { /* ignore */ }
        
        if (code !== 0) {
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
      jobTitle,
      companyName,
      jobDescription,
      experienceLevel,
      interviewType,
      focusAreas,
      questionCount = 10
    } = body

    if (!jobTitle) {
      return NextResponse.json({ 
        success: false, 
        error: 'Please provide the job title you are interviewing for' 
      }, { status: 400 })
    }

    const systemPrompt = `You are an expert interview coach with 20+ years of experience preparing candidates for job interviews at top companies like Google, Amazon, Microsoft, and Fortune 500 companies.

Your task is to generate realistic, role-specific interview questions that the candidate is likely to face.

## QUESTION CATEGORIES:

### 1. Opening Questions (Warm-up)
- Tell me about yourself
- Why this company/role
- Strengths and weaknesses
- Career goals

### 2. Behavioral Questions (STAR Method)
Questions about past experiences using Situation, Task, Action, Result format:
- Handling challenges
- Leadership examples
- Teamwork and collaboration
- Failure and learning
- Conflict resolution

### 3. Situational Questions (Hypothetical)
"What would you do if..." scenarios:
- Problem-solving
- Decision making
- Prioritization
- Handling pressure

### 4. Role-Specific/Technical Questions
Questions specific to the job function and industry

### 5. Culture Fit Questions
Values alignment, work style, motivation

## OUTPUT FORMAT - Return ONLY valid JSON:
{
  "questions": [
    {
      "id": 1,
      "category": "Opening",
      "question": "The interview question",
      "difficulty": "Easy|Medium|Hard",
      "timeLimit": 2,
      "tips": "Brief tip for answering this question",
      "sampleAnswer": {
        "structure": "How to structure the answer",
        "keyPoints": ["Point 1", "Point 2", "Point 3"],
        "exampleOpening": "A good way to start this answer..."
      },
      "starPrompt": {
        "situation": "What situation/context to describe",
        "task": "What was your responsibility",
        "action": "What specific actions did you take",
        "result": "What outcomes did you achieve"
      }
    }
  ],
  "questionsToAsk": [
    {
      "question": "Question to ask the interviewer",
      "purpose": "Why this question is valuable",
      "category": "Role|Team|Company|Growth"
    }
  ],
  "prepTips": [
    {
      "category": "Research|Practice|Mindset|Logistics",
      "tip": "Preparation tip",
      "priority": "High|Medium|Low"
    }
  ],
  "interviewInfo": {
    "estimatedDuration": "45-60 minutes",
    "format": "Behavioral + Technical",
    "keyThemes": ["Theme 1", "Theme 2"]
  }
}

IMPORTANT:
- Generate questions that are actually asked in real interviews for this role
- Include a mix of difficulties
- Make tips actionable and specific
- STAR prompts should guide the candidate on what to include
- Return ONLY valid JSON, no markdown`

    const userPrompt = `Generate ${questionCount} interview questions for this role:

## JOB DETAILS
Job Title: ${jobTitle}
${companyName ? `Company: ${companyName}` : ''}
Experience Level: ${experienceLevel || 'Mid-level'}
Interview Type: ${interviewType || 'General'}

${jobDescription ? `## JOB DESCRIPTION:\n${jobDescription}` : ''}

${focusAreas ? `## FOCUS AREAS:\n${focusAreas}` : ''}

Generate a comprehensive set of interview questions covering:
1. 2-3 Opening/Warm-up questions
2. 3-4 Behavioral questions (with STAR guidance)
3. 2-3 Situational questions
4. 2-3 Role-specific questions
5. Also include 4-5 great questions the candidate should ask the interviewer
6. Include 5 key preparation tips

Make questions realistic and challenging but fair.
Return ONLY the JSON object.`

    const response = await runLLM(userPrompt, systemPrompt)
    
    let interviewData
    try {
      let cleanResponse = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      interviewData = JSON.parse(cleanResponse)
    } catch (parseError) {
      const jsonMatch = response.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        interviewData = JSON.parse(jsonMatch[0])
      } else {
        throw new Error('Failed to generate interview questions')
      }
    }

    return NextResponse.json({
      success: true,
      data: interviewData,
      metadata: {
        jobTitle,
        companyName: companyName || 'Not specified',
        generatedAt: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('Interview question generation error:', error)
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Failed to generate interview questions' 
    }, { status: 500 })
  }
}
