import { NextResponse } from 'next/server'
import { spawn } from 'child_process'
import path from 'path'
import fs from 'fs/promises'
import { v4 as uuidv4 } from 'uuid'

// Helper to run LLM using Python script
async function runLLM(prompt, systemPrompt = 'You are an expert resume writer.') {
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
        } catch (e) {}
        
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
      rawInfo,
      targetJob, 
      industry, 
      template,
      personalInfo,
      experiences,
      education,
      skills
    } = body

    if (!rawInfo && !personalInfo?.name) {
      return NextResponse.json({ 
        success: false, 
        error: 'Please provide your information - either paste your existing CV or fill in the details' 
      }, { status: 400 })
    }

    // Build comprehensive prompt
    let userContext = ''
    
    if (rawInfo) {
      userContext += `\n## Raw Information (from existing CV or description):\n${rawInfo}\n`
    }
    
    if (personalInfo && personalInfo.name) {
      userContext += `\n## Personal Information:\n`
      userContext += `Name: ${personalInfo.name}\n`
      if (personalInfo.email) userContext += `Email: ${personalInfo.email}\n`
      if (personalInfo.phone) userContext += `Phone: ${personalInfo.phone}\n`
      if (personalInfo.location) userContext += `Location: ${personalInfo.location}\n`
      if (personalInfo.linkedin) userContext += `LinkedIn: ${personalInfo.linkedin}\n`
    }
    
    if (experiences && experiences.length > 0 && experiences[0].title) {
      userContext += `\n## Work Experience:\n`
      experiences.forEach((exp, idx) => {
        if (exp.title) {
          userContext += `${idx + 1}. ${exp.title} at ${exp.company || 'Company'} (${exp.duration || 'Duration'})\n`
          if (exp.description) userContext += `   Description: ${exp.description}\n`
        }
      })
    }
    
    if (education && education.length > 0 && education[0].degree) {
      userContext += `\n## Education:\n`
      education.forEach((edu, idx) => {
        if (edu.degree) {
          userContext += `${idx + 1}. ${edu.degree} from ${edu.school || 'Institution'} (${edu.year || 'Year'})\n`
        }
      })
    }
    
    if (skills) {
      userContext += `\n## Skills:\n${skills}\n`
    }

    const templateStyles = {
      modern: 'Clean, contemporary design with clear sections and modern formatting. Use bullet points, action verbs, and quantifiable achievements.',
      classic: 'Timeless, formal layout with traditional sections. Professional and conservative tone.',
      creative: 'Eye-catching design elements, unique structure. Good for creative industries.',
      minimal: 'Simple, elegant layout with lots of white space. Focus on essential information.',
      tech: 'Technical-focused with prominent skills section, project highlights, and technology stack.',
      executive: 'Senior leadership style with emphasis on strategic achievements, leadership roles, and business impact.'
    }

    const systemPrompt = `You are an expert resume writer and career consultant. Create a professional, ATS-friendly resume based on the provided information.

IMPORTANT GUIDELINES:
1. Create a complete, professional resume in clean markdown format
2. Use bullet points with action verbs and quantifiable achievements
3. Optimize for ATS (Applicant Tracking Systems) with proper keyword density
4. Tailor the content for the target job and industry
5. Include all standard resume sections: Contact Info, Summary, Experience, Education, Skills
6. Make the summary compelling and targeted to the role
7. Transform job descriptions into achievement-focused bullet points
8. Add relevant keywords naturally throughout

TEMPLATE STYLE: ${templateStyles[template] || templateStyles.modern}
TARGET JOB: ${targetJob || 'Not specified'}
INDUSTRY: ${industry || 'General'}

Output the resume in clean, professional markdown format that can be easily converted to PDF.`

    const userPrompt = `Create a professional resume based on this information:
${userContext}

Generate a complete, polished resume that:
1. Highlights the most relevant experience for ${targetJob || 'the target role'}
2. Uses strong action verbs and quantifies achievements where possible
3. Includes a compelling professional summary
4. Optimizes for the ${industry || 'target'} industry
5. Is ATS-friendly with proper formatting

Provide the complete resume in markdown format.`

    // Generate the resume
    const resumeContent = await runLLM(userPrompt, systemPrompt)

    // Generate improvement suggestions
    const suggestionsPrompt = `Analyze this resume and provide 3-5 brief, actionable suggestions for improvement. Be specific and helpful. Format as a simple numbered list.

Resume:
${resumeContent}`

    const suggestions = await runLLM(suggestionsPrompt, 'You are a career coach. Provide brief, actionable resume improvement suggestions.')

    return NextResponse.json({
      success: true,
      resume: resumeContent,
      suggestions,
      metadata: {
        targetJob: targetJob || 'General',
        industry: industry || 'General',
        template
      }
    })

  } catch (error) {
    console.error('Resume generation error:', error)
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Failed to generate resume' 
    }, { status: 500 })
  }
}
