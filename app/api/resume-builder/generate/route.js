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

// Try to scrape LinkedIn profile
async function scrapeLinkedIn(url) {
  try {
    // Use a web scraping approach
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    })
    const html = await response.text()
    
    // Extract basic info from meta tags and visible content
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i)
    const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i)
    
    let extractedInfo = ''
    if (titleMatch) extractedInfo += `Title: ${titleMatch[1]}\n`
    if (descMatch) extractedInfo += `Summary: ${descMatch[1]}\n`
    
    return extractedInfo || null
  } catch (error) {
    console.log('LinkedIn scraping failed:', error.message)
    return null
  }
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
        error: 'Please provide your information - either paste your existing CV, enter a LinkedIn URL, or fill in the details' 
      }, { status: 400 })
    }

    // Check if rawInfo contains a LinkedIn URL
    let processedInfo = rawInfo || ''
    const linkedInRegex = /https?:\/\/(www\.)?linkedin\.com\/in\/[\w-]+/i
    const linkedInMatch = rawInfo?.match(linkedInRegex)
    
    if (linkedInMatch) {
      // Try to scrape LinkedIn
      const scrapedData = await scrapeLinkedIn(linkedInMatch[0])
      if (scrapedData) {
        processedInfo = `LinkedIn Profile URL: ${linkedInMatch[0]}\n${scrapedData}\n\nAdditional Info: ${rawInfo}`
      }
    }

    // Build comprehensive context
    let userContext = ''
    
    if (processedInfo) {
      userContext += `\n## Source Information:\n${processedInfo}\n`
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
      modern: 'Modern Professional - Clean lines, bold section headers, professional color accents',
      classic: 'Classic Traditional - Timeless, formal, conservative serif fonts',
      creative: 'Creative Bold - Eye-catching design, creative industry appropriate',
      minimal: 'Minimal Clean - Simple, elegant, lots of whitespace',
      tech: 'Tech/IT Focused - Skills-prominent, technical achievements highlighted',
      executive: 'Executive Level - Senior leadership emphasis, strategic focus'
    }

    const systemPrompt = `You are an elite professional resume writer with 20+ years of experience placing candidates at Fortune 500 companies. Your task is to create a COMPLETE, POLISHED, READY-TO-USE resume.

CRITICAL RULES:
1. NEVER use placeholders like [Number], [Company], [Project Name], [Specific detail], etc.
2. If information is missing, make intelligent, realistic assumptions based on the context
3. If someone provides a LinkedIn URL, extract their name from the URL and create a realistic professional profile
4. Every bullet point must be specific and quantified with realistic numbers
5. The resume must be IMMEDIATELY USABLE - no editing required by the user
6. Apply ALL best practices directly - don't list them as tips

RESUME BEST PRACTICES TO APPLY:
- Start every bullet with strong action verbs (Led, Developed, Implemented, Architected, Optimized)
- Include specific metrics and percentages (increased by 35%, reduced by 40%, managed team of 8)
- Highlight leadership and collaboration
- Include relevant technical skills and tools
- Make the summary compelling and targeted to the role
- Ensure ATS compatibility with proper keywords

OUTPUT FORMAT:
Return a JSON object with this exact structure:
{
  "name": "Full Name",
  "title": "Professional Title",
  "email": "email@example.com",
  "phone": "+1 (555) 123-4567",
  "location": "City, State",
  "linkedin": "linkedin.com/in/username",
  "summary": "2-3 sentence compelling professional summary",
  "experience": [
    {
      "title": "Job Title",
      "company": "Company Name",
      "location": "City, State",
      "duration": "Month Year - Present",
      "achievements": ["Achievement 1 with specific metrics", "Achievement 2", "Achievement 3"]
    }
  ],
  "education": [
    {
      "degree": "Degree Name",
      "school": "University Name",
      "year": "Year",
      "details": "GPA, honors, relevant coursework (optional)"
    }
  ],
  "skills": {
    "technical": ["Skill 1", "Skill 2"],
    "tools": ["Tool 1", "Tool 2"],
    "soft": ["Leadership", "Communication"]
  },
  "certifications": ["Certification 1", "Certification 2"]
}

IMPORTANT: Return ONLY valid JSON, no markdown, no explanation.`

    const userPrompt = `Create a complete, polished, ready-to-use professional resume based on this information:

${userContext}

Target Job: ${targetJob || 'Software Professional'}
Industry: ${industry || 'Technology'}
Style: ${templateStyles[template] || templateStyles.modern}

REMEMBER:
- NO placeholders - make intelligent assumptions for any missing information
- If only a LinkedIn URL is provided, extract the name and create a realistic profile for someone in that industry
- Every achievement must have specific, realistic metrics
- The resume must be immediately usable without any edits
- Return ONLY the JSON object, nothing else`

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

    return NextResponse.json({
      success: true,
      resumeData,
      template,
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
