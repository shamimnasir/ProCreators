import { NextResponse } from 'next/server'
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { getCollection } from '@/lib/mongodb'
import { randomUUID } from 'crypto'
import fs from 'fs/promises'
import path from 'path'
import { enforceRateLimit } from '@/lib/rate-limiter'
import { getUserIdFromRequest, checkCredits, deductCredits, completeTransaction, refundCredits } from '@/lib/credits'

const TOOL_ID = 'journal-maker'

const genAI = new GoogleGenerativeAI(process.env.EMERGENT_LLM_KEY)

// Journal types with configurations
const JOURNAL_TYPES = {
  'gratitude': {
    name: 'Gratitude Journal',
    prompts: ['3 things I\'m grateful for today', 'Someone who made me smile', 'A small win I had today', 'Something beautiful I noticed'],
    sections: ['Morning Gratitude', 'Evening Reflection', 'Weekly Wins']
  },
  'bullet': {
    name: 'Bullet Journal',
    prompts: ['Tasks', 'Events', 'Notes', 'Goals'],
    sections: ['Daily Log', 'Monthly Overview', 'Habit Tracker', 'Notes']
  },
  'mindfulness': {
    name: 'Mindfulness Journal',
    prompts: ['How am I feeling right now?', 'What\'s on my mind?', 'One thing I can let go of', 'Affirmation for today'],
    sections: ['Morning Intention', 'Mood Check', 'Evening Reflection']
  },
  'self-discovery': {
    name: 'Self-Discovery Journal',
    prompts: ['What makes me unique?', 'My core values are...', 'I feel most alive when...', 'A limiting belief I want to change'],
    sections: ['Who Am I?', 'Dreams & Goals', 'Fears & Growth', 'Reflection']
  },
  'dream': {
    name: 'Dream Journal',
    prompts: ['Last night I dreamed about...', 'Symbols I noticed', 'Emotions in my dream', 'What might this mean?'],
    sections: ['Dream Record', 'Recurring Themes', 'Dream Analysis']
  },
  'fitness': {
    name: 'Fitness Journal',
    prompts: ['Today\'s workout', 'Energy level (1-10)', 'Nutrition notes', 'Progress made'],
    sections: ['Workout Log', 'Meal Tracker', 'Progress Photos', 'Goals']
  },
  'reading': {
    name: 'Reading Journal',
    prompts: ['Book title & author', 'Key insights', 'Favorite quotes', 'How it changed my thinking'],
    sections: ['Currently Reading', 'Book Notes', 'Reading List', 'Reviews']
  },
  'travel': {
    name: 'Travel Journal',
    prompts: ['Places visited today', 'People I met', 'Food I tried', 'Memorable moments'],
    sections: ['Trip Overview', 'Daily Adventures', 'Photos & Memories', 'Tips']
  },
  // Sprint 3 — Therapeutic Modes -----------------------------------------
  // These modes use clinically-informed prompt scaffolding. Content is
  // supportive/reflective, NOT medical advice. The AI system prompt is
  // instructed to include a wellness disclaimer.
  'adhd': {
    name: 'ADHD Focus Journal',
    prompts: [
      'Today\'s ONE priority (just one)',
      'Brain dump: everything on my mind right now',
      'What did I actually finish today?',
      'What distracted me most and why?',
      'Small win I can celebrate',
      'Tomorrow\'s FIRST 15-minute task'
    ],
    sections: [
      'Morning Anchor (priority + medication check-in)',
      'Time-Blocked Focus Sprints',
      'Distraction Log',
      'Wins & Dopamine Deposits',
      'Evening Wind-Down Checklist'
    ],
    modeContext: 'Executive-function scaffolding for adults with ADHD. Emphasize externalized memory, tiny wins, hyperfocus tracking, medication and sleep check-ins, and non-judgmental language. Provide short, chunked prompts (never long paragraphs). Include a Distraction Log and a Dopamine Deposits section on most days.'
  },
  'cbt': {
    name: 'CBT Thought Journal',
    prompts: [
      'Situation: What happened? (facts only)',
      'Automatic thought: What went through my mind?',
      'Emotion + intensity (0-100)',
      'Cognitive distortion I might be using',
      'Evidence FOR this thought',
      'Evidence AGAINST this thought',
      'Balanced / alternative thought',
      'How I feel now (0-100)'
    ],
    sections: [
      'Daily Thought Record (5-column CBT worksheet)',
      'Cognitive Distortions Cheat Sheet',
      'Behavioral Activation Tracker',
      'Values Compass',
      'Weekly Review'
    ],
    modeContext: 'Standard CBT thought-record structure (Beck / Padesky). Include the classic 5–7 column thought record on each daily page, a reference page listing the 10 core cognitive distortions with brief examples, and a Behavioral Activation tracker for mood-boosting activities. Reflective, evidence-based, non-clinical language. Always include a note reminding the user this is a self-help journal, not a substitute for therapy.'
  },
  'postpartum': {
    name: 'Postpartum Wellness Journal',
    prompts: [
      'How I slept last night (hours + quality 1-10)',
      'How I\'m feeling emotionally today',
      'One small thing I did for me',
      'What I need help with',
      'A moment I want to remember with baby',
      'A gentle reminder to myself'
    ],
    sections: [
      'Daily Check-In (mood + sleep + nutrition + support)',
      'Baby & Me Log (feeds, naps, milestones)',
      'Body Recovery Notes',
      'Mental-Health Screening (Edinburgh-style weekly check-in)',
      'Gratitude & Small Wins',
      'When to Reach Out (warning signs page)'
    ],
    modeContext: 'Compassionate postpartum mental-wellness journal for new mothers in the first year after birth. Include gentle prompts for mood, sleep, feeding, body recovery, and self-compassion. Include a weekly Edinburgh Postnatal Depression Scale (EPDS)-style self check-in and a "When to Reach Out" resource page listing warning signs and reminders to contact a provider. Language should be warm, non-judgmental, and always affirm that asking for help is a strength.'
  }
}

