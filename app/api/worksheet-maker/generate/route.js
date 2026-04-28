import { NextResponse } from 'next/server'
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { getCollection } from '@/lib/mongodb'
import { randomUUID } from 'crypto'
import fs from 'fs/promises'
import path from 'path'
import { enforceRateLimit } from '@/lib/rate-limiter'
import { getUserIdFromRequest, checkCredits, deductCredits, completeTransaction, refundCredits } from '@/lib/credits'

const TOOL_ID = 'worksheet-maker'

const genAI = new GoogleGenerativeAI(process.env.EMERGENT_LLM_KEY)

// Worksheet types
const WORKSHEET_TYPES = {
  'math': { name: 'Math Practice', subjects: ['addition', 'subtraction', 'multiplication', 'division', 'fractions', 'word problems'] },
  'reading': { name: 'Reading Comprehension', subjects: ['vocabulary', 'comprehension', 'grammar', 'spelling'] },
  'writing': { name: 'Writing Practice', subjects: ['creative writing', 'essay prompts', 'sentence structure', 'punctuation'] },
  'science': { name: 'Science Worksheets', subjects: ['biology', 'chemistry', 'physics', 'earth science'] },
  'language': { name: 'Language Learning', subjects: ['vocabulary', 'grammar', 'conversation', 'translation'] },
  'social-studies': { name: 'Social Studies', subjects: ['history', 'geography', 'civics', 'economics'] },
  'critical-thinking': { name: 'Critical Thinking', subjects: ['logic puzzles', 'problem solving', 'analysis', 'reasoning'] }
}

