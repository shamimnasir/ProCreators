import { NextResponse } from 'next/server'
import { spawn } from 'child_process'
import path from 'path'
import fs from 'fs/promises'
import { v4 as uuidv4 } from 'uuid'

// Helper to run LLM using Python script
async function runLLM(prompt, systemPrompt = 'You are an expert cover letter writer.') {
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
      // Personal Info
      fullName,
      email,
      phone,
      address,
      linkedinUrl,
      
      // Job Details
      jobTitle,
      companyName,
      hiringManagerName,
      jobDescription,
      
      // Your Background
      currentRole,
      yearsExperience,
      keySkills,
      relevantAchievements,
      whyInterested,
      
      // Resume Data (optional - can be passed from resume builder)
      resumeData,
      
      // Settings
      tone,
      length,
      focusAreas
    } = body

    // Validate required fields
    if (!fullName || !jobTitle || !companyName) {
      return NextResponse.json({ 
        success: false, 
        error: 'Please provide your name, the job title, and company name' 
      }, { status: 400 })
    }

    // Build context from all available information
    let userContext = ''
    
    // Personal Info
    userContext += `## Applicant Information:\n`
    userContext += `Name: ${fullName}\n`
    if (email) userContext += `Email: ${email}\n`
    if (phone) userContext += `Phone: ${phone}\n`
    if (address) userContext += `Address: ${address}\n`
    if (linkedinUrl) userContext += `LinkedIn: ${linkedinUrl}\n`
    
    // Target Job Details
    userContext += `\n## Target Position:\n`
    userContext += `Job Title: ${jobTitle}\n`
    userContext += `Company: ${companyName}\n`
    if (hiringManagerName) userContext += `Hiring Manager: ${hiringManagerName}\n`
    if (jobDescription) userContext += `\nJob Description:\n${jobDescription}\n`
    
    // Background
    userContext += `\n## Applicant Background:\n`
    if (currentRole) userContext += `Current Role: ${currentRole}\n`
    if (yearsExperience) userContext += `Years of Experience: ${yearsExperience}\n`
    if (keySkills) userContext += `Key Skills: ${keySkills}\n`
    if (relevantAchievements) userContext += `Key Achievements:\n${relevantAchievements}\n`
    if (whyInterested) userContext += `Why Interested in This Role:\n${whyInterested}\n`
    
    // If resume data is provided
    if (resumeData) {
      userContext += `\n## Resume Data:\n`
      if (resumeData.summary) userContext += `Summary: ${resumeData.summary}\n`
      if (resumeData.experience) {
        userContext += `Experience:\n`
        resumeData.experience.forEach((exp, i) => {
          userContext += `- ${exp.title} at ${exp.company} (${exp.duration})\n`
          if (exp.achievements) {
            exp.achievements.forEach(a => userContext += `  • ${a}\n`)
          }
        })
      }
      if (resumeData.skills) {
        const allSkills = [
          ...(resumeData.skills.technical || []),
          ...(resumeData.skills.tools || []),
          ...(resumeData.skills.soft || [])
        ]
        if (allSkills.length) userContext += `Skills: ${allSkills.join(', ')}\n`
      }
    }

    // Tone mapping
    const toneGuide = {
      professional: 'Formal, business-appropriate, confident but not arrogant',
      enthusiastic: 'Energetic, passionate, showing genuine excitement while remaining professional',
      confident: 'Self-assured, highlighting achievements assertively, leadership-oriented',
      conversational: 'Friendly and approachable while maintaining professionalism'
    }

    // Length guide
    const lengthGuide = {
      concise: '250-300 words, 3 short paragraphs',
      standard: '300-400 words, 4 paragraphs',
      detailed: '400-500 words, 4-5 paragraphs with more examples'
    }

    const systemPrompt = `You are an elite career coach and professional cover letter writer with 20+ years of experience helping candidates land jobs at top companies.

## YOUR EXPERTISE:
- Deep understanding of ATS (Applicant Tracking Systems)
- Knowledge of what hiring managers look for
- Expertise in persuasive professional writing
- Industry-specific terminology and expectations

## COVER LETTER BEST PRACTICES TO FOLLOW:

### Structure:
1. **Header**: Include applicant contact info at the top
2. **Date**: Current date
3. **Recipient**: Hiring manager name (if known) or "Hiring Manager"
4. **Company Address**: Company name and any known address details
5. **Salutation**: "Dear [Name]" or "Dear Hiring Manager"
6. **Opening Paragraph**: Hook them immediately
   - State the specific position
   - Express genuine enthusiasm
   - Include a compelling achievement or connection
7. **Body Paragraphs (2-3)**:
   - Connect skills/experience to job requirements using STAR method
   - Use concrete examples with metrics when possible
   - Mirror keywords from the job description
   - Show company culture fit
8. **Closing Paragraph**:
   - Reiterate interest and value proposition
   - Mention availability
   - Include call to action
   - Thank them
9. **Sign-off**: "Sincerely," followed by full name

### Writing Rules:
- Be SPECIFIC - avoid generic statements
- Use ACTION VERBS and QUANTIFIED achievements
- Mirror language from the job posting
- Keep it under one page
- Show enthusiasm without being unprofessional
- Address the company's needs, not just your wants
- Proofread for perfect grammar and spelling

### What to Avoid:
- Generic openings ("I am writing to apply...")
- Simply restating the resume
- Focusing on what YOU want vs what you OFFER
- Typos or grammatical errors
- Exceeding one page
- Being too casual or too stiff

## OUTPUT FORMAT:
Return a JSON object with this structure:
{
  "coverLetter": {
    "header": {
      "applicantName": "Full Name",
      "applicantEmail": "email@example.com",
      "applicantPhone": "phone number",
      "applicantAddress": "address if provided",
      "applicantLinkedIn": "linkedin url if provided",
      "date": "Current date formatted nicely",
      "recipientName": "Hiring Manager name or 'Hiring Manager'",
      "recipientTitle": "Their title if known",
      "companyName": "Company Name",
      "companyAddress": "Company address if known"
    },
    "salutation": "Dear [Name/Hiring Manager],",
    "opening": "First paragraph - the hook",
    "body": [
      "Second paragraph - key qualifications",
      "Third paragraph - specific achievements/fit"
    ],
    "closing": "Final paragraph with call to action",
    "signOff": "Sincerely,",
    "signature": "Full Name"
  },
  "metadata": {
    "wordCount": 350,
    "keywordsUsed": ["list", "of", "job", "keywords", "matched"],
    "tone": "professional/enthusiastic/confident",
    "strengthAreas": ["What makes this cover letter strong"]
  },
  "fullText": "Complete cover letter as plain text for easy copying"
}

IMPORTANT: Return ONLY valid JSON, no markdown code blocks.`

    const userPrompt = `Create a compelling, personalized cover letter based on this information:

${userContext}

## Writing Guidelines:
- Tone: ${toneGuide[tone] || toneGuide.professional}
- Length: ${lengthGuide[length] || lengthGuide.standard}
${focusAreas ? `- Focus Areas: ${focusAreas}` : ''}

## Key Requirements:
1. MUST use the STAR method for at least one achievement
2. MUST include keywords from the job description
3. MUST show genuine interest in the specific company
4. MUST be ATS-friendly (no special formatting characters)
5. MUST be error-free grammatically
6. DO NOT invent achievements or qualifications not provided
7. If limited info is provided, keep it concise and focus on transferable value

Generate a professional, compelling cover letter that will help this candidate stand out.
Return ONLY the JSON object - no markdown formatting.`

    // Generate the cover letter
    const response = await runLLM(userPrompt, systemPrompt)
    
    // Parse the JSON response
    let coverLetterData
    try {
      // Clean up the response - remove any markdown formatting
      let cleanResponse = response
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim()
      
      coverLetterData = JSON.parse(cleanResponse)
    } catch (parseError) {
      console.error('Failed to parse cover letter JSON:', parseError)
      // Try to extract JSON from the response
      const jsonMatch = response.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        coverLetterData = JSON.parse(jsonMatch[0])
      } else {
        throw new Error('Failed to generate structured cover letter data')
      }
    }

    // Generate full text version if not provided
    if (!coverLetterData.fullText && coverLetterData.coverLetter) {
      const cl = coverLetterData.coverLetter
      let fullText = ''
      
      // Header
      if (cl.header) {
        fullText += `${cl.header.applicantName}\n`
        if (cl.header.applicantEmail) fullText += `${cl.header.applicantEmail}\n`
        if (cl.header.applicantPhone) fullText += `${cl.header.applicantPhone}\n`
        if (cl.header.applicantAddress) fullText += `${cl.header.applicantAddress}\n`
        if (cl.header.applicantLinkedIn) fullText += `${cl.header.applicantLinkedIn}\n`
        fullText += `\n${cl.header.date}\n\n`
        if (cl.header.recipientName) fullText += `${cl.header.recipientName}\n`
        if (cl.header.recipientTitle) fullText += `${cl.header.recipientTitle}\n`
        fullText += `${cl.header.companyName}\n`
        if (cl.header.companyAddress) fullText += `${cl.header.companyAddress}\n`
        fullText += '\n'
      }
      
      // Body
      fullText += `${cl.salutation}\n\n`
      fullText += `${cl.opening}\n\n`
      if (cl.body && Array.isArray(cl.body)) {
        cl.body.forEach(para => {
          fullText += `${para}\n\n`
        })
      }
      fullText += `${cl.closing}\n\n`
      fullText += `${cl.signOff}\n${cl.signature}`
      
      coverLetterData.fullText = fullText
    }

    return NextResponse.json({
      success: true,
      data: coverLetterData,
      metadata: {
        jobTitle,
        companyName,
        tone: tone || 'professional',
        length: length || 'standard'
      }
    })

  } catch (error) {
    console.error('Cover letter generation error:', error)
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Failed to generate cover letter' 
    }, { status: 500 })
  }
}