// Generate journal prompts with AI
async function generateJournalPrompts(journalType, pageCount, customTheme) {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })
    const config = JOURNAL_TYPES[journalType] || JOURNAL_TYPES['gratitude']
    const isTherapeutic = ['adhd', 'cbt', 'postpartum'].includes(journalType)
    
    const prompt = `Generate content for a ${config.name}${customTheme ? ` with theme: ${customTheme}` : ''}.
${config.modeContext ? `\nMode context (follow strictly): ${config.modeContext}\n` : ''}
I need ${pageCount} unique journaling prompts and questions that are:
- Thought-provoking and introspective
- Suitable for daily reflection
- Varied in depth (some quick, some deep)
${isTherapeutic ? `- Use compassionate, non-judgmental, plain-English language\n- NEVER prescribe medications, dosages, or diagnose conditions\n- Prompts should be short (one line each) and easy to answer even on a tough day` : ''}

Also generate:
- 5 inspirational quotes related to ${journalType}
- 3 weekly reflection questions
- A brief introduction paragraph for the journal
${isTherapeutic ? '- A short wellness disclaimer (2 sentences) reminding the user this journal is a self-help tool, not medical advice or a substitute for professional support' : ''}

Format as JSON:
{
  "title": "...",
  "introduction": "...",${isTherapeutic ? '\n  "disclaimer": "...",' : ''}
  "dailyPrompts": ["prompt1", "prompt2", ...],
  "weeklyPrompts": ["...", "...", "..."],
  "quotes": ["quote1", "quote2", ...]
}

IMPORTANT: Return ONLY valid JSON.`

    const result = await model.generateContent(prompt)
    const response = await result.response
    let text = response.text().trim()
    text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    
    return JSON.parse(text)
  } catch (error) {
    // Refund credits on error
    if (transactionId && userId) {
      await refundCredits(userId, transactionId, error.message)
    }
    console.error('AI journal generation error:', error)
    const config = JOURNAL_TYPES[journalType] || JOURNAL_TYPES['gratitude']
    return {
      title: config.name,
      introduction: 'Welcome to your personal journaling journey. Use these pages to reflect, grow, and discover yourself.',
      dailyPrompts: Array.from({ length: pageCount }, (_, i) => config.prompts[i % config.prompts.length]),
      weeklyPrompts: ['What was my biggest accomplishment this week?', 'What challenged me?', 'What am I looking forward to?'],
      quotes: [
        'The journey of a thousand miles begins with a single step.',
        'Be yourself; everyone else is already taken.',
        'Every moment is a fresh beginning.'
      ]
    }
  }
}