// Generate worksheet content with AI
async function generateWorksheetContent(worksheetType, gradeLevel, topic, questionCount) {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })
    const config = WORKSHEET_TYPES[worksheetType] || WORKSHEET_TYPES['math']
    
    const prompt = `Create an educational worksheet for ${config.name} at grade ${gradeLevel} level.

Topic: ${topic}
Number of questions: ${questionCount}

Generate a complete worksheet with:
1. A clear title
2. Brief instructions
3. ${questionCount} questions appropriate for grade ${gradeLevel}
4. An answer key

For math: Include a mix of easy, medium, and hard problems
For reading: Include a short passage with comprehension questions
For other subjects: Include varied question types (multiple choice, fill-in-blank, short answer)

Format as JSON:
{
  "title": "...",
  "instructions": "...",
  "passage": "...",  // Only for reading comprehension, null otherwise
  "questions": [
    {
      "number": 1,
      "type": "multiple-choice|fill-blank|short-answer|problem",
      "question": "...",
      "options": ["A", "B", "C", "D"],  // For multiple choice only
      "answer": "..."
    }
  ],
  "bonusQuestion": {
    "question": "...",
    "answer": "..."
  }
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
    console.error('AI worksheet generation error:', error)
    return {
      title: `${topic} Worksheet - Grade ${gradeLevel}`,
      instructions: 'Answer all questions to the best of your ability.',
      passage: null,
      questions: Array.from({ length: questionCount }, (_, i) => ({
        number: i + 1,
        type: 'short-answer',
        question: `Question ${i + 1} about ${topic}`,
        options: null,
        answer: 'Answer will vary'
      })),
      bonusQuestion: { question: 'Bonus: Explain what you learned.', answer: 'Answers will vary' }
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

    const { worksheetType, gradeLevel, topic, questionCount, includeAnswerKey } = await request.json()
    
    if (!topic) {
      return NextResponse.json({ success: false, error: 'Topic is required' }, { status: 400 })
    }
    
    const content = await generateWorksheetContent(worksheetType, gradeLevel || '3rd', topic, questionCount || 10)
    
    // Create PDF
    const pdfDoc = await PDFDocument.create()
    const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica)
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
    
    const width = 612
    const height = 792
    const margin = 50
    
    // Worksheet page
    let page = pdfDoc.addPage([width, height])
    let y = height - margin
    
    // Header
    page.drawText('Name: _______________________', { x: margin, y, size: 11, font: regularFont })
    page.drawText('Date: ____________', { x: width - margin - 120, y, size: 11, font: regularFont })
    y -= 40
    
    // Title
    const titleWidth = boldFont.widthOfTextAtSize(content.title, 18)
    page.drawText(content.title, {
      x: (width - titleWidth) / 2,
      y,
      size: 18,
      font: boldFont,
      color: rgb(0.1, 0.1, 0.3)
    })
    y -= 30
    
    // Instructions
    page.drawText(`Instructions: ${content.instructions}`, {
      x: margin,
      y,
      size: 10,
      font: regularFont,
      color: rgb(0.3, 0.3, 0.3)
    })
    y -= 30
    
    // Passage (if reading comprehension)
    if (content.passage) {
      page.drawLine({
        start: { x: margin, y: y + 10 },
        end: { x: width - margin, y: y + 10 },
        thickness: 1,
        color: rgb(0.8, 0.8, 0.8)
      })
      
      const passageWords = content.passage.split(' ')
      let line = ''
      for (const word of passageWords) {
        const testLine = line ? `${line} ${word}` : word
        if (regularFont.widthOfTextAtSize(testLine, 11) > width - margin * 2) {
          page.drawText(line, { x: margin, y, size: 11, font: regularFont })
          line = word
          y -= 16
          if (y < margin + 100) {
            page = pdfDoc.addPage([width, height])
            y = height - margin
          }
        } else {
          line = testLine
        }
      }
      if (line) {
        page.drawText(line, { x: margin, y, size: 11, font: regularFont })
        y -= 16
      }
      
      y -= 20
      page.drawLine({
        start: { x: margin, y: y + 10 },
        end: { x: width - margin, y: y + 10 },
        thickness: 1,
        color: rgb(0.8, 0.8, 0.8)
      })
      y -= 20
    }
    
    // Questions
    for (const q of content.questions) {
      if (y < margin + 120) {
        page = pdfDoc.addPage([width, height])
        y = height - margin
      }
      
      // Question text
      page.drawText(`${q.number}. ${q.question}`, {
        x: margin,
        y,
        size: 11,
        font: boldFont
      })
      y -= 20
      
      // Options for multiple choice
      if (q.type === 'multiple-choice' && q.options) {
        q.options.forEach((opt, idx) => {
          const letter = String.fromCharCode(65 + idx)
          page.drawText(`    ${letter}. ${opt}`, { x: margin + 10, y, size: 10, font: regularFont })
          y -= 16
        })
      }
      
      // Answer space
      if (q.type === 'short-answer' || q.type === 'problem') {
        for (let l = 0; l < 2; l++) {
          page.drawLine({
            start: { x: margin + 20, y },
            end: { x: width - margin, y },
            thickness: 0.5,
            color: rgb(0.8, 0.8, 0.8)
          })
          y -= 22
        }
      }
      
      y -= 15
    }
    
    // Bonus question
    if (content.bonusQuestion) {
      if (y < margin + 100) {
        page = pdfDoc.addPage([width, height])
        y = height - margin
      }
      
      page.drawText('* BONUS:', { x: margin, y, size: 12, font: boldFont, color: rgb(0.6, 0.4, 0) })
      y -= 18
      page.drawText(content.bonusQuestion.question, { x: margin + 20, y, size: 11, font: regularFont })
      y -= 25
      page.drawLine({ start: { x: margin + 20, y }, end: { x: width - margin, y }, thickness: 0.5, color: rgb(0.8, 0.8, 0.8) })
    }
    
    // Answer Key page
    if (includeAnswerKey !== false) {
      page = pdfDoc.addPage([width, height])
      y = height - margin
      
      page.drawText('ANSWER KEY', {
        x: (width - boldFont.widthOfTextAtSize('ANSWER KEY', 20)) / 2,
        y,
        size: 20,
        font: boldFont,
        color: rgb(0.5, 0, 0)
      })
      y -= 40
      
      page.drawText(content.title, { x: margin, y, size: 14, font: boldFont })
      y -= 30
      
      for (const q of content.questions) {
        if (y < margin + 50) {
          page = pdfDoc.addPage([width, height])
          y = height - margin
        }
        page.drawText(`${q.number}. ${q.answer}`, { x: margin, y, size: 11, font: regularFont })
        y -= 20
      }
      
      if (content.bonusQuestion) {
        y -= 10
        page.drawText(`Bonus: ${content.bonusQuestion.answer}`, { x: margin, y, size: 11, font: regularFont, color: rgb(0.6, 0.4, 0) })
      }
    }
    
    const pdfBytes = await pdfDoc.save()
    
    // Save file
    const outputDir = '/app/public/worksheets'
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
      type: 'worksheet',
      category: 'document',
      title: content.title,
      description: `${worksheetType} worksheet for grade ${gradeLevel}`,
      filePath: `/worksheets/${fileName}`,
      fileSize: pdfBytes.length,
      metadata: { worksheetType, gradeLevel, topic, questionCount },
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    })
    
    // Complete transaction on success

    
    if (transactionId) await completeTransaction(transactionId)

    
    return NextResponse.json({
      success: true,
      title: content.title,
      downloadUrl: `/worksheets/${fileName}`,
      pageCount: pdfDoc.getPageCount(),
      questionCount: content.questions.length,
      libraryId: documentId
    })
    
  } catch (error) {
    // Refund credits on error
    if (transactionId && userId) {
      await refundCredits(userId, transactionId, error.message)
    }
    console.error('Worksheet generation error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to generate worksheet' },
      { status: 500 }
    )
  }
}
