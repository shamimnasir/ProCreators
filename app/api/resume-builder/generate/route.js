import { NextResponse } from 'next/server'
import { spawn } from 'child_process'
import path from 'path'
import fs from 'fs/promises'
import { v4 as uuidv4 } from 'uuid'
import { enforceRateLimit } from '@/lib/rate-limiter'

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

// Try to fetch LinkedIn profile data using web crawl
async function fetchLinkedInData(url) {
  try {
    // Try using the internal crawl API
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
    const response = await fetch(`${baseUrl}/api/crawl`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: url,
        extraction_method: 'scrape',
        formats: 'markdown'
      })
    })
    
    if (response.ok) {
      const data = await response.json()
      if (data.content || data.markdown) {
        return data.content || data.markdown
      }
    }
    return null
  } catch (error) {
    return null
  }
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
      rawInfo,
      targetJob, 
      industry, 
      template,
      personalInfo,
      experiences,
      education,
      skills,
      references
    } = body

    if (!rawInfo && !personalInfo?.name) {
      return NextResponse.json({ 
        success: false, 
        error: 'Please provide your information - paste your CV text, LinkedIn profile content, or fill in your details' 
      }, { status: 400 })
    }

    // Check if rawInfo contains a LinkedIn URL - inform user to paste profile content instead
    let processedInfo = rawInfo || ''
    const linkedInRegex = /https?:\/\/(www\.)?linkedin\.com\/in\/[\w-]+\/?/i
    const linkedInMatch = rawInfo?.match(linkedInRegex)
    
    let linkedInWarning = ''
    if (linkedInMatch && rawInfo?.trim() === linkedInMatch[0]) {
      // User only pasted a LinkedIn URL without any other content
      // Try to fetch the data
      const linkedInData = await fetchLinkedInData(linkedInMatch[0])
      
      if (linkedInData && linkedInData.length > 100) {
        processedInfo = `LinkedIn Profile Data:\n${linkedInData}`
      } else {
        linkedInWarning = 'NOTE: Could not fetch LinkedIn profile data directly. Using URL as reference only.'
        processedInfo = `LinkedIn URL provided: ${linkedInMatch[0]} - Please extract any useful information from this URL if possible.`
      }
    }

    // Build comprehensive context
    let userContext = ''
    
    if (processedInfo) {
      userContext += `\n## Source Information:\n${processedInfo}\n`
    }
    
    if (linkedInWarning) {
      userContext += `\n${linkedInWarning}\n`
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

    if (references && references.length > 0 && references[0].name) {
      userContext += `\n## References:\n`
      references.forEach((ref, idx) => {
        if (ref.name) {
          userContext += `${idx + 1}. ${ref.name} - ${ref.designation || 'Professional Reference'}\n`
          if (ref.company) userContext += `   Company: ${ref.company}\n`
          if (ref.email) userContext += `   Email: ${ref.email}\n`
          if (ref.phone) userContext += `   Phone: ${ref.phone}\n`
        }
      })
    }

    const templateStyles = {
      modern: 'Modern Professional - Clean lines, bold section headers, professional color accents',
      classic: 'Classic Traditional - Timeless, formal, conservative serif fonts',
      creative: 'Creative Bold - Eye-catching design, creative industry appropriate',
      minimal: 'Minimal Clean - Simple, elegant, lots of whitespace',
      tech: 'Tech/IT Focused - Skills-prominent, technical achievements highlighted',
      executive: 'Executive Level - Senior leadership emphasis, strategic focus'
    }

    const systemPrompt = `You are an elite professional resume writer with 20+ years of experience. Your task is to create a COMPLETE, POLISHED, READY-TO-USE resume.

**BANNED WORDS - DO NOT USE THESE AI-SOUNDING WORDS:**
NEVER use these overused, cliché words that make resumes sound AI-generated or generic:
- unlock, unleash, unveil
- revolutionize, revolutionary
- game-changer, game-changing
- cutting-edge, groundbreaking
- supercharge, turbocharge, skyrocket
- seamless, seamlessly
- harness, leverage (as verbs - except "leveraged" for specific situations)
- elevate, empower, transform (overused)
- dive into, dive deep, deep dive, delve
- synergy, synergistic
- paradigm shift, disrupt, disruptive
- holistic
- maximize potential
- take it to the next level
- innovative, innovation (overused)
- world-class, state-of-the-art
- next-generation, best-in-class
- dynamic (overused in resumes)
- results-driven (cliché)
- team player (cliché)
- go-getter (cliché)
- think outside the box (cliché)
- self-starter (cliché unless specific)
- detail-oriented (show, don't tell)
- hard-working (show, don't tell)

Instead, use specific, quantifiable achievements. Show impact with numbers and results.

CRITICAL RULES:
1. ONLY use information that is EXPLICITLY provided in the user's input
2. DO NOT invent, fabricate, or assume any names, companies, dates, or achievements
3. If the user provides limited information, create a resume template with that exact information
4. If only a LinkedIn URL is provided without profile content, use generic placeholders like "[Your Name]" that the user can fill in
5. Never generate fake metrics or achievements - only include what's explicitly stated
6. If something is unclear, leave it as a placeholder rather than making it up

RESUME STRUCTURE:
- Contact Info: Use exactly what's provided, or [Placeholder] if missing
- Summary: Base ONLY on provided experience, or leave brief and general
- Experience: Use ONLY the jobs/roles mentioned by the user
- Education: Use ONLY the education mentioned by the user
- Skills: Use ONLY the skills mentioned by the user
- References: Include if provided by the user

OUTPUT FORMAT:
Return a JSON object with this exact structure:
{
  "name": "Exact name from input or [Your Name]",
  "title": "Professional Title based on input",
  "email": "email from input or [Your Email]",
  "phone": "phone from input or [Your Phone]",
  "location": "location from input or [Your Location]",
  "linkedin": "linkedin from input or empty string",
  "summary": "Brief professional summary based ONLY on provided info",
  "experience": [
    {
      "title": "Job Title from input",
      "company": "Company from input",
      "location": "Location if provided",
      "duration": "Duration from input",
      "achievements": ["Achievement from input only"]
    }
  ],
  "education": [
    {
      "degree": "Degree from input",
      "school": "School from input",
      "year": "Year from input",
      "details": "Details if provided"
    }
  ],
  "skills": {
    "technical": ["Skills mentioned in input"],
    "tools": ["Tools mentioned in input"],
    "soft": ["Soft skills if mentioned"]
  },
  "certifications": ["Certifications from input"],
  "references": [
    {
      "name": "Reference name if provided",
      "designation": "Their job title",
      "company": "Their company",
      "email": "Their email if provided",
      "phone": "Their phone if provided"
    }
  ]
}

IMPORTANT: Return ONLY valid JSON, no markdown, no explanation. Use exactly what user provided - do not invent information.`

    const userPrompt = `Create a professional resume based ONLY on this information (do not invent or assume anything not explicitly stated):

${userContext}

Target Job: ${targetJob || 'Not specified'}
Industry: ${industry || 'General'}
Style: ${templateStyles[template] || templateStyles.modern}

IMPORTANT REMINDERS:
- Use ONLY the information provided above
- Do NOT make up names, companies, dates, or achievements
- If information is missing, use placeholders like [Your Name], [Your Company]
- Return ONLY the JSON object`

    // Generate the resume
    const resumeResponse = await runLLM(userPrompt, systemPrompt)
    
    // Parse the JSON response
    let resumeData
    try {
      // Clean up the response - remove any markdown formatting
      let cleanResponse = resumeResponse
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim()
      
      resumeData = JSON.parse(cleanResponse)
    } catch (parseError) {
      console.error('Failed to parse resume JSON:', parseError)
      // Try to extract JSON from the response
      const jsonMatch = resumeResponse.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        resumeData = JSON.parse(jsonMatch[0])
      } else {
        throw new Error('Failed to generate structured resume data')
      }
    }

    // Ensure references array exists
    if (!resumeData.references) {
      resumeData.references = []
    }

    return NextResponse.json({
      success: true,
      resumeData,
      template,
      linkedInWarning: linkedInWarning || null,
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