export async function POST(request) {
  let transactionId = null
  let userId = null
  
  try {
    // SECURITY: Get user ID and check credits
    userId = await getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json({
        success: false,
        error: 'Authentication required. Please log in to use this tool.'
      }, { status: 401 })
    }
    
    const creditCheck = await checkCredits(userId, TOOL_ID)
    if (!creditCheck.hasEnough) {
      return NextResponse.json({
        success: false,
        error: `Insufficient credits. This tool costs ${creditCheck.cost} credits, but you have ${creditCheck.currentBalance}.`,
        creditInfo: creditCheck
      }, { status: 402 })
    }
    
    // Deduct credits before generation
    const deductResult = await deductCredits(userId, TOOL_ID)
    if (!deductResult.success) {
      return NextResponse.json({
        success: false,
        error: 'Failed to process credits. Please try again.'
      }, { status: 500 })
    }
    transactionId = deductResult.transactionId

    // SECURITY: Rate limiting for content generation
    const rateLimitCheck = await enforceRateLimit(request, 'content_generate')
    if (rateLimitCheck.limited) {
      return rateLimitCheck.response
    }

    const { journalType, pageCount, designStyle, paperSize, customTheme } = await request.json()
    
    const pages = pageCount || 30
    
    // Generate content
    const content = await generateJournalPrompts(journalType, pages, customTheme)
    
    // Create PDF
    const pdfDoc = await PDFDocument.create()
    const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica)
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
    const italicFont = await pdfDoc.embedFont(StandardFonts.HelveticaOblique)
    
    const sizes = {
      letter: { width: 612, height: 792 },
      a4: { width: 595, height: 842 },
      a5: { width: 420, height: 595 }
    }
    const { width, height } = sizes[paperSize] || sizes.letter
    const margin = 40
    
    // Color schemes
    const schemes = {
      elegant: { primary: rgb(0.2, 0.2, 0.25), accent: rgb(0.6, 0.5, 0.4), lines: rgb(0.85, 0.85, 0.85) },
      minimal: { primary: rgb(0.1, 0.1, 0.1), accent: rgb(0.4, 0.4, 0.4), lines: rgb(0.9, 0.9, 0.9) },
      nature: { primary: rgb(0.2, 0.35, 0.2), accent: rgb(0.5, 0.65, 0.4), lines: rgb(0.88, 0.92, 0.85) },
      ocean: { primary: rgb(0.15, 0.3, 0.45), accent: rgb(0.4, 0.6, 0.7), lines: rgb(0.85, 0.9, 0.95) },
      sunset: { primary: rgb(0.5, 0.25, 0.2), accent: rgb(0.85, 0.5, 0.3), lines: rgb(0.95, 0.9, 0.88) }
    }
    const colors = schemes[designStyle] || schemes.elegant
    
    // Title page
    let page = pdfDoc.addPage([width, height])
    page.drawText(content.title, {
      x: width / 2 - boldFont.widthOfTextAtSize(content.title, 28) / 2,
      y: height / 2 + 50,
      size: 28,
      font: boldFont,
      color: colors.primary
    })
    
    // Introduction page
    page = pdfDoc.addPage([width, height])
    page.drawText('Welcome', {
      x: margin,
      y: height - margin - 30,
      size: 22,
      font: boldFont,
      color: colors.primary
    })
    
    // Wrap introduction text
    const introWords = content.introduction.split(' ')
    let line = ''
    let y = height - margin - 80
    for (const word of introWords) {
      const testLine = line ? `${line} ${word}` : word
      if (regularFont.widthOfTextAtSize(testLine, 11) > width - margin * 2) {
        page.drawText(line, { x: margin, y, size: 11, font: regularFont, color: colors.primary })
        line = word
        y -= 18
      } else {
        line = testLine
      }
    }
    if (line) page.drawText(line, { x: margin, y, size: 11, font: regularFont, color: colors.primary })
    
    // Journal pages with prompts
    const config = JOURNAL_TYPES[journalType] || JOURNAL_TYPES['gratitude']
    
    for (let i = 0; i < Math.min(pages, 50); i++) {
      page = pdfDoc.addPage([width, height])
      
      // Date line
      page.drawText('Date: _________________', {
        x: margin,
        y: height - margin - 20,
        size: 10,
        font: regularFont,
        color: colors.accent
      })
      
      // Prompt
      const prompt = content.dailyPrompts[i % content.dailyPrompts.length]
      page.drawText(prompt, {
        x: margin,
        y: height - margin - 60,
        size: 14,
        font: boldFont,
        color: colors.primary
      })
      
      // Writing lines
      y = height - margin - 100
      while (y > margin + 80) {
        page.drawLine({
          start: { x: margin, y },
          end: { x: width - margin, y },
          thickness: 0.5,
          color: colors.lines
        })
        y -= 28
      }
      
      // Quote at bottom
      const quote = content.quotes[i % content.quotes.length]
      page.drawText(`"${quote}"`, {
        x: margin,
        y: margin + 30,
        size: 9,
        font: italicFont,
        color: colors.accent
      })
      
      // Page number
      page.drawText(`${i + 1}`, {
        x: width / 2 - 5,
        y: margin,
        size: 10,
        font: regularFont,
        color: colors.accent
      })
    }
    
    // Weekly reflection pages (add 4)
    for (let w = 0; w < 4; w++) {
      page = pdfDoc.addPage([width, height])
      
      page.drawText(`Week ${w + 1} Reflection`, {
        x: margin,
        y: height - margin - 30,
        size: 18,
        font: boldFont,
        color: colors.primary
      })
      
      y = height - margin - 80
      content.weeklyPrompts.forEach((prompt, idx) => {
        page.drawText(`${idx + 1}. ${prompt}`, {
          x: margin,
          y,
          size: 12,
          font: boldFont,
          color: colors.primary
        })
        y -= 30
        
        // Lines for answer
        for (let l = 0; l < 4; l++) {
          page.drawLine({
            start: { x: margin + 20, y },
            end: { x: width - margin, y },
            thickness: 0.5,
            color: colors.lines
          })
          y -= 25
        }
        y -= 20
      })
    }
    
    const pdfBytes = await pdfDoc.save()
    
    // Save file
    const outputDir = '/app/public/journals'
    await fs.mkdir(outputDir, { recursive: true })
    
    const fileName = `${randomUUID()}.pdf`
    const filePath = path.join(outputDir, fileName)
    await fs.writeFile(filePath, pdfBytes)
    
    // Save to library
    const libraryCollection = await getCollection('library')
    const documentId = randomUUID()
    
    await libraryCollection.insertOne({
      id: documentId,
      userId: 'default-user',
      type: 'journal',
      category: 'document',
      title: content.title,
      description: `${config.name} with ${pages} pages`,
      filePath: `/journals/${fileName}`,
      fileSize: pdfBytes.length,
      metadata: { journalType, pageCount: pages, designStyle, paperSize },
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    })
    
    // Complete transaction on success

    
    if (transactionId) await completeTransaction(transactionId)

    
    return NextResponse.json({
      success: true,
      title: content.title,
      downloadUrl: `/journals/${fileName}`,
      pageCount: pdfDoc.getPageCount(),
      libraryId: documentId
    })
    
  } catch (error) {
    // Refund credits on error
    if (transactionId && userId) {
      await refundCredits(userId, transactionId, error.message)
    }
    console.error('Journal generation error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to generate journal' },
      { status: 500 }
    )
  }
}
