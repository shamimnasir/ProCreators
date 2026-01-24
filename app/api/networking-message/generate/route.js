import { NextResponse } from 'next/server'
import { spawn } from 'child_process'
import path from 'path'

// Message types with templates
const MESSAGE_TYPES = {
  initial: 'Initial Outreach - First contact to establish connection',
  followup: 'Follow-Up - Gentle reminder after no response',
  thankyou: 'Thank You - Express gratitude after receiving help',
  reconnect: 'Reconnect - Re-establishing an old connection',
  introduction: 'Introduction Request - Asking for an intro to someone'
}

// Connection contexts
const CONNECTION_CONTEXTS = {
  mutual: 'Mutual Connection',
  event: 'Met at Event/Conference',
  content: 'Engaged with Their Content',
  alumni: 'Same School/University',
  company: 'Same Company (Past/Present)',
  industry: 'Same Industry',
  cold: 'Cold Outreach (No Prior Connection)'
}

// Purpose types
const PURPOSE_TYPES = {
  informational: 'Informational Interview',
  advice: 'Seeking Career Advice',
  collaboration: 'Potential Collaboration',
  mentorship: 'Mentorship Opportunity',
  referral: 'Job Referral',
  introduction: 'Request Introduction',
  general: 'General Networking'
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
      recipientName,
      recipientRole,
      recipientCompany,
      recipientAchievement,
      connectionContext,
      connectionDetails,
      purpose,
      specificAsk,
      yourBackground,
      valueOffer,
      messageType,
      tone,
      platform
    } = body

    if (!recipientName || !purpose) {
      return NextResponse.json(
        { success: false, error: 'Recipient name and purpose are required' },
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
      return 'English'
    }

    const allInputText = `${recipientName} ${recipientRole || ''} ${recipientCompany || ''} ${connectionDetails || ''} ${specificAsk || ''} ${yourBackground || ''} ${valueOffer || ''}`
    const detectedLanguage = detectLanguage(allInputText)
    const isNonEnglish = detectedLanguage !== 'English'

    const systemPrompt = `You are an expert networking and professional communication specialist. You understand the psychology of effective outreach and how to build genuine professional relationships.

${isNonEnglish ? `**IMPORTANT: Generate the message in ${detectedLanguage} as the user's input is in that language.**\n` : ''}

**BANNED WORDS - DO NOT USE THESE AI-SOUNDING OR CLICHÉ WORDS:**
Avoid these overused words that make messages sound AI-generated or fake:
- unlock, unleash, unveil
- game-changer, cutting-edge
- supercharge, seamless
- harness, leverage (overused)
- elevate, empower, transform (overused)
- dive into, dive deep, delve
- synergy, paradigm shift
- holistic, streamline
- maximize potential
- take it to the next level
- innovative, innovation (overused)
- reach out (overused - say "contact" or "message")
- touch base (cliché)
- pick your brain (overused)
- circle back
- moving forward
- thought leader (cliché)

Use natural, conversational language that sounds like a real person.

KEY PRINCIPLES FOR NETWORKING MESSAGES:
1. PERSONALIZATION: Reference specific details about the recipient (role, achievements, content)
2. VALUE FIRST: Offer something helpful before asking for anything
3. BREVITY: Keep messages to 2-3 short paragraphs max
4. CLEAR CTA: Include a specific, low-commitment ask (15-min call, quick question)
5. AUTHENTICITY: Sound genuine, not transactional
6. RESPECT THEIR TIME: Make it easy for them to respond

MESSAGE STRUCTURE:
- Subject Line: Compelling, specific, mentions connection point
- Opening: Acknowledge them (achievement, content, mutual connection)
- Middle: Brief context about you + value you can offer
- Close: Specific, small ask with clear CTA

Avoid:
- Generic templates that sound mass-produced
- Asking for too much upfront (jobs, big favors)
- Being too formal or too casual
- Long paragraphs or walls of text
- Focusing only on what you want

Always respond in valid JSON format.`

    const messageTypeLabel = MESSAGE_TYPES[messageType] || 'Initial Outreach'
    const connectionLabel = CONNECTION_CONTEXTS[connectionContext] || connectionContext
    const purposeLabel = PURPOSE_TYPES[purpose] || purpose

    const prompt = `Generate a professional networking message with the following details:

**RECIPIENT INFORMATION:**
- Name: ${recipientName}
- Role: ${recipientRole || 'Not specified'}
- Company: ${recipientCompany || 'Not specified'}
- Recent Achievement/Notable: ${recipientAchievement || 'Not specified'}

**CONNECTION CONTEXT:**
- How Connected: ${connectionLabel}
- Connection Details: ${connectionDetails || 'Not specified'}

**MESSAGE DETAILS:**
- Message Type: ${messageTypeLabel}
- Purpose: ${purposeLabel}
- Specific Ask: ${specificAsk || 'General networking conversation'}
- Your Background: ${yourBackground || 'Professional seeking to connect'}
- Value You Can Offer: ${valueOffer || 'Not specified'}
- Tone: ${tone || 'Professional yet warm'}
- Platform: ${platform || 'LinkedIn'}

${isNonEnglish ? `\n**LANGUAGE: Generate ALL content in ${detectedLanguage}**\n` : ''}

Generate a complete response in this exact JSON format:
{
  "subjectLine": "Compelling subject line that mentions the connection point or something specific about them",
  "message": "The full networking message following best practices: personalized opening, brief context, value offer, clear small ask. Keep to 2-3 short paragraphs.",
  "alternativeVersions": [
    "A shorter, more direct version of the message",
    "A version with a different angle or hook"
  ],
  "followUpMessage": "A polite follow-up message to send if no response after a few days",
  "thankYouTemplate": "A thank you message template to use after they respond or help",
  "tips": [
    "Specific tip for this particular outreach",
    "Another relevant tip",
    "Third helpful tip"
  ],
  "doNots": [
    "What to avoid in this specific situation",
    "Another thing to avoid"
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
      // Fallback response
      result = {
        subjectLine: `Connecting via ${connectionLabel} - ${recipientName}`,
        message: llmResponse,
        alternativeVersions: [],
        followUpMessage: `Hi ${recipientName}, I wanted to follow up on my previous message. I understand you're busy, but I'd love to connect if you have a moment.`,
        thankYouTemplate: `Thank you so much for taking the time to connect, ${recipientName}. I really appreciate your insights.`,
        tips: [
          'Keep your message concise and focused',
          'Reference something specific about them',
          'Make your ask clear and small'
        ],
        doNots: [
          'Don\'t ask for too much upfront',
          'Avoid generic messages'
        ]
      }
    }

    return NextResponse.json({
      success: true,
      data: result,
      metadata: {
        messageType,
        purpose,
        connectionContext,
        platform,
        detectedLanguage
      }
    })

  } catch (error) {
    console.error('Networking Message Generator Error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to generate networking message' },
      { status: 500 }
    )
  }
}
