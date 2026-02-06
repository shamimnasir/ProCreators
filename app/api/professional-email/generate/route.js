import { NextResponse } from 'next/server'
import { spawn } from 'child_process'
import path from 'path'
import { enforceRateLimit } from '@/lib/rate-limiter'

// Email types
const EMAIL_TYPES = {
  request: 'Request/Ask - Asking for something (meeting, information, approval)',
  update: 'Status Update - Sharing progress or information',
  followup: 'Follow-Up - After a meeting or previous conversation',
  introduction: 'Introduction - Introducing yourself or someone else',
  thankyou: 'Thank You - Expressing gratitude',
  announcement: 'Announcement - Sharing news or updates',
  apology: 'Apology - Addressing a mistake or issue',
  reminder: 'Reminder - Gentle nudge about deadline or task',
  feedback: 'Feedback Request - Asking for input or review',
  decline: 'Decline/Reject - Politely saying no'
}

// Tone options
const TONE_OPTIONS = {
  formal: 'Formal - Traditional business communication',
  professional: 'Professional - Standard workplace tone',
  friendly: 'Friendly Professional - Warm but business-appropriate',
  direct: 'Direct - Straightforward and concise',
  diplomatic: 'Diplomatic - Careful and tactful'
}

// Urgency levels
const URGENCY_LEVELS = {
  low: 'Low - No rush, FYI',
  normal: 'Normal - Standard business timeline',
  high: 'High - Needs attention soon',
  urgent: 'Urgent - Time-sensitive, immediate action needed'
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
      recipientName,
      recipientRole,
      emailType,
      subject,
      mainMessage,
      context,
      callToAction,
      deadline,
      tone,
      urgency,
      senderName,
      senderTitle,
      senderCompany,
      includeSignature
    } = body

    if (!mainMessage) {
      return NextResponse.json(
        { success: false, error: 'Main message/purpose is required' },
        { status: 400 }
      )
    }

    // Detect language from input
    const detectLanguage = (text) => {
      if (/[\u0980-\u09FF]/.test(text)) return 'Bengali (বাংলা)'
      if (/[\u0900-\u097F]/.test(text)) return 'Hindi (हिंदी)'
      if (/[\u4E00-\u9FFF]/.test(text)) return 'Chinese (中文)'
      if (/[\u0600-\u06FF]/.test(text)) return 'Arabic (العربية)'
      if (/[ñáéíóúü¿¡]/i.test(text)) return 'Spanish (Español)'
      if (/[àâäéèêëïîôùûüÿœæç]/i.test(text)) return 'French (Français)'
      return 'English'
    }

    const allInputText = `${recipientName || ''} ${subject || ''} ${mainMessage} ${context || ''} ${callToAction || ''}`
    const detectedLanguage = detectLanguage(allInputText)
    const isNonEnglish = detectedLanguage !== 'English'

    const systemPrompt = `You are an expert business communication specialist who writes clear, professional, and effective emails. You understand workplace etiquette, corporate communication norms, and how to get results through email.

${isNonEnglish ? `**IMPORTANT: Generate the email in ${detectedLanguage} as the user's input is in that language.**\n` : ''}

**BANNED WORDS - DO NOT USE THESE AI-SOUNDING WORDS:**
NEVER use these overused, cliché words that make writing sound AI-generated:
- unlock, unleash, unveil
- revolutionize, revolutionary
- game-changer, game-changing
- cutting-edge, groundbreaking
- supercharge, turbocharge, skyrocket
- seamless, seamlessly
- harness, leverage (as verbs)
- elevate, empower, transform (overused)
- dive into, dive deep, deep dive
- journey (customer experience context)
- robust, scalable, synergy
- paradigm shift, disrupt, disruptive
- holistic, streamline
- maximize potential
- take it to the next level
- innovative, innovation (overused)
- world-class, state-of-the-art
- next-generation, best-in-class
- delve, delve into
- foster, facilitate (overused)
- comprehensive, cutting-edge

Instead, use clear, direct, natural language that sounds human.

KEY PRINCIPLES FOR PROFESSIONAL EMAILS:

1. SUBJECT LINE:
   - Direct, specific, and action-oriented
   - Include key topic and any deadline if relevant
   - 50 characters or less ideally
   - Avoid ALL CAPS or spam trigger words

2. STRUCTURE:
   - Professional greeting (Dear/Hi [Name])
   - State purpose in the first sentence
   - Keep paragraphs short (2-3 sentences max)
   - Use bullet points for multiple items
   - Clear call to action before closing
   - Professional sign-off

3. TONE:
   - Professional and courteous
   - Avoid slang, jargon, or overly casual language
   - Be respectful of recipient's time
   - Match formality to relationship and context

4. BEST PRACTICES:
   - One main topic per email
   - Front-load important information
   - Make action items clear and specific
   - Include deadlines when relevant
   - Keep total length under 200 words when possible
   - Sound human, not robotic

Always respond in valid JSON format.`

    const emailTypeLabel = EMAIL_TYPES[emailType] || emailType
    const toneLabel = TONE_OPTIONS[tone] || tone
    const urgencyLabel = URGENCY_LEVELS[urgency] || urgency

    const prompt = `Generate a professional business email with the following details:

**RECIPIENT:**
- Name: ${recipientName || 'Not specified'}
- Role: ${recipientRole || 'Not specified'}

**EMAIL DETAILS:**
- Type: ${emailTypeLabel}
- Subject/Topic: ${subject || 'To be generated'}
- Main Message/Purpose: ${mainMessage}
- Context/Background: ${context || 'Not specified'}
- Call to Action: ${callToAction || 'To be determined based on email type'}
- Deadline (if any): ${deadline || 'None specified'}
- Tone: ${toneLabel}
- Urgency: ${urgencyLabel}

**SENDER:**
- Name: ${senderName || 'Not specified'}
- Title: ${senderTitle || 'Not specified'}
- Company: ${senderCompany || 'Not specified'}
- Include Signature: ${includeSignature ? 'Yes' : 'No'}

${isNonEnglish ? `\n**LANGUAGE: Generate ALL content in ${detectedLanguage}**\n` : ''}

Generate a complete response in this exact JSON format:
{
  "subjectLine": "Clear, specific, action-oriented subject line (50 chars or less)",
  "email": "The complete professional email with proper greeting, body paragraphs, call to action, and professional closing. Use bullet points where appropriate. Keep concise.",
  "alternativeSubjects": [
    "Alternative subject line option 1",
    "Alternative subject line option 2"
  ],
  "shorterVersion": "A more concise version of the email for quick communication",
  "formalVersion": "A more formal version if needed for senior leadership",
  "tips": [
    "Specific tip for this type of email",
    "Another relevant tip",
    "Third helpful tip"
  ],
  "timing": "Best time/day to send this type of email",
  "followUpSuggestion": "When and how to follow up if no response"
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
        subjectLine: subject || `${emailType}: ${mainMessage.substring(0, 30)}...`,
        email: llmResponse,
        alternativeSubjects: [],
        shorterVersion: '',
        formalVersion: '',
        tips: [
          'Keep your email concise and focused',
          'Include a clear call to action',
          'Proofread before sending'
        ],
        timing: 'Tuesday-Thursday mornings tend to have best response rates',
        followUpSuggestion: 'Follow up after 2-3 business days if no response'
      }
    }

    // Add signature if requested
    if (includeSignature && senderName) {
      const signature = `\n\n${senderName}${senderTitle ? `\n${senderTitle}` : ''}${senderCompany ? `\n${senderCompany}` : ''}`
      if (!result.email.includes(senderName)) {
        result.email = result.email.replace(/Best regards,?\s*$/i, `Best regards,${signature}`)
        result.email = result.email.replace(/Sincerely,?\s*$/i, `Sincerely,${signature}`)
        result.email = result.email.replace(/Thanks,?\s*$/i, `Thanks,${signature}`)
      }
    }

    return NextResponse.json({
      success: true,
      data: result,
      metadata: {
        emailType,
        tone,
        urgency,
        detectedLanguage
      }
    })

  } catch (error) {
    console.error('Professional Email Generator Error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to generate email' },
      { status: 500 }
    )
  }
}
